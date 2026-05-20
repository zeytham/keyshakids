const express = require('express');
const router = express.Router();
const {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  toggleUserStatus,
  resetUserPin,
} = require('../controllers/users.controller');
const { authenticate, ownerOnly } = require('../middleware/auth');

// Routes zote zinahitaji token NA Owner tu
router.use(authenticate, ownerOnly);

router.get('/', getAllUsers);
router.get('/:id', getUserById);
router.post('/', createUser);
router.put('/:id', updateUser);
router.patch('/:id/toggle-status', toggleUserStatus);
router.patch('/:id/reset-pin', resetUserPin);

module.exports = router;