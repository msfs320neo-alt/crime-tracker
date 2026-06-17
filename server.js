require('dotenv').config();
const express  = require('express');
const bcrypt   = require('bcryptjs');
const path     = require('path');
const supabase = require('./db');

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/api/auth',      require('./routes/auth'));
app.use('/api/reports',   require('./routes/reports'));
app.use('/api/landmarks', require('./routes/landmarks'));
app.use('/api/admin',     require('./routes/admin'));
app.use('/api/upload',    require('./routes/upload'));

app.get(/^(?!\/api).*$/, (req, res) =>
  res.sendFile(path.join(__dirname, 'public', 'index.html'))
);

async function seedAdmin() {
  const { data: existing } = await supabase.from('users').select('id').eq('username', 'admin').maybeSingle();
  if (!existing) {
    const hash = await bcrypt.hash('pigshoes', 12);
    await supabase.from('users').insert({ username: 'admin', email: 'admin@local', password_hash: hash, role: 'admin' });
    console.log('  ✔  Admin account created (admin / pigshoes)');
  }
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, async () => {
  console.log(`\n  🛡️  Neighborhood Crime Tracker`);
  console.log(`  Running at http://localhost:${PORT}\n`);
  await seedAdmin();
});
