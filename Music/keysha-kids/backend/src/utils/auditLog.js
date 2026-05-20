const { prisma } = require('../config/database');

const createAuditLog = async ({
  userId,
  action,
  module,
  description,
  oldValue = null,
  newValue = null,
  ipAddress = null,
}) => {
  try {
    await prisma.auditLog.create({
      data: {
        userId,
        action,
        module,
        description,
        oldValue,
        newValue,
        ipAddress,
      },
    });
  } catch (error) {
    // Audit log isizuie main operation
    console.error('Audit log error:', error);
  }
};

module.exports = { createAuditLog };