const bcrypt = require('bcryptjs');
const pool = require('../config/db');

exports.getAllCustomers = async (req, res, next) => {
  try {
    const { search, is_active } = req.query;
    let query = "SELECT id, full_name, email, phone, avatar_url, is_active, created_at FROM users WHERE role = 'customer'";
    const params = [];

    if (search) {
      query += ' AND (full_name LIKE ? OR email LIKE ? OR phone LIKE ?)';
      const term = `%${search}%`;
      params.push(term, term, term);
    }

    if (is_active !== undefined) {
      query += ' AND is_active = ?';
      params.push(is_active === 'true' || is_active === '1');
    }

    query += ' ORDER BY created_at DESC';

    const [customers] = await pool.query(query, params);
    res.json({ success: true, data: customers, count: customers.length });
  } catch (err) {
    next(err);
  }
};

exports.getCustomerById = async (req, res, next) => {
  try {
    const [customers] = await pool.query(
      "SELECT id, full_name, email, phone, avatar_url, is_active, created_at FROM users WHERE id = ? AND role = 'customer'",
      [req.params.id]
    );

    if (customers.length === 0) {
      return res.status(404).json({ success: false, message: 'Customer not found.' });
    }

    const [bookings] = await pool.query(
      `SELECT b.*, m.brand, m.model FROM bookings b
       JOIN motorcycles m ON b.motorcycle_id = m.id
       WHERE b.user_id = ? ORDER BY b.created_at DESC`,
      [req.params.id]
    );

    res.json({ success: true, data: { ...customers[0], bookings } });
  } catch (err) {
    next(err);
  }
};

exports.toggleCustomerStatus = async (req, res, next) => {
  try {
    const [customers] = await pool.query(
      "SELECT id, is_active FROM users WHERE id = ? AND role = 'customer'",
      [req.params.id]
    );

    if (customers.length === 0) {
      return res.status(404).json({ success: false, message: 'Customer not found.' });
    }

    const newStatus = !customers[0].is_active;
    await pool.query('UPDATE users SET is_active = ? WHERE id = ?', [newStatus, req.params.id]);

    res.json({
      success: true,
      message: newStatus ? 'Customer account activated.' : 'Customer account deactivated.',
      data: { id: parseInt(req.params.id, 10), is_active: newStatus },
    });
  } catch (err) {
    next(err);
  }
};

exports.deleteCustomer = async (req, res, next) => {
  try {
    const [customers] = await pool.query(
      "SELECT id FROM users WHERE id = ? AND role = 'customer'",
      [req.params.id]
    );

    if (customers.length === 0) {
      return res.status(404).json({ success: false, message: 'Customer not found.' });
    }

    const [activeBookings] = await pool.query(
      "SELECT id FROM bookings WHERE user_id = ? AND status IN ('pending', 'approved')",
      [req.params.id]
    );

    if (activeBookings.length > 0) {
      return res.status(400).json({ success: false, message: 'Cannot delete customer with active bookings.' });
    }

    await pool.query('DELETE FROM users WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'Customer deleted.' });
  } catch (err) {
    next(err);
  }
};

exports.createAdmin = async (req, res, next) => {
  try {
    const { full_name, email, password, phone } = req.body;

    if (!full_name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Full name, email, and password are required.' });
    }

    const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [email.toLowerCase()]);
    if (existing.length > 0) {
      return res.status(409).json({ success: false, message: 'Email already exists.' });
    }

    const password_hash = await bcrypt.hash(password, 10);
    const [result] = await pool.query(
      'INSERT INTO users (full_name, email, password_hash, role, phone) VALUES (?, ?, ?, ?, ?)',
      [full_name, email.toLowerCase(), password_hash, 'admin', phone || null]
    );

    res.status(201).json({
      success: true,
      message: 'Admin account created.',
      data: { id: result.insertId, full_name, email: email.toLowerCase(), role: 'admin' },
    });
  } catch (err) {
    next(err);
  }
};
