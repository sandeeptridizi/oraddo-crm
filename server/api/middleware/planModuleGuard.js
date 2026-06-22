const Organization = require("../models/OrganizationModule");
const PremiumPlan = require("../models/premiumPlans");
const Dep_Modules = require("../models/Modules");

// Middleware factory — pass the Dep_Modules.name value that the current route requires.
// The Plan_modules join table maps each PremiumPlan to the Dep_Modules rows it includes.
// Must run after authMiddleware so req.user (Emp_onboarding) is already populated.
const planModuleGuard = (requiredModule) => async (req, res, next) => {
    try {
        const orgId = req.user?.orgnaizationId; // typo is intentional — matches DB column
        if (!orgId) {
            return res.status(403).json({ status: false, message: "Organization not found for this user." });
        }

        const org = await Organization.findByPk(orgId, {
            include: [{
                model: PremiumPlan,
                as: "organization_plan",
                include: [{ model: Dep_Modules }],
            }],
        });

        if (!org?.organization_plan) {
            return res.status(403).json({ status: false, message: "No active plan found for your organization." });
        }

        // Sequelize exposes the belongsToMany result under the model name 'modules'
        const moduleNames = (org.organization_plan.modules || []).map((m) => m.name);

        if (!moduleNames.includes(requiredModule)) {
            return res.status(403).json({
                status: false,
                message: `Your current plan does not include access to ${requiredModule}. Please upgrade your subscription.`,
            });
        }

        next();
    } catch (err) {
        console.error("planModuleGuard error:", err);
        next(err);
    }
};

module.exports = planModuleGuard;
