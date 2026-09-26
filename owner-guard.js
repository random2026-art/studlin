// Studlin keeps a student's calendar, classes and settings in this browser's
// localStorage. Signing out used to leave all of it behind, so signing in as a
// different account on the same browser showed the previous account's data.
// This records which account owns the local data and clears it when a
// different account signs in (or when someone signs out on purpose).
// Loaded before the app bundles on every page that signs users in or out.
(function (root) {
  var PREFIX = 'studlin-';
  var OWNER_KEY = 'studlin-owner';
  // Choices about this device, not about an account.
  var KEEP = ['studlin-owner', 'studlin-analyticsOptOut', 'studlin-theme', 'studlin-accent', 'studlin-accent-reset5'];

  function wipe(storage) {
    var doomed = [];
    for (var i = 0; i < storage.length; i++) {
      var k = storage.key(i);
      if (k && k.indexOf(PREFIX) === 0 && KEEP.indexOf(k) === -1) doomed.push(k);
    }
    doomed.forEach(function (k) { storage.removeItem(k); });
    return doomed.length;
  }

  function make(storage) {
    return {
      // Call with the signed-in uid. Returns true when a different account's
      // data was cleared. With no recorded owner (data from before this
      // existed) the current account adopts it rather than losing it.
      claim: function (uid) {
        if (!uid) return false;
        try {
          var owner = storage.getItem(OWNER_KEY);
          var cleared = false;
          if (owner && owner !== uid) { wipe(storage); cleared = true; }
          storage.setItem(OWNER_KEY, uid);
          return cleared;
        } catch (e) { return false; }
      },
      // Call right before an intentional sign-out.
      clearOnSignOut: function () {
        try { wipe(storage); storage.removeItem(OWNER_KEY); } catch (e) {}
      },
    };
  }

  var api = { make: make };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  try { if (root.localStorage) root.StudlinOwnerGuard = make(root.localStorage); } catch (e) {}
})(typeof window !== 'undefined' ? window : this);
