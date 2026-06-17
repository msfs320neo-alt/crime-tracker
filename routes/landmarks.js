const express  = require('express');
const supabase = require('../db');
const requireAuth = require('../middleware/auth');

const router = express.Router();
const adminOnly = (req, res, next) =>
  req.user.role === 'admin' ? next() : res.status(403).json({ error: 'Admin only' });

router.get('/', requireAuth, async (req, res) => {
  const { data, error } = await supabase.from('landmarks').select('*').order('name');
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

router.post('/', requireAuth, adminOnly, async (req, res) => {
  const { name, type, lat, lng, icon, color, description } = req.body;
  if (!name?.trim() || !type || lat == null || lng == null)
    return res.status(400).json({ error: 'name, type, lat, lng are required.' });
  const { data, error } = await supabase.from('landmarks')
    .insert({ name: name.trim(), type, lat: parseFloat(lat), lng: parseFloat(lng), icon: icon || '📌', color: color || '#22c55e', description: description || null })
    .select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
});

router.delete('/:id', requireAuth, adminOnly, async (req, res) => {
  const { error } = await supabase.from('landmarks').delete().eq('id', req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

module.exports = router;
