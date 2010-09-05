/* BEGIN LICENSE BLOCK

GPL3 applies.
For detail, please refer to license.txt in the root folder of this extension

END LICENSE BLOCK */

function QuickFolders_getAddon(aId) {
	var em = Components.classes["@mozilla.org/extensions/manager;1"]
		 .getService(Components.interfaces.nsIExtensionManager);
	return em.getItemForID(aId);
}

function QuickFolders_getMyVersion() {
	return QuickFolders_getAddon("quickfolders@curious.be").version;
}


var QuickFolders_TabURIregexp = {
	get _thunderbirdRegExp() {
		delete this._thunderbirdRegExp;
		return this._thunderbirdRegExp = new RegExp("^http://quickfolders.mozdev.org/");
	}
};


var QuickFoldersOptions = {
	qfStaticInstantApply : true,
	qfOptionsMode : "",

	accept: function() {
		if (this.qfOptionsMode=="helpOnly" || this.qfOptionsMode=="supportOnly")
			return; // do not store any changes!
		// persist colors
		try {
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

		}
		catch(e) {
			alert("Error in QuickFolders:\n" + e);
		};
		var observerService = Components.classes["@mozilla.org/observer-service;1"].getService(Components.interfaces.nsIObserverService);
		observerService.notifyObservers(null, "quickfolders-options-saved", null);
	} ,
	load : function() {
		var version=QuickFolders_getMyVersion();
		var wd=window.document;
		try { this.qfOptionsMode = window.arguments[1].inn.mode;}
		catch(e) {;}
		// force instantapply off
		/*
		qfStaticInstantApply = QuickFolders.Preferences.getInstantApplyPref();
		if (qfStaticInstantApply)
			QuickFolders.Preferences.setInstantApplyPref(false);
		*/

		if (version=="") version='version?';

		wd.getElementById("qf-options-header-description").setAttribute("value", version);
		// hide first 2 tabs!!
		if (this.qfOptionsMode=="helpOnly" || this.qfOptionsMode=="supportOnly") {
			var tabbox = wd.getElementById("QuickFolders-Options-Tabbox");
			if (tabbox) {
				var keep;
				switch(this.qfOptionsMode) {
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
				// try to remove Shadow Checkbox in TB2... doesn't work for some reason ?
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



		}
		catch(e) {
			alert("Error in QuickFolders:\n" + e);
		};

	},
	close : function () {
		this.qfOptionsMode="";
		// unfortunately, this is not executed when user clicks [CLose] button!
		// restore instant apply
		// if (qfStaticInstantApply)		QuickFolders.Preferences.setInstantApplyPref(true);
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

	showButtonShadow: function(isChecked) {
		var el= document.getElementById('inactivetabs-label');
		var myStyle = isChecked ? "1px -1px 3px -1px rgba(0,0,0,0.7)" : "none";
		el.style.MozBoxShadow = myStyle;
	},

	setDefaultColors: function() {
		document.getElementById("activetab-colorpicker").color="Highlight";
		document.getElementById("activetabs-label").style.backgroundColor="Highlight";
		document.getElementById("activetab-fontcolorpicker").color="HighlightText";
		document.getElementById("activetabs-label").style.color="HighlightText";

		document.getElementById("hover-colorpicker").color="orange";
		document.getElementById("hover-fontcolorpicker").color="white";
		document.getElementById("hoveredtabs-label").style.color="white";
		document.getElementById("hoveredtabs-label").style.backgroundColor="orange";

		document.getElementById("dragover-colorpicker").color="#E93903";
		document.getElementById("dragover-fontcolorpicker").color="white";
		document.getElementById("dragovertabs-label").style.color="white";
		document.getElementById("dragovertabs-label").style.backgroundColor="#E93903";

		document.getElementById("toolbar-colorpicker").color="transparent";


		document.getElementById("inactive-colorpicker").color="buttonface";
		document.getElementById("inactivetabs-label").style.backgroundColor="buttonface";
		document.getElementById("inactive-fontcolorpicker").color="buttontext";
		document.getElementById("inactivetabs-label").style.color="buttontext";
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

			QuickFoldersOptions.showAboutConfig(filter);
		}

	},

	showVersionHistory: function(label) {
		var pre=0;
		var current=label.value.toString();  // retrieve version number from label
		var pureVersion = current;
		if (0<(pre=current.indexOf('pre'))) {   // make sure to strip of any pre release labels
			pureVersion = current.substring(0,pre);
		}
		var sPrompt = QuickFolders.Util.getBundleString("qfConfirmVersionLink", "Display version history for QuickFolders")
		if (confirm(sPrompt + " " + pureVersion + "?")) {
			QuickFolders.Util.openURL(null, "http://quickfolders.mozdev.org/version.html" + "#" + pureVersion);
		}
	}
}


