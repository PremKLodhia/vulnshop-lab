const { db } = require('../db/database');

function requireAuth(req, res, next) {
  if (!req.session.user) return res.redirect('/login');
  next();
}

function requireAdmin(req, res, next) {
  if (!req.session.user) {
    return res.status(403).render('error', { title: 'Forbidden', message: 'You are not authorized to access this page.' });
  }

  // FIX: Re-check role from database to avoid trusting stale or tampered session claims.
  const user = db.prepare('SELECT role FROM users WHERE id = ?').get(req.session.user.id);
  if (!user || user.role !== 'admin') {
    return res.status(403).render('error', { title: 'Forbidden', message: 'You are not authorized to access this page.' });
  }

  req.session.user.role = user.role;
  next();
}

function requireSameOrigin(req, res, next) {
  // FIX: Basic CSRF mitigation for form posts by enforcing same-origin browser requests.
  const origin = req.get('origin');
  const host = req.get('host');
  if (!host) {
    return res.status(403).render('error', { title: 'Forbidden', message: 'Invalid request origin.' });
  }

  if (!origin) {
    return next();
  }

  const allowedOrigins = [`http://${host}`, `https://${host}`];
  if (!allowedOrigins.includes(origin)) {
    return res.status(403).render('error', { title: 'Forbidden', message: 'Cross-site request blocked.' });
  }

  next();
}

module.exports = { requireAuth, requireAdmin, requireSameOrigin };
