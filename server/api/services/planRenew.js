const Organization = require('../models/OrganizationModule');
const PremiumPlans = require('../models/premiumPlans');

// const renewPlan = async (organizationId,newPlanId) => {


//   try {
 
//     const organization = await Organization.findByPk(organizationId);
//     if (!organization) {
//       return { message: 'Organization not found' };
//     }


//     const newPlan = await PremiumPlans.findByPk(newPlanId);
//     if (!newPlan) {
//       return { message: 'Plan not found' };
//     }

//     let newPlanStartDate = organization.planExpiryDate; 
//     if (!newPlanStartDate || new Date(newPlanStartDate) < new Date()) {
//       newPlanStartDate = new Date();
//     } else {
//       newPlanStartDate = new Date(newPlanStartDate);
//     }

//     const durationParts = newPlan.duration.split(' ');
//     if (durationParts.length !== 2) {
//       return { message: 'Invalid plan duration format' };
//     }

//     const value = parseInt(durationParts[0], 10); 
//     const unit = durationParts[1].toLowerCase();

//     if (isNaN(value) || value <= 0) {
//       return { message: 'Invalid plan duration value' };
//     }

//     let newExpiryDate = new Date(newPlanStartDate);
//     switch (unit) {
//       case 'month':
//       case 'months':
//         newExpiryDate.setMonth(newExpiryDate.getMonth() + value);
//         break;
//       case 'year':
//       case 'years':
//         newExpiryDate.setFullYear(newExpiryDate.getFullYear() + value);
//         break;
//       case 'day':
//       case 'days':
//         newExpiryDate.setDate(newExpiryDate.getDate() + value);
//         break;
//       default:
//         return { message: 'Invalid plan duration unit' };
//     }

//     organization.planId = newPlanId;
//     organization.planStartDate = newPlanStartDate;
//     organization.planExpiryDate = newExpiryDate;
//     await organization.save();

//     return {
//       message: 'Plan renewed successfully',
//       organization,
//     };
//   } catch (error) {
//     console.error('Error renewing plan:', error);
//     return { message: 'Error renewing the plan', error: error.message };
//   }
// };

const renewPlan = async (organizationId, newPlanId) => {
  try {
    const organization = await Organization.findByPk(organizationId);
    if (!organization) {
      return { message: 'Organization not found' };
    }

    const newPlan = await PremiumPlans.findByPk(newPlanId);
    if (!newPlan) {
      return { message: 'Plan not found' };
    }

    // Start the new plan from the expiry date or today if no expiry date exists
    let newPlanStartDate = organization.planExpiryDate;
    if (!newPlanStartDate || new Date(newPlanStartDate) < new Date()) {
      // If plan expiry is in the past or doesn't exist, start today
      newPlanStartDate = new Date();
    } else {
      // Start from the expiry date
      newPlanStartDate = new Date(newPlanStartDate);
    }

    const durationParts = newPlan.duration.split(' ');
    if (durationParts.length !== 2) {
      return { message: 'Invalid plan duration format' };
    }

    const value = parseInt(durationParts[0], 10);
    const unit = durationParts[1].toLowerCase();

    if (isNaN(value) || value <= 0) {
      return { message: 'Invalid plan duration value' };
    }

    // Calculate the new expiry date based on the plan duration
    let newExpiryDate = new Date(newPlanStartDate);
    switch (unit) {
      case 'month':
      case 'months':
        newExpiryDate.setMonth(newExpiryDate.getMonth() + value);
        break;
      case 'year':
      case 'years':
        newExpiryDate.setFullYear(newExpiryDate.getFullYear() + value);
        break;
      case 'day':
      case 'days':
        newExpiryDate.setDate(newExpiryDate.getDate() + value);
        break;
      default:
        return { message: 'Invalid plan duration unit' };
    }

    // Add a one-week grace period AFTER the new expiry date
    const newGracePeriodEnd = new Date(newExpiryDate);
    newGracePeriodEnd.setDate(newGracePeriodEnd.getDate() + 7);

    // Update the organization's plan details and clear any lock
    organization.planId = newPlanId;
    organization.planStartDate = newPlanStartDate;
    organization.planExpiryDate = newExpiryDate;
    organization.planGracePeriodEnd = newGracePeriodEnd;
    organization.isLocked = false;
    await organization.save();

    return {
      message: 'Plan renewed successfully',
      organization,
    };
  } catch (error) {
    console.error('Error renewing plan:', error);
    return { message: 'Error renewing the plan', error: error.message };
  }
};


module.exports = {renewPlan}