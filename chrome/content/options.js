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
    accept: function() {
        var observerService = Components.classes["@mozilla.org/observer-service;1"].getService(Components.interfaces.nsIObserverService);
        observerService.notifyObservers(null, "quickfolders-options-saved", null);
	    // persist colors
	    try {
		    QuickFolders.Preferences.setUserStyle("ActiveTab","background-color",
		                                          document.getElementById("activetab-colorpicker").color);
		    QuickFolders.Preferences.setUserStyle("ActiveTab","color",
		                                          document.getElementById("activetab-fontcolorpicker").color);
		                                          
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
	    
    }
}


