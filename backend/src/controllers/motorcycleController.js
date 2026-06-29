const fs = require('fs');
const path = require('path');
const pool = require('../config/db');

const uploadDir = process.env.UPLOAD_DIR || 'uploads';
const uploadRoot = path.join(__dirname, '../../', uploadDir);

const deleteLocalImage = (imageUrl) => {
  if (!imageUrl || !imageUrl.startsWith('/uploads/')) return;
  const filePath = path.join(uploadRoot, path.basename(imageUrl));
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
};

exports.getAll = async (req, res, next) => {
  try {
    const { status, search, min_price, max_price, capacity } = req.query;
    let query = 'SELECT * FROM motorcycles WHERE 1=1';
    const params = [];

    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }

    if (search) {
      query += ' AND (brand LIKE ? OR model LIKE ? OR description LIKE ?)';
      const term = `%${search}%`;
      params.push(term, term, term);
    }

    if (min_price) {
      query += ' AND daily_rate >= ?';
      params.push(parseFloat(min_price));
    }

    if (max_price) {
      query += ' AND daily_rate <= ?';
      params.push(parseFloat(max_price));
    }

    if (capacity) {
      query += ' AND capacity >= ?';
      params.push(parseInt(capacity, 10));
    }

    query += ' ORDER BY created_at DESC';

    const [motorcycles] = await pool.query(query, params);
    res.json({ success: true, data: motorcycles, count: motorcycles.length });
  } catch (err) {
    next(err);
  }
};

exports.getById = async (req, res, next) => {
  try {
    const [motorcycles] = await pool.query('SELECT * FROM motorcycles WHERE id = ?', [req.params.id]);
    if (motorcycles.length === 0) {
      return res.status(404).json({ success: false, message: 'Motorcycle not found.' });
    }
    res.json({ success: true, data: motorcycles[0] });
  } catch (err) {
    next(err);
  }
};

exports.create = async (req, res, next) => {
  try {
    const { brand, model, year, description, daily_rate, capacity, engine_cc, fuel_type, status } = req.body;

    if (!brand || !model || !year || !daily_rate) {
      return res.status(400).json({ success: false, message: 'Brand, model, year, and daily rate are required.' });
    }

    const image_url = req.file ? `/uploads/${req.file.filename}` : null;

    const [result] = await pool.query(
      `INSERT INTO motorcycles (brand, model, year, description, daily_rate, capacity, engine_cc, fuel_type, image_url, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        brand,
        model,
        parseInt(year, 10),
        description || null,
        parseFloat(daily_rate),
        capacity ? parseInt(capacity, 10) : 2,
        engine_cc ? parseInt(engine_cc, 10) : null,
        fuel_type || 'petrol',
        image_url,
        status || 'available',
      ]
    );

    const [motorcycles] = await pool.query('SELECT * FROM motorcycles WHERE id = ?', [result.insertId]);
    res.status(201).json({ success: true, message: 'Motorcycle added.', data: motorcycles[0] });
  } catch (err) {
    next(err);
  }
};

exports.update = async (req, res, next) => {
  try {
    const { id } = req.params;
    const [existing] = await pool.query('SELECT * FROM motorcycles WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Motorcycle not found.' });
    }

    const { brand, model, year, description, daily_rate, capacity, engine_cc, fuel_type, status } = req.body;
    const image_url = req.file ? `/uploads/${req.file.filename}` : existing[0].image_url;

    if (req.file && existing[0].image_url) {
      deleteLocalImage(existing[0].image_url);
    }

    await pool.query(
      `UPDATE motorcycles SET brand=?, model=?, year=?, description=?, daily_rate=?, capacity=?,
       engine_cc=?, fuel_type=?, image_url=?, status=? WHERE id=?`,
      [
        brand || existing[0].brand,
        model || existing[0].model,
        year ? parseInt(year, 10) : existing[0].year,
        description !== undefined ? description : existing[0].description,
        daily_rate ? parseFloat(daily_rate) : existing[0].daily_rate,
        capacity ? parseInt(capacity, 10) : existing[0].capacity,
        engine_cc ? parseInt(engine_cc, 10) : existing[0].engine_cc,
        fuel_type || existing[0].fuel_type,
        image_url,
        status || existing[0].status,
        id,
      ]
    );

    const [motorcycles] = await pool.query('SELECT * FROM motorcycles WHERE id = ?', [id]);
    res.json({ success: true, message: 'Motorcycle updated.', data: motorcycles[0] });
  } catch (err) {
    next(err);
  }
};

exports.remove = async (req, res, next) => {
  try {
    const { id } = req.params;
    const [existing] = await pool.query('SELECT id FROM motorcycles WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Motorcycle not found.' });
    }

    const [activeBookings] = await pool.query(
      "SELECT id FROM bookings WHERE motorcycle_id = ? AND status IN ('pending', 'approved')",
      [id]
    );
    if (activeBookings.length > 0) {
      return res.status(400).json({ success: false, message: 'Cannot delete motorcycle with active bookings.' });
    }

    await pool.query('DELETE FROM motorcycles WHERE id = ?', [id]);
    res.json({ success: true, message: 'Motorcycle deleted.' });
  } catch (err) {
    next(err);
  }
};

exports.getFeatured = async (_req, res, next) => {
  try {
    const [motorcycles] = await pool.query(
      "SELECT * FROM motorcycles WHERE status = 'available' ORDER BY created_at DESC LIMIT 6"
    );
    res.json({ success: true, data: motorcycles });
  } catch (err) {
    next(err);
  }
};
