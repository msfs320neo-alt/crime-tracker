const express    = require('express');
const multer     = require('multer');
const cloudinary = require('cloudinary').v2;
const requireAuth = require('../middleware/auth');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const upload = multer({
  storage: multer.memoryStorage(),
  limits:  { fileSize: 12 * 1024 * 1024 },
  fileFilter: (req, file, cb) =>
    cb(null, /\.(jpe?g|png|gif|webp|heic)$/i.test(file.originalname)),
});

function toCloudinary(buffer) {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload_stream(
      { folder: 'crime-tracker', resource_type: 'image' },
      (err, result) => err ? reject(err) : resolve(result.secure_url)
    ).end(buffer);
  });
}

const router = express.Router();

router.post('/', requireAuth, upload.array('photos', 10), async (req, res) => {
  if (!req.files?.length) return res.status(400).json({ error: 'No valid image files received.' });
  try {
    const urls = await Promise.all(req.files.map(f => toCloudinary(f.buffer)));
    res.json({ urls });
  } catch (err) {
    res.status(500).json({ error: 'Image upload failed: ' + err.message });
  }
});

module.exports = router;
