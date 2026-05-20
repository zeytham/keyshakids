const express = require('express');
const router = express.Router();
const {
  getAllDebts,
  getDebtById,
  payDebt,
  getDebtPaymentReceipt,
  getDebtsNearLimit,
} = require('../controllers/debts.controller');
const { authenticate, ownerOnly } = require('../middleware/auth');

// Wote wanaweza kuona madeni
router.get('/', authenticate, getAllDebts);
router.get('/near-limit', authenticate, ownerOnly, getDebtsNearLimit);
router.get('/:id', authenticate, getDebtById);
router.get('/payments/:paymentId/receipt', authenticate, getDebtPaymentReceipt);

// Lipa deni — wote wanaweza
router.post('/:id/pay', authenticate, payDebt);

module.exports = router;