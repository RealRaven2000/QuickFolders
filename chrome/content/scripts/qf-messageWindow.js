Services.scriptloader.loadSubScript("chrome://quickfolders/content/quickfolders.js", window, "UTF-8");
Services.scriptloader.loadSubScript("chrome://quickfolders/content/quickfolders-preferences.js", window, "UTF-8");
Services.scriptloader.loadSubScript("chrome://quickfolders/content/quickfolders-themes.js", window, "UTF-8");
Services.scriptloader.loadSubScript("chrome://quickfolders/content/quickfolders-util.js", window, "UTF-8");
Services.scriptloader.loadSubScript("chrome://quickfolders/content/quickfolders-interface.js", window, "UTF-8");
Services.scriptloader.loadSubScript("chrome://quickfolders/content/quickfolders-quickMove.js", window, "UTF-8");
Services.scriptloader.loadSubScript("chrome://quickfolders/content/quickmove-settings.js", window, "UTF-8");
Services.scriptloader.loadSubScript("chrome://quickfolders/content/quickfolders-model.js", window, "UTF-8");
Services.scriptloader.loadSubScript("chrome://quickfolders/content/quickfolders-folder-category.js", window, "UTF-8");
Services.scriptloader.loadSubScript("chrome://quickfolders/content/qf-styles.js", window, "UTF-8");

var mylisteners = {};

function onLoad(activatedWhileWindowOpen) {
  let layout = WL.injectCSS("chrome://quickfolders/content/quickfolders-layout.css");
  layout.setAttribute("title", "QuickFolderStyles");
  let layout2 = WL.injectCSS("chrome://quickfolders/content/quickfolders-tools.css");
  
  // version specific:
  WL.injectCSS("chrome://quickfolders-skins/content/qf-current.css");
  
  let layout1 = WL.injectCSS("chrome://quickfolders/content/quickfolders-palettes.css");
  layout1.setAttribute("title", "QuickFolderPalettes");
  
  WL.injectCSS("chrome://quickfolders/content/skin/quickfolders-widgets.css");
  WL.injectCSS("chrome://quickfolders/content/quickfolders-mods.css");
  
  window.QuickFolders.Util.logDebug('Adding messageWindow...');
  window.QuickFolders.Util.notifyTools.enable();
  window.QuickFolders.Util.init();
  window.QuickFolders.quickMove.initLog();

  const QI = window.QuickFolders.Interface;
  mylisteners["updateUserStyles"] = QI.updateUserStyles.bind(QI);
  for (let m in mylisteners) {
    window.addEventListener(`QuickFolders.BackgroundUpdate.${m}`, mylisteners[m]);
  }
  // [issue 404] removed duplicate code from qf-3pane.js!
}

function onUnload(isAddOnShutDown) {
  window.QuickFolders.Util.notifyTools.disable();
  for (let m in mylisteners) {
    window.removeEventListener(`QuickFolders.BackgroundUpdate.${m}`, mylisteners[m]);
  }
}


window.document.addEventListener('DOMContentLoaded', 
  () => {
    window.QuickFolders.initSingleMsg(WL);
  }, 
  { once: true }
);