const LaundryVendor = require("../models/LaundryVendor");

// Get all vendors
exports.getAllVendors = async (req, res) => {
  try {
    const vendors = await LaundryVendor.find().sort({ vendorName: 1 });
    res.json({ success: true, vendors });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get single vendor
exports.getVendorById = async (req, res) => {
  try {
    const vendor = await LaundryVendor.findById(req.params.id);
    if (!vendor) {
      return res.status(404).json({ error: "Vendor not found" });
    }
    res.json({ success: true, vendor });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Create vendor
exports.createVendor = async (req, res) => {
  try {
    const { vendorName, contactPerson, phoneNumber, email, address, gstNumber, UpiID, scannerImg, isActive, remarks } = req.body;
    
    const vendor = new LaundryVendor({
      vendorName,
      contactPerson,
      phoneNumber,
      email,
      address,
      gstNumber,
      UpiID,
      scannerImg,
      isActive: isActive !== undefined ? isActive : true,
      remarks
    });
    
    await vendor.save();
    res.status(201).json({ success: true, vendor });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Update vendor
exports.updateVendor = async (req, res) => {
  try {
    const { vendorName, contactPerson, phoneNumber, email, address, gstNumber, UpiID, scannerImg, isActive, remarks } = req.body;
    
    const updateData = {
      vendorName,
      contactPerson,
      phoneNumber,
      email,
      address,
      gstNumber,
      UpiID,
      scannerImg,
      isActive,
      remarks
    };
    
    const vendor = await LaundryVendor.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );
    if (!vendor) {
      return res.status(404).json({ error: "Vendor not found" });
    }
    res.json({ success: true, vendor });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Delete vendor
exports.deleteVendor = async (req, res) => {
  try {
    const vendor = await LaundryVendor.findByIdAndDelete(req.params.id);
    if (!vendor) {
      return res.status(404).json({ error: "Vendor not found" });
    }
    res.json({ success: true, message: "Vendor deleted" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get active vendors only
exports.getActiveVendors = async (req, res) => {
  try {
    const vendors = await LaundryVendor.find({ isActive: true }).sort({ vendorName: 1 });
    res.json({ success: true, vendors });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
