const KOT = require('../models/KOT');

// Create new KOT
exports.createKOT = async (req, res) => {
  try {
    const kot = new KOT(req.body);
    await kot.save();
    res.status(201).json(kot);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Get all KOTs
exports.getAllKOTs = async (req, res) => {
  try {
    const kots = await KOT.find()
      .sort({ createdAt: -1 })
      .lean()
      .exec();
    res.json(kots);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update KOT status
exports.updateKOTStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    const kot = await KOT.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );
    
    if (!kot) {
      return res.status(404).json({ error: 'KOT not found' });
    }
    
    res.json(kot);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update KOT item statuses
exports.updateItemStatuses = async (req, res) => {
  try {
    const { id } = req.params;
    const { itemStatuses } = req.body;
    
    const kot = await KOT.findByIdAndUpdate(
      id,
      { $push: { itemStatuses: { $each: itemStatuses } } },
      { new: true }
    );
    
    if (!kot) {
      return res.status(404).json({ error: 'KOT not found' });
    }
    
    res.json(kot);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};