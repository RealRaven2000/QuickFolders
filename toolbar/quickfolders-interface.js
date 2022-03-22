"use strict";
/* BEGIN LICENSE BLOCK

QuickFolders is released under the Creative Commons (CC BY-ND 4.0)
Attribution-NoDerivatives 4.0 International (CC BY-ND 4.0) 
For details, please refer to license.txt in the root folder of this extension

END LICENSE BLOCK */


QuickFolders.Interface = {


	get verticalMenuOffset() { return this._verticalMenuOffset; },
	set verticalMenuOffset(o) { this._verticalMenuOffset = o; QuickFolders.Preferences.setIntPref("debug.popupmenus.verticalOffset", o)},
	get CategoryBox() { return  QuickFolders.Util.$("QuickFolders-Category-Box"); },
	get FilterToggleButton() { return QuickFolders.Util.$("QuickFolders-filterActive"); },
	get CurrentFolderTab() {
    // retrieves the Visible current folder tab - might have to move it in Tb for conversation view
    return QuickFolders.Util.$("QuickFoldersCurrentFolder");
  },
	get CurrentFolderRemoveIconBtn() { return QuickFolders.Util.$("QuickFolders-RemoveIcon");},
  get CurrentFolderSelectIconBtn() { return QuickFolders.Util.$("QuickFolders-SelectIcon");},
	get CurrentFolderBar() { return QuickFolders.Util.$("QuickFolders-CurrentFolderTools");},
	get CurrentFolderFilterToggleButton() { return QuickFolders.Util.$("QuickFolders-currentFolderFilterActive"); },
	get CogWheelPopupButton () { return QuickFolders.Util.$("QuickFolders-mainPopup"); },
	get QuickMoveButton () { return QuickFolders.Util.$("QuickFolders-quickMove"); },
  get ReadingListButton () { return QuickFolders.Util.$("QuickFolders-readingList"); },
	get CategoryMenu() { return QuickFolders.Util.$("QuickFolders-Category-Selection"); },
	get PaintButton() { return QuickFolders.Util.$("QuickFolders-paintBucketActive"); },
	get MailButton() { return QuickFolders.Util.$("QuickFolders-CurrentMail"); },
	get TitleLabel() { return QuickFolders.Util.$("QuickFolders-title-label"); },
	get TitleLabelBox() { return QuickFolders.Util.$("QuickFolders-LabelBox"); },
	get FoldersBox() { return QuickFolders.Util.$("QuickFolders-FoldersBox"); },
	get Toolbar() { return QuickFolders.Util.$("QuickFolders-Toolbar"); },
	get PalettePopup() { return QuickFolders.Util.$("QuickFolders-PalettePopup");},
	get FindFolderBox() { return QuickFolders.Util.$("QuickFolders-FindFolder");},
  get FindFolderHelp() { return QuickFolders.Util.$("QuickFolders-FindFolder-Help");},

  getPreviewButtonId: function getPreviewButtonId(previewId) {
		switch(previewId) {
			case "standard":
        return "inactivetabs-label";
			case "active":
        return "activetabs-label";
			case "hovered":
        return "hoveredtabs-label";
			case "dragOver":
        return "dragovertabs-label";
			default:
				QuickFolders.Util.logDebug("QuickFolders.Interface.getPreviewButtonId - Invalid previewId: " + previewId);
        return null;
		}
  } ,
  
  //returns full path of quickfolders-palettes.css
	get PaletteStyleSheet() {
		return "/toolbar/css/quickfolders-palettes.css"; // or possibly "css/quickfolders-palettes.css"
	} ,  

	updateFolders: function updateFolders(rebuildCategories, minimalUpdate) {
    const prefs = QuickFolders.Preferences,
					util = QuickFolders.Util;
		util.logDebugOptional("interface", "updateFolders(rebuildCategories=" + rebuildCategories + ", minimalUpdate=" + minimalUpdate + ")");
		this.TimeoutID=0;

		let showToolIcon = prefs.isShowToolIcon && !QuickFolders.FilterWorker.FilterMode;

		if (this.CogWheelPopupButton)
			this.CogWheelPopupButton.collapsed = !showToolIcon || this.PaintModeActive;
    if (this.ReadingListButton)
      this.ReadingListButton.collapsed = !prefs.isShowReadingList;

    if (this.QuickMoveButton)
      this.QuickMoveButton.collapsed = !prefs.isShowQuickMove;

		if (minimalUpdate)
			this.updateCategoryLayout();

		if (rebuildCategories || prefs.isMinimalUpdateDisabled)
			minimalUpdate = false;

		let sDebug = "updateFolders(rebuildCategories: " + rebuildCategories + ", minimal: " + minimalUpdate +")",
		    toolbar = this.Toolbar,
		    theme = prefs.CurrentTheme;
		toolbar.className = theme.cssToolbarClassName; //  + " chromeclass-toolbar" [Bug 26612]
    toolbar.classList.add("contentTabToolbar"); // Linux

		this.FoldersBox.className = "folderBarContainer " + theme.cssToolbarClassName; // [Bug 26575]

		if (QuickFolders.Model.selectedFolders.length)
			sDebug += " - Number of Folders = " + QuickFolders.Model.selectedFolders.length;

		util.logDebug(sDebug);

		if (!minimalUpdate) {
			this.buttonsByOffset = [];
			this.menuPopupsByOffset = [];

			util.clearChildren(this.FoldersBox, rebuildCategories);

			this.updateQuickFoldersLabel();

			if (rebuildCategories || null==this.CategoryMenu)
				this.updateCategories();
		}


		let offset = 0;

		// Recent Folders tab
		if (prefs.isShowRecentTab) {
			if (minimalUpdate ) {
				offset++;
			}
			else
			{
				let rtab = this.createRecentTab(null, false, null);
				if (rtab) {
					this.FoldersBox.appendChild(rtab);
					offset++;
				}
			}
		}

		let countFolders = 0;
		// force user colors on first updateFolders (no selected Folder yet!)
		if (QuickFolders.Model.selectedFolders.length) {

			let tabStyle = prefs.ColoredTabStyle,
			    isFirst = true,
					invalidCount=0,
          countValidTabs = 0,
          hasLicense = (util.licenseInfo.status == "Valid");
          
			for (let i = 0; i < QuickFolders.Model.selectedFolders.length; i++) {
				let folderEntry = QuickFolders.Model.selectedFolders[i],
				    folder, button;

				if (!this.shouldDisplayFolder(folderEntry))
					continue;

				folder = QuickFolders.Model.getMsgFolderFromUri(folderEntry.uri, false);
				countFolders++;
				if (!folder) {
					invalidCount++;
				}
				if (!minimalUpdate) {
					// restore invalid folders, too
					button = this.addFolderButton(folder, folderEntry, offset, null, null, tabStyle, isFirst);
					if (button) {
						if (!folder || typeof folder.server == "undefined")  {
							button.setAttribute("folderURI", folderEntry.uri);
							folderEntry.invalid = true; // add invalid to entry!
						}
            else
              countValidTabs++;
              
						this.buttonsByOffset[offset] = button;
						isFirst = false;
						offset++;
					}
				}
				else {
					// now just update the folder count on the button label, if it changed.
					// button is not newly created. Also it is not recolored.
					if (folder) {
						button = this.getButtonByFolder(folder);
						if (button) {
							this.addFolderButton(folder, folderEntry, offset, button, null, tabStyle, isFirst, minimalUpdate);
							isFirst = false;
							offset++;
              countValidTabs++;
						}
					}
				}
        
        if (!hasLicense) {
          if (countValidTabs>QuickFolders.Model.MAX_UNPAID_TABS) { // no license restriction
            button.setAttribute("disabled",true);
          }          
        } 
        else if (util.licenseInfo.keyType == 2) { // Standard License restriction
          if (countValidTabs>QuickFolders.Model.MAX_STANDARD_TABS) {
            button.setAttribute("disabled",true);
          }          
        }
			}


			let sDoneWhat = minimalUpdate ? "refreshed on toolbar [minimalUpdate]." : "rebuilt [minimalUpdate=false].";
			util.logDebug(countFolders + " of " + QuickFolders.Model.selectedFolders.length + " tabs " + sDoneWhat);
			if (invalidCount)
				util.logDebug("{0} invalid tabs where found!\n Please check with find orphaned tabs tool.".replace("{0}", invalidCount));
		}
    else { // no tabs defined : add instructions label
      let existingLabel = this.FoldersBox.querySelector("#QuickFolders-Instructions-Label");
      if (!existingLabel) {
        let label = document.createXULElement('label'),
            txt = util.getBundleString("qf.label.dragFolderLabel");
        label.id = "QuickFolders-Instructions-Label";
        label.classList.add("QuickFolders-Empty-Toolbar-Label");
        label.setAttribute("crop","end");
        label.textContent = txt;
        this.FoldersBox.appendChild(label);
      }
    }

		// [Bug 25598] highlight active tab
    if (!minimalUpdate)
      this.lastTabSelected = null;  // reset to force highlight active tab
		this.onTabSelected();

		// current message dragging
		let button = this.MailButton;
		if (button)
			this.setEventAttribute(button, "ondragstart","QuickFolders.messageDragObserver.startDrag(event,true)");

		// current thread dragging; let's piggyback "isThread"...
		// use getThreadContainingMsgHdr(in nsIMsgDBHdr msgHdr) ;
		button = util.$("QuickFolders-CurrentThread");
		if (button)
			this.setEventAttribute(button, "ondragstart","event.isThread=true; QuickFolders.messageDragObserver.startDrag(event,true)");
		if (prefs.isShowCategoryNewCount) {

		}
	} ,

  updateAllTabs: function () {
    QuickFolders.initTabsFromEntries(QuickFolders.Preferences.loadFolderEntries());
    //mx// QuickFolders.Interface.updateFolders(true, false);
  },
  
  // more comprehensive function to update both folder look and all styles (will be called from Options dialog via event listener)
  updateFoldersUI: function () {
    QuickFolders.Util.logDebug("updateFoldersUI()...");
    QuickFolders.Interface.updateFolders(true, false);
		QuickFolders.Interface.updateUserStyles();
  },
  
	updateNavigationBar: function updateNavigationBar(styleSheet) {
    QuickFolders.Util.logToConsole("TO DO: implement updateNavigationBar");
	} ,
  
  updateCategoryLayout: function updateCategoryLayout() {
    QuickFolders.Util.logToConsole("TO DO: implement updateCategoryLayout");
  },
  
  updateCategories: function updateCategories() {
    QuickFolders.Util.logToConsole("TO DO: implement updateCategories");
  },
  
  updateMainWindow: function updateMainWindow(minimal) {
    QuickFolders.Util.logToConsole("TO DO: implement updateMainWindow");
  },
  
  _selectedCategories: null,
	get currentActiveCategories() {
    return this._selectedCategories;
  } ,
  set currentActiveCategories(v) {
		const util = QuickFolders.Util;
    this._selectedCategories = v; // set menuitem value?
    let menulist = this.CategoryMenu,
        cats = v.split("|"),
				txtDebug = "";
		try {
			if (menulist) {
				menulist.value = v;
				// if multiple select, check all boxes
				for (let i=0; i<menulist.itemCount; i++) {
					let it = menulist.getItemAtIndex(i);
          if (it.tagName!="menuitem") continue;
					let isSelected = (cats.includes(it.value));
					if (isSelected) {
						txtDebug += "Check menuitem: " + it.value + "\n";
						it.setAttribute("checked", isSelected); // check selected value
					}
					else {
						it.removeAttribute("checked");
					}
				}
			}
			util.logDebugOptional("categories","set currentActiveCategories()\n" + txtDebug);
			if (v!=null)
				QuickFolders.Preferences.lastActiveCats = v; // store in pref
		}
		catch (ex) {
			util.logException("Error in setter: currentActiveCategories", ex);
		}
  } ,

	get CurrentlySelectedCategories() {
    const FCat = QuickFolders.FolderCategory;
		if (this.currentActiveCategories == FCat.ALL || this.currentActiveCategories == FCat.UNCATEGORIZED ) {
			return null;
		}
		else {
			return this.currentActiveCategories;
		}
	} ,

	// this is used on session restore currently only by Postbox
	restoreCategories: function restoreCategories(tabIndex, categories) {
    const util = QuickFolders.Util;
		let tabmail = document.getElementById("tabmail"),
		    info = util.getTabInfoByIndex(tabmail, tabIndex);
		info.QuickFoldersCategory = categories;
		let tab = tabmail.selectedTab;
		if (tab == info) {
			// current Tab:
			QuickFolders.Interface.selectCategory(categories, false);
		}
	} ,
  
  // problem - we cannot add a title attribute in HTML
	getStyleSheet: function getStyleSheet(engine, Name, Title) {
		let sheet = QuickFolders.Styles.getMyStyleSheet(Name, Title); // ignore engine
		if (!sheet) {
			QuickFolders.Interface.ensureStyleSheetLoaded(Name, Title);
			sheet = QuickFolders.Styles.getMyStyleSheet(Name, Title);
		}

		if (!sheet) {
			sheet = QuickFolders.Styles.getMyStyleSheet(Name, Title);
			QuickFolders.Util.logToConsole("ensureStyleSheetLoaded() - missing style sheet '" +  Name + "' - not found = not attempting any style modifications.");
		}
		return sheet;
	} ,
  
	// HOVER STATE
	initHoverStyle: async function initHoverStyle(ss, ssPalettes, isPaintMode) {
	  if (ssPalettes == null)
		  ssPalettes = ss;
		let templateTabClass =  isPaintMode ? "ColoredTab" : "HoveredTab",
		    paletteClass = this.getPaletteClassCss(templateTabClass);
		QuickFolders.Util.logDebugOptional("interface.buttonStyles", "initHoverStyle()  PaintMode=" + isPaintMode + "   paletteClass=" + paletteClass);
		let engine = QuickFolders.Styles,
        prefs = QuickFolders.Preferences,
		    hoverBackColor = await prefs.getUserStyle("HoveredTab","background-color","#F90"),
		    tabStyle = prefs.ColoredTabStyle,
		    noColorClass = (tabStyle != prefs.TABS_STRIPED) ? "col0" : "col0striped",
		    hoverColor = await prefs.getUserStyle(templateTabClass, "color", "#000000"),
        avoidCurrentFolder = ":not(#QuickFoldersCurrentFolder)";

		// default hover colors: (not sure if we even need them during paint mode)
		engine.setElementStyle(ss, ".quickfolders-flat toolbarbutton:hover","background-color", hoverBackColor,true);
		engine.setElementStyle(ss, ".quickfolders-flat toolbarbutton." + noColorClass + ":hover","background-color", hoverBackColor,true);
    engine.setElementStyle(ss, ".quickfolders-flat toolbarbutton." + noColorClass + ":hover .toolbarbutton-text","color", hoverColor, true); // [issue 81] - add selector for label
    engine.setElementStyle(ss, ".quickfolders-flat toolbarbutton." + noColorClass + ":hover .toolbarbutton-icon","color", hoverColor, true); // [issue 81] - add selector for icon

		let paintButton = isPaintMode ? this.PaintButton : null;

		QuickFolders.Util.logDebugOptional("interface.buttonStyles", "style." + templateTabClass + ".paletteType = "
		  + prefs.getIntPref("style." + templateTabClass + ".paletteType"));

		if (prefs.getIntPref("style.HoveredTab.paletteType") || isPaintMode) {
			let paletteEntry =
				isPaintMode
				? paintButton.getAttribute("colorIndex")
				: prefs.getIntPref("style.HoveredTab.paletteEntry");
			if (!paletteEntry)
				paletteEntry = 1;
			// extract current gradient from style sheet rule:
			let ruleName = ".quickfolders-flat " + paletteClass + ".col" + paletteEntry,
			    hoverGradient = engine.getElementStyle(ssPalettes, ruleName, "background-image");
			QuickFolders.Util.logDebugOptional("interface.buttonStyles", "setting hover gradient[" + ruleName + "]: " + hoverGradient + "\nisPaintMode = " + isPaintMode);

			// build some rules..
			// remove +paletteClass from rule as this should always apply!
			engine.setElementStyle(ss, ".quickfolders-flat toolbarbutton"  + ":hover", "background-image", hoverGradient, true); // [class^="col"]
			engine.setElementStyle(ss, ".quickfolders-flat toolbarbutton"  + "." + noColorClass + ":hover", "background-image", hoverGradient, true);

			// picked hover color (from paint mode)
			//let hc = engine.getElementStyle(ssPalettes, ruleName, "color");
			//hoverColor = hc ? hc : hoverColor;
      // tb + avoidCurrentFolder
			engine.setElementStyle(ss, ".quickfolders-flat toolbarbutton:hover","color", hoverColor, true);
			engine.setElementStyle(ss, '.quickfolders-flat toolbarbutton[buttonover="true"]',"color", hoverColor, true);
		}
		else { // two color mode
			QuickFolders.Util.logDebugOptional("interface.buttonStyles", "Configure Plain backgrounds…");
			engine.setElementStyle(ss, ".quickfolders-flat toolbarbutton" + paletteClass + ":hover", "background-image", "none", true);
			engine.setElementStyle(ss, ".quickfolders-flat toolbarbutton" + paletteClass + "." + noColorClass + ":hover", "background-image", "none", true);
			if (tabStyle == prefs.TABS_STRIPED) {
				engine.setElementStyle(ss, ".quickfolders-flat toolbarbutton:hover","color", hoverColor ,true);
			}
			engine.setElementStyle(ss, ".quickfolders-flat toolbarbutton:hover","color", hoverColor, true);
			engine.setElementStyle(ss, ".quickfolders-flat toolbarbutton." + noColorClass + '[buttonover="true"]',"color", hoverColor ,true);
			// full monochrome background
			engine.setElementStyle(ss, ".quickfolders-flat toolbarbutton:hover","background-color", hoverBackColor,true);
		}
	} ,

	// DRAGOVER STATE
	initDragOverStyle: async function initDragOverStyle(ss, ssPalettes) {
	  if (ssPalettes == null)
		  ssPalettes = ss;
		QuickFolders.Util.logDebugOptional("interface.buttonStyles", "initDragOverStyle()");
		let engine = QuickFolders.Styles,
        prefs = QuickFolders.Preferences,
		    // let dragOverColor = engine.getElementStyle(ssPalettes, ruleName, "color");
		    dragOverColor = await prefs.getUserStyle("DragTab","color","White");
		engine.setElementStyle(ss, ".quickfolders-flat toolbarbutton.dragover","background-color", await prefs.getUserStyle("DragTab","background-color","#E93903"),true);
    let noColorClass = "col0"; // ####
    engine.setElementStyle(ss, ".quickfolders-flat toolbarbutton." + noColorClass + ".dragover","color", dragOverColor, true); // ####

		if (prefs.getIntPref("style.DragOver.paletteType")) {
			let paletteClass = this.getPaletteClassCss("DragOver"),
			    paletteEntry = prefs.getIntPref("style.DragOver.paletteEntry"),
			    ruleName = ".quickfolders-flat " + paletteClass + ".col" + paletteEntry,
			    dragOverGradient = engine.getElementStyle(ssPalettes, ruleName, "background-image");
			
			engine.setElementStyle(ss, ".quickfolders-flat toolbarbutton.dragover", "background-image", dragOverGradient, true);
			engine.setElementStyle(ss, ".quickfolders-flat toolbarbutton" + paletteClass + ".dragover","color", dragOverColor, true);
			engine.setElementStyle(ss, ".quickfolders-flat toolbarbutton" + paletteClass + '[buttonover="true"]',"color", dragOverColor, true);
		}
		else {
			engine.setElementStyle(ss, ".quickfolders-flat toolbarbutton.dragover", "background-image", "none", true);
			engine.setElementStyle(ss, ".quickfolders-flat toolbarbutton.dragover","color", dragOverColor,true);
		}
	} ,
  
  
	getPaletteClassCss: function getPaletteClassCss(tabStateId) {
		let cl = this.getPaletteClass(tabStateId);
		return cl.replace(" ", ".");
	} ,
  
	getPaletteClass: function(tabStateId) {
	  let paletteType =  QuickFolders.Preferences.getIntPref("style." + tabStateId + ".paletteType");
		switch (paletteType) {
		  case -1:
			  if (tabStateId == "InactiveTab") {
					return "";  // error
				}
				else { // get from global tab style!
					return  this.getPaletteClass("InactiveTab");
				}
				break;
			default:
				return  this.getPaletteClassToken(paletteType);
		}
		return "";
	} ,

	getPaletteClassToken: function(paletteType) {
		switch (parseInt(paletteType, 10)) {
		  case -1:
			  return this.getPaletteClassToken(this.getPaletteClass("InactiveTab")); // default
			case 0:
			  return "";  // none
			case 1:
			  return " plastic";  // default
			case 2:
			  return " pastel";
      case 3:
        return " night";
		}
		return "";
	} ,
    
	// SELECTED FOLDER STATE (.selected-folder)
	initSelectedFolderStyle: async function initSelectedFolderStyle(ss, ssPalettes, tabStyle) {
	  if (ssPalettes == null)
		  ssPalettes = ss;
		QuickFolders.Util.logDebugOptional("interface.buttonStyles", "initSelectedFolderStyle()");
		let engine = QuickFolders.Styles,
		    colActiveBG = await QuickFolders.Preferences.getUserStyle("ActiveTab","background-color","Highlight"),
		    selectedColor = await QuickFolders.Preferences.getUserStyle("ActiveTab","color","HighlightText"),
		    globalPaletteClass = this.getPaletteClassCss("InactiveTab"),
        paletteClass = this.getPaletteClassCss("ActiveTab"),
        coloredPaletteClass = this.getPaletteClassCss("ColoredTab");

		if (QuickFolders.Preferences.getIntPref("style.ActiveTab.paletteType")) {
			let paletteEntry = await QuickFolders.Preferences.getIntPref("style.ActiveTab.paletteEntry"),
			    ruleName = ".quickfolders-flat " + paletteClass + ".col" + paletteEntry,
			    selectedGradient = engine.getElementStyle(ssPalettes, ruleName, "background-image");
			// selectedColor = engine.getElementStyle(ssPalettes, ruleName, "color"); // make this overridable!
			// we do not want the rule to containg the paletteClass because it has to always work!
			engine.setElementStyle(ss, ".quickfolders-flat " + ".selected-folder", "background-image", selectedGradient, true);
		}
		else { // two colors mode
			engine.setElementStyle(ss, ".quickfolders-flat " + ".selected-folder", "background-image", "none", true);
			engine.setElementStyle(ss, ".quickfolders-flat toolbarbutton.selected-folder","background-color", colActiveBG, true);
		}
    // style label and image (to also overwrite theme color for svg icons)
    engine.removeElementStyle(ss, ".quickfolders-flat .selected-folder > *:not(menupopup)", "color");  
    engine.setElementStyle(ss, ".quickfolders-flat .selected-folder > *:not(menupopup)", "color", selectedColor,true);
	} ,

	// INACTIVE STATE (DEFAULT)
	initDefaultStyle: async function initDefaultStyle(ss, ssPalettes, tabStyle) {
		const util = QuickFolders.Util;
	  if (ssPalettes == null)
		  ssPalettes = ss;
		util.logDebugOptional("interface.buttonStyles", "initDefaultStyle()");
		let engine = QuickFolders.Styles,
        prefs = QuickFolders.Preferences,
        inactiveGradientColor = null,
		    inactiveBackground = util.getSystemColor(await prefs.getUserStyle("InactiveTab","background-color","ButtonFace")),
		    inactiveColor = util.getSystemColor(await prefs.getUserStyle("InactiveTab","color","black")),
		    paletteClass = this.getPaletteClassCss("InactiveTab"),
    // only plastic & pastel support striped style:
        isTabsStriped = (tabStyle == prefs.TABS_STRIPED) && prefs.getIntPref("style.InactiveTab.paletteType")<3,
		    noColorClass = (isTabsStriped) ? "col0striped" : "col0",
		    avoidCurrentFolder = ""; // = ':not(#QuickFoldersCurrentFolder)'; // we omit paletteClass for uncolored tabs:

		// transparent buttons: means translucent background! :))
		if (prefs.getBoolPref("transparentButtons"))
			inactiveBackground = util.getRGBA(inactiveBackground, 0.25) ;

		engine.setElementStyle(ss, ".quickfolders-flat toolbarbutton","background-color", inactiveBackground, true);
		engine.setElementStyle(ss, ".quickfolders-flat toolbarbutton#QuickFoldersCurrentFolder","background-color", inactiveBackground, true);

		// INACTIVE STATE (PALETTE) FOR UNCOLORED TABS ONLY
		// LETS AVOID !IMPORTANT TO SIMPLIFY STATE STYLING
		if (prefs.getIntPref("style.InactiveTab.paletteType")>0) {
			let paletteEntry = prefs.getIntPref("style.InactiveTab.paletteEntry");
			if (tabStyle === prefs.TABS_STRIPED)
				paletteEntry += "striped";
			let ruleName = (!isTabsStriped ? ".quickfolders-flat " : "") + paletteClass + ".col" + paletteEntry;
			let inactiveGradient = engine.getElementStyle(ssPalettes, ruleName, "background-image");
			engine.removeElementStyle(ss, ".quickfolders-flat toolbarbutton." + noColorClass + ":not(.dragover)", "background-image"); // remove "none"
			// removed "toolbarbutton". qualifier
			engine.setElementStyle(ss, ".quickfolders-flat ." + noColorClass + ":not(.dragover)", "background-image", inactiveGradient, false);
			engine.setElementStyle(ss, ".quickfolders-flat ." + noColorClass + ":not(.dragover)#QuickFoldersCurrentFolder", "background-image", inactiveGradient, false);

			inactiveGradientColor = (inactiveColor=="black") ? engine.getElementStyle(ssPalettes, ruleName, "color") : inactiveColor;
		}
		else {
			engine.setElementStyle(ss, ".quickfolders-flat toolbarbutton." + noColorClass + ":not(.dragover)", "background-image", "none", false);
		}

    // tb + avoidCurrentFolder
	  engine.setElementStyle(ss, ".quickfolders-flat toolbarbutton" + "." + noColorClass + " .toolbarbutton-text", "color", inactiveColor, false); // [issue 81] - add selector for label
	  engine.setElementStyle(ss, ".quickfolders-flat toolbarbutton" + "." + noColorClass + " .toolbarbutton-icon", "color", inactiveColor, false); // [issue 81] - add selector for icon
    if (inactiveGradientColor!=null)
      engine.setElementStyle(ss, ".quickfolders-flat toolbarbutton" + paletteClass + "." + noColorClass, "color", inactiveGradientColor, false);

		// Coloring all striped tabbed buttons that have individual colors
    let coloredPaletteClass = this.getPaletteClassCss("ColoredTab");
		if (isTabsStriped) { // paletteClass = plastic, pastel, "", apple
			// fallback for uncolored current folder (striped style)
			engine.setElementStyle(ss, ".quickfolders-flat toolbarbutton#QuickFoldersCurrentFolder.col0" + paletteClass,"color", inactiveColor, false);
      // avoid for current folder button as it always will be completely colored
      // #issue 7 these rules didn't work due to a syntax error
      engine.setElementStyle(ss, ".quickfolders-flat toolbarbutton:not(#QuickFoldersCurrentFolder):not(#QuickFolders-title-label)" + coloredPaletteClass,"color", inactiveColor, false);
      engine.setElementStyle(ss, ".quickfolders-flat toolbarbutton:not(#QuickFoldersCurrentFolder):not(#QuickFolders-title-label)" + paletteClass,"color", inactiveColor, false);
		}
		else {
			engine.removeElementStyle(ss, ".quickfolders-flat toolbarbutton" + paletteClass,"color");
			engine.removeElementStyle(ss, ".quickfolders-flat toolbarbutton" + coloredPaletteClass,"color");
		}
	} ,
  
	// Get all blingable elements and make them look user defined.
	updateUserStyles: async function updateUserStyles() {
    const util = QuickFolders.Util,
		      prefs = QuickFolders.Preferences;
		try {
			util.logDebugOptional ("interface","updateUserStyles() " + window.location);
			// get MAIN STYLE SHEET
			let styleEngine = QuickFolders.Styles,
			    ss = this.getStyleSheet(styleEngine, "quickfolders-layout.css", "QuickFolderStyles");

			if (!ss) return false;

			// get PALETTE STYLE SHEET
			let ssPalettes = this.getStyleSheet(styleEngine, QuickFolders.Interface.PaletteStyleSheet, "QuickFolderPalettes");
      ssPalettes = ssPalettes ? ssPalettes : ss; // if this fails, use main style sheet.
			let theme = prefs.CurrentTheme,
			    tabStyle = prefs.ColoredTabStyle;

			if (prefs.isCssTransitions) {
				styleEngine.setElementStyle(ss, ".quickfolders-flat toolbarbutton", "transition-duration", "1s, 1s, 2s, 1s");
				styleEngine.setElementStyle(ss, ".quickfolders-flat toolbarbutton", "transition-property", "color, background-color, border-radius, box-shadow");
			}
			else {
				styleEngine.removeElementStyle(ss, ".quickfolders-flat toolbarbutton", "transition-duration");
				styleEngine.removeElementStyle(ss, ".quickfolders-flat toolbarbutton", "transition-property");
			}

			// =================
			// FONT COLORS
			let theColorString = await prefs.getUserStyle("InactiveTab","color","black"),
			    colActiveBG = await prefs.getUserStyle("ActiveTab","background-color","Highlight"),
					btnSelector = ".quickfolders-flat toolbarbutton";

			if (tabStyle != prefs.TABS_STRIPED)  {
				styleEngine.setElementStyle(ss, btnSelector
				  + "[background-image].selected-folder","border-bottom-color", colActiveBG, true);
			}

			// =================
			// CUSTOM RADIUS
			let topRadius = "4px",
			    bottomRadius = "0px";
			if (prefs.getBoolPref("style.corners.customizedRadius")) {
				topRadius = prefs.getIntPref("style.corners.customizedTopRadiusN") + "px";
				bottomRadius = prefs.getIntPref("style.corners.customizedBottomRadiusN") + "px";
			}

			styleEngine.setElementStyle(ss, btnSelector, "border-top-left-radius", topRadius, true);
			styleEngine.setElementStyle(ss, btnSelector, "border-top-right-radius", topRadius, true);
			styleEngine.setElementStyle(ss, btnSelector, "border-bottom-left-radius", bottomRadius, true);
			styleEngine.setElementStyle(ss, btnSelector, "border-bottom-right-radius", bottomRadius, true);

			// QuickFolders Toolbar only
			let btnInToolbarSelector = ".quickfolders-flat .folderBarContainer toolbarbutton",
			    buttonHeight = prefs.getIntPref("style.button.minHeight") + "px",
			    topPadding =  prefs.getIntPref("style.button.paddingTop") + "px";
			styleEngine.setElementStyle(ss, btnInToolbarSelector, "min-height", buttonHeight, true);
			styleEngine.setElementStyle(ss, btnInToolbarSelector, "padding-top", topPadding, true);


			// ==================
			// BORDERS & SHADOWS
			// for full colored tabs color the border as well!
			// but should only apply if background image is set!!
			let SHADOW = "box-shadow";
			if (prefs.getBoolPref("buttonShadows")) {
				styleEngine.setElementStyle(ss, ".quickfolders-flat .folderBarContainer toolbarbutton", SHADOW, "1px -1px 3px -1px rgba(0,0,0,0.3)", true);
				styleEngine.setElementStyle(ss, ".quickfolders-flat .folderBarContainer toolbarbutton.selected-folder", SHADOW, "0px 0px 2px -1px rgba(0,0,0,0.9)", true);
				styleEngine.setElementStyle(ss, ".quickfolders-flat .folderBarContainer toolbarbutton:hover", SHADOW, "0px 0px 2px -1px rgba(0,0,0,0.9)", true);
			}
			else {
				styleEngine.removeElementStyle(ss, ".quickfolders-flat .folderBarContainer toolbarbutton", SHADOW);
				styleEngine.removeElementStyle(ss, ".quickfolders-flat .folderBarContainer toolbarbutton.selected-folder", SHADOW);
				styleEngine.removeElementStyle(ss, ".quickfolders-flat .folderBarContainer toolbarbutton:hover", SHADOW);
			}

			styleEngine.setElementStyle(ss, ".quickfolders-flat toolbarbutton[background-image].selected-folder","border-bottom-color", colActiveBG, true);
			styleEngine.setElementStyle(ss, "#QuickFolders-Toolbar.quickfolders-flat #QuickFolders-Folders-Pane","border-bottom-color", colActiveBG, true); // only in main toolbar!

			let theInit = "";
			try {
			  theInit = "SelectedFolderStyle";
				this.initSelectedFolderStyle(ss, ssPalettes, tabStyle);
			  theInit = "DefaultStyle";
				this.initDefaultStyle(ss, ssPalettes, tabStyle);
			  theInit = "HoverStyle";
				this.initHoverStyle(ss, ssPalettes, this.PaintModeActive);
			  theInit = "DragOverStyle";
				this.initDragOverStyle(ss, ssPalettes);
			}
			catch (ex) {
			  util.logException("Quickfolders.updateUserStyles - init" + theInit + " failed.", ex);
			}

			// TOOLBAR
			theColorString = await prefs.getUserStyle("Toolbar","background-color","ButtonFace");
			if (prefs.getBoolPref("transparentToolbar"))
				theColorString = "transparent";
			styleEngine.setElementStyle(ss, ".toolbar","background-color", theColorString,true);

      // restrict to toolbar only (so as not to affect the panel in currentFolder bar!)
			styleEngine.setElementStyle(ss, "toolbar." + theme.cssToolbarClassName, "background-color", theColorString,true);
      let tbBottom = await prefs.getUserStyle("Toolbar","bottomLineWidth", 3) + "px";
      styleEngine.setElementStyle(ss, "#QuickFolders-Toolbar.quickfolders-flat #QuickFolders-Folders-Pane", "border-bottom-width", tbBottom, true);

			this.updateNavigationBar(ss);

      // change to numeric
			let minToolbarHeight = prefs.getStringPref("toolbar.minHeight");
      if (minToolbarHeight) {
        let mT = parseInt(minToolbarHeight);
        styleEngine.setElementStyle(ss, "#QuickFolders-Toolbar", "min-height", mT.toString()+"px", false);
      }

      // main toolbar position
      let ordinalGroup = prefs.getIntPref("toolbar.ordinalPosition") || 0;
      styleEngine.setElementStyle(ss,"#QuickFolders-Toolbar", "-moz-box-ordinal-group", ordinalGroup.toString());

			util.logDebugOptional ("css","updateUserStyles(): success");
      
      util.$("QuickFolders-Tools-Pane").setAttribute("iconsize", prefs.getBoolPref("toolbar.largeIcons") ? "large" : "small"); // [issue 191]
			return true;
		}
		catch(e) {
			util.logException("Quickfolders.updateUserStyles failed ", e);
			return false;
		};
		return false;
	} ,  
  
}