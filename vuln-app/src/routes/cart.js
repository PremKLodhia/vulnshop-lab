const express = require('express');
const router = express.Router();
const { db } = require('../db/database');
const { requireAuth } = require('../middleware/auth');

// GET /cart
router.get('/', requireAuth, (req, res) => {
  const userId = req.session.user.id;
  const items = db.prepare(`
    SELECT cart.id, cart.quantity, products.name, products.price, products.image, products.id as product_id
    FROM cart
    JOIN products ON cart.product_id = products.id
    WHERE cart.user_id = ?
  `).all(userId);

  const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  res.render('cart', { title: 'Shopping Cart', items, total });
});

// POST /cart/add
router.post('/add', requireAuth, (req, res) => {
  const { productId, quantity } = req.body;
  const userId = req.session.user.id;

  const existing = db.prepare('SELECT * FROM cart WHERE user_id = ? AND product_id = ?').get(userId, productId);
  if (existing) {
    db.prepare('UPDATE cart SET quantity = quantity + ? WHERE user_id = ? AND product_id = ?').run(
      parseInt(quantity) || 1, userId, productId
    );
  } else {
    db.prepare('INSERT INTO cart (user_id, product_id, quantity) VALUES (?, ?, ?)').run(
      userId, productId, parseInt(quantity) || 1
    );
  }

  res.redirect('/cart');
});

// POST /cart/remove
router.post('/remove', requireAuth, (req, res) => {
  const { cartItemId } = req.body;
  const userId = req.session.user.id;

  // VULNERABILITY: IDOR - no check that the cart item belongs to the logged-in user
  // Any user can remove any cart item if they know the cartItemId
  db.prepare('DELETE FROM cart WHERE id = ?').run(cartItemId);
  res.redirect('/cart');
});

// POST /cart/checkout
router.post('/checkout', requireAuth, (req, res) => {
  const userId = req.session.user.id;
  const items = db.prepare(`
    SELECT cart.quantity, products.price, products.id as product_id
    FROM cart
    JOIN products ON cart.product_id = products.id
    WHERE cart.user_id = ?
  `).all(userId);

  if (items.length === 0) return res.redirect('/cart');

  const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const order = db.prepare('INSERT INTO orders (user_id, total, status) VALUES (?, ?, ?)').run(userId, total, 'pending');

  const insertItem = db.prepare('INSERT INTO order_items (order_id, product_id, quantity, price) VALUES (?, ?, ?, ?)');
  items.forEach(item => insertItem.run(order.lastInsertRowid, item.product_id, item.quantity, item.price));

  db.prepare('DELETE FROM cart WHERE user_id = ?').run(userId);
  res.redirect('/orders');
});

module.exports = router;
