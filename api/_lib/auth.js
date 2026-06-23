const { auth } = require('./firebase-admin');

const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || '').split(',').filter(Boolean);

function setCors(req, res) {
  const origin = req.headers.origin;
  if (ALLOWED_ORIGINS.length && ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Vary', 'Origin');
}

async function verifyAuth(req) {
  if (!auth) return null;
  const match = (req.headers.authorization || '').match(/^Bearer (.+)$/);
  if (!match) return null;
  try {
    return await auth.verifyIdToken(match[1]);
  } catch {
    return null;
  }
}

module.exports = { setCors, verifyAuth, ALLOWED_ORIGINS };
