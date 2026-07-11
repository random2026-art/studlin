// Google blocks OAuth sign-in from embedded in-app browsers (Instagram,
// TikTok, Facebook/Messenger, Snapchat, LinkedIn, Line, WeChat) as a hard
// policy, showing a generic "doesn't comply with Google's OAuth 2.0
// policy" error with no indication of the real cause. This detects the
// common, well-documented in-app-browser signatures and warns the student
// before they ever hit that blocked popup, instead of after.
(function () {
  function isInAppBrowser() {
    var ua = navigator.userAgent || "";
    return /Instagram|FBAN|FBAV|BytedanceWebview|musical_ly|TikTok|Snapchat|LinkedInApp|Line\/|MicroMessenger/i.test(ua);
  }
  window.__isInAppBrowser = isInAppBrowser;

  function injectBanner() {
    if (!isInAppBrowser()) return;
    if (document.getElementById("__inapp-browser-warning")) return;

    var banner = document.createElement("div");
    banner.id = "__inapp-browser-warning";
    banner.setAttribute("role", "alert");
    banner.style.cssText = "position:relative;z-index:2147483647;display:flex;align-items:center;gap:12px;padding:12px 16px;background:#FCF1EF;border-bottom:1px solid #F5D4D0;color:#7A2E26;font:500 13px/1.4 -apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;";

    var text = document.createElement("div");
    text.style.cssText = "flex:1;";
    text.textContent = "Google sign-in doesn't work inside this app's built-in browser. Tap the ⋯ or ⋮ menu above and choose \"Open in Browser\" to continue.";
    banner.appendChild(text);

    var copyBtn = document.createElement("button");
    copyBtn.type = "button";
    copyBtn.textContent = "Copy link";
    copyBtn.style.cssText = "flex-shrink:0;padding:6px 12px;border-radius:8px;border:1px solid #E3AFA8;background:#fff;color:#7A2E26;font:600 12px/1 -apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;cursor:pointer;";
    copyBtn.onclick = function () {
      try {
        navigator.clipboard.writeText(location.href).then(function () {
          copyBtn.textContent = "Copied!";
          setTimeout(function () { copyBtn.textContent = "Copy link"; }, 2000);
        });
      } catch (e) { /* clipboard unavailable in some webviews — button just stays as-is */ }
    };
    banner.appendChild(copyBtn);

    var closeBtn = document.createElement("button");
    closeBtn.type = "button";
    closeBtn.setAttribute("aria-label", "Dismiss");
    closeBtn.textContent = "×";
    closeBtn.style.cssText = "flex-shrink:0;width:24px;height:24px;border:none;background:transparent;color:#7A2E26;font-size:18px;line-height:1;cursor:pointer;";
    closeBtn.onclick = function () { banner.remove(); };
    banner.appendChild(closeBtn);

    document.body.insertBefore(banner, document.body.firstChild);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", injectBanner);
  } else {
    injectBanner();
  }
})();
