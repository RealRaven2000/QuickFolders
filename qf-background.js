import { Preferences } from "./scripts/preferences.js";
import * as util from "./scripts/qf-util.mjs.js";
import { Licenser } from "./scripts/Licenser.mjs.js";
// very nice config editor by John B:
import * as webExtensionStorageEditor from "./scripts/webExtensionStorageEditor.mjs";

// bump this up to current version to create additional QuickFolders NEWS messages
const LATEST_UPDATEMSG = "6.16.1";

const QUICKFILTERS_ADDON_ID = "quickFilters@axelg.com";
const ADDQUICKFOLDER_ID = "addQuickFolderTab";
const TOGGLEICON_ID = "toggleQuickFoldersIcon";
const REMOVEICON_ID = "removeQuickFoldersIcon";
const QUICKFOLDERS_EXTERNAL_COMMANDS = [
  {
    functionName: "listExternalCommands",
    description: "Returns the supported QuickFolders external commands.",
    parameters: [],
  },
  {
    functionName: "setAssistantMode",
    description: "Sets QuickFolders assistant mode active state.",
    parameters: [{ name: "active", description: "Boolean target state for assistant mode." }],
  },
  {
    functionName: "setCurrentFolderFilterButton",
    description: "Sets the current-folder filter button active state.",
    parameters: [{ name: "active", description: "Boolean target state for the filter button." }],
  },
];

var currentLicense;
var startupFinished = false;
var callbacks = [];

// top-level global flag
let _isDebug = false;

// [issue 371] Remove console error “receiving end does not exist”
function logReceptionError(x) {
  if (x.message.includes("Receiving end does not exist.")) {
    // no need to log - quickFilters is not installed or disabled.
  } else {
    console.log(x);
  }
}

async function isDebugOn() {
  return Preferences.isDebug() || false;
}

const ExternalMessageApi = {
  _quickFiltersCapabilities: null,
  async _queryQuickFiltersCapabilities() {
    try {
      const result = await messenger.runtime.sendMessage(QUICKFILTERS_ADDON_ID, {
        command: "listExternalCommands",
      });
      const commands = Array.isArray(result?.commands)
        ? result.commands
            .map((entry) => entry?.functionName)
            .filter((name) => typeof name === "string" && name.trim())
        : [];

      this._quickFiltersCapabilities = {
        ok: true,
        commands,
        timestamp: Date.now(),
      };
      return this._quickFiltersCapabilities;
    } catch {
      this._quickFiltersCapabilities = {
        ok: false,
        commands: [],
        timestamp: Date.now(),
      };
      return this._quickFiltersCapabilities;
    }
  },
  async _hasQuickFiltersCommand(commandName) {
    if (!this._quickFiltersCapabilities) {
      await this._queryQuickFiltersCapabilities();
    }

    if (!this._quickFiltersCapabilities?.ok) {
      return false;
    }

    return this._quickFiltersCapabilities.commands.includes(commandName);
  },
  async sendToQuickFilters(command, payload = {}, options = {}) {
    const requireCapability = options?.requireCapability !== false;
    const supported = await this._hasQuickFiltersCommand(command);

    if (!supported) {
      if (this._quickFiltersCapabilities?.ok) {
        console.warn(
          `[QuickFolders] quickFilters does not expose external command "${command}".`,
          this._quickFiltersCapabilities.commands
        );
      }

      if (requireCapability || this._quickFiltersCapabilities?.ok) {
        return {
          ok: false,
          unavailable: true,
          error: `${command} is not supported by quickFilters`,
        };
      }
    }

    try {
      const result = await messenger.runtime.sendMessage(QUICKFILTERS_ADDON_ID, {
        command,
        ...payload,
      });

      if (typeof result === "object" && result) {
        return result;
      }

      return {
        ok: true,
      };
    } catch (ex) {
      return {
        ok: false,
        unavailable: true,
        error: ex?.message || `Failed to call quickFilters command: ${command}`,
      };
    }
  },

  getCatalog() {
    return QUICKFOLDERS_EXTERNAL_COMMANDS;
  },

  getSupportedCommands() {
    return this.getCatalog().map((command) => command.functionName);
  },

  hasCommand(commandName) {
    return this.getSupportedCommands().includes(commandName);
  },

  success(extra = {}) {
    return { ok: true, ...extra };
  },

  unavailable(error, extra = {}) {
    return { ok: false, unavailable: true, error, ...extra };
  },

  error(error, extra = {}) {
    return { ok: false, error, ...extra };
  },

  normalizeCommand(command) {
    if (command === "setCurrentFolderFilterActive") {
      return "setCurrentFolderFilterButton";
    }
    return command;
  },

  async dispatch(message, _sender) {
    const command = this.normalizeCommand(message?.command);
    const debug = await isDebugOn();

    if (debug) {
      console.log("QuickFolders external command received:", {
        command,
        payload: message,
      });
    }

    try {
      switch (command) {
        case "listExternalCommands":
          return this.success({ commands: this.getCatalog() });

        case "queryQuickFoldersLicense":
          return this.success({
            license: {
              status: currentLicense.info.status,
              keyType: currentLicense.info.keyType,
            },
            status: currentLicense.info.status,
            keyType: currentLicense.info.keyType,
          });

        case "setAssistantMode":
          return this.setAssistantMode(message);

        case "setCurrentFolderFilterButton":
          return this.setCurrentFolderFilterButton(message);

        default:
          return this.unavailable(`Unsupported external command: ${message?.command || ""}`);
      }
    } catch (error) {
      return this.error(error?.message || String(error));
    }
  },

  async setAssistantMode(message) {
    const active = message?.active;
    const debug = await isDebugOn();

    if (typeof active !== "boolean") {
      if (debug) {
        console.log("QuickFolders external command validation failed:", {
          command: "setAssistantMode",
          reason: "active must be boolean",
          payload: message,
        });
      }
      return this.error("active must be a boolean");
    }

    const applied = await messenger.NotifyTools.notifyExperiment({
      event: "setAssistantModeFallback",
      active,
    });

    if (!applied || typeof applied !== "object") {
      if (debug) {
        console.log("QuickFolders external command unavailable:", {
          command: "setAssistantMode",
          active,
          reason: "No QuickFolders window listener responded",
        });
      }
      return this.unavailable("QuickFolders interface unavailable.");
    }

    if (debug) {
      console.log("QuickFolders external command applied:", {
        command: "setAssistantMode",
        active,
        response: applied,
      });
    }

    if (applied.ok === false) {
      return applied;
    }

    return this.success({ active, changed: !!applied.changed });
  },

  async setCurrentFolderFilterButton(message) {
    return this._notifyCurrentFolderButton(message?.active);
  },

  async _notifyCurrentFolderButton(active) {
    const debug = await isDebugOn();

    if (typeof active !== "boolean") {
      if (debug) {
        console.log("QuickFolders external command validation failed:", {
          command: "setCurrentFolderFilterButton",
          reason: "active must be boolean",
          payload: { active },
        });
      }
      return this.error("active must be a boolean");
    }

    const applied = await messenger.NotifyTools.notifyExperiment({
      event: "setCurrentFolderFilterButton",
      active,
    });

    if (!applied || typeof applied !== "object") {
      if (debug) {
        console.log("QuickFolders external command unavailable:", {
          command: "setCurrentFolderFilterButton",
          reason: "No QuickFolders window listener responded",
        });
      }
      return this.unavailable("QuickFolders interface unavailable.");
    }

    if (debug) {
      console.log("QuickFolders external command applied:", {
        command: "setCurrentFolderFilterButton",
        active,
        response: applied,
      });
    }

    if (applied.ok === false) {
      return applied;
    }

    return this.success({ active, changed: !!applied.changed });
  },
};

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

    if (part1 > part2) {
      return 1;
    } // v1 > v2
    if (part1 < part2) {
      return -1;
    } // v1 < v2
  }

  return 0; // v1 == v2
}

