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
    } ,
    load : function() {
	    var version=QF_getMyVersion();
		if (version=="") version='version?';
	    document.getElementById("qf-options-header-description").setAttribute("value", version);
    },
    
    setElementColor: function(element, col) {
	    // alert("setElementColor!");
	    alert("Set color of css class " + element + " to " + col);
	    // to do: find elements of this class and change their color
	    // find the class element itself and change its properties
	    // persist in options
	    // load on startup
	    return true;
	    // planned for later: 
	    //            add default color pick; 
	    //            add system colors such as ButtonFace, Highlight, HighlightText etc.
	    // even later: 
	    //            extend the color picker to select 2 colors and a gradient direction (vertical / horizontal)
    }
    
}

