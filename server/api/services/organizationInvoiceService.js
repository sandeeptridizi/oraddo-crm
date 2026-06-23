const organizationInvoice = require('../models/organizationInvoiceModule');
const PremiumPlans = require('../models/premiumPlans');
const organization = require('../models/OrganizationModule');

const getNextInvoiceNumber = async () => {
    const lastInvoice = await organizationInvoice.findOne({
        order: [['createdAt', 'DESC']],
    });

    if (lastInvoice && lastInvoice.invoiceNumber) {
        const lastNumber = parseInt(lastInvoice.invoiceNumber.replace('ORDI', ''), 10);
        return `ORDI${String(lastNumber + 1).padStart(4, '0')}`;
    } else {
        return 'ORDI0001';
    }
};

// Months per billing cycle
const CYCLE_MONTHS = { quarterly: 3, halfYearly: 6, annually: 12 };

const createOrganizationInvoice = async (data) => {
    try {
        if (data.planId) {
            const now = new Date();
            let expiryDate = new Date(now);

            if (data.billingCycle && CYCLE_MONTHS[data.billingCycle]) {
                // Use billing cycle for exact duration
                expiryDate.setMonth(expiryDate.getMonth() + CYCLE_MONTHS[data.billingCycle]);
            } else {
                // Fallback: parse plan's duration field
                const selectedPlan = await PremiumPlans.findByPk(data.planId);
                if (selectedPlan) {
                    const d = (selectedPlan.duration || '').trim().toLowerCase();
                    if (d === 'monthly') expiryDate.setMonth(expiryDate.getMonth() + 1);
                    else if (d === 'quarterly') expiryDate.setMonth(expiryDate.getMonth() + 3);
                    else if (d === 'halfyearly' || d === 'half-yearly') expiryDate.setMonth(expiryDate.getMonth() + 6);
                    else if (d === 'yearly' || d === 'annually') expiryDate.setFullYear(expiryDate.getFullYear() + 1);
                    else {
                        const parts = d.split(' ');
                        if (parts.length === 2) {
                            const value = parseInt(parts[0], 10);
                            const unit = parts[1];
                            if (unit.startsWith('month')) expiryDate.setMonth(expiryDate.getMonth() + value);
                            else if (unit.startsWith('year')) expiryDate.setFullYear(expiryDate.getFullYear() + value);
                            else if (unit.startsWith('day')) expiryDate.setDate(expiryDate.getDate() + value);
                        }
                    }
                }
            }

            const extraWeek = new Date(expiryDate);
            extraWeek.setDate(extraWeek.getDate() + 7);

            data.startDate = now;
            data.endDate = expiryDate;
            data.graceDate = extraWeek;
        }

        data.invoiceNumber = await getNextInvoiceNumber();
        data.invoiceDate = new Date();
        const invoice = await organizationInvoice.create(data);
        if (invoice) {
            const org = await organization.findByPk(data.organizationId);
            if (org) {
                await org.update({ planId: data.planId, planStartDate: data.startDate, planExpiryDate: data.endDate, planGracePeriodEnd: data.graceDate });
            }
        }
        return invoice;
    } catch (error) {
        throw error;
    }
};



// createOrganizationInvoice = async (data) => {
//     try {

//         // existing code...
//     } catch (error) {
//         throw error;
//     }
// };


const getByOrganizationId = async (organizationId) => {
    const invoices = await organizationInvoice.findAll({
        where: { organizationId },
        include: [{ model: PremiumPlans, as: 'organizationInvoice_plan', attributes: ['id', 'planName', 'price', 'duration', 'employeeLimit'] }],
        order: [['invoiceDate', 'DESC']],
    });
    return invoices;
};

module.exports = {
    createOrganizationInvoice,
    getByOrganizationId,
};