// eslint-disable-next-line no-unused-vars
function versionGreaterOrEqual(v1, v2) {
  return compareVersions(v1, v2) >= 0;
}

function versionGreater(v1, v2) {
  return compareVersions(v1, v2) > 0;
}

// eslint-disable-next-line no-unused-vars
function versionEqual(v1, v2) {
  return compareVersions(v1, v2) === 0;
}

// special listener to be ready for sending up the firstRun message:
let listenersReadyPromise = new Promise((resolve) => {
  const listenerFunction = (message) => {
    if (message.func === "listenersReady") {
      if (_isDebug) {
        console.log("[QuickFolders] Listeners are ready, resolving the promise...");
      }
      resolve();
      // making sure this is only used once, in case we reinstall multiple times in a session.
      messenger.NotifyTools.onNotifyBackground.removeListener(listenerFunction);
    }
  };

  messenger.NotifyTools.onNotifyBackground.addListener(listenerFunction);
});

messenger.runtime.onInstalled.addListener(async (data) => {
  await prefsReady;
  let { reason, previousVersion, temporary } = data;
  const isDebug = await isDebugOn();
  const manifest = await messenger.runtime.getManifest();

  if (isDebug) {
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
      if (isDebug) {
        console.log("QuickFolders - startup code finished.");
      }
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
        await browser.windows.create({ url, type: "popup", width: 910, height: 750 });
        displayUpdateMessage();
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
            if (isDebug) {
              console.log("QuickFolders License - " + gpdays + " Days left.");
            }
          }
        }

        // Define a Map of silent update rules with wildcards
        const silentUpdateMap = new Map([
          ["6.8.1", ["6.8.*"]], // Silent updates for 6.8.1 to any 6.8.x (e.g., 6.8.2, 6.8.3, etc.)
          ["6.9.1", ["6.9.2"]], // Silent update minor fix for [issue 532]
          ["6.10.1", ["6.10.2", "6.10.3", "6.10.4"]],
          ["6.13", ["6.13.1"]],
          ["6.14.1", ["6.13.2"]],
        ]);

        // Helper function to check if a version matches a pattern
        function versionMatches(version, pattern) {
          const regex = new RegExp(`^${pattern.replace(/\*/g, "\\d+")}$`);
          return regex.test(version);
        }

        // Function to check if an update is silent
        function isSilentUpdate(fromVersion, toVersion) {
          const patterns = silentUpdateMap.get(fromVersion);
          if (!patterns) {
            return false;
          } // No silent updates defined for this `fromVersion`

          // Check if `toVersion` matches any pattern in the list
          return patterns.some((pattern) => versionMatches(toVersion, pattern));
        }

        (async () => {
          try {
            await listenersReadyPromise; // we want to make sure all listeners are set up and ready to receive events.
            // set a flag which will be cleared by clicking the [QuickFolders] button once
            let origVer = data?.previousVersion || "0";
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
              await Preferences.set("hasNews", true);
            }

            messenger.NotifyTools.notifyExperiment({ event: "updateQuickFoldersLabel" });
            if (isDebug) {
              console.log(
                "%cQF notifying experiment: firstRun",
                "background: black; color: yellow;"
              );
            }
            messenger.NotifyTools.notifyExperiment({ event: "firstRun" });
          } catch (error) {
            console.error("Error during QuickFolders onInstalled listener:", error);
          }
        })();
        displayUpdateMessage();
      }
      break;
    // see below
  }

  if (isDebug) {
    console.log("QuickFolders: messenger.runtime.onInstalled finished!");
  }
});

