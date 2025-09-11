"use strict";
/* BEGIN LICENSE BLOCK

QuickFolders is released under the Creative Commons (CC BY-ND 4.0)
Attribution-NoDerivatives 4.0 International (CC BY-ND 4.0) 
For details, please refer to license.txt in the root folder of this extension

END LICENSE BLOCK */



// add event listeners for tabs
const activateTab = (event) => {
  const tabSheets = document.querySelectorAll(".tabcontent-container section"),
        tabs = document.querySelectorAll("#QuickFolders-Options-Tabbox button");
  let btn = event.target;
  Array.from(tabSheets).forEach(tabSheet => {
    tabSheet.classList.remove("active");
  });
  Array.from(tabs).forEach(button => {
    button.classList.remove("active");
    button.parentElement.removeAttribute("aria-selected");
  });
  

  const { target: { value: activeTabSheetId = "" } } = event;
  if (activeTabSheetId) {
    document.getElementById(activeTabSheetId).classList.add("active");
    btn.classList.add("active");
    btn.parentElement.setAttribute("aria-selected", true); // li
    // store last selected tab
    browser.LegacyPrefs.setPref(
      "extensions.quickfolders.lastSelectedOptionsTab",
      btn.getAttribute("tabId")
    );
  }
}

const LEGACY_SETTINGS_ROOT = "extensions.quickfolders.";
function legacyPrefPath(setting) {
  return LEGACY_SETTINGS_ROOT + setting;
}

/**
 * Add a handler for communication with other parts of the extension,
 * like our messageDisplayScript.
 *
 * 👉 There should be only one handler in the background script
 *    for all incoming messages
 *    
 * 👉 Handle the received message by filtering for a distinct property and select
 *    the appropriate handler
 */
browser.runtime.onMessage.addListener((message, sender, _sendResponse) => {
  // eslint-disable-next-line no-prototype-builtins
  if (message && message.hasOwnProperty("activatePrefsPage")) {
    // If we have a command, return a promise from the command handler.
    return doHandleCommand(message, sender);
  }
  return false;
});

const doHandleCommand = async (message, sender) => {
  const { activatePrefsPage } = message; // destructuring a property of the message
  /*
  const {
    tab: { id: tabId },
  } = sender;
  */

  console.log("activatePrefsPage", {activatePrefsPage, message, sender} );

  // select the correct page - use mode!!
  preselectTab(activatePrefsPage);
}

function sanitizeCSS(el) {
  try {
    let val = el.value;
    let colon = val.indexOf(':');
    if (colon>=0) {val = val.substr(colon+1);}
    let semicolon = val.indexOf(';');
    if (semicolon>0) {val = val.substr(0,semicolon);}
    val = val.trim ? val.trim() : val;
    return val;
    // this.updateCSSpreview();
  } catch (ex) {
    // may be forbidden by CSS:
    console.warn("sanitizeCSS", ex);
    return el.value; // return original value
  }
}


var licenseInfo;
async function initLicenseInfo() {
  licenseInfo = await messenger.runtime.sendMessage({command:"getLicenseInfo"});
  const licenseTxt = document.getElementById("txtLicenseKey");
  licenseTxt.value = licenseInfo.licenseKey;
  QuickFolders.Options.updateAriaLicenseLabel(licenseTxt);
  
  if (licenseInfo.licenseKey) {
    await validateLicenseInOptions(true);
    QuickFolders.Options.initStandardFeatureLabels(licenseInfo.isValid); // any license key.
  } else {
    // add the [pro] icon to features that are restricted
    QuickFolders.Options.enableProFeatureLabels(false);
    QuickFolders.Options.initStandardFeatureLabels(false);
  }
  
  // add an event listener for changes:
  // window.addEventListener("QuickFolders.BackgroundUpdate", validateLicenseInOptions);
  
  messenger.runtime.onMessage.addListener (
    (data, _sender) => {
      if (data.msg=="updatedLicense") {
        licenseInfo = data.licenseInfo;
        QuickFolders.Options.updateLicenseOptionsUI(false); // we may have to switch off silent if we cause this
        configureBuyButton();
        return Promise.resolve(true); // returns a promise of "undefined"
      }
    }
  );
}


for (let button of document.querySelectorAll("#QuickFolders-Options-Tabbox button")) {
  button.addEventListener("click", activateTab);
}


for (let colorpicker of document.querySelectorAll("input[type=color]")) {
  if (colorpicker.id == "currentfolder-icons-colorpicker") {
    colorpicker.addEventListener("input", async (event) => { 
      // change color in prefs in real time.
      await messenger.LegacyPrefs.setPref("extensions.quickfolders.currentFolderBar.iconcolor", event.target.value);
      QuickFolders.Options.updateNavigationBar();
    });
    continue;
  }
  
  let {name, style, label} = QuickFolders.Options.getColorPickerVars(colorpicker.id);
  if (!name) {
    if (colorpicker.id == "inactive-colorpicker") {
      colorpicker.addEventListener("input", function() { 
        QuickFolders.Options.colorPickerTranslucent.call(QuickFolders.Options, colorpicker);
      } );
    }
    continue;
  }

  colorpicker.addEventListener("input", function() { // was "input"
    QuickFolders.Options.styleUpdate(
      name,
      style,
      colorpicker.value,
      colorpicker.getAttribute("previewLabel") || colorpicker.getAttribute("aria-labelledby")
    );
  } );
}

