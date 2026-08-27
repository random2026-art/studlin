// Regression tests for the 2026-08-27 fix: there was previously NO
// notification anywhere in the app for a new incoming friend request --
// FriendsChat's own "Incoming Requests" list is real-time, but it's local
// component state that only exists while the Studlin Network tab is
// mounted, so a request arriving while a student is anywhere else in the
// app produced zero visible signal. Run with `npm test`.
//
// This is entirely App-component-closure state (a useEffect + inline
// NavItem JSX, not an exported pure function) -- consistent with this
// repo's existing precedent (see intelligence-audit-batch1.test.js's own
// top comment, and friend-profile-pic-sync.test.js) these are covered by
// source-level regression guards against the exact literals this fix
// changed.
const { test, describe } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");

const SOURCE = fs.readFileSync(path.join(__dirname, "..", "studlin-app.jsx"), "utf8");

describe("Friend request notification badge (source-level regression guards -- see this file's own top comment for why)", () => {
  test("App mounts a live listener for pending incoming friend requests, not just the chat-unread one", () => {
    assert.match(SOURCE, /fsdb\(\)\.collection\('friendships'\)\.where\('receiverId','==',myUid\)\.where\('status','==','pending'\)\s*\n\s*\.onSnapshot\(snap=>setPendingFriendRequestCount\(snap\.size\),\(\)=>\{\}\);/,
      "without this listener living at the App level (not inside FriendsChat), the count would only ever update while the Network tab happens to be mounted -- the exact bug this fixes");
  });

  test("the Studlin Network sidebar badge combines unread chat messages AND pending friend requests into one number", () => {
    assert.match(SOURCE, /badge:String\(\(unreadCount\+pendingFriendRequestCount\)\|\|""\)/,
      "a new friend request must actually move the visible badge count, not just exist in a separate untied piece of state");
  });

  test("the notification badge is also visible when the sidebar is collapsed (the default state for every user)", () => {
    assert.match(SOURCE, /!navExpanded&&item\.badge&&<span/,
      "navCollapsed defaults to true (lsGet default), so a badge that only renders when navExpanded is true would be invisible to most users by default -- a second real gap this fix also closes, not just the missing friend-request count itself");
  });
});
