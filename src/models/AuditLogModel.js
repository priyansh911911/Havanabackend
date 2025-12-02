const { getAuditConnection } = require('../config/auditDatabase');
const AuditLogSchema = require('./AuditLog').schema;

let AuditLogModel = null;

const getAuditLogModel = async () => {
  if (!AuditLogModel) {
    const auditConnection = await getAuditConnection();
    AuditLogModel = auditConnection.model('AuditLog', AuditLogSchema);
  }
  return AuditLogModel;
};

module.exports = { getAuditLogModel };