"use strict";
/* 
  BEGIN LICENSE BLOCK

	QuickFolders is released under the Creative Commons (CC BY-ND 4.0)
	Attribution-NoDerivatives 4.0 International (CC BY-ND 4.0) 
	For details, please refer to license.txt in the root folder of this extension

  END LICENSE BLOCK 
*/

//export  {QuickFolders.Preferences};

QuickFolders.Preferences = {
  TABS_STRIPED: 0,
  TABS_FILLED: 1,

  get isDebug() {
    return this.getBoolPref("debug");
  },

  setLastActiveCats: async function (c) {
    await this.setStringPref("lastActiveCategories", c);
  },

  get lastActiveCats() {
    return this.getStringPref("lastActiveCategories");
  },

  isDebugOption: function (option) {
    // granular debugging
    if (!this.isDebug) {
      return false;
    }
    let options = option.split(",");
    for (let o of options) {
      try {
        if (this.getBoolPref("debug." + o)) {
          return true;
        }
      } catch (ex) {
        console.log(`invalid debug option: ${option}`, ex);
      }
    }
    return false;
  },

  setDebugOption: async function (option, val) {
    return await this.setBoolPref("debug." + option, val);
  },

  storeFolderEntries: async function (folderEntries) {
    try {
      return await QuickFolders.Preferences.cache.storeModel(folderEntries);
    } catch (e) {
      QuickFolders.Util.logToConsole("storeFolderEntries() " + e);
    }
  },

  loadFolderEntries: function () {
    try {
      let entries = QuickFolders.Preferences.cache.loadModel();
      for (let i = 0; i < entries.length; i++) {
        let e = entries[i];

        if (typeof e.tabColor === "undefined" || e.tabColor === "undefined") {
          e.tabColor = 0;
        }
        // default the name!!
        if (!e.name) {
          // retrieve the name from the folder uri (prettyName)
          let f = QuickFolders.Model.getMsgFolderFromUri(e.uri, false);
          if (f) {
            e.name = f.prettyName || f.localizedName;
          }
        }
        // when loading, reset the disabled Validation!
        if (e.disableValidation) {
          let swap = entries[i];
          delete swap.disableValidation;
          entries[i] = swap;
          // entries[i].disableValidation = false;
        }
      }
      return entries;
    } catch (e) {
      QuickFolders.Util.logToConsole("loadFolderEntries()" + e);
      return [];
    }
  },

  get isShowUnreadCount() {
    return this.getBoolPref("showUnreadOnButtons");
  },

  get isShowQuickFoldersLabel() {
    return this.getBoolPref("showQuickfoldersLabel") || this.getBoolPref("hasNews");
  },

  get isShowUnreadFoldersBold() {
    return this.getBoolPref("showUnreadFoldersBold");
  },

  get isHighlightNewMail() {
    return this.getBoolPref("showNewMailHighlight");
  },

  get isHighlightNewMailOutline() {
    return this.getBoolPref("showNewMailHighlight.outline");
  },

  get isItalicsNewMail() {
    // xxx experimental
    return this.getBoolPref("showFoldersWithNewMailItalic");
  },

  get isShowRecursiveFolders() {
    return this.getBoolPref("showSubfolders");
  },

  get isKeyboardListeners() {
    return (
      this.isUseNavigateShortcuts ||
      this.isUseKeyboardShortcuts ||
      this.isUseRebuildShortcut ||
      this.isQuickJumpShortcut ||
      this.isQuickMoveShortcut ||
      this.isQuickCopyShortcut ||
      this.isSkipFolderShortcut
    );
  },

  get isUseNavigateShortcuts() {
    return this.getBoolPref("useNavigateShortcuts");
  },

  get isUseKeyboardShortcuts() {
    return this.getBoolPref("useKeyboardShortcuts");
  },

  get isUseRebuildShortcut() {
    return this.getBoolPref("useRebuildShortcut");
  },

  get RebuildShortcutKey() {
    return this.getStringPref("rebuildShortcutKey");
  },

  get isQuickJumpShortcut() {
    return this.getBoolPref("quickJump.useHotkey");
  },

  get QuickJumpShortcutKey() {
    return this.getStringPref("quickJump.Hotkey");
  },

  get isQuickJumpShift() {
    return this.getBoolPref("quickJump.Hotkey.Shift");
  },

  get isQuickMoveShortcut() {
    return this.getBoolPref("quickMove.useHotkey");
  },

  get QuickMoveShortcutKey() {
    return this.getStringPref("quickMove.Hotkey");
  },

  get isQuickMoveShift() {
    return this.getBoolPref("quickMove.Hotkey.Shift");
  },

  get isQuickCopyShortcut() {
    return this.getBoolPref("quickCopy.useHotkey");
  },

  get QuickCopyShortcutKey() {
    return this.getStringPref("quickCopy.Hotkey");
  },

  get isQuickCopyShift() {
    return this.getBoolPref("quickCopy.Hotkey.Shift");
  },

  get isSkipFolderShortcut() {
    return this.getBoolPref("skipFolder.useHotkey");
  },

  get SkipFolderShortcutKey() {
    return this.getStringPref("skipFolder.Hotkey");
  },

  get isUseKeyboardShortcutsCTRL() {
    return this.getBoolPref("useKeyboardShortcutCTRL");
  },

  get isShowShortcutNumbers() {
    return this.getBoolPref("showShortcutNumber");
  },

  get isShowTotalCount() {
    return this.getBoolPref("showTotalNumber");
  },

  get isShowCountInSubFolders() {
    return this.getBoolPref("showCountInSubFolders");
  },

  get isShowFoldersWithMessagesItalic() {
    return this.getBoolPref("showFoldersWithMessagesItalic");
  },

  get isFocusPreview() {
    return this.getBoolPref("autoFocusPreview");
  },

  get isShowToolbarIcons() {
    return this.getBoolPref("showIcons");
  },

  get isChangeFolderTreeViewEnabled() {
    return !this.getBoolPref("disableFolderSwitching");
  },

  get isSortSubfolderMenus() {
    return this.getBoolPref("enableMenuAlphaSorting");
  },

  get isSortSubfolderMenusReverse() {
    return this.getBoolPref("alphaSortFoldersReverse");
  },

  get isShowRecentTab() {
    return this.getBoolPref("showRecentTab");
  },

  get isShowRecentTabIcon() {
    return this.getBoolPref("recentfolders.showIcon");
  },

  get isPastelColors() {
    // OBSOLETE!
    return this.getBoolPref("pastelColors");
  },

  get recentTabColor() {
    return this.getIntPref("recentfolders.color");
  },

  get isMinimalUpdateDisabled() {
    return this.getBoolPref("update.disableMinimal");
  },

  get isShowToolIcon() {
    return this.getBoolPref("showToolIcon");
  },

  get isShowReadingList() {
    return this.getBoolPref("bookmarks.showButton");
  },

  get isShowQuickMove() {
    return this.getBoolPref("showQuickMove");
  },
  get isCssTransitions() {
    return this.getBoolPref("style.transitions");
  },

  get ButtonFontSize() {
    return this.getIntPref("buttonFontSizeN");
  },

  get MenuFontSize() {
    return this.getIntPref("menuFontSize");
  },

  get TextQuickfoldersLabel() {
    let overrideLabel = "";
    // extend this for delivering the news splash when updated!
    /*
    if (QuickFolders.Preferences.getBoolPref("hasNews")) {
      overrideLabel = QuickFolders.Util.getBundleString("qf.notification.newsFlash", "QuickFolders");
		}
    else */
    if (QuickFolders.Util.licenseInfo.isExpired) {
      overrideLabel = QuickFolders.Util.getBundleString("qf.notification.premium.btn.renewLicense");
    }

    try {
      // to support UNICODE: https://developer.mozilla.org/pl/Fragmenty_kodu/Preferencje
      const url = "textQuickfoldersLabel";
      let customTitle = this.getStringPref(url);
      return overrideLabel || customTitle;
    } catch {
      return overrideLabel || "QuickFolders";
    }
  },

  get maxSubjectLength() {
    return this.getIntPref("menuMessageList.maxSubjectLength");
  },

  get ColoredTabStyle() {
    // 0 - striped
    // 1 - filled
    if (this.CurrentThemeId === "nativeTabs") {
      // force striped for native tabs!
      return this.TABS_STRIPED;
    }
    const result = this.getIntPref("colorTabStyle");
    return result;
  },

  getUserStyle: function (sId, sType, sDefault) {
    // note: storing color as string in order to store OS specific colors like Menu, Highlight
    // usage: getUserStyle("ActiveTab","background-color","HighLight")
    // usage: getUserStyle("ActiveTab","color", "HighlightText")
    let sStyleName = "style." + sId + "." + sType,
      sReturnValue = "";

    try {
      let localPref =
        typeof sDefault == "string" ? this.getStringPref(sStyleName) : this.getIntPref(sStyleName);
      if (localPref || localPref === 0) {
        sReturnValue = localPref;
      } else {
        sReturnValue = sDefault;
      }
    } catch (ex) {
      console.warn(`getUserStyle($sId) not found!`, ex);
      sReturnValue = sDefault;
    }
    return sReturnValue;
  },

  setUserStyle: async function (sId, sType, sValue) {
    let sStyleName = "style." + sId + "." + sType;
    await this.setStringPref(sStyleName, sValue);
  },

  getBoolPrefSilent: function (p) {
    try {
      return this.getBoolPref(p);
    } catch {
      return false;
    }
  },

  getBoolPrefVerbose: function (p) {
    try {
      return this.getBoolPref(p);
    } catch (e) {
      QuickFolders.Util.logException("getBoolPrefVerbose(" + p + ") failed\n", e);
      return false;
    }
  },

  getBoolPref(p) {
    return QuickFolders.Preferences.cache.getValue(p);
  },

  async setBoolPref(p, v) {
    return QuickFolders.Preferences.cache.setValue(p, v);
  },

  async setPrefsGroup(prefs) {
    try {
      if (!prefs || typeof prefs !== "object") {
        return false;
      }
      const clean = {};
      for (const [key, value] of Object.entries(prefs)) {
        if (key.startsWith("debug")) {
          console.error("setPrefsGroup: debug key rejected", key);
          continue;
        }
        clean[key] = value;
      }

      if (!Object.keys(clean).length) {
        return true;
      }
      await QuickFolders.Util.notifyTools.notifyBackground({
        func: "setCachedPrefSet",
        prefs: clean,
      });

      return true;
    } catch (e) {
      console.error("setPrefsGroup failed:", e);
      return false;
    }
  },

  // reading prefs across extensions will be forbidden, check:
  // https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/runtime/onMessageExternal
  getFiltersBoolPref: function (p, defaultV) {
    // TO DO: convert this to get the setting from quickFilters directly
    //        as we cannot assume that quickFilters stores in Legacy Prefs anymore
    let ans;
    try {
      ans = Services.prefs.getBoolPref("extensions.quickfilters." + p);
    } catch {
      QuickFolders.Util.logDebug(
        `getFiltersBoolPref(${p}) didn't retrieve a setting from quickFilters (probably this companion Add-on is not installed).\nDefaulting to ${defaultV}`
      );
      ans = defaultV;
    }
    return ans;
  },

  getStringPref(p) {
    return QuickFolders.Preferences.cache.getValue(p);
  },

  async setStringPref(p, v) {
    return QuickFolders.Preferences.cache.setValue(p, v);
  },

  getIntPref: function getIntPref(p) {
    return QuickFolders.Preferences.cache.getValue(p);
  },

  async setIntPref(p, v) {
    return QuickFolders.Preferences.cache.setValue(p, v);
  },

  setShowCurrentFolderToolbar: async function (b, selector) {
    let tag = "showCurrentFolderToolbar";
    if (selector) {
      tag = tag + "." + selector;
    }
    return await this.setBoolPref("extensions.quickfolders." + tag, b);
  },

  isShowCurrentFolderToolbar: function (selector) {
    let tag = "showCurrentFolderToolbar";
    if (selector) {
      tag = tag + "." + selector;
    }
    return QuickFolders.Preferences.getBoolPref(tag, false);
  },

  get CurrentTheme() {
    let id = this.CurrentThemeId;
    return QuickFolders.Themes.Theme(id);
  },

  get CurrentThemeId() {
    return this.getStringPref("style.theme");
  },

  get supportsCustomIcon() {
    return true; // may be forbidden in future Thunderbird versions? 91+
  },

  get supportsFindRelated() {
    if (!QuickFolders.Util.licenseInfo.isValid) {
      return false;
    }
    if (QuickFolders.Util.licenseInfo.keyType == 2) {
      return false;
    }
    return this.getBoolPref("currentFolderBar.showFindRelated");
  },

  ensureReady: async function () {
    await QuickFolders.Preferences.cache.awaitReady;
  },
};