// all dropdowns that end with "paletteType"
for (let palettepicker of document.querySelectorAll("select[data-pref-name$=paletteType]")) {
  let buttonState;
  // common window update
  switch (palettepicker.id) {
    case "menuStandardPalette":
      buttonState = "standard";
      palettepicker.addEventListener("change", async (event) => {
        await QuickFolders.Options.toggleUsePalette(buttonState, event.target.value, true); //.bind(QuickFolders.Options);
        QuickFolders.Options.showPalettePreview(true);
      });
      break;
    case "menuColoredPalette":
      buttonState = "colored";
      palettepicker.addEventListener("change", async (event) => {
        await QuickFolders.Options.toggleUsePalette(buttonState, event.target.value, true); //.bind(QuickFolders.Options);
        QuickFolders.Options.showPalettePreview(true);
      });
      break;
    case "menuActiveTabPalette":
      buttonState = "active";
      palettepicker.addEventListener("change", async (event) => {
        await QuickFolders.Options.toggleUsePalette(buttonState, event.target.value, true); //.bind(QuickFolders.Options);
        QuickFolders.Options.updateMainWindow();
      });
      break;
    case "menuHoverPalette":
      buttonState = "hovered";
      palettepicker.addEventListener("change", async (event) => {
        await QuickFolders.Options.toggleUsePalette(buttonState, event.target.value, true); //.bind(QuickFolders.Options);
        QuickFolders.Options.updateMainWindow();
      });
      break;
    case "menuDragOverPalette":
      buttonState = "dragOver";
      palettepicker.addEventListener("change", async (event) => {
        await QuickFolders.Options.toggleUsePalette(buttonState, event.target.value, true); //.bind(QuickFolders.Options);
        QuickFolders.Options.updateMainWindow();
      });
      break;
  }
}

for (let el of document.querySelectorAll("input[type=number]")) {
  let id = el.id;
  switch (id) {
    case "button-font-size":
    case "menu-font-size":
    case "buttonMinHeight":
    case "buttonPaddingTop":
    case "QuickFolders-Options-CustomTopRadius":
    case "QuickFolders-Options-CustomBottomRadius":
    case "toolbar-bottom-size":
    case "toolbarMinHeight":
    case "leftSpacer":
    case "rightSpacer":
      el.addEventListener("change", async (event) => {
        event.preventDefault();
        event.stopPropagation();
        QuickFolders.Options.changeTextPreference(el);
        if (id == "leftSpacer" || id == "rightSpacer") {
          QuickFolders.Options.updateNavigationBar();
        }
      });
      break;
  }
}

for (let colPreview of document.querySelectorAll(".qfTabPreview")) {
  let buttonState;
  switch (colPreview.id) {
    case "inactivetabs-label":
      buttonState="standard";
      break;
    case "activetabs-label":
      buttonState="active";
      break;
    case "hoveredtabs-label":
      buttonState="hovered";
      break;
    case "dragovertabs-label":
      buttonState="dragOver";
      break;
    default:
      continue;
  }
  if (buttonState) {
    colPreview.addEventListener("click", () => {QuickFolders.Options.showPalette(colPreview, buttonState)});
  }
}

document.getElementById("QuickFolders-Options-PalettePopup").addEventListener("click", 
  (event) => { QuickFolders.Options.selectColorFromPalette(event); }
);

document.getElementById("QuickFolders-Options-layout").addEventListener("click", 
  () => {QuickFolders.Interface.hidePalette()}
);


let currentFolderBackground = document.getElementById("QuickFolders-CurrentFolder-Background-Select");
currentFolderBackground.addEventListener("change", async (event) => {
  QuickFolders.Options.setCurrentToolbarBackground(event.target.value, true);
});

// striped / filled radio toggles      
let rb1 = document.getElementById("ExampleStripedColor");
rb1.addEventListener("change", async (event) => {
  QuickFolders.Options.setColoredTabStyleFromRadioGroup(event.target, true);
});
let rb2 = document.getElementById("ExampleFilledColor");
rb2.addEventListener("change", async (event) => {
  QuickFolders.Options.setColoredTabStyleFromRadioGroup(event.target, true);
});

document.getElementById("quickMoveAdvanced").addEventListener("click", async () => {
  QuickFolders.Options.quickMoveAdvancedSettings();
});

let icSize = document.getElementById("customIconSize");
icSize.addEventListener("change", async () => {
  messenger.runtime.sendMessage({ command:"updateUserStyles" });
});

