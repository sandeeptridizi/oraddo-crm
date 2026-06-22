const crypto = require("crypto");
const axios = require("axios");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const PendingPayment = require("../models/PendingPayment");
const orgSignUpServices = require("../services/orgSignUpServices");
const organizationService = require("../services/OrganizationService");
const authService = require("../services/authService");

// ---------------------------------------------------------------------------
// Credentials / config — all sourced from env vars (no hardcoding)
//
// This integrates PhonePe's Standard Checkout v2 (OAuth) API:
//   1. POST /v1/oauth/token        -> access_token
//   2. POST /checkout/v2/pay       -> hosted checkout redirectUrl
//   3. (user pays, PhonePe redirects to our merchantUrls.redirectUrl)
//   4. GET  /checkout/v2/order/{merchantOrderId}/status -> COMPLETED | FAILED | PENDING
// ---------------------------------------------------------------------------
const MERCHANT_ID     = process.env.PHONEPE_MERCHANT_ID;     // == OAuth client_id
const CLIENT_SECRET   = process.env.PHONEPE_SALT_KEY;        // == OAuth client_secret
const CLIENT_VERSION  = process.env.PHONEPE_CLIENT_VERSION || "1";
const BASE_URL        = process.env.PHONEPE_BASE_URL;        // e.g. https://api-preprod.phonepe.com/apis/pg-sandbox
const CALLBACK_BASE   = process.env.PHONEPE_CALLBACK_BASE_URL; // backend base URL (public)
const FRONTEND_URL    = process.env.PHONEPE_FRONTEND_URL;      // frontend origin

// ---------------------------------------------------------------------------
// OAuth token: fetch once, cache in memory, refresh shortly before expiry.
// `expires_at` from PhonePe is a unix timestamp in SECONDS.
// ---------------------------------------------------------------------------
let _tokenCache = { accessToken: null, expiresAt: 0 };

async function getAccessToken() {
  const nowSec = Math.floor(Date.now() / 1000);
  // Reuse the cached token until 60s before it expires.
  if (_tokenCache.accessToken && _tokenCache.expiresAt - 60 > nowSec) {
    return _tokenCache.accessToken;
  }

  const body = new URLSearchParams({
    client_id: MERCHANT_ID,
    client_version: CLIENT_VERSION,
    client_secret: CLIENT_SECRET,
    grant_type: "client_credentials",
  });

  const response = await axios.post(`${BASE_URL}/v1/oauth/token`, body.toString(), {
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      accept: "application/json",
    },
  });

  const { access_token, expires_at } = response.data || {};
  if (!access_token) {
    throw new Error("PhonePe OAuth: no access_token in response");
  }

  _tokenCache = {
    accessToken: access_token,
    // Fall back to now+expires_in if expires_at is missing.
    expiresAt: expires_at || nowSec + (response.data.expires_in || 3600),
  };
  return access_token;
}

// ---------------------------------------------------------------------------
// Create a hosted checkout order and return PhonePe's redirectUrl.
// ---------------------------------------------------------------------------
async function createCheckoutOrder({ merchantOrderId, amountInPaise, redirectUrl, metaInfo, message }) {
  const accessToken = await getAccessToken();

  const payload = {
    merchantOrderId,
    amount: amountInPaise,
    expireAfter: 1200, // seconds the payment link stays valid
    metaInfo: metaInfo || {},
    paymentFlow: {
      type: "PG_CHECKOUT",
      message: message || "Oraddo subscription payment",
      merchantUrls: { redirectUrl },
    },
  };

  const response = await axios.post(`${BASE_URL}/checkout/v2/pay`, payload, {
    headers: {
      "Content-Type": "application/json",
      accept: "application/json",
      Authorization: `O-Bearer ${accessToken}`,
    },
  });

  // { orderId, state, expireAt, redirectUrl }
  return response.data;
}

// ---------------------------------------------------------------------------
// Look up the authoritative order state. Returns the full status object.
// Caller checks `.state === "COMPLETED"`.
// ---------------------------------------------------------------------------
async function getOrderStatus(merchantOrderId) {
  const accessToken = await getAccessToken();
  const response = await axios.get(
    `${BASE_URL}/checkout/v2/order/${merchantOrderId}/status`,
    {
      headers: {
        accept: "application/json",
        Authorization: `O-Bearer ${accessToken}`,
      },
    }
  );
  return response.data; // { orderId, state, amount, ... }
}

