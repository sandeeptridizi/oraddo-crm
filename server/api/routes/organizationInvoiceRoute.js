const express = require('express');
const router = express.Router();
const organizationInvoice = require('../controllers/organizationInvoiceController');

router.post('/organizationInvoice', organizationInvoice.createOrganizationInvoice);
router.get('/organizationInvoice/:orgId', organizationInvoice.getByOrganizationId);
// Admin: all subscription invoices across all orgs
router.get('/admin/org-invoices', organizationInvoice.getAllInvoices);

module.exports = router;