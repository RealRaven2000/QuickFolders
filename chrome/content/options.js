const QF_CC = Components.classes;
const QF_CI = Components.interfaces;


function QF_getAddon(aId) {
  return QF_CC["@mozilla.org/extensions/manager;1"]
       .getService(QF_CI.nsIExtensionManager)
       .getItemForID(aId);
}

function QF_getMyVersion() {
  return QF_getAddon("{3550f703-e582-4d05-9a08-453d09bdfdc6}").version;
}

var QuickFoldersOptions = {
    accept: function() {
        var observerService = Components.classes["@mozilla.org/observer-service;1"].getService(Components.interfaces.nsIObserverService);
        observerService.notifyObservers(null, "quickfolders-options-saved", null);
    } ,
    load : function() {
	    var version=QF_getMyVersion();
		//alert ("Version=" + version);
		if (version=="") version='0.9';
	     document.getElementById("qf-options-header-description").setAttribute("value", version);
    }
}

