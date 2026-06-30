const { Resend } = require('resend');
const { setCors, verifyAuth } = require('./_lib/auth');

module.exports = async (req, res) => {
  setCors(req, res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const user = await verifyAuth(req);
  if (!user) {
    console.error('[send-note] Auth failed — no valid token');
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { recipientEmail, noteTitle, noteBody, noteTag, senderName } = req.body || {};

  console.log('[send-note] Request from uid=%s to=%s note="%s"', user.uid, recipientEmail, noteTitle);

  if (!recipientEmail || !noteTitle) {
    console.error('[send-note] Missing fields — recipientEmail=%s noteTitle=%s', recipientEmail, noteTitle);
    return res.status(400).json({ error: 'recipientEmail and noteTitle are required' });
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error('[send-note] RESEND_API_KEY is not set');
    return res.status(503).json({ error: 'Email service not configured' });
  }

  // Sandbox override: while Resend account is unverified, all mail goes to the
  // registered address. Remove RESEND_TEST_EMAIL once a domain is verified.
  const deliverTo = process.env.RESEND_TEST_EMAIL || recipientEmail;
  console.log('[send-note] Delivering to=%s (sandbox override=%s)', deliverTo, !!process.env.RESEND_TEST_EMAIL);

  // Strip HTML tags for a plain-text preview (first 300 chars)
  const plainPreview = (noteBody || '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 300);

  const resend = new Resend(apiKey);

  try {
    const { data, error } = await resend.emails.send({
      from: 'Studlin <onboarding@resend.dev>',
      to: [deliverTo],
      subject: `${senderName || 'Someone'} shared a note with you — "${noteTitle}"`,
      html: `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Shared note</title>
</head>
<body style="margin:0;padding:0;background:#F4F0E6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F4F0E6;padding:48px 16px;">
    <tr><td align="center">
      <table width="520" cellpadding="0" cellspacing="0" style="max-width:520px;width:100%;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(14,31,24,0.08);">

        <!-- Header -->
        <tr>
          <td style="background:#0D120F;padding:28px 36px;">
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
            <p style="margin:0 0 6px;font-size:12px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#999;">
              Shared note
            </p>
            <h1 style="margin:0 0 16px;font-size:22px;font-weight:700;color:#0D120F;letter-spacing:-0.02em;line-height:1.25;">
              ${noteTitle}
            </h1>
            ${noteTag ? `<div style="display:inline-block;padding:3px 10px;border-radius:99px;background:#AECE5E22;border:1px solid #AECE5E55;font-size:11px;font-weight:700;color:#3a5a1a;letter-spacing:0.05em;margin-bottom:20px;">${noteTag}</div>` : ''}
            <p style="margin:0 0 24px;font-size:14px;color:#555;line-height:1.7;">
              <strong style="color:#0D120F;">${senderName || 'A Studlin user'}</strong> has shared this note with you.
            </p>

            <!-- Note preview card -->
            <div style="background:#F8F5EE;border:1px solid #E8E3D8;border-left:4px solid #AECE5E;border-radius:10px;padding:20px 22px;margin-bottom:28px;">
              <p style="margin:0;font-size:13.5px;color:#333;line-height:1.75;">
                ${plainPreview || 'Open Studlin to read the full note.'}${plainPreview.length >= 300 ? '&hellip;' : ''}
              </p>
            </div>

            <!-- CTA -->
            <table cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
              <tr>
                <td style="background:#AECE5E;border-radius:10px;">
                  <a href="https://studlin.app" style="display:inline-block;padding:13px 28px;font-size:14px;font-weight:700;color:#0D120F;text-decoration:none;letter-spacing:-0.01em;">
                    Open in Studlin →
                  </a>
                </td>
              </tr>
            </table>

            <p style="margin:0;font-size:12px;color:#aaa;line-height:1.6;">
              Don't have an account? <a href="https://studlin.app" style="color:#AECE5E;text-decoration:none;">Sign up free</a> to view, edit, and share notes with your class.
            </p>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="padding:16px 36px 24px;border-top:1px solid #f0ede4;">
            <p style="margin:0;font-size:11px;color:#bbb;line-height:1.6;">
              Sent via Studlin · <a href="https://studlin.app" style="color:#bbb;">studlin.app</a>
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>
      `,
    });

    if (error) {
      console.error('[send-note] Resend API error:', JSON.stringify(error));
      return res.status(500).json({ error: 'Failed to send email', detail: error.message });
    }

    console.log('[send-note] Email sent successfully — resend_id=%s', data?.id);
    res.json({ ok: true, id: data?.id });

  } catch (e) {
    console.error('[send-note] Unexpected error:', e.message, e.stack);
    res.status(500).json({ error: 'Server error', detail: e.message });
  }
};
