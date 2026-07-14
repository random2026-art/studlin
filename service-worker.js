// Studlin service worker — handles background push delivery (FCM) and the
// notification click deep-link. A service worker can't see the page's
// already-loaded scripts, so it needs its own Firebase imports/init.
importScripts("https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey:"AIzaSyApWyzKeifMgGCSjSjZClCCipUKDAiao4U",
  authDomain:"studlin-cb78b.firebaseapp.com",
  projectId:"studlin-cb78b",
  storageBucket:"studlin-cb78b.firebasestorage.app",
  messagingSenderId:"16831354472",
  appId:"1:16831354472:web:50220e57868dba46c18ddd"
});

const messaging = firebase.messaging();

// Fires when a push arrives while no Studlin tab has focus — the case FCM
// can't route to the page's own onMessage handler.
messaging.onBackgroundMessage((payload) => {
  const title = (payload.notification && payload.notification.title) || "Studlin";
  const body = (payload.notification && payload.notification.body) || "";
  const url = (payload.data && payload.data.url) || "/network";
  self.registration.showNotification(title, {
    body,
    icon: "studlin-icon.png",
    data: { url },
  });
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || "/network";
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => {
      // Studlin is a client-routed single-page app — it never actually
      // navigates its pathname to "/network", so matching on that (the old
      // approach) essentially never found the tab the student already had
      // open, and every click opened a brand-new window instead. Any
      // existing client of this origin is the tab to reuse; postMessage
      // carries the deep-link info in so the already-running app can jump
      // straight to the right chat (see the App()-level message listener),
      // instead of the service worker trying (and failing) to drive
      // navigation itself.
      const existing = list[0];
      if (existing) {
        existing.postMessage({ type: "studlin-notification-click", url });
        return existing.focus();
      }
      return clients.openWindow(url);
    })
  );
});
