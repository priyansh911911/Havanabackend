const { getAuditLogModel } = require('../models/AuditLogModel');

// Get all audit logs
exports.getAuditLogs = async (req, res) => {
  try {
    const AuditLog = await getAuditLogModel();
    const logs = await AuditLog.find()
      .sort({ timestamp: -1 })
      .limit(100);
    
    res.json({ success: true, logs });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get audit logs by module
exports.getAuditLogsByModule = async (req, res) => {
  try {
    const { module } = req.params;
    const AuditLog = await getAuditLogModel();
    const logs = await AuditLog.find({ module })
      .sort({ timestamp: -1 })
      .limit(50);
    
    res.json({ success: true, logs });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get audit logs by record ID
exports.getAuditLogsByRecord = async (req, res) => {
  try {
    const { recordId } = req.params;
    const AuditLog = await getAuditLogModel();
    const logs = await AuditLog.find({ recordId })
      .sort({ timestamp: -1 });
    
    res.json({ success: true, logs });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};