const express = require('express');
const router = express.Router();
const { db } = require('../db/database');
const { requireAdmin } = require('../middleware/auth');

// FIX: Centralized admin authorization middleware replaces ad-hoc role checks.
router.get('/', requireAdmin, (req, res) => {
  const users = db.prepare('SELECT id, username, email, role, created_at FROM users').all();
  const orders = db.prepare('SELECT orders.*, users.username FROM orders JOIN users ON orders.user_id = users.id ORDER BY created_at DESC').all();
  const tickets = db.prepare('SELECT * FROM support_tickets ORDER BY created_at DESC').all();
  res.render('admin', { title: 'Admin Dashboard', users, orders, tickets });
});

router.get('/users/search', requireAdmin, (req, res) => {
  const q = (req.query.q || '').trim().slice(0, 80);
  const like = `%${q}%`;

  // FIX: Parameterized query to prevent SQL injection
  const users = db.prepare('SELECT id, username, email, role, bio FROM users WHERE username LIKE ? OR email LIKE ?').all(like, like);
  res.json({ users });
});

router.post('/users/:id/delete', requireAdmin, (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id < 1) {
    return res.status(400).render('error', { title: 'Bad Request', message: 'Invalid user id.' });
  }
  db.prepare('DELETE FROM users WHERE id = ?').run(id);
  res.redirect('/admin');
});

router.post('/users/:id/role', requireAdmin, (req, res) => {
  const id = Number(req.params.id);
  const role = req.body.role === 'admin' ? 'admin' : 'user';
  if (!Number.isInteger(id) || id < 1) {
    return res.status(400).render('error', { title: 'Bad Request', message: 'Invalid user id.' });
  }
  db.prepare('UPDATE users SET role = ? WHERE id = ?').run(role, id);
  res.redirect('/admin');
});

module.exports = router;
