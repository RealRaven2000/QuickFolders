import * as util from "./scripts/qf-util.mjs.js";
import {Licenser} from "./scripts/Licenser.mjs.js";

const QUICKFILTERS_APPNAME = "quickFilters@axelg.com";
const ADDQUICKFOLDER_ID = "addQuickFolderTab";
const TOGGLEICON_ID = "toggleQuickFoldersIcon";
const REMOVEICON_ID = "removeQuickFoldersIcon";
const LEGACY_SETTINGS_ROOT = "extensions.quickfolders.";

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

function legacyPrefPath(setting) {
  return LEGACY_SETTINGS_ROOT + setting;
}
async function isDebugOn() {
  return (await messenger.LegacyPrefs.getPref(legacyPrefPath("debug"))) || false;
}



  /* startupFinished: There is a general race condition between onInstall and our main() startup:
   * - onInstall needs to be registered upfront (otherwise we might miss it)
   * - but onInstall needs to wait with its execution until our main function has
   *   finished the init routine
   * -> emit a custom event once we are done and let onInstall await that
   */

messenger.WindowListener.registerDefaultPrefs("chrome/content/scripts/quickfoldersDefaults.js");


function compareVersions(v1, v2) {
  const v1Parts = v1.split(".").map(Number);
  const v2Parts = v2.split(".").map(Number);

  const maxLength = Math.max(v1Parts.length, v2Parts.length);

  for (let i = 0; i < maxLength; i++) {
    const part1 = v1Parts[i] || 0; // Default to 0 if segment is missing
    const part2 = v2Parts[i] || 0;

    if (part1 > part2) return 1; // v1 > v2
    if (part1 < part2) return -1; // v1 < v2
  }

  return 0; // v1 == v2
}

function versionGreaterOrEqual(v1, v2) {
  return compareVersions(v1, v2) >= 0;
}

function versionGreater(v1, v2) {
  return compareVersions(v1, v2) > 0;
}

function versionEqual(v1, v2) {
  return compareVersions(v1, v2) === 0;
}


// special listener to be ready for sending up the firstRun message:
let listenersReadyPromise = new Promise((resolve) => {
  const listenerFunction = (message) => {
    if (message.func === "listenersReady") {
      console.log("Listeners are ready, resolving the promise...");
      resolve();
      // making sure this is only used once, in case we reinstall multiple times in a session.
      messenger.NotifyTools.onNotifyBackground.removeListener(listenerFunction);
    }
  }

  messenger.NotifyTools.onNotifyBackground.addListener(listenerFunction);
});


