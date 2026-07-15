const crypto = require('crypto');
const { auth, db } = require('./_lib/firebase-admin');
const { setCors, verifyAuth } = require('./_lib/auth');
const { Resend } = require('resend');
const { withSentry } = require('./_lib/sentry');
const { checkRateLimit } = require('./_lib/rateLimit');

const FROM = 'Studlin <noreply@studlin.com>';
const OTP_TTL_MS = 10 * 60 * 1000;
const MAX_ATTEMPTS = 5;

const hashCode = (code) => crypto.createHash('sha256').update(code).digest('hex');

// Handles both sending and checking the 6-digit email OTP — kept as one
// endpoint (branching on whether `code` is present) rather than a second
// file so the api/ directory stays under Vercel's Hobby-plan function cap,
// same reasoning as search-videos absorbing youtube-info.
module.exports = withSentry(async (req, res) => {
  setCors(req, res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (!auth || !db) return res.status(503).json({ error: 'Auth service not configured' });

  const user = await verifyAuth(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  const submittedCode = req.body && req.body.code;
  if (submittedCode) return verifyCode(user, submittedCode, res);
  return sendCode(user, res);
});

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

  const { allowed } = await checkRateLimit(`send-verification:${user.uid}`, 3, 10 * 60 * 1000);
  if (!allowed) return res.status(429).json({ error: 'Too many codes requested. Please wait a few minutes.' });

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
  const year = new Date().getFullYear();

  try {
    const { error } = await resend.emails.send({
      from: FROM,
      to: [deliverTo],
      subject: 'Your Studlin verification code',
      html: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verify your email</title>
</head>
<body style="margin:0;padding:0;background:#070D07;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#070D07;padding:40px 16px;">
<tr><td align="center">
<table width="580" cellpadding="0" cellspacing="0" style="max-width:580px;width:100%;">

  <!-- HEADER CARD -->
  <tr><td style="background:#111810;border:1px solid #1C2C18;border-radius:20px;padding:0;overflow:hidden;">
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td style="padding:32px 36px 36px;text-align:center;background:radial-gradient(ellipse 60% 40% at 50% 110%,rgba(174,206,94,0.18) 0%,transparent 70%),#111810;">
          <!-- Corner decorations -->
          <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
            <tr>
              <td width="20" style="font-size:16px;font-weight:300;color:#AECE5E;vertical-align:top;line-height:1;">+</td>
              <td align="center">
                <!-- Logo -->
                <table cellpadding="0" cellspacing="0" align="center">
                  <tr>
                    <td style="width:36px;height:36px;background:#AECE5E;border-radius:9px;text-align:center;vertical-align:middle;">
                      <span style="font-size:14px;font-weight:900;color:#0D120F;font-family:monospace;letter-spacing:-1px;">|||</span>
                    </td>
                    <td style="padding-left:10px;vertical-align:middle;">
                      <span style="font-size:20px;font-weight:700;color:#FFFFFF;letter-spacing:-0.03em;">Studlin</span>
                    </td>
                  </tr>
                </table>
              </td>
              <td width="20" style="font-size:16px;font-weight:300;color:#AECE5E;vertical-align:top;text-align:right;line-height:1;">+</td>
            </tr>
          </table>
          <!-- Badge -->
          <table cellpadding="0" cellspacing="0" align="center" style="margin-bottom:20px;">
            <tr>
              <td style="border:1px solid #AECE5E;border-radius:99px;padding:7px 18px;">
                <span style="font-size:11px;font-weight:700;color:#AECE5E;letter-spacing:0.12em;text-transform:uppercase;">SECURE VERIFICATION</span>
              </td>
            </tr>
          </table>
          <!-- Heading -->
          <h1 style="margin:0 0 10px;font-size:34px;font-weight:800;color:#FFFFFF;letter-spacing:-0.03em;line-height:1.15;">Welcome to Studlin</h1>
          <p style="margin:0;font-size:15px;color:#7A8A78;line-height:1.6;">One step away from accessing your workspace.</p>
          <!-- Bottom corner decorations -->
          <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:28px;">
            <tr>
              <td width="20" style="font-size:16px;font-weight:300;color:#AECE5E;line-height:1;">+</td>
              <td></td>
              <td width="20" style="font-size:16px;font-weight:300;color:#AECE5E;text-align:right;line-height:1;">+</td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </td></tr>

  <tr><td height="10"></td></tr>

  <!-- CODE CARD -->
  <tr><td style="background:#111810;border:1px solid #1C2C18;border-radius:20px;padding:28px 32px;text-align:center;">
    <!-- Label -->
    <p style="margin:0 0 20px;font-size:11px;font-weight:700;color:#AECE5E;letter-spacing:0.12em;text-transform:uppercase;">Your verification code</p>
    <!-- Code — one selectable block so it copies cleanly in a single tap/drag -->
    <table cellpadding="0" cellspacing="0" align="center" style="margin-bottom:16px;">
      <tr>
        <td style="background:#0A0F0A;border:1.5px solid #2A4A1A;border-radius:12px;padding:18px 28px;">
          <span style="font-size:38px;font-weight:800;color:#FFFFFF;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',monospace;letter-spacing:12px;-webkit-user-select:all;user-select:all;">${code}</span>
        </td>
      </tr>
    </table>
    <p style="margin:0;font-size:13px;color:#666;line-height:1.6;">This code expires in <span style="color:#AECE5E;font-weight:600;">10 minutes</span>.<br>Tap and hold the code to select and copy it.</p>
  </td></tr>

  <tr><td height="10"></td></tr>

  <!-- FEATURES CARD -->
  <tr><td style="background:#111810;border:1px solid #1C2C18;border-radius:20px;padding:28px 24px;">
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td width="33%" style="text-align:center;padding:0 16px 0 8px;vertical-align:top;">
          <p style="margin:0 0 6px;font-size:13px;font-weight:700;color:#FFFFFF;line-height:1.3;">Instant verification</p>
          <p style="margin:0;font-size:12px;color:#666;line-height:1.5;">Verify your email and get started right away.</p>
        </td>
        <td width="1" style="background:#1C2C18;"></td>
        <td width="33%" style="text-align:center;padding:0 16px;vertical-align:top;">
          <p style="margin:0 0 6px;font-size:13px;font-weight:700;color:#FFFFFF;line-height:1.3;">End-to-end secured</p>
          <p style="margin:0;font-size:12px;color:#666;line-height:1.5;">Your data is encrypted and always protected.</p>
        </td>
        <td width="1" style="background:#1C2C18;"></td>
        <td width="33%" style="text-align:center;padding:0 8px 0 16px;vertical-align:top;">
          <p style="margin:0 0 6px;font-size:13px;font-weight:700;color:#FFFFFF;line-height:1.3;">Protected workspace access</p>
          <p style="margin:0;font-size:12px;color:#666;line-height:1.5;">Enterprise-grade security for your workspace.</p>
        </td>
      </tr>
    </table>
  </td></tr>

  <tr><td height="10"></td></tr>

  <!-- CTA CARD -->
  <tr><td style="background:#111810;border:1px solid #1C2C18;border-radius:20px;padding:32px 36px;text-align:center;">
    <table cellpadding="0" cellspacing="0" align="center" style="margin-bottom:16px;">
      <tr>
        <td style="background:#AECE5E;border-radius:12px;padding:16px 48px;">
          <a href="https://studlin.com/app" style="font-size:16px;font-weight:700;color:#0D120F;text-decoration:none;letter-spacing:-0.01em;">Open Studlin &rarr;</a>
        </td>
      </tr>
    </table>
    <p style="margin:0;font-size:12.5px;color:#555;line-height:1.6;">If you didn't request this code, you can safely ignore this email.</p>
  </td></tr>

  <tr><td height="10"></td></tr>

  <!-- FOOTER -->
  <tr><td style="padding:16px 8px;">
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td style="vertical-align:top;">
          <p style="margin:0;font-size:11px;color:#555;line-height:1.5;">Sent to<br><span style="color:#AECE5E;">${toEmail}</span></p>
        </td>
        <td style="text-align:center;vertical-align:top;font-size:11px;color:#555;line-height:1.6;">
          Studlin &copy; ${year}<br>All rights reserved.
        </td>
        <td style="text-align:right;vertical-align:top;font-size:11px;color:#555;line-height:1.6;">
          Privacy &bull; Security &bull; Support
        </td>
      </tr>
    </table>
  </td></tr>

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
