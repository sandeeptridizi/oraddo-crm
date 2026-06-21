const { newPayment, checkStatus, signupPayment, signupPaymentCallback } = require('../../api/controllers/phonepaycontroller');
const express = require('express');
const router = express();

// More-specific routes must be registered before wildcard ones.

// New: payment during initial org signup (pricing page "Buy Now")
router.post('/payment/signup', signupPayment);
router.post('/status/signup/:transactionId', signupPaymentCallback);

// Existing: plan renewal for established orgs
router.post('/payment', newPayment);
router.post('/status/:transactionId/:planId/:organizationId', checkStatus);
router.post('/status/:transactionId', checkStatus);

module.exports = router;