messenger.runtime.onInstalled.addListener(async (data) => {
  let { reason, previousVersion, temporary } = data;
  const isDebug = await isDebugOn();
  const manifest = await messenger.runtime.getManifest();

  if (isDebug) {
    debugger;
    console.log("%cQuickFolders onInstalled:", "background: black; color: yellow;", {
      reason,
      previousVersion,
      temporary,
      installed_ver: manifest.version,
    });
  }
  
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
          isLicensed = currentLicenseInfo.status == "Valid";
        if (isLicensed) {
          if (isDebug) console.log("QuickFolders License - " + gpdays + " Days left.");
        }
      }

      // Define a Map of silent update rules with wildcards
      const silentUpdateMap = new Map([
        ["6.8.1", ["6.8.*"]], // Silent updates for 6.8.1 to any 6.8.x (e.g., 6.8.2, 6.8.3, etc.)
        ["6.9.1", ["6.9.2"]], // Silent update minor fix for [issue 532]
      ]);

      // Helper function to check if a version matches a pattern
      function versionMatches(version, pattern) {
        const regex = new RegExp(`^${pattern.replace(/\*/g, "\\d+")}$`);
        return regex.test(version);
      }

      // Function to check if an update is silent
      function isSilentUpdate(fromVersion, toVersion) {
        const patterns = silentUpdateMap.get(fromVersion);
        if (!patterns) return false; // No silent updates defined for this `fromVersion`

        // Check if `toVersion` matches any pattern in the list
        return patterns.some((pattern) => versionMatches(toVersion, pattern));
      }

      (async () => {
        try {
          await listenersReadyPromise; // we want to make sure all listeners are set up and ready to receive events.
          // set a flag which will be cleared by clicking the [QuickFolders] button once
          let origVer = await messenger.LegacyPrefs.getPref(legacyPrefPath("version"), "0");
          // get pure version number
          // remove prerelease + any trailing "." that might be before pre
          let installedVersion = manifest.version.replace(/pre.*/, "").replace(/\.$/, "");
          const isUpgrade = versionGreater(installedVersion, origVer),
            isSilent = isSilentUpdate(origVer, installedVersion);

          if (isDebug) {
            console.log(`QuickFolders Update - from ${origVer} to ${installedVersion}\n`, {
              upgraded: isUpgrade,
              silenced: isSilent,
            });
          }

          if (isUpgrade && !isSilent) {
            messenger.LegacyPrefs.setPref(legacyPrefPath("hasNews"), true);
          }

          messenger.NotifyTools.notifyExperiment({ event: "updateQuickFoldersLabel" });
          if (isDebug) {
            console.log("%cQF notifying experiment: firstRun", "background: black; color: yellow;");
          }
          messenger.NotifyTools.notifyExperiment({ event: "firstRun" });
        } catch (error) {
          console.error("Error during QuickFolders onInstalled listener:", error);
        }
      })();
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

async function filterMailsRegex(searchOptions, tabId = null) {
  const DEFAULT_BEHAVIOR = {
    isSelectPrevious: await messenger.LegacyPrefs.getPref(
      legacyPrefPath("findRelated.behavior.selectPrevious")
    )
  }
  
  const group = searchOptions.group;   // 0 for full match
  const searchSelected = searchOptions.searchSelected;
  const searchCriteria =  searchOptions.searchCriteria;  // if fields is null, do not change this!
  let searchValue = searchOptions.pattern, // allow overwriting in debugger for test!
    searchFlags = "";
  const behavior = searchOptions.behavior || DEFAULT_BEHAVIOR;

  if (searchValue.charAt(0) == "/") {
    let endIdx = searchValue.lastIndexOf("/");
    if (endIdx) { // must be>0! otherwise 2nd slash is missing!!
      searchValue = searchOptions.pattern.substring(1, endIdx);
      searchFlags = searchOptions.pattern.substring(endIdx + 1);
    } else {
      const isDebug = await messenger.LegacyPrefs.getPref(legacyPrefPath("debug"));
      if (isDebug){
        console.log(`Invalid search string in find Related - missing 2nd '/' : ${searchFlags}`);
      } 
      searchFlags = searchOptions.pattern.substring(1); // removing beginning '/'
    }
  } 
  
  if (!searchFlags) {
    searchFlags = "gm";
  }

  const regex = new RegExp(searchValue, searchFlags);
  let results, searchVal = "";

  // context.extension.tabManager.getWrapper(tabInfo).id
  if (!tabId) {
    const currentTab = await messenger.tabs.getCurrent();
    if (!currentTab) return;
    tabId = currentTab.id;
  }
  const selectedMessages = await messenger.mailTabs.getSelectedMessages(tabId);
  if (selectedMessages.messages.length == 0) {
    // do nothing? 
    // or reset search.
    return;
  }
  // https://webextension-api.thunderbird.net/en/latest/mailTabs.html#mailtabs-quickfiltertextdetail
  let searchTextProps = {}; // the text property is a QuickFilterTextDetail object!
  let message = selectedMessages.messages[0];
  const currentMessageHdrId = message.headerMessageId;
  // retrieve a search text value from the selected message:
  if (searchSelected.includes("subject")) {
    results = regex.exec(message.subject);
    if (results?.length > group) {
      searchVal = results[group];
    }
  }
  if (!searchVal && searchSelected.includes("recipients")) {
    results = regex.exec(message.recipients.join(" "));
    if (results?.length > group) {
      searchVal = results[group];
    }
  }
  
  if (!searchVal && searchSelected.includes("sender")) {
    results = regex.exec(message.author);
    if (results?.length > group) {
      searchVal = results[group];
    }
  }

  if (!searchVal && searchSelected.includes("body")) {
    const fullMessage = await messenger.messages.getFull(message.messageId);
    if (fullMessage) {
      results = regex.exec(fullMessage.body);
      if (results?.length > group) {
        searchVal = results[group];
      }
    }
  }  

  if (searchVal) {
    // Remember last extracted search term, so we can use this for a search reset
    // when user clicks "next unread message"
    // we MUST reset this whenever use changes to a different folder!!!
    // folder listener?
    messenger.LegacyPrefs.setPref(legacyPrefPath("findRelated.lastSearchVal"), searchVal);
  }
  

  if (searchCriteria.includes("subject")) {
    searchTextProps.subject = true;
  }
  if (searchCriteria.includes("recipients")) {
    searchTextProps.recipients = true;
  }
  if (searchCriteria.includes("sender")) {
    searchTextProps.author = true;
  }
  if (searchCriteria.includes("body")) {
    searchTextProps.body = true;
  }  
  searchTextProps.text = searchVal;

  // we need to pass an object that contains obj.text=QuickFilterTextDetail !
  if (tabId) {
    await browser.mailTabs.setQuickFilter(tabId, {text: searchTextProps} );  
  } else {
    await browser.mailTabs.setQuickFilter( {text: searchTextProps} );  
  }
  if (behavior.isSelectPrevious) {
    // select currentMessageId then go "up" to the previously received / sent mail
    const options = {color:"white", background:"rgb(80,0,0)"};
    const txt = "filterMailsRegex";
    console.log(`QuickFolders %c${txt}`, 
      `color: ${options.color}; background: ${options.background}`, 
      `TO DO: select previous message from id: ${currentMessageHdrId}`);
  }
}

// future function for icon support  [issue 399]
async function addFolderPaneMenu() {
  // replaces code from QuickFolders.Interface.folderPanePopup()
  const isDebug = await messenger.LegacyPrefs.getPref(legacyPrefPath("debug.tbmenus")),
    txtAddIcon = messenger.i18n.getMessage("qf.foldercontextmenu.quickfolders.customizeIcon"),
    txtRemoveIcon = messenger.i18n.getMessage("qf.foldercontextmenu.quickfolders.removeIcon"),
    isShowIconMenu = !(await messenger.LegacyPrefs.getPref(legacyPrefPath("accessibility.hideIconMenu")));
  if (isDebug) {
    console.log("QuickFolders: addFolderPaneMenu()");
  }
  /*** add icon to Folder  */
  const menuProps = {
    contexts: ["folder_pane"],
    onclick: async (event) => {
      if (isDebug) {
        console.log("QuickFolders folderpane context menu", event);
      }
      const menuItem = { id: TOGGLEICON_ID }; // fake menu item to pass to doCommand

      // determine folder of clicked tree item:
      const selectedFolder = event?.selectedFolder || null;
      // new multiple folders selection
      const selectedFolders = event?.selectedFolders || null;

      // multiple folders are selected, we cannot execute
      if (selectedFolders && selectedFolders.length > 1) {
        console.log(
          "QuickFolders: addFolderPaneMenu -  cannot execute, multiple folders are selected!"
        );
        return;
      }

      const selectedAccount = event?.selectedAccount || null;
      let URI = null;
      if (selectedFolder) {
        URI = await messenger.Utilities.getFolderUri(selectedFolder.accountId, selectedFolder.path);
      } else if (selectedAccount) {
        URI = await messenger.Utilities.getFolderUri(selectedAccount.id);
      }

      messenger.NotifyTools.notifyExperiment({
        event: "toggleQuickFoldersIcon",
        detail: {
          commandItem: menuItem,
          folderURI: URI,
          selectedFolder: event.selectedFolder,
          selectedAccount: event.selectedAccount,
        },
      });
    },
    icons: {
      16: "chrome/content/skin/ico/image.svg",
    },
    enabled: true,
    id: TOGGLEICON_ID,
    title: txtAddIcon,
    visible: isShowIconMenu,
  };
  const idToggle = await messenger.menus.create(menuProps); // id of menu item

  /*** remove icon from Folder  */
  const removeProps = {
    contexts: ["folder_pane"],
    onclick: async (event) => {
      const menuItem = { id: REMOVEICON_ID }; // fake menu item to pass to doCommand
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

      messenger.NotifyTools.notifyExperiment({
        event: "removeQuickFoldersIcon",
        detail: {
          commandItem: menuItem,
          folderURI: URI,
          selectedFolder: event.selectedFolder,
          selectedAccount: event.selectedAccount,
        }, // , windowId: currentTab.windowId, tabId: currentTab.id
      });
    },
    icons: {
      16: "chrome/content/skin/ico/picture-remove.svg",
    },
    enabled: true,
    visible: false,
    id: REMOVEICON_ID,
    title: txtRemoveIcon,
  };
  const idRemove = await messenger.menus.create(removeProps);
  messenger.menus.onShown.addListener(async (info, tab) => {
    const isShowIconMenus =  !(await messenger.LegacyPrefs.getPref(legacyPrefPath("accessibility.hideIconMenu")));
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
      console.log(
        "QuickFolders [debug.tbmenu]\n menus.onShown() - folderpane context menu:",
        selectedFolder,
        info,
        icon
      );
    }

    let hasIcon = icon != null && icon.iconURL; // query the icon somehow.
    if (hasIcon) {
      await messenger.menus.update(idRemove, { visible: isShowIconMenus });
    } else {
      await messenger.menus.update(idRemove, { visible: false });
    }
    if (!isServer && !selectedFolder) {
      await messenger.menus.update(idToggle, { visible: false });
      await messenger.menus.update(idRemove, { visible: false });
    } else {
      await messenger.menus.update(idToggle, { visible: isShowIconMenus });
    }

    messenger.menus.refresh();
  });
  /*** add folder as QuickFolder - a11y  */
  const txtAddQuickFOlder = messenger.i18n.getMessage(
    "qf.foldercontextmenu.quickfolders.addQuickFolder"
  );
  const addTabProps = {
    contexts: ["folder_pane"],
    onclick: async (event) => {
      const menuItem = { id: ADDQUICKFOLDER_ID }; // fake menu item to pass to doCommand
      // multiple folders selection?
      const selectedFolders = event?.selectedFolders || null;
      if (selectedFolders && selectedFolders.length > 1) {
        // alert: adding multiple folders - not supported!
        return;
      }
      // determine folder of clicked tree item:
      const selectedFolder = event?.selectedFolder || null;
      const URI = await messenger.Utilities.getFolderUri(
        selectedFolder.accountId,
        selectedFolder.path
      );
      messenger.NotifyTools.notifyExperiment({
        event: ADDQUICKFOLDER_ID,
        detail: {
          commandItem: menuItem,
          folderURI: URI,
          selectedFolder: event.selectedFolder,
          selectedAccount: event.selectedAccount,
        },
      });
    },
    enabled: true,
    id: ADDQUICKFOLDER_ID,
    title: txtAddQuickFOlder,
  };
  let idAddQuickFolderTab = await messenger.menus.create(addTabProps);
}

