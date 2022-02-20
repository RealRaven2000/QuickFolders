

// add event listeners for tabs
const activateTab = (event) => {
  const tabSheets = document.querySelectorAll('.tabcontent-container section'),
        tabs = document.querySelectorAll('#QuickFolders-Options-Tabbox button');
  let btn = event.target;
  Array.from(tabSheets).forEach(tabSheet => {
    tabSheet.classList.remove("active");
  });
  Array.from(tabs).forEach(button => {
    button.classList.remove("active");
  });

  const { target: { value: activeTabSheetId = "" } } = event;
  if (activeTabSheetId) {
    document.getElementById(activeTabSheetId).classList.add("active");
    btn.classList.add("active");
    // store last selected tab
    browser.LegacyPrefs.setPref('extensions.quickfolders.lastSelectedOptionsTab', btn.getAttribute("tabNo"));
  }
}

for (let button of document.querySelectorAll("#QuickFolders-Options-Tabbox button")) {
  button.addEventListener("click", activateTab);
}


for (let colorpicker of document.querySelectorAll("input[type=color]")) {
  let options = QuickFolders.Options,
      elementName, elementStyle, label,
      isStyleUpdate = true;
  function initParams(eN, eS, s, l) {
    elementName=eN, elementStyle=eS, label=l
  }
  switch (colorpicker.id) {
    case "toolbar-colorpicker":
      initParams("Toolbar", "background-color", "qf-StandardColors");
      break;
    case "inactive-fontcolorpicker":
      initParams('InactiveTab','color', 'inactivetabs-label');
      break;
    case "inactive-colorpicker":
        isStyleUpdate = false;
        colorpicker.addEventListener("input", function() { 
          options.colorPickerTranslucent(this).bind(options);
        } );
      break;
    case "activetab-fontcolorpicker":
      initParams('ActiveTab','color', 'activetabs-label');
      break;
    case "activetab-colorpicker":
      initParams('ActiveTab','background-color','activetabs-label');
      break;
    case "hover-fontcolorpicker":
      initParams('HoveredTab','color','hoveredtabs-label');
      break;
    case "hover-colorpicker":
      initParams('HoveredTab','background-color', 'hoveredtabs-label');
      break;
    case "dragover-fontcolorpicker":
      initParams('DragTab', 'color', 'dragovertabs-label');
      break;
    case "dragover-colorpicker":
      initParams('DragTab', 'background-color', 'dragovertabs-label');
      break;
    default:
      isStyleUpdate = false;
  }
  if (isStyleUpdate)
    colorpicker.addEventListener("input", function() { // used to be "oncommand"
      options.styleUpdate(elementName, elementStyle, this.value, colorpicker.getAttribute("previewLabel"));
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
    case "buttonMinHeight":
    case "buttonPaddingTop":
    case "QuickFolders-Options-CustomTopRadius":
    case "QuickFolders-Options-CustomBottomRadius":
    case "toolbar-bottom-size":
    case "toolbarMinHeight":
    case "leftSpacer":
    case "rightSpacer":
      el.addEventListener("change", async (event) => {
        QuickFolders.Options.changeTextPreference(el);
        if (id == "leftSpacer" || id == "rightSpacer")
          QuickFolders.Options.updateNavigationBar();
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
    colPreview.addEventListener("click", (event) => {QuickFolders.Options.showPalette(colPreview, buttonState)});
  }
}

document.getElementById("QuickFolders-Options-PalettePopup").addEventListener("click", 
  (event) => { QuickFolders.Options.selectColorFromPalette(event); }
);

document.getElementById("QuickFolders-Options-layout").addEventListener("click", 
  (event) => {QuickFolders.Interface.hidePalette()}
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

document.getElementById("quickMoveAdvanced").addEventListener("click", async (event) => {
  QuickFolders.Options.quickMoveAdvancedSettings();
});

document.getElementById("applyPosition").addEventListener("click", async (event) => {
  QuickFolders.Options.updateMainWindow(true); // was applyOrdinalPosition()
});


      

// add bool preference reactions
for (let chk of document.querySelectorAll("input[type=checkbox]")) {
  let dataPref = chk.getAttribute("data-pref-name").replace("extensions.quickfolders.","");
  switch (dataPref) {
    case "showShortcutNumber":
    case "showUnreadFoldersBold":
    case "showFoldersWithMessagesItalic":
    case "showFoldersWithNewMailItalic":
    case "showNewMailHighlight":
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
      chk.addEventListener("change", (event) => {
        QuickFolders.Options.toggleBoolPreference(chk);
      });
      break;
    case "currentFolderBar.background.lightweight":
      chk.addEventListener("change", async (event) => {
        await QuickFolders.Options.toggleBoolPreference(chk, false);
        QuickFolders.Options.updateNavigationBar();
      });
      break;
    case "restoreConfig.tabs":
    case "restoreConfig.general":
    case "restoreConfig.layout":
      chk.addEventListener("change", async (event) => {
        await QuickFolders.Options.toggleBoolPreference(chk, true);
      });
      break;
    case "showCurrentFolderToolbar":
      chk.addEventListener("change", (event) => {
        QuickFolders.Options.toggleNavigationBar(chk,"");
      });
      break;
    case "showCurrentFolderToolbar.singleMailTab":
      chk.addEventListener("change", (event) => {
        QuickFolders.Options.toggleNavigationBar(chk,"singleMailTab");
      });
      break;
    case "showCurrentFolderToolbar.messageWindow":
      chk.addEventListener("change", (event) => {
        QuickFolders.Options.toggleNavigationBar(chk,"messageWindow");
      });
      break;
    case "transparentToolbar":
      chk.addEventListener("change", (event) => {
        QuickFolders.Options.toggleColorTranslucent(chk,"toolbar-colorpicker", "qf-StandardColors", null);
      });      
      break;
    case "transparentButtons":
      chk.addEventListener("change", (event) => {
        QuickFolders.Options.toggleColorTranslucent(chk,"inactive-colorpicker", "inactivetabs-label", "InactiveTab");
      });      
      break;
    case "buttonShadows":
      chk.addEventListener("change", (event) => {
        QuickFolders.Options.showButtonShadow(chk);
      });      
      break;
  }
  /* RIGHTCLICK HANDLERS */
  // right-click show details from about:config
  let filterConfig="", readOnly=true, retVal=null;
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
      filterConfig="quickfolders.currentFolderBar.navigation";
      break;
    case "showQuickfoldersLabel":
      filterConfig="extensions.quickfolders.textQuickfoldersLabel"; retVal=false;
      break;
    case "debug":
      // + options.toggleBoolPreference(chk,true); beforehand!
      filterConfig="quickfolders.debug"; retVal=false;
      break;
    case "toolbar.hideInSingleMessage":
      filterConfig="quickfolders.toolbars"; retVal=true;
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
  }
  
  if (filterConfig) {
    // add right-click event to containing label
    chk.parentNode.addEventListener("contextmenu", (event) => {
      dispatchAboutConfig(filterConfig, true, true);
      if (null!=retVal) return retVal;
    });
  }



}

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
// command buttons
document.getElementById("btnSaveConfig").addEventListener("click", (event) => {
  // legacy code - needs to go via background 
  // oncommand="options.storeConfig(Preferences, options.prefMap);" 
  throw("TO DO: options.storeConfig()");
});
     
document.getElementById("btnLoadConfig").addEventListener("click", (event) => {
  // legacy code - needs to go via background 
  // oncommand="options.loadConfig(Preferences);" 
  throw("TO DO: options.loadConfig()");
});



document.getElementById("btnConfigureTooltips").addEventListener("click", (event) => {
  // oncommand="options.configureTooltips(this);return true;"
  // this calls:
  // QI.showAboutConfig(btn,           'extensions.quickfolders.tooltips', true, true);
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


async function savePref(event) {
  let target = event.target,
      prefName = target.dataset.prefName; // automatically added from data-pref-name
  
	if (target instanceof HTMLInputElement) {
		if (target.getAttribute("type") === "checkbox") {
			await browser.LegacyPrefs.setPref(prefName, target.checked);
		} 
    else if (target.getAttribute("type") === "text" ||
			target.dataset.prefType === "string") {
			await browser.LegacyPrefs.setPref(prefName, target.value);
		} 
    else if (target.getAttribute("type") === "number") {
			await browser.LegacyPrefs.setPref(prefName, parseInt(target.value, 10));
		} 
    else if (target.getAttribute("type") === "radio" && target.checked) {
      await browser.LegacyPrefs.setPref(prefName, target.value);
    }    
    else if (target.getAttribute("type") === "color") {
      await browser.LegacyPrefs.setPref(prefName, target.value);
    }    
    else {
			console.error("Received change event for input element with unexpected type", event);
		}
	} 
  else if (target instanceof HTMLSelectElement) {
		if (target.dataset.prefType === "string") {
			await browser.LegacyPrefs.setPref(prefName, target.value);
		} 
    else {
      let v = isNaN(target.value) ? target.value : parseInt(target.value, 10);
			await browser.LegacyPrefs.setPref(prefName, v);
		}
	} 
  else if (element instanceof HTMLTextAreaElement) {
    await browser.LegacyPrefs.setPref(prefName, target.value);
  }  
  else {
		console.error("Received change event for unexpected element", event);
	}  
}



async function loadPrefs() {
  console.log("loadPrefs");
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
async function preselectTab() {
  let selectOptionsPane = await browser.LegacyPrefs.getPref('extensions.quickfolders.lastSelectedOptionsTab'),
      selectedTabElement = document.getElementById("QuickFolders-General"); //default = first tab
    // selectOptionsPane can be overwritten by URL parameter "selectedTab"
  let optionParams = new URLSearchParams(document.location.search);
  let selTab = optionParams ? optionParams.get("selectedTab") : "";
  if (null!=selTab && selTab != "" && selTab != "-1") {
    selectOptionsPane = selTab;
  }
  // select the tab:
  let tabs = document.querySelectorAll('#QuickFolders-Options-Tabbox button');
  Array.from(tabs).forEach(button => {
    if (button.getAttribute("tabNo").toString() == selectOptionsPane.toString()) {
      selectedTabElement = button;
    }
  });
  
  let tabEvent = new Event("click");
  selectedTabElement.dispatchEvent(tabEvent);
}

async function initVersionPanel() {
  const manifest = await messenger.runtime.getManifest();
  document.getElementById("qf-options-header-description").value = manifest.version;
}

let licenseInfo;
async function initLicenseInfo() {
  licenseInfo = await messenger.runtime.sendMessage({command:"getLicenseInfo"});
  document.getElementById('txtLicenseKey').value = licenseInfo.licenseKey;
  
  if (licenseInfo.licenseKey) {
    await validateLicenseInOptions(true);
  }
  
  // add an event listener for changes:
  // window.addEventListener("QuickFolders.BackgroundUpdate", validateLicenseInOptions);
  
  messenger.runtime.onMessage.addListener (
    (data, sender) => {
      if (data.msg=="updatedLicense") {
        licenseInfo = data.licenseInfo;
        QuickFolders.Options.updateLicenseOptionsUI(false); // we may have to switch off silent if we cause this
        configureBuyButton();
        return Promise.resolve(true); // returns a promise of "undefined"
      }
    }
  );
  
}


function configExtra2Button() {
   // to do - OK / Cancel / donate buttons from legacy code QuickFolders.Options 
}

// broken out from validateLicenseInOptions:
async function configureBuyButton() {
  function replaceCssClass(el,addedClass) {
    if (!el) return;
    el.classList.add(addedClass);
    if (addedClass!='paid') el.classList.remove('paid');
    if (addedClass!='expired')  el.classList.remove('expired');
    if (addedClass!='free') el.classList.remove('free');
  }

  let wd = window.document,
      getElement = wd.getElementById.bind(wd),
      btnLicense = getElement("btnLicense"),
      proTab = getElement("QuickFolders-Pro");
  let result = licenseInfo.status;
  
  switch(result) {
    case "Valid":
      let today = new Date(),
          later = new Date(today.setDate(today.getDate()+30)), // pretend it's a month later:
          dateString = later.toISOString().substr(0, 10),
          forceExtend = await messenger.LegacyPrefs.getPref("debug.premium.forceShowExtend");
      // if we were a month ahead would this be expired?
      if (licenseInfo.expiryDate < dateString || forceExtend) {
        QuickFolders.Options.labelLicenseBtn(btnLicense, "extend");
      }
      else {
        if (licenseInfo.keyType==2) { // standard license
          btnLicense.classList.add("upgrade"); // removes "pulsing" animation
          btnLicense.setAttribute("collapsed",false);
          QuickFolders.Options.labelLicenseBtn(btnLicense, "upgrade");
        }
        else
          btnLicense.setAttribute("collapsed",true);
      }
      replaceCssClass(proTab, "paid");
      replaceCssClass(btnLicense, "paid");
      break;
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
  // util.logDebug('validateLicense - result = ' + result);
} 

function initButtons() {
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
  
  // oncommand="setTimeout(function() { QuickFolders.Interface.showLicenseDialog('options_' + options.currentOptionsTab); window.close(); });">Buy License</button>
  document.getElementById("btnLicense").addEventListener("click", (event) => { QuickFolders.Interface.showLicenseDialog(); });
  document.getElementById("btnDefaultRadius").addEventListener("click", (event) => { QuickFolders.Options.setDefaultButtonRadius(); });
  document.getElementById("qf-options-header-description").addEventListener("click", (event) => { messenger.Utilities.showVersionHistory();
    window.close(); 
  });

}

async function initToolbarBackground() {
  QuickFolders.Options.setCurrentToolbarBackground(
    await QuickFolders.Preferences.getStringPref('currentFolderBar.background.selection'), false);  
}



async function initBling() {
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
  getElement("activetabs-label").style.setProperty('color', col, 'important');
  getElement("activetabs-label").style.backgroundColor = bcol;
  
  bcol = util.getSystemColor(await getUserStyle("InactiveTab","background-color","buttonface"));
  getElement("inactive-colorpicker").value = bcol;
  
  col = util.getSystemColor(await getUserStyle("InactiveTab","color","buttontext"));
  getElement("inactive-fontcolorpicker").value = col;
  getElement("inactivetabs-label").style.setProperty('color', col, 'important');
  
  
  bcol = util.getSystemColor(await getUserStyle("HoveredTab","background-color","#FFFFFF"));
  getElement("hover-colorpicker").value = bcol;
  col = util.getSystemColor(await getUserStyle("HoveredTab","color","Black"));
  getElement("hover-fontcolorpicker").value = col;
  getElement("hoveredtabs-label").style.setProperty('color', col, 'important');
  getElement("hoveredtabs-label").style.backgroundColor = bcol;

  bcol = util.getSystemColor(await getUserStyle("DragTab","background-color", "#E93903"));
  getElement("dragover-colorpicker").value = bcol;
  col = util.getSystemColor(await getUserStyle("DragTab","color", "White"));
  getElement("dragover-fontcolorpicker").value = col;
  getElement("dragovertabs-label").style.setProperty('color', col, 'important');
  getElement("dragovertabs-label").style.backgroundColor = bcol;
  getElement("toolbar-colorpicker").value = util.getSystemColor(await getUserStyle("Toolbar","background-color", "White"));
  
  getElement("chkShowIconButtons").collapsed = !QuickFolders.Preferences.supportsCustomIcon; 
  
  
  let currentTheme = await QuickFolders.Options.selectTheme(wd, await QuickFolders.Preferences.getCurrentThemeId());

  // initialize Theme Selector by adding original titles to localized versions
  let cbo = getElement("QuickFolders-Theme-Selector"); // HTMLSelectElement
  if (cbo.length) {
    for (let index = 0; index<cbo.itemCount; index++) {
      let item = cbo.options.item( index ),
          theme = QuickFolders.Themes.Theme(item.value);
      if (theme) {
        if (item.label != theme.name)
          item.label = theme.name + ' - ' + item.label
      }
    }  
  }
  
  
  let menupopup = getElement("QuickFolders-Options-PalettePopup"); // doesn't exist in HTML!! 
  // we need to rewrite this from scratch for the HTML options dialog
  QuickFolders.Interface.buildPaletteMenu(0, menupopup);  
    
  
  // customized coloring support
  QuickFolders.Options.initPreviewTabStyles();
      
  
  let paletteType = await QuickFolders.Preferences.getIntPref('style.InactiveTab.paletteType'),
      disableStriped = !(QuickFolders.Options.stripedSupport(paletteType) || 
                         QuickFolders.Options.stripedSupport(await QuickFolders.Preferences.getIntPref('style.ColoredTab.paletteType')) ||
                         QuickFolders.Options.stripedSupport(await QuickFolders.Preferences.getIntPref('style.InactiveTab.paletteType')));
  
  getElement('qf-individualColors').collapsed = !currentTheme.supportsFeatures.individualColors;
  getElement('qf-individualColors').disabled = disableStriped;
  getElement('ExampleStripedColor').disabled = disableStriped;
  getElement('buttonTransparency').disabled = (paletteType!=0) && disableStriped; // only with "no colors"
  
}

console.log("i18n.updateDocument");
i18n.updateDocument();

loadPrefs();
preselectTab();
initLicenseInfo();
initVersionPanel();
initButtons();
/*  THIS CODE CANNOT WORK "Uncaught ReferenceError: ChromeUtils is not defined"
debugger;
var { Services } = ChromeUtils.import("resource://gre/modules/Services.jsm");

Services.scriptloader.loadSubScript("chrome://quickfolders/content/quickfolders.js", window, "UTF-8");
Services.scriptloader.loadSubScript("chrome://quickfolders/content/quickfolders-preferences.js", window, "UTF-8");
Services.scriptloader.loadSubScript("chrome://quickfolders/content/quickfolders-themes.js", window, "UTF-8");
Services.scriptloader.loadSubScript("chrome://quickfolders/content/quickfolders-util.js", window, "UTF-8");
*/


initToolbarBackground();
initBling();

 
