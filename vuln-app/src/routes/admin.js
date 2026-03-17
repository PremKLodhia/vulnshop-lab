const express = require('express');
const router = express.Router();
const { db } = require('../db/database');
const { requireAdminWeak } = require('../middleware/auth');

// VULNERABILITY: Weak admin middleware trusts only session role and lacks CSRF defenses.

// GET /admin - admin dashboard
router.get('/', requireAdminWeak, (req, res) => {
  const users = db.prepare('SELECT id, username, email, role, created_at FROM users').all();
  const orders = db.prepare('SELECT orders.*, users.username FROM orders JOIN users ON orders.user_id = users.id ORDER BY created_at DESC').all();
  const tickets = db.prepare('SELECT * FROM support_tickets ORDER BY created_at DESC').all();
  res.render('admin', { title: 'Admin Dashboard', users, orders, tickets });
});

// GET /admin/users/search - admin user search
router.get('/users/search', requireAdminWeak, (req, res) => {
  const q = req.query.q || '';

  // VULNERABILITY: SQLi in admin search
  const query = `SELECT id, username, email, role, bio FROM users WHERE username LIKE '%${q}%' OR email LIKE '%${q}%'`;
  
  let users;
  try {
    users = db.prepare(query).all();
  } catch (err) {
    return res.status(500).json({ error: err.message, query });
  }

  res.json({ users, query_used: query }); // VULNERABILITY: Returns raw query in response
});

// POST /admin/users/:id/delete - delete user
router.post('/users/:id/delete', requireAdminWeak, (req, res) => {
  db.prepare('DELETE FROM users WHERE id = ?').run(req.params.id);
  res.redirect('/admin');
});

// POST /admin/users/:id/role - change user role
router.post('/users/:id/role', requireAdminWeak, (req, res) => {
  const { role } = req.body;
  db.prepare('UPDATE users SET role = ? WHERE id = ?').run(role, req.params.id);
  res.redirect('/admin');
});

module.exports = router;
