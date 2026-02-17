/* globals 
  WL
*/

(function QuickFoldersUIPolyfills() {
  const Util = window.QuickFolders.Util;
  Util.logDebug("QuickFolders UI patching in window:", window.location.href);
  var Services =
    globalThis.Services || ChromeUtils.import("resource://gre/modules/Services.jsm").Services;

  const isPoly143 = Util.versionGreaterOrEqual(Services.appinfo.version, "143");
  // add more in the future here...

  if (!isPoly143) {
    Util.logDebug("QuickFoldersUIPolyfills()\n", "Nothing to do, early exit...");
  } 

  const willy = typeof WL !== "undefined" ? WL : window.QuickFolders?.WL;

  if (!willy) {
    Util.logHighlight(
      "Can't polyfill menu items, no WindowListener in:",
      { color: "pink", background: "rgb(40,0,0)" },
      `window location= ${window.location.href}`,
    );
    return;
  }

  // Style all menu items.

  // Tb143+ override
  // Deals with [issue 602] Thunderbird 143: all menu icons of all popups broken
  if (isPoly143) {
    Util.logDebug("injecting quickfolders-143.css ...");
    willy.injectCSS("chrome://quickfolders/content/skin/quickfolders-143.css?v=5");
  }

  // Future regression patches can be added here
})();
