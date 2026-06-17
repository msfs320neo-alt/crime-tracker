const express  = require('express');
const supabase = require('../db');
const requireAuth = require('../middleware/auth');

const router = express.Router();

// GET all reports
router.get('/', requireAuth, async (req, res) => {
  let query = supabase.from('reports').select('*, users(username)').order('created_at', { ascending: false });
  if (req.query.type)     query = query.eq('type', req.query.type);
  if (req.query.category) query = query.eq('category', req.query.category);
  const { data, error } = await query;
  if (error) return res.status(500).json({ error: error.message });
  res.json(data.map(r => ({ ...r, reported_by: r.users?.username || 'Unknown', users: undefined })));
});

// GET stats
router.get('/stats', requireAuth, async (req, res) => {
  const { data: all } = await supabase.from('reports').select('type, date');
  const total = all?.length || 0;
  const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate() - 7);
  const week   = all?.filter(r => new Date(r.date) >= weekAgo).length || 0;
  const counts = {};
  all?.forEach(r => { counts[r.type] = (counts[r.type] || 0) + 1; });
  const byType = Object.entries(counts).map(([type, count]) => ({ type, count })).sort((a, b) => b.count - a.count);
  res.json({ total, week, byType });
});

// POST create report
router.post('/', requireAuth, async (req, res) => {
  const { type, category, date, time, title, description, severity, lat, lng, photos } = req.body;
  if (!type || !date) return res.status(400).json({ error: 'Type and date are required.' });
  const cat = req.user.role === 'admin' ? (category || 'crime') : 'crime';
  const { data, error } = await supabase.from('reports')
    .insert({
      user_id: req.user.id, type, category: cat, date,
      time: time || null, title: title || null, description: description || null,
      severity: severity || 'medium', lat: lat ?? null, lng: lng ?? null,
      photos: Array.isArray(photos) ? photos : [],
    })
    .select('*, users(username)').single();
  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json({ ...data, reported_by: data.users?.username || 'Unknown', users: undefined });
});

// DELETE — admin only
router.delete('/:id', requireAuth, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Only admins can delete reports.' });
  const { error } = await supabase.from('reports').delete().eq('id', req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

module.exports = router;
