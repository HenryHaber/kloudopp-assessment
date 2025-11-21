const app = require('./app')
const {sequelize, testConnection} = require('./config/database');
const env = require('./config/env');

const PORT = env.PORT || 5000;

const startServer = async () => {
  try {
    await testConnection();
    await sequelize.sync({ alter: env.NODE_ENV === 'development' });
    console.log('Database model synced successfully.');
    const server = app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.error(`Port ${PORT} already in use. Set PORT to a free port or free the existing process.`);
        process.exit(1);
      }
    });
    const shutdown = async () => {
      console.log('Shutting down gracefully...');
      try { await sequelize.close(); } catch (_) {}
      server.close(() => process.exit(0));
    };
    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
  } catch (error) {
    console.error('Unable to connect to the database:', error.message);
    process.exit(1);
  }
}

startServer()