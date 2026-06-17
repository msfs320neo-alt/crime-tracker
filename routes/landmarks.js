const express     = require('express');
const { landmarks } = require('../db');
const requireAuth   = require('../middleware/auth');

const router = express.Router();

function adminOnly(req, res, next) {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
  next();
}

// Public: GET all landmarks
router.get('/', requireAuth, async (req, res) => {
  const docs = await landmarks.findAsync({}).sort({ name: 1 });
  res.json(docs.map(d => ({ ...d, id: d._id })));
});

// Admin: POST create landmark
router.post('/', requireAuth, adminOnly, async (req, res) => {
  const { name, type, lat, lng, icon, color, description } = req.body;
  if (!name?.trim() || !type || lat == null || lng == null) {
    return res.status(400).json({ error: 'name, type, lat, lng are required.' });
  }
  const doc = await landmarks.insertAsync({
    name:        name.trim(),
    type,
    lat:         parseFloat(lat),
    lng:         parseFloat(lng),
    icon:        icon        || '📌',
    color:       color       || '#22c55e',
    description: description || null,
    created_at:  new Date().toISOString(),
  });
  res.status(201).json({ ...doc, id: doc._id });
});

// Admin: DELETE landmark
router.delete('/:id', requireAuth, adminOnly, async (req, res) => {
  const doc = await landmarks.findOneAsync({ _id: req.params.id });
  if (!doc) return res.status(404).json({ error: 'Not found' });
  await landmarks.removeAsync({ _id: req.params.id }, {});
  res.json({ success: true });
});

module.exports = router;
