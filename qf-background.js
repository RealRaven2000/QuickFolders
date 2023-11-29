import * as util from "./scripts/qf-util.mjs.js";
import {Licenser} from "./scripts/Licenser.mjs.js";

const QUICKFILTERS_APPNAME = "quickFilters@axelg.com";
const TOGGLEICON_ID = "toggleQuickFoldersIcon";
const REMOVEICON_ID = "removeQuickFoldersIcon";

var currentLicense;
var startupFinished = false;
var callbacks = [];



// [issue 371] Remove console error “receiving end does not exist”
function logReceptionError(x) {
  if (x.message.includes("Receiving end does not exist.")) {
    // no need to log - quickFilters is not installed or disabled.
  } else { 
    console.log(x); 
  }  
}


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
        async function() {
          let origVer = await messenger.LegacyPrefs.getPref("extensions.quickfolders.version","0");
          const manifest = await messenger.runtime.getManifest();
          // get pure version number / remove pre123 indicator
          let installedVersion = manifest.version.replace(/pre.*/,""); 
          if (installedVersion > origVer) {
            messenger.LegacyPrefs.setPref("extensions.quickfolders.hasNews", true);
          }
          messenger.NotifyTools.notifyExperiment({event: "updateQuickFoldersLabel"});
          // replacement for showing history!!
          //   window.addEventListener("load",function(){ QuickFolders.Util.FirstRun.init(); },true);
          messenger.NotifyTools.notifyExperiment({event: "firstRun"});
        },
        200
      )
    }
    break;
  // see below
  }    


  if (isDebug) {
    console.log ("QuickFolders: messenger.runtime.onInstalled finished!")
  }
});

// display splash screen
function showSplash(msg="") {
  // alternatively display this info in a tab with browser.tabs.create(...)  
  let url = browser.runtime.getURL("popup/update.html");
  if (msg) url+= "?msg=" + encodeURI(msg);
  let screenH = window.screen.height,
      windowHeight = (screenH > 870) ? 870 : screenH;
      
  browser.windows.create({ url, type: "popup", width: 1000, height: windowHeight, allowScriptsToClose: true,});
}

function showInstalled() {
  let url = browser.runtime.getURL("popup/installed.html");
  browser.windows.create({ url, type: "popup", width: 910, height: 800, allowScriptsToClose: true });
}

