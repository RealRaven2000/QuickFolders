const QF_CC = Components.classes;
const QF_CI = Components.interfaces;


function QF_getAddon(aId) {
	var em = QF_CC["@mozilla.org/extensions/manager;1"]
       .getService(QF_CI.nsIExtensionManager);
  return em.getItemForID(aId);
}

function QF_getMyVersion() {
  return QF_getAddon("quickfolders@curious.be").version;
}


var QF_TabURIregexp = {
    get _thunderbirdRegExp() {
      delete this._thunderbirdRegExp;
      return this._thunderbirdRegExp = new RegExp("^http://quickfolders.mozdev.org/");
    }
};

// open the new content tab for displaying support info, see
// https://developer.mozilla.org/en/Thunderbird/Content_Tabs
var QF_TabURIopener = {

    openURLInTab: function (URL) {
	    try {
			var sTabMode="";
			var tabmail;
			tabmail = document.getElementById("tabmail");
			if (!tabmail) {
			  // Try opening new tabs in an existing 3pane window
			  var mail3PaneWindow = QF_CC["@mozilla.org/appshell/window-mediator;1"]
			                             .getService(QF_CI.nsIWindowMediator)
			                             .getMostRecentWindow("mail:3pane");
			  if (mail3PaneWindow) {
			    tabmail = mail3PaneWindow.document.getElementById("tabmail");
			    mail3PaneWindow.focus();
			  }
			}
			if (tabmail) {
		      sTabMode = (QuickFolders.Util.Application() == "Thunderbird" && QuickFolders.Util.Appver()>=3) ? "contentTab" : "3pane";
			  tabmail.openTab(sTabMode,
			      {contentPage: URL, clickHandler: "specialTabs.siteClickHandler(event, QF_TabURIregexp._thunderbirdRegExp);"});

	        }
			else
			  window.openDialog("chrome://messenger/content/", "_blank",
			                  "chrome,dialog=no,all", null,
			  { tabType: "contentTab", tabParams: {contentPage: URL, clickHandler: "specialTabs.siteClickHandler(event, QF_TabURIregexp._thunderbirdRegExp);", id:"QF_Weblink"} } );
		}
		catch(e) { return false; }
		return true;
    }
};


var QuickFoldersOptions = {
    qfStaticInstantApply : true,
    qfOptionsMode : "",
    accept: function() {
	    if (this.qfOptionsMode=="helpOnly" || this.qfOptionsMode=="supportOnly")
	      return; // do not store any changes!
        var observerService = Components.classes["@mozilla.org/observer-service;1"].getService(Components.interfaces.nsIObserverService);
        observerService.notifyObservers(null, "quickfolders-options-saved", null);
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
    } ,
    load : function() {
	    var version=QF_getMyVersion();
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
					  if (i!=keep)  tabbox.tabpanels.removeChild(tabbox.tabpanels.children[i]);
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
	  // if (qfStaticInstantApply)        QuickFolders.Preferences.setInstantApplyPref(true);
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

    getResourceString: function(id) {
      var theBundleService = Components.classes["@mozilla.org/intl/stringbundle;1"].getService(Components.interfaces.nsIStringBundleService);
      var qfBundle = theBundleService.createBundle("chrome://quickfolders/locale/quickfolders.properties");
      var s="";
      try {s= qfBundle.GetStringFromName(id);}
      catch(e) { s= "Could not retrieve bundle string: " + id + "\n" + e; }
      return s;
    },

    QF_mail: function(mailto)  {

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
	    var sFolderString = service.getCharPref("QuickFolders.folders");
      var clipboardhelper = Components.classes["@mozilla.org/widget/clipboardhelper;1"].getService(Components.interfaces.nsIClipboardHelper);

	    QuickFolders.Util.logToConsole("Folder String: " & sFolderString);
	    clipboardhelper.copyString(sFolderString);
	    alert(this.getResourceString("qfAlertCopyString"));

    },

    openAboutConfigDebug : function() {
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
			   flt.value="quickfolders.debug"
			   flt.focus();
			   if (w.self.FilterPrefs)
			     w.self.FilterPrefs();
		   }
          }, 300);
	},

    openLinkInBrowser: function(evt,linkURI) {
	    if (QuickFolders.Util.Appver()==3 && QuickFolders.Util.Application()=='Thunderbird') {
	       var service = Components.classes["@mozilla.org/uriloader/external-protocol-service;1"]
	       		.getService(Components.interfaces.nsIExternalProtocolService);
	       var ioservice  = QF_CC["@mozilla.org/network/io-service;1"].
			            getService(QF_CI.nsIIOService);
	       	service.loadURI(ioservice.newURI(linkURI, null, null));
	       	evt.stopPropagation();
    	}
	},

	openURL: function(evt,URL) { // workaround for a bug in TB3 that causes href's not be followed anymore.
		var ioservice,iuri,eps;
		//if (QuickFolders.Util.Application()=="Postbox")
		//	return; // label with href already follows the link!
		if (QuickFolders.Util.Appver()<3 && QuickFolders.Util.Application()=='Thunderbird' || QuickFolders.Util.Application()=='SeaMonkey')
		{
			this.openLinkInBrowser(evt,URL);
		}
		else {
			// also affect SeaMonkey?
			if (QF_TabURIopener.openURLInTab(URL)) {
			  evt.preventDefault();
			  evt.stopPropagation();
		    }
		}
	}


}


