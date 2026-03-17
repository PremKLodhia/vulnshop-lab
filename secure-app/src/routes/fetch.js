const express = require('express');
const router = express.Router();
const fetch = require('node-fetch');
const { URL } = require('url');
const { db } = require('../db/database');
const { requireAuth } = require('../middleware/auth');

const allowedHosts = (process.env.ALLOWED_FETCH_HOSTS || 'example.com,httpbin.org')
  .split(',')
  .map((h) => h.trim().toLowerCase())
  .filter(Boolean);

function isAllowedTarget(urlString) {
  try {
    const parsed = new URL(urlString);
    if (!['http:', 'https:'].includes(parsed.protocol)) return false;
    const host = parsed.hostname.toLowerCase();
    return allowedHosts.includes(host);
  } catch (e) {
    return false;
  }
}

router.get('/', requireAuth, (req, res) => {
  res.render('fetch', { title: 'URL Fetcher', result: null, error: null, url: '' });
});

router.post('/', requireAuth, async (req, res) => {
  const url = (req.body.url || '').trim();

  // FIX: SSRF mitigation with strict host allowlist and protocol checks.
  if (!isAllowedTarget(url)) {
    return res.render('fetch', {
      title: 'URL Fetcher',
      result: null,
      error: `URL not allowed. Allowed hosts: ${allowedHosts.join(', ')}`,
      url
    });
  }

  try {
    // FIX: Reject redirects to avoid open redirect chains into internal networks.
    const response = await fetch(url, { redirect: 'error', timeout: 5000 });
    const text = await response.text();
    const preview = text.substring(0, 2000);

    db.prepare('INSERT INTO url_fetch_log (user_id, url, response_preview) VALUES (?, ?, ?)')
      .run(req.session.user.id, url, preview);

    res.render('fetch', {
      title: 'URL Fetcher',
      result: preview,
      error: null,
      url,
      statusCode: response.status,
      headers: JSON.stringify(Object.fromEntries(response.headers), null, 2)
    });
  } catch (err) {
    res.render('fetch', {
      title: 'URL Fetcher',
      result: null,
      error: 'Fetch failed for the selected allowlisted URL.',
      url
    });
  }
});

module.exports = router;
