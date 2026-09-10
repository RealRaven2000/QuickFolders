/* eslint-disable object-shorthand */
var { ExtensionCommon } = ChromeUtils.importESModule(
  "resource://gre/modules/ExtensionCommon.sys.mjs"
);

var { MailServices } = ChromeUtils.importESModule("resource:///modules/MailServices.sys.mjs");

// eslint-disable-next-line no-unused-vars
var Utilities = class extends ExtensionCommon.ExtensionAPI {
  
  async fileConfig(mode, jsonData, fname) {
    const win = Services.wm.getMostRecentWindow("mail:3pane"); 
    const Cc = Components.classes,
      Ci = Components.interfaces,
      util = win.QuickFolders.Util,
      prefs = win.QuickFolders.Preferences;
    util.popupRestrictedFeature(mode + "_config", "", 2); // save_config, load_config
    
    let filterText;
    const fp = Cc['@mozilla.org/filepicker;1'].createInstance(Ci.nsIFilePicker),
      fileOpenMode = (mode=='load') ? fp.modeOpen : fp.modeSave;

    let dPath = prefs.getStringPref('files.path');
    if (dPath) {
      let defaultPath = Cc["@mozilla.org/file/local;1"].createInstance(Ci.nsIFile);
      try {
        defaultPath.initWithPath(dPath);
      } catch(ex) {
        // if path doesn't exist or invalid:
        util.logException(`initializing Path ${dPath} failed:`, ex);
        // path should be empty after this.
      }
      if (defaultPath.path && defaultPath.exists()) { // avoid crashes if the folder has been deleted
        fp.displayDirectory = defaultPath; 
        util.logDebug("Setting default path for filepicker: " + dPath);
      } else {
        util.logDebug("fileFilters()\nPath does not exist: " + dPath);
      }
    }

    fp.init(util.getFileInitArg(win), "", fileOpenMode); // second parameter: prompt
    filterText = util.getBundleString("qf.fpJsonFile");
    fp.appendFilter(filterText, "*.json");
    fp.defaultExtension = 'json';
    if (mode == 'save') {
      let fileName = fname;
      fp.defaultString = fileName + '.json';
    }

    let load = async function(aResult, fp) {
      if (aResult == Ci.nsIFilePicker.returnOK || aResult == Ci.nsIFilePicker.returnReplace) {
        if (fp.file) {
          let path = fp.file.path;
          // Store last Path
          util.logDebug("File Picker Path: " + path);
          let lastSlash = path.lastIndexOf("/");
          if (lastSlash < 0) {lastSlash = path.lastIndexOf("\\");}
          let lastPath = path.substr(0, lastSlash);
          util.logDebug("Storing Path: " + lastPath);
          prefs.setStringPref('files.path', lastPath);

          try {
            return IOUtils.readJSON(path, { encoding: "utf-8" }); //  returns promise for Uint8Array
          }
          catch(reason) {
            util.logDebug ('read() - Failure: ' + reason);
          }
        }
      }
    }
    
    let save = async function(aResult, fp, jsonData) {
      if (aResult == Ci.nsIFilePicker.returnOK || aResult == Ci.nsIFilePicker.returnReplace) {
        if (fp.file) {
          let path = fp.file.path;
          // Store last Path
          util.logDebug("File Picker Path: " + path);
          let lastSlash = path.lastIndexOf("/");
          if (lastSlash < 0) {lastSlash = path.lastIndexOf("\\");}
          let lastPath = path.substr(0, lastSlash);
          util.logDebug("Storing Path: " + lastPath);
          prefs.setStringPref('files.path', lastPath);

          // if (aResult == Ci.nsIFilePicker.returnReplace)
          try {
            // eslint-disable-next-line no-unused-vars
            let promiseDelete = await IOUtils.remove(path);
            util.logDebug ('saveJSON()…');
            // force appending correct file extension!
            if (!path.toLowerCase().endsWith('.json')) {
              path += '.json';
            }
            // eslint-disable-next-line no-unused-vars
            let promiseWrite = await IOUtils.writeUTF8(path, jsonData);
            // util.logDebug ('successfully saved ' + byteCount + ' bytes to file');
          }
          catch(reason) {
            util.logDebug ('Save failed for reason:' + reason);
          }
        }
      }
    }    
    
    let result = await new Promise(resolve => { fp.open(resolve); } );
    
    switch(mode) {
      case "load": return load(result, fp)
        
      case "save": return save(result, fp, jsonData);
    }

    throw new Error("Invalid mode!");
  }
  
  
  getAPI(context) {    
    let self = this;
    const folderPasteSessions = new Map();
    const cloneFolders = entries => JSON.parse(JSON.stringify(entries));
    const renderFolderPreview = (win, entries, inOptions = true) => {
      const qf = win.QuickFolders;
      qf.Model.selectedFolders = cloneFolders(entries);
      qf.Interface.updateFoldersUI();
      if (inOptions) {
        qf.Interface.toggleToolbar({ forceVisible: true, optionsMode: true });
      }
    };
    const cancelFolderPaste = (windowId, inOptions = true) => {
      const session = folderPasteSessions.get(windowId);
      if (!session) {return;}
      try {
        if (!session.win.closed && session.previewed) {
          renderFolderPreview(session.win, session.original, inOptions);
        }
      } finally {
        delete session.win.QuickFolders._folderPastePreviewOwner;
        folderPasteSessions.delete(windowId);
      }
    };
    context.callOnClose({
      close() {
        for (const windowId of folderPasteSessions.keys()) {
          cancelFolderPaste(windowId, false);
        }
      },
    });
    
    // eslint-disable-next-line no-unused-vars
    const PrefTypes = {
      [Services.prefs.PREF_STRING] : "string",
      [Services.prefs.PREF_INT] : "number",
      [Services.prefs.PREF_BOOL] : "boolean",
      [Services.prefs.PREF_INVALID] : "invalid"
    };

    return {
      Utilities: {
        async folderPaste(action, windowId, entries) {
          if (action === "begin") {
            const settingsWindow = context.extension.windowManager.get(windowId, context).window;
            const win = settingsWindow.QuickFolders?.Model
              ? settingsWindow : Services.wm.getMostRecentWindow("mail:3pane");
            if (!win) {throw new Error("QuickFolders toolbar is unavailable.");}
            const qf = win.QuickFolders;
            if (!qf?.Model) {throw new Error("QuickFolders toolbar is unavailable.");}
            if (qf._folderPastePreviewOwner) {
              throw new Error("A folder preview is already active in this window.");
            }
            qf.Util.popupRestrictedFeature("pasteFolderEntries", "", 2);
            if (!qf.Util.hasValidLicense()) {return { allowed: false };}
            const original = cloneFolders(qf.Model.selectedFolders);
            folderPasteSessions.set(windowId, { win, original, previewed: false });
            qf._folderPastePreviewOwner = context;
            return { allowed: true, original: cloneFolders(original) };
          }
          if (action === "cancel") {
            cancelFolderPaste(windowId);
            return true;
          }
          const session = folderPasteSessions.get(windowId);
          if (!session) {throw new Error("Folder preview is no longer active.");}
          if (action === "preview") {
            const qf = session.win.QuickFolders;
            const folders = cloneFolders(entries);
            qf.Model.correctFolderEntries(folders, false);
            for (const entry of folders) {
              if (entry.tabColor === undefined || entry.tabColor === "undefined") {
                entry.tabColor = 0;
              }
              if (!entry.name) {
                const folder = qf.Model.getMsgFolderFromUri(entry.uri, false);
                if (folder) {entry.name = folder.prettyName || folder.localizedName;}
              }
            }
            session.previewed = true;
            renderFolderPreview(session.win, folders);
            // Let the forced-visible toolbar paint before Settings asks for confirmation.
            await new Promise(resolve => session.win.requestAnimationFrame(() =>
              session.win.setTimeout(resolve, 0)));
            return cloneFolders(session.win.QuickFolders.Model.selectedFolders);
          }
          if (action === "finish") {
            if (!Array.isArray(entries)) {throw new Error("Folder configuration is unavailable.");}
            // Persistence has succeeded. Closing Settings must no longer restore the old preview.
            delete session.win.QuickFolders._folderPastePreviewOwner;
            folderPasteSessions.delete(windowId);
            for (const win of Services.wm.getEnumerator("mail:3pane")) {
              if (!win.QuickFolders?.Preferences?.cache) {continue;}
              win.QuickFolders.Preferences.cache._model.folders = cloneFolders(entries);
              renderFolderPreview(win, entries, win === session.win);
            }
            return true;
          }
          throw new Error("Unknown folder paste action.");
        },

        logDebug(text) {
          const win = Services.wm.getMostRecentWindow("mail:3pane");
          win.QuickFolders.Util.logDebug(text);
        },

        getUserName: function () {
          // const win = Services.wm.getMostRecentWindow("mail:3pane");
          // const util = win.QuickFolders.Util;
          const Accounts = MailServices.accounts; // util.Accounts;
          for (let a = 0; a < Accounts.length; a++) {
            let account = Accounts[a];
            if (account.defaultIdentity) {
              let name = account.defaultIdentity.fullName;
              if (name) {
                return name;
              }
            }
          }
          return "user"; // anonymous
        },

        setToolbarLabel(text) {
          const windows = Services.wm.getEnumerator("mail:3pane");
          let updated = 0;
          while (windows.hasMoreElements()) {
            const win = windows.getNext();
            const labels = win.document.querySelectorAll("div.QuickFolders-Empty-Toolbar-Label");
            for (const label of labels) {
              label.textContent = text;
              updated++;
            }
          }
          return updated;
        },

        showVersionHistory: function () {
          const win = Services.wm.getMostRecentWindow("mail:3pane");
          const util = win.QuickFolders.Util;
          util.showVersionHistory();
        },

        showXhtmlPage: function (uri) {
          let mail3PaneWindow = Services.wm.getMostRecentWindow("mail:3pane");
          mail3PaneWindow.openDialog(uri);
        },

        showLicenseDialog: function (referrer) {
          const win = Services.wm.getMostRecentWindow("mail:3pane");
          win.QuickFolders.Interface.showLicenseDialog(referrer);
        },

        // get may only return something, if a value is set
        /* Useful stuff from QF.Preferences */
        getUserStyle: async function (id, type, defaultTxt) {
          // lazy workaround for now because messenger is not defined:
          // when calling from options - wo do not have it because we need to load in a "browser" window
          const win = Services.wm.getMostRecentWindow("mail:3pane");
          let retVal = win.QuickFolders.Preferences.getUserStyle(id, type, defaultTxt);
          return retVal;
        },

        async storeConfig(config) {
          const win = Services.wm.getMostRecentWindow("mail:3pane");
          // see options.copyFolderEntries
          const util = win.QuickFolders.Util,
            prefs = win.QuickFolders.Preferences,
            sFolderString = Services.prefs.getStringPref("QuickFolders.folders");
          let obj = JSON.parse(sFolderString),
            storedObj = {
              folders: obj,
              general: [],
              advanced: [],
              layout: [],
              userStyle: [],
            }; // wrap into "folders" subobject, so we can add more settings
          let isLicense =
            win.QuickFolders.Util.licenseInfo.isExpired ||
            win.QuickFolders.Util.licenseInfo.isValidated;
          if (isLicense) {
            storedObj.premium = [];
          }

          util.logDebug("Storing configuration...");

          // LEGACY BRANCH - if called from background this will contain the event
          storedObj.general = config.general;
          storedObj.advanced = config.advanced;
          storedObj.layout = config.layout;
          storedObj.userStyle = config.userStyle;

          // [issue 115] store selection for background dropdown
          const bgKey = "currentFolderBar.background.selection";
          let backgroundSelection = prefs.getStringPref(bgKey);
          storedObj.layout.push({
            key: "extensions.quickfolders." + bgKey,
            val: backgroundSelection,
            originalId: "qfpa-CurrentFolder-Selection",
          });

          let prettifiedJson = JSON.stringify(storedObj, null, "  ");
          await self.fileConfig("save", prettifiedJson, "QuickFolders-Config");
          util.logDebug("Configuration stored.");
        },

        async loadConfig(_preferences) {
          const win = Services.wm.getMostRecentWindow("mail:3pane");
          const prefs = win.QuickFolders.Preferences,
            util = win.QuickFolders.Util;

          function readData(dataString) {
            let changedRecords = [];

            try {
              // removes prettyfication:
              let // config = dataString.replace(/\r?\n|\r/, ''),
                data = dataString, // dataString
                entries = data.folders,
                isLayoutModified = false,
                question = util.getBundleString("qf.prompt.restoreFolders");
              if (
                prefs.getBoolPref("restoreConfig.tabs") &&
                Services.prompt.confirm(
                  win,
                  "QuickFolders",
                  question.replace("{0}", entries.length)
                )
              ) {
                for (let ent of entries) {
                  if (typeof ent.tabColor === "undefined" || ent.tabColor === "undefined") {
                    ent.tabColor = 0;
                  }
                  // default the name!!
                  if (!ent.name) {
                    // retrieve the name from the folder uri (prettyName)
                    let f = win.QuickFolders.Model.getMsgFolderFromUri(ent.uri, false);
                    if (f) {
                      ent.name = f.prettyName || f.localizedName;
                    } else {
                      ent.name = util.getNameFromURI(ent.uri);
                    }
                  }
                }
                if (!entries.length) {
                  entries = [];
                }
                // the following function calls QI.updateMainWindow() which calls QI.updateFolders()
                // LEGACY MAIN WINDOW HACK FOR PREVIEW
                let mainWin = util.getMail3PaneWindow();
                mainWin.QuickFolders.Model.correctFolderEntries(entries, false);
                mainWin.QuickFolders.initTabsFromEntries(entries);
                let invalidCount = 0,
                  modelEntries = mainWin.QuickFolders.Model.selectedFolders;
                // updateFolders() will append "invalid" property into entry of main model if folder URL cannot be found
                for (let i = 0; i < modelEntries.length; i++) {
                  if (modelEntries[i].invalid) {
                    invalidCount++;
                  }
                }

                // this should really wait for the UI...
                question = util.getBundleString("qf.prompt.loadFolders.confirm");
                if (invalidCount) {
                  let wrn = util.getBundleString("qfInvalidTabCount"),
                    deleteInvalid = util.getBundleString("qf.menuitem.quickfolders.deleteDeadTabs");
                  question =
                    wrn.replace("{0}", invalidCount).replace("{1}", deleteInvalid) +
                    "\n" +
                    question;
                }
                if (Services.prompt.confirm(win, "QuickFolders", question)) {
                  // store
                  prefs.storeFolderEntries(entries);
                  // notify all windows
                  util.notifyTools.notifyBackground({ func: "updateAllTabs" });
                } else {
                  // roll back
                  mainWin.QuickFolders.initTabsFromEntries(prefs.loadFolderEntries());
                }
              }
              // ====================================================================
              // [issue 107] Restoring general / layout Settings only works if option for restoring folders also active
              if (prefs.getBoolPref("restoreConfig.general") && data.general) {
                for (let i = 0; i < data.general.length; i++) {
                  changedRecords.push(data.general[i]);
                }
                isLayoutModified = true;
              }
              if (prefs.getBoolPref("restoreConfig.layout")) {
                if (data.layout) {
                  for (let i = 0; i < data.layout.length; i++) {
                    changedRecords.push(data.layout[i]);
                  }
                  isLayoutModified = true;
                }

                if (data.userStyle) {
                  for (let i = 0; i < data.userStyle.length; i++) {
                    const eli = data.userStyle[i].elementInfo;
                    if (!data.userStyle[i]?.val && 0!==(data.userStyle[i]?.val)) {
                      continue;
                    }
                    const record = {
                      key: `style.${eli}`,
                      val: data.userStyle[i]?.val,
                    };
                    if (data.userStyle[i].elementInfo) {
                      record.elementInfo = data.userStyle[i].elementInfo;
                    }
                    changedRecords.push(record);
                  }
                }

                if (data.advanced) {
                  for (let i = 0; i < data.advanced.length; i++) {
                    changedRecords.push(data.advanced[i]);
                  }
                }

                if (data.premium) {
                  for (let i = 0; i < data.premium.length; i++) {
                    changedRecords.push(data.premium[i]);
                  }
                }
                // load custom colors and restore color pickers
                // options.styleUpdate('Toolbar', 'background-color', this.value, 'qf-StandardColors')
              }
              if (isLayoutModified) {
                // instant visual feedback
                //  update the main window layout
                win.QuickFolders.Util.notifyTools.notifyBackground({ func: "updateFoldersUI" }); // replaced QI.updateObserver();
              }
            } catch (ex) {
              util.logException("Error in QuickFolders.Model.readData():\n", ex);
              Services.prompt.alert(
                null,
                "QuickFolders",
                util.getBundleString("qf.alert.pasteFolders.formatErr")
              );
            }
            return changedRecords;
          }

          let config = await self.fileConfig("load"); // load does the reading itself?
          if (config) {
            return readData(config);
          } else {
            return null;
          }
        },

        // A test function for folder conversion. We need to pass in a nsIMsgFolder
        // Q: where can this function be called from? We need to pass in a nsIMsgFolder
        getMailFolder: function (folder) {
          // convert an nsIMsgFolder to a MailFolder.
          // see https://webextension-api.thunderbird.net/en/stable/how-to/experiments.html#using-folder-and-message-types
          return context.extension.folderManager.convert(folder);
        },

        toggleToolbarAction: function (keepState = false) {
          const win = Services.wm.getMostRecentWindow("mail:3pane");
          const util = win.QuickFolders.Util;
          let btn = win.document.querySelector("[item-id='ext-quickfolders@curious.be']");
          if (btn) {
            util.logDebug("toggleToolbarAction()");
            console.log(btn);
            win.QuickFolders.Interface.toggleToolbar({ button: btn, toggle: !keepState });
          }
        },

        // simplified function to toggle QF toolbar when settings tab is shown
        displayMainToolbar: function (visible, inOptions = false) {
          const win = Services.wm.getMostRecentWindow("mail:3pane");
          win.QuickFolders.Interface.toggleToolbar({
            forceVisible: visible,
            optionsMode: inOptions,
          });
        },

        getFolderIcon: async function (accountId, path = null) {
          const win = Services.wm.getMostRecentWindow("mail:3pane");
          try {
            let retVal = null;
            if (path) {
              let folder = context.extension.folderManager.get(accountId, path);
              if (!folder) {
                return null;
              }
              retVal = win.QuickFolders.FolderTree.customIcons.find(
                (e) => e.folderURI == folder.URI
              );
            } else {
              // this is an account.
              for (let account of win.QuickFolders.Util.Accounts) {
                if (account.key == accountId) {
                  win.QuickFolders.Util.logDebug(
                    `found account: ${accountId}`,
                    account.incomingServer?.prettyName
                  );
                  let rootUri = account.incomingServer?.rootFolder.URI;
                  retVal = win.QuickFolders.FolderTree.customIcons.find(
                    (e) => e.folderURI == rootUri
                  );
                  break;
                }
              }
            }
            return retVal;
          } catch (ex) {
            win.QuickFolders.Util.logException("Utilities.getFolderIcon()", ex);
            return null;
          }
        },

        getFolderUri: async function (accountId, path = null) {
          const win = Services.wm.getMostRecentWindow("mail:3pane");
          try {
            let retVal = null;
            if (path) {
              let folder = context.extension.folderManager.get(accountId, path);
              if (!folder) {
                return null;
              }
              retVal = folder.URI;
            } else {
              // this is an account.
              for (let account of win.QuickFolders.Util.Accounts) {
                if (account.key == accountId) {
                  win.QuickFolders.Util.logDebug(
                    `found account: ${accountId}`,
                    account.incomingServer?.prettyName
                  );
                  retVal = account.incomingServer?.rootFolder.URI;
                  break;
                }
              }
            }
            return retVal;
          } catch (ex) {
            win.QuickFolders.Util.logException("Utilities.getFolderUri()", ex);
            return null;
          }
        },

        getActiveThemeId: function () {
          const win = Services.wm.getMostRecentWindow("mail:3pane");
          return win.QuickFolders.Preferences.CurrentThemeId;
        },

        commitActiveThemeId: async function (themeId) {
          const win = Services.wm.getMostRecentWindow("mail:3pane");
          if (!win?.QuickFolders?.Styles) {
            console.error("QuickFolders.Styles not found in main window!");
            return;
          }
          win.QuickFolders.Styles.loadedTheme = themeId;
        },

        stageThemeChange: async function (themeId) {
          // call this before applying a new theme
          // to reset all styles to their default values,
          // using QuickFolders.Styles.resetTheme(styleSheet)
          const win = Services.wm.getMostRecentWindow("mail:3pane");
          // this will reset styles!
          win.QuickFolders.Interface.prepareThemeChange(themeId);
        },

        updatePreferencesCache: (data) => {
          const windowTypes = ["mail:3pane", "msgcompose", "mail:messageWindow"];
          for (const type of windowTypes) {
            const enumerator = Services.wm.getEnumerator(type);
            while (enumerator.hasMoreElements()) {
              const win = enumerator.getNext();
              if (win.QuickFolders?.Preferences?.cache?.updateFromBackend) {
                win.QuickFolders.Preferences.cache.updateFromBackend(data);
              }
            }
          }
          return true;
        },
      },
    };
  }
}
