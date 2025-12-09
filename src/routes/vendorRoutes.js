const express = require("express");
const router = express.Router();
const vendorController = require("../controllers/vendorController");
const { auth, authorize } = require("../middleware/auth");

// Get all vendors
router.get("/all", auth, authorize(['ADMIN', 'STAFF','FRONT DESK']), vendorController.getAllVendors);

// Get active vendors only (must be before /:id route)
router.get("/active", auth, authorize(['ADMIN', 'STAFF', 'FRONT DESK']), vendorController.getActiveVendors);

// Get single vendor by ID
router.get("/get/:id", auth, authorize(['ADMIN', 'STAFF','FRONT DESK']), vendorController.getVendorById);

// Create vendor
router.post("/add", auth, authorize(['ADMIN', 'STAFF','FRONT DESK']), vendorController.createVendor);

// Update vendor
router.put("/update/:id", auth, authorize(['ADMIN', 'STAFF','FRONT DESK']), vendorController.updateVendor);
router.put("/:id", auth, authorize(['ADMIN', 'STAFF','FRONT DESK']), vendorController.updateVendor);

// Delete vendor
router.delete("/delete/:id", auth, authorize(['ADMIN']), vendorController.deleteVendor);
router.delete("/:id", auth, authorize(['ADMIN']), vendorController.deleteVendor);

module.exports = router;
