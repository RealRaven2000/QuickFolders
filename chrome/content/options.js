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

var QuickFoldersOptions = {
    qfStaticInstantApply : true,
    accept: function() {
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

		  // remove event listener before add is _not_ necessary as duplicates will be discarded:
      if (QuickFolders.Preferences.isUseKeyboardShortcuts()) {
        window.addEventListener("keypress", QuickFolders.keyListener = function(e) { QuickFolders.Interface.windowKeyPress(e,'down'); }, true);
        window.addEventListener("keyup", QuickFolders.keyListener = function(e) { QuickFolders.Interface.windowKeyPress(e,'up'); }, true);
        QuickFolders.Interface.boundKeyListener = true;
      }
      else {
        window.removeEventListener("keypress", QuickFolders.keyListener, true);
        window.removeEventListener("keyup", QuickFolders.keyListener, true);
        QuickFolders.Interface.boundKeyListener = false;
      }
    } ,
    load : function() {
	    var version=QF_getMyVersion();
	    // force instantapply off
	    /*
	    qfStaticInstantApply = QuickFolders.Preferences.getInstantApplyPref();
	    if (qfStaticInstantApply)
	      QuickFolders.Preferences.setInstantApplyPref(false);
	    */

		if (version=="") version='version?';
	    document.getElementById("qf-options-header-description").setAttribute("value", version);
	    // initialize colorpickers
	    try {
		    var col,bcol;
		    bcol=QuickFolders.Preferences.getUserStyle("ActiveTab","background-color","HighLight");
		    document.getElementById("activetab-colorpicker").color=bcol;
		    col=QuickFolders.Preferences.getUserStyle("ActiveTab","color","HighlightText");
		    document.getElementById("activetab-fontcolorpicker").color=col;
		    document.getElementById("activetabs-label").style.color=col;
		    document.getElementById("activetabs-label").style.backgroundColor=bcol;

		    bcol=QuickFolders.Preferences.getUserStyle("InactiveTab","background-color","ButtonFace");
		    document.getElementById("inactive-colorpicker").color=bcol;
		    col=QuickFolders.Preferences.getUserStyle("InactiveTab","color","black");
		    document.getElementById("inactive-fontcolorpicker").color=col;
		    document.getElementById("inactivetabs-label").style.color=col;
		    document.getElementById("inactivetabs-label").style.backgroundColor=bcol;


		    bcol=QuickFolders.Preferences.getUserStyle("HoveredTab","background-color","Orange");
		    document.getElementById("hover-colorpicker").color=bcol;
		    col=QuickFolders.Preferences.getUserStyle("HoveredTab","color","Black");
		    document.getElementById("hover-fontcolorpicker").color=col;
		    document.getElementById("hoveredtabs-label").style.color=col;
		    document.getElementById("hoveredtabs-label").style.backgroundColor=bcol;

		    bcol=QuickFolders.Preferences.getUserStyle("DragTab","background-color", "#E93903");
		    document.getElementById("dragover-colorpicker").color=bcol;
		    col=QuickFolders.Preferences.getUserStyle("DragTab","color", "White");
		    document.getElementById("dragover-fontcolorpicker").color=col;
		    document.getElementById("dragovertabs-label").style.color=col;
		    document.getElementById("dragovertabs-label").style.backgroundColor=bcol;
		    document.getElementById("toolbar-colorpicker").color=QuickFolders.Preferences.getUserStyle("Toolbar","background-color", "White");

	    }
	    catch(e) {
		    alert("Error in QuickFolders:\n" + e);
		};

    },
    close : function () {
	  // unfortunately, this is not executed when user clicks [CLose] button!
	  // restore instant apply
	  // if (qfStaticInstantApply)        QuickFolders.Preferences.setInstantApplyPref(true);
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

	    document.getElementById("toolbar-colorpicker").color="#CCCCCC";


	    document.getElementById("inactive-colorpicker").color="buttonface";
	    document.getElementById("inactivetabs-label").style.backgroundColor="buttonface";
	    document.getElementById("inactive-fontcolorpicker").color="buttontext";
	    document.getElementById("inactivetabs-label").style.color="buttontext";
    },

    dumpFolderEntries: function() {
	    // debug function for checking users folder string (about:config has trouble with editing JSON strings)
      var service = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefBranch);
	    var sFolderString = service.getCharPref("QuickFolders.folders");
      var clipboardhelper = Components.classes["@mozilla.org/widget/clipboardhelper;1"].getService(Components.interfaces.nsIClipboardHelper);

	    QuickFolders.Util.logToConsole("Folder String: " & sFolderString);
	    clipboardhelper.copyString(sFolderString);
	    alert("Folder String is now in Clipboard!");

    }

}


