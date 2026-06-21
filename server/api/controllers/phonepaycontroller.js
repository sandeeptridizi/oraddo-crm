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
// ---------------------------------------------------------------------------
const SALT_KEY       = process.env.PHONEPE_SALT_KEY;
const MERCHANT_ID    = process.env.PHONEPE_MERCHANT_ID;
const SALT_INDEX     = parseInt(process.env.PHONEPE_SALT_INDEX || "1", 10);
const BASE_URL       = process.env.PHONEPE_BASE_URL;          // includes /apis/hermes or /apis/pg-sandbox
const CALLBACK_BASE  = process.env.PHONEPE_CALLBACK_BASE_URL; // backend base URL (public)
const FRONTEND_URL   = process.env.PHONEPE_FRONTEND_URL;      // frontend origin

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function buildPayChecksum(base64Payload) {
  const str = base64Payload + "/pg/v1/pay" + SALT_KEY;
  return crypto.createHash("sha256").update(str).digest("hex") + "###" + SALT_INDEX;
}

function buildStatusChecksum(merchantTransactionId) {
  const str = `/pg/v1/status/${MERCHANT_ID}/${merchantTransactionId}` + SALT_KEY;
  return crypto.createHash("sha256").update(str).digest("hex") + "###" + SALT_INDEX;
}

async function callPhonePeStatus(merchantTransactionId) {
  const checksum = buildStatusChecksum(merchantTransactionId);
  const response = await axios.get(
    `${BASE_URL}/pg/v1/status/${MERCHANT_ID}/${merchantTransactionId}`,
    {
      headers: {
        accept: "application/json",
        "Content-Type": "application/json",
        "X-VERIFY": checksum,
        "X-MERCHANT-ID": MERCHANT_ID,
      },
    }
  );
  return response.data;
}

// ---------------------------------------------------------------------------
// Existing flow: initiate payment for plan renewal (existing org)
// ---------------------------------------------------------------------------
const newPayment = async (req, res) => {
  try {
    const merchantTransactionId = req.body.transactionId;
    const planId = req?.body?.planId?.id;
    const organizationId = req?.body?.organizationId;

    const data = {
      merchantId: MERCHANT_ID,
      merchantTransactionId,
      merchantUserId: req.body.MUID,
      name: req.body.name,
      amount: req.body.amount * 100,
      redirectUrl: planId
        ? `${CALLBACK_BASE}/api/status/${merchantTransactionId}/${planId}/${organizationId}`
        : `${CALLBACK_BASE}/api/status/${merchantTransactionId}`,
      redirectMode: "POST",
      mobileNumber: req.body.number,
      paymentInstrument: { type: "PAY_PAGE" },
    };

    const payloadMain = Buffer.from(JSON.stringify(data)).toString("base64");
    const checksum = buildPayChecksum(payloadMain);

    const response = await axios.post(
      `${BASE_URL}/pg/v1/pay`,
      { request: payloadMain },
      {
        headers: {
          accept: "application/json",
          "Content-Type": "application/json",
          "X-VERIFY": checksum,
        },
      }
    );

    return res.status(200).json({
      route: response.data.data.instrumentResponse.redirectInfo.url,
    });
  } catch (error) {
    console.error("newPayment error:", error.response?.data || error.message);
    res.status(500).json({ message: error.message, success: false });
  }
};

// ---------------------------------------------------------------------------
// Existing flow: status callback for plan renewal
// ---------------------------------------------------------------------------
const checkStatus = async (req, res) => {
  const { transactionId, planId, organizationId } = req.params;

  if (!transactionId) {
    return res.status(400).json({ success: false, message: "Missing transactionId" });
  }

  try {
    const result = await callPhonePeStatus(transactionId);

    if (result.success) {
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

  const merchantTransactionId = `TXNID-${Date.now()}-${crypto.randomBytes(4).toString("hex")}`;

  try {
    // Persist the pending payment so the callback can complete org creation
    await PendingPayment.create({
      transactionId: merchantTransactionId,
      signupToken,
      planId: parseInt(planId, 10),
      billingCycle: billingCycle || "quarterly",
      amount: parseInt(amount, 10),
      status: "pending",
    });

    const data = {
      merchantId: MERCHANT_ID,
      merchantTransactionId,
      merchantUserId: `USR-${decoded.signupId}`,
      name: name || decoded.email,
      amount: parseInt(amount, 10) * 100, // PhonePe expects paise
      redirectUrl: `${CALLBACK_BASE}/api/status/signup/${merchantTransactionId}`,
      redirectMode: "POST",
      mobileNumber: phone || "9999999999",
      paymentInstrument: { type: "PAY_PAGE" },
    };

    const payloadMain = Buffer.from(JSON.stringify(data)).toString("base64");
    const checksum = buildPayChecksum(payloadMain);

    const response = await axios.post(
      `${BASE_URL}/pg/v1/pay`,
      { request: payloadMain },
      {
        headers: {
          accept: "application/json",
          "Content-Type": "application/json",
          "X-VERIFY": checksum,
        },
      }
    );

    const redirectUrl = response.data.data.instrumentResponse.redirectInfo.url;
    return res.status(200).json({ success: true, redirectUrl });
  } catch (error) {
    console.error("signupPayment error:", error.response?.data || error.message);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ---------------------------------------------------------------------------
// NEW: PhonePe callback after new-org signup payment
// ---------------------------------------------------------------------------
const signupPaymentCallback = async (req, res) => {
  const { transactionId } = req.params;

  const pending = await PendingPayment.findOne({ where: { transactionId } });
  if (!pending) {
    return res.redirect(`${FRONTEND_URL}/payment-complete?status=failure&reason=not_found`);
  }
  // Idempotency: already processed
  if (pending.status !== "pending") {
    if (pending.status === "success") {
      return res.redirect(`${FRONTEND_URL}/payment-complete?status=failure&reason=already_processed`);
    }
    return res.redirect(`${FRONTEND_URL}/payment-complete?status=failure`);
  }

  try {
    const result = await callPhonePeStatus(transactionId);

    if (!result.success) {
      await pending.update({ status: "failed" });
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

    // Mint a session token — use the hashed password path in unifiedSignIn
    const session = await authService.unifiedSignIn(signup.email, signup.password);

    const tokenParam = encodeURIComponent(session.token);
    const userParam = encodeURIComponent(JSON.stringify(session.user || {}));
    return res.redirect(
      `${FRONTEND_URL}/payment-complete?status=success&token=${tokenParam}&user=${userParam}`
    );
  } catch (error) {
    console.error("signupPaymentCallback error:", error.message);
    await pending.update({ status: "failed" }).catch(() => {});
    return res.redirect(`${FRONTEND_URL}/payment-complete?status=failure`);
  }
};

module.exports = {
  newPayment,
  checkStatus,
  signupPayment,
  signupPaymentCallback,
};
