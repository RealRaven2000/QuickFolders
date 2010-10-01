// now register myself as a listener on every mail folder
var mailSession = Components.classes["@mozilla.org/messenger/services/session;1"].getService(Components.interfaces.nsIMsgMailSession);
mailSession.AddFolderListener(QuickFolders.FolderListener, Components.interfaces.nsIFolderListener.all);

QuickFolders.addLoadEventListener();
