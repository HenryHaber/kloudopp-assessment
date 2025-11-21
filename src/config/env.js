// Centralized environment loader
// Loads test env (.env.test) if present in test mode, otherwise loads local 'env' file.
// Falls back to default dotenv behavior if custom file missing.
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

function load() {
  if (process.env.__ENV_LOADED) return; // idempotent
  const cwd = process.cwd();
  const isTest = process.env.NODE_ENV === 'test';
  const testFile = path.join(cwd, '.env.test');
  const localFile = path.join(cwd, 'env');
  let chosen;
  if (isTest && fs.existsSync(testFile)) {
    chosen = testFile;
  } else if (fs.existsSync(localFile)) {
    chosen = localFile;
  }
  if (chosen) {
    dotenv.config({ path: chosen });
  } else {
    dotenv.config(); // fallback to default .env
  }
  process.env.__ENV_LOADED = '1';
}

load();

module.exports = process.env;

