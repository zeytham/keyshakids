const express = require('express');
const router = express.Router();
const {
  getAllProducts,
  getLowStockProducts,
  getProductById,
  createProduct,
  updateProduct,
  addStock,
  adjustStock,
  deactivateProduct,
} = require('../controllers/products.controller');
const { authenticate, ownerOnly } = require('../middleware/auth');

// Wote wanaweza kuona bidhaa
router.get('/', authenticate, getAllProducts);
router.get('/low-stock', authenticate, getLowStockProducts);
router.get('/:id', authenticate, getProductById);

// Owner na Cashier wanaweza kuona — Owner tu anaweza kubadilisha
router.post('/', authenticate, ownerOnly, createProduct);
router.put('/:id', authenticate, ownerOnly, updateProduct);
router.patch('/:id/add-stock', authenticate, ownerOnly, addStock);
router.patch('/:id/adjust-stock', authenticate, ownerOnly, adjustStock);
router.patch('/:id/deactivate', authenticate, ownerOnly, deactivateProduct);

module.exports = router;