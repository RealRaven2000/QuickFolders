/*
 * Documentation:
 * https://github.com/thundernest/addon-developer-support/wiki/Using-the-WindowListener-API-to-convert-a-Legacy-Overlay-WebExtension-into-a-MailExtension-for-Thunderbird-78
 */

import * as util from "./scripts/qf-util.mjs.js";
import {Licenser} from "./scripts/Licenser.mjs.js";

var currentLicense;
var startupFinished = false;
var callbacks = [];
  /* startupFinished: There is a general race condition between onInstall and our main() startup:
   * - onInstall needs to be registered upfront (otherwise we might miss it)
   * - but onInstall needs to wait with its execution until our main function has
   *   finished the init routine
   * -> emit a custom event once we are done and let onInstall await that
   */

messenger.WindowListener.registerDefaultPrefs("chrome/content/scripts/quickfoldersDefaults.js");



messenger.runtime.onInstalled.addListener(async (data) => {
  let { reason, temporary } = data,
      isDebug = await messenger.LegacyPrefs.getPref("extensions.quickfolders.debug");
  
  // Wait until the main startup routine has finished!
  await new Promise((resolve) => {
    if (startupFinished) {
      if (isDebug) console.log("QuickFolders - startup code finished.");
      // Looks like we missed the one send by main()
      resolve();
    }
    callbacks.push(resolve);
  });
  if (isDebug) {
    console.log("Startup has finished");
    console.log("QuickFolders - currentLicense", currentLicense);
  }

  switch (reason) {
    case "install":
    {
      let url = browser.runtime.getURL("popup/installed.html");
      await browser.windows.create({ url, type: "popup", width: 910, height: 750, });
    }
    break;
    // see below
    case "update":
    {
      let currentLicenseInfo = currentLicense.info;
      if (currentLicenseInfo.status == "Valid") {
        // suppress update popup for users with licenses that have been recently renewed
        let gpdays = currentLicenseInfo.licensedDaysLeft,
            isLicensed = (currentLicenseInfo.status == "Valid");
        if (isLicensed) {
          if (isDebug) console.log("QuickFolders License - " + gpdays  + " Days left.");
        }
      } 

      // set a flag which will be cleared by clicking the [QuickFolders] button once
      setTimeout(
        function() {
          messenger.LegacyPrefs.setPref("extensions.quickfolders.hasNews", true);
          messenger.NotifyTools.notifyExperiment({event: "updateQuickFoldersLabel"});
        },
        10000
      )
    }
    break;
  // see below
  }    
});

// display splash screen after n minutes
function showSplash(timeout = 0) {
  // alternatively display this info in a tab with browser.tabs.create(...)  
  setTimeout(
    function() {
      let url = browser.runtime.getURL("popup/update.html");
      let screenH = window.screen.height,
          windowHeight = (screenH > 870) ? 870 : screenH;  
      browser.windows.create({ url, type: "popup", width: 1000, height: windowHeight, allowScriptsToClose: true,});
    }, timeout * 60 * 1000
  );
}