// display splash screen
function showSplash(msg = "") {
  // alternatively display this info in a tab with browser.tabs.create(...)
  let url = browser.runtime.getURL("popup/update.html");
  if (msg) {
    url += "?msg=" + encodeURI(msg);
  }
  let screenH = window.screen.height,
    windowHeight = screenH > 870 ? 870 : screenH;

  browser.windows.create({
    url,
    type: "popup",
    width: 1000,
    height: windowHeight,
    allowScriptsToClose: true,
  });
}

function showInstalled() {
  let url = browser.runtime.getURL("popup/installed.html");
  browser.windows.create({
    url,
    type: "popup",
    width: 910,
    height: 800,
    allowScriptsToClose: true,
  });
}

async function filterMailsRegex(searchOptions, tabId = null) {
  const DEFAULT_BEHAVIOR = {
    isSelectPrevious: Preferences.get("findRelated.behavior.selectPrevious"),
  };

  const group = searchOptions.group; // 0 for full match
  const searchSelected = searchOptions.searchSelected;
  const searchCriteria = searchOptions.searchCriteria; // if fields is null, do not change this!
  let searchValue = searchOptions.pattern, // allow overwriting in debugger for test!
    searchFlags = "";
  const behavior = searchOptions.behavior || DEFAULT_BEHAVIOR;

  if (searchValue.charAt(0) == "/") {
    let endIdx = searchValue.lastIndexOf("/");
    if (endIdx) {
      // must be>0! otherwise 2nd slash is missing!!
      searchValue = searchOptions.pattern.substring(1, endIdx);
      searchFlags = searchOptions.pattern.substring(endIdx + 1);
    } else {
      const isDebug = Preferences.get("debug") || false;
      if (isDebug) {
        console.log(`Invalid search string in find Related - missing 2nd '/' : ${searchFlags}`);
      }
      searchFlags = searchOptions.pattern.substring(1); // removing beginning '/'
    }
  }

  if (!searchFlags) {
    searchFlags = "gm";
  }

  const regex = new RegExp(searchValue, searchFlags);
  let results,
    searchVal = "";

  // context.extension.tabManager.getWrapper(tabInfo).id
  if (!tabId) {
    const currentTab = await messenger.tabs.getCurrent();
    if (!currentTab) {
      return;
    }
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
    await Preferences.set("findRelated.lastSearchVal", searchVal);
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
    // triggers false validation message on ATN
    await browser.mailTabs.setQuickFilter(tabId, { text: searchTextProps });
  } else {
    // triggers false validation message on ATN
    await browser.mailTabs.setQuickFilter({ text: searchTextProps });
  }
  if (behavior.isSelectPrevious) {
    // select currentMessageId then go "up" to the previously received / sent mail
    const options = { color: "white", background: "rgb(80,0,0)" };
    const txt = "filterMailsRegex";
    console.log(
      `QuickFolders %c${txt}`,
      `color: ${options.color}; background: ${options.background}`,
      `TO DO: select previous message from id: ${currentMessageHdrId}`
    );
  }
}