// future function for icon support  [issue 399]
async function addFolderPaneMenu() {
  // replaces code from QuickFolders.Interface.folderPanePopup()
  let isDebug = await messenger.LegacyPrefs.getPref("extensions.quickfolders.debug.tbmenus"),
      txtAddIcon = messenger.i18n.getMessage("qf.foldercontextmenu.quickfolders.customizeIcon"),
      txtRemoveIcon = messenger.i18n.getMessage("qf.foldercontextmenu.quickfolders.removeIcon");
  if (isDebug) {
    console.log("QuickFolders: addFolderPaneMenu()");
  }
  let menuProps = {
    contexts: ["folder_pane"],
    onclick: async (event) => {    
      if (isDebug) { console.log("QuickFolders folderpane context menu", event); }
      const menuItem = { id: TOGGLEICON_ID };   // fake menu item to pass to doCommand

      // determine folder of clicked tree item:
      const selectedFolder = event?.selectedFolder || null;
      const selectedAccount = event?.selectedAccount || null;
      let URI = null;  
      if (selectedFolder) {
        URI = await messenger.Utilities.getFolderUri(selectedFolder.accountId, selectedFolder.path);
      } else if (selectedAccount) {
        URI = await messenger.Utilities.getFolderUri(selectedAccount.id);
      }      

      messenger.NotifyTools.notifyExperiment( 
        { 
          event: "toggleQuickFoldersIcon", 
          detail: { 
            commandItem: menuItem, 
            folderURI: URI, 
            selectedFolder: event.selectedFolder, 
            selectedAccount: event.selectedAccount 
          } 
        } 
      );
    },
    icons: {
      "16": "chrome/content/skin/ico/image.svg"
    } ,
    enabled: true,
    id: TOGGLEICON_ID,
    title: txtAddIcon
  }
  let idToggle = await messenger.menus.create(menuProps); // id of menu item
  let removeProps = {
    contexts: ["folder_pane"],
    onclick: async (event) => {    
      const menuItem = { id: REMOVEICON_ID };   // fake menu item to pass to doCommand
      let currentTab = await messenger.mailTabs.getCurrent();

      // determine folder of clicked tree item:
      const selectedFolder = event?.selectedFolder || null;
      const selectedAccount = event?.selectedAccount || null;
      let URI = null;  
      if (selectedFolder) {
        URI = await messenger.Utilities.getFolderUri(selectedFolder.accountId, selectedFolder.path);
      } else if (selectedAccount) {
        URI = await messenger.Utilities.getFolderUri(selectedAccount.id);
      }      


      messenger.NotifyTools.notifyExperiment( 
        { event: "removeQuickFoldersIcon", 
          detail: { 
            commandItem: menuItem,
            folderURI: URI, 
            selectedFolder: event.selectedFolder, 
            selectedAccount: event.selectedAccount 
          } // , windowId: currentTab.windowId, tabId: currentTab.id
        } 
      );
    },
    icons: {
      "16": "chrome/content/skin/ico/picture-remove.svg"
    } ,
    enabled: true,
    visible: false,
    id: REMOVEICON_ID,
    title: txtRemoveIcon
  }
  let idRemove = await messenger.menus.create(removeProps); 
  messenger.menus.onShown.addListener(async (info, tab) => {
    const selectedFolder = info?.selectedFolder || null;
    const selectedAccount = info?.selectedAccount || null;
    const isServer = selectedAccount ? true : false;

    let icon = null;
    if (selectedFolder) {
      icon = await messenger.Utilities.getFolderIcon(selectedFolder.accountId, selectedFolder.path);
    } else if (selectedAccount) {
      icon = await messenger.Utilities.getFolderIcon(selectedAccount.id);
    }
    if (isDebug) { 
      console.log("QuickFolders [debug.tbmenu]\n menus.onShown() - folderpane context menu:", selectedFolder, info, icon); 
    }
    let hasIcon = (icon != null && icon.iconURL); // query the icon somehow.
    if (hasIcon) {
      await messenger.menus.update(idRemove, {visible: true});
    } else {
      await messenger.menus.update(idRemove, {visible: false});
    }
    if (!isServer && !selectedFolder) {
      await messenger.menus.update(idToggle, {visible: false});
      await messenger.menus.update(idRemove, {visible: false});
    } else {
      await messenger.menus.update(idToggle, {visible: true});
    }

    messenger.menus.refresh();    
  });
    

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

  let msg_commands = [
    "currentDeckUpdate",
    "getLicenseInfo",
    "copyFolderEntries",
    "pasteFolderEntries",
    "legacyAdvancedSearch", // new global one!
    "showAboutConfig", // new global one!
    "showLicenseDialog", // new global one!
    "slideAlert",
    "updateCategoryBox",
    "updateFoldersUI",
    "updateLicense",
    "updateMainWindow",
    "updateNavigationBar",
    "updateQuickFoldersLabel",
    "updateUserStyles",
    "readCategories",
    "storeCategories",
    "readToolbarStatus",
    "storeToolbarStatus",
    "toggleNavigationBars"
  ];

  
  async function notificationHandler(data) {
    let command = data.func || data.command;
    switch (command) {
      case "slideAlert":
        util.slideAlert(...data.args);
        break;
      
      case "splashScreen":
        let splashMessage = data.msg || "";
        showSplash(splashMessage);
        break;

      case "splashInstalled":
        showInstalled();
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
        messenger.NotifyTools.notifyExperiment({event: "updateFoldersUI"});
        break;
        
      case "updateAllTabs": 
        // only update tabs, without styles - reads the tabs from the store to support:
        //   adding / renaming / deleting / re-categorizing / re-ordering
        //   across all Windows instances.
        messenger.NotifyTools.notifyExperiment({event: "updateAllTabs"});
        break;
        
      case "updateNavigationBar":
        await messenger.NotifyTools.notifyExperiment({event: "updateNavigationBar"});
        break;

      case "toggleNavigationBars": // toggles _all_ navigation bars (from options window)
        messenger.NotifyTools.notifyExperiment({event: "toggleNavigationBars"});
        break;
        
      case "updateCategoryBox":
        messenger.NotifyTools.notifyExperiment({event: "updateCategoryBox"});
        break;
        
      case "updateMainWindow": // we need to add one parameter (minimal) to pass through!
        let isMinimal = (data.minimal) || false;
        messenger.NotifyTools.notifyExperiment({event: "updateMainWindow", minimal: isMinimal});
        break;
        
      case "showAboutConfig":
        messenger.NotifyTools.notifyExperiment({
          event: "showAboutConfig", 
          element: null,
          filter: data.filter,
          readOnly: data.readOnly,
          updateUI: data.updateUI || false
        });
        break;
        
      case "showLicenseDialog":
        messenger.NotifyTools.notifyExperiment({
          event: "showLicenseDialog", 
          referrer: data.referrer
        });
        break;
        
      case "legacyAdvancedSearch":
        messenger.NotifyTools.notifyExperiment({event: "legacyAdvancedSearch"});
        break;
        
      case "currentDeckUpdate":
        messenger.NotifyTools.notifyExperiment({event: "currentDeckUpdate"});
        break;
        
      case "initKeyListeners":
        messenger.NotifyTools.notifyExperiment({event: "initKeyListeners"});
        break;
        
      case "openPrefs":
        let params = new URLSearchParams();
        if (data.selectedTab || data.selectedTab==0) {
          params.append("selectedTab", data.selectedTab);
        }
        if (data.mode) {
          params.append("mode", data.mode);
        }
        
        let title = messenger.i18n.getMessage("qf.prefwindow.quickfolders.options");
        // to get the tab - we need the activetab permission
        // query for url 
        let url = browser.runtime.getURL("/html/options.html") + "*";

        let oldTabs = await browser.tabs.query({url}); // destructure first 
        if (oldTabs.length) {
          // get current windowId
          let currentWin = await browser.windows.getCurrent();
          let found = oldTabs.find( w => w.windowId == currentWin.id);
          if (!found) {
            [found] = oldTabs; // destructure first element
            await browser.windows.update(found.windowId, {focused:true});
          }
          await browser.tabs.update(found.id, {active:true});
        }
        else {
          let optionWin = await messenger.windows.create(
            { height: 780, 
              width: 830, 
              type: "panel", 
              url: `/html/options.html?${params.toString()}`,
              allowScriptsToClose : true
            }
          );
        }
           
        // optionWin.sizeToContent() 
        break;

      case "openAdvancedProps":
        {
          let params = new URLSearchParams();
          const x = parseInt(data.x,10), y = parseInt(data.y,10);
          params.append("folderURI", data.folderURI ); // to do: pass folder or url in event
          params.append("x", x);
          params.append("y", y);
          let window = await messenger.windows.create({
            left: x,
            top: y,
            type: "popup",
            allowScriptsToClose: true,
            url:  `/html/quickfolders-tab-props.html?${params.toString()}`,
          });
          // focused: true,

        }
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
        
        // 1. Broadcast into Experiment
        messenger.NotifyTools.notifyExperiment({licenseInfo: currentLicense.info});
        
        // 2. notify options.html (new, using message API)
        let message = {
          msg: "updatedLicense",
          licenseInfo: currentLicense.info
        }
        messenger.runtime.sendMessage(message);
        
        messenger.NotifyTools.notifyExperiment({event: "updateAllTabs"});
        // if ( (await messenger.management.getAll()).find(({ id }) => id === QUICKFILTERS_APPNAME) ) {
        messenger.runtime.sendMessage(QUICKFILTERS_APPNAME, 
          { command: "updateQuickFoldersLicense", 
            license: { status: currentLicense.info.status, keyType: currentLicense.info.keyType } }).catch(logReceptionError);
        // }
        return true;
        
      case "updateLicenseTimer":
        await currentLicense.updateLicenseDates();

        messenger.NotifyTools.notifyExperiment({licenseInfo: currentLicense.info});
        messenger.NotifyTools.notifyExperiment({event: "updateMainWindow", minimal: false});          
        break;

      case "createSubfolder":  // [issue 234]
        // if folderName is not given - create a popup window
        
        return browser.folders.create(data.parentPath, data.folderName || "test1"); // like await but returns
        
      case "copyFolderEntries":
        messenger.NotifyTools.notifyExperiment({event: "copyFolderEntriesToClipboard"});
        break;
      case "pasteFolderEntries":
        messenger.NotifyTools.notifyExperiment({event: "pasteFolderEntriesFromClipboard"});
        break;
        
      case "updateQuickFilters":
        {
          let licenseStatus = currentLicense.info.status,
          licenseType = currentLicense.info.keyType;
          // require management permission to check if qF is installed
          // if ( (await messenger.management.getAll()).find(({ id }) => id === QUICKFILTERS_APPNAME) ) {
          messenger.runtime.sendMessage(QUICKFILTERS_APPNAME, 
            { command: "injectButtonsQFNavigationBar", 
              license: { status: licenseStatus, keyType: licenseType } }).catch(logReceptionError);
          // }
        }
        break;
                
      case "searchMessages": // test
        messenger.messages.list(data.folder);
        break;

      case "initActionButton": // initialize toggle toolbar button
        messenger.Utilities.toggleToolbarAction(true); // patch action button (toolbar toggle)
        break;

      case "storeCategories": // store category in session
        await messenger.sessions.setTabValue(data.tabId, "QuickFolders_Categories", data.categories);
        break;

      case "readCategories": // read category from tabsession
      {
        let cats = await messenger.sessions.getTabValue(data.tabId, "QuickFolders_Categories");
        return cats;
      }
        
      case "storeToolbarStatus": // store toolbar visibilities in tabsession
        await messenger.sessions.setTabValue(data.tabId, "QuickFolders_ToolbarStatus", data.status);
        break;

      case "readToolbarStatus": // store toolbar visibilities in tabsession
      {
        let status = await messenger.sessions.getTabValue(data.tabId, "QuickFolders_ToolbarStatus");
        return status
      }

      case "addFolderPaneMenu":
        addFolderPaneMenu();
        break;


    }
  }
  
  // background listener
  messenger.NotifyTools.onNotifyBackground.addListener((data) => {
    messenger.LegacyPrefs.getPref(legacy_root + "debug.notifications").then(
      isLog => {
        if (isLog && data.func) {
          console.log ("=========================\n" +
                       "BACKGROUND LISTENER received: " + data.func + "\n" +
                       "=========================");
        }
      }
    );
    return notificationHandler(data); // returns the promise for notification Handler
  });
  
  // message listener - SELECTIVE!
  // every message listener must have its unique set of messages (if it returns something)
  messenger.runtime.onMessage.addListener((data, sender) => {
    if (msg_commands.includes(data.command)) {
      return notificationHandler(data, sender); // the result of this is a Promise
    }
  });
  
  
  let browserInfo = await messenger.runtime.getBrowserInfo();
  // Init WindowListener.
  function getThunderbirdVersion() {
    let parts = browserInfo.version.split(".");
    return {
      major: parseInt(parts[0]),
      minor: parseInt(parts[1]),
      revision: parts.length > 2 ? parseInt(parts[2]) : 0,
    }
  }  

  messenger.runtime.onMessageExternal.addListener( async  (message, sender) =>  
  {
    switch(message.command) {
      case "queryQuickFoldersLicense": 
        return { 
          status: currentLicense.info.status,
          keyType: currentLicense.info.keyType
        }
        break;
    }
  });  
  
  messenger.WindowListener.registerChromeUrl([ 
      ["content", "quickfolders", "chrome/content/"],
      ["content", "quickfolders-skins", "chrome/content/skin/tb91/"]
  ]);
  
  
  messenger.WindowListener.registerWindow("chrome://messenger/content/messenger.xhtml", "chrome/content/scripts/qf-messenger.js");
  // inject a separate script for current folder toolbar!
  messenger.WindowListener.registerWindow("about:3pane", "chrome/content/scripts/qf-3pane.js");
  messenger.WindowListener.registerWindow("about:message", "chrome/content/scripts/qf-3pane.js");

  messenger.WindowListener.registerWindow("chrome://messenger/content/messengercompose/messengercompose.xhtml", "chrome/content/scripts/qf-composer.js");
  messenger.WindowListener.registerWindow("chrome://messenger/content/SearchDialog.xhtml", "chrome/content/scripts/qf-searchDialog.js");
  messenger.WindowListener.registerWindow("chrome://messenger/content/customizeToolbar.xhtml", "chrome/content/scripts/qf-customizetoolbar.js");
  messenger.WindowListener.registerWindow("chrome://messenger/content/messageWindow.xhtml", "chrome/content/scripts/qf-messageWindow.js");  


 /*
  * Start listening for opened windows. Whenever a window is opened, the registered
  * JS file is loaded. To prevent namespace collisions, the files are loaded into
  * an object inside the global window. The name of that object can be specified via
  * the parameter of startListening(). This object also contains an extension member.
  */
  // make sure session has loaded all tabs.
  let [ mailTab ] = await browser.mailTabs.query({});
  await browser.mailTabs.get(mailTab.id)
  messenger.WindowListener.startListening(); 
  
  // [issue 296] Exchange account validation (supported since TB98)
  messenger.accounts.onCreated.addListener( async(id, account) => {
    if (currentLicense.info.status == "MailNotConfigured") {
      // redo license validation!
      if (isDebugLicenser) console.log("Account added, redoing license validation", id, account); // test
      currentLicense = new Licenser(key, { forceSecondaryIdentity, debug: isDebugLicenser });
      await currentLicense.validate();
      if(currentLicense.info.status != "MailNotConfigured") {
        if (isDebugLicenser) console.log("notify experiment code of new license status: " + currentLicense.info.status);
        messenger.NotifyTools.notifyExperiment({licenseInfo: currentLicense.info});
        messenger.NotifyTools.notifyExperiment({event: "updateMainWindow", minimal: false});
      }
      if (isDebugLicenser) console.log("QF license info:", currentLicense.info); // test
    }
    else {
      if (isDebugLicenser) console.log("QF license state after adding account:", currentLicense.info)
    }
  });

  if (isDebug) {
    console.log ("QuickFolders: add toggle-foldertree command... ")
  }

  let toggleFolderLabel = messenger.i18n.getMessage("commands.toggleFolderTree");
  await messenger.commands.update({name:"toggle-foldertree", description: toggleFolderLabel });   

  messenger.commands.onCommand.addListener((command) => {
    if (isDebug) { console.log("command listener received", command); }
    switch (command) {
      case "toggle-foldertree":
        messenger.NotifyTools.notifyExperiment({event: "toggleFolderTree"});
        break;
      }
  });

  messenger.browserAction.onClicked.addListener((tab, info) => {
    console.log("browserAction.click!");
    messenger.Utilities.toggleToolbarAction(false);
  });

    

} // main

main();


