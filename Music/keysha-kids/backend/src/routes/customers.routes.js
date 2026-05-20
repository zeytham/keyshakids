const express = require('express');
const router = express.Router();
const {
  getAllCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  getCustomerDebts,
} = require('../controllers/customers.controller');
const { authenticate, ownerOnly } = require('../middleware/auth');

// Wote wanaweza kuona na kuongeza wateja
router.get('/', authenticate, getAllCustomers);
router.get('/:id', authenticate, getCustomerById);
router.post('/', authenticate, createCustomer);

// Owner tu anaweza kubadilisha taarifa
router.put('/:id', authenticate, ownerOnly, updateCustomer);

// Madeni ya mteja
router.get('/:id/debts', authenticate, getCustomerDebts);

module.exports = router;