// ---------------------------------------------------------------------------
// Existing flow: initiate payment for plan renewal (existing org)
// ---------------------------------------------------------------------------
const newPayment = async (req, res) => {
  try {
    const merchantOrderId = req.body.transactionId;
    const planId = req?.body?.planId?.id;
    const organizationId = req?.body?.organizationId;

    // The new redirectUrl carries no POST body from PhonePe, so we encode the
    // identifiers we need into the callback path itself.
    const redirectUrl = planId
      ? `${CALLBACK_BASE}/api/status/${merchantOrderId}/${planId}/${organizationId}`
      : `${CALLBACK_BASE}/api/status/${merchantOrderId}`;

    const order = await createCheckoutOrder({
      merchantOrderId,
      amountInPaise: Math.round(Number(req.body.amount) * 100),
      redirectUrl,
      message: "Oraddo plan renewal",
      metaInfo: {
        udf1: req.body.name || "",
        udf2: req.body.number || "",
        udf3: organizationId ? String(organizationId) : "",
        udf4: planId ? String(planId) : "",
      },
    });

    return res.status(200).json({ route: order.redirectUrl });
  } catch (error) {
    console.error("newPayment error:", error.response?.data || error.message);
    res.status(500).json({ message: error.message, success: false });
  }
};

// ---------------------------------------------------------------------------
// Existing flow: status callback for plan renewal
// ---------------------------------------------------------------------------
const checkStatus = async (req, res) => {
  const { transactionId, planId, organizationId } = req.params; // transactionId == merchantOrderId

  if (!transactionId) {
    return res.status(400).json({ success: false, message: "Missing transactionId" });
  }

  try {
    const result = await getOrderStatus(transactionId);

    if (result.state === "COMPLETED") {
      if (planId && organizationId) {
        await axios.post(`${CALLBACK_BASE}/api/organizationInvoice`, {
          organizationId,
          planId,
        });
        return res.redirect(`${FRONTEND_URL}/successrenwal`);
      }
      return res.redirect(`${FRONTEND_URL}/success`);
    } else {
      return res.redirect(`${FRONTEND_URL}/failure`);
    }
  } catch (error) {
    console.error("checkStatus error:", error.response?.data || error.message);
    return res.status(500).json({ success: false, message: "Error checking payment status" });
  }
};

