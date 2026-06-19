"use strict";
// ── i18n Index ────────────────────────────────────────────────────────────────
// Merges language dictionaries from LANG_TR / LANG_EN / LANG_AZ / LANG_DE
// (each set as window.LANG_* before this file).
// NOTE: Does NOT touch TRANSLATIONS (a const in app.js — loaded after).
// app.js reads from window.LANG_* at startup to build TRANSLATIONS.
// ─────────────────────────────────────────────────────────────────────────────

(function () {
  var langs = {
    tr: window.LANG_TR || {},
    en: window.LANG_EN || {},
    az: window.LANG_AZ || {},
    de: window.LANG_DE || {},
  };

  window.i18n = {
    langs: langs,
    /**
     * t(key, lang?) — returns translated string.
     * Falls back to TR then the raw key.
     */
    t: function(key, lang) {
      var l = lang || localStorage.getItem('rep_uiLang') || 'tr';
      return (langs[l] && langs[l][key]) || (langs.tr && langs.tr[key]) || key;
    },
    /**
     * currentLang() — reads the active language code.
     */
    currentLang: function() {
      return localStorage.getItem('rep_uiLang') || 'tr';
    },
  };
})();
