const { logAuditEvent } = require('../utils/auditLogger');

// Middleware to capture and log CRUD operations
const auditMiddleware = (module) => {
  return (req, res, next) => {
    const originalSend = res.send;
    const originalJson = res.json;
    
    // Store original data for UPDATE/DELETE operations
    req.auditData = {
      module,
      startTime: Date.now()
    };

    // Override response methods to capture audit data
    res.send = function(data) {
      captureAuditLog(req, res, data);
      return originalSend.call(this, data);
    };

    res.json = function(data) {
      captureAuditLog(req, res, data);
      return originalJson.call(this, data);
    };

    next();
  };
};

const captureAuditLog = async (req, res, responseData) => {
  try {
    // Only log successful operations (2xx status codes)
    if (res.statusCode < 200 || res.statusCode >= 300) {
      return;
    }

    const user = req.user || {};
    const { module } = req.auditData;
    
    // Determine action based on HTTP method and route
    let action = null;
    let recordId = null;
    let oldData = null;
    let newData = null;

    switch (req.method) {
      case 'POST':
        action = 'CREATE';
        recordId = extractRecordId(responseData, req);
        newData = sanitizeData(req.body);
        break;
        
      case 'PUT':
      case 'PATCH':
        action = 'UPDATE';
        recordId = req.params.id || req.params.bookingId || req.params.grcNo;
        oldData = req.originalData ? sanitizeData(req.originalData) : null;
        newData = sanitizeData(req.body);
        break;
        
      case 'DELETE':
        action = 'DELETE';
        recordId = req.params.id || req.params.bookingId || req.params.grcNo;
        oldData = req.originalData ? sanitizeData(req.originalData) : null;
        break;
        
      default:
        return; // Don't log GET requests
    }

    if (action && recordId && user._id) {
      await logAuditEvent({
        action,
        module,
        recordId,
        userId: user._id,
        userRole: user.role || 'unknown',
        oldData,
        newData,
        req
      });
    }
  } catch (error) {
    console.error('Audit middleware error:', error.message);
  }
};

// Extract record ID from response data
const extractRecordId = (responseData, req) => {
  try {
    const data = typeof responseData === 'string' ? JSON.parse(responseData) : responseData;
    
    // Try different common ID fields
    return data._id || 
           data.id || 
           data.grcNo ||
           data.bookingId ||
           req.params.id ||
           req.params.bookingId ||
           req.params.grcNo ||
           'unknown';
  } catch {
    return 'unknown';
  }
};

// Remove sensitive data before logging
const sanitizeData = (data) => {
  if (!data || typeof data !== 'object') return data;
  
  const sensitiveFields = [
    'password', 'token', 'secret', 'key', 'auth',
    'idProofImageUrl', 'idProofImageUrl2', 'photoUrl'
  ];
  
  const sanitized = { ...data };
  
  sensitiveFields.forEach(field => {
    if (sanitized[field]) {
      sanitized[field] = '[REDACTED]';
    }
  });
  
  return sanitized;
};

// Middleware to capture original data before updates/deletes
const captureOriginalData = (Model) => {
  return async (req, res, next) => {
    try {
      const recordId = req.params.id || req.params.bookingId || req.params.grcNo;
      
      if (recordId && (req.method === 'PUT' || req.method === 'PATCH' || req.method === 'DELETE')) {
        let originalRecord = null;
        
        if (req.params.grcNo) {
          originalRecord = await Model.findOne({ grcNo: recordId }).lean();
        } else {
          originalRecord = await Model.findById(recordId).lean();
        }
        
        req.originalData = originalRecord;
      }
    } catch (error) {
      console.error('Error capturing original data:', error.message);
    }
    
    next();
  };
};

module.exports = {
  auditMiddleware,
  captureOriginalData
};