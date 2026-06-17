const express  = require('express');
const multer   = require('multer');
const path     = require('path');
const crypto   = require('crypto');
const fs       = require('fs');
const requireAuth = require('../middleware/auth');

const uploadsDir = path.join(__dirname, '..', 'data', 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: uploadsDir,
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${Date.now()}-${crypto.randomBytes(5).toString('hex')}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 12 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const ok = /\.(jpe?g|png|gif|webp|heic)$/i.test(file.originalname);
    cb(null, ok);
  },
});

const router = express.Router();

router.post('/', requireAuth, upload.array('photos', 10), (req, res) => {
  if (!req.files?.length) return res.status(400).json({ error: 'No valid image files received.' });
  const urls = req.files.map(f => `/uploads/${f.filename}`);
  res.json({ urls });
});

module.exports = router;
