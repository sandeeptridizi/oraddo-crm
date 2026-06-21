const express = require("express");
const route = express.Router();

const orgController = require('../controllers/orgSignUpController');
const { OrgMiddleware } = require("../middleware/organizationMiddleware");



route.post('/orgRegister',orgController.signUpController);
route.get('/orgRegister/:id',orgController.signupdataGetbyId);
route.post('/orgLogin',orgController.signInController);
route.put('/orgRegister/:id',orgController.updateOrgData);
route.get('/orgRegister',orgController.getregisterData)

// Public signup funnel: OrgSignUp + plan choice + trial org creation
route.post('/signup-org-pending', orgController.signupOrgPending);
route.post('/signup/start-trial', orgController.startTrial);
route.get('/plans/public', orgController.getPublicPlans);

module.exports = route