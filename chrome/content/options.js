"use strict";
/* BEGIN LICENSE BLOCK

GPL3 applies.
For detail, please refer to license.txt in the root folder of this extension

END LICENSE BLOCK */


var QuickFolders_TabURIregexp = {
	get _thunderbirdRegExp() {
		delete this._thunderbirdRegExp;
		return this._thunderbirdRegExp = new RegExp("^http://quickfolders.mozdev.org/");
	}
};


QuickFolders.Options = {
	optionsMode : "",  // filter out certain pages (for support / help only)
	message : "",      // alert to display on dialog opening (for certain update cases); make sure to clear out after use!
	QF_PREF_LAST : 4,
	QF_PREF_SUPPORT : 4,
	QF_PREF_HELP : 3,
	QF_PREF_LAYOUT : 2,
	QF_PREF_ADVANCED : 1,
	QF_PREF_GENERAL : 0,

	rememberLastTab: function() {
		var observerService = Components.classes["@mozilla.org/observer-service;1"].getService(Components.interfaces.nsIObserverService);
		observerService.notifyObservers(null, "quickfolders-options-saved", null);
	} ,
	
	accept: function() {
		if (this.optionsMode=="helpOnly" || this.optionsMode=="supportOnly")
			return; // do not store any changes!
		// persist colors
		try {
			QuickFolders.Preferences.setCurrentThemeId(document.getElementById("QuickFolders-Theme-Selector").value);

			QuickFolders.Preferences.setUserStyle("ActiveTab","background-color",
							document.getElementById("activetab-colorpicker").color);
			QuickFolders.Preferences.setUserStyle("ActiveTab","color",
							document.getElementById("activetab-fontcolorpicker").color);

			QuickFolders.Preferences.setUserStyle("InactiveTab","background-color",
							document.getElementById("inactive-colorpicker").color);
			QuickFolders.Preferences.setUserStyle("InactiveTab","color",
							document.getElementById("inactive-fontcolorpicker").color);


			QuickFolders.Preferences.setUserStyle("HoveredTab","background-color",
							document.getElementById("hover-colorpicker").color);
			QuickFolders.Preferences.setUserStyle("HoveredTab","color",
							document.getElementById("hover-fontcolorpicker").color);

			QuickFolders.Preferences.setUserStyle("DragTab","background-color",
							document.getElementById("dragover-colorpicker").color);
			QuickFolders.Preferences.setUserStyle("DragTab","color",
							document.getElementById("dragover-fontcolorpicker").color);

			QuickFolders.Preferences.setUserStyle("Toolbar","background-color",
							document.getElementById("toolbar-colorpicker").color);
			QuickFolders.Preferences.setUserStyle( 'corners','customizedTopRadius',
							document.getElementById("QuickFolders-Options-CustomTopRadius").value);
			QuickFolders.Preferences.setUserStyle( 'corners','customizedBottomRadius',
							document.getElementById("QuickFolders-Options-CustomBottomRadius").value);

			// QuickFolders.Interface.setPaintButtonColor(-1);
		}
		catch(e) {
			alert("Error in QuickFolders:\n" + e);
		};
		this.rememberLastTab();
		var tabbox = window.document.getElementById("QuickFolders-Options-Tabbox");
		QuickFolders.Preferences.setIntPref('lastSelectedOptionsTab', tabbox.selectedIndex);
	} ,
	
	close: function () {
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
	 * @paletteType: -1 {as standard tab} 0 none 1 default 2 pastel ...
	 * @paletteColor: [optional] palette index; 0=no styling
	 */
	preparePreviewTab: function (colorPickerId, preference, previewId, paletteType, paletteColor) {
		let wd = window.document;
		let previewTab = wd.getElementById(previewId);
		let paletteId = (typeof paletteType === 'undefined') ? QuickFolders.Preferences.getIntPref(preference + 'paletteType') : paletteType;
		let colorPicker = colorPickerId ? wd.getElementById(colorPickerId) : null;
		
		// set to that of inactive style for option ("like on inactive")
		if (paletteId == -1 && colorPickerId!='inactive-colorpicker') {
		  paletteId = QuickFolders.Preferences.getIntPref('style.InactiveTab.paletteType');
		}
		let paletteClass = QuickFolders.Interface.getPaletteClassToken(paletteId);
		
		
		if (paletteId) { // use a palette
			let paletteIndex = (typeof paletteColor === 'undefined') 
			                   ? QuickFolders.Preferences.getIntPref(preference + 'paletteEntry') :
			                   paletteColor;
												 
			// hide the color picker when not striped
			if (colorPicker) {
				if (colorPickerId=='inactive-colorpicker') {
					colorPicker.collapsed = this.isHideStandardBackgroundColor;
					if (QuickFolders.Preferences.ColoredTabStyle==QuickFolders.Preferences.TABS_STRIPED)
						paletteIndex = '' + paletteIndex + 'striped';
				}
				else
					colorPicker.collapsed = true;
			}
			
			previewTab.className = 'qfTabPreview col' + paletteIndex + paletteClass;
		}
		else {
		  colorPicker.collapsed = false; // paletteId = 0 is no palette
			previewTab.className = 'qfTabPreview';
			if (colorPicker)
				previewTab.style.backgroundColor = colorPicker.color;
			
		}
	} ,
	

	load: function() {
		if (window.arguments && window.arguments[1].inn.instance) {
			// QuickFolders = window.arguments[1].inn.instance; // avoid creating a new QuickFolders instance, reuse the one passed in!!
			QuickFolders.Util.mExtensionVer = window.arguments[1].inn.instance.Util.Version;
		}
		
		var version=QuickFolders.Util.Version;
		let wd=window.document;
		if (window.arguments)
			try {
				this.optionsMode = window.arguments[1].inn.mode;
				// force selection of a certain pane (-1 ignores)
				if (this.optionsMode >= 0)
					QuickFolders.Preferences.setIntPref('lastSelectedOptionsTab', this.optionsMode);
			}
			catch(e) {;}

		if (version=="") version='version?';

		wd.getElementById("qf-options-header-description").setAttribute("value", version);
		var tabbox = wd.getElementById("QuickFolders-Options-Tabbox");
		
		// hide first 3 tabs!!
		if (this.optionsMode=="helpOnly" || this.optionsMode=="supportOnly") {
			if (tabbox) {
				var keep;
				switch(this.optionsMode) {
					case "helpOnly":
						keep=this.QF_PREF_HELP;
						break;
					case "supportOnly":
						keep=this.QF_PREF_SUPPORT;
						break;
				}
				for (var i=this.QF_PREF_LAST; i>=0; i--)
					tabbox.tabs.removeItemAt(i);
				for (var i=this.QF_PREF_LAST; i>=0; i--) {
					if (i!=keep)
						tabbox.tabpanels.removeChild(tabbox.tabpanels.children[i]);
				}
			}
			
			return; // we do not set any values!
		}
		
		wd.getElementById("qfInsertSeparator").label = QuickFolders.Util.getBundleString("qfInsertSeparator");
		wd.getElementById("qfInsertLineBreak").label = QuickFolders.Util.getBundleString("qfInsertLineBreak");
		// bundle strings
		wd.getElementById("chkShowFolderMenuButton").label = QuickFolders.Util.getBundleString("qfFolderPopup");
		// let backgroundCombo = document.getElementById('QuickFolders-CurrentFolder-Background-Select');
		this.setCurrentToolbarBackground(QuickFolders.Preferences.getCharPrefQF('currentFolderBar.background.selection'), false);

		// initialize colorpickers
		try {
			var col, bcol;
			bcol = QuickFolders.Preferences.getUserStyle("ActiveTab","background-color","#000090");
			wd.getElementById("activetab-colorpicker").color = bcol;
			col = QuickFolders.Preferences.getUserStyle("ActiveTab","color","#FFFFFF");
			wd.getElementById("activetab-fontcolorpicker").color = col;
			wd.getElementById("activetabs-label").style.setProperty('color', col, 'important');
			wd.getElementById("activetabs-label").style.backgroundColor = bcol;

			bcol = QuickFolders.Preferences.getUserStyle("InactiveTab","background-color","buttonface");
			wd.getElementById("inactive-colorpicker").color = bcol;

			//support transparency and shadow
			var transcol  =  QuickFolders.Util.getRGBA(bcol, QuickFolders.Preferences.getBoolPref("extensions.quickfolders.transparentButtons") ? 0.25 : 1.0);
			wd.getElementById("inactivetabs-label").style.backgroundColor = transcol;
			// this.showButtonShadow(QuickFolders.Preferences.getBoolPref("extensions.quickfolders.buttonShadows"));

			col = QuickFolders.Preferences.getUserStyle("InactiveTab","color","buttontext");
			wd.getElementById("inactive-fontcolorpicker").color = col;
			wd.getElementById("inactivetabs-label").style.setProperty('color', col, 'important');


			bcol = QuickFolders.Preferences.getUserStyle("HoveredTab","background-color","#FFFFFF");
			wd.getElementById("hover-colorpicker").color = bcol;
			col = QuickFolders.Preferences.getUserStyle("HoveredTab","color","Black");
			wd.getElementById("hover-fontcolorpicker").color = col;
			wd.getElementById("hoveredtabs-label").style.setProperty('color', col, 'important');
			wd.getElementById("hoveredtabs-label").style.backgroundColor = bcol;

			bcol = QuickFolders.Preferences.getUserStyle("DragTab","background-color", "#E93903");
			wd.getElementById("dragover-colorpicker").color = bcol;
			col = QuickFolders.Preferences.getUserStyle("DragTab","color", "White");
			wd.getElementById("dragover-fontcolorpicker").color = col;
			wd.getElementById("dragovertabs-label").style.setProperty('color', col, 'important');
			wd.getElementById("dragovertabs-label").style.backgroundColor = bcol;
			wd.getElementById("toolbar-colorpicker").color = QuickFolders.Preferences.getUserStyle("Toolbar","background-color", "White");

			this.selectTheme(wd, QuickFolders.Preferences.CurrentThemeId);

			// initialize Theme Selector by adding original titles to localized versions
			var cbo = wd.getElementById("QuickFolders-Theme-Selector");
			if (cbo.itemCount)
				for (var index = 0; index<cbo.itemCount; index++) {
					var item = cbo.getItemAtIndex( index );
					var theme = QuickFolders.Themes.Theme(item.value);
					if (theme) {
						if (item.label != theme.name)
							item.label = theme.name + ' - ' + item.label
					}
				}

			try {
				var selectOptionsPane = QuickFolders.Preferences.getIntPref('lastSelectedOptionsTab');
				if (selectOptionsPane >=0)
					tabbox.selectedIndex = selectOptionsPane; // 1 for pimp my tabs
			}
			catch(e) { ; }
			
			let menupopup = wd.getElementById("QuickFolders-Options-PalettePopup");
			QuickFolders.Interface.buildPaletteMenu(0, menupopup);
			
			// customized coloring support
      this.initPreviewTabStyles();
		}
		catch(e) {
			alert("Error in QuickFolders.Options.load():\n" + e);
		};
		if (this.message && this.message!='') {
			alert(message);
			message = '';
		}

	},

	selectTheme: function(wd, themeId) {
		var myTheme =  QuickFolders.Themes.Theme(themeId);
		if (myTheme) {
		  try {
				wd.getElementById("QuickFolders-Theme-Selector").value = themeId;

				document.getElementById("Quickfolders-Theme-Author").value
					= myTheme.author;

				// textContent wraps, value doesnt
				document.getElementById("Quickfolders-Theme-Description").textContent
					= QuickFolders.Interface.getUIstring("qf.themes." + themeId + ".description", "N/A");

				document.getElementById("qf-options-icons").disabled
					= !(myTheme.supportsFeatures.specialIcons);
				document.getElementById("qf-options-shadow").disabled
					= !(myTheme.supportsFeatures.buttonShadows);

				document.getElementById("button-font-size").disabled
					= !(myTheme.supportsFeatures.supportsFontSize);
				document.getElementById("button-font-size-label").disabled
					= !(myTheme.supportsFeatures.supportsFontSize);

				document.getElementById("qf-pimpMyRadius").collapsed
					= !(myTheme.supportsFeatures.cornerRadius);

				document.getElementById("qf-pimpMyBorders").collapsed
					= !(myTheme.supportsFeatures.borderToggle);

				document.getElementById("qf-pimpMyColors").collapsed
					= !(myTheme.supportsFeatures.stateColors || myTheme.supportsFeatures.individualColors);

				document.getElementById("qf-individualColors").collapsed
					= !(myTheme.supportsFeatures.individualColors);

				document.getElementById("qf-StandardColors").collapsed
					= !(myTheme.supportsFeatures.standardTabColor);

				document.getElementById("buttonTransparency").collapsed
					= !(myTheme.supportsFeatures.tabTransparency);


				document.getElementById("qf-stateColors").collapsed
					= !(myTheme.supportsFeatures.stateColors);
					
				document.getElementById("qf-stateColors-defaultButton").collapsed
					= !(myTheme.supportsFeatures.stateColors);
			}
			catch(ex) {
				QuickFolders.Util.logException('Exception during QuickFolders.Options.selectTheme: ', ex); 
			}

			/******  FOR FUTURE USE ??  ******/
			// if (myTheme.supportsFeatures.supportsFontSelection)
			// if (myTheme.supportsFeatures.buttonInnerShadows)

			QuickFolders.Util.logDebug ('Theme [' + myTheme.Id + '] selected');

		}
	} ,
	
	BGCHOICE : {
	  default: 0,
		dark: 1,
		translucent: 2,
		custom: 3
	} ,


	toggleMutexCheckbox: function(cbox, cbox2Name) {
		var prefString1 = cbox.getAttribute('preference');
		var prefName1 = document.getElementById(prefString1).getAttribute('name');
		var cbox2 = document.getElementById(cbox2Name);
		if(!QuickFolders.Preferences.getBoolPref(prefName1)) { // not yet checked but will be after event is propagated.
			var prefString2 = cbox2.getAttribute('preference');
			var prefName2 = document.getElementById(prefString2).getAttribute('name');
			// uncheck the other checkbox
			if (QuickFolders.Preferences.getBoolPref(prefName2))
				QuickFolders.Preferences.setBoolPref(prefName2, false);
		}
	},

	setDefaultButtonRadius: function() {
		document.getElementById('QuickFolders-Options-CustomTopRadius').value = "4px";
		document.getElementById('QuickFolders-Options-CustomBottomRadius').value = "0px";

	},

	colorPickerTranslucent: function (picker) {
		document.getElementById('inactivetabs-label').style.backgroundColor=
			QuickFolders.Util.getRGBA(picker.color, document.getElementById('buttonTransparency').checked ? 0.25 : 1.0);
		QuickFolders.Preferences.setUserStyle('InactiveTab','background-color', picker.color);
		return QuickFolders.Interface.updateMainWindow();
	},

  // set the custom value entered by user (only if custom is actually selected)
	setCurrentToolbarBackgroundCustom: function() {
		let setting = document.getElementById('currentFolderBackground');
		let backgroundCombo = document.getElementById('QuickFolders-CurrentFolder-Background-Select');		
		if (backgroundCombo.selectedIndex == this.BGCHOICE.custom) {
		  // store the new setting!
			QuickFolders.Preferences.setCharPrefQF('currentFolderBar.background.custom', setting.value);  
			this.setCurrentToolbarBackground('custom', true);
		}
	} ,
	
	// change background color for current folder bar
	// 4 choices: default, dark, custom, translucent
	setCurrentToolbarBackground: function(choice, withUpdate) {
		QuickFolders.Util.logDebugOptional ('interface','Options.setCurrentToolbarBackground');
		let setting = document.getElementById('currentFolderBackground');
		
		// store custom value, when going away from custom selection
		let backgroundCombo = document.getElementById('QuickFolders-CurrentFolder-Background-Select');		
		if(backgroundCombo.selectedIndex == this.BGCHOICE.custom && choice != 'custom') {
			QuickFolders.Preferences.setCharPrefQF('currentFolderBar.background.custom', setting.value);  
		}
	
		switch (choice) {
		  case 'default':
				backgroundCombo.selectedIndex = this.BGCHOICE.default;
				setting.value = (QuickFolders.Util.isCSSGradients)
							          ? 'linear-gradient(to top, #FFF 7%, #BDB9BD 88%, #EEE 100%)'
							          : '-moz-linear-gradient(bottom, #FFF 7%, #BDB9BD 88%, #EEE 100%)';
				break;
		  case 'dark':
				backgroundCombo.selectedIndex = this.BGCHOICE.dark;
				setting.value = (QuickFolders.Util.isCSSGradients)
				                ? 'linear-gradient(to top, #0A0809 0%, #0A0E0A 52%, #6E7774 73%, #AEBCBF 100%)'
												: '-moz-linear-gradient(bottom, #0A0809 0%, #0A0E0A 52%, #6E7774 73%, #AEBCBF 100%)'
				break;
			case 'translucent':
				backgroundCombo.selectedIndex = this.BGCHOICE.translucent;
				setting.value = 'rgba(255, 255, 255, 0.2)';  // Gecko 1.9+
				break;
			case 'custom':
				backgroundCombo.selectedIndex = this.BGCHOICE.custom;
				// restore custom value
				setting.value = QuickFolders.Preferences.getCharPrefQF('currentFolderBar.background.custom');  
				break;
		}
		let styleValue = setting.value;
		QuickFolders.Preferences.setCharPrefQF('currentFolderBar.background', styleValue);
		QuickFolders.Preferences.setCharPrefQF('currentFolderBar.background.selection', choice);
		if (withUpdate)
			QuickFolders.Interface.updateMainWindow();
	},
	
	styleUpdate: function(elementName, elementStyle, styleValue, label ) {
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
		return QuickFolders.Interface.updateMainWindow();
	},
	
	// select: striped style / filled style
	setColoredTabStyle: function  (rgroup) {
		var styleId = parseInt(rgroup.value, 10);
		QuickFolders.Preferences.setIntPref("colorTabStyle", styleId); // 0 striped 1 filled
		QuickFolders.Interface.updateMainWindow();
		// no need to display background color picker when full colored style is selected.
		document.getElementById('inactive-colorpicker').collapsed = this.isHideStandardBackgroundColor;
		
		let inactiveTab = document.getElementById('inactivetabs-label');
		if (inactiveTab) {
			if ((styleId != QuickFolders.Preferences.TABS_STRIPED))
				inactiveTab.className = inactiveTab.className.replace(/\s*striped/,"");
			if ((styleId == QuickFolders.Preferences.TABS_STRIPED) && (inactiveTab.className.indexOf("striped")<0))
				inactiveTab.className = inactiveTab.className.replace(/(col[0-9]+)/,"$1striped");
		}
	}, 
	
	get isHideStandardBackgroundColor() {
	  if (QuickFolders.Preferences.ColoredTabStyle==QuickFolders.Preferences.TABS_STRIPED)
			return false; // always show if striped tabs are used
		return QuickFolders.Preferences.getIntPref('style.InactiveTab.paletteType'); // 0 = no palette - hide if Palette is used.
	},
	
	
	getButtonStatePrefId: function(buttonState) {
		switch(buttonState) {
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
	
	/*********************
	 * toggleUsePalette() 
	 * Set whether (and which) palette is used for a particular tab state.
	 * also hides background colorpicker if a palette is used
	 * @mnuNode:       either a menuitem node or the menu with the correct paletteType value
	 * @buttonState:   [string] which kind of tab state: standard, active, hovered, dragOver
	 * @paletteType:  -1 as standard, 0 none, 1 normal, 2 pastel ....
	 */	 
	toggleUsePalette: function(mnuNode, buttonState, paletteType) {
		//let isChecked = checkbox.checked;
		let paletteTypeMenu = null;
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
		let idPreview;
		let colorPicker;
		
		let stylePref = this.getButtonStatePrefId(buttonState);
		switch(buttonState) {
			case 'standard':
				idPreview = 'inactivetabs-label';
				colorPicker = 'inactive-colorpicker';
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
		
		// preparePreviewTab(id, preference, previewId)
		QuickFolders.Preferences.setIntPref('style.' + stylePref + '.paletteType', paletteType);
		this.preparePreviewTab(colorPicker, 'style.' + stylePref + '.', idPreview, paletteType);
		// this.toggleBoolPreference(checkbox, true);
		
		/*
		// let's not hide the standard background color picker! 
		// this way we can override the background for "striped" (or future translucent) styles.
		if (buttonState == 'standard')
			paletteTypeMenu.previousSibling.collapsed = this.isHideStandardBackgroundColor;
		else
			paletteTypeMenu.previousSibling.collapsed = (paletteType==0) ? false : true; */
	},
	
	/*********************  
	 *	showPalette()       
	 *  open palette popup   
	 *  @label              parent node  
	 *  @buttonState        'standard', 'active', 'hovered', 'dragOver'
	 *  @paletteMenuId      'menuStandardPalette', 'menuActivePalette', 'menuHoverPalette', 'menuDragOverPalette'
	 */
	showPalette: function(label, buttonState, paletteMenuId) {
		let id=label ? label.id : label.toString();
		QuickFolders.Util.logDebugOptional("interface", "Options.showPalette(" + id + ", " + buttonState + ")");
		let paletteMenu = document.getElementById(paletteMenuId);
		if (paletteMenu) {
			this.toggleUsePalette(paletteMenu, buttonState, paletteMenu.value);
			// allow overriding standard background for striped style!
//			if (buttonState == 'standard')
//				paletteMenu.previousSibling.collapsed = this.isHideStandardBackgroundColor;
//			else
//				paletteMenu.previousSibling.collapsed = true; // -1 is a special case...
			// Now style the palette with the correct palette class
			let context = label.getAttribute('context');
			let menu = document.getElementById(context);
			menu.className = 'QuickFolders-folder-popup' + QuickFolders.Interface.getPaletteClass(this.getButtonStatePrefId(buttonState));
		}
		QuickFolders.Interface.showPalette(label);
	},

	changeTextPreference: function(txtBox) {
		var prefString = cb.getAttribute("preference");
		var pref = document.getElementById(prefString);
		
		if (pref)
			QuickFolders.Preferences.setIntPreference(pref.getAttribute('name'), txtBox.value);
		return QuickFolders.Interface.updateMainWindow();
	},
	
	// doing what instantApply really should provide...
	toggleBoolPreference: function(cb, noUpdate) {
		var prefString = cb.getAttribute("preference");
		var pref = document.getElementById(prefString);
		
		if (pref)
			QuickFolders.Preferences.setBoolPref(pref.getAttribute('name'), cb.checked);
		if (noUpdate)
			return true;
		return QuickFolders.Interface.updateMainWindow();
	},
	
	toggleColorTranslucent: function (cb, pickerId, label, userStyle) {
		var picker = document.getElementById(pickerId);
		document.getElementById(label).style.backgroundColor=
			QuickFolders.Util.getRGBA(picker.color, cb.checked ? 0.25 : 1.0);
		if (userStyle)
			QuickFolders.Preferences.setUserStyle(userStyle, 'background-color', picker.color);

		// problems with instantapply?
		var prefString = cb.getAttribute("preference");
		var pref = document.getElementById(prefString);
		
		if (pref)
			QuickFolders.Preferences.setBoolPref(pref.getAttribute('name'), cb.checked);
		
		return QuickFolders.Interface.updateMainWindow();
	},
	
	// switch pastel mode on preview tabs
	initPreviewTabStyles: function () {
		let inactiveTab = document.getElementById('inactivetabs-label');
		let activeTab = document.getElementById('activetabs-label');
		let hoverTab = document.getElementById('hoveredtabs-label');
		let dragTab = document.getElementById('dragovertabs-label');
		let menupopup = document.getElementById("QuickFolders-Options-PalettePopup");
		
		this.preparePreviewTab('inactive-colorpicker', 'style.InactiveTab.', 'inactivetabs-label');
		this.preparePreviewTab('activetab-colorpicker', 'style.ActiveTab.', 'activetabs-label');
		this.preparePreviewTab('hover-colorpicker', 'style.HoveredTab.', 'hoveredtabs-label');
		this.preparePreviewTab('dragover-colorpicker', 'style.DragOver.', 'dragovertabs-label');

	} ,

	// toggle pastel mode was toggleColorPastel
	showPalettePreview: function (withUpdate) {
	  let defaultPalette = QuickFolders.Preferences.getIntPref('style.InactiveTab.paletteType');
	  let isPastel = (defaultPalette == 2);
		document.getElementById('ExampleStripedColor').src=
			isPastel ? "chrome://quickfolders/skin/ico/striped-example-pastel.gif" : "chrome://quickfolders/skin/ico/striped-example.gif";
		document.getElementById('ExampleFilledColor').src=
			isPastel ? "chrome://quickfolders/skin/ico/full-example-pastel.gif" : "chrome://quickfolders/skin/ico/full-example.gif";

		var picker = document.getElementById('inactive-colorpicker');
	
		document.getElementById('activetabs-label').style.backgroundColor=
			QuickFolders.Util.getRGBA(picker.color, isPastel ? 0.25 : 1.0);
		QuickFolders.Preferences.setUserStyle('InactiveTab','background-color', picker.color);
		QuickFolders.Preferences.setBoolPrefQF('pastelColors', isPastel);
		
		this.initPreviewTabStyles();
		
		if (withUpdate) {
		  QuickFolders.Interface.updateMainWindow();
		}
	},


	showButtonShadow: function(isChecked) {
		var el= document.getElementById('inactivetabs-label');
		var myStyle = isChecked ? "1px -1px 3px -1px rgba(0,0,0,0.7)" : "none";
		el.style.MozBoxShadow = myStyle;
		return QuickFolders.Interface.updateMainWindow();
	},

	// Set Default Colors (partly from system colors) 
	//   - will be converted to rgb values to avoid error messages on color pickers
	setDefaultColors: function() {
		var highlightColor = QuickFolders.Util.getSystemColor("Highlight");
		var highlightTextColor = QuickFolders.Util.getSystemColor("HighlightText");
		var buttonfaceColor = QuickFolders.Util.getSystemColor("buttonface");
		var buttontextColor = QuickFolders.Util.getSystemColor("buttontext");


		document.getElementById("activetab-colorpicker").color = highlightColor;
		document.getElementById("activetabs-label").style.backgroundColor = highlightColor;
		document.getElementById("activetab-fontcolorpicker").color = highlightTextColor;
		document.getElementById("activetabs-label").style.color = highlightTextColor;

		document.getElementById("hover-colorpicker").color = QuickFolders.Util.getSystemColor("orange");
		document.getElementById("hover-fontcolorpicker").color = "#FFF";
		document.getElementById("hoveredtabs-label").style.color = "#FFF";
		document.getElementById("hoveredtabs-label").style.backgroundColor = QuickFolders.Util.getSystemColor("orange");

		document.getElementById("dragover-colorpicker").color = "#E93903";
		document.getElementById("dragover-fontcolorpicker").color = "#FFF";
		document.getElementById("dragovertabs-label").style.color = "#FFF";
		document.getElementById("dragovertabs-label").style.backgroundColor = "#E93903";

		document.getElementById("toolbar-colorpicker").color = buttonfaceColor;
		document.getElementById("inactive-colorpicker").color = buttonfaceColor;
		document.getElementById("inactivetabs-label").style.backgroundColor = buttonfaceColor;
		document.getElementById("inactive-fontcolorpicker").color = buttontextColor;
		document.getElementById("inactivetabs-label").style.color = buttontextColor;
		return QuickFolders.Interface.updateMainWindow();
	},

	sendMail: function(mailto) {
		let sURL = "mailto:" + mailto + "?subject=[QuickFolders]%20<add%20your%20own%20subject%20line%20here>";
		let MessageComposer=Components.classes["@mozilla.org/messengercompose;1"].getService(Components.interfaces.nsIMsgComposeService);
		// make the URI
		let ioService = Components.classes["@mozilla.org/network/io-service;1"]
							.getService(Components.interfaces.nsIIOService);
		let aURI = ioService.newURI(sURL, null, null);
		window.close();
		// open new message
		MessageComposer.OpenComposeWindowWithURI (null, aURI);

	},


	dumpFolderEntries: function() {
		// debug function for checking users folder string (about:config has trouble with editing JSON strings)
		var service = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefBranch);

		try {
			var sFolderString = service.getCharPref("QuickFolders.folders");
			sFolderString = service.getComplexValue("QuickFolders.folders", Components.interfaces.nsISupportsString).data;


			var clipboardhelper = Components.classes["@mozilla.org/widget/clipboardhelper;1"].getService(Components.interfaces.nsIClipboardHelper);

			QuickFolders.Util.logToConsole("Folder String: " & sFolderString);
			clipboardhelper.copyString(sFolderString);
			alert(QuickFolders.Util.getBundleString("qfAlertCopyString", "Folder String copied to clipboard."));
		}
		catch(e) {
			alert(e);
		}

	},

	showAboutConfig: function(clickedElement, filter, readOnly) {
		const name = "Preferences:ConfigManager";
		const uri = "chrome://global/content/config.xul";

		var mediator = Components.classes["@mozilla.org/appshell/window-mediator;1"].getService(Components.interfaces.nsIWindowMediator);
		var w = mediator.getMostRecentWindow(name);

		var win = clickedElement.ownerDocument.defaultView ? clickedElement.ownerDocument.defaultView : window;
		if (!w) {
			var watcher = Components.classes["@mozilla.org/embedcomp/window-watcher;1"].getService(Components.interfaces.nsIWindowWatcher);
			w = watcher.openWindow(win, uri, name, "dependent,chrome,resizable,centerscreen,alwaysRaised,width=500px,height=350px", null);
		}
		w.focus();
		w.setTimeout(
			function (readOnly) {
				var flt = w.document.getElementById("textbox");
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
			}, 300);
	},

	addConfigFeature: function(filter, Default, textPrompt) {
		// adds a new option to about:config, that isn't there by default
		if (confirm(textPrompt)) {
			// create (non existent filter setting:
			QuickFolders.Preferences.setBoolPref(filter, Default);
			QuickFolders.Options.showAboutConfig(filter, true);
		}
	},

	showVersionHistory: function(label, ask) {
		let pureVersion=QuickFolders.Util.VersionSanitized;
		let sPrompt = QuickFolders.Util.getBundleString("qfConfirmVersionLink", "Display version history for QuickFolders")
		if (!ask || confirm(sPrompt + " " + pureVersion + "?")) {
			QuickFolders.Util.openURL(null, "http://quickfolders.mozdev.org/version.html" + "#" + pureVersion);
		}
	},
	
	toggleCurrentFolderBar: function(chk) {
		var checked = chk.checked ? chk.checked : false;
		QuickFolders.Interface.displayNavigationToolbar(checked, false);
	},
	
	toggleCurrentFolderBar_SingleMessage: function(chk) {
		var checked = chk.checked ? chk.checked : false;
		QuickFolders.Interface.displayNavigationToolbar(checked, true);
	}

	
}


