const express = require('express');
const bcrypt  = require('bcryptjs');
const path    = require('path');
const { users } = require('./db');

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
// Serve uploaded photos from persistent data dir (DATA_DIR on Glitch = /app/.data)
const dataDir = process.env.DATA_DIR || path.join(__dirname, 'data');
app.use('/uploads', express.static(path.join(dataDir, 'uploads')));

app.use('/api/auth',      require('./routes/auth'));
app.use('/api/reports',   require('./routes/reports'));
app.use('/api/landmarks', require('./routes/landmarks'));
app.use('/api/admin',     require('./routes/admin'));
app.use('/api/upload',    require('./routes/upload'));

app.get(/^(?!\/api).*$/, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

async function seedAdmin() {
  const existing = await users.findOneAsync({ username: 'admin' });
  if (!existing) {
    const hash = await bcrypt.hash('pigshoes', 12);
    await users.insertAsync({
      username:      'admin',
      email:         'admin@local',
      password_hash: hash,
      role:          'admin',
      created_at:    new Date().toISOString(),
    });
    console.log('  ✔  Admin account created (admin / pigshoes)');
  }
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, async () => {
  console.log(`\n  🛡️  Neighborhood Crime Tracker`);
  console.log(`  Running at http://localhost:${PORT}\n`);
  await seedAdmin();
});