/* CSP violation in Tb 125.0b5 */
let customBackground = document.getElementById("currentFolderBackground");
customBackground.addEventListener("blur", async () => {
  customBackground.value = sanitizeCSS(customBackground);
});


// add bool preference reactions
for (let chk of document.querySelectorAll("input[type=checkbox]")) {
  if (chk.classList.contains("manual")) {
    continue; // checkboxes without data binding
  }
  let dataPref = chk.getAttribute("data-pref-name").replace("extensions.quickfolders.","");
  switch (dataPref) {
    case "showShortcutNumber":
    case "showUnreadFoldersBold":
    case "showFoldersWithMessagesItalic":
    case "showFoldersWithNewMailItalic":
    case "showNewMailHighlight":
    case "showNewMailHighlight.outline":
    case "showUnreadOnButtons":
    case "showTotalNumber":
    case "showCountInSubFolders":
    case "autoFocusPreview":
    case "showSubfolders":
    case "enableMenuAlphaSorting":
    case "toolbar.hideInSingleMessage":
    case "showToolIcon":
    case "showQuickMove":
    case "bookmarks.showButton":
    case "showRecentTab":
    case "currentFolderBar.showFindRelated":
    case "currentFolderBar.showRecentButton":
    case "currentFolderBar.navigation.showButtons":
    case "currentFolderBar.folderNavigation.showButtons":
    case "currentFolderBar.showFolderMenuButton":
    case "currentFolderBar.showRepairFolderButton":
    case "currentFolderBar.showIconButtons":
    case "currentFolderBar.showFilterButton":
    case "currentFolderBar.showClose":
    case "showQuickfoldersLabel":
    case "collapseCategories":
    case "style.transitions":
    case "showIcons":
    case "style.corners.customizedRadius":
    case "toolbar.largeIcons":
    case "premium.categories.multiSelect":
      chk.addEventListener("change", () => {
        QuickFolders.Options.toggleBoolPreference(chk);
      });
      break;
    case "currentFolderBar.skipUnreadFolder":
    case "currentFolderBar.iconcolor.custom": // fall-through
    case "currentFolderBar.background.lightweight":
      chk.addEventListener("change", async () => {
        await QuickFolders.Options.toggleBoolPreference(chk, false);
        QuickFolders.Options.updateNavigationBar();
      });
      break;
    case "restoreConfig.tabs":
    case "restoreConfig.general":
    case "restoreConfig.layout":
      chk.addEventListener("change", async () => {
        await QuickFolders.Options.toggleBoolPreference(chk, true);
      });
      break;
    case "showCurrentFolderToolbar":
      chk.addEventListener("change", () => {
        QuickFolders.Options.toggleNavigationBars(chk,"");
      });
      break;
    case "showCurrentFolderToolbar.singleMailTab":
      chk.addEventListener("change", () => {
        QuickFolders.Options.toggleNavigationBars(chk,"singleMailTab");
      });
      break;
    case "showCurrentFolderToolbar.messageWindow":
      chk.addEventListener("change", () => {
        QuickFolders.Options.toggleNavigationBars(chk,"messageWindow");
      });
      break;
    case "transparentToolbar":
      chk.addEventListener("change", () => {
        QuickFolders.Options.toggleColorTranslucent(chk,"toolbar-colorpicker", "qf-StandardColors", null);
      });      
      break;
    case "transparentButtons":
      chk.addEventListener("change", () => {
        QuickFolders.Options.toggleColorTranslucent(chk,"inactive-colorpicker", "inactivetabs-label", "InactiveTab");
      });      
      break;
    case "buttonShadows":
      chk.addEventListener("change", () => {
        QuickFolders.Options.showButtonShadow(chk);
      });      
      break;
  }
  /* RIGHTCLICK HANDLERS */
  // right-click show details from about:config
  let filterConfig="", retVal=null;
  switch(dataPref) {
    case "showRecentTab":
      filterConfig="quickfolders.recentfolders"; retVal=false;
      break;
    case "currentFolderBar.showRecentButton":
      filterConfig="extensions.quickfolders.recentfolders"; retVal=false;
      break;
    case "currentFolderBar.navigation.showButtons":
      filterConfig="quickfolders.currentFolderBar.navigation";
      break;
    case "currentFolderBar.folderNavigation.showButtons":
      // filterConfig="quickfolders.currentFolderBar.navigation";
      break;
    case "showQuickfoldersLabel":
      filterConfig="extensions.quickfolders.textQuickfoldersLabel"; retVal=false;
      break;
    case "debug":
      // + options.toggleBoolPreference(chk,true); beforehand!
      filterConfig="quickfolders.debug"; retVal=false;
      break;
    case "toolbar.hideInSingleMessage":
      filterConfig="quickfolders.toolbar"; retVal=true;
      break;
    case "showQuickMove":
      filterConfig="quickfolders.premium.findFolder.max"; retVal=false;
      break;
    case "bookmarks.showButton":
      filterConfig="quickfolders.bookmarks"; retVal=false;
      break;
    case "folderMenu.dragToNew":
      filterConfig="extensions.quickfolders.dragToCreateFolder"; retVal=false;
      break;
    case "quickMove.useHotkey":
      filterConfig="quickfolders.quickMove"; retVal=false;
      break;
    case "currentFolderBar.showFindRelated":
      filterConfig="quickfolders.findRelated"; retVal=false;
      break;
  }
  if (filterConfig) {
    // add click event to associated config button
    let eventNode = chk.parentNode.parentElement.querySelector(".configSettings");
    let eventType;
    if (eventNode) {
      eventType = "click";
    } else {
      // add right-click event to containing label
      eventNode = chk.parentNode;
      eventType = "contextmenu";
    }
    eventNode.addEventListener(eventType, async(event) =>  {
      event.preventDefault();
      event.stopPropagation();
      // 
      switch(filterConfig) {
        case "quickfolders.findRelated": {
          const btn = document.querySelector("#QuickFolders-Options-Tabbox button[tabId='findRelated']");
          btn.click();
          break;
        }
        default:
          await dispatchAboutConfig(filterConfig, true, true);
      }
      if (null!=retVal) {return retVal;}
    });
  }
}

