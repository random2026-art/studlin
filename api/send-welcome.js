const { Resend } = require('resend');
const { setCors, verifyAuth } = require('./_lib/auth');

module.exports = async (req, res) => {
  setCors(req, res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const user = await verifyAuth(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  const { name, email } = req.body || {};
  const toEmail = email || user.email;
  const toName  = name  || user.name || 'there';

  if (!toEmail) return res.status(400).json({ error: 'No email address available' });

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return res.status(503).json({ error: 'Email service not configured' });

  const resend = new Resend(apiKey);

  try {
    const { data, error } = await resend.emails.send({
      from: 'Studlin <welcome@studlin.app>',
      to: [toEmail],
      subject: 'Welcome to Studlin 🎓',
      html: `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to Studlin</title>
</head>
<body style="margin:0;padding:0;background:#F4F0E6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F4F0E6;padding:48px 16px;">
    <tr><td align="center">
      <table width="520" cellpadding="0" cellspacing="0" style="max-width:520px;width:100%;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(14,31,24,0.08);">

        <!-- Header -->
        <tr>
          <td style="background:#0D120F;padding:32px 40px 28px;">
            <table cellpadding="0" cellspacing="0">
              <tr>
                <td style="width:36px;height:36px;background:#AECE5E;border-radius:9px;text-align:center;vertical-align:middle;">
                  <span style="font-size:19px;font-weight:800;color:#0D120F;line-height:36px;">S</span>
                </td>
                <td style="padding-left:10px;vertical-align:middle;">
                  <span style="font-size:20px;font-weight:700;color:#ffffff;letter-spacing:-0.02em;">Studlin</span>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:40px 40px 32px;">
            <h1 style="margin:0 0 12px;font-size:26px;font-weight:700;color:#0D120F;letter-spacing:-0.02em;line-height:1.2;">
              Welcome, ${toName}.
            </h1>
            <p style="margin:0 0 24px;font-size:15px;color:#444;line-height:1.7;">
              Your Studlin workspace is ready. Everything you need to study — notes, flashcards, AI chat, a task calendar, and more — is in one place.
            </p>

            <!-- Feature grid -->
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
              <tr>
                <td style="padding:0 6px 12px 0;width:50%;vertical-align:top;">
                  <div style="background:#F4F0E6;border-radius:10px;padding:16px;">
                    <div style="font-size:13px;font-weight:700;color:#0D120F;margin-bottom:4px;">AI Chat</div>
                    <div style="font-size:12px;color:#666;line-height:1.5;">Ask anything. Get instant, subject-aware explanations.</div>
                  </div>
                </td>
                <td style="padding:0 0 12px 6px;width:50%;vertical-align:top;">
                  <div style="background:#F4F0E6;border-radius:10px;padding:16px;">
                    <div style="font-size:13px;font-weight:700;color:#0D120F;margin-bottom:4px;">Smart Notes</div>
                    <div style="font-size:12px;color:#666;line-height:1.5;">Write, scan a PDF, or record a lecture. AI cleans it up.</div>
                  </div>
                </td>
              </tr>
              <tr>
                <td style="padding:0 6px 0 0;vertical-align:top;">
                  <div style="background:#F4F0E6;border-radius:10px;padding:16px;">
                    <div style="font-size:13px;font-weight:700;color:#0D120F;margin-bottom:4px;">Flashcards</div>
                    <div style="font-size:12px;color:#666;line-height:1.5;">AI generates spaced-rep decks from your notes in seconds.</div>
                  </div>
                </td>
                <td style="padding:0 0 0 6px;vertical-align:top;">
                  <div style="background:#F4F0E6;border-radius:10px;padding:16px;">
                    <div style="font-size:13px;font-weight:700;color:#0D120F;margin-bottom:4px;">Calendar</div>
                    <div style="font-size:12px;color:#666;line-height:1.5;">Deadlines, study blocks, and your Google Calendar — unified.</div>
                  </div>
                </td>
              </tr>
            </table>

            <!-- CTA -->
            <table cellpadding="0" cellspacing="0" style="margin-bottom:32px;">
              <tr>
                <td style="background:#AECE5E;border-radius:10px;">
                  <a href="https://studlin.app" style="display:inline-block;padding:14px 32px;font-size:15px;font-weight:700;color:#0D120F;text-decoration:none;letter-spacing:-0.01em;">
                    Open my workspace →
                  </a>
                </td>
              </tr>
            </table>

            <p style="margin:0;font-size:13px;color:#999;line-height:1.6;">
              You're on the <strong style="color:#0D120F;">Free plan</strong>. Upgrade to Pro anytime for unlimited AI credits, priority support, and advanced features.
            </p>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="padding:20px 40px 28px;border-top:1px solid #f0ede4;">
            <p style="margin:0;font-size:11px;color:#bbb;line-height:1.6;">
              You're receiving this because you created a Studlin account.<br>
              © 2026 Studlin · <a href="https://studlin.app" style="color:#bbb;">studlin.app</a>
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
      console.error('Resend error:', error);
      return res.status(500).json({ error: 'Failed to send email', detail: error.message });
    }

    res.json({ ok: true, id: data?.id });
  } catch (e) {
    console.error('send-welcome error:', e);
    res.status(500).json({ error: 'Server error' });
  }
};
