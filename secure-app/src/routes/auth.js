const express = require('express');
const bcrypt = require('bcryptjs');
const router = express.Router();
const { db } = require('../db/database');
const { loginSchema, registerSchema } = require('../middleware/validation');
const { authLimiter } = require('../middleware/rateLimit');

router.get('/login', (req, res) => {
  if (req.session.user) return res.redirect('/');
  res.render('login', { title: 'Login', error: null });
});

router.post('/login', authLimiter, (req, res) => {
  // FIX: Reject malformed login input early to reduce injection and parser edge cases.
  const { error, value } = loginSchema.validate(req.body);
  if (error) {
    return res.render('login', { title: 'Login', error: 'Invalid login input.' });
  }

  // FIX: Parameterized query to prevent SQL injection
  const user = db.prepare('SELECT * FROM users WHERE username = ?').get(value.username);
  if (!user) {
    return res.render('login', { title: 'Login', error: 'Invalid credentials.' });
  }

  // FIX: Compare against bcrypt hash instead of storing/reading plaintext passwords.
  const ok = bcrypt.compareSync(value.password, user.password);
  if (!ok) {
    return res.render('login', { title: 'Login', error: 'Invalid credentials.' });
  }

  // FIX: Regenerate session on login to prevent session fixation
  req.session.regenerate((regenErr) => {
    if (regenErr) {
      return res.render('login', { title: 'Login', error: 'Login failed. Try again.' });
    }

    req.session.user = {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role
    };
    res.redirect('/');
  });
});

router.get('/register', (req, res) => {
  if (req.session.user) return res.redirect('/');
  res.render('register', { title: 'Register', error: null });
});

router.post('/register', (req, res) => {
  // FIX: Enforce schema validation before account creation.
  const { error, value } = registerSchema.validate(req.body);
  if (error) {
    return res.render('register', { title: 'Register', error: 'Invalid registration input.' });
  }

  // FIX: Hash password before database insert.
  const passwordHash = bcrypt.hashSync(value.password, 10);

  try {
    // FIX: Parameterized query to prevent SQL injection
    db.prepare('INSERT INTO users (username, email, password) VALUES (?, ?, ?)')
      .run(value.username, value.email, passwordHash);
    res.redirect('/login');
  } catch (e) {
    res.render('register', { title: 'Register', error: 'Registration failed. Username or email may already exist.' });
  }
});

router.get('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/login');
  });
});

module.exports = router;
