/*
 * Documentation:
 * https://github.com/thundernest/addon-developer-support/wiki/Using-the-WindowListener-API-to-convert-a-Legacy-Overlay-WebExtension-into-a-MailExtension-for-Thunderbird-78
 */

import * as util from "./scripts/qf-util.mjs.js";
import {Licenser} from "./scripts/Licenser.mjs.js";

async function main() { 
  var currentLicense;

  /* There is a generell race condition between onInstall and our main() startup:
   * - onInstall needs to be registered upfront (otherwise we might miss it)
   * - but onInstall needs to wait with its execution until our main function has
   *   finished the init routine
   * -> emit a custom event once we are done and let onInstall await that
   */
  var startupFinished = false;
  function emitStartupFinished() {
    startupFinished = true;
    const event = new CustomEvent("WebExtStartupFinished");
    window.dispatchEvent(event);
  }
  
  messenger.runtime.onInstalled.addListener(async (data) => {
    let { reason, temporary } = data;
    
    // Wait until the main startup routine has finished!
    await new Promise((resolve) => {
      window.addEventListener("WebExtStartupFinished", resolve, { once: true });
      if (startupFinished) {
        // Looks like we missed the one send by main()
        emitStartupFinished();
      }
    });
    console.log("Startup has finished");

    // if (temporary) return; // skip during development
    switch (reason) {
      case "install":
      {
        let url = browser.runtime.getURL("popup/installed.html");
        //await browser.tabs.create({ url });
        await browser.windows.create({ url, type: "popup", width: 910, height: 750, });
      }
      break;
      // see below
      case "update":
      {
        let currentLicenseInfo = currentLicense.info;
        if (currentLicenseInfo.status == "Valid") {
          // suppress update popup for users with licenses that have been recently renewed
          let gpdays = currentLicenseInfo.licensedDaysLeft;
          console.log("Licensed - " + gpdays  + " Days left.");
          // if (gpdays>40) {
            // console.log("Omitting update popup!");
            // return;
          // }
        }
        

        let url = browser.runtime.getURL("popup/update.html");
        //await browser.tabs.create({ url });
        let screenH = window.screen.height,
            windowHeight = (screenH > 870) ? 870 : screenH;  // https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/windows/create
        await browser.windows.create({ url, type: "popup", width: 1000, height: windowHeight, allowScriptsToClose: true,});
      }
      break;
    // see below
    }    
  });
  
  let key = await messenger.LegacyPrefs.getPref("extensions.quickfolders.LicenseKey");
  let forceSecondaryIdentity = await messenger.LegacyPrefs.getPref("extensions.quickfolders.licenser.forceSecondaryIdentity");
  currentLicense = new Licenser(key, { forceSecondaryIdentity });
  await currentLicense.validate();

  messenger.runtime.onMessage.addListener(async (data, sender) => {
    if (data.command) {
      switch (data.command) {
        case "getLicenseInfo": 
          return currentLicense.info;
      }
    }
  });
  
  messenger.NotifyTools.onNotifyBackground.addListener(async (data) => {
    let isLog = await messenger.LegacyPrefs.getPref("extensions.quickfolders.debug.notifications");
    if (isLog && data.func) {
      console.log ("=========================\n" +
                   "BACKGROUND LISTENER received: " + data.func + "\n" +
                   "=========================");
    }
    switch (data.func) {
      case "slideAlert":
        util.slideAlert(...data.args);
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
        let forceSecondaryIdentity = await messenger.LegacyPrefs.getPref("extensions.quickfolders.licenser.forceSecondaryIdentity");
        // we create a new Licenser object for overwriting, this will also ensure that key_type can be changed.
        let newLicense = new Licenser(data.key, { forceSecondaryIdentity });
        await newLicense.validate();
        // Check new license and accept if ok.
        // You may return values here, which will be send back to the caller.
        // return false;
        
        // Update background license.
        await messenger.LegacyPrefs.setPref("extensions.quickfolders.LicenseKey", newLicense.info.licenseKey);
        currentLicense = newLicense;
        // Broadcast
        messenger.NotifyTools.notifyExperiment({licenseInfo: currentLicense.info})
        return true;
    }
  });
    

  messenger.WindowListener.registerDefaultPrefs("chrome/content/scripts/quickfoldersDefaults.js");
  
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

  messenger.WindowListener.registerStartupScript("chrome/content/scripts/qf-startup.js");
  messenger.WindowListener.registerShutdownScript("chrome/content/scripts/qf-shutdown.js");

 /*
  * Start listening for opened windows. Whenever a window is opened, the registered
  * JS file is loaded. To prevent namespace collisions, the files are loaded into
  * an object inside the global window. The name of that object can be specified via
  * the parameter of startListening(). This object also contains an extension member.
  */
  messenger.WindowListener.startListening(); 
  
  emitStartupFinished();
}

main();


