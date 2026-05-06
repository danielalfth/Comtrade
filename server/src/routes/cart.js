const express = require('express');
const pool = require('../config/db');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// GET /api/cart — Get user's cart
router.get('/', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT ci.*, p.nama_barang, p.harga, p.stok, p.image_url, p.seller_id,
              u.nama AS seller_nama
       FROM cart_items ci
       JOIN products p ON ci.product_id = p.id
       JOIN users u ON p.seller_id = u.id
       WHERE ci.user_id = $1 AND p.deleted_at IS NULL
       ORDER BY ci.created_at DESC`,
      [req.user.id]
    );

    const items = result.rows;
    const total = items.reduce((sum, item) => sum + item.harga * item.quantity, 0);

    res.json({ items, total });
  } catch (err) {
    console.error('Get cart error:', err);
    res.status(500).json({ error: 'Terjadi kesalahan server.' });
  }
});

// POST /api/cart — Add item to cart
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { product_id, quantity } = req.body;

    if (!product_id) {
      return res.status(400).json({ error: 'Product ID wajib diisi.' });
    }

    // Check product exists and is not soft-deleted
    const product = await pool.query(
      'SELECT * FROM products WHERE id = $1 AND deleted_at IS NULL',
      [product_id]
    );

    if (product.rows.length === 0) {
      return res.status(404).json({ error: 'Produk tidak ditemukan.' });
    }

    // Prevent buying own product
    if (product.rows[0].seller_id === req.user.id) {
      return res.status(400).json({ error: 'Tidak bisa membeli produk sendiri.' });
    }

    // Check stock
    const qty = parseInt(quantity) || 1;
    if (qty > product.rows[0].stok) {
      return res.status(400).json({ error: 'Stok tidak mencukupi.' });
    }

    // Upsert cart item
    const result = await pool.query(
      `INSERT INTO cart_items (user_id, product_id, quantity)
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id, product_id)
       DO UPDATE SET quantity = cart_items.quantity + $3
       RETURNING *`,
      [req.user.id, product_id, qty]
    );

    res.status(201).json({
      message: 'Produk ditambahkan ke keranjang!',
      item: result.rows[0],
    });
  } catch (err) {
    console.error('Add to cart error:', err);
    res.status(500).json({ error: 'Terjadi kesalahan server.' });
  }
});

// PUT /api/cart/:id — Update quantity
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { quantity } = req.body;

    if (!quantity || quantity < 1) {
      return res.status(400).json({ error: 'Quantity harus minimal 1.' });
    }

    // Check ownership and stock
    const cartItem = await pool.query(
      `SELECT ci.*, p.stok FROM cart_items ci
       JOIN products p ON ci.product_id = p.id
       WHERE ci.id = $1 AND ci.user_id = $2`,
      [req.params.id, req.user.id]
    );

    if (cartItem.rows.length === 0) {
      return res.status(404).json({ error: 'Item tidak ditemukan di keranjang.' });
    }

    if (quantity > cartItem.rows[0].stok) {
      return res.status(400).json({ error: 'Stok tidak mencukupi.' });
    }

    const result = await pool.query(
      'UPDATE cart_items SET quantity = $1 WHERE id = $2 RETURNING *',
      [parseInt(quantity), req.params.id]
    );

    res.json({
      message: 'Jumlah diperbarui!',
      item: result.rows[0],
    });
  } catch (err) {
    console.error('Update cart error:', err);
    res.status(500).json({ error: 'Terjadi kesalahan server.' });
  }
});

// DELETE /api/cart/:id — Remove item
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      'DELETE FROM cart_items WHERE id = $1 AND user_id = $2 RETURNING *',
      [req.params.id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Item tidak ditemukan di keranjang.' });
    }

    res.json({ message: 'Item dihapus dari keranjang.' });
  } catch (err) {
    console.error('Delete cart item error:', err);
    res.status(500).json({ error: 'Terjadi kesalahan server.' });
  }
});

module.exports = router;
