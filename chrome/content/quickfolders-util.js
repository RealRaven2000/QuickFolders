var QuickFolders_ConsoleService=null;


QuickFolders.Util = {
	  // avoid these global objects
	Cc: Components.classes,
	Ci: Components.interfaces,
	mAppver: null, mAppName: null, mHost: null,
	lastTime: 0,

	$: function(id) {
		return document.getElementById(id);
	} ,

	AppverFull: function() {
		var appInfo = Components.classes["@mozilla.org/xre/app-info;1"]
						.getService(Components.interfaces.nsIXULAppInfo);
		return appInfo.version;
	},

	Appver: function() {
		if (null == this.mAppver) {
		var appVer=this.AppverFull().substr(0,3); // only use 1st three letters - that's all we need for compatibility checking!
			this.mAppver = parseFloat(appVer); // quick n dirty!
		}
		return this.mAppver;
	},

	Application: function() {
		if (null==this.mAppName) {
		var appInfo = Components.classes["@mozilla.org/xre/app-info;1"]
						.getService(Components.interfaces.nsIXULAppInfo);
			const FIREFOX_ID = "{ec8030f7-c20a-464f-9b0e-13a3a9e97384}";
			const THUNDERBIRD_ID = "{3550f703-e582-4d05-9a08-453d09bdfdc6}";
			const SEAMONKEY_ID = "{92650c4d-4b8e-4d2a-b7eb-24ecf4f6b63a}";
			const POSTBOX_ID = "postbox@postbox-inc.com";
			switch(appInfo.ID) {
				case FIREFOX_ID:
					return this.mAppName='Firefox';
				case THUNDERBIRD_ID:
					return this.mAppName='Thunderbird';
				case SEAMONKEY_ID:
					return this.mAppName='SeaMonkey';
				case POSTBOX_ID:
					return this.mAppName='Postbox';
				default:
					this.mAppName=appInfo.name;
					this.logDebug ( 'Unknown Application: ' + appInfo.name);
					return appInfo.name;
			}
		}
		return this.mAppName;
	},

	HostSystem: function() {
		if (null==this.mHost) {
			var osString = Components.classes["@mozilla.org/xre/app-info;1"]
						.getService(Components.interfaces.nsIXULRuntime).OS;
			this.mHost = osString.toLowerCase();
		}
		return this.mHost; // linux - winnt - darwin
	},

	getToolbar: function() {
		return QuickFolders.Util.$('QuickFolders-FoldersBox');
	} ,

	getSystemColor: function(sColorString) {
		var hexColor; // convert system colors such as menubackground etc. to hex
		var d = document.createElement("div");
		d.style.color = sColorString;
		this.getToolbar().appendChild(d)
		hexColor = window.getComputedStyle(d,null).color;
		this.getToolbar().removeChild(d);
		return hexColor;
	},

	getRGBA: function(hexIn,alpha) {
		var rgb = '';
		var hex = hexIn;
		try {parseInt(cutHex(hex),16);}
		catch(e) {
			hex=getSystemColor(hex);
		}
		if (this.Application()=='Thunderbird' && this.Appver()<3)
			return hex.toString();
		function cutHex(h) {var rv= ((h.toString()).charAt(0)=='#') ? h.substring(1,7):h;
							return rv.toString();}
		function HexToR(h) {return parseInt(h.substring(0,2),16);}
		function HexToG(h) {return parseInt(h.substring(2,4),16);}
		function HexToB(h) {return parseInt(h.substring(4,6),16);}
		if (hex) { //
			hex = cutHex(hex);
			return "rgba(" + HexToR(hex).toString() + ',' + HexToG(hex).toString() + ',' + HexToB(hex).toString() + ',' + alpha.toString() +')';
		}
		else {
			QuickFolders.Util.logDebugOptional ("css","Can not retrieve color value: " + hexIn);
			return "#666";
		}
	},


	clearChildren: function(element,withCategories) {
		if (withCategories)
			while(element.childNodes.length > 0) {
				element.removeChild(element.childNodes[0]);
			}
		else {
			var nCount=0;	// skip removal of category selection box
			while(element.childNodes.length > nCount) {
				if (element.childNodes[nCount].id=='QuickFolders-Category-Box')
					nCount++;
				else
					element.removeChild(element.childNodes[nCount]);
			}
		}
	} ,

	// ensureNormalFolderView: switches the current folder view to the "all" mode
	// - only call after having checked that current folder index can not be determined!
	ensureNormalFolderView: function() {
		try {
			//default folder view to "All folders", so we can select it
			if ((this.Application()=='Thunderbird' && this.Appver()>=3)||(this.Application()=='Postbox')) {
				var theTreeView;
				theTreeView = gFolderTreeView;
				theTreeView.mode="all";
				this.logDebug("switched TreeView mode= " + theTreeView.mode);
			}
			else
				loadFolderView(0);
		}
		catch(e) {
			//loadFolderView() might be undefined at certain times, ignore this problem
			this.logToConsole("ensureNormalFolderView failed: " + e);
		}
	} ,

	ensureFolderViewTab: function() {
		// TB 3 bug 22295 - if a single mail tab is opened this appears to close it!
		var found=false;
		var tabmail = document.getElementById("tabmail");
		if (tabmail) {
			var tab = (QuickFolders.Util.Application()=='Thunderbird') ? tabmail.selectedTab : tabmail.currentTabInfo;

			if (tab) {
				QuickFolders.Util.logDebugOptional ("mailTabs","ensureFolderViewTab - current tab mode: " + tab.mode.name);
/*				if (tab.mode.name=='message' || tab.mode.name=='calendar'
					|| tab.mode.name=='contentTab' || tab.mode.name=='glodaFacet' || tab.mode.name=='glodaList') */
				if (tab.mode.name!='folder') { // SM: tab.getAttribute("type")=='message'
					// move focus to a messageFolder view instead!! otherwise TB3 would close the current message tab
					// switchToTab
					var i;
					for (i=0;i<tabmail.tabInfo.length;i++) {
						if (tabmail.tabInfo[i].mode.name=='folder') { // SM:	tabmail.tabInfo[i].getAttribute("type")=='folder'
						QuickFolders.Util.logDebugOptional ("mailTabs","switching to tab: " + tabmail.tabInfo[i].title);
						tabmail.switchToTab(i);
						found=true;
						break;
						}
					}
					// if it can't find a tab with folders ideally it should call openTab to display a new folder tab
					for (i=0;(!found) && i<tabmail.tabInfo.length;i++) {
						if ( tabmail.tabInfo[i].mode.name!='message') { // SM: tabmail.tabInfo[i].getAttribute("type")!='message'
							QuickFolders.Util.logDebugOptional ("mailTabs","Could not find folder tab - switching to msg tab: " + tabmail.tabInfo[i].title);
							tabmail.switchToTab(i);
						break;
						}
					}
				}
			}
		}
		return found;
	 } ,


	getFolderUriFromDropData: function(dropData, dragSession) {
		var trans = this.Cc["@mozilla.org/widget/transferable;1"].createInstance(this.Ci.nsITransferable);
		trans.addDataFlavor("text/x-moz-folder");
		trans.addDataFlavor("text/x-moz-newsfolder");

		dragSession.getData (trans, 0);

		var dataObj = new Object();
		var len = new Object();
		var flavor = dropData.flavour.contentType
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
		const MSG_FOLDER_FLAG_VIRTUAL = 0x0020;
		var step = 0;
		try {
			if (targetFolder.flags & MSG_FOLDER_FLAG_VIRTUAL) {
				alert(qfBundle.GetStringFromName("qfAlertDropFolderVirtual"));
				return;
			}
			var targetResource = targetFolder.QueryInterface(this.Ci.nsIRDFResource);
			step = 1;

			var messageList ;
			var av = QuickFolders.Util.Appver();
			var ap = QuickFolders.Util.Application();
			var hostsystem = QuickFolders.Util.HostSystem();
			//nsISupportsArray is deprecated in TB3 as its a hog :-)
		if (av > 2 || ap=='SeaMonkey')
				messageList = this.Cc["@mozilla.org/array;1"].createInstance(this.Ci.nsIMutableArray);
			else
				messageList = this.Cc["@mozilla.org/supports-array;1"].createInstance(this.Ci.nsISupportsArray);
			step = 2;

			for (var i = 0; i < messageUris.length; i++) {
				var messageUri = messageUris[i];
				if (av > 2 || ap=='SeaMonkey')
					messageList.appendElement(messenger.messageServiceFromURI(messageUri).messageURIToMsgHdr(messageUri), false);
				else
					messageList.AppendElement(messenger.messageServiceFromURI(messageUri).messageURIToMsgHdr(messageUri));
			}

			step = 3;
			var sourceMsgHdr;

			if (av > 2 || ap=='SeaMonkey')
				sourceMsgHdr = messageList.queryElementAt(0,this.Ci.nsIMsgDBHdr);
			else
				sourceMsgHdr = messageList.GetElementAt(0).QueryInterface(this.Ci.nsIMsgDBHdr);
			step = 4;

			var sourceFolder = sourceMsgHdr.folder;
			step = 5;
			var sourceResource = sourceFolder.QueryInterface(this.Ci.nsIRDFResource);
			if (!(ap=='Thunderbird' && av<=2 )) {
				var cs = this.Cc["@mozilla.org/messenger/messagecopyservice;1"].getService(this.Ci.nsIMsgCopyService);
				step = 7;
				cs.CopyMessages(sourceFolder, messageList, targetFolder, !makeCopy, null, msgWindow, true);
			}
			else {
				step = 8;
				messenger.CopyMessages(GetFolderDatasource(), sourceResource, targetResource, messageList, !makeCopy);
			}
		}
		catch(e) { this.logToConsole('Exception in Util.moveMessages, step ' + step + ':\n' + e); };
	} ,


	debugVar: function(value) {
		str = "Value: " + value + "\r\n";
		for(prop in value) {
			str += prop + " => " + value[prop] + "\r\n";
		}

		this.logDebug(str);
	},

	logTime: function() {
		var timePassed = '';
		try { // AG added time logging for test
			var end= new Date();
			var endTime = end.getTime();
			var elapsed = new String(endTime - this.lastTime); // time in milliseconds
			timePassed = '[' + elapsed + ' ms]	 ';
			this.lastTime = endTime; // remember last time
		}
		catch(e) {;}
		return end.getHours() + ':' + end.getMinutes() + ':' + end.getSeconds() + '.' + end.getMilliseconds() + '  ' + timePassed;
	},

	logToConsole: function (msg) {
		if (QuickFolders_ConsoleService == null)
			QuickFolders_ConsoleService = this.Cc["@mozilla.org/consoleservice;1"]
									.getService(this.Ci.nsIConsoleService);
		QuickFolders_ConsoleService.logStringMessage("QuickFolders " + this.logTime() + "\n"+ msg);
	},

	logDebug: function (msg) {
		if (QuickFolders.Preferences.isDebug())
			this.logToConsole(msg);
	},

	logDebugOptional: function (option, msg) {
		if (QuickFolders.Preferences.isDebugOption(option))
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
			else
				QuickFolders.Util.logDebug ( "element focused\nid: " + el.id +" \ntag: " + el.tag +" \nclass: " + el.class + "\ncontainer: " + el.container);
		}
		catch(e) { this.logDebug("logFocus " + e);};
	},

	about: function() {
		// display the built in about dialog:
		// this code only works if called from a child window of the Add-Ons Manager!!
		//window.opener.gExtensionsView.builder.rebuild();
		window.opener.gExtensionsViewController.doCommand('cmd_about');
	}


}