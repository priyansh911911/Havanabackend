const AuditLog = require('../models/AuditLog');

const logAuditEvent = async ({
  action,
  module,
  recordId,
  userId,
  userRole,
  oldData,
  newData,
  req
}) => {
  try {
    await AuditLog.create({
      action,
      module,
      recordId,
      userId,
      userRole,
      oldData,
      newData,
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent'),
      timestamp: new Date()
    });
  } catch (error) {
    console.error('Failed to log audit event:', error.message);
  }
};

module.exports = { logAuditEvent };