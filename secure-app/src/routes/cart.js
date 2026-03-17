const express = require('express');
const router = express.Router();
const { db } = require('../db/database');
const { requireAuth } = require('../middleware/auth');

router.get('/', requireAuth, (req, res) => {
  const userId = req.session.user.id;
  const items = db.prepare('SELECT cart.id, cart.quantity, products.name, products.price, products.image, products.id as product_id FROM cart JOIN products ON cart.product_id = products.id WHERE cart.user_id = ?')
    .all(userId);

  const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  res.render('cart', { title: 'Shopping Cart', items, total });
});

router.post('/add', requireAuth, (req, res) => {
  const productId = Number(req.body.productId);
  const quantity = Number(req.body.quantity || 1);
  const userId = req.session.user.id;

  if (!Number.isInteger(productId) || productId < 1 || !Number.isInteger(quantity) || quantity < 1 || quantity > 10) {
    return res.status(400).render('error', { title: 'Bad Request', message: 'Invalid cart input.' });
  }

  const existing = db.prepare('SELECT * FROM cart WHERE user_id = ? AND product_id = ?').get(userId, productId);
  if (existing) {
    db.prepare('UPDATE cart SET quantity = quantity + ? WHERE user_id = ? AND product_id = ?').run(quantity, userId, productId);
  } else {
    db.prepare('INSERT INTO cart (user_id, product_id, quantity) VALUES (?, ?, ?)').run(userId, productId, quantity);
  }

  res.redirect('/cart');
});

router.post('/remove', requireAuth, (req, res) => {
  const cartItemId = Number(req.body.cartItemId);
  if (!Number.isInteger(cartItemId) || cartItemId < 1) {
    return res.status(400).render('error', { title: 'Bad Request', message: 'Invalid cart item id.' });
  }

  // FIX: Authz check prevents IDOR by requiring ownership
  db.prepare('DELETE FROM cart WHERE id = ? AND user_id = ?').run(cartItemId, req.session.user.id);
  res.redirect('/cart');
});

router.post('/checkout', requireAuth, (req, res) => {
  const userId = req.session.user.id;
  const items = db.prepare('SELECT cart.quantity, products.price, products.id as product_id FROM cart JOIN products ON cart.product_id = products.id WHERE cart.user_id = ?')
    .all(userId);

  if (items.length === 0) return res.redirect('/cart');

  const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const order = db.prepare('INSERT INTO orders (user_id, total, status) VALUES (?, ?, ?)').run(userId, total, 'pending');

  const insertItem = db.prepare('INSERT INTO order_items (order_id, product_id, quantity, price) VALUES (?, ?, ?, ?)');
  items.forEach((item) => insertItem.run(order.lastInsertRowid, item.product_id, item.quantity, item.price));

  db.prepare('DELETE FROM cart WHERE user_id = ?').run(userId);
  res.redirect('/orders');
});

module.exports = router;
