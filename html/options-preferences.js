("use strict");
/* BEGIN LICENSE BLOCK

QuickFolders is released under the Creative Commons (CC BY-ND 4.0)
Attribution-NoDerivatives 4.0 International (CC BY-ND 4.0) 
For details, please refer to license.txt in the root folder of this extension

END LICENSE BLOCK */

// preference functions specific to options.html
// keeping the old namespace so I know which funcitons I can retire when we convert to HTML

QuickFolders.Preferences = {
  TABS_STRIPED: 0,
  TABS_FILLED: 1,
  root: "extensions.quickfolders.", // OBSOLETE

  ensureReady: async function () {
    await prefsReady;
  },

  isDebug: async function () {
    return PrefCache.get("debug");
  },

  isDebugOption: async function (option) {
    // granular debugging
    return PrefCache.isDebug(option);
  },

  getUserStyle: async function getUserStyle(sId, sType, sDefault) {
    // note: storing color as string in order to store OS specific colors like Menu, Highlight
    // usage: getUserStyle("ActiveTab","background-color","HighLight")
    // usage: getUserStyle("ActiveTab","color", "HighlightText")
    let sStyleName = "style." + sId + "." + sType,
      sReturnValue = "";

    try {
      let localPref = await this.getStringPref(sStyleName);
      if (localPref || localPref === 0) {
        sReturnValue = localPref;
      } else {
        sReturnValue = sDefault;
      }
    } catch {
      sReturnValue = sDefault;
    }
    return sReturnValue;
  },

  setUserStyle: async function setUserStyle(sId, sType, sValue) {
    let sStyleName = "style." + sId + "." + sType;
    await this.setStringPref(sStyleName, sValue);
  },

  /* universal storage */
  getIntPreference: function (key) {
    try {
      let i = PrefCache.get(key);
      return parseInt(i, 10);
    } catch (ex) {
      QuickFolders.Util.logException("getIntPref(" + key + ") failed\n", ex);
      return 0;
    }
  },

  setIntPreference: async function (p, v) {
    return await PrefCache.set(p, v);
  },

  setBoolPrefVerbose: async function (p, v) {
    try {
      return await PrefCache.set(p, v);
    } catch (e) {
      QuickFolders.Util.logException("setBoolPrefVerbose(" + p + ") failed\n", e);
      return false;
    }
  },

  /* preference setters / getters that are always prefixed with quickfolders extension namespace */
  getIntPref: function (p) {
    let i = PrefCache.get(p);
    return parseInt(i, 10);
  },

  setIntPref: async function (key, v) {
    return await PrefCache.set(key, v);
  },

  getStringPref: function (p) {
    let prefString = "",
      key = p;
    try {
      prefString = PrefCache.get(key);
    } catch (ex) {
      QuickFolders.Util.logDebug("Could not retrieve string pref: " + p + "\n" + ex.message);
    }
    return prefString;
  },

  setStringPref: async function (key, v) {
    return await PrefCache.set(key, v);
  },

  getBoolPref: function (key) {
    let ans = false;
    try {
      ans = PrefCache.get(key);
    } catch (ex) {
      QuickFolders.Util.logException("getBoolPref(" + key + ") failed\n", ex);
      throw ex;
    }
    return ans;
  },

  setBoolPref: async function (key, v) {
    return await PrefCache.set(key, v);
  },

  setShowCurrentFolderToolbar: async function setShowCurrentFolderToolbar(b, selector) {
    let tag = "showCurrentFolderToolbar";
    if (selector) {
      tag = tag + "." + selector;
    }
    let key = tag;
    return PrefCache.set(key, b);
  },

  getCurrentTheme: async function () {
    let id = await this.getCurrentThemeId;
    return QuickFolders.Themes.Theme(id);
  },

  getCurrentThemeId: async function () {
    return await this.getStringPref("style.theme");
  },

  get supportsCustomIcon() {
    return true; // may be forbidden in future Thunderbird versions? 91+
  },

  get PrefCache() {
    return PrefCache;
  },
};

// import { Preferences as PrefCache } from "./scripts/preferences.js";
// making a dumb local cache for quick reading and (bulk) updates
var PrefCache = {
  _data: {
    settings: {},
    debug: {},
  },
  async syncFromStorage() {
    const storage = await browser.storage.local.get({ settings: {}, debug: {} });
    // console.log("syncFromStorage", storage);
    this._data.settings = storage.settings ?? {};
    this._data.debug = storage.debug ?? {};
  },
  init: async function () {
    // console.log("PrefCache.init");
    await this.syncFromStorage();
    const isDebug = this._data.debug?.debugActive || false;
    if (isDebug) {
      console.log("debug:", this._data.debug);
    }
    if (isDebug) {
      console.log("settings:", this._data.settings);
    }

    browser.storage.onChanged.addListener((changes, area) => {
      if (area !== "local") {
        return;
      }
      if (changes.settings) {
        this._data.settings = changes.settings.newValue ?? {};
      }
      if (changes.debug) {
        this._data.debug = changes.debug.newValue ?? {};
      }
    });
  },
  get: function (key) {
    if (key.startsWith("debug")) {
      // frontend key "debug" maps to "debugActive" in _debugData
      const storageKey = key === "debug" ? "debugActive" : key;
      return this._data.debug?.[storageKey];
    }
    return this._data.settings?.[key];
  },
  set: async function (key, val) {
    await this.syncFromStorage();
    if (key.startsWith("debug")) {
      // frontend key "debug" maps to "debugActive" in storage
      const storageKey = key === "debug" ? "debugActive" : key;
      const nextDebug = {
        ...(this._data.debug ?? {}),
        [storageKey]: val,
      };
      this._data.debug = nextDebug;
      return browser.storage.local.set({
        debug: nextDebug,
      });
    }

    const nextSettings = {
      ...(this._data.settings ?? {}),
      [key]: val,
    };
    this._data.settings = nextSettings;
    return browser.storage.local.set({ settings: nextSettings });
  },
  isDebug: function () {
    return !!this._data.debug?.debugActive;
  },
};

const prefsReady = PrefCache.init(); // pending
