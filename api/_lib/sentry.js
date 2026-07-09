const Sentry = require('@sentry/node');

// DSN is a public identifier, not a secret — safe to hardcode, same as the
// Firebase client config and Stripe publishable key elsewhere in this repo.
const DSN = 'https://4a5f14964e81a47306943838a7251a05@o4511706335281152.ingest.us.sentry.io/4511706340458496';

let initialized = false;
function ensureInit() {
  if (initialized) return;
  Sentry.init({
    dsn: DSN,
    environment: process.env.VERCEL_ENV || 'development',
    tracesSampleRate: 0.1,
  });
  initialized = true;
}

// Wraps a Vercel serverless function so any exception that escapes the
// handler (an actual crash, not an error the handler already caught and
// turned into a JSON response) gets reported to Sentry before the request
// still fails with a 500 — visibility into failures that would otherwise
// be silent, same class of blind spot that let the RESEND_TEST_EMAIL
// misconfiguration and the 12-function deploy outage go unnoticed for hours.
function withSentry(handler) {
  ensureInit();
  return async (req, res) => {
    try {
      return await handler(req, res);
    } catch (err) {
      Sentry.captureException(err);
      await Sentry.flush(2000).catch(() => {});
      if (!res.headersSent) {
        res.status(500).json({ error: 'Server error' });
      }
    }
  };
}

module.exports = { Sentry, withSentry };
