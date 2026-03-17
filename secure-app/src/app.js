/**
 * VulnShop Lab - SECURE VERSION
 * ====================================
 * This application is the remediated counterpart for the local lab.
 * It must still be used only in private local environments.
 * ====================================
 */

const express = require('express');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const path = require('path');
require('dotenv').config();
const { db, initDb } = require('./db/database');

// Initialize database
initDb();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, '../public')));
app.use(helmet({ contentSecurityPolicy: false }));

// FIX: Secure session configuration for local lab use
app.use(session({
  secret: process.env.SESSION_SECRET || 'change_me_for_local_only',
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 1000 * 60 * 60 * 24, // 24 hours
    httpOnly: true,
    secure: false,
    sameSite: 'lax'
  }
}));

// View engine - simple inline HTML rendering (no template engine = manual XSS risk)
app.set('view engine', 'ejs');
// FIX: Templates render untrusted values with <%= %> so content is escaped before output.
app.set('views', path.join(__dirname, '../views'));

// Make session user available to all views
app.use((req, res, next) => {
  res.locals.user = req.session.user || null;
  next();
});

// Routes
const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const cartRoutes = require('./routes/cart');
const orderRoutes = require('./routes/orders');
const adminRoutes = require('./routes/admin');
const profileRoutes = require('./routes/profile');
const supportRoutes = require('./routes/support');
const fetchRoutes = require('./routes/fetch');

app.use('/', authRoutes);
app.use('/products', productRoutes);
app.use('/cart', cartRoutes);
app.use('/orders', orderRoutes);
app.use('/admin', adminRoutes);
app.use('/profile', profileRoutes);
app.use('/support', supportRoutes);
app.use('/fetch', fetchRoutes);

// Home route
app.get('/', (req, res) => {
  const products = db.prepare('SELECT * FROM products LIMIT 6').all();
  res.render('index', { products, title: 'VulnShop Lab' });
});

// FIX: Safe error handling without leaking internals
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).render('error', { title: 'Error', message: 'An unexpected error occurred.' });
});

// FIX: Explicit 404 handler avoids default framework responses and keeps behavior consistent.
app.use((req, res) => {
  res.status(404).render('error', { title: 'Not Found', message: 'The requested page does not exist.' });
});

app.listen(PORT, '127.0.0.1', () => {
  console.log(`\n✅ VulnShop Lab [SECURE VERSION] running at http://127.0.0.1:${PORT}`);
  console.log('✅ Remediated build for local verification and retest.\n');
});
