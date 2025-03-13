const multer = require("multer");
const sharp = require("sharp");

// Memory storage
const storage = multer.memoryStorage();

// Filter files that are not images
const fileFilter = (req, file, cb) => {
  // Success
  if (file.mimetype.startsWith("image")) return cb(null, true);
  // Return error
  cb(new AppError("Please upload an image.", 400), false);
};

// Set storage and filter
const upload = multer({
  storage,
  fileFilter,
});

// Resize and save image
const save = async (file, sizes, quality = 100, path) => {
  await sharp(file.buffer)
    .resize(sizes.width, sizes.height)
    .toFormat("jpeg")
    .jpeg({ quality })
    .toFile(`public/${path}/${file.filename}`);
};

exports.upload = upload;

exports.save = save;
