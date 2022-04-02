/* eslint-disable object-shorthand */

var { ExtensionCommon } = ChromeUtils.import("resource://gre/modules/ExtensionCommon.jsm");
var { Services } = ChromeUtils.import("resource://gre/modules/Services.jsm");
var win = Services.wm.getMostRecentWindow("mail:3pane"); 




var Utilities = class extends ExtensionCommon.ExtensionAPI {
  
  async fileConfig(mode, jsonData, fname) {
    const Cc = Components.classes,
          Ci = Components.interfaces,
          util = win.QuickFolders.Util,
          prefs = win.QuickFolders.Preferences,
          NSIFILE = Ci.nsILocalFile || Ci.nsIFile;
    util.popupRestrictedFeature(mode + "_config", "", 2); // save_config, load_config
    
    let filterText,
        fp = Cc['@mozilla.org/filepicker;1'].createInstance(Ci.nsIFilePicker),
        fileOpenMode = (mode=='load') ? fp.modeOpen : fp.modeSave;

    let dPath = prefs.getStringPref('files.path');
    if (dPath) {
      let defaultPath = Cc["@mozilla.org/file/local;1"].createInstance(NSIFILE);
      defaultPath.initWithPath(dPath);
      if (defaultPath.exists()) { // avoid crashes if the folder has been deleted
        fp.displayDirectory = defaultPath; // nsILocalFile
        util.logDebug("Setting default path for filepicker: " + dPath);
      }
      else {
        util.logDebug("fileFilters()\nPath does not exist: " + dPath);
      }
    }
    fp.init(win, "", fileOpenMode); // second parameter: prompt
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
          if (lastSlash < 0) lastSlash = path.lastIndexOf("\\");
          let lastPath = path.substr(0, lastSlash);
          util.logDebug("Storing Path: " + lastPath);
          prefs.setStringPref('files.path', lastPath);

          const {OS} = (typeof ChromeUtils.import == "undefined") ?
            Components.utils.import("resource://gre/modules/osfile.jsm", {}) :
            ChromeUtils.import("resource://gre/modules/osfile.jsm", {});

          //localFile = Components.classes["@mozilla.org/file/local;1"].createInstance(Ci.nsILocalFile);
          try {
            return OS.File.read(path, { encoding: "utf-8" }); //  returns promise for Uint8Array
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
          if (lastSlash < 0) lastSlash = path.lastIndexOf("\\");
          let lastPath = path.substr(0, lastSlash);
          util.logDebug("Storing Path: " + lastPath);
          prefs.setStringPref('files.path', lastPath);

          const {OS} = (typeof ChromeUtils.import == "undefined") ?
            Components.utils.import("resource://gre/modules/osfile.jsm", {}) :
            ChromeUtils.import("resource://gre/modules/osfile.jsm", {});

          //localFile = Components.classes["@mozilla.org/file/local;1"].createInstance(Ci.nsILocalFile);
          // if (aResult == Ci.nsIFilePicker.returnReplace)
          try {
            let promiseDelete = await OS.File.remove(path);
            util.logDebug ('saveJSON()…');
            // force appending correct file extension!
            if (!path.toLowerCase().endsWith('.json')) {
              path += '.json';
            }
            let promiseWrite = await OS.File.writeAtomic(path, jsonData, { encoding: "utf-8"});
            util.logDebug ('successfully saved ' + byteCount + ' bytes to file');
          }
          catch(reason) {
            util.logDebug ('Save failed for reason:' + reason);
          }
        }
      }
    }    
    
    let result = await new Promise(resolve => { fp.open(resolve); } );
    
    switch(mode) {
      case "load":
        return load(result, fp)
        
      case "save":
        return save(result, fp, jsonData);
    }

    throw new Error("Invalid mode!");
  }
  
  
  getAPI(context) {    
    let self = this;
    
    const PrefTypes = {
      [Services.prefs.PREF_STRING] : "string",
      [Services.prefs.PREF_INT] : "number",
      [Services.prefs.PREF_BOOL] : "boolean",
      [Services.prefs.PREF_INVALID] : "invalid"
    };

    return {
      Utilities: {

        logDebug (text) {
          win.QuickFolders.Util.logDebug(text);
        },
        
        getUserName : function () {
          const util = win.QuickFolders.Util;
          let Accounts = util.Accounts; 
          for (let a=0; a<Accounts.length; a++) {
            let account = Accounts[a];
            if (account.defaultIdentity) 
            { 
              let name = account.defaultIdentity.fullName;
              if (name) return name;
            }
          }    
          return "user"; // anonymous
        },
        
        showVersionHistory: function() {
          const util = win.QuickFolders.Util;
          util.showVersionHistory();
        },

        showXhtmlPage: function(uri) {
          let mail3PaneWindow = Components.classes["@mozilla.org/appshell/window-mediator;1"]
            .getService(Components.interfaces.nsIWindowMediator)
            .getMostRecentWindow("mail:3pane");  
          mail3PaneWindow.openDialog(uri);
        },
        
        showLicenseDialog: function(referrer) {
          win.QuickFolders.Interface.showLicenseDialog(referrer);
        },
  
        // get may only return something, if a value is set
        /* Useful stuff from QF.Preferences */
        getUserStyle: async function(id, type, defaultTxt) {
          // lazy workaround for now because messenger is not defined:
          // when calling from options - wo do not have it because we need to load in a "browser" window
          let retVal = win.QuickFolders.Preferences.getUserStyle(id, type, defaultTxt);
          return retVal;
        },
        
        async storeConfig(config) {
          // see options.copyFolderEntries
          const Cc = Components.classes,
                Ci = Components.interfaces,
                service = Cc["@mozilla.org/preferences-service;1"].getService(Ci.nsIPrefBranch),
                util = win.QuickFolders.Util,
                prefs = win.QuickFolders.Preferences,
                sFolderString = service.getStringPref("QuickFolders.folders");
          let obj = JSON.parse(sFolderString),
              storedObj = { 
                folders: obj,
                general: [],
                advanced: [],
                layout: [],
                userStyle: []
              }; // wrap into "folders" subobject, so we can add more settings
          let isLicense = ( win.QuickFolders.Util.licenseInfo.isExpired ||  win.QuickFolders.Util.licenseInfo.isValidated);
          if (isLicense) {
            storedObj.premium = [];
          }
          
          util.logDebug("Storing configuration...")

          // LEGACY BRANCH - if called from background this will contain the event
          storedObj.general = config.general;
          storedObj.advanced = config.advanced;
          storedObj.layout = config.layout;
          storedObj.userStyle = config.userStyle;
          
          // [issue 115] store selection for background dropdown
          const bgKey = 'currentFolderBar.background.selection';
          let backgroundSelection = prefs.getStringPref(bgKey);
          storedObj.layout.push({
            key: 'extensions.quickfolders.' + bgKey, 
            val: backgroundSelection, 
            originalId: 'qfpa-CurrentFolder-Selection'} 
          );

          let prettifiedJson = JSON.stringify(storedObj, null, '  ');
          await self.fileConfig('save', prettifiedJson, 'QuickFolders-Config');
          util.logDebug("Configuration stored.")
        } ,

        async loadConfig(preferences) {
          const prefs = win.QuickFolders.Preferences,
                util = win.QuickFolders.Util;
          
          function readData(dataString) {
            const Cc = Components.classes,
                  Ci = Components.interfaces,
                  service = Cc["@mozilla.org/preferences-service;1"].getService(Ci.nsIPrefBranch),
                  QI = win.QuickFolders.Interface;
            let changedRecords = [];
            
            try {
              // removes prettyfication:
              let config = dataString.replace(/\r?\n|\r/, ''),
                  data = JSON.parse(config),
                  entries = data.folders,
                  isLayoutModified = false,
                  question = util.getBundleString("qf.prompt.restoreFolders");
              if (prefs.getBoolPref('restoreConfig.tabs')
                 && Services.prompt.confirm(win, "QuickFolders", question.replace("{0}", entries.length))) {
                for (let ent of entries) {
                  if (typeof ent.tabColor ==='undefined' || ent.tabColor ==='undefined')
                    ent.tabColor = 0;
                  // default the name!!
                  if (!ent.name) {
                    // retrieve the name from the folder uri (prettyName)
                    let f = win.QuickFolders.Model.getMsgFolderFromUri(ent.uri, false);
                    if (f)
                      ent.name = f.prettyName;
                    else
                      ent.name = util.getNameFromURI(ent.uri);
                  }
                }
                if (!entries.length)
                  entries=[];
                // the following function calls this.updateMainWindow() which calls this.updateFolders()
                // LEGACY MAIN WINDOW HACK FOR PREVIEW
                let mainWin = util.getMail3PaneWindow();
                mainWin.QuickFolders.initTabsFromEntries(entries);
                let invalidCount = 0,
                    modelEntries = mainWin.QuickFolders.Model.selectedFolders;
                // updateFolders() will append "invalid" property into entry of main model if folder URL cannot be found
                for (let i=0; i<modelEntries.length; i++) {
                  if (modelEntries[i].invalid)
                    invalidCount++;
                }

                question = util.getBundleString("qf.prompt.loadFolders.confirm");
                if (invalidCount) {
                  let wrn =
                    util.getBundleString("qfInvalidTabCount");
                  question = wrn.replace("{0}", invalidCount) + "\n" + question;
                }
                if (Services.prompt.confirm(win, "QuickFolders", question)) {
                  // store
                  prefs.storeFolderEntries(entries);
                  // notify all windows
                  QuickFolders.Util.notifyTools.notifyBackground({ func: "updateAllTabs" });
                }
                else {
                  // roll back
                  mainWin.QuickFolders.initTabsFromEntries(prefs.loadFolderEntries());
                }
              }
              // ====================================================================
              // [issue 107] Restoring general / layout Settings only works if option for restoring folders also active
              if (prefs.getBoolPref('restoreConfig.general') && data.general) {
                for (let i=0; i<data.general.length; i++) {
                  changedRecords.push(data.general[i]);
                }
                isLayoutModified = true;
              }
              if (prefs.getBoolPref('restoreConfig.layout')) {
                if (data.layout) {
                  for (let i=0; i<data.layout.length; i++) {
                    changedRecords.push(data.layout[i]);
                  }
                  isLayoutModified = true;
                  
                  for (let i=0; i<data.userStyle.length; i++) {
                    changedRecords.push(data.userStyle[i]);
                  }
                  
                  
                }
                
                if (data.advanced) {
                  for (let i=0; i<data.advanced.length; i++) {
                    changedRecords.push(data.advanced[i]);
                  }
                }

                if (data.premium) {
                  for (let i=0; i<data.premium.length; i++) {
                    changedRecords.push(data.premium[i]);
                  }
                }
                // load custom colors and restore color pickers
                // options.styleUpdate('Toolbar', 'background-color', this.value, 'qf-StandardColors')
              }
              if (isLayoutModified) { // instant visual feedback
                //  update the main window layout
                win.QuickFolders.Util.notifyTools.notifyBackground({ func: "updateFoldersUI" }); // replaced QI.updateObserver();
              }
              
            }
            catch (ex) {
              util.logException("Error in QuickFolders.Model.readData():\n", ex);
              Services.prompt.alert(null,"QuickFolders", util.getBundleString("qf.alert.pasteFolders.formatErr"));
            }
            finally {
              return changedRecords;
            }
          }
          
          let config = await self.fileConfig("load"); // load does the reading itself?
          if (config)
            return readData(config);
          else
            return null;
        }
       
     }
  }
};
}
