const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { nama, nim, password } = req.body;

    if (!nama || !nim || !password) {
      return res.status(400).json({ error: 'Nama, NIM, dan Password wajib diisi.' });
    }

    // Check if user already exists
    const existingUser = await pool.query(
      'SELECT id FROM users WHERE nim = $1 OR nama = $2',
      [nim, nama]
    );

    if (existingUser.rows.length > 0) {
      return res.status(409).json({
        error: 'Akun sudah didaftarkan, silahkan login.',
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Insert user
    const result = await pool.query(
      'INSERT INTO users (nama, nim, password) VALUES ($1, $2, $3) RETURNING id, nama, nim, created_at',
      [nama, nim, hashedPassword]
    );

    const user = result.rows[0];
    const token = jwt.sign(
      { id: user.id, nama: user.nama, nim: user.nim },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(201).json({
      message: 'Registrasi berhasil!',
      token,
      user: { id: user.id, nama: user.nama, nim: user.nim },
    });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Terjadi kesalahan server.' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { credential, password } = req.body;

    if (!credential || !password) {
      return res.status(400).json({ error: 'NIM/Nama dan Password wajib diisi.' });
    }

    // Find user by NIM or Nama
    const result = await pool.query(
      'SELECT * FROM users WHERE nim = $1 OR nama = $1',
      [credential]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Kredensial tidak valid.' });
    }

    const user = result.rows[0];
    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      return res.status(401).json({ error: 'Kredensial tidak valid.' });
    }

    const token = jwt.sign(
      { id: user.id, nama: user.nama, nim: user.nim },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      message: 'Login berhasil!',
      token,
      user: { id: user.id, nama: user.nama, nim: user.nim },
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Terjadi kesalahan server.' });
  }
});

// GET /api/auth/me
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, nama, nim, created_at FROM users WHERE id = $1',
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User tidak ditemukan.' });
    }

    res.json({ user: result.rows[0] });
  } catch (err) {
    console.error('Get me error:', err);
    res.status(500).json({ error: 'Terjadi kesalahan server.' });
  }
});

module.exports = router;
