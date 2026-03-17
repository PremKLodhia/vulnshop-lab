const express = require('express');
const router = express.Router();
const { db } = require('../db/database');

// GET /support
router.get('/', (req, res) => {
  res.render('support', { title: 'Support', success: false, error: null });
});

// POST /support - Submit support ticket
router.post('/', (req, res) => {
  const { name, email, subject, message } = req.body;
  const userId = req.session.user ? req.session.user.id : null;

  // VULNERABILITY: No input validation or sanitization
  // VULNERABILITY: No CSRF protection
  db.prepare(`INSERT INTO support_tickets (user_id, name, email, subject, message) VALUES (?, ?, ?, ?, ?)`)
    .run(userId, name, email, subject, message);

  res.render('support', { title: 'Support', success: true, error: null });
});

// GET /support/tickets - view all tickets (should be admin-only but isn't)
// VULNERABILITY: Broken access control - no auth check
router.get('/tickets', (req, res) => {
  const tickets = db.prepare('SELECT * FROM support_tickets ORDER BY created_at DESC').all();
  res.render('support-tickets', { title: 'All Support Tickets', tickets });
});

module.exports = router;