// future function for icon support  [issue 399]
async function addFolderPaneMenu() {
  // replaces code from QuickFolders.Interface.folderPanePopup()
  const isDebug = Preferences.get("debug.tbmenus"),
    txtAddIcon = messenger.i18n.getMessage("qf.foldercontextmenu.quickfolders.customizeIcon"),
    txtRemoveIcon = messenger.i18n.getMessage("qf.foldercontextmenu.quickfolders.removeIcon"),
    isShowIconMenu = !(Preferences.get("accessibility.hideIconMenu"));
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
      // eslint-disable-next-line no-unused-vars
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
  messenger.menus.onShown.addListener(async (info, _tab) => {
    const isShowIconMenus = !(Preferences.get("accessibility.hideIconMenu"));
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
  await messenger.menus.create(addTabProps);
}

async function getFindRelatedStruct() {
  const jsonList = Preferences.get("findRelated.list");
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
      pattern: Preferences.get("findRelated.pattern"),
      group: (Preferences.get("findRelated.group")) || 0,
      searchSelected: Preferences.get("findRelated.searchSelected"), // containing an array of options
      searchCriteria: Preferences.get("findRelated.searchCriteria"), // containing an array of options
    });
    if (isDebugOn()) {
      console.log("getFindRelatedStruct retrieved:", { findRelatedList });
    }
  }
  return findRelatedList;
}

function timeoutPromise(ms, msg) {
  return new Promise((_, reject) => setTimeout(() => reject(new Error(msg)), ms));
}

async function waitForMailTabsReady(timeoutMs = 5000) {
  try {
    await Promise.race([
      browser.mailTabs.getCurrent(),
      timeoutPromise(timeoutMs, "mailTabs.getCurrent() timed out"),
    ]);
  } catch (ex) {
    console.warn("QuickFolders: mailTabs.getCurrent() failed or timed out", ex);
  }
  if (await isDebugOn()) {
    console.log("QuickFolders: ready to start WindowListener.");
  }
}

