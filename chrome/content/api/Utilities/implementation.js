/* eslint-disable object-shorthand */

var { ExtensionCommon } = ChromeUtils.import("resource://gre/modules/ExtensionCommon.jsm");
var { Services } = ChromeUtils.import("resource://gre/modules/Services.jsm");
  





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

         openLinkExternally(url) {
          let uri = url;
          if (!(uri instanceof Ci.nsIURI)) {
            uri = Services.io.newURI(url);
          }
        
          
          Cc["@mozilla.org/uriloader/external-protocol-service;1"]
            .getService(Ci.nsIExternalProtocolService)
            .loadURI(uri);
        },
        showXhtmlPage(uri) {

          console.log("from Experiment - MX");  
          //openLinkExternally("http://quickfolders.org/donate.html");
          let mail3PaneWindow = Components.classes["@mozilla.org/appshell/window-mediator;1"]
          .getService(Components.interfaces.nsIWindowMediator)
          .getMostRecentWindow("mail:3pane");  
          mail3PaneWindow.openDialog(uri);
          //mail3PaneWindow.openDialog("chrome://quickfolders/content/register.xhtml");
         // mail3PaneWindow.open( "http://quickfolders.org/donate.html");
        }
  
        // get may only return something, if a value is set
     }
  }
};
}
