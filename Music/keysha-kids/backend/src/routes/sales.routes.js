const express = require('express');
const router = express.Router();
const {
  createSale,
  getAllSales,
  getSaleById,
  voidSale,
} = require('../controllers/sales.controller');
const { authenticate, ownerOnly } = require('../middleware/auth');

// Wote wanaweza kuona na kuunda mauzo
router.get('/', authenticate, getAllSales);
router.get('/:id', authenticate, getSaleById);
router.post('/', authenticate, createSale);

// Owner tu anaweza kufuta mauzo
router.patch('/:id/void', authenticate, ownerOnly, voidSale);

module.exports = router;