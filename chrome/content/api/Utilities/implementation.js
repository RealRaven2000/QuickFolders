/* eslint-disable object-shorthand */

var { ExtensionCommon } = ChromeUtils.import("resource://gre/modules/ExtensionCommon.jsm");
var { Services } = ChromeUtils.import("resource://gre/modules/Services.jsm");
var win = Services.wm.getMostRecentWindow("mail:3pane"); 


var Utilities = class extends ExtensionCommon.ExtensionAPI {
  getAPI(context) {    
    
    const PrefTypes = {
      [Services.prefs.PREF_STRING] : "string",
      [Services.prefs.PREF_INT] : "number",
      [Services.prefs.PREF_BOOL] : "boolean",
      [Services.prefs.PREF_INVALID] : "invalid"
    };

    return {
      Utilities: {

        logDebug: function(text) {
          win.QuickFolders.Util.logDebug(text);
        },
        
        getCurrentFolder : async function() {
          try {
            debugger;
            let f = await context.extension.folderManager.convert(win.QuickFolders.CurrentFolder);
            return f;
          }
          catch(ex) {
            return null;
          }
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
        }
     }
  }
};
}
