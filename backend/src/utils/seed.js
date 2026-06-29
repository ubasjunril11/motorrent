const bcrypt = require('bcryptjs');
const pool = require('../config/db');
require('dotenv').config();

async function seed() {
  try {
    console.log('Seeding database...');

    const adminPassword = await bcrypt.hash('Admin@123', 10);

    await pool.query(
      `INSERT INTO users (full_name, email, password_hash, role, phone)
       VALUES (?, ?, ?, 'admin', ?)
       ON DUPLICATE KEY UPDATE password_hash = VALUES(password_hash), role = 'admin'`,
      ['System Admin', 'admin@motorrent.com', adminPassword, '09000000001']
    );

    const [existing] = await pool.query('SELECT COUNT(*) as count FROM motorcycles');
    if (existing[0].count === 0) {
      await pool.query(`
        INSERT INTO motorcycles (brand, model, year, description, daily_rate, capacity, engine_cc, fuel_type, status) VALUES
        ('Honda', 'PCX 160', 2024, 'Stylish and fuel-efficient scooter perfect for city commuting.', 450.00, 2, 157, 'petrol', 'available'),
        ('Yamaha', 'NMAX 155', 2024, 'Premium scooter with excellent comfort for daily rides.', 500.00, 2, 155, 'petrol', 'available'),
        ('Kawasaki', 'Barako II', 2023, 'Reliable underbone motorcycle for long-distance travel.', 350.00, 2, 175, 'petrol', 'available'),
        ('Honda', 'Click 150i', 2023, 'Compact and easy to ride, ideal for beginners.', 400.00, 2, 149, 'petrol', 'available'),
        ('Yamaha', 'Mio Gear', 2024, 'Sporty design with great fuel economy.', 380.00, 2, 125, 'petrol', 'available'),
        ('Royal Enfield', 'Classic 350', 2023, 'Iconic cruiser for scenic road trips and touring.', 800.00, 2, 349, 'petrol', 'available')
      `);
      console.log('Sample motorcycles inserted.');
    }

    console.log('Seed completed!');
    console.log('Admin login: admin@motorrent.com / Admin@123');
    process.exit(0);
  } catch (err) {
    console.error('Seed failed:', err.message);
    process.exit(1);
  }
}

seed();
