const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { db } = require('../db/database');
const { requireAuth } = require('../middleware/auth');
const { profileSchema } = require('../middleware/validation');

const uploadDir = path.join(__dirname, '../../public/uploads/');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const safeExt = path.extname(file.originalname).toLowerCase();
    cb(null, `${Date.now()}-${req.session.user.id}${safeExt}`);
  }
});

const allowedMime = new Set(['image/png', 'image/jpeg', 'image/webp']);

const upload = multer({
  storage,
  limits: {
    // FIX: Enforce upload size limit
    fileSize: Number(process.env.MAX_UPLOAD_BYTES || 1048576)
  },
  fileFilter: (req, file, cb) => {
    // FIX: Restrict file upload types
    if (!allowedMime.has(file.mimetype)) return cb(new Error('Only png, jpg, jpeg, and webp files are allowed.'));
    cb(null, true);
  }
});

router.get('/', requireAuth, (req, res) => {
  const user = db.prepare('SELECT id, username, email, bio, avatar, created_at FROM users WHERE id = ?').get(req.session.user.id);
  res.render('profile', { title: 'My Profile', profileUser: user, isOwn: true });
});

router.get('/:id', requireAuth, (req, res) => {
  const requestedId = Number(req.params.id);
  if (!Number.isInteger(requestedId) || requestedId < 1) {
    return res.status(400).render('error', { title: 'Bad Request', message: 'Invalid user id.' });
  }

  // FIX: Prevent IDOR by restricting to own profile unless admin
  if (requestedId !== req.session.user.id && req.session.user.role !== 'admin') {
    return res.status(403).render('error', { title: 'Forbidden', message: 'You cannot view another user profile.' });
  }

  const user = db.prepare('SELECT id, username, email, bio, avatar, created_at FROM users WHERE id = ?').get(requestedId);
  if (!user) return res.status(404).render('error', { title: 'Not Found', message: 'User not found.' });

  const isOwn = req.session.user.id === user.id;
  res.render('profile', { title: `${user.username}'s Profile`, profileUser: user, isOwn });
});

router.post('/update', requireAuth, (req, res) => {
  const { error, value } = profileSchema.validate(req.body);
  if (error) {
    return res.status(400).render('error', { title: 'Bad Request', message: 'Invalid profile input.' });
  }

  db.prepare('UPDATE users SET bio = ? WHERE id = ?').run(value.bio, req.session.user.id);
  req.session.user.bio = value.bio;
  res.redirect('/profile');
});

router.post('/avatar', requireAuth, (req, res) => {
  upload.single('avatar')(req, res, (err) => {
    if (err) {
      return res.status(400).render('error', { title: 'Upload Error', message: err.message });
    }
    if (!req.file) return res.redirect('/profile');

    const avatarPath = '/uploads/' + req.file.filename;
    db.prepare('UPDATE users SET avatar = ? WHERE id = ?').run(avatarPath, req.session.user.id);
    res.redirect('/profile');
  });
});

module.exports = router;
