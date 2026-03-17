/**
 * VulnShop Lab - VULNERABLE VERSION
 * ====================================
 * WARNING: This application is INTENTIONALLY VULNERABLE.
 * It is designed for educational cybersecurity lab use ONLY.
 * DO NOT deploy to the internet or any public-facing server.
 * Run only on localhost in a private lab environment.
 * ====================================
 */

const express = require('express');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const path = require('path');
const { db, initDb, SECRET_KEY } = require('./db/database');

// Initialize database
initDb();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, '../public')));

// VULNERABILITY: Insecure session configuration
// - Secret hardcoded (imported from db file)
// - No httpOnly flag set explicitly - default is true but regenerate not called on login
// - No secure: true (should be true in production)
// - Session fixation: session ID not regenerated on login
app.use(session({
  secret: SECRET_KEY,         // VULNERABILITY: Hardcoded secret
  resave: false,
  saveUninitialized: true,    // VULNERABILITY: Creates sessions for unauthenticated users
  cookie: {
    maxAge: 1000 * 60 * 60 * 24, // 24 hours
    httpOnly: false,              // VULNERABILITY: JavaScript can read the session cookie
    secure: false                 // VULNERABILITY: Cookie sent over HTTP (fine for local, bad for prod)
  }
}));

// View engine - simple inline HTML rendering (no template engine = manual XSS risk)
app.set('view engine', 'ejs');
// VULNERABILITY: Several templates in this build use <%- user input %> (unescaped), enabling XSS.
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

// VULNERABILITY: Verbose error handling - exposes stack traces and internal details
app.use((err, req, res, next) => {
  console.error(err.stack);
  // VULNERABILITY: Sending full error stack to client
  res.status(500).json({
    error: err.message,
    stack: err.stack,          // VULNERABILITY: Stack trace exposed to client
    details: 'Internal server error occurred'
  });
});

// VULNERABILITY: No custom 404 handler. This leaks framework defaults and weakens UX consistency.
app.listen(PORT, '127.0.0.1', () => {
  console.log(`\n⚠️  VulnShop Lab [VULNERABLE VERSION] running at http://127.0.0.1:${PORT}`);
  console.log('⚠️  WARNING: This app is intentionally vulnerable. LOCAL USE ONLY.\n');
});
