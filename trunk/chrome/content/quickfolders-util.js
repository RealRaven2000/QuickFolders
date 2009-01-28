var qfConsoleService=null;

QuickFolders.Util = {
    $: function(id) {
        return document.getElementById(id);
    } ,

    clearChildren: function(element) {
        while(element.childNodes.length > 0) {
            element.removeChild(element.childNodes[0]);
        }
    } ,

    ensureNormalFolderView: function() {
        if(loadFolderView != undefined) {
            //default folder view to "All folders", so we can select it
            loadFolderView(0);
        }
    } ,


    getFolderUriFromDropData: function(dropData, dragSession) {
       var trans = Components.classes["@mozilla.org/widget/transferable;1"].createInstance(Components.interfaces.nsITransferable);
        trans.addDataFlavor("text/x-moz-folder");

        dragSession.getData (trans, 0);
        var dataObj = new Object();
        var flavor = new Object();
        var len = new Object();
        trans.getAnyTransferData(flavor, dataObj, len);

        if (dataObj) {
            dataObj = dataObj.value.QueryInterface(Components.interfaces.nsISupportsString);
            sourceUri = dataObj.data.substring(0, len.value);
            return sourceUri;
        }

        return null;
    } ,

    moveMessages: function(targetFolder, messageUris, makeCopy) {
        var targetResource = targetFolder.QueryInterface(Components.interfaces.nsIRDFResource);

        var messageList = Components.classes["@mozilla.org/supports-array;1"].createInstance(Components.interfaces.nsISupportsArray);

        for (var i = 0; i < messageUris.length; i++) {
            var messageUri = messageUris[i];
            messageList.AppendElement(messenger.messageServiceFromURI(messageUri).messageURIToMsgHdr(messageUri));
        }

        var sourceMsgHdr = messageList.GetElementAt(0).QueryInterface(Components.interfaces.nsIMsgDBHdr);
        var sourceFolder = sourceMsgHdr.folder;
        var sourceResource = sourceFolder.QueryInterface(Components.interfaces.nsIRDFResource);

        messenger.CopyMessages(GetFolderDatasource(), sourceResource, targetResource, messageList, !makeCopy);
    } ,


    debugVar: function(value) {
        str = "Value: " + value + "\r\n";
        for(prop in value) {
            str += prop + " => " + value[prop] + "\r\n";
        }

        dump(str);
    },

    logToConsole: function (msg) {
	  if (qfConsoleService == null)
	    qfConsoleService = Components.classes["@mozilla.org/consoleservice;1"]
	                               .getService(Components.interfaces.nsIConsoleService);
	  qfConsoleService.logStringMessage("Quickfolders:" +msg);
	}
    
}