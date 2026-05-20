const { errorResponse } = require('../utils/response');

const validate = (schema) => {
  return (req, res, next) => {
    try {
      schema.parse({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      next();
    } catch (error) {
      const errors = error.errors.map((err) => ({
        field: err.path.join('.'),
        message: err.message,
      }));

      return errorResponse(
        res,
        'Taarifa uliyoweka si sahihi!',
        400,
        errors
      );
    }
  };
};

module.exports = { validate };