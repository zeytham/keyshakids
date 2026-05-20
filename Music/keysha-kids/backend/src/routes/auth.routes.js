const express = require('express');
const router = express.Router();
const {
  setupOwner,
  login,
  refreshToken,
  logout,
  getProfile,
  changePassword,
  changePin,
} = require('../controllers/auth.controller');
const { authenticate } = require('../middleware/auth');

// Public routes — hazihitaji token
router.post('/setup', setupOwner);
router.post('/login', login);
router.post('/refresh', refreshToken);

// Protected routes — zinahitaji token
router.post('/logout', authenticate, logout);
router.get('/profile', authenticate, getProfile);
router.put('/change-password', authenticate, changePassword);
router.put('/change-pin', authenticate, changePin);

module.exports = router;