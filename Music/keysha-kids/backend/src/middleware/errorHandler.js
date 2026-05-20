const { errorResponse } = require('../utils/response');

const errorHandler = (err, req, res, next) => {
  console.error('❌ Error:', err);

  // Prisma Errors
  if (err.code === 'P2002') {
    return errorResponse(
      res,
      'Taarifa hii ipo tayari kwenye mfumo!',
      409
    );
  }

  if (err.code === 'P2025') {
    return errorResponse(
      res,
      'Taarifa uliyotafuta haipatikani!',
      404
    );
  }

  if (err.code === 'P2003') {
    return errorResponse(
      res,
      'Taarifa inayohusiana haipatikani!',
      400
    );
  }

  // JWT Errors
  if (err.name === 'JsonWebTokenError') {
    return errorResponse(res, 'Token si sahihi!', 401);
  }

  if (err.name === 'TokenExpiredError') {
    return errorResponse(res, 'Muda wa session umekwisha!', 401);
  }

  // Validation Errors (Zod)
  if (err.name === 'ZodError') {
    return errorResponse(
      res,
      'Taarifa uliyoweka si sahihi!',
      400,
      err.errors
    );
  }

  // Default Error
  return errorResponse(
    res,
    err.message || 'Hitilafu ya seva — jaribu tena!',
    err.statusCode || 500
  );
};

// 404 Handler
const notFound = (req, res) => {
  return errorResponse(
    res,
    `Njia hii haipatikani: ${req.originalUrl}`,
    404
  );
};

module.exports = { errorHandler, notFound };