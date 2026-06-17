const express = require('express');
const bcrypt  = require('bcryptjs');
const jwt     = require('jsonwebtoken');
const crypto  = require('crypto');
const { users } = require('../db');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'nw-crime-secret-change-in-prod';

function makeToken(user) {
  return jwt.sign(
    { id: user._id, username: user.username, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

// POST /api/auth/register
router.post('/register', async (req, res) => {
  const { username, email, password } = req.body;
  if (!username?.trim() || !email?.trim() || !password) {
    return res.status(400).json({ error: 'Username, email, and password are required.' });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters.' });
  }

  const existing = await users.findOneAsync({ email: email.toLowerCase() });
  if (existing) return res.status(409).json({ error: 'An account with that email already exists.' });

  const hash = await bcrypt.hash(password, 12);
  const doc  = await users.insertAsync({
    username:      username.trim(),
    email:         email.toLowerCase(),
    password_hash: hash,
    role:          'user',
    created_at:    new Date().toISOString(),
  });

  const user = { id: doc._id, username: doc.username, email: doc.email, role: doc.role };
  res.status(201).json({ token: makeToken(doc), user });
});

// POST /api/auth/login — accepts username or email
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Username/email and password are required.' });
  }

  const identifier = email.trim();
  const user = await users.findOneAsync({
    $or: [{ email: identifier.toLowerCase() }, { username: identifier }],
  });
  if (!user) return res.status(401).json({ error: 'Invalid username or password.' });

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) return res.status(401).json({ error: 'Invalid email or password.' });

  const safe = { id: user._id, username: user.username, email: user.email, role: user.role };
  res.json({ token: makeToken(user), user: safe });
});

// GET /api/auth/me
router.get('/me', require('../middleware/auth'), async (req, res) => {
  const user = await users.findOneAsync({ _id: req.user.id });
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json({ id: user._id, username: user.username, email: user.email, role: user.role, created_at: user.created_at });
});

module.exports = router;
