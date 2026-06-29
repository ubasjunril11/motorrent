-- Motor Rent Database Schema
CREATE DATABASE IF NOT EXISTS motor_rent;
USE motor_rent;

-- Users table (Admin and Customer roles)
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  full_name VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('admin', 'customer') NOT NULL DEFAULT 'customer',
  phone VARCHAR(20),
  avatar_url VARCHAR(500),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Motorcycles table
CREATE TABLE IF NOT EXISTS motorcycles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  brand VARCHAR(80) NOT NULL,
  model VARCHAR(80) NOT NULL,
  year INT NOT NULL,
  description TEXT,
  daily_rate DECIMAL(10, 2) NOT NULL,
  capacity INT NOT NULL DEFAULT 2,
  engine_cc INT,
  fuel_type ENUM('petrol', 'electric', 'hybrid') DEFAULT 'petrol',
  image_url VARCHAR(500),
  status ENUM('available', 'rented', 'maintenance') DEFAULT 'available',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Bookings table
CREATE TABLE IF NOT EXISTS bookings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  motorcycle_id INT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  total_price DECIMAL(10, 2) NOT NULL,
  status ENUM('pending', 'approved', 'rejected', 'completed', 'cancelled') DEFAULT 'pending',
  notes TEXT,
  admin_notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (motorcycle_id) REFERENCES motorcycles(id) ON DELETE CASCADE
);

-- Note: Run `npm run seed` in the backend folder to create the admin account and sample data.

-- Sample motorcycles (also created by seed script)
INSERT INTO motorcycles (brand, model, year, description, daily_rate, capacity, engine_cc, fuel_type, status) VALUES
('Honda', 'PCX 160', 2024, 'Stylish and fuel-efficient scooter perfect for city commuting.', 450.00, 2, 157, 'petrol', 'available'),
('Yamaha', 'NMAX 155', 2024, 'Premium scooter with excellent comfort for daily rides.', 500.00, 2, 155, 'petrol', 'available'),
('Kawasaki', 'Barako II', 2023, 'Reliable underbone motorcycle for long-distance travel.', 350.00, 2, 175, 'petrol', 'available'),
('Honda', 'Click 150i', 2023, 'Compact and easy to ride, ideal for beginners.', 400.00, 2, 149, 'petrol', 'available'),
('Yamaha', 'Mio Gear', 2024, 'Sporty design with great fuel economy.', 380.00, 2, 125, 'petrol', 'available'),
('Royal Enfield', 'Classic 350', 2023, 'Iconic cruiser for scenic road trips and touring.', 800.00, 2, 349, 'petrol', 'available');
