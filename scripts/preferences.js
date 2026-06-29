export const Preferences = {
  CURRENT_VERSION: 0.52,
  Defaults: {
    // Model
    lastSelectedOptionsTab: 0,
    lastActiveCategories: "",
    "validityCheck.onUpdate": true,
    // General Prefs
    focusSearchFromMenu: false,
    lastUpdateMessage: "0",
    showShortcutNumber: false,
    showUnreadOnButtons: true,
    showQuickfoldersLabel: true,
    "textQuickfoldersLabel.displayServer": false,
    "textQuickfoldersLabel.delimiter": ": ",
    textQuickfoldersLabel: "QuickFolders",
    showUnreadFoldersBold: true,
    useNavigateShortcuts: true,
    useKeyboardShortcuts: true,
    useKeyboardShortcutCTRL: false,
    showTotalNumber: false,
    showFoldersWithMessagesItalic: false,
    showFoldersWithNewMailItalic: true,
    showNewMailHighlight: true,
    "showNewMailHighlight.outline": true,
    showRecentTab: false,
    showQuickMove: true,
    collapseCategories: false,
    autoFocusPreview: true,
    showSubfolders: true,
    disableFolderSwitching: false,
    showCountInSubFolders: true,
    enableMenuAlphaSorting: false,
    alphaSortFoldersReverse: false,
    useRebuildShortcut: false,
    rebuildShortcutKey: "F",
    "quickJump.useHotkey": true,
    "quickJump.Hotkey": "J",
    "quickJump.Hotkey.Shift": true,
    "accessibility.hideIconMenu": false,
    "accessibility.subFolderParentEntry": false,
    "quickMove.priorityTabs": true,
    "quickMove.createFolderOnTop": false,
    "quickMove.useHotkey": true,
    "quickMove.Hotkey": "M",
    "quickMove.Hotkey.Shift": true,
    "quickMove.history": "[]",
    "quickMove.lastFolderName": "",
    "quickMove.lastFolderURI": "",
    "quickMove.autoFill": true,
    "quickMove.folderLabel": true,
    "quickMove.reopenMsgTabAfterMove": false,
    "quickMove.gotoNextMsgAfterMove": true,
    "quickCopy.useHotkey": false,
    "quickCopy.Hotkey": "T",
    "quickCopy.Hotkey.Shift": true,
    "skipFolder.useHotkey": false,
    "skipFolder.Hotkey": "S",
    "skipFolder.Hotkey.Shift": true,
    showToolIcon: true,
    scrollToCenter: true,
    "moveMailStatus.set": 0,
    "moveMailStatus.quickMove": false,
    "bookmarks.folderLabel": true,
    "bookmarks.showButton": true,
    "bookmarks.maxEntries": 100,
    "bookmarks.searchUri": "",
    "bookmarks.openMethod": "currentTab",
    "toolbar.minHeight": "24",
    "toolbar.hideInSingleMessage": false,
    "toolbar.largeIcons": false,
    "toolbar.customIconSize": 16,
    "behavior.nonFolderView.openNewTab": true,
    "style.transitions": true,
    "tooltips.parentFolder": false,
    "tooltips.baseFolder": true,
    "tooltips.serverName": true,
    "tooltips.virtualFlag": true,
    "tooltips.msgFolderFlags": false,
    "tooltips.screenReaderSuppress": false,
    autoValidateFolders: true,
    treeIconsDelay: 7500,
    optionsInTab: true,
    "findRelated.list": "",
    "findRelated.pattern": "",
    "findRelated.group": 0,
    "findRelated.searchSelected": '["subject"]',
    "findRelated.searchCriteria": '["subject","sender","recipients"]',
    "findRelated.lastSearchVal": "",
    "findRelated.behavior.goNextResetsSearch": false,
    "findRelated.behavior.selectPrevious": false,
    "findRelated.lastIdx": -1,
    "api.mailTabs.timeout": 5000,
    // === CURRENT FOLDER TOOLBAR ===
    showCurrentFolderToolbar: true,
    "showCurrentFolderToolbar.messageWindow": false,
    "showCurrentFolderToolbar.singleMailTab": true,
    "currentFolderBar.showClose": false,
    "currentFolderBar.showRecentButton": true,
    "currentFolderBar.showFilterButton": true,
    "currentFolderBar.showFindRelated": true,
    "currentFolderBar.showFolderMenuButton": false,
    "currentFolderBar.showIconButtons": true,
    "currentFolderBar.showRepairFolderButton": false,
    "currentFolderBar.navigation.showButtons": true,
    "currentFolderBar.skipUnreadFolder": true,
    "currentFolderBar.folderNavigation.showButtons": false,
    "currentFolderBar.background":
      "linear-gradient(to top, #FFF 7%, rgb(189,185,189) 88%, #EEE 100%)",
    "currentFolderBar.background.selection": "lightweight",
    "currentFolderBar.background.lightweight": true,
    "currentFolderBar.folderTreeIcon": true,
    "currentFolderBar.flexLeft": 3,
    "currentFolderBar.flexRight": 6,
    "currentFolderBar.background.custom":
      "linear-gradient(140deg, rgba(0,0,0,0) 0%,rgba(0,0,0,0) 12%,rgba(0,0,0,1) 14%,rgba(214,40,40,1) 24%,rgba(255,231,50,1) 32%,rgba(255,231,50,0.0) 34%,rgba(0,0,0,0) 100%)",
    "currentFolderBar.iconcolor.custom": false,
    "currentFolderBar.iconcolor": "#FFFFFF",
    // === BACKUP / RESTORE ===
    "files.path": "",
    "restoreConfig.general": true,
    "restoreConfig.tabs": true,
    "restoreConfig.layout": true,
    // === LAYOUT ===
    "style.theme": "flatTabs",
    buttonFontSizeN: 0,
    menuFontSize: 0,
    showIcons: true,
    initDelay: 250,
    colorTabStyle: 0,
    queuedFolderUpdateDelay: 500,
    transparentButtons: false,
    transparentToolbar: true,
    buttonShadows: false,
    pastelColors: true,
    "style.corners.customizedRadius": false,
    "style.corners.customizedTopRadiusN": 4,
    "style.corners.customizedBottomRadiusN": 0,
    "style.button.minHeight": 20,
    "style.button.paddingTop": 1,
    // === STATE COLORS / THEMING ===
    "style.Toolbar.bottomLineWidth": 3,
    "style.Toolbar.background-color": "transparent",
    "style.ActiveTab.color": "#FFFFFF",
    "style.ActiveTab.background-color": "#000090",
    "style.ActiveTab.paletteEntry": 5,
    "style.ActiveTab.paletteType": 1,
    "style.palette.version": 0,
    "style.DragOver.color": "#E93903",
    "style.DragOver.background-color": "#FFFFFF",
    "style.DragOver.paletteEntry": 10,
    "style.DragOver.paletteType": 1,
    "style.DragTab.color": "#FFFFFF",
    "style.DragTab.background-color": "#E93903",
    "style.HoveredTab.color": "#FFFFFF",
    "style.HoveredTab.background-color": "orange",
    "style.HoveredTab.paletteEntry": 3,
    "style.HoveredTab.paletteType": 1,
    "style.InactiveTab.color": "buttontext",
    "style.InactiveTab.background-color": "buttonface",
    "style.InactiveTab.paletteEntry": 20,
    "style.InactiveTab.paletteType": 0,
    "style.ColoredTab.paletteType": 1,
    "style.activeTabCustomColor": true,
    // NOTIFICATIONS
    "notifications.compactComplete": true,
    // DRAG SYSTEM
    "drag.popupDelay": 250,
    "drag.moveTolerance": 3,
    // NEW FOLDER ITEM
    "dragToCreateFolder.owl": true,
    "dragToCreateFolder.pop3": true,
    "dragToCreateFolder.imap": true,
    "dragToCreateFolder.imap.delay": 400,
    "dragToCreateFolder.local": true,
    "dragToCreateFolder.menutop": false,
    "newFolderCallback.encodeURI": false,
    // RECENT FOLDERS
    "recentfolders.itemCount": 12,
    "recentfolders.showLabel": true,
    "recentfolders.sortAlphabetical": false,
    "recentfolders.color": 10,
    "recentfolders.showIcon": true,
    "recentfolders.folderPathDetail": 3,
    "recentfolders.maxPathItems": 3,
    "recentfolders.showTimeStamp": false,
    "recentfolders.subfolders": false,
    // UPDATE / OPTIMIZATION
    "update.disableMinimal": false,
    // FOLDER MENU
    "folderMenu.CTRL": false,
    "folderMenu.getMessagesForInbox": true,
    "folderMenu.getMessagesForNews": true,
    "folderMenu.markAllRead": true,
    "folderMenu.markAllReadRecursive": false,
    "folderMenu.emptyJunk": true,
    "folderMenu.emptyTrash": true,
    "folderMenu.dragToNew": true,
    "folderMenu.openNewTab": false,
    "folderMenu.realignMinTabs": 25,
    // COMMAND MENU
    "commandMenu.options": true,
    "commandMenu.separator": true,
    "commandMenu.CTRL": false,
    "commandMenu.lineBreak": true,
    "commandMenu.icon": false,
    "tabIcons.defaultPath": "",
    "commandMenu.support": true,
    "commandMenu.help": true,
    // UPDATE STATE
    hasNews: false,
    hideVersionOnUpdate: true,
    version: "?",
    // FOLDER TREE
    "folderTree.icons": true,
    "folderTree.icons.injectCSS": true,
    // FILTER TEMPLATE
    "filters.currentTemplate": "from",
    "filters.showMessage": true,
    "contextMenu.hideFilterMode": false,
    // LICENSE / PREMIUM
    licenseType: 0,
    "premium.categories.multiSelect": false,
    "premium.findFolder.focusFixTimeout": 200,
    "premium.findFolder.maxParentLevel": 2,
    "premium.findFolder.maxPathItems": 3,
    "premium.findFolder.folderPathDetail": 2,
    "premium.findFolder.disableSpace": false,
    "premium.findFolder.autoCollapse": true,
    "premium.skipUnreadFolder.sort": true,
    "quickMove.premium.silentMode": false,
    "quickMove.premium.escapeClearsList": false,
    "quickJump.premium.forceTab": false,
    "quickMove.premium.excludedAccounts": "",
    "quickMove.premium.lockInAccount": false,
    "quickMove.maxResults": 25,
    "quickMove.singleTab.autoClose": false,
    // PREMIUM USAGE COUNTERS
    "premium.advancedTabProperties.usage": 0,
    "premium.bookmarks.usage": 0,
    "premium.findFolder.usage": 0,
    "premium.lineBreaks.usage": 0,
    "premium.pasteFolderEntries.usage": 0,
    "premium.quickMove.usage": 0,
    "premium.skipUnreadFolder.usage": 0,
    "premium.tabIcons.usage": 0,
    "premium.tabSeparator.usage": 0,
    // LICENSING
    "licenser.forceSecondaryIdentity": false,
    "license.gracePeriodDate": "",
    LicenseKey: "",
    "LicenseKey.backup": "",
    // UI LIMITS
    "menuMessageList.maxSubjectLength": 40,
  },
  DebugDefaults: {
    debugActive: false, // was "debug"
    "debug.assistant": false,
    "debug.assistant.ui": false,
    "debug.accessibility": false,
    "debug.firstrun": false,
    "debug.buttonStyle": false,
    "debug.bookmarks": false,
    "debug.categories": false,
    "debug.composer": false,
    "debug.css": false,
    "debug.css.Detail": false,
    "debug.css.AddRule": false,
    "debug.css.styles.restoreRules": false,
    "debug.css.styleSheets": false,
    "debug.css.palette.styleSheets": false,
    "debug.css.palette": false,
    "debug.dnd": false,
    "debug.dnd.detail": false,
    "debug.dragToNew": false,
    "debug.events": false,
    "debug.events.keyboard": false,
    "debug.filters": false,
    "debug.folderTree": false,
    "debug.folderTree.selector": false,
    "debug.folderTree.icons": false,
    "debug.folders": false,
    "debug.folders.select": false,
    "debug.": false,
    "debug.identities": false,
    "debug.interface": false,
    "debug.interface.buttonStyles": false,
    "debug.interface.currentFolderBar": false,
    "debug.interface.findFolder": false,
    "debug.interface.findFolder.focus": false,
    "debug.interface.findFolder.menus": false,
    "debug.interface.findFolder.keyDelay": 0,
    "debug.interface.tabs": false,
    "debug.interface.update": false,
    "debug.listeners.folder": false,
    "debug.listeners.tabmail": false,
    "debug.mailTabs": false,
    "debug.tbmenus": false,
    "debug.mouseclicks": false,
    "debug.moveCopy": false,
    "debug.navigation": false,
    "debug.notifications": false,
    "debug.options": false,
    "debug.popupmenus": false,
    "debug.popupmenus.verticalOffset": 0,
    "debug.popupmenus.isCommandListeners": false,
    "debug.popupmenus.isOnCommandAttr": false,
    "debug.popupmenus.subfolders": false,
    "debug.popupmenus.items": false,
    "debug.popupmenus.collapse": false,
    "debug.popupmenus.drag": false,
    "debug.performance": false,
    "debug.premium": false,
    "debug.premium.quickJump": false,
    "debug.premium.licenser": false,
    "debug.premium.forceShowExtend": false,
    "debug.premium.rsa": false,
    "debug.quickMove": false,
    "debug.recentFolders": false,
    "debug.recentFolders.detail": false,
    "debug.saleDate": "",
    "debug.advancedTabProperties.forcePopup": false,
    "debug.toolbarHiding": false,
    "debug.updateFolders": false,
  },

  _data: {},
  _debugData: {},
  _model: { folders: [] },
  _ready: false,
  async init() {
    // a flat object. e.g. stored["refreshHeaders.wait"] = 150;
    let {
      settings = {},
      debug = {},
      model = { folders: [] },
    } = await browser.storage.local.get({
      settings: {},
      debug: {},
      model: { folders: [] },
    });
    const version = settings.settingsVersion ?? 0;
    Preferences._model = model;

    if (version < Preferences.CURRENT_VERSION) {
      const {
        settings: mOptions,
        debug: mDebug,
        folders,
      } = await Preferences._migrateLegacyPrefs();

      // avoid overwriting newer backup with older one:
      if (settings["LicenseKey.backup"] !== undefined) {
        mOptions["LicenseKey.backup"] = settings["LicenseKey.backup"];
      }

      settings = {
        ...mOptions,
        settingsVersion: Preferences.CURRENT_VERSION,
      };

      debug = { ...mDebug };
      Preferences._model.folders = folders;

      // store migrated data from Legacy Prefs
      await browser.storage.local.set({
        settings,
        debug,
        model: Preferences._model,
      });
    }
    Preferences._data = {
      ...Preferences.Defaults,
      ...settings,
    };
    Preferences._debugData = {
      ...Preferences.DebugDefaults,
      ...debug,
    };

    Preferences._ready = true;

    function applyChanges(target, changesObj, updates, defaults) {
      // the structure is changes.settings.oldValue.key  [changes.debug.oldValue.key]
      // and              changes.settings.newValue.key  [changes.debug.newValue.key]
      const oldV = changesObj.oldValue || {};
      const newV = changesObj.newValue || {};

      for (const [key, val] of Object.entries(oldV)) {
        if (newV[key] === undefined) {
          delete target[key];
          if (Object.prototype.hasOwnProperty.call(defaults, key)) {
            updates[key] = defaults[key];
          } else {
            delete updates[key];
          }
          continue;
        }

        if (newV[key] === val) {
          continue;
        }

        // change value and record updates
        target[key] = newV[key];
        updates[key] = newV[key];
      }
    }

    // live sync all changes to cache. do not include model / folders
    messenger.storage.onChanged.addListener((changes, area) => {
      try {
        console.log("Preferences onChanged:", changes);
        if (area !== "local") {
          return;
        }
        if (!changes.settings && !changes.debug) {
          return;
        }
        const updates = {};
        if (changes.settings) {
          applyChanges(Preferences._data, changes.settings, updates, Preferences.Defaults);
        }
        if (changes.debug) {
          applyChanges(Preferences._debugData, changes.debug, updates, Preferences.DebugDefaults);
        }
        if (!Object.keys(updates).length) {
          return;
        }

        console.log("Preferences updates:", updates);
        messenger.Utilities.updatePreferencesCache(updates);
      } catch (e) {
        console.error("storage.onChanged crashed:", e);
      }
    });
  },

  _ensureReady(info) {
    if (!Preferences._ready) {
      const err = new Error("Preferences not initialized");
      err.info = info;
      throw err;
    }
  },

  get(name) {
    Preferences._ensureReady({ reason: "get", key: name });
    if (name === "debug") {
      return Preferences._debugData.debugActive ?? false;
    }
    if (name.startsWith("debug")) {
      return Preferences._debugData[name] ?? Preferences.DebugDefaults[name];
    }
    return Preferences._data[name] ?? Preferences.Defaults[name];
  },

  isDebug(key) {
    Preferences._ensureReady({ reason: "isDebug", key });
    // global switch
    if (!key) {
      return Preferences._debugData.debugActive ?? false;
    }
    // specific flag
    return (
      Preferences._debugData[`debug.${key}`] ?? Preferences.DebugDefaults[`debug.${key}`] ?? false
    );
  },

  async setMultiple(prefs) {
    if (!prefs || typeof prefs !== "object") {
      return;
    }
    const settingsPatch = {};
    for (const [name, value] of Object.entries(prefs)) {
      if (name.startsWith("debug")) {
        console.error("setMultiple: debug key rejected", name);
        continue;
      }
      if (this._data[name] === value) {
        continue;
      }
      this._data[name] = value;
      settingsPatch[name] = value;
    }

    const keys = Object.keys(settingsPatch);
    if (!keys.length) {
      return;
    }

    await browser.storage.local.set({
      settings: {
        ...this._data,
        ...settingsPatch,
      },
    });
  },

  async set(name, value) {
    Preferences._ensureReady({ reason: "set", key: name });

    if (name.startsWith("debug")) {
      if (Preferences._debugData[name] === value) {
        return;
      }
      Preferences._debugData[name] = value;
      const { debug } = await browser.storage.local.get({ debug: {} });
      debug[name] = value;
      await browser.storage.local.set({ debug });
      return;
    }

    if (Preferences._data[name] === value) {
      return;
    }
    Preferences._data[name] = value;
    const { settings } = await browser.storage.local.get({ settings: {} });
    settings[name] = value;
    await browser.storage.local.set({ settings });
  },

  async setModelFolders(folders) {
    try {
      const safeFolders = Array.isArray(folders) ? folders : [];

      // 1. update runtime model
      this._model.folders = safeFolders;

      // 2. persist to storage
      await browser.storage.local.set({
        model: {
          folders: safeFolders,
        },
      });

      return true;
    } catch (e) {
      console.error("setModelFolders failed:", e);
      return false;
    }
  },

  getBool(name) {
    return !!this.get(name);
  },

  getInt(name) {
    return parseInt(this.get(name), 10) || 0;
  },

  _normalizeType(key, value) {
    const def = this.Defaults[key] ?? this.DebugDefaults[key];

    if (typeof def === "boolean") {
      if (typeof value !== "boolean") {
        return def;
      }
    }

    if (typeof def === "number") {
      if (isNaN(value)) {
        return def;
      }
    }

    return value; // string fallback
  },

  async _migrateLegacyPrefs() {
    const legacy_root = "extensions.quickfolders.";
    const model_root = "QuickFolders.folders";

    const migratedOptions = {};
    const migratedDebug = {};
    // these stored entities have no defaults:
    const specialValues = ["LicenseKey.backup", "debug"];

    // Folders migration: stuff into _model.folders:
    let rawFolders;

    try {
      rawFolders = await messenger.LegacyPrefs.getPref(model_root);
    } catch (e) {
      console.warn("QuickFolders.folders not found during migration", e);
      rawFolders = [];
    }

    // normalize string storage
    if (typeof rawFolders === "string") {
      rawFolders = rawFolders.replace(/\r?\n|\r/g, "");

      try {
        rawFolders = JSON.parse(rawFolders);
      } catch (e) {
        console.warn("QuickFolders.folders JSON parse failed", e);
        rawFolders = [];
      }
    }

    if (typeof rawFolders === "string") {
      rawFolders = rawFolders.replace(/\r?\n|\r/g, "");

      try {
        rawFolders = JSON.parse(rawFolders);
      } catch (e) {
        console.warn("QuickFolders.folders JSON parse failed", e);
        rawFolders = [];
      }
    }

    if (!Array.isArray(rawFolders)) {
      rawFolders = [];
    }

    const folders = rawFolders
      .map((e) => {
        if (!e || typeof e !== "object") {
          return null;
        }

        // minimal structural normalization only
        const out = { ...e };

        // enforce known safety rules only
        if (typeof out.tabColor !== "number") {
          out.tabColor = 0;
        }

        // legacy cleanup only
        if (out.disableValidation) {
          delete out.disableValidation;
        }

        return out;
      })
      .filter((e) => e !== null);

    const migrationKeys = [
      ...Object.keys(this.Defaults),
      ...Object.keys(this.DebugDefaults),
      ...specialValues,
     ]
      .filter((key, index, arr) => arr.indexOf(key) === index)
      .sort();

    for (const key of migrationKeys) {
      const legacyKey = legacy_root + key;

      try {
        const value = await messenger.LegacyPrefs.getPref(legacyKey);

        if (value === undefined) {
          continue;
        }

        const normalized = this._normalizeType(key, value);

        // ---- DEBUG SPLIT ----
        // Legacy pref named "debug" becomes debugActive in the new debug object.
        // There is never a legacy "debugActive" key, but this keeps the branch explicit.
        if (key === "debug" || key === "debugActive") {
          migratedDebug.debugActive = normalized;
          continue;
        }

        if (key.startsWith("debug.")) {
          migratedDebug[key] = normalized;
          continue;
        }

        // ---- EVERYTHING ELSE ----
        migratedOptions[key] = normalized;
      } catch {
        console.warn(`Preference ${legacyKey} not found during migration.`);
      }
    }

    return {
      settings: {
        ...migratedOptions,
        settingsVersion: Preferences.CURRENT_VERSION,
      },
      debug: migratedDebug,
      folders,
    };
  },
};
