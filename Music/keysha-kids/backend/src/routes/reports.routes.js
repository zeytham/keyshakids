const express = require('express');
const router = express.Router();
const {
  getSalesReport,
  getFinancialReport,
  getInventoryReport,
  getStaffReport,
  getProductsPerformance,
} = require('../controllers/reports.controller');
const { authenticate, ownerOnly } = require('../middleware/auth');

// Reports zote — Owner tu
router.get('/sales', authenticate, ownerOnly, getSalesReport);
router.get('/financial', authenticate, ownerOnly, getFinancialReport);
router.get('/inventory', authenticate, ownerOnly, getInventoryReport);
router.get('/staff', authenticate, ownerOnly, getStaffReport);
router.get('/products-performance', authenticate, ownerOnly, getProductsPerformance);

module.exports = router;