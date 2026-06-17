const Datastore = require('@seald-io/nedb');
const path      = require('path');
const fs        = require('fs');

// On Glitch, .data/ is a private persistent folder that survives re-imports.
// Locally (or Railway), DATA_DIR env var or fall back to ./data
const dataDir = process.env.DATA_DIR || path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

function store(name) {
  return new Datastore({ filename: path.join(dataDir, name), autoload: true });
}

const users       = store('users.db');
const reports     = store('reports.db');
const landmarks   = store('landmarks.db');
const customTypes = store('custom_types.db');

users.ensureIndex({ fieldName: 'email', unique: true });
reports.ensureIndex({ fieldName: 'date' });
reports.ensureIndex({ fieldName: 'user_id' });
reports.ensureIndex({ fieldName: 'type' });

module.exports = { users, reports, landmarks, customTypes };
