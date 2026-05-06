const express = require('express');
const pool = require('../config/db');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// POST /api/transactions/checkout — Checkout cart
router.post('/checkout', authMiddleware, async (req, res) => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Get cart items with product info
    const cartResult = await client.query(
      `SELECT ci.*, p.nama_barang, p.harga, p.stok, p.seller_id
       FROM cart_items ci
       JOIN products p ON ci.product_id = p.id
       WHERE ci.user_id = $1 AND p.deleted_at IS NULL`,
      [req.user.id]
    );

    if (cartResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Keranjang belanja kosong.' });
    }

    const transactions = [];

    for (const item of cartResult.rows) {
      // Validate stock
      if (item.quantity > item.stok) {
        await client.query('ROLLBACK');
        return res.status(400).json({
          error: `Stok "${item.nama_barang}" tidak mencukupi. Tersisa ${item.stok}.`,
        });
      }

      // Create transaction
      const txResult = await client.query(
        `INSERT INTO transactions (product_id, buyer_id, quantity, total_harga)
         VALUES ($1, $2, $3, $4)
         RETURNING *`,
        [item.product_id, req.user.id, item.quantity, item.harga * item.quantity]
      );

      transactions.push(txResult.rows[0]);

      // Deduct stock
      await client.query(
        'UPDATE products SET stok = stok - $1 WHERE id = $2',
        [item.quantity, item.product_id]
      );
    }

    // Clear cart
    await client.query('DELETE FROM cart_items WHERE user_id = $1', [req.user.id]);

    await client.query('COMMIT');

    res.status(201).json({
      message: 'Checkout berhasil!',
      transactions,
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Checkout error:', err);
    res.status(500).json({ error: 'Terjadi kesalahan saat checkout.' });
  } finally {
    client.release();
  }
});

// GET /api/transactions/purchases — Buyer's purchase history (JOIN 3 tables)
router.get('/purchases', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT t.id, t.quantity, t.total_harga, t.tanggal_transaksi,
              p.nama_barang, p.harga AS harga_satuan, p.image_url,
              u.nama AS seller_nama, u.nim AS seller_nim
       FROM transactions t
       JOIN products p ON t.product_id = p.id
       JOIN users u ON p.seller_id = u.id
       WHERE t.buyer_id = $1
       ORDER BY t.tanggal_transaksi DESC`,
      [req.user.id]
    );

    res.json({ transactions: result.rows });
  } catch (err) {
    console.error('Get purchases error:', err);
    res.status(500).json({ error: 'Terjadi kesalahan server.' });
  }
});

// GET /api/transactions/sales — Seller's sales history (JOIN 3 tables)
router.get('/sales', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT t.id, t.quantity, t.total_harga, t.tanggal_transaksi,
              p.nama_barang, p.harga AS harga_satuan, p.image_url,
              buyer.nama AS buyer_nama, buyer.nim AS buyer_nim
       FROM transactions t
       JOIN products p ON t.product_id = p.id
       JOIN users buyer ON t.buyer_id = buyer.id
       WHERE p.seller_id = $1
       ORDER BY t.tanggal_transaksi DESC`,
      [req.user.id]
    );

    res.json({ transactions: result.rows });
  } catch (err) {
    console.error('Get sales error:', err);
    res.status(500).json({ error: 'Terjadi kesalahan server.' });
  }
});

// GET /api/transactions/:id/invoice — Invoice detail (JOIN 3 tables)
router.get('/:id/invoice', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT t.id AS transaction_id, t.quantity, t.total_harga, t.tanggal_transaksi,
              p.nama_barang, p.harga AS harga_satuan, p.image_url,
              buyer.nama AS buyer_nama, buyer.nim AS buyer_nim,
              seller.nama AS seller_nama, seller.nim AS seller_nim
       FROM transactions t
       JOIN products p ON t.product_id = p.id
       JOIN users buyer ON t.buyer_id = buyer.id
       JOIN users seller ON p.seller_id = seller.id
       WHERE t.id = $1 AND (t.buyer_id = $2 OR p.seller_id = $2)`,
      [req.params.id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Invoice tidak ditemukan.' });
    }

    res.json({ invoice: result.rows[0] });
  } catch (err) {
    console.error('Get invoice error:', err);
    res.status(500).json({ error: 'Terjadi kesalahan server.' });
  }
});

module.exports = router;
