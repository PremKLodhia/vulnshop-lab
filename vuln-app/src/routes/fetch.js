const express = require('express');
const router = express.Router();
const fetch = require('node-fetch');
const { db } = require('../db/database');
const { requireAuth } = require('../middleware/auth');

// GET /fetch - URL fetcher tool (for "product import" demo)
router.get('/', requireAuth, (req, res) => {
  res.render('fetch', { title: 'URL Fetcher', result: null, error: null, url: '' });
});

// POST /fetch - Server-side URL fetch
// VULNERABILITY: SSRF - Server will fetch any URL the user specifies
// An attacker can use this to:
//   1. Access internal services: http://127.0.0.1:8080/admin
//   2. Probe internal network: http://192.168.1.1/
//   3. Read AWS metadata: http://169.254.169.254/latest/meta-data/
//   4. Scan ports or internal hosts
router.post('/', requireAuth, async (req, res) => {
  const { url } = req.body;

  // VULNERABILITY: No URL validation, no allowlist, no blocklist
  // VULNERABILITY: No timeout restriction
  try {
    const response = await fetch(url, {
      // VULNERABILITY: Follows redirects without restriction (could redirect to internal resources)
      follow: 10,
      timeout: 10000
    });
    const text = await response.text();
    const preview = text.substring(0, 2000); // Show first 2000 chars

    // Log fetch for demo purposes
    db.prepare('INSERT INTO url_fetch_log (user_id, url, response_preview) VALUES (?, ?, ?)').run(
      req.session.user.id, url, preview
    );

    res.render('fetch', {
      title: 'URL Fetcher',
      result: preview,
      error: null,
      url,
      statusCode: response.status,
      headers: JSON.stringify(Object.fromEntries(response.headers), null, 2)
    });
  } catch (err) {
    // VULNERABILITY: Full error details returned including internal network info
    res.render('fetch', {
      title: 'URL Fetcher',
      result: null,
      error: `Fetch failed: ${err.message} — ${err.code || ''} — ${err.type || ''}`,
      url
    });
  }
});

module.exports = router;
