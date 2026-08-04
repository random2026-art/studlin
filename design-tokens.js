// Design tokens for the UI conversion described in BUGS.md's sibling
// planning (calendar -> Today home -> Prep, three branches, nothing merges
// to main until all three are converted). Same plain-global pattern as
// datastore-events-sync.js: this codebase has no bundler and no shared-
// module system between or within bundles, so a <script> tag loaded
// before studlin-app.jsx is the only way to share this without
// introducing one. Also require()-able directly from Node.
//
// ── NAMING RULE ──────────────────────────────────────────────────────────
// Every name here is semantic (what it's FOR), never literal (what it
// LOOKS like). "surfaceCard", never "cream". "accent", never "lime" or
// "blue".
//
// ── WHY THIS IS A FUNCTION, NOT A STATIC OBJECT ─────────────────────────
// studlin-app.jsx already has a live, user-facing theme system: `T`
// (mutable, swapped in place by applyTheme()), a light/dark toggle via the
// `studlin-theme` localStorage key, and a 5-color accent picker
// (Lime/Forest/Sky/Lilac/Peach via `studlin-accent`) -- both real Settings
// features a real user may have already customized. Tokens must be the
// semantic layer those choices fill, not a second hardcoded palette that
// can drift out of sync with them or silently override a user's
// preference. So StudlinTokens(theme) resolves its color values from
// whatever theme object you hand it (pass `T` from studlin-app.jsx and
// you automatically get the user's actual light/dark + accent choice) --
// call it fresh on every render rather than caching the result, since `T`
// is mutated in place rather than replaced, so a stale reference would
// miss a live theme switch. Calling it with no argument (or from Node,
// where `T` doesn't exist) falls back to DEFAULT_COLOR below -- the
// original light/cream reference values this file was designed against.
//
// ── USAGE RULES (encoded here as documentation, not enforced by this file
//    -- these are conventions every future component must follow by hand) ──
//
// 1. ONE accent color. It is used ONLY for: the current/active item, a
//    primary action, and study/work blocks on the calendar. It is never
//    decorative -- if a component reaches for `accent` just because it
//    needs "a color" (an icon, a hover tint with no meaning, a border for
//    visual interest), that's the wrong token. Reach for a neutral instead.
//
// 2. Max ONE badge or status indicator per row or card. If a row seems to
//    need two, that's a sign one of them should just be plain text
//    (textSecondary), not a second visual indicator competing for
//    attention.
//
// 3. No permanent action buttons at rest. Rows/cards are tappable as a
//    whole; buttons appear only once that row is the active/expanded one
//    (progressive disclosure). A list of N rows should not render N
//    buttons before the student has touched any of them.

(function (root) {
  // STATIC tokens -- unaffected by light/dark or accent choice.
  var radius = { card: 6, control: 4, pill: 999 };
  var type = {
    weight: { regular: 400, medium: 500 },
    size: { pageHeader: 22, itemTitle: 15, metadata: 13, label: 11 },
  };
  var border = {
    hairline: "1px solid", // paired with color.border
    strong:   "1px solid", // paired with color.borderStrong -- same weight, higher-contrast color, not a thicker line
  };
  var spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24 };

  // Reference/default color values -- the light/cream palette from the
  // original Part 1 draft, kept as the documented default this file's
  // design decisions were made against, and as the fallback when no live
  // theme object is available (e.g. required() outside the browser).
  // Brand accent is the existing lime/green, not the blue seen in early
  // mockups -- that blue was an artifact of the tool the mockups were
  // drawn in, not a rebrand.
  var DEFAULT_COLOR = {
    surfacePage:   "#FAF8F3",
    surfaceCard:   "#FFFFFF",
    surfaceSunken: "#F1EEE6",
    textPrimary:   "#14140F",
    textSecondary: "#6B6A61",
    textTertiary:  "#9B9A90",
    border:        "rgba(20,20,15,0.10)",
    borderStrong:  "rgba(20,20,15,0.28)",
    accent:        "#7FA82A",
    accentHover:   "#658A1E",
    accentSubtle:  "rgba(127,168,42,0.12)",
    warning:       "#A6700C",
    warningSubtle: "rgba(166,112,12,0.12)",
    danger:        "#A8412C",
    dangerSubtle:  "rgba(168,65,44,0.12)",
  };

  function hexA(hex, a) {
    var h = String(hex).replace("#", "");
    var r = parseInt(h.slice(0, 2), 16), g = parseInt(h.slice(2, 4), 16), b = parseInt(h.slice(4, 6), 16);
    return "rgba(" + r + "," + g + "," + b + "," + a + ")";
  }

  // Resolves semantic tokens from the app's LIVE theme object (`T` in
  // studlin-app.jsx), so the same names used everywhere automatically
  // follow whatever the user actually has set -- light/dark, and which of
  // the 5 accent colors.
  function colorsFrom(theme) {
    if (!theme) return DEFAULT_COLOR;
    return {
      surfacePage:   theme.bg,
      surfaceCard:   theme.card,
      surfaceSunken: theme.card2,
      textPrimary:   theme.text,
      textSecondary: theme.muted,
      textTertiary:  theme.faint,
      border:        theme.border,
      borderStrong:  theme.borderHover,
      // theme.lime/limeDk ARE the user's chosen accent -- applyTheme()
      // overwrites them with whichever of the 5 accent palettes the user
      // picked, so reading them here (rather than a fixed hex) is what
      // makes this respect that choice instead of overriding it.
      accent:        theme.lime,
      accentHover:   theme.limeDk,
      accentSubtle:  theme.glow || hexA(theme.lime, 0.12),
      warning:       theme.amber,
      warningSubtle: hexA(theme.amber, 0.12),
      danger:        theme.red,
      dangerSubtle:  hexA(theme.red, 0.12),
    };
  }

  function StudlinTokens(theme) {
    return {
      color: colorsFrom(theme),
      radius: radius,
      type: type,
      border: border,
      spacing: spacing,
    };
  }
  StudlinTokens.defaultColor = DEFAULT_COLOR;
  StudlinTokens.colorsFrom = colorsFrom;

  if (typeof module !== "undefined" && module.exports) {
    module.exports = StudlinTokens;
  } else {
    root.StudlinTokens = StudlinTokens;
  }
})(typeof window !== "undefined" ? window : this);
