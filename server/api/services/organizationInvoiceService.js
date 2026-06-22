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

const createOrganizationInvoice = async (data) => {
    try {
        if (data.planId) {
            const selectedPlan = await PremiumPlans.findByPk(data.planId);
            if (selectedPlan) {
                const duration = selectedPlan.duration; // e.g., "3 Months"
                const durationParts = duration.split(' '); // ["3", "Months"]

                if (durationParts.length === 2) {
                    const value = parseInt(durationParts[0], 10); // Extract the numeric value
                    const unit = durationParts[1].toLowerCase(); // Extract the time unit (e.g., "month", "year")

                    let expiryDate = new Date(); // Start from the current date
                    switch (unit) {
                        case 'month':
                        case 'months':
                            expiryDate.setMonth(expiryDate.getMonth() + value); // Add months
                            break;
                        case 'year':
                        case 'years':
                            expiryDate.setFullYear(expiryDate.getFullYear() + value); // Add years
                            break;
                        case 'day':
                        case 'days':
                            expiryDate.setDate(expiryDate.getDate() + value); // Add days
                            break;
                        default:
                            throw new Error('Invalid plan duration unit');
                    }

                    // Add 7 days to the expiry date to allow the plan to run for one extra week
                    const extraWeek = new Date(expiryDate);
                    extraWeek.setDate(extraWeek.getDate() + 7);

                    data.startDate = new Date(); // Start date is the current date
                    data.endDate = expiryDate; // Plan expiry date
                    data.graceDate = extraWeek; // Plan end after an extra week
                }
            }
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