QuickFolders.Options.configureRelatedTab();

// we cannot transmit the element, so removing the first parameter
async function dispatchAboutConfig(filter, readOnly, updateUI=false) {
  // we put the notification listener into quickfolders-tablistener.js - should only happen in ONE main window!
  // el - cannot be cloned! let's throw it away and get target of the event
  messenger.runtime.sendMessage({ 
    command: "showAboutConfig", 
    filter: filter,
    readOnly: readOnly,
    updateUI: updateUI
  });
}


// command buttons =============

document.getElementById("copyFolders").addEventListener("click", () => {
  QuickFolders.Options.copyFolderEntries();
});

document.getElementById("pasteFolders").addEventListener("click", () => {
  QuickFolders.Options.pasteFolderEntries();
});

document.getElementById("btnSaveConfig").addEventListener("click", async () => {
  // legacy code - needs to go via background 
  let storedObj = {
    general : [],
    advanced: [],
    layout: [],
    userStyle: []
  }
  let isLicense = (licenseInfo.isExpired || licenseInfo.isValidated)
  for (let it of document.querySelectorAll("[data-pref-name]")) {
    let value;
    if (it.tagName == "SELECT") {
      let p = it.getAttribute("preference");
      if (p.includes("PaletteType") || p.includes("folderPathDetail")) { value = parseInt(it.value,10); }
      else { value = it.value; }
    } else { 
      switch(it.type) {
        case "checkbox":
          value = it.checked;
          break;
        case "text": case "color":
          value = it.value;
          break;
        case "number": 
          value = parseInt(it.value,10);
          break;
        case "radio": 
          if (!it.checked) {continue;}
          value = it.value;
          break;
        default: 
          continue;
      }
    }
    
    let node = { key: it.getAttribute("data-pref-name"), val: value, originalId: it.getAttribute("preference") };
    if(node.originalId) {
      switch (node.originalId.substr(0,5)) {
        case 'qfpg-':  // general
          storedObj.general.push(node);
          break;
        case 'qfpa-':  // advanced
          storedObj.advanced.push(node);
          break;
        case 'qfpl-':  // layout
          storedObj.layout.push(node);
          break;
        case 'qfpp-':  // premium - make sure not to import the License without confirmation!
          if (isLicense) {
            storedObj.premium.push(node);
          }
          break;
        default:
          console.log("Not storing - unknown preference ", node);
      }
    }
    else {
      console.log(node);
    }
  }  
  
  let elements = document.querySelectorAll("[type=color]"); //getElementsByTagName('html:input');
  for (let i=0; i<elements.length; i++) {
    let element = elements[i];
    let node = { elementInfo: element.getAttribute("elementInfo"), val: element.value };
    storedObj.userStyle.push(node);
  }  
  
  return await messenger.Utilities.storeConfig(storedObj);  
});
     
document.getElementById("btnLoadConfig").addEventListener("click", async () => {
  // legacy code - moved to experiment api (utilities)
  const config = await messenger.Utilities.loadConfig();  
  if (!config) { return; }
  const colorpickers = Array.from(document.querySelectorAll("input[type=color]"));      
  for (let i=0; i<config.length; i++) {
    const item = config[i];
    // { key: it.getAttribute("data-pref-name"), val: value, originalId: it.getAttribute("preference") }
    if (item.key) {
      await browser.LegacyPrefs.setPref(item.key, item.val);
    }
    else if (item.elementInfo) {
      let colPick = colorpickers.find(e => e.getAttribute("elementInfo") == item.elementInfo);
      if (colPick) {
        colPick.value = item.val;
        let {name, style, label} = QuickFolders.Options.getColorPickerVars(colPick.id);
        QuickFolders.Options.styleUpdate(name, style, item.val, 
          colPick.getAttribute("previewLabel") || colPick.getAttribute("aria-labelledby"));
      }
    }
  }
  await loadPrefs();
  QuickFolders.Options.initPreviewTabStyles();  
});



