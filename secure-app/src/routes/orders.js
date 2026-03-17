const express = require('express');
const router = express.Router();
const { db } = require('../db/database');
const { requireAuth } = require('../middleware/auth');

router.get('/', requireAuth, (req, res) => {
  const orders = db.prepare('SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC').all(req.session.user.id);
  res.render('orders', { title: 'My Orders', orders });
});

router.get('/:id', requireAuth, (req, res) => {
  const orderId = Number(req.params.id);
  if (!Number.isInteger(orderId) || orderId < 1) {
    return res.status(400).render('error', { title: 'Bad Request', message: 'Invalid order id.' });
  }

  // FIX: Authz check to prevent IDOR
  const order = db.prepare('SELECT * FROM orders WHERE id = ? AND user_id = ?').get(orderId, req.session.user.id);
  if (!order) {
    return res.status(404).render('error', { title: 'Not Found', message: 'Order not found.' });
  }

  const items = db.prepare('SELECT order_items.*, products.name, products.image FROM order_items JOIN products ON order_items.product_id = products.id WHERE order_items.order_id = ?')
    .all(orderId);

  const owner = db.prepare('SELECT username, email FROM users WHERE id = ?').get(order.user_id);
  res.render('order-detail', { title: `Order #${orderId}`, order, items, owner });
});

module.exports = router;
