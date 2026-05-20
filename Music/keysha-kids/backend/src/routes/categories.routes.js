const express = require('express');
const router = express.Router();
const {
  getAllCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  createSubCategory,
  updateSubCategory,
  deleteSubCategory,
} = require('../controllers/categories.controller');
const { authenticate, ownerOnly } = require('../middleware/auth');

// Pata categories — wote wanaweza kuona
router.get('/', authenticate, getAllCategories);

// Badilisha categories — Owner tu
router.post('/', authenticate, ownerOnly, createCategory);
router.put('/:id', authenticate, ownerOnly, updateCategory);
router.delete('/:id', authenticate, ownerOnly, deleteCategory);

// Subcategories
router.post('/:id/subcategories', authenticate, ownerOnly, createSubCategory);
router.put('/:id/subcategories/:subId', authenticate, ownerOnly, updateSubCategory);
router.delete('/:id/subcategories/:subId', authenticate, ownerOnly, deleteSubCategory);

module.exports = router;