const express = require('express');
const router = express.Router();
const { db } = require('../db/database');
const { requireAuth, requireAdmin, requireSameOrigin } = require('../middleware/auth');
const { supportSchema } = require('../middleware/validation');

router.get('/', (req, res) => {
  res.render('support', { title: 'Support', success: false, error: null });
});

router.post('/', requireSameOrigin, (req, res) => {
  // FIX: Same-origin check adds CSRF resistance for support form submissions.
  // FIX: Validate and normalize support inputs before persistence.
  const { error, value } = supportSchema.validate(req.body);
  if (error) {
    return res.render('support', { title: 'Support', success: false, error: 'Invalid support request input.' });
  }

  const userId = req.session.user ? req.session.user.id : null;
  db.prepare('INSERT INTO support_tickets (user_id, name, email, subject, message) VALUES (?, ?, ?, ?, ?)')
    .run(userId, value.name, value.email, value.subject, value.message);

  res.render('support', { title: 'Support', success: true, error: null });
});

// FIX: Restrict support ticket listing to admins
router.get('/tickets', requireAuth, requireAdmin, (req, res) => {
  const tickets = db.prepare('SELECT * FROM support_tickets ORDER BY created_at DESC').all();
  res.render('support-tickets', { title: 'All Support Tickets', tickets });
});

module.exports = router;
