function requireAuth(req, res, next) {
  if (!req.session.user) return res.redirect('/login');
  next();
}

function requireAdminWeak(req, res, next) {
  // VULNERABILITY: Trusting session role alone is a weak admin control pattern.
  if (!req.session.user || req.session.user.role !== 'admin') {
    return res.status(403).send('Access denied. Admin only. <a href="/login">Login as admin</a>');
  }
  next();
}

module.exports = { requireAuth, requireAdminWeak };