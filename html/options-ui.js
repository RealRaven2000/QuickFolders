"use strict";
/* BEGIN LICENSE BLOCK

QuickFolders is released under the Creative Commons (CC BY-ND 4.0)
Attribution-NoDerivatives 4.0 International (CC BY-ND 4.0) 
For details, please refer to license.txt in the root folder of this extension

END LICENSE BLOCK */

/*
  globals
    licenseInfo,
  */

// parts from the old options interface that are specific for the options dialog UI
// keeping the old namespace so I know which funcitons I can retire when we convert to HTML

QuickFolders.Options = {
  BGCHOICE: {
    default: 0,
    dark: 1,
    translucent: 2,
    custom: 3,
    lightweight: 4,
  },

  get currentOptionsTab() {
    let selected = null;
    for (let section of document.querySelectorAll("#QuickFolders-Panels section.active")) {
      selected = section;
    }
    switch (selected.id) {
      case "QuickFolders-Options-general":
        return "generalTab";
      case "QuickFolders-Options-advanced":
        return "advancedTab";
      case "QuickFolders-Options-layout":
        return "defaultTab";
      case "QuickFolders-Options-quickhelp":
        return "quickhelpTab";
      case "QuickFolders-Options-support":
        return "supportTab";
      case "QuickFolders-Options-goPro":
      default:
        return "licenseTab";
    }
  },

  setDefaultButtonRadius: async function setDefaultButtonRadius() {
    const prefs = QuickFolders.Preferences;
    document.getElementById("QuickFolders-Options-CustomTopRadius").value = "4";
    document.getElementById("QuickFolders-Options-CustomBottomRadius").value = "0";
    await prefs.setIntPref("style.corners.customizedTopRadiusN", 4);
    await prefs.setIntPref("style.corners.customizedBottomRadiusN", 0);
    messenger.runtime.sendMessage({ command: "updateUserStyles" });
  },

  setDefaultColors: function setDefaultColors() {
    let util = QuickFolders.Util,
      highlightColor = util.getSystemColor("Highlight"),
      highlightTextColor = util.getSystemColor("HighlightText"),
      buttonfaceColor = util.getSystemColor("buttonface"),
      buttontextColor = util.getSystemColor("buttontext"),
      getElement = document.getElementById.bind(document);

    // helper function as we don't use pref listeners here
    // (data-pref-name attribute)
    function setValueAndNotify(id, val) {
      getElement(id).value = val;
      getElement(id).dispatchEvent(new Event("input", { bubbles: true }));
    }
    // as it turns out - setting the value does not trigger change event
    setValueAndNotify("activetab-colorpicker", highlightColor);
    getElement("activetabs-label").style.backgroundColor = highlightColor;
    setValueAndNotify("activetab-fontcolorpicker", highlightTextColor);
    getElement("activetabs-label").style.color = highlightTextColor;

    setValueAndNotify("hover-colorpicker", util.getSystemColor("orange"));
    setValueAndNotify("hover-fontcolorpicker", "#FFFFFF");
    getElement("hoveredtabs-label").style.color = "#FFFFFF";
    getElement("hoveredtabs-label").style.backgroundColor = util.getSystemColor("orange");

    setValueAndNotify("dragover-colorpicker", "#E93903");
    setValueAndNotify("dragover-fontcolorpicker", "#FFFFFF");
    getElement("dragovertabs-label").style.color = "#FFFFFF";
    getElement("dragovertabs-label").style.backgroundColor = "#E93903";

    getElement("toolbar-colorpicker").value = buttonfaceColor;
    setValueAndNotify("inactive-colorpicker", buttonfaceColor);

    getElement("inactivetabs-label").style.backgroundColor = buttonfaceColor;
    setValueAndNotify("inactive-fontcolorpicker", buttontextColor);

    getElement("inactivetabs-label").style.color = buttontextColor;
    messenger.runtime.sendMessage({ command: "updateMainWindow", minimal: false });
    return true;
  },

  sendMail: async function sendMail(mailto = QuickFolders.Util.ADDON_SUPPORT_MAIL) {
    let // obsolete: title = QuickFolders.Util.getBundleString("qf.prompt.contact.title"),
      text = QuickFolders.Util.getBundleString("qf.prompt.contact.subject"),
      result = window.prompt(text, "");
    if (!result) {return;}

    let version = await messenger.runtime.getManifest().version,
      subjectline = "[QuickFolders] " + version + " " + result;
    messenger.compose.beginNew({ subject: subjectline, to: mailto });
    window.close();
  },

  /*********************
   * preparePreviewTab()
   * paints a preview tab on the options window
   * collapses or shows the background color picker accordingly
   * @colorPickerId: [optional] color picker for plain coloring - this is hidden when palette is used
   * @preference: [optional] pull palette entry from this preference, ignored when paletteColor is passed
   * @previewId: id of target element (preview tab)
   * @paletteType: -1 {as standard tab} 0 none 1 plastic 2 pastel ...
   * @paletteColor: [optional] palette index; 0=no styling
   */
  preparePreviewTab: async function preparePreviewTab(
    colorPickerId,
    preference,
    previewId,
    paletteColor,
    paletteType
  ) {
    const prefs = QuickFolders.Preferences;
    let wd = window.document,
      previewTab = wd.getElementById(previewId),
      colorPicker = colorPickerId ? wd.getElementById(colorPickerId) : null;

    // Address [Bug 25589] - when color is set from a drop down, the preference wasn't transmitted leading to wrong palette (always 1)
    if (!preference) {
      switch (previewId) {
        case "inactivetabs-label":
          preference = "style.InactiveTab.";
          break;
        case "activetabs-label":
          preference = "style.ActiveTab.";
          break;
        case "hoveredtabs-label":
          preference = "style.HoveredTab.";
          break;
        case "dragovertabs-label":
          preference = "style.DragOver.";
          break;
      }
    }
    let paletteKey = paletteType;
    if (null == paletteType || typeof paletteType == "undefined") {
      paletteKey = await prefs.getIntPref(preference + "paletteType");
    }
    let paletteClass = await QuickFolders.Interface.getPaletteClassToken(paletteKey);

    if (paletteKey) {
      // use a palette
      let paletteIndex = paletteColor;
      if (null == paletteColor || typeof paletteColor == "undefined") {
        paletteIndex = await prefs.getIntPref(preference + "paletteEntry");
      }

      // hide the color picker when not striped
      if (colorPicker) {
        if (colorPickerId == "inactive-colorpicker") {
          if ((await prefs.getIntPref("colorTabStyle")) == prefs.TABS_STRIPED)
            {paletteIndex = "" + paletteIndex + "striped";}
        } else {
          // do not hide background color for active tab so we can adjust
          // the bottom border color of the toolbar
          if (colorPickerId != "activetab-colorpicker") {colorPicker.collapsed = true;}
        }
      }

      previewTab.className = "qfTabPreview col" + paletteIndex + paletteClass;
    } else {
      previewTab.className = "qfTabPreview";
      if (colorPicker) {
        colorPicker.collapsed = false; // paletteKey = 0  ->  no palette
        let transcol =
          previewId == "inactivetabs-label"
            ? this.getTransparent(colorPicker.value, await prefs.getBoolPref("transparentButtons"))
            : colorPicker.value;
        previewTab.style.backgroundColor = transcol;
      }
    }
    return previewTab;
  },

  colorPickerTranslucent: function (picker) {
    document.getElementById("inactivetabs-label").style.backgroundColor = this.getTransparent(
      picker.value,
      document.getElementById("buttonTransparency").checked
    );
    this.styleUpdate("InactiveTab", "background-color", picker.value);
  },

  getTransparent: function getTransparent(color, transparent) {
    return QuickFolders.Util.getRGBA(color, transparent ? 0.25 : 1.0);
  },

  styleUpdate: async function styleUpdate(elementName, elementStyle, styleValue, label) {
    let util = QuickFolders.Util;
    util.logDebug("styleUpdate(" + elementName + ")...");
    util.logDebugOptional(
      "interface.buttonStyles",
      "styleUpdate(" + elementName + ", " + elementStyle + ", " + styleValue + ")"
    );
    await QuickFolders.Preferences.setUserStyle(elementName, elementStyle, styleValue);
    if (label) {
      switch (elementStyle) {
        case "color":
          // like inline styling = highest priority
          document.getElementById(label).style.setProperty("color", styleValue, "important");
          break;
        case "background-color":
          document.getElementById(label).style.backgroundColor = styleValue;
          break;
      }
    }
    messenger.runtime.sendMessage({ command: "updateUserStyles" }); // was "updateMainWindow"
    return true; // return updateResult;
  },

  toggleColorTranslucent: async function toggleColorTranslucent(cb, pickerId, label, userStyle) {
    let picker = document.getElementById(pickerId);
    document.getElementById(label).style.backgroundColor = QuickFolders.Options.getTransparent(
      picker.value,
      cb.checked
    );
    if (userStyle) {
      await QuickFolders.Preferences.setUserStyle(userStyle, "background-color", picker.value);
    }

    let prefString = cb.getAttribute("data-pref-name");
    if (prefString) {
      await QuickFolders.Preferences.setBoolPrefVerbose(prefString, cb.checked);
    }

    messenger.runtime.sendMessage({ command: "updateMainWindow", minimal: true });
    return true;
  },

  showButtonShadow: function showButtonShadow(chk) {
    let isShadow = chk.checked;
    let el = document.getElementById("inactivetabs-label"),
      myStyle = isShadow ? "1px -1px 3px -1px rgba(0,0,0,0.7)" : "none";
    el.style.boxShadow = myStyle;
    QuickFolders.Preferences.setBoolPref("buttonShadows", isShadow);
    messenger.runtime.sendMessage({ command: "updateMainWindow", minimal: true });
    return true;
  },

  initPreviewTabStyles: function initPreviewTabStyles() {
    let getElement = document.getElementById.bind(document),
      menupopup = getElement("QuickFolders-Options-PalettePopup");

    this.preparePreviewTab("inactive-colorpicker", "style.InactiveTab.", "inactivetabs-label");
    this.preparePreviewTab("activetab-colorpicker", "style.ActiveTab.", "activetabs-label");
    this.preparePreviewTab("hover-colorpicker", "style.HoveredTab.", "hoveredtabs-label");
    this.preparePreviewTab("dragover-colorpicker", "style.DragOver.", "dragovertabs-label");
  },

  /*********************
   *  showPalette()
   *  open palette popup for specific buttons state
   *  @label              parent node
   *  @buttonState        'standard', 'active', 'hovered', 'dragOver'
   *  {paletteMenuId}     'menuStandardPalette', 'menuActivePalette', 'menuHoverPalette', 'menuDragOverPalette'
   */
  showPalette: async function showPalette(label, buttonState) {
    let id = label ? label.id : label.toString(),
      paletteMenuId = this.getButtonMenuId(buttonState),
      paletteMenu = document.getElementById(paletteMenuId);
    QuickFolders.Util.logDebugOptional(
      "interface",
      "Options.showPalette(" + id + ", " + buttonState + ")"
    );
    if (paletteMenu) {
      if (paletteMenu.value == "0") {
        return; // no menu, as 2 colors / no palette is selected
      }
      await QuickFolders.Options.toggleUsePalette(buttonState, paletteMenu.value, false);
      // allow overriding standard background for striped style!
      // Now style the palette with the correct palette class
      let context = label.getAttribute("context"),
        menu = document.getElementById(context);
      menu.className =
        "QuickFolders-folder-popup" +
        (await QuickFolders.Interface.getPaletteClass(
          QuickFolders.Options.getButtonStatePrefId(buttonState)
        ));
      menu.setAttribute("buttonState", buttonState);
      menu.setAttribute("targetId", id);
      menu.setAttribute("stylePrefKey", label.getAttribute("stylePrefKey"));
    }
    QuickFolders.Interface.showPalette(label);
  },

  selectColorFromPalette: function (event) {
    let target = event.target;
    console.log("selected color from Palette:", target);
    let colId = target.getAttribute("selectedColor");
    if (colId != null) {
      QuickFolders.Interface.setTabColorFromMenu(target, colId);
    }
    QuickFolders.Interface.hidePalette();
  },

  // toggle pastel mode was toggleColorPastel
  // NEEDS A REWRITE FOR MULTIPLE PALETTES!
  showPalettePreview: async function (withUpdate) {
    let defaultPalette = await QuickFolders.Preferences.getIntPref("style.InactiveTab.paletteType"),
      isPastel = defaultPalette == 2,
      getElement = document.getElementById.bind(document);

    // we need to solve the radio element background image being displayed by setting the src attribute.
    // probably should be a CSS style instead?
    getElement("ExampleStripedColor").className =
      "qfTabPreview plastic col6striped " + isPastel ? "pastel" : "plastic";
    getElement("ExampleFilledColor").className =
      "qfTabPreview plastic col6 " + isPastel ? "pastel" : "plastic";

    let picker = getElement("inactive-colorpicker");

    getElement("activetabs-label").style.backgroundColor = this.getTransparent(
      picker.value,
      isPastel
    );
    await QuickFolders.Preferences.setUserStyle("InactiveTab", "background-color", picker.value);
    await QuickFolders.Preferences.setBoolPref("pastelColors", isPastel);

    this.initPreviewTabStyles();

    if (withUpdate) {
      QuickFolders.Options.updateMainWindow();
    }
  },

  setColoredTabStyleFromRadioGroup: function (rgroup) {
    let styleId = parseInt(rgroup.value, 10);
    this.setColoredTabStyle(styleId, true);
  },

  // select: striped style / filled style
  setColoredTabStyle: async function (styleId, force) {
    const prefs = QuickFolders.Preferences,
      QI = QuickFolders.Interface;
    if (!force && (await prefs.getIntPref("colorTabStyle")) == styleId) {return;} // no change!
    await prefs.setIntPref("colorTabStyle", styleId); // 0 striped 1 filled
    // QuickFolders.Util.notifyTools.notifyBackground({ func: "updateMainWindow", minimal: "false" });
    QuickFolders.Options.updateMainWindow(false);

    let inactiveTab = document.getElementById("inactivetabs-label");
    QI.applyTabStyle(inactiveTab, styleId);
  },

  // change background color for current folder bar
  // 5 choices [string]: default, dark, custom, translucent, lightweight
  setCurrentToolbarBackground: async function setCurrentToolbarBackground(choice, withUpdate) {
    const util = QuickFolders.Util,
      prefs = QuickFolders.Preferences;
    let isCustomStyle = false;
    let setting = document.getElementById("currentFolderBackground"),
      // store custom value, when going away from custom selection
      backgroundCombo = document.getElementById("QuickFolders-CurrentFolder-Background-Select");
    util.logDebugOptional("interface", "Options.setCurrentToolbarBackground");
    if (backgroundCombo.selectedIndex == this.BGCHOICE.custom && choice != "custom") {
      await prefs.setStringPref("currentFolderBar.background.custom", setting.value);
    }

    switch (choice) {
      case "default":
        backgroundCombo.selectedIndex = this.BGCHOICE.default;
        setting.value = "linear-gradient(to top, #FFF 7%, #BDB9BD 88%, #EEE 100%)";
        break;
      case "dark":
        backgroundCombo.selectedIndex = this.BGCHOICE.dark;
        setting.value =
          "linear-gradient(rgb(88, 88, 88), rgb(35, 35, 35) 45%, rgb(33, 33, 33) 48%, rgb(24, 24, 24))";
        break;
      case "translucent":
        backgroundCombo.selectedIndex = this.BGCHOICE.translucent;
        setting.value = "rgba(255, 255, 255, 0.2)"; // Gecko 1.9+
        break;
      case "lightweight":
        backgroundCombo.selectedIndex = this.BGCHOICE.lightweight;
        setting.value = "linear-gradient(to bottom, rgba(255, 255, 255, .4), transparent)";
        break;
      case "custom":
        isCustomStyle = true;
        backgroundCombo.selectedIndex = this.BGCHOICE.custom;
        // restore custom value
        setting.value = await prefs.getStringPref("currentFolderBar.background.custom");
        break;
    }
    if (isCustomStyle) {
      document.getElementById("customCurrentIconColor").firstChild.removeAttribute("disabled");
      document.getElementById("currentfolder-icons-colorpicker").removeAttribute("disabled");
    } else {
      document.getElementById("customCurrentIconColor").firstChild.setAttribute("disabled", true);
      document.getElementById("currentfolder-icons-colorpicker").setAttribute("disabled", true);
    }

    let styleValue = setting.value;
    await prefs.setStringPref("currentFolderBar.background", styleValue);
    await prefs.setStringPref("currentFolderBar.background.selection", choice);
    /*
    if (Preferences) {
      Preferences.get('extensions.quickfolders.currentFolderBar.background')._value=styleValue;
    }
    */
    // need to update current folder bar only
    if (withUpdate) {
      messenger.runtime.sendMessage({ command: "updateNavigationBar" });
    }
  },

  // set the custom value entered by user (only if custom is actually selected)
  setCurrentToolbarBackgroundCustom: async function () {
    const prefs = QuickFolders.Preferences;
    if (await prefs.isDebugOption("options")) {
      // eslint-disable-next-line no-debugger
      debugger;
    }
    let setting = document.getElementById("currentFolderBackground"),
      backgroundCombo = document.getElementById("QuickFolders-CurrentFolder-Background-Select");
    if (backgroundCombo.selectedIndex == this.BGCHOICE.custom) {
      // store the new setting!
      await prefs.setStringPref("currentFolderBar.background.custom", setting.value);
      this.setCurrentToolbarBackground("custom", true);
    } else {
      let item = backgroundCombo.getItemAtIndex(backgroundCombo.selectedIndex);
      this.setCurrentToolbarBackground(item.value, true);
    }
  },

  getButtonStatePrefId: function getButtonStatePrefId(buttonState) {
    switch (buttonState) {
      case "colored":
        return "ColoredTab";
      case "standard":
        return "InactiveTab";
      case "active":
        return "ActiveTab";
      case "hovered":
        return "HoveredTab";
      case "dragOver":
        return "DragOver";
      default:
        throw "QuickFolders.Options.getButtonStatePrefId - Invalid buttonState: " + buttonState; // error!
    }
  },

  getButtonMenuId: function getButtonMenuId(buttonState) {
    switch (buttonState) {
      case "colored":
        return "menuColoredPalette";
      case "standard":
        return "menuStandardPalette";
      case "active":
        return "menuActiveTabPalette";
      case "hovered":
        return "menuHoverPalette";
      case "dragOver":
        return "menuDragOverPalette";
      default:
        throw "QuickFolders.Options.getButtonMenuId - Invalid buttonState: " + buttonState; // error!
    }
  },

  /*********************
   * toggleUsePalette()
   * Set whether (and which) palette is used for a particular tab state.
   * also hides background colorpicker if a palette is used
   * @buttonState:   [string] which kind of tab state: standard, active, hovered, dragOver
   * @paletteType:   0 none, 1 plastic, 2 pastel, 3 night ....
   * @isUpdatePanelColor:  when switching palette type from dropdown, update color on button -> UI
   */
  toggleUsePalette: async function toggleUsePalette(buttonState, paletteType, isUpdatePanelColor) {
    //let isChecked = checkbox.checked;
    const prefs = QuickFolders.Preferences,
      QI = QuickFolders.Interface;
    let getElement = document.getElementById.bind(document);

    if (typeof paletteType === "string") {paletteType = parseInt(paletteType);} // convert to int

    let idPreview = null,
      colorPicker = null,
      stylePref = this.getButtonStatePrefId(buttonState),
      isStripable = null,
      isTransparentSupport = false;
    switch (buttonState) {
      case "colored":
        isStripable =
          this.stripedSupport(paletteType) ||
          this.stripedSupport(await prefs.getIntPref("style.ColoredTab.paletteType"));
        break;
      case "standard":
        idPreview = "inactivetabs-label";
        colorPicker = "inactive-colorpicker";
        isStripable =
          this.stripedSupport(paletteType) ||
          this.stripedSupport(await prefs.getIntPref("style.ColoredTab.paletteType"));
        isTransparentSupport = paletteType == 0;
        break;
      case "active":
        idPreview = "activetabs-label";
        colorPicker = "activetab-colorpicker";
        break;
      case "hovered":
        idPreview = "hoveredtabs-label";
        colorPicker = "hover-colorpicker";
        break;
      case "dragOver":
        idPreview = "dragovertabs-label";
        colorPicker = "dragover-colorpicker";
        break;
    }
    if (isStripable && paletteType == 3) {isStripable = false;}
    if (isUpdatePanelColor) {
      getElement("buttonTransparency").disabled = !isTransparentSupport;
      // do not allow striped style if Night Vision is selected
      // [Bug 26348]
      if (isStripable === null) {
        isStripable =
          this.stripedSupport(await prefs.getIntPref("style.ColoredTab.paletteType")) ||
          this.stripedSupport(await prefs.getIntPref("style.InactiveTab.paletteType"));
      }

      if (!isStripable) {
        this.setColoredTabStyle(prefs.TABS_FILLED);
      }
      getElement("qf-individualColors").disabled = !isStripable;
      getElement("ExampleStripedColor").disabled = !isStripable;
    }

    // preparePreviewTab(id, preference, previewId)
    await prefs.setIntPref("style." + stylePref + ".paletteType", paletteType);
    if (!colorPicker) { return; }
    const preview = this.preparePreviewTab(
      colorPicker,
      "style." + stylePref + ".",
      idPreview,
      null,
      paletteType
    );
    // we need to force reselect the palette entry of the button
    // to update font & background color
    if (!isUpdatePanelColor) { return; }
    const m = getElement("QuickFolders-Options-PalettePopup");
    if (!m) { return; }
    m.targetNode =
      buttonState == "colored" ? null : getElement(QI.getPreviewButtonId(buttonState));
    // as we share the same menu between all preview elements, we need to overwrite targetId.
    const thePicker = getElement(colorPicker);
    m.setAttribute("targetId", thePicker.getAttribute("aria-labelledby"));
    m.setAttribute("stylePrefKey", preview.getAttribute("stylePrefKey"));
    // retrieve palette index
    const col = await prefs.getIntPref("style." + stylePref + ".paletteEntry");
    QI.setTabColorFromMenu(m.firstChild, col.toString()); // simulate a menu item! 155 lines of LEGACY code ...    
  },

  changeTextPreference: function (txtBox) {
    let prefString = txtBox.getAttribute("data-pref-name");
    QuickFolders.Preferences.setIntPreference(prefString, txtBox.value);

    // QuickFolders.Util.notifyTools.notifyBackground({ func: "updateMainWindow", minimal: "false" });
    messenger.runtime.sendMessage({ command: "updateMainWindow", minimal: false });
    return true;
  },

  // doing what instantApply really should provide...
  toggleBoolPreference: async function (cb, noUpdate = false) {
    let prefString = cb.getAttribute("data-pref-name");
    let uncheckMutexOptions=[];
    //  using the new preference system, this attribute should be the actual full string of the pref.
    //  pref = document.getElementById(prefString);

    try {
      if (prefString) {
        await QuickFolders.Preferences.setBoolPref(prefString, cb.checked);
      }

      if (prefString.endsWith(".showFoldersWithMessagesItalic") && cb.checked) {
        let cbMutex = document.querySelector("[preference=qfpg-ShowFoldersWithNewMailItalic]");
        if (cbMutex?.checked) {
          uncheckMutexOptions.push(cbMutex);
        }
      }
      if (prefString.endsWith(".showFoldersWithNewMailItalic") && cb.checked) {
        let cbMutex = document.querySelector("[preference=qfpg-ShowFoldersWithMessagesItalic]");
        if (cbMutex?.checked) {
          uncheckMutexOptions.push(cbMutex);
        }
      }
      if (prefString.endsWith(".showNewMailHighlight")) {
        document.querySelector("[preference=qfpg-ShowNewMailOutline]").disabled = !cb.checked;
      }
      
      if (noUpdate) {return true;}
    } catch {
      return true;
    } finally {
      // switch off mutually exclusive checkboxes: (make sure it doesn't trigger recursively!!!)
      for (let option of uncheckMutexOptions) {
        option.checked = false; // fastest option: toggle mutex off in UI, then react:
        await QuickFolders.Options.toggleBoolPreference(option, false);
      }
      // eslint-disable-next-line no-unsafe-finally
      if (noUpdate) {return true;}
      // UI update last
      switch (prefString) {
        case "extensions.quickfolders.collapseCategories":
          // QuickFolders.Util.notifyTools.notifyBackground({ func: "updateCategoryBox" });
          messenger.runtime.sendMessage({ command: "updateCategoryBox" });
          // eslint-disable-next-line no-unsafe-finally
          return false;
        case "extensions.quickfolders.toolbar.hideInSingleMessage":
          // QuickFolders.Util.notifyTools.notifyBackground({ func: "currentDeckUpdate" });
          messenger.runtime.sendMessage({ command: "currentDeckUpdate" });
          // eslint-disable-next-line no-unsafe-finally
          return false;
        case "extensions.quickfolders.toolbar.largeIcons":
          // QuickFolders.Util.notifyTools.notifyBackground({ func: "updateMainWindow", minimal: "true" });
          messenger.runtime.sendMessage({ command: "updateMainWindow", minimal: true });
          break;
      }
      // broadcast change of current folder bar for all interested windows.
      if (prefString.includes(".currentFolderBar.") || prefString.includes("toolbar.largeIcons")) {
        // QuickFolders.Util.notifyTools.notifyBackground({ func: "updateNavigationBar" });
        messenger.runtime.sendMessage({ command: "updateNavigationBar" });
        // eslint-disable-next-line no-unsafe-finally
        return true;
      }
      // QuickFolders.Util.notifyTools.notifyBackground({ func: "updateMainWindow", minimal: "false" }); // force full update
      messenger.runtime.sendMessage({ command: "updateMainWindow" });      
    }
  },

  // 3pane window only?
  toggleNavigationBars: async function (chk, selector) {
    let checked = chk.checked ? chk.checked : false;
    QuickFolders.Util.logDebugOptional(
      "interface.currentFolderBar",
      `toggleNavigationBars(${chk}, ${selector})`
    );
    await QuickFolders.Preferences.setShowCurrentFolderToolbar(checked, selector);
    // we should not call displayNavigationToolbar directly but use the event broadcaster to notify all windows.
    messenger.runtime.sendMessage({ command: "toggleNavigationBars" });
  },

  stripedSupport: function (paletteType) {
    switch (parseInt(paletteType)) {
      case 1: // Standard Palette
        return true;
      case 2: // Pastel Palette
        return true;
      default: // 2 colors or  night vision do not support "striped" style
        return false;
    }
  },

  updateNavigationBar: function updateNavigationBar() {
    messenger.runtime.sendMessage({ command: "updateNavigationBar" });
  },

  updateMainWindow: function updateMainWindow(minimal = false) {
    messenger.runtime.sendMessage({ command: "updateMainWindow", minimal });
  },

  selectTheme: function (wd, themeId, isUpdateUI = false) {
    const util = QuickFolders.Util;
    let myTheme = QuickFolders.Themes.Theme(themeId),
      getElement = wd.getElementById.bind(wd);
    if (myTheme) {
      try {
        getElement("QuickFolders-Theme-Selector").value = themeId;
        getElement("Quickfolders-Theme-Author").textContent = myTheme.author;

        // textContent wraps, value doesnt
        let themeDescription =
          messenger.i18n.getMessage("qf.themes." + themeId + ".description") || "N/A";
        getElement("Quickfolders-Theme-Description").textContent = themeDescription;
        getElement("qf-options-icons").disabled = !myTheme.supportsFeatures.specialIcons;
        getElement("qf-options-shadow").disabled = !myTheme.supportsFeatures.buttonShadows;
        getElement("button-font-size").disabled = !myTheme.supportsFeatures.supportsFontSize;
        getElement("button-font-size-label").disabled = !myTheme.supportsFeatures.supportsFontSize;
        getElement("btnHeightTweaks").setAttribute(
          "collapsed",
          !myTheme.supportsFeatures.supportsHeightTweaks
        );
        getElement("qf-tweakRadius").setAttribute(
          "collapsed",
          !myTheme.supportsFeatures.cornerRadius
        );
        getElement("qf-tweakToolbarBorder").setAttribute(
          "collapsed",
          !myTheme.supportsFeatures.toolbarBorder
        );
        getElement("qf-tweakColors").setAttribute(
          "collapsed",
          !(myTheme.supportsFeatures.stateColors || myTheme.supportsFeatures.individualColors)
        );
        getElement("qf-individualColors").setAttribute(
          "collapsed",
          !myTheme.supportsFeatures.individualColors
        );
        getElement("qf-StandardColors").setAttribute(
          "collapsed",
          !myTheme.supportsFeatures.standardTabColor
        );
        getElement("buttonTransparency").setAttribute(
          "collapsed",
          !myTheme.supportsFeatures.tabTransparency
        );
        getElement("qf-stateColors").setAttribute(
          "collapsed",
          !myTheme.supportsFeatures.stateColors
        );
        getElement("qf-stateColors-defaultButton").setAttribute(
          "collapsed",
          !myTheme.supportsFeatures.stateColors
        );
      } catch (ex) {
        util.logException("Exception during QuickFolders.Options.selectTheme: ", ex);
      }

      /******  FOR FUTURE USE ??  ******/
      // if (myTheme.supportsFeatures.supportsFontSelection)
      // if (myTheme.supportsFeatures.buttonInnerShadows)
      QuickFolders.Util.logDebug("Theme [" + myTheme.Id + "] selected");

      if (isUpdateUI) {
        messenger.runtime.sendMessage({ command: "updateFoldersUI" });
        messenger.runtime.sendMessage({
          command: "updateNavigationBar",
        }); /* update style of current folder tab! */
      }
    }
    return myTheme;
  },

  enableInputElement: function (id, isEnabled) {
    const el = document.getElementById(id);
    if (el) {
      el.disabled = !isEnabled;
    } else {
      QuickFolders.Util.logDebug("Couldn't find element: " + id);
    }
  },

  enableProFeatureLabels: function (isEnabled) {
    // this replaces the icon with the [Pro] logo!
    for (let el of document.querySelectorAll(".proFeature")) {
      if (isEnabled) {
        el.removeAttribute("disabled");
      } else {
        el.setAttribute("disabled", true);
      }
    }
  },

  initStandardFeatureLabels: function (hasLicense) {
    for (let el of document.querySelectorAll(".stdFeature")) {
      if (hasLicense) {
        el.removeAttribute("restricted");
      } else {
        el.setAttribute("restricted", true);
      }
    }
  },

  enablePremiumConfig: function (isEnabled) {
    const elements = [
      "premiumConfig",
      "chkQuickJumpHotkey",
      "chkQuickJumpHotkey",
      "chkQuickMoveHotkey",
      "chkQuickCopyHotkey",
      "chkSkipFolderHotkey",
      "qf-QuickJumpShortcut",
      "qf-QuickMoveShortcut",
      "qf-QuickCopyShortcut",
      "chkQuickMoveAutoFill",
      "qf-SkipFolderShortcut",
      "menuQuickMoveFormat",
      "quickmove-path-depth",
      "quickMoveAdvanced",
      "chkCategories",
      "moveMailOptions",
      "moveMailOptions-quickMove",
      "chkFindRelated",
    ];
    // 1. disabled input element
    for (let e of elements) {
      QuickFolders.Options.enableInputElement(e, isEnabled);
    }
    const findRelatedTab = document.querySelector(".qfFindRelated");
    if (isEnabled) {
      findRelatedTab.removeAttribute("collapsed");
      // load defined patterns into entry list
      QuickFolders.Options.configureRelatedTab();
    } else {
      findRelatedTab.setAttribute("collapsed", true);
    }
    // 2. replace the icons with the [PRO] label
    QuickFolders.Options.enableProFeatureLabels(isEnabled);

    QuickFolders.Options.enableStandardConfig(isEnabled);
  },

  enableStandardConfig: function (isEnabled) {
    let getElement = document.getElementById.bind(document),
      elements = [
        "chkConfigIncludeTabs",
        "chkConfigIncludeGeneral",
        "chkConfigIncludeLayout",
        "btnLoadConfig",
      ],
      backupRestore = getElement("backupRestore");
    for (let e of elements) {
      QuickFolders.Options.enableInputElement(e, isEnabled);
    }
    QuickFolders.Options.initStandardFeatureLabels(isEnabled);

    if (isEnabled) {
      backupRestore.removeAttribute("disabled");
    } else {
      backupRestore.setAttribute("disabled", true);
    }
  },

  updateLicenseOptionsUI: async function (silent = false) {
    const getElement = document.getElementById.bind(document),
      validationPassed = getElement("validationPassed"),
      validationStandard = getElement("validationStandard"),
      validationFailed = getElement("validationFailed"),
      validationInvalidAddon = getElement("validationInvalidAddon"),
      validationExpired = getElement("validationExpired"),
      validationInvalidEmail = getElement("validationInvalidEmail"),
      validationEmailNoMatch = getElement("validationEmailNoMatch"),
      validationDate = getElement("validationDate"),
      validationDateSpace = getElement("validationDateSpace"),
      licenseDate = getElement("licenseDate"),
      licenseDateLabel = getElement("licenseDateLabel"),
      decryptedMail = licenseInfo.email,
      decryptedDate = licenseInfo.expiryDate,
      result = licenseInfo.status;

    validationStandard.setAttribute("collapsed", true);
    validationPassed.setAttribute("collapsed", true);
    validationFailed.setAttribute("collapsed", true);
    validationExpired.setAttribute("collapsed", true);
    validationInvalidAddon.setAttribute("collapsed", true);
    validationInvalidEmail.setAttribute("collapsed", true);
    validationEmailNoMatch.setAttribute("collapsed", true);
    validationDate.setAttribute("collapsed", false);
    validationDateSpace.setAttribute("collapsed", false);
    QuickFolders.Options.enablePremiumConfig(false);
    try {
      let niceDate = decryptedDate;
      if (decryptedDate) {
        try {
          let d = new Date(decryptedDate);
          niceDate = d.toLocaleDateString();
        } catch {
          niceDate = decryptedDate;
        }
      }
      licenseDate.value = niceDate; // invalid ??
      switch (result) {
        case "Valid":
          if (licenseInfo.keyType == 2) {
            // standard license
            QuickFolders.Options.showValidationMessage(validationStandard, silent);
            QuickFolders.Options.enableStandardConfig(true);
          } else {
            QuickFolders.Options.enablePremiumConfig(true);
            QuickFolders.Options.showValidationMessage(validationPassed, silent);
            getElement("dialogProductTitle").value = "QuickFolders Pro";
          }
          licenseDate.value = niceDate;
          licenseDateLabel.value = QuickFolders.Util.getBundleString("qf.label.licenseValid");
          // remove animations / red pro icon:
          QuickFolders.Interface.removeAnimations("quickfolders-options.css");
          break;
        case "Invalid":{
          validationDate.setAttribute("collapsed", true);
          validationDateSpace.setAttribute("collapsed", true);
          let addonName = "";
          switch (licenseInfo.licenseKey.substr(0, 2)) {
            case "QI":
              addonName = "quickFilters";
              break;
            case "S1":
            case "ST":
              addonName = "SmartTemplates";
              break;
            case "QF":
            case "QS":
            default:
              QuickFolders.Options.showValidationMessage(validationFailed, silent);
          }
          if (addonName) {
            let txt = validationInvalidAddon.textContent;
            txt = txt.replace("{0}", "QuickFolders").replace("{1}", "QF"); // keys for {0} start with {1}
            if (txt.indexOf(addonName) < 0) {
              txt +=
                " " +
                QuickFolders.Util.getBundleString("qf.licenseValidation.guessAddon").replace(
                  "{2}",
                  addonName
                );
            }
            validationInvalidAddon.textContent = txt;
            QuickFolders.Options.showValidationMessage(validationInvalidAddon, silent);
          }
        } break;
        case "Expired":
          licenseDateLabel.value = QuickFolders.Util.getBundleString(
            "qf.licenseValidation.expired"
          );
          licenseDate.value = niceDate;
          QuickFolders.Options.showValidationMessage(validationExpired, false); // always show
          break;
        case "MailNotConfigured":
          validationDate.setAttribute("collapsed", true);
          validationDateSpace.setAttribute("collapsed", true);
          validationInvalidEmail.setAttribute("collapsed", false);
          // if mail was already replaced the string will contain [mail address] in square brackets
          validationInvalidEmail.textContent = validationInvalidEmail.textContent
            .replace(/\[.*\]/, "{1}")
            .replace("{1}", "[" + decryptedMail + "]");
          break;
        case "MailDifferent":
          validationDate.setAttribute("collapsed", true);
          validationDateSpace.setAttribute("collapsed", true);
          QuickFolders.Options.showValidationMessage(validationFailed, true);
          QuickFolders.Options.showValidationMessage(validationEmailNoMatch, silent);
          break;
        case "Empty":
          validationDate.setAttribute("collapsed", true);
          validationDateSpace.setAttribute("collapsed", true);
          break;
        default:
          Services.prompt.alert(null, "QuickFolders", "Unknown license status: " + result);
          break;
      }
    } catch (ex) {
      QuickFolders.Util.logException(
        "Error in QuickFolders.Options.updateLicenseOptionsUI():\n",
        ex
      );
    }
    return result;
  },

  // make a validation message visible but also repeat a notification for screen readers.
  showValidationMessage: async function (el, silent = true) {
    if (el.getAttribute("collapsed") != false) {
      el.setAttribute("collapsed", false);
      if (!silent) {
        // TO DO: OS notification
        // QuickFolders.Util.slideAlert (util.ADDON_NAME, el.textContent);
        await messenger.runtime.sendMessage({
          command: "slideAlert",
          args: ["QuickFolders", el.textContent.trim()],
        });
      }
    }
  },

  // put appropriate label on the license button and pass back the label text as well
  labelLicenseBtn: function (btnLicense, validStatus) {
    switch (validStatus) {
      case "extend": {
        let txtExtend = QuickFolders.Util.getBundleString(
          "qf.notification.premium.btn.extendLicense"
        );
        btnLicense.setAttribute("collapsed", false);
        btnLicense.textContent = txtExtend; // text should be extend not renew
        btnLicense.setAttribute(
          "tooltiptext",
          QuickFolders.Util.getBundleString("qf.notification.premium.btn.extendLicense.tooltip")
        );
        return txtExtend;
      }
      case "renew": {
        let txtRenew = QuickFolders.Util.getBundleString(
          "qf.notification.premium.btn.renewLicense"
        );
        btnLicense.textContent = txtRenew;
        return txtRenew;
      }
      case "buy": {
        let buyLabel = QuickFolders.Util.getBundleString("qf.notification.premium.btn.getLicense");
        btnLicense.textContent = buyLabel;
        return buyLabel;
      }
      case "upgrade": {
        let upgradeLabel = QuickFolders.Util.getBundleString("qf.notification.premium.btn.upgrade");
        btnLicense.textContent = upgradeLabel;
        btnLicense.classList.add("upgrade"); // stop flashing
        return upgradeLabel;
      }
    }
    return "";
  },

  updateAriaLicenseLabel: function(el) {
    if (!el) {return;}
    const fullKey = el.value.trim();
    if (!fullKey) {
      el.setAttribute("aria-label", "license field empty!");
      return;
    }    
    const shortKey = fullKey.split(";")[0]; // Extract only the meaningful part
    el.setAttribute("aria-label", `License Key: ${shortKey}`);    
  },

  trimLicense: function () {
    const licenseTxt = document.getElementById("txtLicenseKey"),
      strLicense = licenseTxt.value.toString();
    // Remove line breaks and extra spaces:
    let trimmedLicense = strLicense
      .replace(/\r?\n|\r/g, " ") // replace line breaks with spaces
      .replace(/\s\s+/g, " ") // collapse multiple spaces
      .replace("[at]", "@")
      .trim();
    licenseTxt.value = trimmedLicense;
    this.updateAriaLicenseLabel(licenseTxt);
    return trimmedLicense;
  },

  validateNewKey: async function () {
    QuickFolders.Options.trimLicense();
    // do a round trip through the background script.
    await messenger.runtime.sendMessage({
      command: "updateLicense",
      key: document.getElementById("txtLicenseKey").value,
    });
  },

  pasteLicense: async function () {
    navigator.clipboard.readText().then((clipText) => {
      if (clipText) {
        let txtBox = document.getElementById("txtLicenseKey");
        txtBox.value = clipText;
        let finalLicense = QuickFolders.Options.trimLicense();
        QuickFolders.Options.validateNewKey();
      }
    });
  },

  /************** LEGACY PARTS  ***********/
  quickMoveAdvancedSettings: function () {
    // TO DO: convert quickmove.xhtml to html
    // for now, moved to quickfolders-tablistener as  "global command handler"
    messenger.runtime.sendMessage({ command: "legacyAdvancedSearch" });
  },

  copyFolderEntries: function () {
    messenger.runtime.sendMessage({ command: "copyFolderEntries" });
  },

  pasteFolderEntries: function () {
    messenger.runtime.sendMessage({ command: "pasteFolderEntries" });
  },

  getColorPickerVars: function (colPickId) {
    switch (colPickId) {
      case "toolbar-colorpicker":
        return { name: "Toolbar", style: "background-color", preview: "qf-StandardColors" };
      case "inactive-fontcolorpicker":
        return { name: "InactiveTab", style: "color", preview: "inactivetabs-label" };
      case "activetab-fontcolorpicker":
        return { name: "ActiveTab", style: "color", preview: "activetabs-label" };
      case "activetab-colorpicker":
        return { name: "ActiveTab", style: "background-color", preview: "activetabs-label" };
      case "hover-fontcolorpicker":
        return { name: "HoveredTab", style: "color", preview: "hoveredtabs-label" };
      case "hover-colorpicker":
        return { name: "HoveredTab", style: "background-color", preview: "hoveredtabs-label" };
      case "dragover-fontcolorpicker":
        return { name: "DragTab", style: "color", preview: "dragovertabs-label" };
      case "dragover-colorpicker":
        return { name: "DragTab", style: "background-color", preview: "dragovertabs-label" };
      default:
        return { name: null, style: null, preview: null };
    }
  },

  // save space, for visually impaired
  collapseHead: function collapseHead() {
    let hdr = document.getElementById("qf-header-container");
    hdr.setAttribute("collapsed", true);
  },

  selectRelatedFields_toCheckboxes: function (sectionId, selectionArray) {
    QuickFolders.Util.logDebug("selected item with:", { sectionId, selectionArray });
    const sec = document.getElementById(sectionId);
    if (!sec) {return;}
    const chkOptions = sec.querySelectorAll("input[type=checkbox]");
    if (!chkOptions) {return;}
    for (const option of chkOptions) {
      const searchType = option.getAttribute("term");
      // "author" => "sender"
      for (const [i, item] of selectionArray.entries()) {
        if (item === "author") {
          selectionArray[i] = "sender";
        }
      }
      selectionArray.map((item) => (item === "author" ? "sender" : item));
      option.checked = selectionArray.some((el) => el === searchType);
    }
  },

  selectFindRelated_listItem: async function (evt) {
    function parseFields(arrayString) {
      const results = JSON.parse(arrayString || "[]");

      return results;
    }
    let idx = evt.target.selectedIndex;
    if (idx < 0) {
      return;
    }
    let selOption = evt.target.selectedOptions[0]; // first in selection!
    QuickFolders.Util.logDebug("selectFindRelated_listItem", evt, selOption);
    if (isNaN(selOption.value)) {
      return;
    }
    const selIndex = parseInt(selOption.value, 10);
    let findRelatedList = await QuickFolders.Options.loadFindRelated();
    const item = findRelatedList.items[selIndex];
    document.getElementById("findRelatedTitle").value = item.title;
    document.getElementById("findRelatedPattern").value = item.pattern;
    document.getElementById("findRelatedGroup").value = item.group;
    // now fill the checkbox options
    // subject, sender, recipients, body
    // the default term 'author' (wrong!) needs to be replaced with 'sender'

    this.selectRelatedFields_toCheckboxes("searchSelectedFields", parseFields(item.searchSelected));
    this.selectRelatedFields_toCheckboxes("searchCriteriaFields", parseFields(item.searchCriteria));
  },
  loadFindRelated: async function () {
    const prefs = QuickFolders.Preferences;
    let findRelatedList;
    // load the different items
    const jsonList = await prefs.getStringPref("findRelated.list");
    try {
      findRelatedList = JSON.parse(jsonList || "{}");
    } catch (ex) {
      QuickFolders.Util.logException(
        "Exception during QuickFolders.Options.configureRelatedTab: ",
        { jsonList },
        ex
      );
      findRelatedList = {};
    }
    if (!findRelatedList?.items) {
      // use for the first time
      findRelatedList = findRelatedList || {};
      findRelatedList.items = [];
      // import current / first item
      findRelatedList.items.push({
        title: "last search",
        pattern: await prefs.getStringPref("findRelated.pattern"),
        group: await prefs.getIntPref("findRelated.group"),
        searchSelected: await prefs.getStringPref("findRelated.searchSelected"), // containing an array of options
        searchCriteria: await prefs.getStringPref("findRelated.searchCriteria"), // containing an array of options
      });
      QuickFolders.Util.logDebug("loadFindRelated retrieved:", { findRelatedList });
    }
    return findRelatedList;
  },
  storeFindRelated: async function (findRel) {
    const prefs = QuickFolders.Preferences;
    // load the different items
    const jsonList = JSON.stringify(findRel);
    await prefs.setStringPref("findRelated.list", jsonList);
  },

  readFindRelatedFromUI: async function () {
    function buildSelectionString(optionElements) {
      const fields = [];
      for (let f of optionElements) {
        if (f.checked) {
          fields.push(f.getAttribute("term"));
        }
      }
      return JSON.stringify(fields); // make these json arrays for easier storage
    }
    const search = {
      title: document.getElementById("findRelatedTitle").value,
      pattern: document.getElementById("findRelatedPattern").value,
      group: parseInt(document.getElementById("findRelatedGroup").value, 10) || 0,
    };
    const searchSelectedFields = document
      .getElementById("searchSelectedFields")
      .querySelectorAll("input[type=checkbox]");
    search.searchSelected = buildSelectionString(searchSelectedFields);

    const searchCriteriaFields = document
      .getElementById("searchCriteriaFields")
      .querySelectorAll("input[type=checkbox]");
    search.searchCriteria = buildSelectionString(searchCriteriaFields);
    return search;
  },

  addFindRelated: async function () {
    const listElement = document.getElementById("findRelatedList");
    const idx = listElement.selectedIndex;
    if (idx < 0) {return;}

    const search = await QuickFolders.Options.readFindRelatedFromUI();
    let findRelatedList = await QuickFolders.Options.loadFindRelated();
    
    QuickFolders.Util.logDebug("add to findRelated item:", {
      el: search,
    });
    findRelatedList.items.push(search);
    const option = new Option(search.title, findRelatedList.length); 
    option.value = listElement.options.length;
    listElement.options.add(option);

    QuickFolders.Util.logDebug("new findRelated item:", { search });
    this.storeFindRelated(findRelatedList);
    // select new element
    listElement.value = option.value;
  },

  updateFindRelated: async function () {
    QuickFolders.Util.logDebug("update");
    const listElement = document.getElementById("findRelatedList");
    // update element:
    const idx = listElement.selectedIndex;
    if (idx < 0) {return;}
    const search = await QuickFolders.Options.readFindRelatedFromUI();

    let findRelatedList = await QuickFolders.Options.loadFindRelated();
    QuickFolders.Util.logDebug("update findRelated item:", { el: findRelatedList.items[idx] });

    let selectedOption = listElement.options.item(idx);
    selectedOption.label = search.title; // only update title, update backend for the rest

    let theElement = findRelatedList.items[idx];
    for (const key in search) {
      // eslint-disable-next-line no-prototype-builtins
      if (search.hasOwnProperty(key)) {
        // Check if the property is one of the JSON string fields and convert as needed
        if (key === "searchSelected" || key === "searchCriteria") {
          try {
            theElement[key] = JSON.parse(search[key]) ? search[key] : "[]"; // string: json array
          } catch {
            // If it's not a valid JSON string, store it as a simple string
            theElement[key] = search[key];
          }
        } else {
          // Copy other properties as they are
          theElement[key] = search[key];
        }
      }
    }
    QuickFolders.Util.logDebug("updated item:", {
      element: theElement,
      index: idx,
      findRelatedList,
    });
    // if current one changed -  force reselecting the menuitem
    if (idx == (await QuickFolders.Preferences.getIntPref("findRelated.lastIdx"))) {
      QuickFolders.Preferences.setIntPref("findRelated.lastIdx",-1);
    }
    this.storeFindRelated(findRelatedList);
  },

  removeFindRelated: async function () {
    QuickFolders.Util.logDebug("remove findRelated");
    const findRelatedList = await QuickFolders.Options.loadFindRelated();
    const listElement = document.getElementById("findRelatedList");
    const idx = listElement.selectedIndex;
    if (idx < 0) {return;}
    QuickFolders.Util.logDebug("delete findRelated item:", { listElement });
    const deleted = findRelatedList.items.splice(idx, 1); // returns array of deleted
    listElement.remove(idx);
    QuickFolders.Util.logDebug("removed item:", { ...deleted });
    if (idx == (await QuickFolders.Preferences.getIntPref("findRelated.lastIdx"))) {
      QuickFolders.Preferences.setIntPref("findRelated.lastIdx", -1);
    }
    this.storeFindRelated(findRelatedList);
  },

  populateFindRelated: async function (listElement) {
    let findRelatedList = await QuickFolders.Options.loadFindRelated();
    QuickFolders.Util.logDebug(
      `populateFindRelated - ${findRelatedList.items.length} items`,
      listElement
    );
    // HTMLOptionsCollection
    for (let i = 0; i < findRelatedList.items.length; i++) {
      const item = findRelatedList.items[i];
      const option = new Option(item.title, i, i == 0, i == 0); // select first element
      listElement.options.add(option);
    }
    listElement.dispatchEvent(new Event("change", { bubbles: true }));
  },

  configureRelatedTab: async function () {
    // load the different items
    let findRelatedTab = document.querySelector(".qfFindRelated");
    if (!findRelatedTab.getAttribute("collapsed")) {
      let related = document.getElementById("findRelatedList");
      related.addEventListener("change", (evt) => {
        QuickFolders.Options.selectFindRelated_listItem(evt);
      });
      QuickFolders.Options.populateFindRelated(related);
      document.getElementById("addFindRelated").addEventListener("click", (_evt) => {
        QuickFolders.Options.addFindRelated();
      });
      document.getElementById("updateFindRelated").addEventListener("click", (_evt) => {
        QuickFolders.Options.updateFindRelated();
      });
      document.getElementById("deleteFindRelated").addEventListener("click", (_evt) => {
        QuickFolders.Options.removeFindRelated();
      });
    }
  },
};  // QuickFolders.Options

