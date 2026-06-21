'use strict';

const PremiumPlans = require('../api/models/premiumPlans');

const PLANS = [
  { planName: 'Basic',    price: '3500', employeeLimit: 30,  duration: 'monthly', isActive: true },
  { planName: 'Premium',  price: '5000', employeeLimit: 60,  duration: 'monthly', isActive: true },
  { planName: 'Advanced', price: '7500', employeeLimit: 100, duration: 'monthly', isActive: true },
];

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const existing = await PremiumPlans.findAll({ order: [['id', 'ASC']] });

    for (let i = 0; i < PLANS.length; i++) {
      const desired = PLANS[i];
      if (existing[i]) {
        await existing[i].update(desired);
        console.log(`Updated plan id=${existing[i].id} → ${desired.planName} @ ₹${desired.price}`);
      } else {
        const created = await PremiumPlans.create(desired);
        console.log(`Created plan id=${created.id} → ${desired.planName} @ ₹${desired.price}`);
      }
    }
  },

  async down(queryInterface, Sequelize) {
    // Intentionally left blank — original data was incorrect placeholder data.
  },
};
