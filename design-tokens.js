// Design tokens for the UI conversion described in BUGS.md's sibling
// planning (calendar -> Today home -> Prep, three branches, nothing merges
// to main until all three are converted). Definition only -- nothing in
// the app reads this yet. Same plain-global pattern as
// datastore-events-sync.js: this codebase has no bundler and no shared-
// module system between or within bundles, so a <script> tag loaded
// before studlin-app.jsx is the only way to share this without
// introducing one. Also require()-able directly from Node if a future
// test wants to assert against real token values instead of hand-copied
// ones.
//
// ── NAMING RULE ──────────────────────────────────────────────────────────
// Every name here is semantic (what it's FOR), never literal (what it
// LOOKS like). "surfaceCard", never "cream". "accent", never "lime" or
// "blue". The payoff: adding a real dark mode later is swapping the
// values inside this one palette map, not re-reading every component to
// figure out which literal color name meant "the accent" this time. Dark
// mode is deliberately NOT built yet -- LIGHT is the only palette below.
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
//
// ── KNOWN PRE-EXISTING SYSTEM THIS DOESN'T TOUCH YET ────────────────────
// studlin-app.jsx already has a live, user-facing theme system: `T`
// (mutable, swapped in place by applyTheme()), light/dark via the
// `studlin-theme` localStorage key, and a 5-color accent picker
// (Lime/Forest/Sky/Lilac/Peach via `studlin-accent`) -- both real Settings
// features a real user may have already customized. This file does not
// replace or wire into that system; how the two reconcile (does the
// redesigned Calendar page ignore a user's stored dark-mode/accent
// preference and always render this light palette during the transition,
// or does something else happen) is a Part 2 question, not a Part 1 one.

(function (root) {
  var tokens = {
    color: {
      // Surfaces, lightest to most recessed.
      surfacePage:   "#FAF8F3", // page background
      surfaceCard:   "#FFFFFF", // cards, panels, modals
      surfaceSunken: "#F1EEE6", // recessed areas: inputs, the icon rail, subtle row hover

      // Text, most to least emphasis. Two weights only (see type.weight
      // below) -- these three tiers carry hierarchy through color and
      // size, not through heavier/bolder weight.
      textPrimary:   "#14140F", // near-black; headers, item titles, primary content
      textSecondary: "#6B6A61", // metadata, timestamps, secondary line under a title
      textTertiary:  "#9B9A90", // labels, placeholder text, the least important thing on screen

      // Borders.
      border:       "rgba(20,20,15,0.10)", // hairline default -- most dividers, card outlines
      borderStrong: "rgba(20,20,15,0.28)", // the one strong variant -- an active/selected outline, a focused input

      // The one accent. See USAGE RULES above for where it's allowed to
      // appear. Kept as the existing brand lime/green rather than
      // inventing a new hue -- CLAUDE.md and prior sessions treat this as
      // deliberate brand identity, not an incidental UI color. NOTE: the
      // mockup screenshots this round consistently used blue instead.
      // That wasn't confirmed as an intentional rebrand, so this file
      // keeps lime -- flag it on review if blue was actually the intent.
      accent:       "#7FA82A",
      accentHover:  "#658A1E",
      accentSubtle: "rgba(127,168,42,0.12)", // accent-tinted background behind accent text/icons

      // Semantic tints. Only these two -- no other decorative colors.
      warning:       "#A6700C",
      warningSubtle: "rgba(166,112,12,0.12)",
      danger:        "#A8412C",
      dangerSubtle:  "rgba(168,65,44,0.12)",
    },

    radius: {
      card:    6,   // cards, panels, modals
      control: 4,   // buttons, inputs, chips
      pill:    999, // ONLY genuine pills -- a tag, a status word. Not buttons, not cards.
    },

    type: {
      // Two weights only. Hierarchy comes from size + color tier above,
      // not from reaching for a heavier weight.
      weight: { regular: 400, medium: 500 },
      size: {
        pageHeader: 22, // one per screen
        itemTitle:  15, // a row/card's own title
        metadata:   13, // secondary line: time, subject, due date
        label:      11, // the smallest tier: section labels, tag text, timestamps in dense contexts
      },
    },

    border: {
      hairline: "1px solid",  // paired with color.border
      strong:   "1px solid",  // paired with color.borderStrong -- same weight, higher-contrast color, not a thicker line
    },

    spacing: {
      xs: 4,
      sm: 8,
      md: 12,
      lg: 16,
      xl: 24,
    },
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = tokens;
  } else {
    root.StudlinTokens = tokens;
  }
})(typeof window !== "undefined" ? window : this);
