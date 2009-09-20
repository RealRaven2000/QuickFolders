var qfConsoleService=null;


QuickFolders.Util = {
	  // avoid these global objects
	  Cc: Components.classes,
    Ci: Components.interfaces,

    $: function(id) {
        return document.getElementById(id);
    } ,

	// add code for TB3 compatibility!
    Appver: function() {
	  // abmanager is a TB3 only component!
	  return this.Cc["@mozilla.org/abmanager;1"] ? 3 : 2;
    },

    Application: function() {
        var appInfo = Components.classes["@mozilla.org/xre/app-info;1"]
                        .getService(Components.interfaces.nsIXULAppInfo);
        var appName=appInfo.name;
	    return appName;
    },

    clearChildren: function(element,withCategories) {
	    if (withCategories)
	        while(element.childNodes.length > 0) {
	            element.removeChild(element.childNodes[0]);
	        }
	    else {
		  var nCount=0;  // skip removal of category selection box
	        while(element.childNodes.length > nCount) {
		        if (element.childNodes[nCount].id=='QuickFolders-Category-Box')
		          nCount++;
		        else
	              element.removeChild(element.childNodes[nCount]);
	        }
	    }
    } ,

    ensureNormalFolderView: function() {
        try {
            //default folder view to "All folders", so we can select it
            loadFolderView(0);
        }
        catch(e) {
           //loadFolderView() might be undefined at certain times, ignore this problem
        }
    } ,


    getFolderUriFromDropData: function(dropData, dragSession) {
        var trans = this.Cc["@mozilla.org/widget/transferable;1"].createInstance(this.Ci.nsITransferable);
        trans.addDataFlavor("text/x-moz-folder");

        dragSession.getData (trans, 0);

        var dataObj = new Object();
        var len = new Object();
        var flavor = "text/x-moz-folder";
        try {
          trans.getTransferData(flavor, dataObj, len);

          if (dataObj) {
            dataObj = dataObj.value.QueryInterface(this.Ci.nsISupportsString);
            var sourceUri = dataObj.data.substring(0, len.value);
            return sourceUri;
          }
        }
        catch(e) {this.logToConsole("getTransferData " + e);};

        return null;
    } ,

    moveMessages: function(targetFolder, messageUris, makeCopy) {
        var targetResource = targetFolder.QueryInterface(this.Ci.nsIRDFResource);

        var messageList ;
        //nsISupportsArray is deprecated in TB3 as its a hog :-)
        if (QuickFolders.Util.Appver() > 2)
          messageList = this.Cc["@mozilla.org/array;1"].createInstance(this.Ci.nsIMutableArray);
        else
          messageList = this.Cc["@mozilla.org/supports-array;1"].createInstance(this.Ci.nsISupportsArray);

        for (var i = 0; i < messageUris.length; i++) {
            var messageUri = messageUris[i];
            if (QuickFolders.Util.Appver() > 2)
              messageList.appendElement(messenger.messageServiceFromURI(messageUri).messageURIToMsgHdr(messageUri), false);
            else
              messageList.AppendElement(messenger.messageServiceFromURI(messageUri).messageURIToMsgHdr(messageUri));
        }

        var sourceMsgHdr;

        if (QuickFolders.Util.Appver() > 2)
          sourceMsgHdr = messageList.queryElementAt(0,this.Ci.nsIMsgDBHdr);
        else
          sourceMsgHdr = messageList.GetElementAt(0).QueryInterface(this.Ci.nsIMsgDBHdr);
        var sourceFolder = sourceMsgHdr.folder;
        var sourceResource = sourceFolder.QueryInterface(this.Ci.nsIRDFResource);
        if (QuickFolders.Util.Appver() > 2 || QuickFolders.Util.Application()=='Postbox') {
          var cs = this.Cc["@mozilla.org/messenger/messagecopyservice;1"].getService(this.Ci.nsIMsgCopyService);
          cs.CopyMessages(sourceFolder, messageList, targetFolder, !makeCopy, null, msgWindow, true);
        }
        else
          messenger.CopyMessages(GetFolderDatasource(), sourceResource, targetResource, messageList, !makeCopy);
    } ,


    debugVar: function(value) {
        str = "Value: " + value + "\r\n";
        for(prop in value) {
            str += prop + " => " + value[prop] + "\r\n";
        }

        this.logDebug(str);
    },

    logToConsole: function (msg) {
	  if (qfConsoleService == null)
	    qfConsoleService = this.Cc["@mozilla.org/consoleservice;1"]
	                               .getService(this.Ci.nsIConsoleService);
	  qfConsoleService.logStringMessage("QuickFolders:" + msg);
	},

    logDebug: function (msg) {
	  if (QuickFolders.Preferences.isDebug())
	    this.logToConsole(msg);
	},

	logFocus: function(origin) {
		try {
			var el=document.commandDispatcher.focusedElement;
			this.logDebug(origin + "- logFocus");
			if (el==null) {
			    el=document.commandDispatcher.focusedWindow;
			  	this.logDebug ( "window focused: " + el.name);
			}
			else {
			  QuickFolders.Util.logDebug ( "element focused\nid: " + el.id +" \ntag: " + el.tag +" \nclass: " + el.class + "\ncontainer: " + el.container  );
			}
		}
		catch(e) { this.logDebug("logFocus " + e);};
	}


}