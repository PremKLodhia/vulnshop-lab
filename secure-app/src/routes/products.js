const express = require('express');
const router = express.Router();
const { db } = require('../db/database');
const { requireAuth } = require('../middleware/auth');

router.get('/', (req, res) => {
  const search = (req.query.search || '').trim();

  // FIX: Parameterized query to prevent SQL injection in search
  const like = `%${search}%`;
  const products = db.prepare('SELECT * FROM products WHERE name LIKE ? OR description LIKE ?').all(like, like);

  res.render('products', { title: 'Products', products, search });
});

router.get('/:id', (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id < 1) {
    return res.status(400).render('error', { title: 'Bad Request', message: 'Invalid product id.' });
  }

  const product = db.prepare('SELECT * FROM products WHERE id = ?').get(id);
  if (!product) return res.status(404).render('error', { title: 'Not Found', message: 'Product not found.' });

  // FIX: Reviews are rendered with escaped EJS output in the secure templates.
  const reviews = db.prepare('SELECT * FROM reviews WHERE product_id = ? ORDER BY created_at DESC').all(id);
  res.render('product-detail', { title: product.name, product, reviews });
});

router.post('/:id/review', requireAuth, (req, res) => {
  const productId = Number(req.params.id);
  const rating = Number(req.body.rating);
  const comment = (req.body.comment || '').slice(0, 1000);
  const user = req.session.user;

  if (!Number.isInteger(productId) || productId < 1 || !Number.isInteger(rating) || rating < 1 || rating > 5) {
    return res.status(400).render('error', { title: 'Bad Request', message: 'Invalid review input.' });
  }

  // FIX: Store bounded input and rely on escaped output to prevent stored XSS execution.
  db.prepare('INSERT INTO reviews (product_id, user_id, username, rating, comment) VALUES (?, ?, ?, ?, ?)')
    .run(productId, user.id, user.username, rating, comment);

  res.redirect(`/products/${productId}`);
});

module.exports = router;
