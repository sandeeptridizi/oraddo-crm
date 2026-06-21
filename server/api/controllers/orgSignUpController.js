const orgSignServices = require('../services/orgSignUpServices');
const organizationService = require('../services/OrganizationService');
const authService = require('../services/authService');
const premiumPlanService = require('../services/PlansServices');
const jwt = require('jsonwebtoken');
require('dotenv').config();


const signUpController = async(req,res)=>{
    const data = req.body;
    try {
        const signupRes = await orgSignServices.creatieSignUp(data);
        return res.status(201).json(signupRes);
    } catch (error) {
        console.log(error,'error in controller');
        res.status(500).json({ error: error.message });
    }
};

// Public step 1: write the OrgSignUp row (or reuse an existing one with the
// same email) and mint a short-lived JWT that the frontend carries into the
// pricing step. The token's purpose field blocks accidental reuse on auth
// endpoints.
const signupOrgPending = async (req, res) => {
    const { fullName, phoneNumber, email, companyName, password } = req.body || {};
    try {
        if (!fullName || !phoneNumber || !email || !password) {
            return res.status(400).json({ status: false, message: "fullName, phoneNumber, email and password are required" });
        }

        const signupRes = await orgSignServices.creatieSignUp({
            fullName,
            phoneNumber,
            email,
            companyName,
            password,
        });

        const signupToken = jwt.sign(
            { signupId: signupRes.id, email: signupRes.email, purpose: "signup-pending" },
            process.env.JWT_SECRET,
            { expiresIn: "30m" }
        );

        return res.status(201).json({
            status: true,
            signupToken,
            signupId: signupRes.id,
            email: signupRes.email,
        });
    } catch (error) {
        console.log(error, "error in signupOrgPending");
        return res.status(500).json({ status: false, message: error.message });
    }
};

// Public step 2: verify the pending JWT, build the operational Organization +
// Management admin + invoice, then call unifiedSignIn to mint the real session
// token. Returns the same shape /api/auth/unified-login returns so the frontend
// can treat this as a normal login.
const startTrial = async (req, res) => {
    const { signupToken, planId } = req.body || {};
    try {
        if (!signupToken || !planId) {
            return res.status(400).json({ status: false, message: "signupToken and planId are required" });
        }

        let decoded;
        try {
            decoded = jwt.verify(signupToken, process.env.JWT_SECRET);
        } catch (e) {
            return res.status(401).json({ status: false, message: "Signup session expired. Please sign up again." });
        }
        if (decoded.purpose !== "signup-pending") {
            return res.status(401).json({ status: false, message: "Invalid signup token" });
        }

        const signup = await orgSignServices.getSignUpDataById(decoded.signupId);
        if (!signup) {
            return res.status(404).json({ status: false, message: "Signup record not found" });
        }
        if (signup.email !== decoded.email) {
            return res.status(401).json({ status: false, message: "Signup token email mismatch" });
        }

        // Build the trial Organization row using the original plaintext password
        // (we need to bcrypt it again here — the OrgSignUp copy was hashed at
        // signup time and is not reversible).
        // We re-fetch the password from the original signup request via the
        // pending body which the frontend must pass along too. To keep the
        // contract simple we accept an optional `password` field on the request
        // (frontend already has it from the form). If absent, fall back to the
        // OrgSignUp password hash and use that (still allows unifiedSignIn via
        // its existing OrgSignUp branch).
        const providedPassword = req.body && req.body.password;
        const trialData = {
            fullName: signup.fullName,
            email: signup.email,
            password: providedPassword || signup.password,
            phoneNumber: signup.phoneNumber,
            companyName: signup.companyName,
            city: null,
            planId: parseInt(planId, 10),
            signupId: signup.id,
        };

        await organizationService.createTrialOrganization(trialData);

        // Now mint the real session token. unifiedSignIn will resolve OrgSignUp
        // -> Organization by email and scope the JWT to the new org id.
        const session = await authService.unifiedSignIn(signup.email, providedPassword || signup.password);

        return res.status(200).json({
            status: true,
            message: "Trial started",
            token: session.token,
            role: session.role,
            user: session.user,
        });
    } catch (error) {
        console.log(error, "error in startTrial");
        return res.status(500).json({ status: false, message: error.message });
    }
};

// Public plan listing used by the /pricing page. Projects only fields safe
// for unauthenticated consumption.
const getPublicPlans = async (req, res) => {
    try {
        const plans = await premiumPlanService.getAllPlans();
        const rows = Array.isArray(plans) ? plans : (plans && Array.isArray(plans.data) ? plans.data : []);
        const projected = rows
            .filter((p) => p && p.isActive !== false)
            .map((p) => ({
                id: p.id,
                planName: p.planName,
                price: p.price,
                duration: p.duration,
                employeeLimit: p.employeeLimit,
            }));
        return res.status(200).json({ status: true, data: projected });
    } catch (error) {
        console.log(error, "error in getPublicPlans");
        return res.status(500).json({ status: false, message: error.message });
    }
};

const signupdataGetbyId=async(req,res)=>{
    const id = req.params.id;
    try{
        const signupRes = await orgSignServices.getSignUpDataById(id);
        return res.status(201).json(signupRes);
    }catch(error){
        console.log(error,'error in controller');
        res.status(500).json({ error: error.message });
    }
}

const updateOrgData = async(req,res)=>{
    const id = req.params.id;
    const data = req.body;
    try{
        const signupRes = await orgSignServices.updateOrgData(id,data);
        return res.status(200).json(signupRes);
    }
    catch(error){
        console.log(error,'error in controller');
        res.status(500).json({ error: error.message });
    }
}

const signInController = async(req,res)=>{
    const data = req.body;
    try {
        const signInRes = await orgSignServices.orgSignIn(data);
        return res.status(200).json({
            status: true,
            message: "Login successfully",
            data: signInRes
        });
    } catch (error) {
        return res.status(400).json({
            status: false,
            message: error.message || "Login failed"
        });
    }
}

const getregisterData = async(req,res)=>{
    console.log(req,"kjjkjb");
    
  try {
    const Clients = await orgSignServices.getSignUpData();
    res.status(200).json({ Clients });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }

}


module.exports= {
    signUpController,
    signInController,
    signupdataGetbyId,
    updateOrgData,
    getregisterData,
    signupOrgPending,
    startTrial,
    getPublicPlans
}

