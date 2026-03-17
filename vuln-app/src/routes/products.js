const express = require('express');
const router = express.Router();
const { db } = require('../db/database');

// GET /products - Product listing with search
router.get('/', (req, res) => {
  const search = req.query.search || '';

  // VULNERABILITY: SQLi in search - unsanitized input directly in query
  const query = `SELECT * FROM products WHERE name LIKE '%${search}%' OR description LIKE '%${search}%'`;
  
  let products;
  try {
    products = db.prepare(query).all();
  } catch (err) {
    // VULNERABILITY: Verbose error exposes query details
    return res.status(500).send(`Error: ${err.message}<br>Query: ${query}`);
  }

  res.render('products', { title: 'Products', products, search });
});

// GET /products/:id - Product detail with reviews
router.get('/:id', (req, res) => {
  const product = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
  if (!product) return res.status(404).send('Product not found');

  // Reviews are fetched and rendered without output encoding
  const reviews = db.prepare('SELECT * FROM reviews WHERE product_id = ? ORDER BY created_at DESC').all(req.params.id);
  
  res.render('product-detail', { title: product.name, product, reviews });
});

// POST /products/:id/review - Submit a review
router.post('/:id/review', (req, res) => {
  if (!req.session.user) return res.redirect('/login');

  const { rating, comment } = req.body;
  const productId = req.params.id;
  const user = req.session.user;

  // VULNERABILITY: Stored XSS - comment is stored without sanitization
  // An attacker can inject: <script>alert('XSS')</script> as a comment
  // This will be rendered unescaped to all users viewing the product
  db.prepare(`
    INSERT INTO reviews (product_id, user_id, username, rating, comment)
    VALUES (?, ?, ?, ?, ?)
  `).run(productId, user.id, user.username, rating, comment);

  res.redirect(`/products/${productId}`);
});

module.exports = router;
