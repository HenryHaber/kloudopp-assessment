const {sequelize} = require('../config/database');
const env = require('../config/env');

const runMigrations = async () => {
  try {
    await sequelize.authenticate();
    console.log('Database connection established successfully.');
    await sequelize.sync({force: env.FORCE_SYNC === 'true'});
    console.log('Running migrations...');
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