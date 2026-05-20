module.exports = {
  // JWT
  JWT_SECRET: process.env.JWT_SECRET,
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '15m',
  JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || '7d',

  // SERVER
  PORT: process.env.PORT || 5000,
  NODE_ENV: process.env.NODE_ENV || 'development',

  // BCRYPT
  BCRYPT_ROUNDS: parseInt(process.env.BCRYPT_ROUNDS) || 12,

  // RATE LIMITING
  RATE_LIMIT_WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000,
  RATE_LIMIT_MAX: parseInt(process.env.RATE_LIMIT_MAX) || 100,

  // ROLES
  ROLES: {
    OWNER: 'OWNER',
    CASHIER: 'CASHIER',
  },

  // PAYMENT TYPES
  PAYMENT_TYPES: {
    CASH: 'CASH',
    CREDIT: 'CREDIT',
    PARTIAL: 'PARTIAL',
  },

  // DEBT STATUS
  DEBT_STATUS: {
    PENDING: 'PENDING',
    PARTIAL: 'PARTIAL',
    PAID: 'PAID',
  },

  // STOCK MOVEMENT
  STOCK_MOVEMENT: {
    IN: 'IN',
    OUT: 'OUT',
    ADJUSTMENT: 'ADJUSTMENT',
  },

  // MODULES (kwa audit logs)
  MODULES: {
    AUTH: 'AUTH',
    INVENTORY: 'INVENTORY',
    SALES: 'SALES',
    CUSTOMERS: 'CUSTOMERS',
    DEBTS: 'DEBTS',
    REPORTS: 'REPORTS',
    USERS: 'USERS',
    CATEGORIES: 'CATEGORIES',
  },
};