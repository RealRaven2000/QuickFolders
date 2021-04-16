/* eslint-disable object-shorthand */

var { ExtensionCommon } = ChromeUtils.import("resource://gre/modules/ExtensionCommon.jsm");
var { Services } = ChromeUtils.import("resource://gre/modules/Services.jsm");
var win = Services.wm.getMostRecentWindow("mail:3pane"); 


console.log("quickfolders implementation utilities");
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

        logDebug (text) {
          win.QuickFolders.Util.logDebug(text);
        },
        
        // returns true if a valid license is there, but also when the license is expired.
        // this gives us an option to check whether to show extension links instead after 
        // we check for the license
        isLicensed(forceValidation) {
          let hasLicense =  // (win.quickFilters.Licenser).isValidated;
            win.QuickFolders.Util.hasPremiumLicense(forceValidation);
          if (!hasLicense)
            return win.QuickFolders.Licenser.isExpired; // if it is expired, we say it is still "licensed" for the purposes of this api!
          return hasLicense;
        },
        
        LicenseIsExpired() {
          return  win.QuickFolders.Licenser.isExpired;
        },

        LicenseIsProUser() {
          return  win.QuickFolders.Util.hasPremiumLicense(false);
        },

        LicensedDaysLeft() {
          let today = new Date(),
              licensedDate = new Date(win.QuickFolders.Licenser.DecryptedDate),
              daysLeft = parseInt((licensedDate - today) / (1000 * 60 * 60 * 24)); 
          return daysLeft;
        },
        
        getAddonVersion: function() {
          return win.QuickFolders.Util.Version;
        },

        getTBVersion : function() { //somehow(??), we can also get this in MX
          return Services.appinfo.version;//win.QuickFolders.Util.VersionSanitized;
        },


        getAddonName : function() {
          return win.QuickFolders.Util.ADDON_NAME;
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
        
        openLinkExternally: function(url) {
          let uri = url;
          if (!(uri instanceof Ci.nsIURI)) {
            uri = Services.io.newURI(url);
          }
          
          Cc["@mozilla.org/uriloader/external-protocol-service;1"]
            .getService(Ci.nsIExternalProtocolService)
            .loadURI(uri);
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
        }
  
        // get may only return something, if a value is set
     }
  }
};
}
