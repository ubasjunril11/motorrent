const pool = require('../config/db');

const calculateDays = (startDate, endDate) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diff = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
  return diff > 0 ? diff : 1;
};

exports.create = async (req, res, next) => {
  try {
    const { motorcycle_id, start_date, end_date, notes } = req.body;

    if (!motorcycle_id || !start_date || !end_date) {
      return res.status(400).json({ success: false, message: 'Motorcycle, start date, and end date are required.' });
    }

    const start = new Date(start_date);
    const end = new Date(end_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (start < today) {
      return res.status(400).json({ success: false, message: 'Start date cannot be in the past.' });
    }

    if (end <= start) {
      return res.status(400).json({ success: false, message: 'End date must be after start date.' });
    }

    const [motorcycles] = await pool.query('SELECT * FROM motorcycles WHERE id = ?', [motorcycle_id]);
    if (motorcycles.length === 0) {
      return res.status(404).json({ success: false, message: 'Motorcycle not found.' });
    }

    const motorcycle = motorcycles[0];
    if (motorcycle.status !== 'available') {
      return res.status(400).json({ success: false, message: 'This motorcycle is not available for booking.' });
    }

    const [conflicts] = await pool.query(
      `SELECT id FROM bookings
       WHERE motorcycle_id = ? AND status IN ('pending', 'approved')
       AND ((start_date <= ? AND end_date >= ?) OR (start_date <= ? AND end_date >= ?) OR (start_date >= ? AND end_date <= ?))`,
      [motorcycle_id, end_date, start_date, end_date, end_date, start_date, end_date]
    );

    if (conflicts.length > 0) {
      return res.status(409).json({ success: false, message: 'Motorcycle is already booked for selected dates.' });
    }

    const days = calculateDays(start_date, end_date);
    const total_price = days * parseFloat(motorcycle.daily_rate);

    const [result] = await pool.query(
      'INSERT INTO bookings (user_id, motorcycle_id, start_date, end_date, total_price, notes) VALUES (?, ?, ?, ?, ?, ?)',
      [req.user.id, motorcycle_id, start_date, end_date, total_price, notes || null]
    );

    const [bookings] = await pool.query(
      `SELECT b.*, m.brand, m.model, m.image_url, u.full_name as customer_name
       FROM bookings b
       JOIN motorcycles m ON b.motorcycle_id = m.id
       JOIN users u ON b.user_id = u.id
       WHERE b.id = ?`,
      [result.insertId]
    );

    res.status(201).json({ success: true, message: 'Booking request submitted.', data: bookings[0] });
  } catch (err) {
    next(err);
  }
};

exports.getMyBookings = async (req, res, next) => {
  try {
    const [bookings] = await pool.query(
      `SELECT b.*, m.brand, m.model, m.image_url, m.daily_rate
       FROM bookings b
       JOIN motorcycles m ON b.motorcycle_id = m.id
       WHERE b.user_id = ?
       ORDER BY b.created_at DESC`,
      [req.user.id]
    );
    res.json({ success: true, data: bookings, count: bookings.length });
  } catch (err) {
    next(err);
  }
};

exports.getById = async (req, res, next) => {
  try {
    const [bookings] = await pool.query(
      `SELECT b.*, m.brand, m.model, m.image_url, m.daily_rate, u.full_name as customer_name, u.email as customer_email
       FROM bookings b
       JOIN motorcycles m ON b.motorcycle_id = m.id
       JOIN users u ON b.user_id = u.id
       WHERE b.id = ?`,
      [req.params.id]
    );

    if (bookings.length === 0) {
      return res.status(404).json({ success: false, message: 'Booking not found.' });
    }

    const booking = bookings[0];
    if (req.user.role === 'customer' && booking.user_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    res.json({ success: true, data: booking });
  } catch (err) {
    next(err);
  }
};

exports.cancel = async (req, res, next) => {
  try {
    const [bookings] = await pool.query('SELECT * FROM bookings WHERE id = ? AND user_id = ?', [
      req.params.id,
      req.user.id,
    ]);

    if (bookings.length === 0) {
      return res.status(404).json({ success: false, message: 'Booking not found.' });
    }

    if (!['pending', 'approved'].includes(bookings[0].status)) {
      return res.status(400).json({ success: false, message: 'This booking cannot be cancelled.' });
    }

    await pool.query("UPDATE bookings SET status = 'cancelled' WHERE id = ?", [req.params.id]);
    res.json({ success: true, message: 'Booking cancelled.' });
  } catch (err) {
    next(err);
  }
};

exports.getAll = async (req, res, next) => {
  try {
    const { status } = req.query;
    let query = `
      SELECT b.*, m.brand, m.model, m.image_url, u.full_name as customer_name, u.email as customer_email, u.phone as customer_phone
      FROM bookings b
      JOIN motorcycles m ON b.motorcycle_id = m.id
      JOIN users u ON b.user_id = u.id
    `;
    const params = [];

    if (status) {
      query += ' WHERE b.status = ?';
      params.push(status);
    }

    query += ' ORDER BY b.created_at DESC';

    const [bookings] = await pool.query(query, params);
    res.json({ success: true, data: bookings, count: bookings.length });
  } catch (err) {
    next(err);
  }
};

exports.updateStatus = async (req, res, next) => {
  try {
    const { status, admin_notes } = req.body;
    const validStatuses = ['pending', 'approved', 'rejected', 'completed', 'cancelled'];

    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'Valid status is required.' });
    }

    const [bookings] = await pool.query('SELECT * FROM bookings WHERE id = ?', [req.params.id]);
    if (bookings.length === 0) {
      return res.status(404).json({ success: false, message: 'Booking not found.' });
    }

    await pool.query('UPDATE bookings SET status = ?, admin_notes = ? WHERE id = ?', [
      status,
      admin_notes || bookings[0].admin_notes,
      req.params.id,
    ]);

    const booking = bookings[0];
    if (status === 'approved') {
      await pool.query("UPDATE motorcycles SET status = 'rented' WHERE id = ?", [booking.motorcycle_id]);
    } else if (status === 'completed' || status === 'rejected' || status === 'cancelled') {
      await pool.query("UPDATE motorcycles SET status = 'available' WHERE id = ?", [booking.motorcycle_id]);
    }

    const [updated] = await pool.query(
      `SELECT b.*, m.brand, m.model, u.full_name as customer_name
       FROM bookings b JOIN motorcycles m ON b.motorcycle_id = m.id JOIN users u ON b.user_id = u.id
       WHERE b.id = ?`,
      [req.params.id]
    );

    res.json({ success: true, message: `Booking ${status}.`, data: updated[0] });
  } catch (err) {
    next(err);
  }
};

exports.getStats = async (_req, res, next) => {
  try {
    const [[motorcycleStats]] = await pool.query(
      "SELECT COUNT(*) as total, SUM(status='available') as available, SUM(status='rented') as rented FROM motorcycles"
    );
    const [[bookingStats]] = await pool.query(
      "SELECT COUNT(*) as total, SUM(status='pending') as pending, SUM(status='approved') as approved FROM bookings"
    );
    const [[customerStats]] = await pool.query(
      "SELECT COUNT(*) as total FROM users WHERE role = 'customer'"
    );
    const [[revenue]] = await pool.query(
      "SELECT COALESCE(SUM(total_price), 0) as total_revenue FROM bookings WHERE status IN ('approved', 'completed')"
    );

    res.json({
      success: true,
      data: {
        motorcycles: motorcycleStats,
        bookings: bookingStats,
        customers: customerStats,
        revenue: revenue.total_revenue,
      },
    });
  } catch (err) {
    next(err);
  }
};
