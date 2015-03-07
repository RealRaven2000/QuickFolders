"use strict";
// now register myself as a listener on every mail folder
var QuickFolders_mailSession = Components.classes["@mozilla.org/messenger/services/session;1"].getService(Components.interfaces.nsIMsgMailSession);

// QuickFolders_mailSession.AddFolderListener(QuickFolders.FolderListener, Components.interfaces.nsIFolderListener.all);
// QuickFolders.addLoadEventListener();

// note: addTabEventListener() is called during QuickFolders.init()