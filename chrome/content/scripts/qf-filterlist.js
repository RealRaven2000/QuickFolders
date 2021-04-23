/* this module is obsolete */
var { Services } = ChromeUtils.import("resource://gre/modules/Services.jsm");

Services.scriptloader.loadSubScript("chrome://quickfolders/content/quickfolders.js", window, "UTF-8");
Services.scriptloader.loadSubScript("chrome://quickfolders/content/quickfolders-preferences.js", window, "UTF-8");
Services.scriptloader.loadSubScript("chrome://quickfolders/content/quickfolders-interface.js", window, "UTF-8");
Services.scriptloader.loadSubScript("chrome://quickfolders/content/quickfolders-themes.js", window, "UTF-8");
Services.scriptloader.loadSubScript("chrome://quickfolders/content/quickfolders-util.js", window, "UTF-8");
Services.scriptloader.loadSubScript("chrome://quickfolders/content/quickfolders-filterList.js", window, "UTF-8");
Services.scriptloader.loadSubScript("chrome://quickfolders/content/overlayFilterList.js", window, "UTF-8");


function onLoad(activatedWhileWindowOpen) {
    let layout = WL.injectCSS("chrome://quickfolders/content/filterList.css");
 
    WL.injectElements(`
    
    <window id="filterListDialog">


    </window>
    
    `); 


    
    window.QuickFolders.Util.logDebug('Adding FilterList...');
    // obsolete window.addEventListener("load", function(e) { QuickFolders.FilterList.onLoadFilterList(e);}, false); 
    window.QuickFolders.FilterList.onLoadFilterList();  //? event needed?
}

function onUnload(isAddOnShutDown) {
}