document.getElementById("btnConfigureTooltips").addEventListener("click", () => {
  // oncommand="options.configureTooltips(this);return true;"
  // this calls:
  // QI.showAboutConfig(btn,           "extensions.quickfolders.tooltips", true, true);
  dispatchAboutConfig("extensions.quickfolders.tooltips", true, true)
  return true;
});

      
     
// other dropdowns
let themeSelector = document.getElementById("QuickFolders-Theme-Selector");
themeSelector.addEventListener("change", async (event) => {
  let themeId = event.target.value;
  QuickFolders.Options.selectTheme(window.document, themeId, true); //.bind(QuickFolders.Options);
  // QuickFolders.Options.updateMainWindow();
});


document.getElementById("quickHelpHeading").addEventListener("focus", function () {
  // Make sure the live region message is announced when the tab is focused
  const notification = document.getElementById("quickHelpNotification");
  // Make the notification visible for screen readers
  notification.style.visibility = "visible";

  setTimeout(function () {
    notification.style.visibility = "hidden"; // Move it off-screen again after the readout
  }, 3000); // Keep it visible for the screen reader to announce
});


async function savePref(event) {
  let target = event.target,
      prefName = target.dataset.prefName; // automatically added from data-pref-name
  
	if (target instanceof HTMLInputElement) {
		if (target.getAttribute("type") === "checkbox") {
			await browser.LegacyPrefs.setPref(prefName, target.checked);
		} else if (target.getAttribute("type") === "text" ||
			target.dataset.prefType === "string") {
			await browser.LegacyPrefs.setPref(prefName, target.value);
		} else if (target.getAttribute("type") === "number") {
			await browser.LegacyPrefs.setPref(prefName, parseInt(target.value, 10));
		} else if (target.getAttribute("type") === "radio" && target.checked) {
      await browser.LegacyPrefs.setPref(prefName, target.value);
    } else if (target.getAttribute("type") === "color") {
      await browser.LegacyPrefs.setPref(prefName, target.value);
    } else {
			console.error("Received change event for input element with unexpected type", event);
		}
	} else if (target instanceof HTMLSelectElement) {
		if (target.dataset.prefType === "string") {
			await browser.LegacyPrefs.setPref(prefName, target.value);
		} 
    else {
      let v = isNaN(target.value) ? target.value : parseInt(target.value, 10);
			await browser.LegacyPrefs.setPref(prefName, v);
		}
	} else if (target instanceof HTMLTextAreaElement) {
    await browser.LegacyPrefs.setPref(prefName, target.value);
  } else {
    console.error("Received change event for unexpected element", event);
  }  
}



async function loadPrefs() {
  QuickFolders.Util.logDebug("loadPrefs() ...");
  // use LegacyPrefs
	const prefElements = Array.from(document.querySelectorAll("[data-pref-name]"));
	for (let element of prefElements) {
		let prefName = element.dataset.prefName;
		if (!prefName) {
			console.error("Preference element has unexpected data-pref attribute", element);
			continue;
		}
		if (element instanceof HTMLInputElement) {
      if (element.getAttribute("type") === "checkbox") {
        element.checked = await browser.LegacyPrefs.getPref(prefName);
        if (element.checked != await browser.LegacyPrefs.getPref(prefName)) {
          // eslint-disable-next-line no-debugger
          debugger; 
        }
      } 
      else if (element.getAttribute("type") === "text" ||
        element.dataset.prefType === "string"
      ) {
        element.value = await browser.LegacyPrefs.getPref(prefName);
      } 
      else if (element.getAttribute("type") === "number") {
        element.value = (await browser.LegacyPrefs.getPref(prefName)).toString();
      } 
      else if (element.getAttribute("type") === "radio") {
        let radioVal = (await browser.LegacyPrefs.getPref(prefName)).toString();
        if (element.value === radioVal) {
          element.checked = true;
        }
      }
      else if (element.getAttribute("type") === "color") {
        element.value = await browser.LegacyPrefs.getPref(prefName);
      }    
      else {
        console.error("Input element has unexpected type", element);
      }
		} 
    else if (element instanceof HTMLSelectElement) {
			if (element.dataset.prefType === "string") {
				element.value = await browser.LegacyPrefs.getPref(prefName);
			} else {
				element.value = (await browser.LegacyPrefs.getPref(prefName)).toString();
			}
		} else if (element instanceof HTMLTextAreaElement) {
      element.value = await browser.LegacyPrefs.getPref(prefName);
    }
    else {
			console.error("Unexpected preference element", element);
		}
    
    // Wire up individual event handlers
    element.addEventListener("change", savePref);
    
	}  
}

