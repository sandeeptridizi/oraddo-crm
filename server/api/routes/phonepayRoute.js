const { newPayment, checkStatus, signupPayment, signupPaymentCallback } = require('../../api/controllers/phonepaycontroller');
const express = require('express');
const router = express();

// More-specific routes must be registered before wildcard ones.
//
// PhonePe Checkout v2 redirects the user's BROWSER to merchantUrls.redirectUrl
// via a plain GET navigation (the old redirectMode:"POST" no longer applies).
// We register both GET and POST on the status/callback routes so the redirect
// resolves regardless of method.

// Payment initiation is called by our own frontend via fetch (POST).
// New: payment during initial org signup (pricing page "Buy Now")
router.post('/payment/signup', signupPayment);
router.all('/status/signup/:transactionId', signupPaymentCallback);

// Existing: plan renewal for established orgs
router.post('/payment', newPayment);
// More-specific (with billingCycle + amount) must be registered before the shorter variant.
router.all('/status/:transactionId/:planId/:organizationId/:billingCycle/:amount', checkStatus);
router.all('/status/:transactionId/:planId/:organizationId', checkStatus);
router.all('/status/:transactionId', checkStatus);

module.exports = router;
