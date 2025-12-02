const mongoose = require('mongoose');

// Separate connection for audit logs
let auditConnection = null;

const connectAuditDB = async () => {
  try {
    if (auditConnection && auditConnection.readyState === 1) {
      return auditConnection;
    }

    // Use separate database for audit logs
    const auditDbUri = process.env.AUDIT_MONGO_URI || 
      process.env.MONGO_URI?.replace('/havna', '/hotel_logs') || 
      'mongodb+srv://hh:havana@cluster0.renncp4.mongodb.net/hotel_logs?retryWrites=true&w=majority';

    console.log('Connecting to audit database...');
    
    auditConnection = mongoose.createConnection(auditDbUri, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 10000,
      connectTimeoutMS: 5000,
      maxPoolSize: 5,
      minPoolSize: 1,
      maxIdleTimeMS: 30000,
      retryWrites: true,
      w: 'majority'
    });

    // Wait for connection to be established
    await new Promise((resolve, reject) => {
      auditConnection.once('connected', () => {
        console.log('✅ Audit database connected successfully');
        resolve();
      });
      
      auditConnection.once('error', (err) => {
        console.error('❌ Audit database connection error:', err.message);
        reject(err);
      });
    });

    auditConnection.on('disconnected', () => {
      console.log('⚠️ Audit database disconnected');
      auditConnection = null;
    });

    return auditConnection;
  } catch (error) {
    console.error('Failed to connect to audit database:', error.message);
    auditConnection = null;
    throw error;
  }
};

const getAuditConnection = async () => {
  if (!auditConnection || auditConnection.readyState !== 1) {
    try {
      auditConnection = await connectAuditDB();
    } catch (error) {
      console.error('Failed to get audit connection:', error.message);
      throw new Error('Audit database not connected');
    }
  }
  return auditConnection;
};

module.exports = {
  connectAuditDB,
  getAuditConnection
};