const express = require('express');
const router = express.Router();
const { db } = require('../db/database');

// VULNERABILITY: No rate limiting on login - brute force possible
// VULNERABILITY: SQL injection in login - username field is directly concatenated

// GET /login
router.get('/login', (req, res) => {
  if (req.session.user) return res.redirect('/');
  res.render('login', { title: 'Login', error: null });
});

// POST /login
router.post('/login', (req, res) => {
  const { username, password } = req.body;

  // VULNERABILITY: SQLi demo - string concatenation in query
  // An attacker can enter: admin'-- as username to bypass password check
  const query = `SELECT * FROM users WHERE username = '${username}' AND password = '${password}'`;
  
  let user;
  try {
    // VULNERABILITY: Raw string query - SQLi
    user = db.prepare(query).get();
  } catch (err) {
    // VULNERABILITY: Verbose error - reveals query structure and DB info
    return res.render('login', {
      title: 'Login',
      error: `Database error: ${err.message} — Query: ${query}`
    });
  }

  if (!user) {
    return res.render('login', { title: 'Login', error: 'Invalid credentials' });
  }

  // VULNERABILITY: Session fixation - not regenerating session ID on login
  // An attacker who fixed the session ID before login now has an authenticated session
  req.session.user = {
    id: user.id,
    username: user.username,
    email: user.email,
    role: user.role
  };

  res.redirect('/');
});

// GET /register
router.get('/register', (req, res) => {
  if (req.session.user) return res.redirect('/');
  res.render('register', { title: 'Register', error: null });
});

// POST /register
router.post('/register', (req, res) => {
  const { username, email, password } = req.body;

  // VULNERABILITY: No input validation - any value accepted
  // VULNERABILITY: Password stored in plain text - no hashing

  try {
    db.prepare(`INSERT INTO users (username, email, password) VALUES ('${username}', '${email}', '${password}')`).run();
    // VULNERABILITY: SQLi in registration too
    res.redirect('/login');
  } catch (err) {
    // VULNERABILITY: Verbose DB error - may reveal schema
    res.render('register', { title: 'Register', error: `Registration failed: ${err.message}` });
  }
});

// GET /logout
router.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/login');
});

module.exports = router;
