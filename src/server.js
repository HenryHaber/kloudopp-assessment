const app = require('./app')
const {sequelize, testConnection} = require('./config/database');
require('dotenv').config();

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await testConnection();
    await  sequelize.sync ({ alter: process.env.NODE_ENV === 'development' });
    console.log('Database model synced successfully.');

    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Unable to connect to the database:', error.message);
    process.exit(1);
  }
}

startServer()