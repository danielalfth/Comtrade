const express = require('express');
const pool = require('../config/db');
const authMiddleware = require('../middleware/auth');
const upload = require('../middleware/upload');

const router = express.Router();

// GET /api/products
router.get('/', async (req, res) => {
  try {
    const { search, category_id } = req.query;
    let query = `
      SELECT p.*, u.nama AS seller_nama, u.nim AS seller_nim, c.nama_kategori
      FROM products p
      JOIN users u ON p.seller_id = u.id
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.deleted_at IS NULL
    `;
    const params = [];
    if (search) {
      params.push(`%${search}%`);
      query += ` AND (p.nama_barang ILIKE $${params.length} OR u.nama ILIKE $${params.length})`;
    }
    if (category_id) {
      params.push(category_id);
      query += ` AND p.category_id = $${params.length}`;
    }
    query += ' ORDER BY p.created_at DESC';
    const result = await pool.query(query, params);
    res.json({ products: result.rows });
  } catch (err) {
    console.error('Get products error:', err);
    res.status(500).json({ error: 'Terjadi kesalahan server.' });
  }
});

// GET /api/products/mine
router.get('/mine', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT p.*, c.nama_kategori FROM products p
       LEFT JOIN categories c ON p.category_id = c.id
       WHERE p.seller_id = $1
       ORDER BY p.deleted_at ASC NULLS FIRST, p.created_at DESC`,
      [req.user.id]
    );
    res.json({ products: result.rows });
  } catch (err) {
    console.error('Get my products error:', err);
    res.status(500).json({ error: 'Terjadi kesalahan server.' });
  }
});

// GET /api/products/:id
router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT p.*, u.nama AS seller_nama, u.nim AS seller_nim, c.nama_kategori
       FROM products p JOIN users u ON p.seller_id = u.id
       LEFT JOIN categories c ON p.category_id = c.id
       WHERE p.id = $1`,
      [req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Produk tidak ditemukan.' });
    res.json({ product: result.rows[0] });
  } catch (err) {
    console.error('Get product error:', err);
    res.status(500).json({ error: 'Terjadi kesalahan server.' });
  }
});

// POST /api/products
router.post('/', authMiddleware, upload.single('image'), async (req, res) => {
  try {
    const { nama_barang, harga, stok, category_id } = req.body;
    if (!nama_barang || !harga) return res.status(400).json({ error: 'Nama barang dan harga wajib diisi.' });

    let image_url = null;
    if (req.file) {
      image_url = `http://localhost:${process.env.PORT || 5000}/uploads/${req.file.filename}`;
    }

    const result = await pool.query(
      `INSERT INTO products (seller_id, category_id, nama_barang, harga, stok, image_url)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [req.user.id, category_id || null, nama_barang, parseInt(harga), parseInt(stok) || 0, image_url]
    );
    res.status(201).json({ message: 'Produk berhasil ditambahkan!', product: result.rows[0] });
  } catch (err) {
    console.error('Create product error:', err);
    res.status(500).json({ error: 'Terjadi kesalahan saat menambahkan produk.' });
  }
});

// PUT /api/products/:id
router.put('/:id', authMiddleware, upload.single('image'), async (req, res) => {
  try {
    const check = await pool.query('SELECT * FROM products WHERE id = $1 AND seller_id = $2', [req.params.id, req.user.id]);
    if (check.rows.length === 0) return res.status(403).json({ error: 'Akses ditolak.' });

    const { nama_barang, harga, stok, category_id } = req.body;
    const existing = check.rows[0];
    let image_url = existing.image_url;

    if (req.file) {
      // In a real app we might delete the old local file here using fs.unlink
      image_url = `http://localhost:${process.env.PORT || 5000}/uploads/${req.file.filename}`;
    }

    const result = await pool.query(
      `UPDATE products SET nama_barang=$1, harga=$2, stok=$3, category_id=$4, image_url=$5 WHERE id=$6 RETURNING *`,
      [nama_barang || existing.nama_barang, parseInt(harga) || existing.harga,
       stok !== undefined ? parseInt(stok) : existing.stok, category_id || existing.category_id, image_url, req.params.id]
    );
    res.json({ message: 'Produk berhasil diperbarui!', product: result.rows[0] });
  } catch (err) {
    console.error('Update product error:', err);
    res.status(500).json({ error: 'Terjadi kesalahan saat memperbarui produk.' });
  }
});

// DELETE /api/products/:id
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const { type } = req.query;
    const check = await pool.query('SELECT * FROM products WHERE id = $1 AND seller_id = $2', [req.params.id, req.user.id]);
    if (check.rows.length === 0) return res.status(403).json({ error: 'Akses ditolak.' });

    if (type === 'hard') {
      // In a real app we might delete the local file using fs.unlink
      await pool.query('DELETE FROM products WHERE id = $1', [req.params.id]);
      res.json({ message: 'Produk berhasil dihapus permanen.' });
    } else {
      await pool.query('UPDATE products SET deleted_at = CURRENT_TIMESTAMP WHERE id = $1', [req.params.id]);
      res.json({ message: 'Produk berhasil diarsipkan.' });
    }
  } catch (err) {
    console.error('Delete product error:', err);
    res.status(500).json({ error: 'Terjadi kesalahan server.' });
  }
});

// PATCH /api/products/:id/restore
router.patch('/:id/restore', authMiddleware, async (req, res) => {
  try {
    const check = await pool.query('SELECT * FROM products WHERE id = $1 AND seller_id = $2', [req.params.id, req.user.id]);
    if (check.rows.length === 0) return res.status(403).json({ error: 'Akses ditolak.' });
    await pool.query('UPDATE products SET deleted_at = NULL WHERE id = $1', [req.params.id]);
    res.json({ message: 'Produk berhasil dipulihkan.' });
  } catch (err) {
    console.error('Restore product error:', err);
    res.status(500).json({ error: 'Terjadi kesalahan server.' });
  }
});

module.exports = router;
