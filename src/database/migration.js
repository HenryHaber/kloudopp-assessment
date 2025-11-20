const {sequelize} = require('../config/database');
require('dotenv').config();


const runMigrations = async () => {
  try {
    await sequelize.authenticate();
    console.log('Database connection established successfully.');

    // Run migrations
    await sequelize.sync({force: process.env.FORCE_SYNC === 'true'});
    console.log('Running migrations...');

    // Here you would typically use a migration tool like Sequelize CLI or Umzug
    // For demonstration, we will just log that migrations are run
    console.log('Migrations completed successfully.');

    process.exit(0)
  } catch (error) {
    console.error('Error running migrations:', error.message);
    process.exit(1)
  } finally {
    await sequelize.close();
  }
}



runMigrations()