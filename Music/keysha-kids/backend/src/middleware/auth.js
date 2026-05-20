const jwt = require('jsonwebtoken');
const { JWT_SECRET, ROLES } = require('../config/constants');
const { errorResponse } = require('../utils/response');
const { prisma } = require('../config/database');

// Verify Token
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return errorResponse(res, 'Hakuna ruhusa — tafadhali ingia kwanza!', 401);
    }

    const token = authHeader.split(' ')[1];

    const decoded = jwt.verify(token, JWT_SECRET);

    // Check user bado yuko active
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        name: true,
        role: true,
        phone: true,
        isActive: true,
      },
    });

    if (!user || !user.isActive) {
      return errorResponse(res, 'Akaunti hii haipo au imezimwa!', 401);
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return errorResponse(res, 'Muda wa session umekwisha — ingia tena!', 401);
    }
    if (error.name === 'JsonWebTokenError') {
      return errorResponse(res, 'Token si sahihi!', 401);
    }
    return errorResponse(res, 'Hitilafu ya seva!', 500);
  }
};

// Owner Only
const ownerOnly = (req, res, next) => {
  if (req.user.role !== ROLES.OWNER) {
    return errorResponse(
      res,
      'Sehemu hii ni kwa Owner peke yake!',
      403
    );
  }
  next();
};

// Get IP Address
const getIpAddress = (req) => {
  return (
    req.headers['x-forwarded-for']?.split(',')[0] ||
    req.connection?.remoteAddress ||
    req.ip
  );
};

module.exports = { authenticate, ownerOnly, getIpAddress };