QuickFolders.Preferences.cache = (() => {
  const cache = {
    _data: {},
    _model: { folders: []},
    _resolveReady: null,
    awaitReady: null /* init-only gate; NOT a lock for updates */,
    getValue: (k) => cache._data[k],

    setValue: async (k, v) => {
      cache._data[k] = v;
      let varType = "undefined";
      switch (typeof v) {
        case "number":
          varType = "int";
          break;
        case "boolean":
          varType = "bool";
          break;
        case "string":
          varType = "string";
          break;
      }
      try {
        await QuickFolders.Util.notifyTools.notifyBackground({
          func: "setCachedPref",
          kind: varType,
          key: k,
          value: v,
        });
      } catch (ex) {
        console.error("Pref sync failed:", k, ex);
      }
    },

    setValueSet: async (prefs) => {
      // optimized functino for multiple changes.
      if (!prefs || typeof prefs !== "object") {
        return;
      }
      // 1. update local cache immediately
      Object.assign(cache._data, prefs);
      try {
        await QuickFolders.Util.notifyTools.notifyBackground({
          func: "setCachedPrefSet",
          prefs
        });
      } catch (ex) {
        console.error("Pref set batch sync failed:", ex);
      }
    },

    init: async () => {
      // create an async blocker.
      cache.awaitReady = new Promise((resolve) => {
        // blocks all external callers until we're done here
        cache._resolveReady = resolve;
      });

      try {
        console.log("Preferences Cache - notifyTools:", QuickFolders.Util?.notifyTools);
        const {prefs, model} = await QuickFolders.Util.notifyTools.notifyBackground({
          func: "requestPrefCache",
        });
        cache._model.folders = [...(model?.folders || [])];
        console.log("Received preferences Cache:", prefs);
        console.log("Received model / folders:", cache._model);
        
        // remove all old data
        Object.keys(cache._data).forEach((k) => delete cache._data[k]);
        Object.assign(cache._data, prefs);
        // fill cache._data from backend snapshot
      } catch (ex) {
        console.error("requestPrefCache failed:", ex);
      }
      cache._resolveReady();
    },

    updateFromBackend: (data) => {
      // copies all enumerable own properties
      Object.assign(cache._data, data);
    },
    async storeModel(model) {
      cache._model.folders = Array.isArray(model) ? model : [];
      await QuickFolders.Util.notifyTools.notifyBackground({
        func: "setCachedModel",
        folders: cache._model.folders,
      });
    },
    loadModel() {
      return [...(cache._model.folders || [])];
    }

  };

  return cache;  
})();

QuickFolders.Preferences.cache.init();