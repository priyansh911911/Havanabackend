const RoomInventoryChecklist = require('../models/RoomInventoryChecklist');
const Inventory = require('../models/Inventory');

// Get all checklists
exports.getAllChecklists = async (req, res) => {
  try {
    const checklists = await RoomInventoryChecklist.find()
      .populate('roomId')
      .populate('items.inventoryId');
    res.json(checklists);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get checklist by ID
exports.getChecklistById = async (req, res) => {
  try {
    const checklist = await RoomInventoryChecklist.findById(req.params.id)
      .populate('roomId')
      .populate('items.inventoryId');
    if (!checklist) {
      return res.status(404).json({ error: 'Checklist not found' });
    }
    res.json(checklist);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Create new checklist
exports.createChecklist = async (req, res) => {
  try {
    const checklist = new RoomInventoryChecklist(req.body);
    await checklist.save();
    await checklist.populate('roomId');
    await checklist.populate('items.inventoryId');
    res.status(201).json(checklist);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Update checklist
exports.updateChecklist = async (req, res) => {
  try {
    const checklist = await RoomInventoryChecklist.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    ).populate('roomId').populate('items.inventoryId');
    if (!checklist) {
      return res.status(404).json({ error: 'Checklist not found' });
    }
    res.json(checklist);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Delete checklist
exports.deleteChecklist = async (req, res) => {
  try {
    const checklist = await RoomInventoryChecklist.findByIdAndDelete(req.params.id);
    if (!checklist) {
      return res.status(404).json({ error: 'Checklist not found' });
    }
    res.json({ message: 'Checklist deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get checklists by room
exports.getChecklistsByRoom = async (req, res) => {
  try {
    const checklists = await RoomInventoryChecklist.find({ roomId: req.params.roomId })
      .populate('roomId')
      .populate('items.inventoryId');
    res.json(checklists);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};