async function main() {
  const legacy_root = "extensions.quickfolders.";
  let key = await messenger.LegacyPrefs.getPref(legacy_root + "LicenseKey", ""),
      forceSecondaryIdentity = await messenger.LegacyPrefs.getPref(legacy_root + "licenser.forceSecondaryIdentity") || false,
      isDebug = await messenger.LegacyPrefs.getPref(legacy_root + "debug")  || false,
      isDebugLicenser = await messenger.LegacyPrefs.getPref(legacy_root + "debug.premium.licenser")  || false;

      
  currentLicense = new Licenser(key, { forceSecondaryIdentity, debug: isDebugLicenser });
  await currentLicense.validate();
  
  // All important stuff has been done.
  // resolve all promises on the stack
  if (isDebug) console.log("Finished setting up license startup code");
  callbacks.forEach(callback => callback());
  startupFinished = true;

  // listeners for splash pages
  messenger.runtime.onMessage.addListener(async (data, sender) => {
    if (data.command) {
      switch (data.command) {
        case "getLicenseInfo": 
          return currentLicense.info;
      }
    }
  });
  
  messenger.NotifyTools.onNotifyBackground.addListener(async (data) => {
    let isLog = await messenger.LegacyPrefs.getPref(legacy_root + "debug.notifications");
    if (isLog && data.func) {
      console.log ("=========================\n" +
                   "BACKGROUND LISTENER received: " + data.func + "\n" +
                   "=========================");
    }
    switch (data.func) {
      case "slideAlert":
        util.slideAlert(...data.args);
        break;
      
      case "splashScreen":
        showSplash(0);
        break;
        
      case "getLicenseInfo": 
        return currentLicense.info;
      
      case "getPlatformInfo": 
        return messenger.runtime.getPlatformInfo();

      case "getBrowserInfo": 
        return messenger.runtime.getBrowserInfo();

      case "getAddonInfo": 
        return messenger.management.getSelf();
        
      case "updateQuickFoldersLabel":
        // Broadcast main windows to run updateQuickFoldersLabel
        messenger.NotifyTools.notifyExperiment({event: "updateQuickFoldersLabel"});
        break;
        

      case "updateUserStyles":
        // Broadcast main windows to update their styles (and maybe single message windows???)
        messenger.NotifyTools.notifyExperiment({event: "updateUserStyles"});
        break;
        
      case "updateFoldersUI": // replace observer
        messenger.NotifyTools.notifyExperiment(
          { event: "updateFoldersUI", 
            window: ["chrome://messenger/content/messenger.xhtml"]}
        );
        break;
        
      case "updateAllTabs": 
        // only update tabs, without styles - reads the tabs from the store to support:
        //   adding / renaming / deleting / re-categorizing / re-ordering
        //   across all Windows instances.
        messenger.NotifyTools.notifyExperiment({event: "updateAllTabs"});
        break;
        
      case "updateNavigationBar":
        messenger.NotifyTools.notifyExperiment({event: "updateNavigationBar"});
        break;

      case "toggleNavigationBar":
        messenger.NotifyTools.notifyExperiment({event: "toggleNavigationBar"});
        break;
        
      case "updateCategoryBox":
        messenger.NotifyTools.notifyExperiment({event: "updateCategoryBox"});
        break;
        
      case "updateMainWindow": // we need to add one parameter (minimal) to pass through!
        let isMinimal = (data.minimal) || "false";
        messenger.NotifyTools.notifyExperiment({event: "updateMainWindow", minimal: isMinimal});
        break;
        
      case "initKeyListeners":
        messenger.NotifyTools.notifyExperiment({event: "initKeyListeners"});
        break;

      case "updateLicense":
        let forceSecondaryIdentity = await messenger.LegacyPrefs.getPref(legacy_root + "licenser.forceSecondaryIdentity"),
            isDebugLicenser = await messenger.LegacyPrefs.getPref(legacy_root + "debug.premium.licenser");
            
        // we create a new Licenser object for overwriting, this will also ensure that key_type can be changed.
        let newLicense = new Licenser(data.key, { forceSecondaryIdentity, debug: isDebugLicenser });
        await newLicense.validate();
        // Check new license and accept if ok.
        // You may return values here, which will be send back to the caller.
        // return false;
        
        // Update background license.
        await messenger.LegacyPrefs.setPref(legacy_root + "LicenseKey", newLicense.info.licenseKey);
        currentLicense = newLicense;
        // Broadcast
        messenger.NotifyTools.notifyExperiment({licenseInfo: currentLicense.info})
        return true;
    }
  });
  
  
  
  // Init WindowListener.
  messenger.WindowListener.registerChromeUrl([ 
      ["content", "quickfolders", "chrome/content/"]
  ]);
  messenger.WindowListener.registerOptionsPage("chrome://quickfolders/content/options.xhtml"); 

  messenger.WindowListener.registerWindow("chrome://messenger/content/messenger.xhtml", "chrome/content/scripts/qf-messenger.js");
  messenger.WindowListener.registerWindow("chrome://messenger/content/messengercompose/messengercompose.xhtml", "chrome/content/scripts/qf-composer.js");
  messenger.WindowListener.registerWindow("chrome://messenger/content/SearchDialog.xhtml", "chrome/content/scripts/qf-searchDialog.js");
  messenger.WindowListener.registerWindow("chrome://messenger/content/customizeToolbar.xhtml", "chrome/content/scripts/qf-customizetoolbar.js");
  messenger.WindowListener.registerWindow("chrome://messenger/content/messageWindow.xhtml", "chrome/content/scripts/qf-messageWindow.js");  

  // messenger.WindowListener.registerStartupScript("chrome/content/scripts/qf-startup.js");
  // messenger.WindowListener.registerShutdownScript("chrome/content/scripts/qf-shutdown.js");

 /*
  * Start listening for opened windows. Whenever a window is opened, the registered
  * JS file is loaded. To prevent namespace collisions, the files are loaded into
  * an object inside the global window. The name of that object can be specified via
  * the parameter of startListening(). This object also contains an extension member.
  */
  messenger.WindowListener.startListening(); 
}

main();


