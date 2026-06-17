const express  = require('express');
const supabase = require('../db');
const requireAuth = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth, (req, res, next) =>
  req.user.role === 'admin' ? next() : res.status(403).json({ error: 'Admin only' })
);

// Stats
router.get('/stats', async (req, res) => {
  const [rRes, uRes, tRes] = await Promise.all([
    supabase.from('reports').select('type, date'),
    supabase.from('users').select('id', { count: 'exact', head: true }),
    supabase.from('custom_types').select('id', { count: 'exact', head: true }),
  ]);
  const all = rRes.data || [];
  const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate() - 7);
  const byType = {};
  all.forEach(r => { byType[r.type] = (byType[r.type] || 0) + 1; });
  res.json({ totalReports: all.length, totalUsers: uRes.count || 0, totalTypes: tRes.count || 0, weekCount: all.filter(r => new Date(r.date) >= weekAgo).length, byType });
});

// All reports
router.get('/reports', async (req, res) => {
  const { data, error } = await supabase.from('reports').select('*, users(username)').order('created_at', { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  res.json(data.map(r => ({ ...r, reported_by: r.users?.username || 'Unknown', users: undefined })));
});

router.delete('/reports/:id', async (req, res) => {
  await supabase.from('reports').delete().eq('id', req.params.id);
  res.json({ success: true });
});

// Custom types
router.get('/types', async (req, res) => {
  const { data } = await supabase.from('custom_types').select('*').order('name');
  res.json(data || []);
});

router.post('/types', async (req, res) => {
  const { name, category, color, icon } = req.body;
  if (!name?.trim()) return res.status(400).json({ error: 'Name required' });
  const { data, error } = await supabase.from('custom_types')
    .insert({ name: name.trim(), category: category || 'crime', color: color || '#22c55e', icon: icon || '⚠️' })
    .select().single();
  if (error) return res.status(409).json({ error: 'Type already exists or invalid.' });
  res.status(201).json(data);
});

router.delete('/types/:id', async (req, res) => {
  await supabase.from('custom_types').delete().eq('id', req.params.id);
  res.json({ success: true });
});

module.exports = router;
