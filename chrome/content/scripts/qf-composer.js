Services.scriptloader.loadSubScript("chrome://quickfolders/content/quickfolders.js", window, "UTF-8");
Services.scriptloader.loadSubScript("chrome://quickfolders/content/quickfolders-preferences.js", window, "UTF-8");
Services.scriptloader.loadSubScript("chrome://quickfolders/content/quickfolders-util.js", window, "UTF-8");
Services.scriptloader.loadSubScript("chrome://quickfolders/content/quickfolders-composer.js", window, "UTF-8");

async function onLoad(activatedWhileWindowOpen) {
  // window.QuickFolders.Util.logDebug('Adding Compose xul...');
  await window.QuickFolders.composer.startup(); 

}

function onUnload(isAddOnShutDown) {

}
