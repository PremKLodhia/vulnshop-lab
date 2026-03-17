const express = require('express');
const router = express.Router();
const { db } = require('../db/database');
const { requireAuth } = require('../middleware/auth');

// GET /orders - list orders
router.get('/', requireAuth, (req, res) => {
  const userId = req.session.user.id;
  const orders = db.prepare('SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC').all(userId);
  res.render('orders', { title: 'My Orders', orders });
});

// GET /orders/:id - order detail
// VULNERABILITY: IDOR - no check that the order belongs to the logged-in user
// User can access /orders/1, /orders/2 etc and see other users' orders
router.get('/:id', requireAuth, (req, res) => {
  const orderId = req.params.id;

  // VULNERABILITY: Broken access control / IDOR
  // Should check: WHERE id = ? AND user_id = ?
  // Instead, any authenticated user can view any order by ID
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId);
  if (!order) return res.status(404).send('Order not found');

  const items = db.prepare(`
    SELECT order_items.*, products.name, products.image
    FROM order_items
    JOIN products ON order_items.product_id = products.id
    WHERE order_items.order_id = ?
  `).all(orderId);

  // Also fetch the owner's user info - leaks PII
  const owner = db.prepare('SELECT username, email FROM users WHERE id = ?').get(order.user_id);

  res.render('order-detail', { title: `Order #${orderId}`, order, items, owner });
});

module.exports = router;
