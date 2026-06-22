const OrganizationInvoice= require('../services/organizationInvoiceService');

const createOrganizationInvoice = async (req, res) => {
  try {
    const invoice = await OrganizationInvoice.createOrganizationInvoice(req.body);
    res.status(201).json({ success: true, data: invoice });
  } catch (error) {
    res.status(500).json({ success: false, message: error.invoice });
  }
};

const getByOrganizationId = async (req, res) => {
  try {
    const invoices = await OrganizationInvoice.getByOrganizationId(req.params.orgId);
    res.status(200).json({ success: true, data: invoices });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
    createOrganizationInvoice,
    getByOrganizationId,
  };