const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("../utils/cloudinary");
const path = require("path");

const allowedFormats = ["jpg", "jpeg", "png", "webp"];

const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {
    const nameWithoutExt = path.parse(file.originalname).name;

    return {
      folder: "havan-booking-media",
      allowed_formats: allowedFormats,
      public_id: `${Date.now()}-${nameWithoutExt}`,
      resource_type: "image",
      transformation: [{ width: 800, height: 800, crop: "limit" }],
    };
  },
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith("image")) {
      return cb(new Error("Only images are allowed"), false);
    }
    cb(null, true);
  },

});

module.exports = upload;
