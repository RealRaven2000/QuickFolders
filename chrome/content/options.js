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

	accept: function() {
		if (this.optionsMode=="helpOnly" || this.optionsMode=="supportOnly")
			return; // do not store any changes!
		// persist colors
		try {
			QuickFolders.Preferences.setCurrentThemeId(document.getElementById("QuickFolders-Theme-Selection").value);

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

		}
		catch(e) {
			alert("Error in QuickFolders:\n" + e);
		};
		var tabbox = window.document.getElementById("QuickFolders-Options-Tabbox");
		QuickFolders.Preferences.setIntPrefQF('lastSelectedOptionsTab', tabbox.selectedIndex);
		var observerService = Components.classes["@mozilla.org/observer-service;1"].getService(Components.interfaces.nsIObserverService);
		observerService.notifyObservers(null, "quickfolders-options-saved", null);
	} ,

	load: function() {
		if (window.arguments && window.arguments[1].inn.instance) {
			// QuickFolders = window.arguments[1].inn.instance; // avoid creating a new QuickFolders instance, reuse the one passed in!!
			QuickFolders.Util.mExtensionVer = window.arguments[1].inn.instance.Util.Version();
		}
		
		var version=QuickFolders.Util.Version();
		var wd=window.document;
		try {
			this.optionsMode = window.arguments[1].inn.mode;
			// force selection of a certain pane (-1 ignores)
			if (window.arguments[2].inn.mode >= 0)
				QuickFolders.Preferences.setIntPrefQF('lastSelectedOptionsTab', window.arguments[2].inn.mode);
		}
		catch(e) {;}

		if (version=="") version='version?';

		wd.getElementById("qf-options-header-description").setAttribute("value", version);
		var tabbox = wd.getElementById("QuickFolders-Options-Tabbox");
		// hide first 2 tabs!!
		if (this.optionsMode=="helpOnly" || this.optionsMode=="supportOnly") {
			if (tabbox) {
				var keep;
				switch(this.optionsMode) {
					case "helpOnly":
						keep=2;
						break;
					case "supportOnly":
						keep=3;
						break;
				}
				// remove the first 2 (options tab)
				if (QuickFolders.Util.Appver()<3 && QuickFolders.Util.Application()=='Thunderbird') {
					// only display the srcond page to avoid errors in TB2
					for (var i=3; i>=0; i--)
					tabbox._tabs.removeItemAt(i); // remove all tabs
					for (var i=3; i>=0; i--)
						if (i!=keep) tabbox._tabpanels.removeChild(tabbox._tabpanels.childNodes[i]);
				}
				else {
					for (var i=3; i>=0; i--)
					tabbox.tabs.removeItemAt(i);
					for (var i=3; i>=0; i--)
						if (i!=keep)	tabbox.tabpanels.removeChild(tabbox.tabpanels.children[i]);
				}
			}
			return; // we do not set any values!
		}

		// initialize colorpickers
		try {

			if (QuickFolders.Util.Appver()<3 && QuickFolders.Util.Application()=='Thunderbird') {
				// toggle off and disable shadow!
				if (QuickFolders.Preferences.getBoolPref("extensions.quickfolders.buttonShadows")==true)
					QuickFolders.Preferences.setBoolPref("extensions.quickfolders.buttonShadows", false);
				var cb=wd.getElementById("qf-options-shadow");
				wd.getElementById("qf-options-shadow").display="none";
				cb.style.display="none";
			}

			var col, bcol;
			bcol=QuickFolders.Preferences.getUserStyle("ActiveTab","background-color","HighLight");
			wd.getElementById("activetab-colorpicker").color=bcol;
			col=QuickFolders.Preferences.getUserStyle("ActiveTab","color","HighlightText");
			wd.getElementById("activetab-fontcolorpicker").color=col;
			wd.getElementById("activetabs-label").style.color=col;
			wd.getElementById("activetabs-label").style.backgroundColor=bcol;

			bcol=QuickFolders.Preferences.getUserStyle("InactiveTab","background-color","ButtonFace");
			wd.getElementById("inactive-colorpicker").color=bcol;

			//support transparency and shadow
			var transcol = QuickFolders.Util.getRGBA(bcol, QuickFolders.Preferences.getBoolPref("extensions.quickfolders.transparentButtons") ? 0.25 : 1.0);
			wd.getElementById("inactivetabs-label").style.backgroundColor=transcol;
			this.showButtonShadow(QuickFolders.Preferences.getBoolPref("extensions.quickfolders.buttonShadows"));

			col=QuickFolders.Preferences.getUserStyle("InactiveTab","color","black");
			wd.getElementById("inactive-fontcolorpicker").color=col;
			wd.getElementById("inactivetabs-label").style.color=col;


			bcol=QuickFolders.Preferences.getUserStyle("HoveredTab","background-color","Orange");
			wd.getElementById("hover-colorpicker").color=bcol;
			col=QuickFolders.Preferences.getUserStyle("HoveredTab","color","Black");
			wd.getElementById("hover-fontcolorpicker").color=col;
			wd.getElementById("hoveredtabs-label").style.color=col;
			wd.getElementById("hoveredtabs-label").style.backgroundColor=bcol;

			bcol=QuickFolders.Preferences.getUserStyle("DragTab","background-color", "#E93903");
			wd.getElementById("dragover-colorpicker").color=bcol;
			col=QuickFolders.Preferences.getUserStyle("DragTab","color", "White");
			wd.getElementById("dragover-fontcolorpicker").color=col;
			wd.getElementById("dragovertabs-label").style.color=col;
			wd.getElementById("dragovertabs-label").style.backgroundColor=bcol;
			wd.getElementById("toolbar-colorpicker").color=QuickFolders.Preferences.getUserStyle("Toolbar","background-color", "White");

			this.selectTheme(wd, QuickFolders.Preferences.getCurrentThemeId());

			// initialize Theme Selector by adding original titles to localized versions
			var cbo = wd.getElementById("QuickFolders-Theme-Selection");
			if (cbo.itemCount)
				for (var index=0; index<cbo.itemCount; index++) {
					var item = cbo.getItemAtIndex( index );
					var theme = QuickFolders.Themes.Theme(item.value);
					if (theme) {
						if (item.label != theme.name)
							item.label = theme.name + ' - ' + item.label
					}
				}

			try {
				var selectOptionsPane = QuickFolders.Preferences.getIntPrefQF('lastSelectedOptionsTab');
				if (selectOptionsPane >=0)
					tabbox.selectedIndex = selectOptionsPane; // 1 for pimp my tabs
			}
			catch(e) { ; }
		}
		catch(e) {
			alert("Error in QuickFolders:\n" + e);
		};
		if (this.message && this.message!='') {
			alert(message);
			message = '';
		}

	},

	selectTheme: function(wd, themeId) {
		var myTheme =  QuickFolders.Themes.Theme(themeId);
		if (myTheme) {
			wd.getElementById("QuickFolders-Theme-Selection").value = themeId;

			document.getElementById("Quickfolders-Theme-Author").value
				= myTheme.author;

			// textContent wraps, value doesnt
			document.getElementById("Quickfolders-Theme-Description").textContent
				= QuickFolders.Interface.getUIstring("qf.themes." + themeId + ".description", "N/A");

			document.getElementById("qf-options-icons").disabled
				= !(myTheme.supportsFeatures.specialIcons);
			document.getElementById("qf-options-shadow").collapsed
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

			document.getElementById("chkPastelColors").collapsed
				= !(myTheme.supportsFeatures.pastelColors);

			document.getElementById("qf-StandardColors").collapsed
				= !(myTheme.supportsFeatures.standardTabColor);

			document.getElementById("buttonTransparency").collapsed
				= !(myTheme.supportsFeatures.tabTransparency);


			document.getElementById("qf-stateColors").collapsed
				= !(myTheme.supportsFeatures.stateColors);
				
			document.getElementById("qf-stateColors-defaultButton").collapsed
				= !(myTheme.supportsFeatures.stateColors);

			/******  FOR FUTURE USE ??  ******/
			// if (myTheme.supportsFeatures.supportsFontSelection)
			// if (myTheme.supportsFeatures.buttonInnerShadows)

			QuickFolders.Util.logDebug ('Theme [' + myTheme.Id + '] selected');

		}
	} ,


	close : function () {
		this.optionsMode="";
	},

	toggleMutexCheckbox: function(cbox, cbox2Name) {
		var prefString1 = cbox.getAttribute("preference");
		var prefName1 = document.getElementById(prefString1).getAttribute('name');
		var cbox2 = document.getElementById(cbox2Name);
		if(!QuickFolders.Preferences.getBoolPref(prefName1)) { // not yet checked but will be after event is propagated.
			var prefString2 = cbox2.getAttribute("preference");
			var prefName2 = document.getElementById(prefString2).getAttribute('name');
			// uncheck the other checkbox
			if (QuickFolders.Preferences.getBoolPref(prefName2))
				QuickFolders.Preferences.setBoolPref(prefName2, false);
		}
	},

	setDefaultButtonRadius: function() {
		document.getElementById("QuickFolders-Options-CustomTopRadius").value = "4px";
		document.getElementById("QuickFolders-Options-CustomBottomRadius").value = "0px";

	},

	colorPickerTranslucent: function (picker) {
		document.getElementById('inactivetabs-label').style.backgroundColor=
			QuickFolders.Util.getRGBA(picker.color, document.getElementById('buttonTransparency').checked ? 0.25 : 1.0);
		return QuickFolders.Preferences.setUserStyle('InactiveTab','background-color', picker.color);
	},

	toggleColorTranslucent: function (isChecked) {
		var picker = document.getElementById('inactive-colorpicker');
		document.getElementById('inactivetabs-label').style.backgroundColor=
			QuickFolders.Util.getRGBA(picker.color, isChecked ? 0.25 : 1.0);
		return QuickFolders.Preferences.setUserStyle('InactiveTab','background-color', picker.color);
	},

	toggleColorPastel: function (isChecked) {
		document.getElementById('ExampleStripedColor').src=
			isChecked ? "chrome://quickfolders/skin/ico/striped-example-pastel.gif" : "chrome://quickfolders/skin/ico/striped-example.gif";
		document.getElementById('ExampleFilledColor').src=
			isChecked ? "chrome://quickfolders/skin/ico/full-example-pastel.gif" : "chrome://quickfolders/skin/ico/full-example.gif";

		var picker = document.getElementById('inactive-colorpicker');
		document.getElementById('inactivetabs-label').style.backgroundColor=
			QuickFolders.Util.getRGBA(picker.color, isChecked ? 0.25 : 1.0);
		return QuickFolders.Preferences.setUserStyle('InactiveTab','background-color', picker.color);
	},


	showButtonShadow: function(isChecked) {
		var el= document.getElementById('inactivetabs-label');
		var myStyle = isChecked ? "1px -1px 3px -1px rgba(0,0,0,0.7)" : "none";
		el.style.MozBoxShadow = myStyle;
	},

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

		document.getElementById("dragover-colorpicker").color="#E93903";
		document.getElementById("dragover-fontcolorpicker").color="#FFF";
		document.getElementById("dragovertabs-label").style.color="#FFF";
		document.getElementById("dragovertabs-label").style.backgroundColor="#E93903";

		document.getElementById("toolbar-colorpicker").color=buttonfaceColor;


		document.getElementById("inactive-colorpicker").color = buttonfaceColor;
		document.getElementById("inactivetabs-label").style.backgroundColor = buttonfaceColor;
		document.getElementById("inactive-fontcolorpicker").color = buttontextColor;
		document.getElementById("inactivetabs-label").style.color = buttontextColor;
	},

	sendMail: function(mailto)	{

		var sURL="mailto:" + mailto + "?subject=[QuickFolders]%20<add%20your%20own%20subject%20line%20here>";
		var msgComposeService=Components.classes["@mozilla.org/messengercompose;1"].getService(Components.interfaces.nsIMsgComposeService);
		// make the URI
		var ioService = Components.classes["@mozilla.org/network/io-service;1"]
							.getService(Components.interfaces.nsIIOService);
		aURI = ioService.newURI(sURL, null, null);
		// open new message
		msgComposeService.OpenComposeWindowWithURI (null, aURI);

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

	showAboutConfig: function(filter) {

		const name = "Preferences:ConfigManager";
		const uri = "chrome://global/content/config.xul";

		var mediator = Components.classes["@mozilla.org/appshell/window-mediator;1"].getService(Components.interfaces.nsIWindowMediator);
		var w = mediator.getMostRecentWindow(name);

		if (!w) {
			var watcher = Components.classes["@mozilla.org/embedcomp/window-watcher;1"].getService(Components.interfaces.nsIWindowWatcher);
			w = watcher.openWindow(null, uri, name, "chrome,resizable,centerscreen,width=500px,height=350px", null);
		}
		w.focus();
		w.setTimeout(
			function () {
				var flt = w.document.getElementById("textbox");
				if (flt) {
					 flt.value=filter;
					 flt.focus();
					 if (w.self.FilterPrefs)
					 w.self.FilterPrefs();
				}
			}, 300);
	},


	addConfigFeature: function(filter, Default, textPrompt) {
		// adds a new option to about:config, that isn't there by default
		if (confirm(textPrompt)) {
			// create (non existent filter setting:
			QuickFolders.Preferences.setBoolPref(filter, Default);

			QuickFolders.Options.showAboutConfig(filter);
		}

	},

	showVersionHistory: function(label, ask) {
		var pre=0;
		var current=QuickFolders.Util.Version();
		var pureVersion = current;
		if (0<(pre=current.indexOf('pre'))) {   // make sure to strip of any pre release labels
			pureVersion = current.substring(0,pre);
		}

		var sPrompt = QuickFolders.Util.getBundleString("qfConfirmVersionLink", "Display version history for QuickFolders")
		if (!ask || confirm(sPrompt + " " + pureVersion + "?")) {
			QuickFolders.Util.openURL(null, "http://quickfolders.mozdev.org/version.html" + "#" + pureVersion);
		}
	}
}


