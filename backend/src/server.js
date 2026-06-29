const app = require('./app');
const os = require('os');
const pool = require('./config/db');
require('dotenv').config();

const PORT = process.env.PORT || 5000;
const HOST = '0.0.0.0';

async function startServer() {
  try {
    await pool.query('SELECT 1');
    console.log('MySQL connected successfully');
    console.log(`Database: ${process.env.DB_NAME} @ ${process.env.DB_HOST}:${process.env.DB_PORT || 3306}`);
  } catch (err) {
    console.error('MySQL connection FAILED:', err.message);
    console.error('Make sure XAMPP MySQL is running and backend/.env credentials are correct.');
    process.exit(1);
  }

  app.listen(PORT, HOST, () => {
    console.log(`Motor Rent API running on http://localhost:${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);

    const nets = os.networkInterfaces();
    Object.values(nets)
      .flat()
      .filter((n) => n && n.family === 'IPv4' && !n.internal)
      .forEach((n) => {
        console.log(`  Phone/LAN access: http://${n.address}:${PORT}/api`);
      });
  });
}

startServer();