async function main() {
  await prefsReady;
  const key = Preferences.get("LicenseKey") || "",
    forceSecondaryIdentity =
      (Preferences.get("licenser.forceSecondaryIdentity")) || false,
    isDebug = await isDebugOn(),
    isDebugLicenser =
      (Preferences.get("debug.premium.licenser")) || false;

  currentLicense = new Licenser(key, { forceSecondaryIdentity, debug: isDebugLicenser });
  await currentLicense.validate();

  // All important stuff has been done.
  // resolve all promises on the stack
  if (isDebug) {
    console.log("Finished setting up license startup code");
  }
  callbacks.forEach((callback) => callback());
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
    "pluralForm",
    "readToolbarStatus",
    "storeToolbarStatus",
    "toggleNavigationBars",
    "getLastLoadedTheme",
    "storeLoadedTheme",
    "stageThemeChange",
    "setCachedPref",
    "setCachedPrefSet",
    "setCachedModel",
    "requestPrefCache",
    "openStorageEditor"
  ];


  // message listener - SELECTIVE!
  // every message listener must have its unique set of messages (if it returns something)
  messenger.runtime.onMessage.addListener((data, sender) => {
    if (msg_commands.includes(data?.command)) {
      return notificationHandler(data, sender); // the result of this is a Promise
    }
    // Future Work: command handler for tbkeys-lite!
    switch (data.command) {
      case "shortcut":
        console.log("QuickFolders: Received shortcut:", { data, sender });
        break;
    }
  });

  messenger.runtime.onMessageExternal.addListener(async (message, _sender) => {
    return ExternalMessageApi.dispatch(message, _sender);
  });

  messenger.WindowListener.registerChromeUrl([
    ["content", "quickfolders", "chrome/content/"],
    ["content", "quickfolders-skins", "chrome/content/skin/tb91/"],
  ]);

  messenger.WindowListener.registerWindow(
    "chrome://messenger/content/messenger.xhtml",
    "chrome/content/scripts/qf-messenger.js"
  );
  // inject a separate script for current folder toolbar!
  messenger.WindowListener.registerWindow("about:3pane", "chrome/content/scripts/qf-3pane.js");

  messenger.WindowListener.registerWindow("about:message", "chrome/content/scripts/qf-3pane.js");

  messenger.WindowListener.registerWindow(
    "chrome://messenger/content/messengercompose/messengercompose.xhtml",
    "chrome/content/scripts/qf-composer.js"
  );
  messenger.WindowListener.registerWindow(
    "chrome://messenger/content/SearchDialog.xhtml",
    "chrome/content/scripts/qf-searchDialog.js"
  );
  messenger.WindowListener.registerWindow(
    "chrome://messenger/content/messageWindow.xhtml",
    "chrome/content/scripts/qf-messageWindow.js"
  );

  // make sure session has loaded all tabs.
  // [issue 598] 5000ms default
  const to = Preferences.get("api.mailTabs.timeout");
  // let [mailTab] = await browser.mailTabs.query({}); await browser.mailTabs.get(mailTab.id);
  if (to > 0) {
    if (await isDebug) {
      console.log(`QuickFolders: Waiting ${to}ms for mailTabs to be ready...`);
    }
    await waitForMailTabsReady(to);
  } else {
    // [issue 598] used to get stuck in Bb:
    if (isDebug) {
      console.log("waiting for mailTabs.query()...");
    }
    let [mailTab] = await browser.mailTabs.query({});
    if (isDebug) {
      console.log(`Got [mailTab] retreiving current tab[${mailTab.id}]`);
    }
    await browser.mailTabs.get(mailTab.id);
    if (isDebug) {
      console.log("got tab");
    }
  }

  /*
   * Start listening for opened windows. Whenever a window is opened, the registered
   * JS file is loaded. To prevent namespace collisions, the files are loaded into
   * an object inside the global window. The name of that object can be specified via
   * the parameter of startListening(). This object also contains an extension member.
   */
  messenger.WindowListener.startListening();

  // [issue 296] Exchange account validation (supported since TB98)
  messenger.accounts.onCreated.addListener(async (id, account) => {
    if (currentLicense.info.status == "MailNotConfigured") {
      // redo license validation!
      if (isDebugLicenser) {
        console.log("Account added, redoing license validation", id, account);
      } // test
      currentLicense = new Licenser(key, { forceSecondaryIdentity, debug: isDebugLicenser });
      await currentLicense.validate();
      if (currentLicense.info.status != "MailNotConfigured") {
        if (isDebugLicenser) {
          console.log(
            "notify experiment code of new license status: " + currentLicense.info.status
          );
        }
        messenger.NotifyTools.notifyExperiment({ licenseInfo: currentLicense.info });
        messenger.NotifyTools.notifyExperiment({ event: "updateMainWindow", minimal: false });
      }
      if (isDebugLicenser) {
        console.log("QF license info:", currentLicense.info);
      } // test
    } else {
      if (isDebugLicenser) {
        console.log("QF license state after adding account:", currentLicense.info);
      }
    }
  });

  function getOptionsPageURL() {
    const optionsPageURL = browser.runtime.getURL("html/options.html");
    return optionsPageURL;
  }
  function getExtensionRootURL() {
    const extensionRootURL = browser.runtime.getURL("");
    return extensionRootURL;
  }
  function onOptionsTabActivated() {
    // tell experiment to make QuickFolders toolbar visible
    if (isDebug) {
      console.log("QuickFolders Options tab is displayed. Sending message to experimental code...");
    }
    messenger.Utilities.displayMainToolbar(true, true);
  }

  messenger.tabs.onActivated.addListener(async (activeInfo) => {
    if (isDebug) {
      console.log(activeInfo);
    }
    const theTab = await messenger.tabs.get(activeInfo.tabId);
    if (!theTab?.url) {
      return;
    }
    if (theTab.url.startsWith(getOptionsPageURL())) {
      onOptionsTabActivated();
    }
  });

  const checkTabStatus = async (tabId) => {
    return new Promise((resolve) => {
      let hasValidURL = false;
      let hasCompleted = false;

      const listener = async (updatedTabId, changeInfo, _tab) => {
        if (updatedTabId !== tabId) {
          return;
        }

        // Reload tab details
        const updatedTab = await messenger.tabs.get(tabId);
        const isRelevant = changeInfo?.url
          ? changeInfo.url.startsWith(getExtensionRootURL())
          : false;

        if (changeInfo.url) {
          if (!isRelevant) {
            return;
          }
          if (isDebug) {
            console.log(`🔄 Tab URL changed: ${updatedTab.url}`);
          }
          if (updatedTab.url.startsWith(getOptionsPageURL())) {
            hasValidURL = true;
          }
        }

        if (changeInfo.status === "complete") {
          if (isDebug && isRelevant) {
            console.log(`✅ Tab status changed to complete`);
          }
          hasCompleted = true;
        }

        // Resolve only when both conditions are met
        if (hasValidURL && hasCompleted) {
          if (isDebug) {
            console.log(`🎯 Resolving promise for Tab ${tabId}: ${updatedTab.url}`);
          }
          messenger.tabs.onUpdated.removeListener(listener);
          resolve(updatedTab.url); // return the full URL
        }
      };

      messenger.tabs.onUpdated.addListener(listener);
    });
  };

  messenger.tabs.onCreated.addListener(async (activeTab) => {
    try {
      if (isDebug) {
        console.log("onCreated() - Initial tab:", activeTab);
      }

      // Wait for the URL to be set and tab to complete loading
      const finalUrl = await checkTabStatus(activeTab.id);
      if (isDebug) {
        console.log(`Tab fully loaded with URL: ${finalUrl}`);
      }

      if (finalUrl.startsWith(getOptionsPageURL())) {
        // [issue 557] this can also be triggered by the dialog!! causing toolbar to show in preview mode
        // so it may affect the main window on the mail tab which we don't want...
        const windows = await browser.windows.getAll();
        const activeWin = windows.find((e) => e.id == activeTab.windowId);
        if (activeWin && activeWin.type == "popup") {
          return;
        }
        onOptionsTabActivated();
      }
    } catch (error) {
      console.error("Error in tabs.onCreated listener:", error);
    }
  });

  if (isDebug) {
    console.log("QuickFolders: add toggle-foldertree command... ");
  }

  let toggleFolderLabel = messenger.i18n.getMessage("commands.toggleFolderTree");
  await messenger.commands.update({ name: "toggle-foldertree", description: toggleFolderLabel });

  messenger.commands.onCommand.addListener((command) => {
    if (isDebug) {
      console.log("command listener received", command);
    }
    switch (command) {
      case "toggle-foldertree":
        messenger.NotifyTools.notifyExperiment({ event: "toggleFolderTree" });
        break;
      case "focus-foldersbox":
        messenger.NotifyTools.notifyExperiment({ event: "focusFoldersBox" });
        break;
    }
  });

  messenger.browserAction.onClicked.addListener((_tab, _info) => {
    console.log("browserAction.click!");
    messenger.Utilities.toggleToolbarAction(false);
  });
} // main


