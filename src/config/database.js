const { Sequelize } = require('sequelize');
// Replace direct dotenv usage with centralized env loader
const env = require('./env');

function resolvePassword() {
  // file secret precedence
  if (env.DATABASE_PASSWORD_FILE) {
    try {
      const fs = require('fs');
      const pwd = fs.readFileSync(env.DATABASE_PASSWORD_FILE, 'utf8').trim();
      return String(pwd);
    } catch (e) {
      console.warn('DATABASE_PASSWORD_FILE read failed:', e.message);
    }
  }
  const raw = env.DATABASE_PASSWORD;
  if (raw == null) return '';
  return typeof raw === 'string' ? raw : String(raw);
}

let sequelize;
if (env.NODE_ENV === 'test') {
  sequelize = new Sequelize('sqlite::memory:', {
    dialect: 'sqlite',
    logging: false
  });
} else {
  const password = resolvePassword();
  if (!password) {
    console.warn('Warning: DATABASE_PASSWORD is empty.');
  }
  if (env.DB_DEBUG === '1') {
    console.log('[DB_DEBUG] Initializing Sequelize with params', {
      database: env.DATABASE_NAME,
      user: env.DATABASE_USER,
      host: env.DATABASE_HOST || 'localhost',
      port: env.DATABASE_PORT || 5432,
      passwordType: typeof password,
      passwordLength: password.length
    });
  }
  sequelize = new Sequelize(
    env.DATABASE_NAME,
    env.DATABASE_USER,
    password,
    {
      host: env.DATABASE_HOST || 'localhost',
      port: env.DATABASE_PORT || 5432,
      dialect: 'postgres',
      pool: {
        max: 10,
        min: 0,
        acquire: 30000,
        idle: 10000
      },
      logging: env.DB_SQL_LOG === '1' ? console.log : false
    }
  );
}

const testConnection = async () => {
  try {
    if (env.DB_DEBUG === '1') console.log('[DB_DEBUG] Authenticating...');
    await sequelize.authenticate();
    console.log('Connection has been established successfully.');
  } catch (e) {
    console.error('[DB_CONNECT_ERROR] Unable to connect to the database:', e.message);
    throw e; // rethrow so caller can handle
  }
};

module.exports = { sequelize, testConnection };
