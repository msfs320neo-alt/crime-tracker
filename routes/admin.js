const express     = require('express');
const { reports, users, customTypes } = require('../db');
const requireAuth = require('../middleware/auth');

const router = express.Router();

// All admin routes require auth + admin role
router.use(requireAuth, (req, res, next) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
  next();
});

// ── Stats ──────────────────────────────────────────────────────────────────────
router.get('/stats', async (req, res) => {
  const allReports = await reports.findAsync({});
  const allUsers   = await users.findAsync({});
  const allTypes   = await customTypes.findAsync({});

  const byType = {};
  allReports.forEach(r => { byType[r.type] = (byType[r.type] || 0) + 1; });

  const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate() - 7);
  const weekCount = allReports.filter(r => new Date(r.date) >= weekAgo).length;

  res.json({
    totalReports: allReports.length,
    totalUsers:   allUsers.length,
    totalTypes:   allTypes.length,
    weekCount,
    byType,
  });
});

// ── All Reports ────────────────────────────────────────────────────────────────
router.get('/reports', async (req, res) => {
  const allReports = await reports.findAsync({}).sort({ created_at: -1 });
  const allUsers   = await users.findAsync({});
  const byId       = Object.fromEntries(allUsers.map(u => [u._id, u.username]));
  res.json(allReports.map(r => ({ ...r, id: r._id, reported_by: byId[r.user_id] || 'Unknown' })));
});

// Admin delete any report
router.delete('/reports/:id', async (req, res) => {
  const r = await reports.findOneAsync({ _id: req.params.id });
  if (!r) return res.status(404).json({ error: 'Report not found' });
  await reports.removeAsync({ _id: req.params.id }, {});
  res.json({ success: true });
});

// ── Custom Types ───────────────────────────────────────────────────────────────
router.get('/types', async (req, res) => {
  const types = await customTypes.findAsync({}).sort({ name: 1 });
  res.json(types.map(t => ({ ...t, id: t._id })));
});

router.post('/types', async (req, res) => {
  const { name, category, color, icon } = req.body;
  if (!name?.trim()) return res.status(400).json({ error: 'Name required' });
  const exists = await customTypes.findOneAsync({ name: new RegExp(`^${name.trim()}$`, 'i') });
  if (exists) return res.status(409).json({ error: 'Type already exists' });
  const doc = await customTypes.insertAsync({
    name:       name.trim(),
    category:   category || 'crime',
    color:      color    || '#22c55e',
    icon:       icon     || '⚠️',
    created_at: new Date().toISOString(),
  });
  res.status(201).json({ ...doc, id: doc._id });
});

router.delete('/types/:id', async (req, res) => {
  await customTypes.removeAsync({ _id: req.params.id }, {});
  res.json({ success: true });
});

module.exports = router;