async function notificationHandler(data) {
  await prefsReady;
  if (Preferences.isDebug("notifications")) {
    console.log(
      `%cNotification handler of ${browser.runtime.getURL("")}`,
      `color: rgb(248, 190, 103); background: rgb(76, 0, 38)`,
      data
    );
  }
  let command = data.func || data.command;
  switch (command) {
    case "slideAlert":
      util.slideAlert(...data.args);
      break;

    case "splashScreen":
      {
        let splashMessage = data.msg || "";
        showSplash(splashMessage);
      }
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

    case "getQuickFiltersPref": {
      const key = data.key;
      if (typeof key !== "string" || !key.trim()) {
        return { ok: false, error: "key must be a non-empty string" };
      }
      const result = await ExternalMessageApi.sendToQuickFilters("getPref", { key });
      if (typeof result === "boolean") {
        return result;
      }
      if (typeof result?.value === "boolean") {
        return result.value;
      }
      return result;
    }

    case "hasQuickFilters": {
      const result = await ExternalMessageApi._queryQuickFiltersCapabilities();
      return !!result?.ok;
    }

    case "isAssistantActive": {
      const result = await ExternalMessageApi.sendToQuickFilters("isAssistantActive", {});
      if (typeof result === "boolean") {
        return result;
      }
      if (typeof result?.active === "boolean") {
        return result.active;
      }
      if (typeof result?.value === "boolean") {
        return result.value;
      }
      return result;
    }

    case "forwardAssistantMode": {
      return await ExternalMessageApi.sendToQuickFilters(
        "setAssistantMode",
        {
          active: !!data.active,
        },
        { requireCapability: false },
      );
    }

    case "createFilterAsync": {
      const result = await ExternalMessageApi.sendToQuickFilters(
        "createFilter",
        {
          sourceFolderUri: data.sourceFolderUri || null,
          targetFolderUri: data.targetFolderUri || null,
          messageList: Array.isArray(data.messageList) ? data.messageList : [],
          isCopy: !!data.isCopy,
          isSlow: !!data.isSlow,
        },
        { requireCapability: false },
      );
      return result;
    }

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

    case "updateMainWindow":
      {
        // we need to add one parameter (minimal) to pass through!
        let isMinimal = data.minimal || false;
        messenger.NotifyTools.notifyExperiment({
          event: "updateMainWindow",
          detail: { minimal: isMinimal },
        });
      }
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
      {
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
            if (await isDebugOn()) {
              console.log(`Activate preference page: ${data.mode}`);
            }
            await browser.runtime.sendMessage({
              activatePrefsPage: data.mode,
            });
          }
          return;
        }
        if (Preferences.get("optionsInTab")) {
          // await messenger.runtime.openOptionsPage();
          const myuri = browser.runtime.getURL(`html/options.html?${params.toString()}`);
          await browser.tabs.create({
            active: true,
            url: myuri,
          });
          return;
        }
        // open options in a window (old)
        await messenger.windows.create({
          height: 720,
          width: 840,
          type: "panel",
          url: `/html/options.html?${params.toString()}`,
          allowScriptsToClose: true,
        });
      }
      break;

    case "openAdvancedProps":
      {
        let params = new URLSearchParams();
        const x = parseInt(data.x, 10),
          y = parseInt(data.y, 10);
        params.append("folderURI", data.folderURI); // to do: pass folder or url in event
        params.append("x", x);
        params.append("y", y);
        await messenger.windows.create({
          left: x,
          top: y,
          type: "popup",
          allowScriptsToClose: true,
          url: `/html/quickfolders-tab-props.html?${params.toString()}`,
        });
        // focused: true,
      }
      break;

    case "updateLicense": {
      let forceSecondaryIdentity = Preferences.get("licenser.forceSecondaryIdentity"),
        isDebugLicenser = Preferences.get("debug.premium.licenser");

      // we create a new Licenser object for overwriting, this will also ensure that key_type can be changed.
      let newLicense = new Licenser(data.key, { forceSecondaryIdentity, debug: isDebugLicenser });
      await newLicense.validate();
      // Check new license and accept if ok.
      // You may return values here, which will be send back to the caller.
      // return false;

      // Update background license.
      await Preferences.set("LicenseKey", newLicense.info.licenseKey);
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
      // if ( (await messenger.management.getAll()).find(({ id }) => id === QUICKFILTERS_ADDON_ID) ) {
      messenger.runtime
        .sendMessage(QUICKFILTERS_ADDON_ID, {
          command: "updateQuickFoldersLicense",
          license: { status: currentLicense.info.status, keyType: currentLicense.info.keyType },
        })
        .catch(logReceptionError);
      // }
      return true;
    }

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
        const isDbg = await isDebugOn();
        let licenseStatus = currentLicense.info.status,
          licenseType = currentLicense.info.keyType;
        if (isDbg) {
          console.log("[QF background] updateQuickFilters received — sending injectButtonsQFNavigationBar to quickFilters", { licenseStatus, licenseType });
        }
        // require management permission to check if qF is installed
        // if ( (await messenger.management.getAll()).find(({ id }) => id === QUICKFILTERS_ADDON_ID) ) {
        messenger.runtime
          .sendMessage(QUICKFILTERS_ADDON_ID, {
            command: "injectButtonsQFNavigationBar",
            license: { status: licenseStatus, keyType: licenseType },
          })
          .then((result) => {
            if (isDbg) {
              console.log("[QF background] injectButtonsQFNavigationBar response:", result);
            }
          })
          .catch((ex) => {
            if (!ex?.message?.includes("Receiving end does not exist.")) {
              console.warn("[QF background] injectButtonsQFNavigationBar failed:", ex?.message || ex);
            }
          });
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

    case "readCategories": {
      // read category from tabsession
      let cats = await messenger.sessions.getTabValue(data.tabId, "QuickFolders_Categories");
      return cats;
    }

    case "pluralForm": {
      // Bug 1935334 - Remove usage of PluralForm.sys.mjs from Thunderbird code
      const pluralForm = new Intl.PluralRules(navigator.language); // use current locale
      const form = pluralForm.select(data.count); // "one" or "other"
      let forms = data.msg.split(";");
      let str = form === "one" ? forms[0] : forms[1];
      return str;
    }

    case "storeToolbarStatus": // store toolbar visibilities in tabsession
      await messenger.sessions.setTabValue(data.tabId, "QuickFolders_ToolbarStatus", data.status);
      break;

    case "filterMailsRegex":
      {
        // filter based on current mail!
        let regexOption = JSON.parse(data.searchOptions);
        await filterMailsRegex(regexOption, data.tabId);
      }
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
      {
        // https://webextension-api.thunderbird.net/en/stable/tabs.html#query-queryinfo
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

    case "showNewsMessage": {
      // [issue 378]
      const message = data.msg,
        messageIds = data.msgIds,
        mode = data.mode || "standard",
        referenceFeature = data.addonfeatures || null,
        features = data.features || ["ok"]; // minimum: an ok button. make array mutable

      switch (mode) {
        case "standard":
          return showQFmessage(messageIds, features, message, referenceFeature);
        case "news":
          return displayUpdateMessage();
        default:
          return "unknown";
      }
    }
    case "getLastLoadedTheme": {
      const t = messenger.Utilities.getActiveThemeId();
      console.log("QuickFolders: Active Theme ID = " + t);
      return t;
    }
    case "storeLoadedTheme":
      console.log(`QuickFolders: Storing Theme ID = ${data.themeId}`);
      return await messenger.Utilities.commitActiveThemeId(data.themeId);
    case "stageThemeChange":
      console.log(`QuickFolders: Staging Theme Change for ID = ${data.themeId}`);
      return await messenger.Utilities.stageThemeChange(data.themeId);

    // [issue 677] local storage!
    case "setCachedPref":
      await Preferences.set(data.key, data.value);
      return true;
    case "setCachedPrefSet":
      await Preferences.setMultiple(data.prefs);
      return true;
    case "setCachedModel":
      return await Preferences.setModelFolders(data.folders || []);
    case "requestPrefCache":
      // sends cached data back to QuickFolders.Preferences.cache.updateFromBackend(data)
      return {
        prefs: Preferences._data,
        model: {
          folders: [...Preferences._model.folders],
        },
      };
    case "openStorageEditor":
      webExtensionStorageEditor.open({
        storageArea: "local",
        baseFilter: data.filter,
        type: "popup",
        showTopLevelKey: false,
      });
      break;
  }
}