async function getFindRelatedStruct() {
    const jsonList = await messenger.LegacyPrefs.getPref(
      legacyPrefPath("findRelated.list")
    );
    let findRelatedList;
    try {
      findRelatedList = JSON.parse(jsonList || "{}");
    } catch (ex) {
      console.log("Exception during getFindRelatedStruct(): ", { jsonList }, ex);
      findRelatedList = {};
    }
    if (!findRelatedList?.items) {
      // use for the first time
      findRelatedList = findRelatedList || {};
      findRelatedList.items = [];
      // import current / first item
      findRelatedList.items.push({
        title: "last search",
        pattern: await messenger.LegacyPrefs.getPref(legacyPrefPath("findRelated.pattern")),
        group: await messenger.LegacyPrefs.getPref(legacyPrefPath("findRelated.group")) || 0,
        searchSelected: await messenger.LegacyPrefs.getPref(
          legacyPrefPath("findRelated.searchSelected")
        ), // containing an array of options
        searchCriteria: await messenger.LegacyPrefs.getPref(
          legacyPrefPath("findRelated.searchCriteria")
        ), // containing an array of options
      });
      if (isDebugOn()) { 
        console.log("getFindRelatedStruct retrieved:", { findRelatedList });
      }
    }
    return findRelatedList;   
}

