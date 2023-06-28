Services.scriptloader.loadSubScript("chrome://quickfolders/content/quickfolders.js", window, "UTF-8");
Services.scriptloader.loadSubScript("chrome://quickfolders/content/quickfolders-preferences.js", window, "UTF-8");
Services.scriptloader.loadSubScript("chrome://quickfolders/content/quickfolders-util.js", window, "UTF-8");
Services.scriptloader.loadSubScript("chrome://quickfolders/content/quickfolders-search.js", window, "UTF-8");

function onLoad(activatedWhileWindowOpen) {
    
    window.QuickFolders.Util.logDebug('Adding Functionality for Search Dialog (to support finding missing mails in reading list)...');
   //obsolete  window.addEventListener("load", function(e) { QuickFolders.SearchDialog.onLoad(e);}, false); 
    window.QuickFolders.SearchDialog.onLoad();  //?event needed?
 }

function onUnload(isAddOnShutDown) {
}
