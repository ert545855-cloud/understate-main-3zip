---
name: i18n Architecture
description: How the 4-language i18n system works — file load order, runtime source of truth, useT() pattern.
---

# i18n Architecture

## Runtime source of truth
`window.i18n.t(key, lang)` — reads from `window.LANG_TR/EN/AZ/DE`.

## File load order (SCREEN_FILES in index.html)
1. `src/i18n/tr.js` → sets `window.LANG_TR = {...}`
2. `src/i18n/en.js` → sets `window.LANG_EN = {...}`
3. `src/i18n/az.js` → sets `window.LANG_AZ = {...}`
4. `src/i18n/de.js` → sets `window.LANG_DE = {...}`
5. `src/i18n/index.js` → merges into `window.i18n` (must come after the 4 above)
6. `src/theme.js`, `src/components/UI.js`, `Header.js`, `BottomNav.js`, screens...
7. `src/app.js` last — defines `TRANSLATIONS` (a const, TDZ risk if accessed earlier)

## useT() hook (in app.js)
```js
function useT() {
  const lang = useLang();
  return (key) => {
    if (window.i18n) return window.i18n.t(key, lang);
    return (TRANSLATIONS[lang]||TRANSLATIONS.tr)[key] || (TRANSLATIONS.tr)[key] || key;
  };
}
```

**Why:** `window.i18n.t` is the single source of truth — all keys live in the 4 language files. `TRANSLATIONS` in app.js serves as a fallback for React-component-level T() calls during initial render before `window.i18n` is ready (rare), and as a duplicate safety net.

**Critical rule:** `src/i18n/index.js` MUST NOT reference `TRANSLATIONS` — it's defined as a `const` in app.js which loads after, causing a TDZ ReferenceError at parse time.

## Key coverage
All new keys (playerProfile, dailyTasks, notifications, stockMarket, etc.) must be added to ALL 4 language files AND to the TRANSLATIONS object in app.js for fallback parity.

## SvgIcon + BottomNav icons
- `_ICON_MAP` in app.js maps icon name → SVG file path in `assets/icons/`
- All BottomNav `NAV_GROUPS` items have `svgIcon` set — emoji `icon` is kept as final fallback if SVG fails to load
- New SVG files: home, sword, users, chat, shield, newspaper, trophy, mining, farm, tasks