// preselect the correct tab.
// force a mode "helpOnly" "supportOnly" "licenseKey"
// change selectedTab from numeral to string!!
async function preselectTab(mode=null) {
  let selectOptionsPane = await browser.LegacyPrefs.getPref("extensions.quickfolders.lastSelectedOptionsTab") || "",
      selectedTabElement = document.getElementById("QuickFolders-General"); //default = first tab
  let optionParams = new URLSearchParams(document.location.search);
  let selTab = optionParams ? optionParams.get("selectedTab") : ""; 
  if (!mode) {
    mode = optionParams ? optionParams.get("mode") : "";
  }
  if (null!=selTab && selTab != "" && selTab != "-1") {
    selectOptionsPane = selTab;
  }
  switch (mode) {
    case "helpOnly":
      selectOptionsPane = "help";
      break;
    case "supportOnly":
      selectOptionsPane = "support";
      break;
    case "licenseKey":
      selectOptionsPane = "license";
      break;
    default:
      if (mode) {
        console.log(`preselectTab() unknown mode: {mode}`)
      }
  }
  // select the tab:
  let tabs = document.querySelectorAll("#QuickFolders-Options-Tabbox button");
  Array.from(tabs).forEach(button => {
    if (button.getAttribute("tabId").toString() == selectOptionsPane.toString()) {
      selectedTabElement = button;
    }
  });
  if (!selectedTabElement) {return;}
  
  console.log(`activating tab:`, selectedTabElement);
  let tabEvent = new Event("click");
  selectedTabElement.dispatchEvent(tabEvent);
}

async function initVersionPanel() {
  const manifest = await messenger.runtime.getManifest();
  document.getElementById("qf-options-header-description").value = manifest.version;
}

function configExtra2Button() {
   // to do - OK / Cancel / donate buttons from legacy code QuickFolders.Options 
}

// broken out from validateLicenseInOptions:
async function configureBuyButton() {
  function replaceCssClass(el,addedClass) {
    if (!el) {return;}
    el.classList.add(addedClass);
    if (addedClass!="paid") {el.classList.remove("paid");}
    if (addedClass!="expired")  {el.classList.remove("expired");}
    if (addedClass!="free") {el.classList.remove("free");}
  }

  let wd = window.document,
      getElement = wd.getElementById.bind(wd),
      btnLicense = getElement("btnLicense"),
      proTab = getElement("QuickFolders-Pro");
  let result = licenseInfo.status;
  
  switch(result) {
    case "Valid": {
      let today = new Date(),
          later = new Date(today.setDate(today.getDate()+30)), // pretend it's a month later:
          dateString = later.toISOString().substr(0, 10),
          forceExtend = await messenger.LegacyPrefs.getPref("debug.premium.forceShowExtend");
      // if we were a month ahead would this be expired?
      if (licenseInfo.expiryDate < dateString || forceExtend) {
        QuickFolders.Options.labelLicenseBtn(btnLicense, "extend");
      } else {
        if (licenseInfo.keyType==2) { // standard license
          btnLicense.classList.add("upgrade"); // removes "pulsing" animation
          btnLicense.setAttribute("collapsed",false);
          QuickFolders.Options.labelLicenseBtn(btnLicense, "upgrade");
        } else {
          btnLicense.setAttribute("collapsed",true);
        }
      }
      replaceCssClass(proTab, "paid");
      replaceCssClass(btnLicense, "paid");
      break;
    }
    case "Expired":
      QuickFolders.Options.labelLicenseBtn(btnLicense, "renew");
      replaceCssClass(proTab, "expired");
      replaceCssClass(btnLicense, "expired");
      btnLicense.setAttribute("collapsed",false);
      break;
    default:
      QuickFolders.Options.labelLicenseBtn(btnLicense, "buy");
      btnLicense.setAttribute("collapsed",false);
      replaceCssClass(btnLicense, "register");
      replaceCssClass(proTab, "free");
  }
}



async function validateLicenseInOptions(evt = false) {
  let silent = (typeof evt === "object") ? false : evt; // will be an event when called from background script!
      
  // old call to decryptLicense was here
  // 1 - sanitize License
  // 2 - validate license
  // 3 - update options ui with reaction messages; make expiry date visible or hide!; 
  QuickFolders.Options.updateLicenseOptionsUI(silent); // async!
  
  // this the updating the first button on the toolbar via the main instance
  // we use the quickfolders label to show if License needs renewal!
  // use notify tools for updating the [QuickFolders] label 
  messenger.runtime.sendMessage({ command:"updateQuickFoldersLabel" });
  
  // 4 - update buy / extend button or hide it.
  configureBuyButton();
  
  configExtra2Button();
  // util.logDebug("validateLicense - result = " + result);
} 

