const { db } = require('./firebase-admin');

// Firestore-backed sliding window limiter, factored out of the pattern
// proven in api/chat.js for endpoints that don't otherwise touch Firestore.
// Fails OPEN (allows the request) if Firestore is unreachable — an infra
// hiccup shouldn't block real users, same stance as chat.js's credit check.
async function checkRateLimit(key, limit, windowMs) {
  if (!db) return { allowed: true };
  const ref = db.collection('rateLimits').doc(key);
  try {
    return await db.runTransaction(async (tx) => {
      const doc = await tx.get(ref);
      const now = Date.now();
      const data = doc.exists ? doc.data() : {};
      const windowStart = data.windowStart || 0;
      const count = now - windowStart < windowMs ? (data.count || 0) : 0;
      if (count >= limit) return { allowed: false };
      tx.set(ref, {
        windowStart: now - windowStart < windowMs ? windowStart : now,
        count: count + 1,
      });
      return { allowed: true };
    });
  } catch {
    return { allowed: true };
  }
}

module.exports = { checkRateLimit };
