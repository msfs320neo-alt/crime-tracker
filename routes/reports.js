const express     = require('express');
const { reports, users } = require('../db');
const requireAuth = require('../middleware/auth');

const router = express.Router();

async function withUser(docs) {
  const ids   = [...new Set(docs.map(d => d.user_id))];
  const list  = await users.findAsync({ _id: { $in: ids } });
  const byId  = Object.fromEntries(list.map(u => [u._id, u.username]));
  return docs.map(d => ({ ...d, id: d._id, reported_by: byId[d.user_id] || 'Unknown' }));
}

// GET all reports (optional ?type= and ?category= filters)
router.get('/', requireAuth, async (req, res) => {
  const query = {};
  if (req.query.type)     query.type     = req.query.type;
  if (req.query.category) query.category = req.query.category;
  const docs = await reports.findAsync(query).sort({ created_at: -1 });
  res.json(await withUser(docs));
});

// GET stats
router.get('/stats', requireAuth, async (req, res) => {
  const all = await reports.findAsync({});
  const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate() - 7);
  const week  = all.filter(r => new Date(r.date) >= weekAgo).length;
  const counts = {};
  all.forEach(r => { counts[r.type] = (counts[r.type] || 0) + 1; });
  const byType = Object.entries(counts)
    .map(([type, count]) => ({ type, count }))
    .sort((a, b) => b.count - a.count);
  res.json({ total: all.length, week, byType });
});

// POST create report
router.post('/', requireAuth, async (req, res) => {
  const { type, category, date, time, title, description, severity, lat, lng, photos } = req.body;
  if (!type || !date) return res.status(400).json({ error: 'Type and date are required.' });

  // Non-admin users can only create crime category reports
  const cat = (req.user.role === 'admin') ? (category || 'crime') : 'crime';

  const doc = await reports.insertAsync({
    user_id:     req.user.id,
    type,
    category:    cat,
    date,
    time:        time        || null,
    title:       title       || null,
    description: description || null,
    photos:      Array.isArray(photos) ? photos : [],
    severity:    severity    || 'medium',
    lat:         lat  ?? null,
    lng:         lng  ?? null,
    created_at:  new Date().toISOString(),
  });
  const [enriched] = await withUser([doc]);
  res.status(201).json(enriched);
});

// DELETE — admin only
router.delete('/:id', requireAuth, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Only admins can delete reports.' });
  const report = await reports.findOneAsync({ _id: req.params.id });
  if (!report) return res.status(404).json({ error: 'Report not found.' });
  await reports.removeAsync({ _id: req.params.id }, {});
  res.json({ success: true });
});

module.exports = router;