// background listener
function registerNotifyListener() {
  messenger.NotifyTools.onNotifyBackground.addListener((data) => {
    const isLog = Preferences.get("debug.notifications") || false;
    if (isLog && data.func) {
      console.log(
        "=========================\n" +
          "BACKGROUND LISTENER received: " +
          data.func +
          "\n" +
          "========================="
      );
    }

    return notificationHandler(data);
  });
}


registerNotifyListener();
const prefsReady = Preferences.init(); // pending
main();

const MESSAGE_STORAGE_KEY = "QuickFolders_Message_Key";
const showQFmessage = async (messageIds, features, message = "", quickfoldersFeatures = null) => {
  const url = new URL(browser.runtime.getURL("/html/quickfolders-message.html"));
  if (message) {
    // Store message globally
    await browser.storage.local.set({ [MESSAGE_STORAGE_KEY]: message });
    url.searchParams.set("msg_storage", "true");
  }
  if (messageIds) {
    url.searchParams.set("msgId", messageIds);
  }
  if (quickfoldersFeatures) {
    url.searchParams.set(
      "addonfeatures",
      Array.isArray(quickfoldersFeatures) ? quickfoldersFeatures.join(",") : quickfoldersFeatures
    );
  }
  url.searchParams.set("features", features.join(","));

  const createData = {
    type: "popup",
    url: url.toString(),
    allowScriptsToClose: true,
    titlePreface: "",
    width: 900,
    height: 620,
  };

  const winRet = await messenger.windows.create(createData);
  console.log(` new QF Message: Tab = ${winRet.tabs[0].id}`);
  const tabId = winRet.tabs[0].id;
  // set up to wait for a button press. using promises/ ...
  // we need to return "ok" when ok is pushed
  // we need to return "cancel" (provided the feature is requested) when "cancel" button or ESC key is pushed
  return new Promise((resolve) => {
    const listener = (message, sender) => {
      const handler = async () => {
        if (winRet.id) {
          try {
            await messenger.windows.remove(winRet.id);
          } catch {
            // Window already closed, ignore
          }
        }
      };
      if (sender.tab && sender.tab.id === tabId && message.command === "quickfolders-message") {
        browser.runtime.onMessage.removeListener(listener);
        resolve(message.result);
        return handler();
      }
      return false;
    };

    browser.runtime.onMessage.addListener(listener);
  });

};