async function main() {
  const key = await messenger.LegacyPrefs.getPref(legacyPrefPath("LicenseKey"), ""),
    forceSecondaryIdentity =
      (await messenger.LegacyPrefs.getPref(legacyPrefPath("licenser.forceSecondaryIdentity"))) ||
      false,
    isDebug = await isDebugOn(),
    isDebugLicenser =
      (await messenger.LegacyPrefs.getPref(legacyPrefPath("debug.premium.licenser"))) || false;

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

      case "getFindRelatedList": {
        let relatedArr = await getFindRelatedStruct();
        return JSON.stringify(relatedArr);
      }

      case "getPlatformInfo":
        return messenger.runtime.getPlatformInfo();

      case "getBrowserInfo":
        return messenger.runtime.getBrowserInfo();

      case "getAddonInfo":
        return messenger.management.getSelf();

      case "updateQuickFoldersLabel":
        // Broadcast main windows to run updateQuickFoldersLabel
        messenger.NotifyTools.notifyExperiment({ event: "updateQuickFoldersLabel" });
        break;

      case "updateUserStyles":
        // Broadcast main windows to update their styles (and maybe single message windows???)
        messenger.NotifyTools.notifyExperiment({ event: "updateUserStyles" });
        break;

      case "updateFoldersUI": // replace observer
        messenger.NotifyTools.notifyExperiment({ event: "updateFoldersUI" });
        break;

      case "updateAllTabs":
        // only update tabs, without styles - reads the tabs from the store to support:
        //   adding / renaming / deleting / re-categorizing / re-ordering
        //   across all Windows instances.
        messenger.NotifyTools.notifyExperiment({ event: "updateAllTabs" });
        break;

      case "updateNavigationBar":
        await messenger.NotifyTools.notifyExperiment({ event: "updateNavigationBar" });
        break;

      case "toggleNavigationBars": // toggles _all_ navigation bars (from options window)
        messenger.NotifyTools.notifyExperiment({ event: "toggleNavigationBars" });
        break;

      case "updateCategoryBox":
        messenger.NotifyTools.notifyExperiment({ event: "updateCategoryBox" });
        break;

      case "updateMainWindow": // we need to add one parameter (minimal) to pass through!
        let isMinimal = data.minimal || false;
        messenger.NotifyTools.notifyExperiment({
          event: "updateMainWindow",
          detail: { minimal: isMinimal },
        });
        break;

      case "showAboutConfig":
        // to do: create an API for this one
        messenger.NotifyTools.notifyExperiment({
          event: "showAboutConfig",
          element: null,
          filter: data.filter,
          readOnly: data.readOnly,
          updateUI: data.updateUI || false,
        });
        break;

      case "showLicenseDialog":
        messenger.NotifyTools.notifyExperiment({
          event: "showLicenseDialog",
          referrer: data.referrer,
        });
        break;

      case "legacyAdvancedSearch":
        messenger.NotifyTools.notifyExperiment({ event: "legacyAdvancedSearch" });
        break;

      case "currentDeckUpdate":
        messenger.NotifyTools.notifyExperiment({ event: "currentDeckUpdate" });
        break;

      case "initKeyListeners":
        messenger.NotifyTools.notifyExperiment({ event: "initKeyListeners" });
        break;

      case "openPrefs":
        let params = new URLSearchParams();
        if (data.selectedTab) {
          params.append("selectedTab", data.selectedTab);
        }
        if (data.mode) {
          params.append("mode", data.mode);
        }

        // to get the tab - we need the activetab permission
        // query for url
        const url = browser.runtime.getURL("/html/options.html") + "*";
        let oldTabs = await browser.tabs.query({ url }); // destructure first
        if (oldTabs.length) {
          // get current windowId
          let currentWin = await browser.windows.getCurrent();
          let found = oldTabs.find((w) => w.windowId == currentWin.id);
          if (!found) {
            [found] = oldTabs; // destructure first element
            await browser.windows.update(found.windowId, { focused: true, drawAttention: true });
          } else {
            await browser.tabs.update(found.id, { active: true });
          }
          // activate the tab that we need, after the settings page is ready
          if (data.mode) {
            if (isDebug) console.log(`Activate preference page: ${data.mode}`);
            await browser.runtime.sendMessage({
              activatePrefsPage: data.mode,
            });
          }  
          return;      
        } 
        if (await messenger.LegacyPrefs.getPref(legacyPrefPath("optionsInTab"))) {
          // await messenger.runtime.openOptionsPage();
          const myuri = browser.runtime.getURL(`html/options.html?${params.toString()}`);
          let optionsTab = await browser.tabs.create({
            active: true,
            url: myuri,
          });
          return;
        } 
        // open options in a window (old)
        let optionsWin = await messenger.windows.create({
          height: 720,
          width: 840,
          type: "panel",
          url: `/html/options.html?${params.toString()}`,
          allowScriptsToClose: true,
        });
        break;

      case "openAdvancedProps":
        {
          let params = new URLSearchParams();
          const x = parseInt(data.x, 10),
            y = parseInt(data.y, 10);
          params.append("folderURI", data.folderURI); // to do: pass folder or url in event
          params.append("x", x);
          params.append("y", y);
          let window = await messenger.windows.create({
            left: x,
            top: y,
            type: "popup",
            allowScriptsToClose: true,
            url: `/html/quickfolders-tab-props.html?${params.toString()}`,
          });
          // focused: true,
        }
        break;

      case "updateLicense":
        let forceSecondaryIdentity = await messenger.LegacyPrefs.getPref(
            legacyPrefPath("licenser.forceSecondaryIdentity")
          ),
          isDebugLicenser = await messenger.LegacyPrefs.getPref(
            legacyPrefPath("debug.premium.licenser")
          );

        // we create a new Licenser object for overwriting, this will also ensure that key_type can be changed.
        let newLicense = new Licenser(data.key, { forceSecondaryIdentity, debug: isDebugLicenser });
        await newLicense.validate();
        // Check new license and accept if ok.
        // You may return values here, which will be send back to the caller.
        // return false;

        // Update background license.
        await messenger.LegacyPrefs.setPref(
          legacyPrefPath("LicenseKey"),
          newLicense.info.licenseKey
        );
        currentLicense = newLicense;

        // 1. Broadcast into Experiment
        messenger.NotifyTools.notifyExperiment({ licenseInfo: currentLicense.info });

        // 2. notify options.html (new, using message API)
        let message = {
          msg: "updatedLicense",
          licenseInfo: currentLicense.info,
        };
        messenger.runtime.sendMessage(message);

        messenger.NotifyTools.notifyExperiment({ event: "updateAllTabs" });
        // if ( (await messenger.management.getAll()).find(({ id }) => id === QUICKFILTERS_APPNAME) ) {
        messenger.runtime
          .sendMessage(QUICKFILTERS_APPNAME, {
            command: "updateQuickFoldersLicense",
            license: { status: currentLicense.info.status, keyType: currentLicense.info.keyType },
          })
          .catch(logReceptionError);
        // }
        return true;

      case "updateLicenseTimer":
        await currentLicense.updateLicenseDates();

        messenger.NotifyTools.notifyExperiment({ licenseInfo: currentLicense.info });
        messenger.NotifyTools.notifyExperiment({ event: "updateMainWindow", minimal: false });
        break;

      case "createSubfolder": // [issue 234]
        // if folderName is not given - create a popup window

        return browser.folders.create(data.parentPath, data.folderName || "test1"); // like await but returns

      case "copyFolderEntries":
        messenger.NotifyTools.notifyExperiment({ event: "copyFolderEntriesToClipboard" });
        break;
      case "pasteFolderEntries":
        messenger.NotifyTools.notifyExperiment({ event: "pasteFolderEntriesFromClipboard" });
        break;

      case "updateQuickFilters":
        {
          let licenseStatus = currentLicense.info.status,
            licenseType = currentLicense.info.keyType;
          // require management permission to check if qF is installed
          // if ( (await messenger.management.getAll()).find(({ id }) => id === QUICKFILTERS_APPNAME) ) {
          messenger.runtime
            .sendMessage(QUICKFILTERS_APPNAME, {
              command: "injectButtonsQFNavigationBar",
              license: { status: licenseStatus, keyType: licenseType },
            })
            .catch(logReceptionError);
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
        await messenger.sessions.setTabValue(
          data.tabId,
          "QuickFolders_Categories",
          data.categories
        );
        break;

      case "readCategories": {
        // read category from tabsession
        let cats = await messenger.sessions.getTabValue(data.tabId, "QuickFolders_Categories");
        return cats;
      }

      case "storeToolbarStatus": // store toolbar visibilities in tabsession
        await messenger.sessions.setTabValue(data.tabId, "QuickFolders_ToolbarStatus", data.status);
        break;

      case "filterMailsRegex": // filter based on current mail!
        let regexOption = JSON.parse(data.searchOptions);
        await filterMailsRegex(regexOption, data.tabId);
        break;

      case "readToolbarStatus": {
        // store toolbar visibilities in tabsession
        let status = await messenger.sessions.getTabValue(data.tabId, "QuickFolders_ToolbarStatus");
        return status;
      }

      case "addFolderPaneMenu":
        addFolderPaneMenu();
        break;

      case "openLinkInTab":
        // https://webextension-api.thunderbird.net/en/stable/tabs.html#query-queryinfo
        {
          let baseURI = data.baseURI || data.URL;
          let found = await browser.tabs.query({ url: baseURI });
          if (found.length) {
            let tab = found[0]; // first result
            await browser.tabs.update(tab.id, { active: true, url: data.URL });
            return;
          }
          browser.tabs.create({ active: true, url: data.URL });
        }
        break;

      case "openBrowserLink": 
        messenger.windows.openDefaultBrowser(data.url);
        break;
    }
  }
  
  // background listener
  messenger.NotifyTools.onNotifyBackground.addListener((data) => {
    messenger.LegacyPrefs.getPref(legacyPrefPath("debug.notifications")).then(
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
    // Future Work: command handler for tbkeys-lite!
    switch (data.command) {
      case "shortcut":
        console.log("QuickFolders: Received shortcut:", { data , sender });
        break;
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
    } else {
      if (isDebugLicenser) console.log("QF license state after adding account:", currentLicense.info)
    }
  });

  function getOptionsPageURL() {
    const optionsPageURL = browser.runtime.getURL("html/options.html");
    return optionsPageURL;
  }
  function onOptionsTabActivated() {
    // tell experiment to make QuickFolders toolbar visible
    if (isDebug) console.log("QuickFolders Options tab is displayed. Sending message to experimental code...");
    messenger.Utilities.displayMainToolbar(true, true);
  }

  messenger.tabs.onActivated.addListener(async (activeInfo) => {
    if (isDebug) console.log(activeInfo);
    const theTab = await messenger.tabs.get(activeInfo.tabId);
    if (!theTab?.url) return;
    if (theTab.url.startsWith(getOptionsPageURL())) {
      onOptionsTabActivated();
    } 
  });

  const checkTabStatus = async (tabId) => {
    return new Promise((resolve) => {
      let hasValidURL = false;
      let hasCompleted = false;

      const listener = async (updatedTabId, changeInfo, tab) => {
        if (updatedTabId !== tabId) return;

        // Reload tab details
        const updatedTab = await messenger.tabs.get(tabId);

        if (changeInfo.url) {
          if (isDebug) console.log(`🔄 Tab URL changed: ${updatedTab.url}`);
          if (updatedTab.url.startsWith(getOptionsPageURL())) {
            hasValidURL = true;
          }
        }

        if (changeInfo.status === "complete") {
          if (isDebug) console.log(`✅ Tab status changed to complete`);
          hasCompleted = true;
        }

        // Resolve only when both conditions are met
        if (hasValidURL && hasCompleted) {
          if (isDebug) console.log(`🎯 Resolving promise for Tab ${tabId}: ${updatedTab.url}`);
          messenger.tabs.onUpdated.removeListener(listener);
          resolve(updatedTab.url); // return the full URL
        }
      };

      messenger.tabs.onUpdated.addListener(listener);
    });
  };



  messenger.tabs.onCreated.addListener(async (activeTab) => {
    try {
      if (isDebug) console.log("onCreated() - Initial tab:", activeTab);

      // Wait for the URL to be set and tab to complete loading
      const finalUrl = await checkTabStatus(activeTab.id);
      if (isDebug) console.log(`Tab fully loaded with URL: ${finalUrl}`);

      if (finalUrl.startsWith(getOptionsPageURL())) {
        // [issue 557] this can also be triggered by the dialog!! causing toolbar to show in preview mode
        // so it may affect the main window on the mail tab which we don't want...
        onOptionsTabActivated();
      }
    } catch (error) {
      console.error("Error in tabs.onCreated listener:", error);
    }
  });  

  if (isDebug) {
    console.log ("QuickFolders: add toggle-foldertree command... ");
  }

  let toggleFolderLabel = messenger.i18n.getMessage("commands.toggleFolderTree");
  await messenger.commands.update({name:"toggle-foldertree", description: toggleFolderLabel });   

  messenger.commands.onCommand.addListener((command) => {
    if (isDebug) { console.log("command listener received", command); }
    switch (command) {
      case "toggle-foldertree":
        messenger.NotifyTools.notifyExperiment({event: "toggleFolderTree"});
        break;
      case "focus-foldersbox":
        messenger.NotifyTools.notifyExperiment({event: "focusFoldersBox"});
        break;
      }
  });

  messenger.browserAction.onClicked.addListener((tab, info) => {
    console.log("browserAction.click!");
    messenger.Utilities.toggleToolbarAction(false);
  });

    

} // main

main();


