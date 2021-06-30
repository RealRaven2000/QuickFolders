"use strict";
/* 
  BEGIN LICENSE BLOCK

  QuickFolders is released under the Creative Commons (CC BY-ND 4.0)
  Attribution-NoDerivatives 4.0 International (CC BY-ND 4.0) 
  For details, please refer to license.txt in the root folder of this extension

  END LICENSE BLOCK 
*/

var {Services} = ChromeUtils.import('resource://gre/modules/Services.jsm');

QuickFolders.Options = {
  optionsMode : "",  // filter out certain pages (for support / help only)
  message : "",      // alert to display on dialog opening (for certain update cases); make sure to clear out after use!
  QF_PREF_LAST : 5,    // last tab which can be filtered out
  QF_PREF_LICENSE : 5, // always show this one
  QF_PREF_SUPPORT : 4,
  QF_PREF_HELP : 3,
  QF_PREF_LAYOUT : 2,
  QF_PREF_ADVANCED : 1,
  QF_PREF_GENERAL : 0,
  prefMap : {},

  // save space, for visually impaired
  collapseHead: function collapseHead() {
    let hdr = document.getElementById('qf-header-container');
    hdr.setAttribute('collapsed', true);
    let panels = document.getElementById('QuickFolders-Panels');
    panels.style.minHeight = '';
    panels.style.overflowY = 'scroll';
    let prefpane = document.getElementById('qf-options-prefpane');
    prefpane.style.overflowY = 'scroll';;
  },
  
  rememberLastTab: function rememberLastTab() {
    let tabbox = document.getElementById("QuickFolders-Options-Tabbox");
    QuickFolders.Preferences.setIntPref('lastSelectedOptionsTab', tabbox.selectedIndex);
  } ,
  
  
  accept: function accept(evt) {
    const prefs = QuickFolders.Preferences;
    
    if (this.optionsMode=="helpOnly" || this.optionsMode=="supportOnly" || this.optionsMode=="licenseKey")
      return;
    let getElement = document.getElementById.bind(document);
    // persist color / text values
    try {
      prefs.CurrentThemeId = getElement("QuickFolders-Theme-Selector").value;

      prefs.setUserStyle("ActiveTab","background-color",
              getElement("activetab-colorpicker").value);
      prefs.setUserStyle("ActiveTab","color",
              getElement("activetab-fontcolorpicker").value);

      prefs.setUserStyle("InactiveTab","background-color",
              getElement("inactive-colorpicker").value);
      prefs.setUserStyle("InactiveTab","color",
              getElement("inactive-fontcolorpicker").value);

      prefs.setUserStyle("HoveredTab","background-color",
              getElement("hover-colorpicker").value);
      prefs.setUserStyle("HoveredTab","color",
              getElement("hover-fontcolorpicker").value);

      prefs.setUserStyle("DragTab","background-color",
              getElement("dragover-colorpicker").value);
      prefs.setUserStyle("DragTab","color",
              getElement("dragover-fontcolorpicker").value);

      prefs.setUserStyle("Toolbar","background-color",
              getElement("toolbar-colorpicker").value);
      prefs.setIntPref('style.corners.customizedTopRadiusN',
              getElement("QuickFolders-Options-CustomTopRadius").value);
      prefs.setIntPref('style.corners.customizedBottomRadiusN',
              getElement("QuickFolders-Options-CustomBottomRadius").value);

      prefs.setStringPref('currentFolderBar.background', 
                getElement("currentFolderBackground").value);
      // QuickFolders.Interface.setPaintButtonColor(-1);
      QuickFolders.Util.notifyTools.notifyBackground({ func: "initKeyListeners" }); // QuickFolders.initKeyListeners();
      
    }
    catch(e) {
      Services.prompt.alert(null,"QuickFolders","Error in QuickFolders:\n" + e);
    };
    this.rememberLastTab();
    QuickFolders.Util.notifyTools.notifyBackground({ func: "updateFoldersUI" }); // replaced QI.updateObserver
    return true;
  } ,
  
  close: function close() {
    if (this.optionsMode=="helpOnly" || this.optionsMode=="supportOnly" || this.optionsMode=="licenseKey")
      return;
    // let's remember the last open tab on cancel as well
    this.rememberLastTab(); 
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
  preparePreviewTab: function preparePreviewTab(colorPickerId, preference, previewId, paletteColor, paletteType) {
    const prefs = QuickFolders.Preferences;
    let wd = window.document,
        previewTab = wd.getElementById(previewId),
        colorPicker = colorPickerId ? wd.getElementById(colorPickerId) : null;
    
    // Address [Bug 25589] - when color is set from a drop down, the preference wasn't transmitted leading to wrong palette (always 1)
    if (!preference) {  
      switch(previewId) {
        case 'inactivetabs-label':
          preference = 'style.InactiveTab.';
          break;
        case 'activetabs-label':
          preference = 'style.ActiveTab.';
          break;
        case 'hoveredtabs-label':
          preference = 'style.HoveredTab.';
          break;
        case 'dragovertabs-label':
          preference = 'style.DragOver.';
          break;
      }
    }
    let paletteKey = (typeof paletteType === 'undefined') ? prefs.getIntPref(preference + 'paletteType') : paletteType,
        paletteClass = QuickFolders.Interface.getPaletteClassToken(paletteKey);
    
    
    if (paletteKey) { // use a palette
      let paletteIndex = (typeof paletteColor === 'undefined' || paletteColor === null) 
                         ? prefs.getIntPref(preference + 'paletteEntry') :
                         paletteColor;
                         
      // hide the color picker when not striped
      if (colorPicker) {
        if (colorPickerId=='inactive-colorpicker') {
          if (prefs.ColoredTabStyle==prefs.TABS_STRIPED)
            paletteIndex = '' + paletteIndex + 'striped';
        }
        else {
          // do not hide background color for active tab so we can adjust  
          // the bottom border color of the toolbar
          if (colorPickerId!='activetab-colorpicker')
            colorPicker.collapsed = true;
        }
      }
      
      previewTab.className = 'qfTabPreview col' + paletteIndex + paletteClass;
    }
    else {
      previewTab.className = 'qfTabPreview';
      if (colorPicker) {
        colorPicker.collapsed = false; // paletteKey = 0  ->  no palette
        let transcol =
          (previewId=='inactivetabs-label') 
            ? this.getTransparent(colorPicker.value, prefs.getBoolPref("transparentButtons"))
            : colorPicker.value;
        previewTab.style.backgroundColor = transcol;
      }
      
    }
  } ,
  
  getTransparent: function getTransparent(color, transparent) {
    return QuickFolders.Util.getRGBA(color, transparent ? 0.25 : 1.0);
  },
  
  stripedSupport: function stripedSupport(paletteType) {
    switch(parseInt(paletteType)) {
      case 1: // Standard Palette
        return true;
      case 2: // Pastel Palette
        return true;
      default: // 2 colors or  night vision do not support "striped" style
        return false;
    }
  } ,
  
  loadPreferences: function qf_loadPreferences() {
    const util = QuickFolders.Util;
    if (typeof Preferences == 'undefined') {
      util.logToConsole("Preferences is not defined - this shouldn't happen!");
      return;
    } 
    util.logDebug("loadPreferences - start:");
    
    let myprefElements = document.querySelectorAll("[preference]");
    let foundElements = {};
    for (let myprefElement of myprefElements) {
      let legacyPrefId = myprefElement.getAttribute("preference");
      foundElements[legacyPrefId] = myprefElement;
    }

    let myprefs = document.getElementsByTagName("preference");
    if (myprefs.length) {
      let prefArray = [];
      for (let it of myprefs) {
        let p = new Object(
          {
            id: it.getAttribute('name'), 
            name: it.getAttribute('name'),
            type: it.getAttribute('type') 
          }
        );
        this.prefMap[it.getAttribute('name')] =  it.getAttribute('id'); // store original Id!
        // not supported
        // if (it.getAttribute('instantApply') == "true") p.instantApply = true;
        prefArray.push(p);
          // manually change the shortname in the preference attribute to the actual
        // preference "id" (as in the preference manager)
        foundElements[it.id].setAttribute("preference", it.getAttribute("name"));
      }
      
      
      util.logDebug("Adding " + prefArray.length + " preferences to Preferences loader…")
      if (Preferences)
        Preferences.addAll(prefArray);
    }
    util.logDebug("loadPreferences - finished.");
  } ,
  
  load: async function load() {
    const util = QuickFolders.Util,
          prefs = QuickFolders.Preferences,
          QI = QuickFolders.Interface,
          options = QuickFolders.Options;
    
    // get important state info from background
    await QuickFolders.Util.init();
    
    let isOptionsTab = window.arguments && window.arguments.length>1;
          
    util.logDebug("QuickFolders.Options.load()");
    
    if (prefs.isDebugOption('options')) debugger;
    // version number must be copied over first!
    if (isOptionsTab && window.arguments[1].inn.instance) {
      // QuickFolders = window.arguments[1].inn.instance; // avoid creating a new QuickFolders instance, reuse the one passed in!!
      util.mExtensionVer = window.arguments[1].inn.instance.Util.Version;
    }
    let version = util.Version,
        wd = window.document,
        getElement = wd.getElementById.bind(wd);
    
    if (!version) debugger;
    
    util.logDebugOptional('options', 'QuickFolders.Options.load()');
    let modeNum = -1;
    if (isOptionsTab) {
      try {
        this.optionsMode = window.arguments[1].inn.mode;
        // force selection of a certain pane (-1 ignores)
        if (this.optionsMode) {
          switch (this.optionsMode) {
            case "helpOnly":
              modeNum = this.QF_PREF_HELP;
              break;
            case "supportOnly":
              modeNum = this.QF_PREF_SUPPORT;
              break;
            case "licenseKey":
              modeNum = this.QF_PREF_LICENSE;
              break;
          }
        }
        if (modeNum >= 0)
          prefs.setIntPref('lastSelectedOptionsTab', modeNum);
      }
      catch(e) {;}
    }
    
    // convert from string "24px" to number "24"
    let minToolbarHeight = prefs.getStringPref('toolbar.minHeight'),
        mT = parseInt(minToolbarHeight);
    if (minToolbarHeight.indexOf('px' > 0)) {
      prefs.setStringPref('toolbar.minHeight', mT.toString());
    }
    else if (minToolbarHeight.indexOf('em' > 0)) {
      // convert to px based on 12px default size (might be wrong for Mac+Linux)
      prefs.setStringPref('toolbar.minHeight', (mT*12).toString()) ;  // 12 px default font size.
    }

    if (version=="") version='version?';
    // Error: TypeError: 'getElementById' called on an object that does not implement interface Document.
    getElement("qf-options-header-description").setAttribute("value", version);
    let tabbox = getElement("QuickFolders-Options-Tabbox");
    
    getElement('chkShowRepairFolderButton').label = QI.getUIstring("qfFolderRepair","Repair Folder")
    
    /*****  License  *****/
    options.labelLicenseBtn(getElement("btnLicense"), "buy");
    getElement('txtLicenseKey').value = QuickFolders.Util.licenseInfo.licenseKey;    
    if (QuickFolders.Util.licenseInfo.licenseKey) {
      this.validateLicenseInOptions();      
    }
    // add an event listener for changes:
    window.addEventListener("QuickFolders.BackgroundUpdate", this.validateLicenseInOptions.bind(this));
    
    /*****  Help / Support Mode  *****/
    // hide other tabs
    let earlyExit = false;
    if (this.optionsMode=="helpOnly" || this.optionsMode=="supportOnly" || this.optionsMode=="licenseKey") {
      util.logDebugOptional('options', 'QuickFolders.Options.load - Single Tab Mode!');
      if (tabbox) {
        let keep = [];
        switch(this.optionsMode) {
          case "helpOnly":
            keep.push(this.QF_PREF_HELP);
            break;
          case "supportOnly":
            keep.push(this.QF_PREF_SUPPORT);
            break;
          case "licenseKey":
            keep.push(this.QF_PREF_LICENSE);
            break;
        }
        for (let i=this.QF_PREF_LAST; i>=0; i--) {
          if (!keep.includes(i)) {
            let panel = tabbox.tabpanels.children[i];
            util.logDebugOptional('options', 'collapsing panel: ' + panel.id + '…');
            panel.collapsed = true;
            // tabbox.tabpanels.removeChild(panel);
            tabbox.tabs.getItemAtIndex(i).collapsed = true; // removeItemAt();
          }
        }
      }
      earlyExit = true; // we do not set any values!
    }
    
    let displayPanel = null;
    switch(this.optionsMode) {
      case "licenseKey":
        displayPanel = getElement('QuickFolders-Options-goPro');
        break;
      case "helpOnly":
        displayPanel = getElement('QuickFolders-Options-quickhelp');
        break;
      case "supportOnly":
        displayPanel = getElement('QuickFolders-Options-support');
        break;
    }
    if (displayPanel) {
      // tabbox.selectedPanel = displayPanel;
      displayPanel.collapsed = false;
      // for some reason it always stays at the last one
      setTimeout(function() {
        tabbox.selectedPanel = displayPanel;
      }, 150);
      
    }
  
    if (earlyExit) return;
    if (QuickFolders.Util.licenseInfo.status == "Valid")
      setTimeout(function() { 
          util.logDebug('Remove animations in options dialog…');
          QI.removeAnimations('quickfolders-options.css');
        }
      );
    
    util.logDebugOptional('options', 'QuickFolders.Options.load - continue with palette + bling initialisation');
    /***** Menu Items / Labels *****/
    // bundle strings
    // getElement("chkShowFolderMenuButton").label = util.getBundleString("qfFolderPopup");
    this.setCurrentToolbarBackground(prefs.getStringPref('currentFolderBar.background.selection'), false);  

    /*****  Bling + Stuff  *****/
    // initialize colorpickers
    try {
      this.initBling(tabbox);
    }
    catch(e) {
      //alert("Error in QuickFolders.Options.load(initBling()):\n" + e);
      Services.prompt.alert(null,"QuickFolders","Error in QuickFolders.Options.load(initBling()):\n" + e);
    };    

    /***** Update message(s) *****/
    if (this.message && this.message!='') {
      //alert(message);
      Services.prompt.alert(null,"QuickFolders",message);
      message = '';
    }
    
    util.logDebugOptional('options', 'QuickFolders.Options.load - end with sizeToContent()');
    sizeToContent();
    
    // using main window elements to read system colors - should we do this via notifyTools, too?
    let main = util.getMail3PaneWindow(),
        getMainElement = main.QuickFolders.Util.$,
        mainToolbox = getMainElement('mail-toolbox'),
        messengerWin = getMainElement('messengerWindow'),
        backColor = main.getComputedStyle(mainToolbox).getPropertyValue("background-color"),
        backImage = main.getComputedStyle(messengerWin).getPropertyValue("background-image"),
        newTabMenuItem = getMainElement('folderPaneContext-openNewTab');
    if (newTabMenuItem && newTabMenuItem.label) {
      getElement('qfOpenInNewTab').label = newTabMenuItem.label.toString();
    }
        
    // where theme styling fails.   
    if (backColor) {
      if (prefs.isDebugOption('options')) debugger;
      getElement('qf-flat-toolbar').style.setProperty('background-color', backColor);     
      getElement('qf-header-container').style.setProperty('background-color', backColor);
    }
    if (backImage) {
      getElement('qf-flat-toolbar').style.setProperty('background-image', backImage);     
      getElement('qf-flat-toolbar').style.setProperty("background-position","right bottom");
      getElement('qf-header-container').style.setProperty('background-image', backImage);
      getElement('qf-header-container').style.setProperty("background-position","right top")
    }
    
    util.loadPlatformStylesheet(window);
    
    let panels = getElement('QuickFolders-Panels');
    window.addEventListener('dialogaccept', function () { QuickFolders.Options.accept(); });
    window.addEventListener('dialogcancel', function () { QuickFolders.Options.close(); });
    window.addEventListener('dialogextra2', function (event) { 
      setTimeout(
        function() { 
          QuickFolders.Interface.showLicenseDialog('options_' + QuickFolders.Options.currentOptionsTab); 
          window.close(); 
        }
      );
    });
    try {
      let selectOptionsPane = prefs.getIntPref('lastSelectedOptionsTab');
      if (selectOptionsPane >=0) {
        panels.selectedIndex = selectOptionsPane; // for some reason the tab doesn't get selected
        let firstTabOffset = (panels.tabbox.tabs.children[0].tagName == 'tab') ? 0 : 1;
        panels.tabbox.selectedTab = panels.tabbox.tabs.children[selectOptionsPane + firstTabOffset];
      }
    }
    catch(e) { ; }
    panels.addEventListener('select', function(evt) { QuickFolders.Options.onTabSelect(panels,evt); } );
    options.configExtra2Button();
    
    util.logDebug("QuickFolders.Options.load() - COMPLETE");
  },
  
  l10n: function l10n() {
    // [mx-l10n]
    QuickFolders.Util.localize(window, {extra2: 'qf.label.donate'});
    
    let supportLabel = document.getElementById('contactLabel'),
        supportString = QuickFolders.Util.getBundleString(
          "qf.description.contactMe",
          "You can also contact me directly via email.", 
          [QuickFolders.Util.ADDON_SUPPORT_MAIL]); // substitution parameter for 
    supportLabel.textContent = supportString;
  },
  
  initBling: function initBling (tabbox) {
    const util = QuickFolders.Util,
          prefs = QuickFolders.Preferences,
          QI =  QuickFolders.Interface;
    let wd = window.document,
        getElement = wd.getElementById.bind(wd),
        col = util.getSystemColor(prefs.getUserStyle("ActiveTab","color","#FFFFFF")), 
        bcol = util.getSystemColor(prefs.getUserStyle("ActiveTab","background-color","#000090"));
    getElement("activetab-colorpicker").value = bcol;
    getElement("activetab-fontcolorpicker").value = col;
    getElement("activetabs-label").style.setProperty('color', col, 'important');
    getElement("activetabs-label").style.backgroundColor = bcol;

    bcol = util.getSystemColor(prefs.getUserStyle("InactiveTab","background-color","buttonface"));
    getElement("inactive-colorpicker").value = bcol;

    //support transparency and shadow
    let transcol  =  this.getTransparent(bcol, prefs.getBoolPref("transparentButtons"));
    util.logDebug('inactivetabs-label: setting background color to ' + transcol);
    getElement("inactivetabs-label").style.backgroundColor = transcol;
    // this.showButtonShadow(prefs.getBoolPref("buttonShadows"));

    col = util.getSystemColor(prefs.getUserStyle("InactiveTab","color","buttontext"));
    getElement("inactive-fontcolorpicker").value = col;
    getElement("inactivetabs-label").style.setProperty('color', col, 'important');


    bcol = util.getSystemColor(prefs.getUserStyle("HoveredTab","background-color","#FFFFFF"));
    getElement("hover-colorpicker").value = bcol;
    col = util.getSystemColor(prefs.getUserStyle("HoveredTab","color","Black"));
    getElement("hover-fontcolorpicker").value = col;
    getElement("hoveredtabs-label").style.setProperty('color', col, 'important');
    getElement("hoveredtabs-label").style.backgroundColor = bcol;

    bcol = util.getSystemColor(prefs.getUserStyle("DragTab","background-color", "#E93903"));
    getElement("dragover-colorpicker").value = bcol;
    col = util.getSystemColor(prefs.getUserStyle("DragTab","color", "White"));
    getElement("dragover-fontcolorpicker").value = col;
    getElement("dragovertabs-label").style.setProperty('color', col, 'important');
    getElement("dragovertabs-label").style.backgroundColor = bcol;
    getElement("toolbar-colorpicker").value = util.getSystemColor(prefs.getUserStyle("Toolbar","background-color", "White"));
    // disable folder tree icons - not supported on Postbox+SeaMonkey
    getElement("chkShowIconButtons").collapsed = !prefs.supportsCustomIcon; 

    let currentTheme = this.selectTheme(wd, prefs.CurrentThemeId);

    // initialize Theme Selector by adding original titles to localized versions
    let cbo = getElement("QuickFolders-Theme-Selector");
    if (cbo.itemCount)
      for (let index = 0; index<cbo.itemCount; index++) {
        let item = cbo.getItemAtIndex( index ),
            theme = QuickFolders.Themes.Theme(item.value);
        if (theme) {
          if (item.label != theme.name)
            item.label = theme.name + ' - ' + item.label
        }
      }

    let menupopup = getElement("QuickFolders-Options-PalettePopup");
    QI.buildPaletteMenu(0, menupopup, true, true); // added parameter to force oncommand attributes back
    
    // customized coloring support
    this.initPreviewTabStyles();
    
    let paletteType = prefs.getIntPref('style.InactiveTab.paletteType'),
        disableStriped = !(this.stripedSupport(paletteType) || 
                           this.stripedSupport(prefs.getIntPref('style.ColoredTab.paletteType')) ||
                           this.stripedSupport(prefs.getIntPref('style.InactiveTab.paletteType')));
    
    getElement('qf-individualColors').collapsed = !currentTheme.supportsFeatures.individualColors;
    getElement('qf-individualColors').disabled = disableStriped;
    getElement('ExampleStripedColor').disabled = disableStriped;
    getElement('buttonTransparency').disabled = (paletteType!=0) && disableStriped; // only with "no colors"
  },

  trimLicense: function trimLicense() {
    const util = QuickFolders.Util;
    let txtBox = document.getElementById('txtLicenseKey'),
        strLicense = txtBox.value.toString();
    util.logDebug('trimLicense() : ' + strLicense);
    // Remove line breaks and extra spaces:
    let trimmedLicense =  
      strLicense.replace(/\r?\n|\r/g, ' ') // replace line breaks with spaces
        .replace(/\s\s+/g, ' ')            // collapse multiple spaces
        .replace('\[at\]','@')
        .trim();
    txtBox.value = trimmedLicense;
    util.logDebug('trimLicense() result : ' + trimmedLicense);
    return trimmedLicense;
  } ,
  
  selectQuickMoveFormat: function selectQuickMoveFormat(menuList) {
    let prefString1 = menuList.getAttribute('preference'),
        val = menuList.value;
    QuickFolders.Util.logDebug('Setting quick move format pref[' + prefString1 + ']: ' + val + '…');
    QuickFolders.Preferences.setIntPreference(prefString1, parseInt(val));
  } ,
  
  selectFolderCrossing: function selectFolderCrossing(menuList) {
    let prefString = menuList.getAttribute('preference'),
        val = menuList.value;
    QuickFolders.Util.logDebug('Setting folder crossing pref[' + prefString + ']: ' + val + '…');
    QuickFolders.Preferences.setIntPreference(prefString, parseInt(val));
  } ,
  
  enablePremiumConfig: function enablePremiumConfig(isEnabled) {
    let getElement      = document.getElementById.bind(document),
        premiumConfig   = getElement('premiumConfig'),
        quickJump       = getElement('chkQuickJumpHotkey'),
        quickMove       = getElement('chkQuickMoveHotkey'),
        quickCopy       = getElement('chkQuickCopyHotkey'),
        skipFolder      = getElement('chkSkipFolderHotkey'),
        quickJumpTxt    = getElement('qf-QuickJumpShortcut'),
        quickMoveTxt    = getElement('qf-QuickMoveShortcut'),
        quickCopyTxt    = getElement('qf-QuickCopyShortcut'),
        quickMoveAutoFill = getElement('chkQuickMoveAutoFill'),
        skipFolderTxt   = getElement('qf-SkipFolderShortcut'),
        quickMoveFormat = getElement('menuQuickMoveFormat'),
        quickMoveDepth  = getElement('quickmove-path-depth'),
        quickMoveAdvanced = getElement('quickMoveAdvanced'),
        multiCategories = getElement('chkCategories'),
        chkConfigIncludeTabs = getElement('chkConfigIncludeTabs'),
        chkConfigGeneral= getElement('chkConfigIncludeGeneral'),
        chkConfigLayout = getElement('chkConfigIncludeLayout'),
        btnLoadConfig   = getElement('btnLoadConfig');
    premiumConfig.disabled = !isEnabled;
    quickJump.disabled = !isEnabled;
    quickMove.disabled = !isEnabled;
    quickCopy.disabled = !isEnabled;
    skipFolder.disabled = !isEnabled;
    quickJumpTxt.disabled = !isEnabled;
    quickMoveTxt.disabled = !isEnabled;
    quickCopyTxt.disabled = !isEnabled;
    skipFolderTxt.disabled = !isEnabled;
    quickMoveFormat.disabled = !isEnabled;
    quickMoveDepth.disabled = !isEnabled;
    quickMoveAdvanced.disabled = !isEnabled;
    multiCategories.disabled = !isEnabled;
    quickMoveAutoFill.disabled = !isEnabled;
    chkConfigGeneral.disabled = !isEnabled;
    chkConfigIncludeTabs.disabled = !isEnabled;
    chkConfigLayout.disabled = !isEnabled;
    btnLoadConfig.disabled = !isEnabled;
  },
  
  // this function is called on load and from validateLicenseInOptions
  // was decryptLicense
  updateLicenseOptionsUI: async function updateLicenseOptionsUI() {
    const util = QuickFolders.Util;
    let getElement = document.getElementById.bind(document),
        validationPassed       = getElement('validationPassed'),
        validationFailed       = getElement('validationFailed'),
        validationInvalidAddon = getElement('validationInvalidAddon'),
        validationExpired      = getElement('validationExpired'),
        validationInvalidEmail = getElement('validationInvalidEmail'),
        validationEmailNoMatch = getElement('validationEmailNoMatch'),
        validationDate         = getElement('validationDate'),
        decryptedMail = QuickFolders.Util.licenseInfo.email , 
        decryptedDate = QuickFolders.Util.licenseInfo.expiryDate,
        result = QuickFolders.Util.licenseInfo.status;
    /* 1 - prepare UI */
    validationPassed.collapsed = true;
    validationFailed.collapsed = true;
    validationInvalidAddon.collapsed = true;
    validationExpired.collapsed = true;
    validationInvalidEmail.collapsed = true;
    validationEmailNoMatch.collapsed = true;
    validationDate.collapsed = false;
    this.enablePremiumConfig(false);
    try {
      getElement('licenseDate').value = decryptedDate; // invalid ??
      switch(result) {
        case "Valid":
          this.enablePremiumConfig(true);
          validationPassed.collapsed=false;
          getElement('dialogProductTitle').value = "QuickFolders Pro";
          break;
        case "Invalid":
          validationDate.collapsed=true;
          let addonName = '';
          switch (QuickFolders.Util.licenseInfo.licenseKey.substr(0,2)) {
            case 'QI':
              addonName = 'quickFilters';
              break;
            case 'ST':
              addonName = 'SmartTemplates';
              break;
            case 'QF':
            default: 
              validationFailed.collapsed=false;
          }
          if (addonName) {
            validationInvalidAddon.collapsed = false;
            let txt = validationInvalidAddon.textContent;
            txt = txt.replace('{0}','QuickFolders').replace('{1}','QF'); // keys for {0} start with {1}
            if (txt.indexOf(addonName) < 0) {
              txt += " " + util.getBundleString("qf.licenseValidation.guessAddon", "(The key above may be for {2})").replace('{2}',addonName);
            }
            validationInvalidAddon.textContent = txt;
          }
          break;
        case "Expired":
          validationExpired.collapsed=false;
          break;
        case "MailNotConfigured":
          validationDate.collapsed=true;
          validationInvalidEmail.collapsed=false;
          // if mail was already replaced the string will contain [mail address] in square brackets
          validationInvalidEmail.textContent = validationInvalidEmail.textContent.replace(/\[.*\]/,"{1}").replace("{1}", '[' + decryptedMail + ']');
          break;
        case "MailDifferent":
          validationFailed.collapsed=false;
          validationEmailNoMatch.collapsed=false;
          break;
        case "Empty":
          validationDate.collapsed=true;
          break;
        default:
          validationDate.collapsed=true;
          Services.prompt.alert(null,"QuickFolders",'Unknown license status: ' + result);
          break;
      }
    }    
    catch(ex) {
      util.logException("Error in QuickFolders.Options.updateLicenseOptionsUI():\n", ex);
    }
    return result;
  } ,  
  
  updateNavigationBar: function updateNavigationBar() {
    QuickFolders.Util.notifyTools.notifyBackground({ func: "updateNavigationBar" }); 
  },
  
  updateMainWindow: function updateMainWindow() {
    QuickFolders.Util.notifyTools.notifyBackground({ func: "updateMainWindow", minimal: "false" });
  },
  
  // send new key to background page for validation
  validateNewKey: async function validateNewKey() {
    this.trimLicense();
    let rv = await QuickFolders.Util.notifyTools.notifyBackground({ func: "updateLicense", key: document.getElementById('txtLicenseKey').value });
    // The backgrouns script will validate the new key and send a broadcast to all consumers on sucess.
    // In this script, the consumer is onBackgroundUpdate.
  },
  
  pasteLicense: function pasteLicense() {
    let trans = Components.classes["@mozilla.org/widget/transferable;1"].createInstance(Components.interfaces.nsITransferable),
        str       = {},
        strLength = {},
        finalLicense = '';        
    trans.addDataFlavor("text/unicode");
    var {Services} = ChromeUtils.import('resource://gre/modules/Services.jsm');
    
    if (Services.clipboard)
      Services.clipboard.getData(trans, Services.clipboard.kGlobalClipboard);

    trans.getTransferData("text/unicode", str, strLength);
    // Tb 66 strLength doesn't have a value attribute
    if (str && (strLength.value || str.value)) {
      let pastetext = str.value.QueryInterface(Components.interfaces.nsISupportsString).data,
          txtBox = document.getElementById('txtLicenseKey'),
          strLicense = pastetext.toString();
      txtBox.value = strLicense;
      finalLicense = this.trimLicense();
    }
    this.validateNewKey();
  } ,
  
  validateLicenseInOptions: function validateLicenseInOptions() {
    function replaceCssClass(el,addedClass) {
      if (!el) return;
      el.classList.add(addedClass);
      if (addedClass!='paid') el.classList.remove('paid');
      if (addedClass!='expired')  el.classList.remove('expired');
      if (addedClass!='free') el.classList.remove('free');
    }
    const util = QuickFolders.Util,
          options = QuickFolders.Options,
          prefs = QuickFolders.Preferences; 

    let wd = window.document,
        getElement = wd.getElementById.bind(wd),
        btnLicense = getElement("btnLicense"),
        proTab = getElement("QuickFolders-Pro");
    // old call to decryptLicense was here
    // 1 - sanitize License
    // 2 - validate license
    // 3 - update options ui with reaction messages; make expiry date visible or hide!; 
    this.updateLicenseOptionsUI(); // async!
    // this the updating the first button on the toolbar via the main instance
    // we use the quickfolders label to show if License needs renewal!
    // use notify tools for updating the [QuickFolders] label 
    QuickFolders.Util.notifyTools.notifyBackground({ func: "updateQuickFoldersLabel" }); // QI.updateQuickFoldersLabel();
    // 4 - update buy / extend button or hide it.
    let result = QuickFolders.Util.licenseInfo.status;
    switch(result) {
      case "Valid":
        let today = new Date(),
            later = new Date(today.setDate(today.getDate()+30)), // pretend it's a month later:
            dateString = later.toISOString().substr(0, 10);
        // if we were a month ahead would this be expired?
        if (QuickFolders.Util.licenseInfo.decryptedDate < dateString || prefs.getBoolPref("debug.premium.forceShowExtend")) {
          options.labelLicenseBtn(btnLicense, "extend");
        }
        else
          btnLicense.collapsed = true;
        replaceCssClass(proTab, 'paid');
        replaceCssClass(btnLicense, 'paid');
        break;
      case "Expired":
        options.labelLicenseBtn(btnLicense, "renew");
        replaceCssClass(proTab, 'expired');
        replaceCssClass(btnLicense, 'expired');
        btnLicense.collapsed = false;
        break;
      default:
        options.labelLicenseBtn(btnLicense, "buy");
        btnLicense.collapsed = false;
        replaceCssClass(btnLicense, 'register');
        replaceCssClass(proTab, 'free');
    }
    
    options.configExtra2Button();
    util.logDebug('validateLicense - result = ' + result);
  } ,
  
  // only for testing, hence no l10n !
  // if we add the secret encryption string(s) to our config db
  // we will be able to generate new license keys...
  encryptLicense: function encryptLicense() {
    throw('Encryption is not supported!');
  },
  
  selectTheme: function selectTheme(wd, themeId, isUpdateUI = false) {
    const util = QuickFolders.Util,
          QI = QuickFolders.Interface;
    let myTheme = QuickFolders.Themes.Theme(themeId),
        getElement = wd.getElementById.bind(wd);
    if (myTheme) {
      try {
        getElement("QuickFolders-Theme-Selector").value = themeId;
        getElement("Quickfolders-Theme-Author").value =  myTheme.author;

        // textContent wraps, value doesnt
        getElement("Quickfolders-Theme-Description").textContent
          = QI.getUIstring("qf.themes." + themeId + ".description", "N/A");

        getElement("qf-options-icons").disabled
          = !(myTheme.supportsFeatures.specialIcons);
        getElement("qf-options-shadow").disabled
          = !(myTheme.supportsFeatures.buttonShadows);

        getElement("button-font-size").disabled
          = !(myTheme.supportsFeatures.supportsFontSize);
        getElement("button-font-size-label").disabled
          = !(myTheme.supportsFeatures.supportsFontSize);
        
        getElement("btnHeightTweaks").collapsed
          = !(myTheme.supportsFeatures.supportsHeightTweaks);

        getElement("qf-tweakRadius").collapsed
          = !(myTheme.supportsFeatures.cornerRadius);
          
        getElement("qf-tweakToolbarBorder").collapsed
          = !(myTheme.supportsFeatures.toolbarBorder);

        getElement("qf-tweakColors").collapsed
          = !(myTheme.supportsFeatures.stateColors || myTheme.supportsFeatures.individualColors);

        getElement("qf-individualColors").collapsed
          = !(myTheme.supportsFeatures.individualColors);

        getElement("qf-StandardColors").collapsed
          = !(myTheme.supportsFeatures.standardTabColor);

        getElement("buttonTransparency").collapsed
          = !(myTheme.supportsFeatures.tabTransparency);


        getElement("qf-stateColors").collapsed
          = !(myTheme.supportsFeatures.stateColors);
          
        getElement("qf-stateColors-defaultButton").collapsed
          = !(myTheme.supportsFeatures.stateColors);
      }
      catch(ex) {
        util.logException('Exception during QuickFolders.Options.selectTheme: ', ex); 
      }

      /******  FOR FUTURE USE ??  ******/
      // if (myTheme.supportsFeatures.supportsFontSelection)
      // if (myTheme.supportsFeatures.buttonInnerShadows)
      util.logDebug ('Theme [' + myTheme.Id + '] selected');
      if (isUpdateUI) {
        QuickFolders.Util.notifyTools.notifyBackground({ func: "updateFoldersUI" }); 
      }
      
    }
    
    return myTheme;
  } ,
  
  BGCHOICE : {
    default: 0,
    dark: 1,
    translucent: 2,
    custom: 3,
    lightweight: 4
  } ,

  setDefaultButtonRadius: function setDefaultButtonRadius() {
    const prefs = QuickFolders.Preferences;
    document.getElementById('QuickFolders-Options-CustomTopRadius').value = "4";
    document.getElementById('QuickFolders-Options-CustomBottomRadius').value = "0";
    prefs.setIntPref('style.corners.customizedTopRadiusN', 4);
    prefs.setIntPref('style.corners.customizedBottomRadiusN', 0);
    QuickFolders.Util.notifyTools.notifyBackground({ func: "updateUserStyles" });  // main.QI.updateUserStyles
  },

  colorPickerTranslucent: function colorPickerTranslucent(picker) {
    document.getElementById('inactivetabs-label').style.backgroundColor=
      this.getTransparent(picker.value, document.getElementById('buttonTransparency').checked);
    this.styleUpdate('InactiveTab','background-color', picker.value);
  },
  
  sanitizeCSS: function sanitizeCSS(el) {
    const util = QuickFolders.Util;
    el.value = util.sanitizeCSSvalue(el.value);
  },

  // set the custom value entered by user (only if custom is actually selected)
  setCurrentToolbarBackgroundCustom: function setCurrentToolbarBackgroundCustom() {
    const prefs = QuickFolders.Preferences;   
    if (prefs.isDebugOption('options')) debugger;
    let setting = document.getElementById('currentFolderBackground'),
        backgroundCombo = document.getElementById('QuickFolders-CurrentFolder-Background-Select');    
    if (backgroundCombo.selectedIndex == this.BGCHOICE.custom) {
      // store the new setting!
      prefs.setStringPref('currentFolderBar.background.custom', setting.value);  
      this.setCurrentToolbarBackground('custom', true);
    }
    else {
      let item = backgroundCombo.getItemAtIndex( backgroundCombo.selectedIndex );
      this.setCurrentToolbarBackground(item.value, true);
    }
  } ,
  
  applyOrdinalPosition: function applyOrdinalPosition() {
    // refresh the toolbar button in main window(s)
    QuickFolders.Util.notifyTools.notifyBackground({ func: "updateMainWindow", minimal: "true" }); // QuickFolders.Interface.updateMainWindow(true);
  } ,
  
  // change background color for current folder bar
  // 5 choices [string]: default, dark, custom, translucent, lightweight
  setCurrentToolbarBackground: function setCurrentToolbarBackground(choice, withUpdate) {
    const util = QuickFolders.Util,
          prefs = QuickFolders.Preferences;
    let setting = document.getElementById('currentFolderBackground'),
        // store custom value, when going away from custom selection
        backgroundCombo = document.getElementById('QuickFolders-CurrentFolder-Background-Select');    
    util.logDebugOptional ('interface','Options.setCurrentToolbarBackground');
    if (backgroundCombo.selectedIndex == this.BGCHOICE.custom && choice != 'custom') {
      prefs.setStringPref('currentFolderBar.background.custom', setting.value);  
    }
  
    switch (choice) {
      case 'default':
        backgroundCombo.selectedIndex = this.BGCHOICE.default;
        setting.value = 'linear-gradient(to top, #FFF 7%, #BDB9BD 88%, #EEE 100%)';
        break;
      case 'dark':
        backgroundCombo.selectedIndex = this.BGCHOICE.dark;
        setting.value =  'linear-gradient(rgb(88, 88, 88), rgb(35, 35, 35) 45%, rgb(33, 33, 33) 48%, rgb(24, 24, 24))';
        break;
      case 'translucent':
        backgroundCombo.selectedIndex = this.BGCHOICE.translucent;
        setting.value = 'rgba(255, 255, 255, 0.2)';  // Gecko 1.9+
        break;
      case 'lightweight':
        backgroundCombo.selectedIndex = this.BGCHOICE.lightweight;
        setting.value = 'linear-gradient(to bottom, rgba(255, 255, 255, .4), transparent)';  
        break;
      case 'custom':
        backgroundCombo.selectedIndex = this.BGCHOICE.custom;
        // restore custom value
        setting.value = prefs.getStringPref('currentFolderBar.background.custom');  
        break;
    }
    let styleValue = setting.value;
    prefs.setStringPref('currentFolderBar.background', styleValue);
    prefs.setStringPref('currentFolderBar.background.selection', choice);
    if (Preferences) {
      Preferences.get('extensions.quickfolders.currentFolderBar.background')._value=styleValue;
    }
    // need to update current folder bar only
    if (withUpdate) {
      QuickFolders.Util.notifyTools.notifyBackground({ func: "updateNavigationBar" });  // main.QI.updateNavigationBar
    }
  },
  
  styleUpdate: function styleUpdate(elementName, elementStyle, styleValue, label ) {
    let util = QuickFolders.Util;
    util.logDebugOptional('interface.buttonStyles', 'styleUpdate(' + elementName + ', ' + elementStyle + ', ' + styleValue + ')');
    QuickFolders.Preferences.setUserStyle(elementName, elementStyle, styleValue);
    if (label) {
      switch(elementStyle) {
        case 'color':
          // like inline styling = highest priority
          document.getElementById(label).style.setProperty('color', styleValue, 'important'); 
          break;
        case 'background-color':
          document.getElementById(label).style.backgroundColor = styleValue; 
          break;
      }
    }
    QuickFolders.Util.notifyTools.notifyBackground({ func: "updateMainWindow", minimal: "true" });
                  // let updateResult = QuickFolders.Interface.updateMainWindow(true);
                  // util.logDebugOptional('interface.buttonStyles', 'styleUpdate() updateMainWindow returned ' + updateResult);
    return true;  // return updateResult;
  },

  setColoredTabStyleFromRadioGroup: function setColoredTabStyleFromRadioGroup(rgroup) {
    let styleId = parseInt(rgroup.value, 10);
    this.setColoredTabStyle(styleId, true);
  },
  
  // select: striped style / filled style
  setColoredTabStyle: function setColoredTabStyle(styleId, force) {
    const prefs = QuickFolders.Preferences,
          QI = QuickFolders.Interface;
    if (!force && prefs.getIntPref("colorTabStyle") == styleId)
      return; // no change!
    prefs.setIntPref("colorTabStyle", styleId); // 0 striped 1 filled
    QuickFolders.Util.notifyTools.notifyBackground({ func: "updateMainWindow", minimal: "false" }); // QI.updateMainWindow(false);
    
    let inactiveTab = document.getElementById('inactivetabs-label');
    QI.applyTabStyle(inactiveTab, styleId);
  }, 
  
  getButtonStatePrefId: function getButtonStatePrefId(buttonState) {
    switch(buttonState) {
      case 'colored':
        return 'ColoredTab';
      case 'standard':
        return 'InactiveTab';
      case 'active':
        return 'ActiveTab';
      case 'hovered':
        return 'HoveredTab';
      case 'dragOver':
        return 'DragOver';
      default:
        throw('QuickFolders.Options.getButtonStatePrefId - Invalid buttonState: ' + buttonState); // error!
    }
  } ,
  
  getButtonMenuId: function getButtonMenuId(buttonState) {
    switch(buttonState) {
      case 'colored':
        return 'menuColoredPalette';
      case 'standard':
        return 'menuStandardPalette';
      case 'active':
        return 'menuActiveTabPalette';
      case 'hovered':
        return 'menuHoverPalette';
      case 'dragOver':
        return 'menuDragOverPalette';
      default:
        throw('QuickFolders.Options.getButtonMenuId - Invalid buttonState: ' + buttonState); // error!
    }
  } ,
  
  /*********************
   * toggleUsePalette() 
   * Set whether (and which) palette is used for a particular tab state.
   * also hides background colorpicker if a palette is used
   * @mnuNode:       either a menuitem node or the menu with the correct paletteType value
   * @buttonState:   [string] which kind of tab state: standard, active, hovered, dragOver
   * @paletteType:   0 none, 1 plastic, 2 pastel, 3 night ....
   * @isUpdatePanelColor:  when switching palette type from dropdown, update color on button -> UI
   */  
  toggleUsePalette: function toggleUsePalette(mnuNode, buttonState, paletteType, isUpdatePanelColor) {
    //let isChecked = checkbox.checked;
    const prefs = QuickFolders.Preferences,
          QI = QuickFolders.Interface;
    let paletteTypeMenu = null,
        getElement = document.getElementById.bind(document);
    if (mnuNode.tagName) {
      switch(mnuNode.tagName) {
        case 'menulist':
          paletteTypeMenu = mnuNode;
          break;
        case 'menuitem':
          paletteTypeMenu = mnuNode.parentNode.parentNode;
          break;
      }
    }
    let idPreview = null,
        colorPicker = null,
        stylePref = this.getButtonStatePrefId(buttonState),
        isStripable = null,
        isTransparentSupport = false;
    switch(buttonState) {
      case 'colored':
        isStripable = this.stripedSupport(paletteType) || this.stripedSupport(prefs.getIntPref('style.ColoredTab.paletteType'));
        break;
      case 'standard':
        idPreview = 'inactivetabs-label';
        colorPicker = 'inactive-colorpicker';
        isStripable = this.stripedSupport(paletteType) || this.stripedSupport(prefs.getIntPref('style.ColoredTab.paletteType'));
        isTransparentSupport = (paletteType==0);
        break;
      case 'active':
        idPreview = 'activetabs-label';
        colorPicker = 'activetab-colorpicker';
        break;
      case 'hovered':
        idPreview = 'hoveredtabs-label';
        colorPicker = 'hover-colorpicker';
        break;
      case 'dragOver':
        idPreview = 'dragovertabs-label';
        colorPicker = 'dragover-colorpicker';
        break;
    }
    if (isStripable && paletteType==3) isStripable = false;
    if (isUpdatePanelColor) {
      getElement('buttonTransparency').disabled = !isTransparentSupport;
      // do not allow striped style if Night Vision is selected
      // [Bug 26348] 
      if (isStripable === null) {
          isStripable = this.stripedSupport(prefs.getIntPref('style.ColoredTab.paletteType'))
                        ||
                        this.stripedSupport(prefs.getIntPref('style.InactiveTab.paletteType'));
      }
      
      if (!isStripable) {
        this.setColoredTabStyle(prefs.TABS_FILLED);
      }
      getElement('qf-individualColors').disabled = !isStripable;
      getElement('ExampleStripedColor').disabled = !isStripable;
    }
    
    // preparePreviewTab(id, preference, previewId)
    prefs.setIntPref('style.' + stylePref + '.paletteType', paletteType);
    if (colorPicker) {
      this.preparePreviewTab(colorPicker, 'style.' + stylePref + '.', idPreview, null, paletteType);
      // we need to force reselect the palette entry of the button
      // to update font & background color
      if (isUpdatePanelColor) {
        let m = getElement('QuickFolders-Options-PalettePopup');
        if (m) {
          // if (!m.targetNode)
          m.targetNode = (buttonState == 'colored') ? 
                         null : getElement(QI.getPreviewButtonId(buttonState));
          // retrieve palette index
          let col = prefs.getIntPref('style.' + stylePref + '.paletteEntry');
          QI.setTabColorFromMenu(m.firstChild, col.toString()); // simulate a menu item!
        }
      }
    }
  },
  
  /*********************  
   *  showPalette()       
   *  open palette popup   
   *  @label              parent node  
   *  @buttonState        'standard', 'active', 'hovered', 'dragOver'
   *  {paletteMenuId}     'menuStandardPalette', 'menuActivePalette', 'menuHoverPalette', 'menuDragOverPalette'
   */
  showPalette: function showPalette(label, buttonState) {
    let id = label ? label.id : label.toString(),
        paletteMenuId = this.getButtonMenuId(buttonState),
        paletteMenu = document.getElementById(paletteMenuId);
    const QI = QuickFolders.Interface;
    QuickFolders.Util.logDebugOptional("interface", "Options.showPalette(" + id + ", " + buttonState + ")");
    if (paletteMenu) {
      if (paletteMenu.value == "0") {
        return;  // no menu, as 2 colors / no palette is selected
      }
      this.toggleUsePalette(paletteMenu, buttonState, paletteMenu.value, false);
      // allow overriding standard background for striped style!
      // Now style the palette with the correct palette class
      let context = label.getAttribute('context'),
          menu = document.getElementById(context);
      menu.className = 'QuickFolders-folder-popup' + QI.getPaletteClass(this.getButtonStatePrefId(buttonState));
    }
    QI.showPalette(label);
  },

  changeTextPreference: function changeTextPreference(txtBox) {
    let prefString = txtBox.getAttribute("preference");
    
    if (Preferences.get(prefString)) 
      QuickFolders.Preferences.setIntPreference(prefString, txtBox.value);
    else
      QuickFolders.Util.logToConsole('changeTextPreference could not find pref string: '  + prefString); 
    
    QuickFolders.Util.notifyTools.notifyBackground({ func: "updateMainWindow", minimal: "false" });
    // return QuickFolders.Interface.updateMainWindow(false);
    return true;
  },
  
  // doing what instantApply really should provide...
  toggleBoolPreference: function toggleBoolPreference(cb, noUpdate) {
    const util = QuickFolders.Util;
    let prefString = cb.getAttribute("preference");
    //  using the new preference system, this attribute should be the actual full string of the pref.
    //  pref = document.getElementById(prefString);
    
    if (prefString)
      QuickFolders.Preferences.setBoolPrefVerbose(prefString, cb.checked);  
    if (noUpdate)
      return true;
    switch (prefString) {
      case 'extensions.quickfolders.collapseCategories':
        QuickFolders.Util.notifyTools.notifyBackground({ func: "updateCategoryBox" }); // QI.updateCategoryLayout();
        return false;
    }
    // broadcast change of current folder bar for all interested windows.
    if (prefString.includes(".currentFolderBar.")) {
      QuickFolders.Util.notifyTools.notifyBackground({ func: "updateNavigationBar" }); 
      return true;
    }
    QuickFolders.Util.notifyTools.notifyBackground({ func: "updateMainWindow", minimal: "false" }); // force full update
    // return QI.updateMainWindow(false); 
    return true;
  },
  
  toggleColorTranslucent: function toggleColorTranslucent(cb, pickerId, label, userStyle) {
    let picker = document.getElementById(pickerId);
    document.getElementById(label).style.backgroundColor=
      this.getTransparent(picker.value, cb.checked);
    if (userStyle)
      QuickFolders.Preferences.setUserStyle(userStyle, 'background-color', picker.value);

    let prefString = cb.getAttribute("preference");
    if (prefString)
      QuickFolders.Preferences.setBoolPrefVerbose(prefString, cb.checked);
    
    QuickFolders.Util.notifyTools.notifyBackground({ func: "updateMainWindow", minimal: "true" }); 
    // return QuickFolders.Interface.updateMainWindow(true);
    return true;
  },
  
  // switch pastel mode on preview tabs
  initPreviewTabStyles: function initPreviewTabStyles() {
    let getElement = document.getElementById.bind(document),
        inactiveTab = getElement('inactivetabs-label'),
        activeTab = getElement('activetabs-label'),
        hoverTab = getElement('hoveredtabs-label'),
        dragTab = getElement('dragovertabs-label'),
        menupopup = getElement("QuickFolders-Options-PalettePopup");
    
    this.preparePreviewTab('inactive-colorpicker', 'style.InactiveTab.', 'inactivetabs-label');
    this.preparePreviewTab('activetab-colorpicker', 'style.ActiveTab.', 'activetabs-label');
    this.preparePreviewTab('hover-colorpicker', 'style.HoveredTab.', 'hoveredtabs-label');
    this.preparePreviewTab('dragover-colorpicker', 'style.DragOver.', 'dragovertabs-label');

  } ,

  // toggle pastel mode was toggleColorPastel
  // NEEDS A REWRITE FOR MULTIPLE PALETTES!
  showPalettePreview: function showPalettePreview(withUpdate) {
    let defaultPalette = QuickFolders.Preferences.getIntPref('style.InactiveTab.paletteType'),
        isPastel = (defaultPalette == 2),
        getElement = document.getElementById.bind(document);
    
    getElement('ExampleStripedColor').src=
      isPastel ? "chrome://quickfolders/content/skin/ico/striped-example-pastel.gif" : "chrome://quickfolders/content/skin/ico/striped-example.gif";
    getElement('ExampleFilledColor').src=
      isPastel ? "chrome://quickfolders/content/skin/ico/full-example-pastel.gif" : "chrome://quickfolders/content/skin/ico/full-example.gif";

    let picker = getElement('inactive-colorpicker');
  
    getElement('activetabs-label').style.backgroundColor=
      this.getTransparent(picker.value, isPastel);
    QuickFolders.Preferences.setUserStyle('InactiveTab','background-color', picker.value);
    QuickFolders.Preferences.setBoolPref('pastelColors', isPastel);
    
    this.initPreviewTabStyles();
    
    if (withUpdate) {
      QuickFolders.Util.notifyTools.notifyBackground({ func: "updateMainWindow" }); // QuickFolders.Interface.updateMainWindow();
    }
  },

  showButtonShadow: function showButtonShadow(isChecked) {
    let el= document.getElementById('inactivetabs-label'),
        myStyle = !isChecked ? "1px -1px 3px -1px rgba(0,0,0,0.7)" : "none";
    el.style.MozBoxShadow = myStyle;
    QuickFolders.Preferences.setBoolPref('buttonShadows', !isChecked);
    QuickFolders.Util.notifyTools.notifyBackground({ func: "updateMainWindow", minimal: "true" }); // return QuickFolders.Interface.updateMainWindow(true);
    return true;
  },

  // Set Default Colors (partly from system colors) 
  //   - will be converted to rgb values to avoid error messages on color pickers
  setDefaultColors: function setDefaultColors() {
    let util = QuickFolders.Util,
        highlightColor = util.getSystemColor("Highlight"),
        highlightTextColor = util.getSystemColor("HighlightText"),
        buttonfaceColor = util.getSystemColor("buttonface"),
        buttontextColor = util.getSystemColor("buttontext"),
        getElement = document.getElementById.bind(document);

    getElement("activetab-colorpicker").value = highlightColor;
    getElement("activetabs-label").style.backgroundColor = highlightColor;
    getElement("activetab-fontcolorpicker").value = highlightTextColor;
    getElement("activetabs-label").style.color = highlightTextColor;

    getElement("hover-colorpicker").value = util.getSystemColor("orange");
    getElement("hover-fontcolorpicker").value = "#FFF";
    getElement("hoveredtabs-label").style.color = "#FFF";
    getElement("hoveredtabs-label").style.backgroundColor = util.getSystemColor("orange");

    getElement("dragover-colorpicker").value = "#E93903";
    getElement("dragover-fontcolorpicker").value = "#FFF";
    getElement("dragovertabs-label").style.color = "#FFF";
    getElement("dragovertabs-label").style.backgroundColor = "#E93903";

    getElement("toolbar-colorpicker").value = buttonfaceColor;
    getElement("inactive-colorpicker").value = buttonfaceColor;
    getElement("inactivetabs-label").style.backgroundColor = buttonfaceColor;
    getElement("inactive-fontcolorpicker").value = buttontextColor;
    getElement("inactivetabs-label").style.color = buttontextColor;
    QuickFolders.Util.notifyTools.notifyBackground({ func: "updateMainWindow", minimal: "false" }); // return QuickFolders.Interface.updateMainWindow();
    return true;
  },

  sendMail: function sendMail(mailto = QuickFolders.Util.ADDON_SUPPORT_MAIL) {
    let prompts = Components.classes["@mozilla.org/embedcomp/prompt-service;1"]
                                  .getService(Components.interfaces.nsIPromptService),
        util = QuickFolders.Util,       
        title = util.getBundleString('qf.prompt.contact.title', "Contact QuickFolders Support"),
        text = util.getBundleString('qf.prompt.contact.subject', "Please enter a short subject line:"),
        input = {value: ""},
        check = {value: false},
        result = prompts.prompt(window, title, text, input, null, check); 
    if (!result) return;
    
    let subjectline = "[QuickFolders] " + util.Version + " " + input.value,
        sURL="mailto:" + mailto + "?subject=" + encodeURI(subjectline), // urlencode
        MessageComposer=Components.classes["@mozilla.org/messengercompose;1"].getService(Components.interfaces.nsIMsgComposeService),
        // make the URI
        ioService = Components.classes["@mozilla.org/network/io-service;1"]
              .getService(Components.interfaces.nsIIOService),
        aURI = ioService.newURI(sURL, null, null);
    window.close();
    // open new message
    MessageComposer.OpenComposeWindowWithURI (null, aURI);
  },
  
  pasteFolderEntries: function pasteFolderEntries() {
    const Cc = Components.classes,
          Ci = Components.interfaces,
          service = Cc["@mozilla.org/preferences-service;1"].getService(Ci.nsIPrefBranch),
          util = QuickFolders.Util,
          prefs = QuickFolders.Preferences;
    let trans = Components.classes["@mozilla.org/widget/transferable;1"].createInstance(Ci.nsITransferable),
        str       = {},
        strLength = {},
        strFoldersPretty = '';

    util.popupProFeature("pasteFolderEntries");
        
    trans.addDataFlavor("text/unicode");
    var {Services} = ChromeUtils.import('resource://gre/modules/Services.jsm');
    
    if (Services.clipboard) 
      Services.clipboard.getData(trans, Services.clipboard.kGlobalClipboard);
    trans.getTransferData("text/unicode", str, strLength);
    
    
    if (str) {
      let pastetext = str.value.QueryInterface(Components.interfaces.nsISupportsString).data;
      strFoldersPretty = pastetext.toString();
    }
    try {
      let folders = strFoldersPretty.replace(/\r?\n|\r/, ''),
          entries = JSON.parse(folders),
          question = util.getBundleString('qf.prompt.pasteFolders', 
            "This will delete all QuickFolders tabs and replace with the items in your clipboard." +
            "\n{0} entries were found in clipboard." +
            "\nAre you sure?");
      if (Services.prompt.confirm(window, "QuickFolders", question.replace("{0}", entries.length))) {
        for (let i = 0; i < entries.length; i++) {
          if (typeof entries[i].tabColor ==='undefined' || entries[i].tabColor ==='undefined')
            entries[i].tabColor = 0;
          // default the name!!
          if (!entries[i].name) {
            // retrieve the name from the folder uri (prettyName)
            let f = QuickFolders.Model.getMsgFolderFromUri(entries[i].uri, false);
            if (f)
              entries[i].name = f.prettyName;
          }
        }
        if (!entries.length)
          entries=[];
        util.getMail3PaneWindow().QuickFolders.initTabsFromEntries(entries);
        question = util.getBundleString('qf.prompt.pasteFolders.confirm', "Keep resulting Tabs?");
        if (Services.prompt.confirm(window, "QuickFolders", question)) {
          // store
          prefs.storeFolderEntries(entries);
          // tell all windows!
          QuickFolders.Util.notifyTools.notifyBackground({ func: "updateAllTabs" });
        }
        else {
          // roll back
          util.getMail3PaneWindow().QuickFolders.initTabsFromEntries(prefs.loadFolderEntries());
        }
        
      }
    }
    catch (ex) {
      util.logException("Error in QuickFolders.Options.pasteFolderEntries():\n", ex);
      Services.prompt.alert(null,"QuickFolders", util.getBundleString('qf.alert.pasteFolders.formatErr', "Could not create tabs. See error console for more detail."));
    }
    
  },
  
  copyFolderEntries: function copyFolderEntries() {
    // debug function for checking users folder string (about:config has trouble with editing JSON strings)
    const Cc = Components.classes,
          Ci = Components.interfaces,
          service = Cc["@mozilla.org/preferences-service;1"].getService(Ci.nsIPrefBranch),
          util = QuickFolders.Util;

    try {
      let clipboardhelper = Cc["@mozilla.org/widget/clipboardhelper;1"].getService(Ci.nsIClipboardHelper),
          sFolderString = service.getStringPref("QuickFolders.folders");

      util.logToConsole("Folder String: " & sFolderString);
      try {
        // format the json
        let prettyFolders = JSON.stringify(JSON.parse(sFolderString), null, '  '); 
        clipboardhelper.copyString(prettyFolders);
      }
      catch (e) {
        util.logException("Error prettifying folder string:\n", e);
        clipboardhelper.copyString(sFolderString);
      }
      let out = util.getBundleString("qfAlertCopyString", "Folder String copied to clipboard."),
          mail3PaneWindow = util.getMail3PaneWindow();
      
      if (mail3PaneWindow && mail3PaneWindow.QuickFolders) {
        out += " [" + mail3PaneWindow.QuickFolders.Model.selectedFolders.length + " folders]";
      }
      //alert(out);
      Services.prompt.alert(null,"QuickFolders",out);
    }
    catch(e) {
      //alert(e);
      Services.prompt.alert(null,"QuickFolders",e);
    }

  },

  configureTooltips: function configureTooltips(btn) {
    setTimeout( function () {
      QuickFolders.Options.showAboutConfig(btn, 'extensions.quickfolders.tooltips', true, true);
      } );  
  },
  
  showAboutConfig: function showAboutConfig(clickedElement, filter, readOnly, updateUI) {
    const Cc = Components.classes,
          Ci = Components.interfaces,
          util = QuickFolders.Util;
    updateUI = (typeof updateUI != 'undefined') ? updateUI : false;
    
    util.logDebug('showAboutConfig(clickedElement: ' 
      + (clickedElement ? clickedElement.tagName : 'none') 
      + ', filter: ' + filter 
      + ', readOnly: ' + readOnly +')');
      // "chrome://global/content/config.xul?debug"
    const name = "Preferences:ConfigManager";
    let uri = "chrome://global/content/config.xhtml";

    let mediator = Cc["@mozilla.org/appshell/window-mediator;1"].getService(Ci.nsIWindowMediator),
        w = mediator.getMostRecentWindow(name),
        // set parent window
        win = (clickedElement && clickedElement.ownerDocument && clickedElement.ownerDocument.defaultView)
            ? clickedElement.ownerDocument.defaultView 
            : window;
    if (!w) {
      let watcher = Cc["@mozilla.org/embedcomp/window-watcher;1"].getService(Ci.nsIWindowWatcher),
          width = (util.HostSystem == 'linux') ? "650px" : "500px",
          height = (util.HostSystem == 'linux') ? "320px" : "300px",
          features = "alwaysRaised,dependent,chrome,resizable,width="+ width + ",height=" + height;
      if (util.HostSystem == 'winnt')
        w = watcher.openWindow(win, uri, name, features, null);
      else
        w = win.openDialog(uri, name, features);
    }
    if (updateUI) {
      // make sure QuickFolders UI is updated when about:config is closed.
      w.addEventListener('unload', function(event) { 
        QuickFolders.Util.notifyTools.notifyBackground({ func: "updateMainWindow", minimal: "false" }); // QuickFolders.Interface.updateMainWindow(); 
      });
    }
    w.focus();
    w.addEventListener('load', 
      function () {
        util.logDebug('showAboutConfig() : setting config Filter.\nreadonly = ' + readOnly);
        let flt = w.document.getElementById("textbox");
        if (flt) {
           flt.value=filter;
          // make filter box readonly to prevent damage!
           if (!readOnly)
            flt.focus();
           else
            flt.setAttribute('readonly',true);
           if (w.self.FilterPrefs) {
            w.self.FilterPrefs();
          }
        }
        else
          util.logDebug('filter textbox not found');
      });
  },

  showVersionHistory: function showVersionHistory(ask) {
    let util = QuickFolders.Util,
        pureVersion=util.VersionSanitized,
        sPrompt = util.getBundleString("qfConfirmVersionLink", "Display version history for QuickFolders");
    if (!ask || confirm(sPrompt + " " + pureVersion + "?")) {
      util.openURL(null, 
        util.makeUriPremium("https://quickfolders.org/version.html")
        + "#" + pureVersion);
      return true;
    }
    return false;
  },
  
  // 3pane window only?
  toggleNavigationBar: function toggleNavigationBar(chk, selector) {
    let checked = chk.checked ? chk.checked : false;
    QuickFolders.Preferences.setShowCurrentFolderToolbar(checked, selector);
    // we should not call displayNavigationToolbar directly but use the event broadcaster to notify all windows.
    QuickFolders.Util.notifyTools.notifyBackground({ func: "toggleNavigationBar" }); 
  },
  
  get currentOptionsTab() {
    let tabpanels = document.getElementById('QuickFolders-Panels');
    switch (tabpanels.selectedPanel.id) {
      case 'QuickFolders-Options-general':
        return 'generalTab';
      case 'QuickFolders-Options-advanced':
        return 'advancedTab';
      case 'QuickFolders-Options-layout':
        return 'defaultTab';
      case 'QuickFolders-Options-quickhelp':
        return 'quickhelpTab';
      case 'QuickFolders-Options-support':
        return 'supportTab';
      case 'QuickFolders-Options-goPro':
      default:
        return 'licenseTab';
    }
  },
  
  tabIdFromIndex : function tabIdFromIndex(idx) {
    switch (tabpanels.selectedPanel.id) {
      case 0:
        return 'QuickFolders-Options-general';
      case 1:
        return 'QuickFolders-Options-advanced';
      case 2:
        return 'QuickFolders-Options-layout';
      case 3:
        return 'QuickFolders-Options-quickhelp';
      case 4:
        return 'QuickFolders-Options-support';
      case 5:
        return 'QuickFolders-Options-goPro';
      default:
        return '';
    }
  },
    
  onTabSelect: function onTabSelect(element, event) {
    let el = event.target;
    if (el.selectedPanel) {
      QuickFolders.Options.configExtra2Button(el);
      QuickFolders.Util.logDebug('Tab Select: ' + element.id + ' selected panel = ' + el.selectedPanel.id);
    }
  },
  
  configExtra2Button: function configExtra2Button(el) {
    const prefs = QuickFolders.Preferences,
          util = QuickFolders.Util,
          options = QuickFolders.Options,
          State = QuickFolders.Util.licenseInfo.status;
    try {
    let donateButton = document.documentElement.getButton('extra2');
    if(!el) el = document.getElementById("QuickFolders-Panels");
      switch (el.selectedPanel.id) {
        case 'QuickFolders-Options-goPro':
          donateButton.collapsed = true;
          break;
        default:
          donateButton.collapsed = false;
          if (!prefs.getStringPref('LicenseKey')) {
            options.labelLicenseBtn(donateButton, "buy");
            donateButton.addEventListener(
              "click", 
              function(event) { 
                QuickFolders.Interface.showLicenseDialog('licenseTab'); 
              }, 
              false);
          }
          else {
            switch (State) {
              case "NotValidated":
                // options.labelLicenseBtn(donateButton, "buy"); // hide?
                break;
              case "Expired":
                options.labelLicenseBtn(donateButton, "renew");
                break;
              case "Valid":
                donateButton.collapsed = true;
                break;
              case "Invalid":
                options.labelLicenseBtn(donateButton, "buy");
                break;
              default:
                options.labelLicenseBtn(donateButton, "buy");
                break;
            }
            
          }
      }
    } catch(ex) {util.logException("configExtra2Button()",ex);}
  },
  
  // put appropriate label on the license button and pass back the label text as well
  labelLicenseBtn: function labelLicenseBtn(btnLicense, validStatus) {
    const prefs = QuickFolders.Preferences,
          util = QuickFolders.Util;
    switch(validStatus) {
      case  "extend":
        let txtExtend = util.getBundleString("qf.notification.premium.btn.extendLicense", "Extend License!");
        btnLicense.collapsed = false;
        btnLicense.label = txtExtend; // text should be extend not renew
        btnLicense.setAttribute('tooltiptext',
          util.getBundleString("qf.notification.premium.btn.extendLicense.tooltip", 
            "This will extend the current license date by 1 year. It's typically cheaper than a new license."));
        return txtExtend;
      case "renew":
        let txtRenew = util.getBundleString("qf.notification.premium.btn.renewLicense", "Renew License!");
        btnLicense.label = txtRenew;
        return txtRenew;
      case "buy":
        let buyLabel = util.getBundleString("qf.notification.premium.btn.getLicense", "Buy License!");
        btnLicense.label = buyLabel;
        return buyLabel;
    }
    return "";
  },
  
  quickMoveAdvancedSettings: function quickMoveAdvancedSettings() {
    let params = {inn:{mode:"allOptions", instance: QuickFolders}, out:null},
        win = window.openDialog('chrome://quickfolders/content/quickmove.xhtml',
          'quickfolders-search-options',
          'chrome,titlebar,centerscreen,resizable,alwaysRaised,instantApply',
          QuickFolders,
          params).focus();
       
  },
  
  /*******************************************
  /**   moved from quickfolders-util.js     **
  /*******************************************/
	addConfigFeature: function addConfigFeature(filter, Default, textPrompt) {
		// adds a new option to about:config, that isn't there by default
		if (confirm(textPrompt)) {
			// create (non existent filter setting:
			QuickFolders.Preferences.setBoolPrefVerbose(filter, Default);
			QuickFolders.Options.showAboutConfig(null, filter, true, false);
		}
	},
	
	storeConfig: function qf_storeConfig(preferences, prefMap) {
		// see options.copyFolderEntries
    const Cc = Components.classes,
          Ci = Components.interfaces,
		      service = Cc["@mozilla.org/preferences-service;1"].getService(Ci.nsIPrefBranch),
					util = QuickFolders.Util,
					prefs = QuickFolders.Preferences,
					sFolderString = service.getStringPref("QuickFolders.folders");
		let obj = JSON.parse(sFolderString),
        storedObj = { folders: obj }; // wrap into "folders" subobject, so we can add more settings

		// add more settings here! (should we include license string?)
		if (preferences) {
			let prefInfos = preferences.getAll();
			storedObj.general = [];
			storedObj.advanced = [];
			storedObj.layout = [];
			storedObj.userStyle = [];
			let isLicense =  (QuickFolders.Util.licenseInfo.isExpired || QuickFolders.Util.licenseInfo.isValidated);
			if (isLicense)
				storedObj.premium = [];
      util.logDebug("Storing configuration...")

			for (let info of prefInfos) {
        let originId = prefMap[info.id];
				let node = { key: info.id, val: info.value, originalId: originId }
        if (originId) {
          switch (originId.substr(0,5)) {
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
              if (isLicense)
                storedObj.premium.push(node);
              break;
            default:
              util.logDebug("Not storing - unknown preference category: " + node.key);
          }
        }
        else {
          util.logDebug("Not found - map entry for " + info.id);
        }
			}
			// now save all color pickers.
			let elements = document.getElementsByTagName('html:input');
			for (let i=0; i<elements.length; i++) {
				let element = elements[i];
				if (element.getAttribute('type')=='color') {
					let node = { elementInfo: element.getAttribute('elementInfo'), val: element.value };
					storedObj.userStyle.push(node);
				}
			}
      
      // [issue 115] store selection for background dropdown
      const bgKey = 'currentFolderBar.background.selection';
      let backgroundSelection = prefs.getStringPref(bgKey);
      storedObj.layout.push({
        key: 'extensions.quickfolders.' + bgKey, 
        val: backgroundSelection, 
        originalId: 'qfpa-CurrentFolder-Selection'} 
      );
      
		}

		let prettifiedJson = JSON.stringify(storedObj, null, '  ');
		this.fileConfig('save', prettifiedJson, 'QuickFolders-Config');
    util.logDebug("Configuration stored.")
	} ,

	loadConfig: function qf_loadConfig(preferences) {
    const prefs = QuickFolders.Preferences,
          options = QuickFolders.Options,
				  util = QuickFolders.Util;

		function changePref(pref) {
			let p = preferences.get(pref.key);
			if (p) {
				if (p._value != pref.val) {
          // [issue 115] fix restoring of config values
					util.logDebug("Changing [" + p.id + "] " + pref.originalId + " : " + pref.val);
					p._value = pref.val;
          let e = foundElements[pref.key];
          if (e) {
            switch(e.tagName) {
              case 'checkbox':
                e.checked = pref.val;
                if (e.getAttribute('oncommand'))
                  e.dispatchEvent(new Event("command"));
                break;
              case 'textbox': // legacy
              case 'html:input':
              case 'html:textarea':
                e.value = pref.val;
                if (e.id == "currentFolderBackground") {
                  options.setCurrentToolbarBackgroundCustom();
                }
                break;
              case 'menulist':
                e.selectedIndex = pref.val;
                let menuitem = e.selectedItem;
                if (menuitem && menuitem.getAttribute('oncommand'))
                  menuitem.dispatchEvent(new Event("command"));
                break;
              case 'radiogroup':
                e.value = pref.val;
                if (e.getAttribute('oncommand'))
                  e.dispatchEvent(new Event("command"));
              default:
                debugger;
                break;
            }
          }
				}
			}
      else {
        switch(pref.key) {
          case 'extensions.quickfolders.currentFolderBar.background.selection':
            if (pref.val && prefs.getStringPref(pref.key) != pref.val) {
              options.setCurrentToolbarBackground(pref.val, true);
            }
            break;
          default:
            util.logDebug("loadConfig - unhandled preference: " + pref.key);
        }
      }
		}
    
    function readData(dataString) {
			const Cc = Components.classes,
						Ci = Components.interfaces,
						service = Cc["@mozilla.org/preferences-service;1"].getService(Ci.nsIPrefBranch),
            QI = QuickFolders.Interface;
			try {
				// removes prettyfication:
				let config = dataString.replace(/\r?\n|\r/, ''),
						data = JSON.parse(config),
				    entries = data.folders,
            isLayoutModified = false,
						question = util.getBundleString('qf.prompt.restoreFolders',
							"This will delete all QuickFolders tabs and replace with the items from the file." +
							"\n{0} entries were read." +
							"\nReplace tabs?");
				if (prefs.getBoolPref('restoreConfig.tabs')
				   && Services.prompt.confirm(window, "QuickFolders", question.replace("{0}", entries.length))) {
					for (let ent of entries) {
						if (typeof ent.tabColor ==='undefined' || ent.tabColor ==='undefined')
							ent.tabColor = 0;
						// default the name!!
						if (!ent.name) {
							// retrieve the name from the folder uri (prettyName)
							let f = QuickFolders.Model.getMsgFolderFromUri(ent.uri, false);
							if (f)
								ent.name = f.prettyName;
							else
								ent.name = util.getNameFromURI(ent.uri);
						}
					}
					if (!entries.length)
						entries=[];
					// the following function calls this.updateMainWindow() which calls this.updateFolders()
					util.getMail3PaneWindow().QuickFolders.initTabsFromEntries(entries);
					let invalidCount = 0,
					    modelEntries = util.getMail3PaneWindow().QuickFolders.Model.selectedFolders;
					// updateFolders() will append "invalid" property into entry of main model if folder URL cannot be found
					for (let i=0; i<modelEntries.length; i++) {
						if (modelEntries[i].invalid)
							invalidCount++;
					}

					question = util.getBundleString('qf.prompt.loadFolders.confirm', "Accept the loaded Tabs?");
					if (invalidCount) {
						let wrn =
						  util.getBundleString('qfInvalidTabCount', "Found {0} Tabs that have an invalid folder destination. You can remove these using the 'Find orphaned Tabs' command.");
						question = wrn.replace("{0}", invalidCount) + "\n" + question;
					}
					if (Services.prompt.confirm(window, "QuickFolders", question)) {
						// store
						prefs.storeFolderEntries(entries);
            // notify all windows
            QuickFolders.Util.notifyTools.notifyBackground({ func: "updateAllTabs" });
					}
					else {
						// roll back
						util.getMail3PaneWindow().QuickFolders.initTabsFromEntries(prefs.loadFolderEntries());
					}
					delete data.folders; // remove this part to move on to the rest of settings
				}
        // ====================================================================
        // [issue 107] Restoring general / layout Settings only works if option for restoring folders also active
        if (prefs.getBoolPref('restoreConfig.general') && data.general) {
          for (let i=0; i<data.general.length; i++) {
            changePref(data.general[i]);
          }
          isLayoutModified = true;
        }
        if (prefs.getBoolPref('restoreConfig.layout')) {
          if (data.layout) {
            for (let i=0; i<data.layout.length; i++) {
              changePref(data.layout[i]);
            }
            isLayoutModified = true;
          }
          if (data.advanced) {
            for (let i=0; i<data.advanced.length; i++) {
              changePref(data.advanced[i]);
            }
          }

          if (data.premium) {
            for (let i=0; i<data.premium.length; i++) {
              changePref(data.premium[i]);
            }
          }
          // load custom colors and restore color pickers
          // options.styleUpdate('Toolbar', 'background-color', this.value, 'qf-StandardColors')
          if (data.userStyle) {
            let elements = document.getElementsByTagName('html:input');
            for (let i=0; i<elements.length; i++) {
              let element = elements[i];
              try {
                if (element.getAttribute('type')=='color') {
                  let elementInfo = element.getAttribute('elementInfo');
                  // find the matching entry from json file
                  for(let j=0; j<data.userStyle.length; j++) {
                    let jnode = data.userStyle[j];
                    if (jnode.elementInfo == elementInfo) {
                      // only change value if nevessary
                      if (element.value != jnode.val) {
                        element.value = jnode.val; // change color picker itself
                        util.logDebug("Changing [" + elementInfo + "] : " + jnode.val);
                        let info = jnode.elementInfo.split('.');
                        if (info.length == 2)
                          options.styleUpdate(
                            info[0],   // element name e..g. ActiveTab
                            info[1],   // element style (color / background-color)
                            jnode.val,
                            element.getAttribute('previewLabel')); // preview tab / label
                      }
                      break;
                    }
                  }
                  // QuickFolders.Preferences.setUserStyle(elementName, elementStyle, styleValue)
                }
              }
              catch(ex) {
                util.logException("Loading layout setting[" + i + "] (color picker " + element.id + ") failed:", ex);
              }
            }
          }

        }
        if (isLayoutModified) { // instant visual feedback
          //  update the main window layout
          QuickFolders.Util.notifyTools.notifyBackground({ func: "updateFoldersUI" }); // replaced QI.updateObserver();
        }
        
			}
			catch (ex) {
				util.logException("Error in QuickFolders.Options.pasteFolderEntries():\n", ex);
				Services.prompt.alert(null,"QuickFolders", util.getBundleString('qf.alert.pasteFolders.formatErr', "Could not create tabs. See error console for more detail."));
			}
		}
    // find all controls with bound preferences
    let myprefElements = document.querySelectorAll("[preference]"),
		    foundElements = {};
		for (let myprefElement of myprefElements) {
      let prefName = myprefElement.getAttribute("preference");
			foundElements[prefName] = myprefElement;
		}	
		this.fileConfig('load', null, null, readData); // load does the reading itself?
	} ,

	fileConfig: function qf_fileConfig(mode, jsonData, fname, readFunction) {
		const Cc = Components.classes,
          Ci = Components.interfaces,
          util = QuickFolders.Util,
					prefs = QuickFolders.Preferences,
					NSIFILE = Ci.nsILocalFile || Ci.nsIFile;
		util.popupProFeature(mode + "_config"); // save_config, load_config
    let filterText,
		    fp = Cc['@mozilla.org/filepicker;1'].createInstance(Ci.nsIFilePicker),
        fileOpenMode = (mode=='load') ? fp.modeOpen : fp.modeSave;

		let dPath = prefs.getStringPref('files.path');
		if (dPath) {
			let defaultPath = Cc["@mozilla.org/file/local;1"].createInstance(NSIFILE);
			defaultPath.initWithPath(dPath);
			if (defaultPath.exists()) { // avoid crashes if the folder has been deleted
				fp.displayDirectory = defaultPath; // nsILocalFile
				util.logDebug("Setting default path for filepicker: " + dPath);
			}
			else {
				util.logDebug("fileFilters()\nPath does not exist: " + dPath);
			}
		}
		fp.init(window, "", fileOpenMode); // second parameter: prompt
    filterText = util.getBundleString("qf.fpJsonFile","JSON File");
    fp.appendFilter(filterText, "*.json");
    fp.defaultExtension = 'json';
    if (mode == 'save') {
			let fileName = fname;
/*
			if (isDateStamp) {
				let d = new Date(),
				    timeStamp = d.getFullYear() + "-" + twoDigs(d.getMonth()+1) + "-" + twoDigs(d.getDate()) + "_" + twoDigs(d.getHours()) + "-" + twoDigs(d.getMinutes());
				fileName = fname + "_" + timeStamp;
			}
			*/
      fp.defaultString = fileName + '.json';
    }

    let fpCallback = function fpCallback_FilePicker(aResult) {
      if (aResult == Ci.nsIFilePicker.returnOK || aResult == Ci.nsIFilePicker.returnReplace) {
        if (fp.file) {
          let path = fp.file.path;
					// Store last Path
					util.logDebug("File Picker Path: " + path);
					let lastSlash = path.lastIndexOf("/");
					if (lastSlash < 0) lastSlash = path.lastIndexOf("\\");
					let lastPath = path.substr(0, lastSlash);
					util.logDebug("Storing Path: " + lastPath);
					prefs.setStringPref('files.path', lastPath);

					const {OS} = (typeof ChromeUtils.import == "undefined") ?
						Components.utils.import("resource://gre/modules/osfile.jsm", {}) :
						ChromeUtils.import("resource://gre/modules/osfile.jsm", {});

          //localFile = Components.classes["@mozilla.org/file/local;1"].createInstance(Ci.nsILocalFile);
          switch (mode) {
            case 'load':
              let promiseRead = OS.File.read(path, { encoding: "utf-8" }); //  returns Uint8Array
              promiseRead.then(
                function readSuccess(data) {
                  readFunction(data);
                },
                function readFailed(ex) {
                  util.logDebug ('read() - Failure: ' + ex);
                }
              )
              break;
            case 'save':
              // if (aResult == Ci.nsIFilePicker.returnReplace)
              let promiseDelete = OS.File.remove(path);
              // defined 2 functions
              util.logDebug ('Setting up promise Delete');
              promiseDelete.then (
                function saveJSON() {
                  util.logDebug ('saveJSON()…');
                  // force appending correct file extension!
                  if (!path.toLowerCase().endsWith('.json'))
                    path += '.json';
                  let promiseWrite = OS.File.writeAtomic(path, jsonData, { encoding: "utf-8"});
                  promiseWrite.then(
                    function saveSuccess(byteCount) {
                      util.logDebug ('successfully saved ' + byteCount + ' bytes to file');
                    },
                    function saveReject(fileError) {  // OS.File.Error
                      util.logDebug ('bookmarks.save error:' + fileError);
                    }
                  );
                },
                function failDelete(fileError) {
                  util.logDebug ('OS.File.remove failed for reason:' + fileError);
                }
              );
              break;
          }
        }
      }
    }
    fp.open(fpCallback);

    return true;
 		
	},
  

}

window.document.addEventListener('DOMContentLoaded', 
  QuickFolders.Options.l10n.bind(QuickFolders.Options) , 
  { once: true });
  
window.addEventListener('load', 
  QuickFolders.Options.load.bind(QuickFolders.Options) , 
  { once: true });
  



