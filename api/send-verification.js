const crypto = require('crypto');
const { auth, db } = require('./_lib/firebase-admin');
const { setCors, verifyAuth } = require('./_lib/auth');
const { Resend } = require('resend');

const FROM = 'Studlin <noreply@studlin.com>';
const OTP_TTL_MS = 10 * 60 * 1000;
const MAX_ATTEMPTS = 5;

const hashCode = (code) => crypto.createHash('sha256').update(code).digest('hex');

// Handles both sending and checking the 6-digit email OTP — kept as one
// endpoint (branching on whether `code` is present) rather than a second
// file so the api/ directory stays under Vercel's Hobby-plan function cap,
// same reasoning as search-videos absorbing youtube-info.
module.exports = async (req, res) => {
  setCors(req, res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (!auth || !db) return res.status(503).json({ error: 'Auth service not configured' });

  const user = await verifyAuth(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  const submittedCode = req.body && req.body.code;
  if (submittedCode) return verifyCode(user, submittedCode, res);
  return sendCode(user, res);
};

async function verifyCode(user, submittedCode, res) {
  const code = String(submittedCode).trim();
  if (!/^\d{6}$/.test(code)) return res.status(400).json({ error: 'Enter the 6-digit code.' });

  const ref = db.collection('emailOtps').doc(user.uid);
  const snap = await ref.get().catch(() => null);
  if (!snap || !snap.exists) return res.status(400).json({ error: 'No pending code. Request a new one.' });

  const data = snap.data();
  if (Date.now() > data.expiresAt) {
    await ref.delete().catch(() => {});
    return res.status(400).json({ error: 'Code expired. Request a new one.' });
  }
  if ((data.attempts || 0) >= MAX_ATTEMPTS) {
    await ref.delete().catch(() => {});
    return res.status(429).json({ error: 'Too many attempts. Request a new code.' });
  }

  if (hashCode(code) !== data.codeHash) {
    await ref.update({ attempts: (data.attempts || 0) + 1 }).catch(() => {});
    return res.status(400).json({ error: 'Incorrect code. Try again.' });
  }

  try {
    await auth.updateUser(user.uid, { emailVerified: true });
  } catch (e) {
    return res.status(500).json({ error: 'Could not verify email: ' + e.message });
  }
  await ref.delete().catch(() => {});
  return res.json({ ok: true });
}

async function sendCode(user, res) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return res.status(503).json({ error: 'Email service not configured' });

  const firebaseUser = await auth.getUser(user.uid).catch(() => null);
  if (!firebaseUser) return res.status(404).json({ error: 'User not found' });
  if (firebaseUser.emailVerified) return res.json({ ok: true, alreadyVerified: true });

  const toEmail = firebaseUser.email;
  if (!toEmail) return res.status(400).json({ error: 'No email on account' });

  const code = String(crypto.randomInt(0, 1000000)).padStart(6, '0');
  try {
    await db.collection('emailOtps').doc(user.uid).set({
      codeHash: hashCode(code),
      expiresAt: Date.now() + OTP_TTL_MS,
      attempts: 0,
      createdAt: Date.now(),
    });
  } catch (e) {
    return res.status(500).json({ error: 'Could not generate a verification code.' });
  }

  const deliverTo = process.env.RESEND_TEST_EMAIL || toEmail;
  const resend = new Resend(apiKey);

  try {
    const { error } = await resend.emails.send({
      from: FROM,
      to: [deliverTo],
      subject: 'Your Studlin verification code',
      html: `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verify your email</title>
</head>
<body style="margin:0;padding:0;background:#F4F0E6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F4F0E6;padding:48px 16px;">
    <tr><td align="center">
      <table width="500" cellpadding="0" cellspacing="0" style="max-width:500px;width:100%;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(14,31,24,0.08);">

        <!-- Header -->
        <tr>
          <td style="background:#0D120F;padding:28px 36px 24px;">
            <table cellpadding="0" cellspacing="0">
              <tr>
                <td style="width:32px;height:32px;background:#AECE5E;border-radius:8px;text-align:center;vertical-align:middle;">
                  <span style="font-size:17px;font-weight:800;color:#0D120F;line-height:32px;">S</span>
                </td>
                <td style="padding-left:10px;vertical-align:middle;">
                  <span style="font-size:18px;font-weight:700;color:#ffffff;letter-spacing:-0.02em;">Studlin</span>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:36px 36px 28px;">
            <h1 style="margin:0 0 10px;font-size:22px;font-weight:700;color:#0D120F;letter-spacing:-0.02em;line-height:1.25;">
              Verify your email address
            </h1>
            <p style="margin:0 0 24px;font-size:14.5px;color:#555;line-height:1.7;">
              Enter this code in Studlin to confirm your email and access your workspace.
            </p>

            <div style="text-align:center;margin-bottom:24px;">
              <span style="display:inline-block;padding:16px 28px;font-size:32px;font-weight:800;letter-spacing:8px;color:#0D120F;background:#F4F0E6;border-radius:12px;">${code}</span>
            </div>

            <p style="margin:0;font-size:13px;color:#999;line-height:1.5;">
              This code expires in 10 minutes. If you didn't create a Studlin account, you can safely ignore this email.
            </p>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="padding:18px 36px 24px;border-top:1px solid #f0ede4;">
            <p style="margin:0;font-size:11px;color:#ccc;line-height:1.6;">
              Sent to ${toEmail} &middot; © 2026 Studlin
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`,
    });

    if (error) return res.status(500).json({ error: error.message });
    return res.json({ ok: true });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