let retryScheduled = false; // session flag to avoid repeat re-scheduling
const RETRY_MINUTES = 20;
async function displayUpdateMessage() {
  const messageIds = "newsMsgEsr2026",
    licenseInfo = currentLicense?.info,
    isDebug = Preferences.get("debug"),
    hasProLicense = [0, 1].includes(licenseInfo?.keyType); // 0 Pro or none depending on status, 2 std

  const logDebug = (...args) => {
    if (!isDebug) {
      return;
    }
    console.log("QF displayUpdateMessage()\n", ...args);
  };

  let features = ["ok", "licensing", "featurecomp"];

  // reflects last addon version installed with a msg.
  let lastMessage = Preferences.get("extensions.quickfolders.lastUpdateMessage") || "0";
  logDebug(`Last update message version: ${lastMessage}`);

  const isShowSpecialUpdateMsg = compareVersions(lastMessage, LATEST_UPDATEMSG) < 0;

  if (!isShowSpecialUpdateMsg) {
    logDebug(`Message already shown for ${LATEST_UPDATEMSG} – skipping.`);
    return;
  }
  logDebug(`Preparing special upgrade message for version ${LATEST_UPDATEMSG}`);
  // ------
  let licenseMsgId,
    testStatus = licenseInfo?.status;
  switch (testStatus) {
    case "Expired":
      licenseMsgId = hasProLicense ? "newsMsg.license.expired" : "newsMsg.license.standard";
      break;
    case "Valid":
      licenseMsgId = hasProLicense ? "newsMsg.license.valid" : "newsMsg.license.standard";
      if (hasProLicense) {
        // remove unnecessary buttons
        features = features.filter((f) => f != "featurecomp" && f != "licensing");
      }
      break;
    default:
      licenseMsgId = "newsMsg.license.none";
  }
  logDebug(`Message Id: ${licenseMsgId}`);
  const transmitIds = messageIds ? `${messageIds},${licenseMsgId}` : licenseMsgId;
  logDebug(
    "Calling showQFmessage(msgIds, features, msg='', 'displayUpdateMessage')",
    transmitIds,
    features
  );

  try {
    const result = await showQFmessage(transmitIds, features, "", "displayUpdateMessage");
    if (result) {
      const manifest = await messenger.runtime.getManifest();
      const installedVersion = manifest.version.replace(/pre.*/, "").replace(/\.$/, "");
      await Preferences.set(
        "extensions.quickfolders.lastUpdateMessage",
        installedVersion
      );
      logDebug("Message shown successfully – version flag saved.");
    } else {
      logDebug("Message display was cancelled or failed (no result).");
      scheduleRetry(); // try again later
    }
  } catch (ex) {
    console.error("displayUpdateMessage() failed:", ex);
    scheduleRetry();
  }

  function scheduleRetry() {
    if (retryScheduled) {
      return;
    }
    retryScheduled = true;
    logDebug("Scheduling one-time retry in 20 minutes…");
    setTimeout(
      () => {
        displayUpdateMessage().catch((e) =>
          console.error("Retry of displayUpdateMessage() failed:", e)
        );
      },
      RETRY_MINUTES * 60 * 1000
    ); // 20 minutes
  }
}
