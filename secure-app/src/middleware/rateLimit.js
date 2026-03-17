const rateLimit = require('express-rate-limit');

// FIX: Add rate limiting to authentication routes to reduce brute-force risk
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many login attempts. Please try again later.'
});

module.exports = { authLimiter };
