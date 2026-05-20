const bcrypt = require('bcryptjs');
const { BCRYPT_ROUNDS } = require('../config/constants');

// Hash password au PIN
const hashPassword = async (password) => {
  return await bcrypt.hash(password, BCRYPT_ROUNDS);
};

// Thibitisha password au PIN
const comparePassword = async (password, hash) => {
  return await bcrypt.compare(password, hash);
};

// Validate PIN — lazima iwe nambari 4-6
const validatePin = (pin) => {
  const pinRegex = /^\d{4,6}$/;
  return pinRegex.test(pin);
};

// Validate Password — lazima iwe na herufi kubwa, ndogo, nambari
const validatePassword = (password) => {
  if (password.length < 8) return false;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumber = /\d/.test(password);
  return hasUpperCase && hasLowerCase && hasNumber;
};

module.exports = {
  hashPassword,
  comparePassword,
  validatePin,
  validatePassword,
};