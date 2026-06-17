const express  = require('express');
const bcrypt   = require('bcryptjs');
const jwt      = require('jsonwebtoken');
const supabase = require('../db');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'nw-crime-secret-change-in-prod';

function makeToken(user) {
  return jwt.sign(
    { id: user.id, username: user.username, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

// POST /api/auth/register
router.post('/register', async (req, res) => {
  const { username, email, password } = req.body;
  if (!username?.trim() || !email?.trim() || !password)
    return res.status(400).json({ error: 'Username, email, and password are required.' });
  if (password.length < 6)
    return res.status(400).json({ error: 'Password must be at least 6 characters.' });

  const { data: existing } = await supabase.from('users').select('id').eq('email', email.toLowerCase()).maybeSingle();
  if (existing) return res.status(409).json({ error: 'An account with that email already exists.' });

  const hash = await bcrypt.hash(password, 12);
  const { data: user, error } = await supabase.from('users')
    .insert({ username: username.trim(), email: email.toLowerCase(), password_hash: hash, role: 'user' })
    .select().single();
  if (error) return res.status(500).json({ error: 'Failed to create account.' });

  res.status(201).json({ token: makeToken(user), user: { id: user.id, username: user.username, email: user.email, role: user.role } });
});

// POST /api/auth/login — accepts username or email
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ error: 'Username/email and password are required.' });

  const id = email.trim();
  let { data: user } = await supabase.from('users').select('*').eq('email', id.toLowerCase()).maybeSingle();
  if (!user) {
    const { data: byName } = await supabase.from('users').select('*').eq('username', id).maybeSingle();
    user = byName;
  }
  if (!user) return res.status(401).json({ error: 'Invalid username or password.' });

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) return res.status(401).json({ error: 'Invalid username or password.' });

  res.json({ token: makeToken(user), user: { id: user.id, username: user.username, email: user.email, role: user.role } });
});

// GET /api/auth/me
router.get('/me', require('../middleware/auth'), async (req, res) => {
  const { data: user } = await supabase.from('users').select('id, username, email, role, created_at').eq('id', req.user.id).single();
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json(user);
});

module.exports = router;