async function initButtons() {
  QuickFolders.Util.logDebug("initButtons...");
  // License Tab
  document.getElementById("btnValidateLicense").addEventListener("click", QuickFolders.Options.validateNewKey);
  document.getElementById("btnPasteLicense").addEventListener("click", QuickFolders.Options.pasteLicense);
  
  // Support Tab
  document.getElementById("L1").addEventListener("click", function () {
    // messenger.windows.openDefaultBrowser("https://www.youtube.com/channel/UCCiqw9IULdRxig5e-fcPo6A");
    messenger.windows.openDefaultBrowser("https://www.youtube.com/playlist?list=PLApv7QYQO9nR_ySMlAYd_wlhei-MRND89");
  }); // YouTube
  document.getElementById("L2").addEventListener("click", function () {
    messenger.windows.openDefaultBrowser("https://github.com/RealRaven2000/QuickFolders/issues");
  }); // report bugs
  document.getElementById("L3").addEventListener("click", function () {
    messenger.Utilities.showVersionHistory();
    window.close();
  }); // version history
  document.getElementById("L4").addEventListener("click", function () {
    messenger.windows.openDefaultBrowser("https://github.com/RealRaven2000/QuickFolders/tree/ESR91/_locales");
  }); // localization
  document.getElementById("L5").addEventListener("click", function () {
    QuickFolders.Options.sendMail();
  }); // contact me
  
  // oncommand="setTimeout(function() { QuickFolders.Interface.showLicenseDialog("options_" + options.currentOptionsTab); window.close(); });">Buy License</button>
  document.getElementById("btnLicense").addEventListener("click", () => { QuickFolders.Interface.showLicenseDialog(); });
  document.getElementById("btnDefaultRadius").addEventListener("click", () => { QuickFolders.Options.setDefaultButtonRadius(); });
  document.getElementById("defaultColors").addEventListener("click", () => { QuickFolders.Options.setDefaultColors(); });
  document.getElementById("qf-options-header-description").addEventListener("click", () => { 
    messenger.Utilities.showVersionHistory();
    window.close(); 
  });
  document.getElementById("qf-options-icon").addEventListener("click", () => { QuickFolders.Options.collapseHead(); });
  document.getElementById("qf-youtube").addEventListener("click", () => {
    messenger.windows.openDefaultBrowser("https://www.youtube.com/channel/UCCiqw9IULdRxig5e-fcPo6A");
  });
  document.getElementById("applyCurrentBackground").addEventListener("click", () => { 
    QuickFolders.Options.setCurrentToolbarBackgroundCustom(); 
  });
  document.getElementById("minHeightFix").addEventListener("click", (event) => { 
    // [issue 372] numeral textbox event bubbled up?
    if (event.target.tagName=="INPUT" || event.target.id=="toolbarMinHeight") {return;}
    QuickFolders.Util.logDebug("minHeightFix event", event);
    QuickFolders.Util.openLinkInTab("https://quickfolders.org/bugzilla/bugs/show_bug.cgi@id=25021"); 
  });
  document.getElementById("L0").addEventListener("click", () => { 
    QuickFolders.Util.openLinkInTab("https://quickfolders.org/"); 
    window.close(); 
  });
  
  document.getElementById("tbkeys").addEventListener("click", () => { 
    QuickFolders.Util.openLinkInTab("https://github.com/RealRaven2000/QuickFolders/issues/387#issuecomment-2029756995"); 
    window.close(); 
  });  

  document.querySelector(".findRelatedSite").addEventListener("click", () => {
    QuickFolders.Util.openLinkInTab("https://quickfolders.org/premium.html#findRelated");
  });

  document.querySelector(".editRegex").addEventListener("click", async() => {
    const editBox = document.getElementById("findRelatedPattern");

    let searchValue = editBox.value, // allow overwriting in debugger for test!
      searchFlags = "", 
      flagsParam = "";

    if (searchValue.charAt(0) == "/") {
      let endIdx = searchValue.lastIndexOf("/");
      if (endIdx) { // must be>0! otherwise 2nd slash is missing!!
        searchValue = editBox.value.substring(1, endIdx);
        searchFlags = editBox.value.substring(endIdx + 1);
      } else {
        QuickFolders.Util.logDebug(`Invalid search string in find Related - missing 2nd '/' : ${searchFlags}`);
        searchFlags = editBox.value.substring(1); // removing beginning '/'
      }
    } 

    const encodedRegex = searchValue ? encodeURIComponent(searchValue) : "enter search pattern";
    if (searchFlags) {
      flagsParam = "&flags=" + encodeURIComponent(searchFlags);
    }

    const targetUrl = `https://regex101.com/?flavor=javascript&regex=${encodedRegex}${flagsParam}`;
    QuickFolders.Util.openLinkInTab(targetUrl);
  });


}

async function initToolbarBackground() {
const colBG = await QuickFolders.Preferences.getStringPref("currentFolderBar.background.selection");
  QuickFolders.Util.logDebug(`initToolbarBackground: setCurrentToolbarBackground(${colBG})...`);
  QuickFolders.Options.setCurrentToolbarBackground(
    colBG, false);  
}



