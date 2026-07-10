const { Resend } = require('resend');
const { admin, db } = require('./_lib/firebase-admin');
const { setCors, verifyAuth } = require('./_lib/auth');
const { withSentry } = require('./_lib/sentry');

function htmlEscape(str){return String(str||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#x27;');}

// Merges send-note.js, send-push.js, and send-welcome.js into one function —
// Vercel Hobby caps a deployment at 12 Serverless Functions and this project
// hit that ceiling (see vercel.json). Routes on `type` in the body.
module.exports = withSentry(async (req, res) => {
  setCors(req, res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const user = await verifyAuth(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  const { type } = req.body || {};
  if (type === 'push') return sendPush(user, req, res);
  if (type === 'welcome') return sendWelcome(user, req, res);
  return sendNote(user, req, res);
});

async function sendNote(user, req, res) {
  const { recipientEmail, noteTitle, noteBody, noteTag } = req.body || {};
  // Sender name shown in the email comes from the verified token, never the
  // request body — otherwise any signed-in user could spoof whose name
  // appears as having shared the note.
  const senderName = user.name || user.email || 'A Studlin user';

  console.log('[notify:note] Request from uid=%s to=%s note="%s"', user.uid, recipientEmail, noteTitle);

  if (!recipientEmail || !noteTitle) {
    console.error('[notify:note] Missing fields — recipientEmail=%s noteTitle=%s', recipientEmail, noteTitle);
    return res.status(400).json({ error: 'recipientEmail and noteTitle are required' });
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error('[notify:note] RESEND_API_KEY is not set');
    return res.status(503).json({ error: 'Email service not configured' });
  }

  // Sandbox override: while Resend account is unverified, all mail goes to the
  // registered address. Remove RESEND_TEST_EMAIL once a domain is verified.
  const deliverTo = process.env.RESEND_TEST_EMAIL || recipientEmail;
  console.log('[notify:note] Delivering to=%s (sandbox override=%s)', deliverTo, !!process.env.RESEND_TEST_EMAIL);

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
              ${htmlEscape(noteTitle)}
            </h1>
            ${noteTag ? `<div style="display:inline-block;padding:3px 10px;border-radius:99px;background:#AECE5E22;border:1px solid #AECE5E55;font-size:11px;font-weight:700;color:#3a5a1a;letter-spacing:0.05em;margin-bottom:20px;">${htmlEscape(noteTag)}</div>` : ''}
            <p style="margin:0 0 24px;font-size:14px;color:#555;line-height:1.7;">
              <strong style="color:#0D120F;">${htmlEscape(senderName || 'A Studlin user')}</strong> has shared this note with you.
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
      console.error('[notify:note] Resend API error:', JSON.stringify(error));
      return res.status(500).json({ error: 'Failed to send email' });
    }

    console.log('[notify:note] Email sent successfully — resend_id=%s', data?.id);
    return res.json({ ok: true, id: data?.id });

  } catch (e) {
    console.error('[notify:note] Unexpected error:', e.message, e.stack);
    return res.status(500).json({ error: 'Server error' });
  }
}

async function sendWelcome(user, req, res) {
  // Recipient always comes from the verified token, never the request body —
  // this route only ever makes sense as "email the signed-in user their own
  // welcome message," so there's no legitimate case for a client-chosen
  // recipient. `name` stays client-suppliable since it's just greeting copy.
  const { name } = req.body || {};
  const toEmail = user.email;
  const toName  = name || user.name || 'there';

  if (!toEmail) return res.status(400).json({ error: 'No email address available' });

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return res.status(503).json({ error: 'Email service not configured' });

  // RESEND_TEST_EMAIL overrides the recipient — required while account is in sandbox mode.
  // Remove this env var once a sending domain is verified in the Resend dashboard.
  const deliverTo = process.env.RESEND_TEST_EMAIL || toEmail;

  const resend = new Resend(apiKey);

  try {
    const { data, error } = await resend.emails.send({
      from: 'Studlin <onboarding@resend.dev>',
      to: [deliverTo],
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
      console.error('[notify:welcome] Resend error:', error);
      return res.status(500).json({ error: 'Failed to send email' });
    }

    return res.json({ ok: true, id: data?.id });
  } catch (e) {
    console.error('[notify:welcome] error:', e);
    return res.status(500).json({ error: 'Server error' });
  }
}

// Fires a native push to every other member of a chat room, gated on each
// recipient's own `preferences.pushNotificationsEnabled` (checked here,
// server-side, using the admin SDK — never trust a client-supplied flag).
// Triggered by the sender's own client right after it writes a message
// (studlin-app.jsx ChatDrawer.sendMessage) — there's no Firebase Cloud
// Functions deployment in this project, so there's no way for the server to
// react to the Firestore write itself. The sender never controls who a push
// is attributed to: identity comes from verifyAuth(req), not the request body.
async function sendPush(user, req, res) {
  if (!db) {
    // Admin SDK isn't configured (FIREBASE_SERVICE_ACCOUNT missing) — fail
    // safe rather than crash, same fallback style as api/me.js.
    return res.status(200).json({ ok: false, reason: 'admin_unconfigured' });
  }

  const { roomId, preview } = req.body || {};
  if (!roomId || !preview) return res.status(400).json({ error: 'roomId and preview are required' });

  try {
    const roomSnap = await db.collection('chatRooms').doc(roomId).get();
    if (!roomSnap.exists) return res.status(404).json({ error: 'Room not found' });
    const room = roomSnap.data();
    const memberUids = room.memberUids || [];

    // Authorization: only an actual member of the room can trigger a push
    // for it — otherwise any signed-in user could spam pushes to strangers.
    if (!memberUids.includes(user.uid)) return res.status(403).json({ error: 'Not a member of this room' });

    const recipientUids = memberUids.filter((uid) => uid !== user.uid);
    if (recipientUids.length === 0) return res.status(200).json({ ok: true, sent: 0 });

    let senderName = 'Someone';
    try {
      const profileSnap = await db.collection('profiles').doc(user.uid).get();
      if (profileSnap.exists) senderName = profileSnap.data().name || senderName;
    } catch (e) {}

    const deepLinkUrl = room.type === 'group' ? `/network?group=${roomId}` : `/network?dm=${user.uid}`;

    let sent = 0;
    for (const uid of recipientUids) {
      const recipSnap = await db.collection('users').doc(uid).get();
      if (!recipSnap.exists) continue;
      const recip = recipSnap.data();
      if (!recip.preferences || recip.preferences.pushNotificationsEnabled !== true) continue;
      const tokens = recip.fcmTokens || [];
      if (tokens.length === 0) continue;

      const staleTokens = [];
      for (const token of tokens) {
        try {
          await admin.messaging().send({
            token,
            notification: { title: senderName, body: preview.slice(0, 140) },
            data: { url: deepLinkUrl },
          });
          sent++;
        } catch (e) {
          if (e.code === 'messaging/invalid-registration-token' || e.code === 'messaging/registration-token-not-registered') {
            staleTokens.push(token);
          }
        }
      }
      if (staleTokens.length > 0) {
        await db.collection('users').doc(uid).update({
          fcmTokens: admin.firestore.FieldValue.arrayRemove(...staleTokens),
        }).catch(() => {});
      }
    }

    return res.status(200).json({ ok: true, sent });
  } catch (e) {
    console.error('[notify:push] Unexpected error:', e.message);
    return res.status(500).json({ error: 'Server error' });
  }
}
