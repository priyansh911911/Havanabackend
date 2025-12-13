const Housekeeping = require('../models/Housekeeping');

// Get all housekeeping tasks
exports.getAllTasks = async (req, res) => {
  try {
    const { status, priority, assignedTo, roomNumber } = req.query;
    let filter = {};
    
    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (assignedTo) filter.assignedTo = assignedTo;
    if (roomNumber) filter.roomNumber = roomNumber;

    const tasks = await Housekeeping.find(filter).sort({ createdAt: -1 });
    res.json({ success: true, tasks });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Create new housekeeping task
exports.createTask = async (req, res) => {
  try {
    const task = new Housekeeping(req.body);
    await task.save();
    res.status(201).json({ success: true, task });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Update task status
exports.updateTaskStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes, actualTime } = req.body;
    
    const updateData = { status, notes };
    
    if (status === 'in_progress') {
      updateData.startTime = new Date();
    } else if (status === 'completed') {
      updateData.completedTime = new Date();
      if (actualTime) updateData.actualTime = actualTime;
    }

    const task = await Housekeeping.findByIdAndUpdate(id, updateData, { new: true });
    res.json({ success: true, task });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Update task
exports.updateTask = async (req, res) => {
  try {
    const { id } = req.params;
    const task = await Housekeeping.findByIdAndUpdate(id, req.body, { new: true });
    res.json({ success: true, task });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Delete task
exports.deleteTask = async (req, res) => {
  try {
    const { id } = req.params;
    await Housekeeping.findByIdAndDelete(id);
    res.json({ success: true, message: 'Task deleted successfully' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Get task by ID
exports.getTaskById = async (req, res) => {
  try {
    const { id } = req.params;
    const task = await Housekeeping.findById(id);
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }
    res.json({ success: true, task });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Get dashboard stats
exports.getDashboardStats = async (req, res) => {
  try {
    const [
      totalTasks,
      pendingTasks,
      inProgressTasks,
      completedTasks,
      urgentTasks
    ] = await Promise.all([
      Housekeeping.countDocuments(),
      Housekeeping.countDocuments({ status: 'pending' }),
      Housekeeping.countDocuments({ status: 'in_progress' }),
      Housekeeping.countDocuments({ status: 'completed' }),
      Housekeeping.countDocuments({ priority: 'urgent' })
    ]);

    res.json({
      success: true,
      stats: {
        totalTasks,
        pendingTasks,
        inProgressTasks,
        completedTasks,
        urgentTasks
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Export CSV
exports.exportCSV = async (req, res) => {
  try {
    const tasks = await Housekeeping.find().sort({ createdAt: -1 });
    const csvData = [['Room Number', 'Task Type', 'Status', 'Priority', 'Assigned To', 'Description', 'Created Date', 'Completed Date']];
    
    tasks.forEach(task => {
      csvData.push([
        task.roomNumber,
        task.taskType,
        task.status,
        task.priority,
        task.assignedTo,
        task.description,
        task.createdAt.toISOString().split('T')[0],
        task.completedTime ? task.completedTime.toISOString().split('T')[0] : ''
      ]);
    });

    // Add summary
    csvData.push(['', '', '', '', '', '', '', '']);
    csvData.push(['TOTAL TASKS:', tasks.length, '', '', '', '', '', '']);
    csvData.push(['COMPLETED TASKS:', tasks.filter(t => t.status === 'completed').length, '', '', '', '', '', '']);
    csvData.push(['PENDING TASKS:', tasks.filter(t => t.status === 'pending').length, '', '', '', '', '', '']);

    const csvString = csvData.map(row => 
      row.map(cell => `"${cell || ''}"`).join(',')
    ).join('\n');

    const timestamp = new Date().toISOString().split('T')[0];
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="housekeeping-tasks-${timestamp}.csv"`);
    res.send(csvString);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};