async function initBling() {
  QuickFolders.Util.logDebug("initBling...");
  const getElement = document.getElementById.bind(document),
        wd = window.document,
        util = QuickFolders.Util,
        getUserStyle = QuickFolders.Preferences.getUserStyle.bind(QuickFolders.Preferences);

/*  PREVIOUS METHOD vs NEW METHOD
  let test = await messenger.Utilities.getUserStyle("ActiveTab","color","#ddFFFF"),
      test2 = await getUserStyle("ActiveTab","color","#ddFFFF");
  */
  
  let col = util.getSystemColor(await getUserStyle("ActiveTab","color","#FFFFFF")), 
      bcol = util.getSystemColor(await getUserStyle("ActiveTab","background-color","#000090"));
  getElement("activetab-colorpicker").value = bcol;
  getElement("activetab-fontcolorpicker").value = col;
  getElement("activetabs-label").style.setProperty("color", col, "important");
  getElement("activetabs-label").style.backgroundColor = bcol;
  
  bcol = util.getSystemColor(await getUserStyle("InactiveTab","background-color","buttonface"));
  getElement("inactive-colorpicker").value = bcol;
  
  col = util.getSystemColor(await getUserStyle("InactiveTab","color","buttontext"));
  getElement("inactive-fontcolorpicker").value = col;
  getElement("inactivetabs-label").style.setProperty("color", col, "important");
  
  
  bcol = util.getSystemColor(await getUserStyle("HoveredTab","background-color","#FFFFFF"));
  getElement("hover-colorpicker").value = bcol;
  col = util.getSystemColor(await getUserStyle("HoveredTab","color","Black"));
  getElement("hover-fontcolorpicker").value = col;
  getElement("hoveredtabs-label").style.setProperty("color", col, "important");
  getElement("hoveredtabs-label").style.backgroundColor = bcol;

  bcol = util.getSystemColor(await getUserStyle("DragTab","background-color", "#E93903"));
  getElement("dragover-colorpicker").value = bcol;
  col = util.getSystemColor(await getUserStyle("DragTab","color", "White"));
  getElement("dragover-fontcolorpicker").value = col;
  getElement("dragovertabs-label").style.setProperty("color", col, "important");
  getElement("dragovertabs-label").style.backgroundColor = bcol;
  getElement("toolbar-colorpicker").value = util.getSystemColor(await getUserStyle("Toolbar","background-color", "White"));
  
  document.querySelector(".showIconButton").collapsed = !QuickFolders.Preferences.supportsCustomIcon; 
  
  let currentTheme = await QuickFolders.Options.selectTheme(wd, await QuickFolders.Preferences.getCurrentThemeId());

  // initialize Theme Selector by adding original titles to localized versions
  let cbo = getElement("QuickFolders-Theme-Selector"); // HTMLSelectElement
  if (cbo.length) {
    for (let index = 0; index<cbo.itemCount; index++) {
      let item = cbo.options.item( index ),
          theme = QuickFolders.Themes.Theme(item.value);
      if (theme && item.label != theme.name) {
        item.label = theme.name + " - " + item.label;
      }
    }  
  }
  
  
  let menupopup = getElement("QuickFolders-Options-PalettePopup"); // doesn't exist in HTML!! 
  // we need to rewrite this from scratch for the HTML options dialog
  QuickFolders.Interface.buildPaletteMenu(0, menupopup);  
    
  
  // customized coloring support
  QuickFolders.Options.initPreviewTabStyles();
      
  
  let paletteType = await QuickFolders.Preferences.getIntPref("style.InactiveTab.paletteType"),
      disableStriped = !(QuickFolders.Options.stripedSupport(paletteType) || 
                         QuickFolders.Options.stripedSupport(await QuickFolders.Preferences.getIntPref("style.ColoredTab.paletteType")) ||
                         QuickFolders.Options.stripedSupport(await QuickFolders.Preferences.getIntPref("style.InactiveTab.paletteType")));
  
  getElement("qf-individualColors").collapsed = !currentTheme.supportsFeatures.individualColors;
  getElement("qf-individualColors").disabled = disableStriped;
  getElement("ExampleStripedColor").disabled = disableStriped;
  getElement("buttonTransparency").disabled = (paletteType!=0) && disableStriped; // only with "no colors"
  
}


const startup = async () => {
  QuickFolders.Util.logDebug("Options.js - startup()\nCalling i18n.updateDocunent()...");
  
  i18n.updateDocument();

  let supportLabel = document.getElementById("contactLabel"),
      supportString = QuickFolders.Util.getBundleString("qf.description.contactMe", [QuickFolders.Util.ADDON_SUPPORT_MAIL]); // substitution parameter
  supportLabel.textContent = supportString;  

  await loadPrefs();
  preselectTab();
  initVersionPanel();

  try {
    await initLicenseInfo();
  } catch (ex) {
    console.log(ex);
    setTimeout(
      async () => {
        await initLicenseInfo();
        initButtons();
      },
      5000
    );
  } finally {
    initButtons();
    initToolbarBackground();
    initBling();
  }

}

startup();
