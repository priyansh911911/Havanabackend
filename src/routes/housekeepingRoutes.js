const express = require('express');
const router = express.Router();
const housekeepingController = require('../controllers/housekeepingController');
const { auth, authorize } = require('../middleware/auth');

// Get all tasks
router.get('/all', auth, authorize(['ADMIN', 'GM', 'HOUSEKEEPING', 'FRONT DESK']), housekeepingController.getAllTasks);

// Create new task
router.post('/create', auth, authorize(['ADMIN', 'GM', 'HOUSEKEEPING', 'FRONT DESK']), housekeepingController.createTask);

// Get task by ID
router.get('/:id', auth, authorize(['ADMIN', 'GM', 'HOUSEKEEPING', 'FRONT DESK']), housekeepingController.getTaskById);

// Update task
router.put('/:id', auth, authorize(['ADMIN', 'GM', 'HOUSEKEEPING', 'FRONT DESK']), housekeepingController.updateTask);

// Update task status
router.patch('/:id/status', auth, authorize(['ADMIN', 'GM', 'HOUSEKEEPING', 'FRONT DESK']), housekeepingController.updateTaskStatus);

// Delete task
router.delete('/:id', auth, authorize(['ADMIN', 'GM', 'HOUSEKEEPING']), housekeepingController.deleteTask);

// Dashboard stats
router.get('/dashboard/stats', auth, authorize(['ADMIN', 'GM', 'HOUSEKEEPING', 'FRONT DESK']), housekeepingController.getDashboardStats);

// Export CSV
router.get('/export/csv', auth, authorize(['ADMIN', 'GM', 'HOUSEKEEPING', 'FRONT DESK']), housekeepingController.exportCSV);

module.exports = router;