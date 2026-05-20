require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const { errorHandler, notFound } = require('./middleware/errorHandler');
const { RATE_LIMIT_WINDOW_MS, RATE_LIMIT_MAX } = require('./config/constants');
const backupRoutes = require('./routes/backup.routes')
const app = express();
// Trust Railway proxy
app.set('trust proxy', 1)

// ============================================================
// SECURITY MIDDLEWARE
// ============================================================
app.use(helmet());

app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:5173',
    'https://keyshakids.vercel.app',
    /\.vercel\.app$/,
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  skip: (req) => req.ip === '::1' || req.ip === '127.0.0.1',
  message: {
    success: false,
    message: 'Maombi mengi sana — subiri kidogo!',
  },
  standardHeaders: true,
  legacyHeaders: false,
})
app.use('/api', limiter);

// ============================================================
// BODY PARSER
// ============================================================
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ============================================================
// HEALTH CHECK
// ============================================================
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: '✅ Keysha Kids API inafanya kazi!',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
  });
});

// ============================================================
// ROUTES
// ============================================================
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/users', require('./routes/users.routes'));
app.use('/api/categories', require('./routes/categories.routes'));
app.use('/api/products', require('./routes/products.routes'));
app.use('/api/sales', require('./routes/sales.routes'));
app.use('/api/customers', require('./routes/customers.routes'));
app.use('/api/debts', require('./routes/debts.routes'));
app.use('/api/reports', require('./routes/reports.routes'));
app.use('/api/backups', backupRoutes)

// ============================================================
// ERROR HANDLERS
// ============================================================
app.use(notFound);
app.use(errorHandler);

module.exports = app;