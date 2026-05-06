const express = require('express');
const pool = require('../config/db');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM categories ORDER BY nama_kategori ASC');
    res.json({ categories: result.rows });
  } catch (err) {
    console.error('Get categories error:', err);
    res.status(500).json({ error: 'Terjadi kesalahan server.' });
  }
});

router.post('/', authMiddleware, async (req, res) => {
  try {
    const { nama_kategori } = req.body;
    if (!nama_kategori) return res.status(400).json({ error: 'Nama kategori wajib diisi.' });

    const existing = await pool.query('SELECT id FROM categories WHERE LOWER(nama_kategori) = LOWER($1)', [nama_kategori]);
    if (existing.rows.length > 0) return res.status(409).json({ error: 'Kategori sudah ada.' });

    const result = await pool.query('INSERT INTO categories (nama_kategori) VALUES ($1) RETURNING *', [nama_kategori]);
    res.status(201).json({ message: 'Kategori berhasil ditambahkan!', category: result.rows[0] });
  } catch (err) {
    console.error('Create category error:', err);
    res.status(500).json({ error: 'Terjadi kesalahan server.' });
  }
});

module.exports = router;