// ---------------------------------------------------------------------------
// NEW: Initiate PhonePe payment for a new org signup (pricing page "Buy Now")
// ---------------------------------------------------------------------------
const signupPayment = async (req, res) => {
  const { signupToken, planId, amount, billingCycle, name, phone } = req.body || {};

  if (!signupToken || !planId || !amount) {
    return res.status(400).json({ success: false, message: "signupToken, planId and amount are required" });
  }

  // Validate the signupToken
  let decoded;
  try {
    decoded = jwt.verify(signupToken, process.env.JWT_SECRET);
  } catch (e) {
    return res.status(401).json({ success: false, message: "Signup session expired. Please sign up again." });
  }
  if (decoded.purpose !== "signup-pending") {
    return res.status(401).json({ success: false, message: "Invalid signup token" });
  }

  const merchantOrderId = `TXNID-${Date.now()}-${crypto.randomBytes(4).toString("hex")}`;

  try {
    // Persist the pending payment so the callback can complete org creation
    await PendingPayment.create({
      transactionId: merchantOrderId,
      signupToken,
      planId: parseInt(planId, 10),
      billingCycle: billingCycle || "quarterly",
      amount: parseInt(amount, 10),
      status: "pending",
    });

    const order = await createCheckoutOrder({
      merchantOrderId,
      amountInPaise: parseInt(amount, 10) * 100, // PhonePe expects paise
      redirectUrl: `${CALLBACK_BASE}/api/status/signup/${merchantOrderId}`,
      message: "Oraddo subscription signup",
      metaInfo: {
        udf1: name || decoded.email || "",
        udf2: phone || "",
        udf3: String(planId),
        udf4: billingCycle || "quarterly",
        udf5: String(decoded.signupId || ""),
      },
    });

    return res.status(200).json({ success: true, redirectUrl: order.redirectUrl });
  } catch (error) {
    console.error("signupPayment error:", error.response?.data || error.message);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ---------------------------------------------------------------------------
// NEW: PhonePe callback after new-org signup payment
// ---------------------------------------------------------------------------
const signupPaymentCallback = async (req, res) => {
  const { transactionId } = req.params; // == merchantOrderId

  const pending = await PendingPayment.findOne({ where: { transactionId } });
  if (!pending) {
    return res.redirect(`${FRONTEND_URL}/payment-complete?status=failure&reason=not_found`);
  }
  // Idempotency: only "success" is terminal (org already created). A "failed"
  // row is NOT terminal — PhonePe lets a user retry the same order, so a prior
  // failed attempt can later become COMPLETED. We must re-check the live order
  // status rather than trusting the stale local flag.
  if (pending.status === "success") {
    return res.redirect(`${FRONTEND_URL}/payment-complete?status=failure&reason=already_processed`);
  }

  try {
    const result = await getOrderStatus(transactionId);

    if (result.state !== "COMPLETED") {
      // Mark failed only if PhonePe says it's truly terminal; PENDING stays pending
      // so a later successful retry can still complete.
      if (result.state === "FAILED") {
        await pending.update({ status: "failed" });
      }
      return res.redirect(`${FRONTEND_URL}/payment-complete?status=failure`);
    }

    // Payment succeeded — complete org creation
    await pending.update({ status: "success" });

    let decoded;
    try {
      decoded = jwt.verify(pending.signupToken, process.env.JWT_SECRET);
    } catch (e) {
      // Token expired but payment succeeded — still create the org using signupId from the record
      decoded = jwt.decode(pending.signupToken);
    }

    const signup = await orgSignUpServices.getSignUpDataById(decoded.signupId);
    if (!signup) {
      return res.redirect(`${FRONTEND_URL}/payment-complete?status=failure&reason=signup_not_found`);
    }

    // Org creation is idempotent: a duplicate (e.g. a prior charged attempt, or
    // the start-trial flow) must NOT show the user a failure page — the payment
    // is confirmed COMPLETED, so we proceed to sign them in regardless.
    try {
      await organizationService.createTrialOrganization({
        fullName: signup.fullName,
        email: signup.email,
        password: signup.password, // already bcrypt-hashed; createTrialOrganization checks before re-hashing
        phoneNumber: signup.phoneNumber,
        companyName: signup.companyName,
        city: null,
        planId: pending.planId,
        signupId: signup.id,
      });
    } catch (orgErr) {
      const isDuplicate = orgErr?.name === "SequelizeUniqueConstraintError";
      if (!isDuplicate) {
        // A non-duplicate failure after a confirmed payment is a real problem,
        // but the money was taken — surface a dedicated reason so support can
        // reconcile, and do NOT flip the payment back to "failed".
        console.error("signupPaymentCallback: org creation failed AFTER successful payment:", orgErr.message);
        return res.redirect(`${FRONTEND_URL}/payment-complete?status=failure&reason=org_create_failed`);
      }
      console.warn("signupPaymentCallback: org already exists, signing in existing org:", signup.email);
    }

    // Mint a session token directly. The payment is already verified, and we
    // only hold the bcrypt HASH (not the plaintext), so unifiedSignIn's
    // bcrypt.compare would always fail ("Invalid email/username or password").
    const session = await authService.createSessionForOrg(signup.email);

    const tokenParam = encodeURIComponent(session.token);
    const userParam = encodeURIComponent(JSON.stringify(session.user || {}));
    return res.redirect(
      `${FRONTEND_URL}/payment-complete?status=success&token=${tokenParam}&user=${userParam}`
    );
  } catch (error) {
    console.error("signupPaymentCallback error:", error.message);
    // Only flip to "failed" if we never confirmed COMPLETED. Past the status
    // check the payment is real; never overwrite a success-side throw as failed.
    if (pending.status === "pending") {
      await pending.update({ status: "failed" }).catch(() => {});
    }
    return res.redirect(`${FRONTEND_URL}/payment-complete?status=failure`);
  }
};

module.exports = {
  newPayment,
  checkStatus,
  signupPayment,
  signupPaymentCallback,
};
