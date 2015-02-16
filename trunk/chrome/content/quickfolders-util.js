"use strict";
/* BEGIN LICENSE BLOCK

QuickFolders is released under the Creative Commons (CC BY-ND 4.0)
Attribution-NoDerivatives 4.0 International (CC BY-ND 4.0) 
For details, please refer to license.txt in the root folder of this extension

END LICENSE BLOCK */


Components.utils.import('resource://gre/modules/Services.jsm');

var QuickFolders_ConsoleService=null;

if (!QuickFolders.StringBundleSvc)
	QuickFolders.StringBundleSvc = Components.classes["@mozilla.org/intl/stringbundle;1"].getService(Components.interfaces.nsIStringBundleService);
if (!QuickFolders.Properties)
	QuickFolders.Properties =
		QuickFolders.StringBundleSvc.createBundle("chrome://quickfolders/locale/quickfolders.properties")
			.QueryInterface(Components.interfaces.nsIStringBundle);

if (!QuickFolders.Filter)
	QuickFolders.Filter = {};

if (Components.classes["@mozilla.org/xre/app-info;1"].getService(Components.interfaces.nsIXULAppInfo).ID != "postbox@postbox-inc.com")
{
  // Here, Postbox declares fixIterator
  Components.utils.import("resource:///modules/iteratorUtils.jsm");  
}

	
// code moved from options.js
// open the new content tab for displaying support info, see
// https://developer.mozilla.org/en/Thunderbird/Content_Tabs
var QuickFolders_TabURIopener = {
	openURLInTab: function openURLInTab(URL) {
    let util = QuickFolders.Util;
		try {
			let sTabMode="",
			    tabmail;
			tabmail = document.getElementById("tabmail");
			if (!tabmail) {
				// Try opening new tabs in an existing 3pane window
				let mail3PaneWindow = util.getMail3PaneWindow();
				if (mail3PaneWindow) {
					tabmail = mail3PaneWindow.document.getElementById("tabmail");
					mail3PaneWindow.focus();
				}
			}
			if (tabmail) {
				sTabMode = (util.Application == "Thunderbird") ? "contentTab" : "3pane";
				tabmail.openTab(sTabMode,
				{contentPage: URL, clickHandler: "specialTabs.siteClickHandler(event, QuickFolders_TabURIregexp._thunderbirdRegExp);"});
			}
			else
				window.openDialog("chrome://messenger/content/", "_blank",
								  "chrome,dialog=no,all", null,
			  { tabType: "contentTab", tabParams: {contentPage: URL, clickHandler: "specialTabs.siteClickHandler(event, QuickFolders_TabURIregexp._thunderbirdRegExp);", id:"QuickFolders_Weblink"} } );
		}
		catch(e) { return false; }
		return true;
	}
};

//if (!QuickFolders.Util)
QuickFolders.Util = {
  _isCSSGradients: -1,
	_isCSSRadius: -1,
	_isCSSShadow: -1,
	HARDCODED_EXTENSION_VERSION : "3.15",
	HARDCODED_EXTENSION_TOKEN : ".hc",
	FolderFlags : {  // nsMsgFolderFlags
		MSG_FOLDER_FLAG_NEWSGROUP : 0x0001,
		MSG_FOLDER_FLAG_NEWSHOST  : 0x0002,
		MSG_FOLDER_FLAG_TRASH 	  : 0x0100,
		MSG_FOLDER_FLAG_SENTMAIL	: 0x0200,
		MSG_FOLDER_FLAG_DRAFTS	: 0x0400,
		MSG_FOLDER_FLAG_QUEUE 	: 0x0800,
		MSG_FOLDER_FLAG_INBOX 	: 0x1000,
		MSG_FOLDER_FLAG_TEMPLATES : 0x400000,
		MSG_FOLDER_FLAG_JUNK		: 0x40000000,
		MSG_FOLDER_FLAG_SMART 	: 0x4000, // just a guess, as this was MSG_FOLDER_FLAG_UNUSED3
		MSG_FOLDER_FLAG_ARCHIVE	: 0x4004, // another guess ?
		MSG_FOLDER_FLAG_VIRTUAL : 0x0020,
		MSG_FOLDER_FLAG_GOTNEW  : 0x00020000
	},
	// avoid these global objects
	Cc: Components.classes,
	Ci: Components.interfaces,
	VersionProxyRunning: false,
	mAppver: null,
	mAppName: null,
	mHost: null,
	mPlatformVer: null,
	mExtensionVer: null,
	lastTime: 0,

	$: function(id) {
		// get an element from the main window for manipulating
		let doc=document; // we want the main document
		if (doc.documentElement && doc.documentElement.tagName) {
			if (doc.documentElement.tagName=="prefwindow" || doc.documentElement.tagName=="dialog") {
// 				if (!QuickFolders.doc) {
					let mail3PaneWindow = QuickFolders.Util.getMail3PaneWindow();
					if (mail3PaneWindow && mail3PaneWindow.document)
						doc = mail3PaneWindow.document;
// 				}
// 				else
// 					doc = QuickFolders.doc;
			}
		}
		return doc.getElementById(id);
	} ,

	get ApplicationVersion() {
		let appInfo = Components.classes["@mozilla.org/xre/app-info;1"]
						.getService(Components.interfaces.nsIXULAppInfo);
		return appInfo.version;
	},

	Appver: function() {
		if (null == this.mAppver) {
		let appVer=this.ApplicationVersion.substr(0,6);
			this.mAppver = parseFloat(appVer); // quick n dirty!
		}
		return this.mAppver;
	},

	get Application() {
		if (null==this.mAppName) {
      let appInfo = Components.classes["@mozilla.org/xre/app-info;1"]
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

	get HostSystem() {
		if (null==this.mHost) {
			let osString = Components.classes["@mozilla.org/xre/app-info;1"]
						.getService(Components.interfaces.nsIXULRuntime).OS;
			this.mHost = osString.toLowerCase();
		}
		return this.mHost; // linux - winnt - darwin
	},
  
  alert: function alert(msg, caption) {
    caption = caption ? caption : "QuickFolders";
    Services.prompt.alert(null, caption, msg);
  },

	// detect current QuickFolders version and storing it in mExtensionVer
	// this is done asynchronously, so it respawns itself
	VersionProxy: function VersionProxy() {
    let util = QuickFolders.Util;
		try {
			if (util.mExtensionVer // early exit, we got the version!
				||
			    util.VersionProxyRunning) // no recursion...
				return;
			util.VersionProxyRunning = true;
			util.logDebugOptional("firstrun", "Util.VersionProxy() started.");
			if (Components.utils.import) {
				Components.utils.import("resource://gre/modules/AddonManager.jsm");

				AddonManager.getAddonByID("quickfolders@curious.be", function(addon) {
					let versionLabel = window.document.getElementById("qf-options-header-description");
					if (versionLabel) versionLabel.setAttribute("value", addon.version);

					util.mExtensionVer = addon.version;
					util.logDebug("AddonManager: QuickFolders extension's version is " + addon.version);
					util.logDebug("QuickFolders.VersionProxy() - DETECTED QuickFolders Version " + util.mExtensionVer + "\n" + "Running on " + util.Application	 + " Version " + util.ApplicationVersion);
					// make sure we are not in options window
					if (!versionLabel)
						util.FirstRun.init();

				});
			}

			util.logDebugOptional("firstrun", "AddonManager.getAddonByID .. added callback for setting extensionVer.");

		}
		catch(ex) {
			util.logToConsole("QuickFolder VersionProxy failed - are you using an old version of " + util.Application + "?"
				+ "\n" + ex);
		}
		finally {
			util.VersionProxyRunning=false;
		}
	},

	get Version() {
    let util = QuickFolders.Util;
		//returns the current QF version number.
		if (util.mExtensionVer)
			return util.mExtensionVer;
		let current = util.HARDCODED_EXTENSION_VERSION + util.HARDCODED_EXTENSION_TOKEN;

		if (!Components.classes["@mozilla.org/extensions/manager;1"]) {
			// Addon Manager: use Proxy code to retrieve version asynchronously
			util.VersionProxy(); // modern Mozilla builds.
											  // these will set mExtensionVer (eventually)
											  // also we will delay FirstRun.init() until we _know_ the version number
		}
		else  // --- older code: extensions manager.
		{
			try {
				if(Components.classes["@mozilla.org/extensions/manager;1"])
				{
					let gExtensionManager = Components.classes["@mozilla.org/extensions/manager;1"]
						.getService(Components.interfaces.nsIExtensionManager);
					current = gExtensionManager.getItemForID("quickfolders@curious.be").version;
				}
				else {
					current = current + "(?)";
				}
				util.mExtensionVer = current;
				util.FirstRun.init();

			}
			catch(ex) {
				current = current + "(?ex?)" // hardcoded, program this for Tb 3.3 later
				util.logToConsole("QuickFolder Version retrieval failed - are you using an old version of " + util.Application + "?");
			}
		}
		return current;

	} ,

	get VersionSanitized() {
		function strip(version, token) {
			let cutOff = version.indexOf(token);
			if (cutOff > 0) { 	// make sure to strip of any pre release labels
				return version.substring(0, cutOff);
			}
			return version;
		}

		let pureVersion = strip(QuickFolders.Util.Version, 'pre');
		pureVersion = strip(pureVersion, 'beta');
		pureVersion = strip(pureVersion, 'alpha');
		return strip(pureVersion, '.hc');
	},
  
	getMail3PaneWindow: function getMail3PaneWindow() {
		let windowManager = Components.classes['@mozilla.org/appshell/window-mediator;1']
				.getService(Components.interfaces.nsIWindowMediator),
		    win3pane = windowManager.getMostRecentWindow("mail:3pane");
		return win3pane;
	} ,
	
	getAccountsPostbox: function getAccountsPostbox() {
	  let accounts=[],
        actManager = this.getMail3PaneWindow().accountManager,
        Ci = Components.interfaces,
		    smartServers = actManager.allSmartServers;
		for (let i = 0; i < smartServers.Count(); i++)
		{
			let smartServer = smartServers.QueryElementAt(i, Ci.nsIMsgIncomingServer),
			    account_groups = smartServer.getCharValue("group_accounts");
			if (account_groups)
			{
				let groups = account_groups.split(",");
				for each (let accountKey in groups)
				{
					let account = actManager.getAccount(accountKey);
					if (account)
					{
						accounts.push(account);
					}
				}
			}
		}
		return accounts;
	},
  
  // iterate all folders
  // writable - if this is set, exclude folders that do not accept mail from move/copy (e.g. newsgroups)
	allFoldersIterator: function allFoldersIterator(writable) {
    let Ci = Components.interfaces,
        Cc = Components.classes,
		    acctMgr = Cc["@mozilla.org/messenger/account-manager;1"].getService(Ci.nsIMsgAccountManager),
        FoldersArray, allFolders,
        util = QuickFolders.Util;
		
    if (util.Application == 'Postbox') {
      FoldersArray = Cc["@mozilla.org/array;1"].createInstance(Ci.nsIMutableArray);
      let servers = acctMgr.allServers;
      for (let i = 0; i < servers.Count(); i++)
      {
        let server = servers.QueryElementAt(i, Ci.nsIMsgIncomingServer),
            rootFolder = server.rootFolder;
        allFolders = Cc["@mozilla.org/supports-array;1"].createInstance(Ci.nsISupportsArray);
        rootFolder.ListDescendents(allFolders);
        let numFolders = allFolders.Count();

        for (let folderIndex = 0; folderIndex < numFolders; folderIndex++)
        {
          let folder = allFolders.GetElementAt(folderIndex).QueryInterface(Ci.nsIMsgFolder);
          if (writable && !folder.canFileMessages) {
            continue;
          }
          FoldersArray.appendElement(folder, false);
        }
      }        
      return FoldersArray; // , Ci.nsIMsgFolder - can't return the fixIterator??
    }
    else if (acctMgr.allFolders) { // Thunderbird & modern builds
      FoldersArray = Cc["@mozilla.org/array;1"].createInstance(Ci.nsIMutableArray);
      allFolders = acctMgr.allFolders;
      for each (let aFolder in fixIterator(allFolders, Ci.nsIMsgFolder)) {
        // filter out non-filable folders (newsgroups...)
        if (writable && 
             (!aFolder.canFileMessages || 
             (aFolder.flags & util.FolderFlags.MSG_FOLDER_FLAG_NEWSGROUP) ||
             (aFolder.flags & util.FolderFlags.MSG_FOLDER_FLAG_NEWSHOST))) {
            continue;
        }
        FoldersArray.appendElement(aFolder, false);
      }		       
      return fixIterator(FoldersArray, Ci.nsIMsgFolder);
    }
    else { //old / SeaMonkey?
      /**   ### obsolete code  ###  */
      FoldersArray = Cc["@mozilla.org/array;1"].createInstance(Ci.nsIMutableArray);
      let accounts = acctMgr.accounts;
      allFolders = Cc["@mozilla.org/array;1"].createInstance(Ci.nsIMutableArray);
      // accounts will be changed from nsIMutableArray to nsIArray Tb24 (Sm2.17)
      for (let account in fixIterator(acctMgr.accounts, Ci.nsIMsgAccount)) {
        if (account.rootFolder)
          account.rootFolder.ListDescendents(allFolders);
        for each (let aFolder in fixIterator(allFolders, Ci.nsIMsgFolder)) {
          FoldersArray.appendElement(aFolder, false);
          if (writable && !folder.canFileMessages) {
            continue;
          }
        }		 
      }	
      return fixIterator(FoldersArray, Ci.nsIMsgFolder);
    }
	} ,
	
	get mailFolderTypeName() {
		switch(this.Application) {
			case "Thunderbird": return "folder";
			case "SeaMonkey": return "3pane";
			default: return "folder";
		}
		return "";
	} ,

	get PlatformVersion() {
		if (null==this.mPlatformVer)
			try {
				let appInfo = Components.classes["@mozilla.org/xre/app-info;1"]
				                        .getService(Components.interfaces.nsIXULAppInfo);
				this.mPlatformVer = parseFloat(appInfo.platformVersion);
			}
			catch(ex) {
				this.mPlatformVer = 1.0; // just a guess
			}
		return this.mPlatformVer;
	} ,

	slideAlert: function slideAlert(title, text, icon) {
		setTimeout(function() {
				try {
					if (!icon)
						icon = "chrome://quickfolders/skin/ico/quickfolders-Icon.png";
					Components.classes['@mozilla.org/alerts-service;1'].
								getService(Components.interfaces.nsIAlertsService).
								showAlertNotification(icon, title, text, false, '', null);
				} catch(e) {
				// prevents runtime error on platforms that don't implement nsIAlertsService
				}
			} , 0);
	} ,
	
	disableFeatureNotification: function disableFeatureNotification(featureName) {
		QuickFolders.Preferences.setBoolPref("proNotify." + featureName, false);
	} ,
  
	addConfigFeature: function addConfigFeature(filter, Default, textPrompt) {
		// adds a new option to about:config, that isn't there by default
		if (confirm(textPrompt)) {
			// create (non existent filter setting:
			QuickFolders.Preferences.setBoolPrefVerbose(filter, Default);
			QuickFolders.Options.showAboutConfig(null, filter, true, false);
		}
	},
	
	// Postbox special functions to avoid line being truncated
	// removes description.value and adds it into inner text
	fixLineWrap: function fixLineWrap(notifyBox, notificationKey) {
    try {
		  if (!notifyBox || !notificationKey)
				return;
			let note = notifyBox.getNotificationWithValue(notificationKey),
			// if we  could get at the description element within the notificaiton 
			// we could empty the value and stick thje text into textContent instead!
			    hbox = note.boxObject.firstChild.firstChild;
			if (hbox) {
				this.logDebug('hbox = ' + hbox.tagName + ' hbox.childNodes: ' + hbox.childNodes.length);
				let desc = hbox.childNodes[1];
				desc.textContent = desc.value.toString();
				desc.removeAttribute('value');
			}
		}
		catch(ex) {
			this.logException('Postbox notification: ', ex);
		}
	} ,
	
	onCloseNotification: function onCloseNotification(eventType, notifyBox, notificationKey) {
		QuickFolders.Util.logDebug ("onCloseNotification(" + notificationKey + ")");
		window.setTimeout(function() {
	  // Postbox doesn't tidy up after itself?
		if (!notifyBox)
			return;
		let item = notifyBox.getNotificationWithValue(notificationKey);
		if(item) {
		  // http://mxr.mozilla.org/mozilla-central/source/toolkit/content/widgets/notification.xml#164
			notifyBox.removeNotification(item, (QuickFolders.Util.Application == 'Postbox'));	 // skipAnimation
		}
			}, 200);
	} ,
  
	popupProFeature: function popupProFeature(featureName, text) {
    // early exit for Licensed copies
    if (QuickFolders.Licenser.isValidated) 
      return;
    let util = QuickFolders.Util;
    QuickFolders.Licenser.validateLicense(
      QuickFolders.Preferences.getCharPrefQF('LicenseKey'), 
      QuickFolders.Licenser.MaxDigits);
    if (QuickFolders.Licenser.isValidated) 
      return;
    
		let notificationId;
    util.logDebugOptional("premium", "popupProFeature(" + featureName + ", " + text + ")");
		// is notification disabled?
		// check setting extensions.quickfolders.proNotify.<featureName>
    let usage = QuickFolders.Preferences.getIntPref("proNotify." + featureName + ".usage");
    usage++;
    QuickFolders.Preferences.setIntPref("proNotify." + featureName + ".usage", usage);
    
		//let countDown = QuickFolders.Preferences.getIntPref("proNotify." + featureName + ".countDown") - 1;
		//QuickFolders.Preferences.setIntPref("proNotify." + featureName + ".countDown", countDown);

		switch(util.Application) {
			case 'Postbox': 
				notificationId = 'pbSearchThresholdNotifcationBar';  // msgNotificationBar
				break;
			case 'Thunderbird': 
				notificationId = 'mail-notification-box'
				break;
			case 'SeaMonkey':
				notificationId = null;
				break;
		}
		let notifyBox = document.getElementById (notificationId);
    if (notifyBox)
      util.logDebugOptional("premium", "notificationId = " + notificationId + ", found" + notifyBox);
		let title=util.getBundleString("qf.notification.premium.title", "Premium Feature"),
		    theText=util.getBundleString("qf.notification.premium.text",
				        "{1} is a Premium feature, please get a QuickFolders Pro License for using it permanently.");
		theText = theText.replace ("{1}", "'" + featureName + "'");
    try {
      // disable notification only on SeaMonkey.
      if (util.Application == 'SeaMonkey') {
        util.slideAlert(title, theText);          
        return;
      }
    } catch(ex) {return;}
    
    
    let regBtn = util.getBundleString("qf.notification.premium.btn.getLicense", "Buy License!"),
        hotKey = util.getBundleString("qf.notification.premium.btn.hotKey", "L"),
		    nbox_buttons;
		if (notifyBox) {
			let notificationKey = "quickfolders-proFeature";
      util.logDebugOptional("premium", "configure buttons...");
			// button for disabling this notification in the future
      nbox_buttons = [
        {
          label: regBtn,
          accessKey: hotKey, 
          callback: function() { 
            QuickFolders.Licenser.showDialog(featureName); 
          },
          popup: null
        }
      ];
			
			if (notifyBox) {
				let item = notifyBox.getNotificationWithValue(notificationKey)
				if(item)
					notifyBox.removeNotification(item, (util.Application == 'Postbox'));
			}
		
      util.logDebugOptional("premium", "notifyBox.appendNotification()...");
			notifyBox.appendNotification( theText, 
					notificationKey , 
					"chrome://quickfolders/skin/ico/proFeature.png" , 
					notifyBox.PRIORITY_INFO_HIGH, 
					nbox_buttons ); // , eventCallback
			if (util.Application == 'Postbox') {
				this.fixLineWrap(notifyBox, notificationKey);
			}
		}
		else {
			// fallback for systems that do not support notification (currently: SeaMonkey)
      util.logDebugOptional("premium", "fallback for systems without notification-box...");
			let prompts = Components.classes["@mozilla.org/embedcomp/prompt-service;1"]  
															.getService(Components.interfaces.nsIPromptService),
			    check = {value: false},   // default the checkbox to true  
		      dontShow = util.getBundleString("qf.notification.dontShowAgain",
		  	             "Do not show this message again.") + ' [' + featureName + ']',
			    result = prompts.alertCheck(null, title, theText, dontShow, check);
			if (check.value==true)
				util.disableFeatureNotification(featureName);
		}
			
	
	} ,

	getSystemColor: function getSystemColor(sColorString) {
    function hex(x) { return ("0" + parseInt(x).toString(16)).slice(-2); }

		let getContainer = function() {
			let div = QuickFolders.Interface.FoldersBox;
			if (div)
				return div;
			return QuickFolders.Util.$('qf-options-prefpane');
		}
		let theColor, // convert system colors such as menubackground etc. to hex
		    d = document.createElement("div");
		d.style.color = sColorString;
		getContainer().appendChild(d)
		theColor = window.getComputedStyle(d,null).color;
		getContainer().removeChild(d);

    if (theColor.search("rgb") == -1)
      return theColor;
    else {
      theColor = theColor.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);
      let hexColor = "#" + hex(theColor[1]) + hex(theColor[2]) + hex(theColor[3]);
      return hexColor;
    }

	},

	getRGBA: function getRGBA(hexIn, alpha) {
		function cutHex(h) {
			let rv = ((h.toString()).charAt(0)=='#') ? h.substring(1,7) : h;
			return rv.toString();
		}
		function HexToR(h) {
			return parseInt(h.substring(0,2),16);
		}
		function HexToG(h) {
			return parseInt(h.substring(2,4),16);
		}
		function HexToB(h) {
		  return parseInt(h.substring(4,6),16);
		}

		let hex = hexIn,
		    isRGB = (hexIn.indexOf('rgb')>=0),
		    isRGBA = (hexIn.indexOf('rgba')>=0);
		if (isRGB) {
		  // inject alpha value:
			let li = isRGBA ?
               hexIn.lastIndexOf(',') :   // replace alpha
			         hexIn.indexOf(')');        // append alpha
			hex = hexIn.substring(0, li) + ',' +  alpha.toString() +')';
			if (!isRGBA)
			  hex = hex.replace('rgb','rgba');
			return hex;
		}
		else {
			try {
        if (hex.charAt(0) == '#')
          parseInt(cutHex(hex),16);
        else
          hex = QuickFolders.Util.getSystemColor(hex);
			}
			catch(e) {
				hex = QuickFolders.Util.getSystemColor(hex);
			}
		}
		if (hex) { // 6 digit hex string
			hex = cutHex(hex);
			let r = HexToR(hex).toString();
			let g = HexToG(hex).toString();
			let b = HexToB(hex).toString();
			return "rgba(" + r + ',' + g + ',' + b + ',' + alpha.toString() +')';
		}
		else {
			QuickFolders.Util.logDebugOptional ("css", "Can not retrieve color value: " + hexIn);
			return "#666";
		}
	},

	clearChildren: function clearChildren(element,withCategories) {
    if (!element) return;
		QuickFolders.Util.logDebugOptional ("events","clearChildren(withCategories= " + withCategories + ")");
		if (withCategories)
			while(element.childNodes.length > 0) {
				element.removeChild(element.childNodes[0]);
			}
		else {
			let nCount=0;	// skip removal of category selection box
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
	ensureNormalFolderView: function ensureNormalFolderView() {
		try {
			//default folder view to "All folders", so we can select it
			if (typeof gFolderTreeView != 'undefined') {
				let theTreeView;
				theTreeView = gFolderTreeView;
				theTreeView.mode="all";
				this.logDebug("switched TreeView mode= " + theTreeView.mode);
			}
			else
				if (typeof loadFolderView !='undefined')
					loadFolderView(0);
		}
		catch(ex) {
			//loadFolderView() might be undefined at certain times, ignore this problem
			this.logException('ensureNormalFolderView failed: ', ex);
		}
	} ,

	// find the first mail tab representing a folder and open it
	ensureFolderViewTab: function ensureFolderViewTab() {
		// TB 3 bug 22295 - if a single mail tab is opened this appears to close it!
		let found=false;
		let tabmail = document.getElementById("tabmail");
		if (tabmail) {
			let tab = (QuickFolders.Util.Application=='Thunderbird') ? tabmail.selectedTab : tabmail.currentTabInfo;

			if (tab) {
			  let tabMode = this.getTabModeName(tab);
				QuickFolders.Util.logDebugOptional ("mailTabs", "ensureFolderViewTab - current tab mode: " + tabMode);
				if (tabMode != QuickFolders.Util.mailFolderTypeName) { //  TB: 'folder', SM: '3pane'
					// move focus to a messageFolder view instead!! otherwise TB3 would close the current message tab
					// switchToTab
					// iterate tabs
					let tabInfoCount = QuickFolders.Util.getTabInfoLength(tabmail);
					for (let i = 0; i < tabInfoCount; i++) {
					  let info = QuickFolders.Util.getTabInfoByIndex(tabmail, i);
						if (info && this.getTabModeName(info) == QuickFolders.Util.mailFolderTypeName) { 
							QuickFolders.Util.logDebugOptional ("mailTabs","switching to tab: " + info.title);
							tabmail.switchToTab(i);
							found=true;
							break;
						}
					}
					// if it can't find a tab with folders ideally it should call openTab to display a new folder tab
					for (let i=0;(!found) && i < tabInfoCount; i++) {
					  let info = QuickFolders.Util.getTabInfoByIndex(tabmail, i);
						if (info && QuickFolders.Util.getTabModeName(info)!='message') { // SM: tabmail.tabInfo[i].getAttribute("type")!='message'
							QuickFolders.Util.logDebugOptional ("mailTabs","Could not find folder tab - switching to msg tab: " + info.title);
							tabmail.switchToTab(i);
						  break;
						}
					}
				}
			}
		}
		return found;
	 } ,

	showStatusMessage: function showStatusMessage(s) {
		try {
			let sb = QuickFolders_getDocument().getElementById('status-bar'),
			    el, sbt;
			if (sb) {
				for (let i = 0; i < sb.childNodes.length; i++)
				{
					el = sb.childNodes[i];
					if (el.nodeType == 1 && el.id == 'statusTextBox') {
						sbt = el;
					    break;
					}
				}
				// SeaMonkey
				if (!sbt)
					sbt = sb;
				for (let i = 0; i < sbt.childNodes.length; i++)
				{
					el = sbt.childNodes[i];
					if (el.nodeType == 1 && el.id == 'statusText') {
					    el.label = s;
					    break;
					}
				}
			}
			else
				MsgStatusFeedback.showStatusString(s);
		}
		catch(ex) {
			this.logToConsole("showStatusMessage - " +  ex);
			MsgStatusFeedback.showStatusString(s);
		}
	} ,

	getFolderUriFromDropData: function getFolderUriFromDropData(evt, dropData, dragSession) {
		let trans = Components.classes["@mozilla.org/widget/transferable;1"].createInstance(Components.interfaces.nsITransferable);
		trans.addDataFlavor("text/x-moz-folder");
		trans.addDataFlavor("text/x-moz-newsfolder");

		// alert ("numDropItems = " + dragSession.numDropItems + ", isDataFlavorSupported=" + dragSession.isDataFlavorSupported("text/x-moz-folder"));

		dragSession.getData (trans, 0);

		let dataObj = new Object(),
		    len = new Object(),
		    flavor = dropData.flavour.contentType;
		try {
			trans.getTransferData(flavor, dataObj, len);

			if (dataObj) {
				dataObj = dataObj.value.QueryInterface(Components.interfaces.nsISupportsString);
				let sourceUri = dataObj.data.substring(0, len.value);
				return sourceUri;
			}
		}
		catch(e) {
			if (evt.dataTransfer.mozGetDataAt) {
				let f = evt.dataTransfer.mozGetDataAt(flavor, 0)
				if (f && f.URI)
					return f.URI;
			}
			this.logToConsole("getTransferData " + e);
		};

		return null;
	} ,

	getFolderFromDropData: function getFolderFromDropData(evt, dropData, dragSession) {
		let msgFolder=null;

// 		if (evt.dataTransfer && evt.dataTransfer.mozGetDataAt) {
// 			msgFolder = evt.dataTransfer.mozGetDataAt(dropData.flavour.contentType, 0);
// 		}
// 		else {
    let uri = this.getFolderUriFromDropData(evt, dropData, dragSession); // older gecko versions.
    if (!uri)
      return null;
    msgFolder = QuickFolders.Model.getMsgFolderFromUri(uri, true).QueryInterface(Components.interfaces.nsIMsgFolder);
// 		}
//
		return msgFolder;

	} ,
	
	isVirtual: function isVirtual(folder) {
	  if (!folder)
			return true;
		if (this.FolderFlags.MSG_FOLDER_FLAG_VIRTUAL & folder.flags)
		  return true;
	  return (folder.username && folder.username == 'nobody') || (folder.hostname == 'smart mailboxes');
	} ,

	// change: let's pass back the messageList that was moved / copied
	moveMessages: function moveMessages(targetFolder, messageUris, makeCopy) {
		let step = 0,
        Ci = Components.interfaces,
        util = QuickFolders.Util; 
		try {
			try {
        util.logDebugOptional('dnd,quickMove', 'QuickFolders.Util.moveMessages: target = ' + targetFolder.prettiestName + ', makeCopy=' + makeCopy);
      }
			catch(e) { util.alert('QuickFolders.Util.moveMessages:' + e); }

			if (targetFolder.flags & this.FolderFlags.MSG_FOLDER_FLAG_VIRTUAL) {
        util.slideAlert (util.getBundleString ("qfAlertDropFolderVirtual", "you can not drop messages to a search folder"));
				return null;
			}
			let targetResource = targetFolder.QueryInterface(Ci.nsIRDFResource);
			step = 1;

			let messageList,
			    ap = util.Application,
			    hostsystem = util.HostSystem;
			//nsISupportsArray is deprecated in TB3 as it's a hog :-)
			if (ap=='Thunderbird' || ap=='SeaMonkey')
				messageList = Components.classes["@mozilla.org/array;1"].createInstance(Ci.nsIMutableArray);
			else
				messageList = Components.classes["@mozilla.org/supports-array;1"].createInstance(Ci.nsISupportsArray);
			step = 2;

			// copy what we need...
			// let myInfos = [{ recipient: x.mime2DecodedRecipients, subject: x.subject}
			//		for each ([, x] in fixIterator(myMessages))];

			// OR
			// let q = Gloda.newQuery(Gloda.NOUN_MSG);
			// q.headerMessageID(messageId);
			// q.run(listener) => async
			// q.getCollection(listener)

			let messageIdList = [];
      let isMarkAsRead = QuickFolders.Preferences.getBoolPref('markAsReadOnMove');
			for (let i = 0; i < messageUris.length; i++) {
				let messageUri = messageUris[i],
				    Message = messenger.messageServiceFromURI(messageUri).messageURIToMsgHdr(messageUri);
        
        if(isMarkAsRead) {
          Message.markRead(true);
        }

				messageIdList.push(Message.messageId);
				if (ap=='Thunderbird' || ap=='SeaMonkey')
					messageList.appendElement(Message , false);
				else
					messageList.AppendElement(Message);
			}

			step = 3;
			let sourceMsgHdr = (ap=='Thunderbird' || ap=='SeaMonkey') ?
				messageList.queryElementAt(0, Ci.nsIMsgDBHdr) :
        messageList.GetElementAt(0).QueryInterface(Ci.nsIMsgDBHdr);
			step = 4;

			let sourceFolder = sourceMsgHdr.folder.QueryInterface(Ci.nsIMsgFolder); // force nsIMsgFolder interface for postbox 2.1
      if (sourceFolder == targetFolder) {
        util.slideAlert("QuickFolders", 'Nothing to do: Message is already in folder: ' + targetFolder.prettyName);
        return null;
      }
			step = 5;
			let sourceResource = sourceFolder.QueryInterface(Ci.nsIRDFResource),
			    cs = Components.classes["@mozilla.org/messenger/messagecopyservice;1"].getService(Ci.nsIMsgCopyService);
			step = 6;
			targetFolder = targetFolder.QueryInterface(Ci.nsIMsgFolder);
			step = 7;
      let isMove = (!makeCopy);
      util.logDebugOptional('dnd,quickMove,dragToNew', 'calling CopyMessages (\n' +
        'sourceFolder = ' + sourceFolder + '\n'+
        'messages = ' + messageList + '\n' +
        'destinationFolder = ' + targetFolder + '\n' + 
        'isMove = ' + isMove + '\n' + 
        'listener = null' + '\n' +
        'msgWindow = ' + msgWindow + '\n' +
        'allowUndo = true)');      
			cs.CopyMessages(sourceFolder, messageList, targetFolder, isMove, null, msgWindow, true);

			if (QuickFolders.Preferences.isShowRecentTab) {
				step = 8;
				if (targetFolder.SetMRUTime)
					targetFolder.SetMRUTime();
				else {
					let ct = parseInt(new Date().getTime() / 1000); // current time in secs
					targetFolder.setStringProperty("MRUTime", ct);
				}
			}
			return messageIdList; // we need the first element for further processing
		}
		catch(e) {
			this.logToConsole('Exception in QuickFolders.Util.moveMessages, step ' + step + ':\n' + e);
		};
		return null;
	} ,

	getTabInfoLength: function getTabInfoLength(tabmail) {
		if (tabmail.tabInfo)
		  return tabmail.tabInfo.length
	  if (tabmail.tabOwners)
		  return tabmail.tabOwners.length;
		return null;
	} ,
	
	getTabInfoByIndex: function getTabInfoByIndex(tabmail, idx) {
		if (tabmail.tabInfo)
			return tabmail.tabInfo[idx];
		if (tabmail.tabOwners)
		  return tabmail.tabOwners[idx];
		return null;
	} ,
	
	getTabModeName: function getTabModeName(tab) {
	  if (tab.mode) {   // Tb / Sm
		  if (this.Application=='SeaMonkey') {
				const kTabShowFolderPane  = 1 << 0;
				const kTabShowMessagePane = 1 << 1;
				const kTabShowThreadPane  = 1 << 2;			
				// SM: maybe also check	tab.getAttribute("type")=='folder'
				// check for single message shown - SeaMonkey always uses 3pane!
				// so we return "single message mode" when folder tree is hidden (to avoid switching away from single message or conversation)
			  if ( (tab.modeBits & kTabShowMessagePane) && !(tab.modeBits & kTabShowFolderPane)) {
				  return 'message';
				}
			}
			return tab.mode.name;
		}
		if (tab.type)  // Pb
		  return tab.type;
		return "";
	},
	
	get CurrentFolder() {
		let aFolder;
		if (typeof(GetLoadedMsgFolder) != 'undefined') {
			aFolder = GetLoadedMsgFolder();
		}
		else
		{
			let currentURI;
			if (QuickFolders.Util.Application=='Postbox') {
				currentURI = GetSelectedFolderURI();
			}
			else {
				if (gFolderDisplay.displayedFolder)
					currentURI = gFolderDisplay.displayedFolder.URI;
				// aFolder = FolderParam.QueryInterface(Components.interfaces.nsIMsgFolder);
			}
			// in search result folders, there is no current URI!
			if (!currentURI)
				return null;
			aFolder = QuickFolders.Model.getMsgFolderFromUri(currentURI, true).QueryInterface(Components.interfaces.nsIMsgFolder); // inPB case this is just the URI, not the folder itself??
		}

		return aFolder;
	} ,

	pbGetSelectedMessageURIs : function pbGetSelectedMessageURIs() {
	  try {
	    let messageArray = {},
	        length = {},
	        view = GetDBView();
	    view.getURIsForSelection(messageArray, length);
	    if (length.value)
	    	return messageArray.value;
	    else
	    	return null;
	  }
	  catch (ex) {
	    dump("GetSelectedMessages ex = " + ex + "\n");
	    return null;
	  }
	},
	
/**
 * Returns a new filename that is guaranteed to not be in the Set
 * of existing names.
 *
 * Example use:
 *   suggestUniqueFileName("testname", ".txt", Set("testname", "testname1"))
 *   returns "testname2.txt"
 * Does not check file system for existing files.
 *
 * @param aIdentifier     proposed filename
 * @param aType           extension
 * @param aExistingNames  a Set of names already in use
 */
  suggestUniqueFileName: function suggestUniqueFileName(aIdentifier, aType, aExistingNames) {
		let suffix = 1,
		    base = validateFileName(aIdentifier), // mail/base/content/utilityOverlay.js or mozilla/toolkit/content/contentAreaUtils.js
		    suggestion = base + aType;
		while(true) {
			if (!aExistingNames.has(suggestion))
				break;

			suggestion = base + suffix + aType;
			suffix++;
		}

		return suggestion;
  }	,
	
  suggestUniqueFileName_Old: function (aIdentifier, aType, aExistingNames) {
    let suffix = 1,
        suggestion,
        base = identifier,
        exists;
    do {
      exists = false;
      suggestion = GenerateValidFilename(base, type);
      for (let i = 0; i < existingNames.length; i++) {
        if (existingNames[i] == suggestion) {
          base = identifier + suffix;
          suffix++;
          exists = true;
          break;
        }
      }
    } while (exists);
		return suggestion;
	} ,

	threadPaneOnDragStart: function threadPaneOnDragStart(aEvent) {
		QuickFolders.Util.logDebugOptional ("dnd","threadPaneOnDragStart(" + aEvent.originalTarget.localName
			+ (aEvent.isThread ? ",thread=true" : "")
			+ ")");
		if (aEvent.originalTarget.localName != "toolbarbutton")
			return;

		let messages;
		if (typeof gFolderDisplay !='undefined') {
			messages = gFolderDisplay.selectedMessageUris;
			if (!QuickFolders.Util.Application=='SeaMonkey')
				gFolderDisplay.hintAboutToDeleteMessages();
		}
		else {
			messages = QuickFolders.Util.pbGetSelectedMessageURIs();
		}
		if (!messages)
			return;

		let ios = Components.classes["@mozilla.org/network/io-service;1"]
						  .getService(Components.interfaces.nsIIOService),
		    newUF = (typeof Set !== 'undefined'),
		    fileNames = newUF ? new Set() : [],
		    msgUrls = {},
		    uniqueFileName = '',
		    count = 0;

		// dragging multiple messages to desktop does not
		// currently work, pending core fixes for
		// multiple-drop-on-desktop support. (bug 513464)
		for (let i in messages) {
			messenger.messageServiceFromURI(messages[i])
					 .GetUrlForUri(messages[i], msgUrls, null);
			aEvent.dataTransfer.mozSetDataAt("text/x-moz-message", messages[i], i);
			let subject = messenger.messageServiceFromURI(messages[i])
			              	.messageURIToMsgHdr(messages[i]).mime2DecodedSubject;
			uniqueFileName = newUF ?
				this.suggestUniqueFileName(subject.substr(0,124), ".eml", fileNames) :
				this.suggestUniqueFileName_Old(subject.substr(0,124), ".eml", fileNames);
			fileNames.add(uniqueFileName);
			try {
				aEvent.dataTransfer.mozSetDataAt("text/x-moz-url",msgUrls.value.spec, i);
				aEvent.dataTransfer.mozSetDataAt("application/x-moz-file-promise-url", 
																				 msgUrls.value.spec + "&fileName=" + 
																				 uniqueFileName, i);
				aEvent.dataTransfer.mozSetDataAt("application/x-moz-file-promise", null, i);
				count++;
			}
			catch(ex)
			{
				this.logException("threadPaneOnDragStart: error during processing message[" + i + "]", ex)
			}
		}
		aEvent.dataTransfer.dropEffect = "move";
		aEvent.dataTransfer.mozCursor = "auto";
		aEvent.dataTransfer.effectAllowed = "all"; // copyMove
		aEvent.dataTransfer.addElement(aEvent.originalTarget);
		QuickFolders.Util.logDebugOptional ("dnd","threadPaneOnDragStart() ends: " + count + " messages prepared.");
	},

	debugVar: function debugVar(value) {
		str = "Value: " + value + "\r\n";
		for(prop in value) {
			str += prop + " => " + value[prop] + "\r\n";
		}
		this.logDebug(str);
	},

	logTime: function logTime() {
		let timePassed = '',
        end = new Date(),
        endTime = end.getTime();
		try { // AG added time logging for test
			if (this.lastTime==0) {
				this.lastTime = endTime;
				return "[logTime init]"
			}
			let elapsed = new String(endTime - this.lastTime); // time in milliseconds
			timePassed = '[' + elapsed + ' ms]	 ';
			this.lastTime = endTime; // remember last time
		}
		catch(e) {;}
		return end.getHours() + ':' + end.getMinutes() + ':' + end.getSeconds() + '.' + end.getMilliseconds() + '  ' + timePassed;
	},

	logToConsole: function logToConsole(msg, optionTag) {
		if (QuickFolders_ConsoleService == null)
			QuickFolders_ConsoleService = Components.classes["@mozilla.org/consoleservice;1"]
									.getService(Components.interfaces.nsIConsoleService);
    let logMsg =  "QuickFolders "
			+ (optionTag ? '{' + optionTag.toUpperCase() + '} ' : '')
			+ QuickFolders.Util.logTime() + "\n"+ msg;
		QuickFolders_ConsoleService.logStringMessage(logMsg);
	},

	// flags
	// errorFlag 		0x0 	Error messages. A pseudo-flag for the default, error case.
	// warningFlag 		0x1 	Warning messages.
	// exceptionFlag 	0x2 	An exception was thrown for this case - exception-aware hosts can ignore this.
	// strictFlag 		0x4
	logError: function logError(aMessage, aSourceName, aSourceLine, aLineNumber, aColumnNumber, aFlags)	{
	  let consoleService = Components.classes["@mozilla.org/consoleservice;1"]
	                                 .getService(Components.interfaces.nsIConsoleService),
	      aCategory = '',
	      scriptError = Components.classes["@mozilla.org/scripterror;1"].createInstance(Components.interfaces.nsIScriptError);
	  scriptError.init(aMessage, aSourceName, aSourceLine, aLineNumber, aColumnNumber, aFlags, aCategory);
	  consoleService.logMessage(scriptError);
	} ,

	logException: function logException(aMessage, ex) {
		let stack = ''
		if (typeof ex.stack!='undefined')
			stack= ex.stack.replace("@","\n  ");
		// let's display a caught exception as a warning.
		let fn = ex.fileName ? ex.fileName : "?";
		this.logError(aMessage + "\n" + ex.message, fn, stack, ex.lineNumber, 0, 0x1);
	} ,

	logDebug: function (msg) {
		if (QuickFolders.Preferences.isDebug)
			this.logToConsole(msg);
	},

  // only log if debug flag and specific debug option are active
  // optionString: comma delimited options
  // msg: text to log
	logDebugOptional: function logDebugOptional(optionString, msg) {
    let options = optionString.split(',');
    for (let i=0; i<options.length; i++) {
      let option = options[i];
      if (QuickFolders.Preferences.isDebugOption(option)) {
        this.logToConsole(msg, option);
        break; // only log once, in case multiple log switches are on
      }
    }
	},

	logFocus: function logFocus(origin) {
		try {
			let el=document.commandDispatcher.focusedElement;
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

	about: function about() {
		// display the built in about dialog:
		// this code only works if called from a child window of the Add-Ons Manager!!
		//window.opener.gExtensionsView.builder.rebuild();
		window.opener.gExtensionsViewController.doCommand('cmd_about');
	},

	// dedicated function for email clients which don't support tabs
	// and for secured pages (donation page).
	openLinkInBrowserForced: function openLinkInBrowserForced(linkURI) {
    let Ci = Components.interfaces;
		try {
			this.logDebug("openLinkInBrowserForced (" + linkURI + ")");
			if (QuickFolders.Util.Application=='SeaMonkey') {
				let windowManager = Components.classes['@mozilla.org/appshell/window-mediator;1'].getService(Ci.nsIWindowMediator),
				    browserWin = windowManager.getMostRecentWindow( "navigator:browser" );
				if (browserWin) {
					let URI = linkURI,
              tabBrowser = browserWin.getBrowser(),
              params = {"selected":true};
          browserWin.currentTab = tabBrowser.addTab(URI, params); 
          if (browserWin.currentTab.reload) browserWin.currentTab.reload(); 
          // activate last tab
          if (tabBrowser && tabBrowser.tabContainer)
            tabBrowser.tabContainer.selectedIndex = tabBrowser.tabContainer.childNodes.length-1;
				}
				else
					QuickFolders_globalWin.window.openDialog(getBrowserURL(), "_blank", "all,dialog=no", linkURI, null, 'QuickFolders update');
        browserWin.focus();
				return;
			}
			let service = Components.classes["@mozilla.org/uriloader/external-protocol-service;1"].getService(Ci.nsIExternalProtocolService),
			    ioservice = Components.classes["@mozilla.org/network/io-service;1"].getService(Ci.nsIIOService),
			    uri = ioservice.newURI(linkURI, null, null);
			service.loadURI(uri);
		}
		catch(e) { 
      this.logDebug("openLinkInBrowserForced (" + linkURI + ") " + e.toString()); 
      // failed to open link in browser, try to open in tab
      QuickFolders_TabURIopener.openURLInTab(linkURI);
    }
	},

	// moved from options.js
	// use this to follow a href that did not trigger the browser to open (from a XUL file)
	openLinkInBrowser: function openLinkInBrowser(evt, linkURI) {
		let Cc = Components.classes,
		    Ci = Components.interfaces;
		try {
      if (QuickFolders.Util.Application=='Thunderbird') {
        let service = Cc["@mozilla.org/uriloader/external-protocol-service;1"].getService(Ci.nsIExternalProtocolService),
            ioservice = Cc["@mozilla.org/network/io-service;1"].getService(Ci.nsIIOService);
        service.loadURI(ioservice.newURI(linkURI, null, null));
        if (null!=evt)
          evt.stopPropagation();
      }
      else
        this.openLinkInBrowserForced(linkURI);
		}
		catch(e) { 
      this.logDebug("openLinkInBrowser (" + linkURI + ") " + e.toString()); 
      this.openLinkInBrowserForced(linkURI);
    }
	},

	// moved from options.js (then called
	openURL: function openURL(evt,URL) { // workaround for a bug in TB3 that causes href's not be followed anymore.
		let ioservice, iuri, eps;
		if (QuickFolders.Util.Application=='SeaMonkey' || QuickFolders.Util.Application=='Postbox')
		{
			this.openLinkInBrowserForced(URL);
			if(null!=evt) evt.stopPropagation();
		}
		else {
			if (QuickFolders_TabURIopener.openURLInTab(URL) && null!=evt) {
				if (evt.preventDefault)  evt.preventDefault();
				if (evt.stopPropagation)  evt.stopPropagation();
			}
		}
	},

	getBundleString: function getBundleString(id, defaultText) { // moved from local copies in various modules.
		let s="";
		try {
			s= QuickFolders.Properties.GetStringFromName(id);
		}
		catch(e) {
			s= defaultText;
			this.logToConsole ("Could not retrieve bundle string: " + id + "");
		}
		return s;
	} ,

	getFolderTooltip: function getFolderTooltip(folder) {
		// tooltip - see also Attributes section of
		// https://developer.mozilla.org/en/XPCOM_Interface_Reference/nsIMsgFolder#getUriForMsg.28.29
		// and docs for nsIMsgIncomingServer
		let getPref = function(arg) { return QuickFolders.Preferences.getBoolPref('tooltips.' + arg); };
		let sVirtual = (folder.flags & this.FolderFlags.MSG_FOLDER_FLAG_VIRTUAL) ? " (virtual)" : "";
		let srv = folder.server;
		
		let srvName='';
		if (getPref('serverName')) {
			if (srv) {
				try {srvName = ' [' + srv.hostName + ']';}
				catch(e) { };
			}
		}
		
		let baseFolder = '';
		if (getPref('baseFolder')) {
			try {
				if (folder.rootFolder) {
					try {baseFolder = ' - ' + folder.rootFolder.name;}
					catch(e) { };
				}
				else
					this.logDebug('getFolderTooltip() - No rootFolder on: ' + folder.name + '!');
			}
			catch(e) { 
				this.logDebug('getFolderTooltip() - No rootFolder on: ' + folder.name + '!');
			};
		}
		
		let flags = '';
		if (getPref('msgFolderFlags')) {
		  flags = ' 0x' + folder.flags.toString(16);
		}
		
		let tooltip = '';
		if (getPref('parentFolder')) {
		  let parent = folder.parent;
			if (parent && !parent.isServer) {
			  tooltip += parent.name+'/';
			}
		}
		tooltip += folder.name + baseFolder + srvName + flags;
		tooltip += getPref('virtualFlag') ? sVirtual : '';

		return tooltip;
	},

	// get the parent button of a popup menu, in order to get its attributes:
	// - folder
	// - label
	getPopupNode: function getPopupNode(callerThis) {
		if (document.popupNode != null) {
			if (document.popupNode.folder)
				return document.popupNode;
		}
		if (callerThis.parentNode.triggerNode != null)
			return callerThis.parentNode.triggerNode;
		else {
			let theParent = callerThis.parentNode;
			while (theParent!=null && theParent.tagName!="toolbarbutton")
				theParent = theParent.parentNode;
			return theParent;
		}
	},
	
	get isCSSGradients() {
	  try {
		  if (this._isCSSGradients !== -1)
				return this._isCSSGradients;
			this._isCSSGradients = false;
			let appInfo = Components.classes["@mozilla.org/xre/app-info;1"]
												.getService(Components.interfaces.nsIXULAppInfo);		
			if (appInfo && appInfo.platformVersion && parseFloat(appInfo.platformVersion)>=16.0) {
				this._isCSSGradients = true;
			}
		}
		catch(ex) {
			this._isCSSGradients = false;
		}
		return this._isCSSGradients;
	},
	
	get isCSSRadius() {
	  if (this._isCSSRadius === -1) {
			let versionComparator = Components.classes["@mozilla.org/xpcom/version-comparator;1"]
																	.getService(Components.interfaces.nsIVersionComparator);
			this._isCSSRadius =																
				((QuickFolders.Util.Application == 'Thunderbird') && (versionComparator.compare(QuickFolders.Util.ApplicationVersion, "4.0") >= 0))
				 ||
				((QuickFolders.Util.Application == 'SeaMonkey') && (versionComparator.compare(QuickFolders.Util.ApplicationVersion, "2.2") >= 0))
				 ||
				((QuickFolders.Util.Application == 'Postbox') && (versionComparator.compare(QuickFolders.Util.ApplicationVersion, "3.0") >= 0));
		}
		return this._isCSSRadius;
	},
	
	get isCSSShadow() {
		if (this._isCSSShadow === -1) {
			let versionComparator = Components.classes["@mozilla.org/xpcom/version-comparator;1"]
                              .getService(Components.interfaces.nsIVersionComparator);
			this._isCSSShadow = (versionComparator.compare(QuickFolders.Util.PlatformVersion, "2.0") >= 0);
		}
		return this._isCSSShadow;
	} ,
	
	doesMailFolderExist: function checkExists(msgFolder) {
		if (!msgFolder || !msgFolder.filePath)	{
			QuickFolders.Util.logDebug('doesMailFolderExist() msgFolder.filePath missing! - returning false');
			return false;
		}
		if (msgFolder.flags & QuickFolders.Util.FolderFlags.MSG_FOLDER_FLAG_NEWSGROUP)
		  return true; // we do not validate nntp folders
		if (msgFolder.filePath.exists()) {
			return true;
		}
		else {
		  // jcranmer's method. Just check for the parent, and we are done.
			let rdf = Components.classes['@mozilla.org/rdf/rdf-service;1'].getService(Components.interfaces.nsIRDFService);
		  let folder = rdf.GetResource(msgFolder.URI).QueryInterface(Components.interfaces.nsIMsgFolder); 
			return folder.parent != null;
			
		  /*** legacy unused code [[[ ***/
		  let oldPath = msgFolder.filePath.path.toString();
			//  see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/endsWith
			if (typeof oldPath.endsWith != 'function')
				QuickFolders.Util.polyFillEndsWidth();
			QuickFolders.Util.logDebug('doesMailFolderExist() 1. path does not exist [' + oldPath + ']');
			let testPath = '';
			if (oldPath.endsWith('.sbd')) {
			  testPath = oldPath.substr(0, oldPath.length-4);
			}
			else {
			  testPath = oldPath + ".sbd";
			}
			let localFile = Components.classes["@mozilla.org/file/local;1"].createInstance(Components.interfaces.nsILocalFile);
			localFile.initWithPath(testPath);
			if (localFile.exists())
				return true;
			QuickFolders.Util.logDebug('doesMailFolderExist() 2. path does not exist [' + testPath + ']');
			if (testPath.endsWith('.sbd'))
			  testPath = oldPath + ".msf";
			else
			  testPath = testPath + ".msf";
			localFile.initWithPath(testPath);
			if (localFile.exists())
				return true;
			QuickFolders.Util.logDebug('doesMailFolderExist() 3. path does not exist [' + testPath + '] - returning false');
		  /*** ]]] legacy unused code ***/
		}
		return false;
	},
	
	polyFillEndsWidth: function polyFillEndsWidth() {
		if (!String.prototype.endsWith) {
			Object.defineProperty(String.prototype, 'endsWith', {
					enumerable: false,
					configurable: false,
					writable: false,
					value: function (searchString, position) {
							position = position || this.length;
							position = position - searchString.length;
							let lastIndex = this.lastIndexOf(searchString);
							return lastIndex !== -1 && lastIndex === position;
					}
			});
		}
	},
  
  // open an email in a new tab
  openMessageTabFromUri: function openMessageTabFromUri(messageUri) {
    let tabmail = QuickFolders.Util.$("tabmail"),
        hdr = messenger.messageServiceFromURI(messageUri).messageURIToMsgHdr(messageUri);
    
    switch (QuickFolders.Util.Application) {
      case 'Thunderbird':
        tabmail.openTab('message', {msgHdr: hdr, background: false});  
        break;
      case 'SeaMonkey':
        let tabMode = tabmail.tabModes['3pane'],
            tabInfo = {mode: tabMode, canClose: true},
            modeBits = 2; // get current mode? (kTabShowFolderPane = 1, kTabShowMessagePane = 2, kTabShowThreadPane = 4)
        // gMailNewsTabsType.modes['3pane'].openTab(tabInfo, modeBits, null, hdr);
        tabmail.openTab('3pane', modeBits, null, hdr);
        break;
      case 'Postbox':
        let win = QuickFolders.Interface.getMail3PaneWindow();
        // from src/mail/base/content/mailWindowOverlay.js
        win.MsgOpenNewTabForMessageWithAnimation(
               hdr.messageKey, 
               hdr.folder.URI, //
               '',       // aMode
               false ,   // Background
               true      // skipAnimation 
               // [, aAccountURI (optional) ]
               )
        break;
    }
  }

  
};  // QuickFolders.Util


// https://developer.mozilla.org/en/Code_snippets/On_page_load#Running_code_on_an_extension%27s_first_run_or_after_an_extension%27s_update
QuickFolders.Util.FirstRun = {
	init: function init() {
		let prev = -1, firstrun = true,
		    showFirsts = true, debugFirstRun = false,
		    prefBranchString = "extensions.quickfolders.",
		    svc = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefService),
		    ssPrefs = svc.getBranch(prefBranchString),
        util = QuickFolders.Util;

		try { debugFirstRun = Boolean(ssPrefs.getBoolPref("debug.firstrun")); } 
    catch (e) { debugFirstRun = false; }

		util.logDebugOptional ("firstrun","QuickFolders.Util.FirstRun.init()");
		if (!ssPrefs) {
			util.logDebugOptional ("firstrun","Could not retrieve prefbranch for " + prefBranchString);
		}

		let current = util.Version;
		util.logDebug("Current QuickFolders Version: " + current);

		try {
			util.logDebugOptional ("firstrun","try to get setting: getCharPref(version)");
			try { prev = ssPrefs.getCharPref("version"); }
			catch (e) {
				prev = "?";
				util.logDebugOptional ("firstrun","Could not determine previous version - " + e);
			} ;

			util.logDebugOptional ("firstrun","try to get setting: getBoolPref(firstrun)");
			try { firstrun = ssPrefs.getBoolPref("firstrun"); } catch (e) { firstrun = true; }

			// enablefirstruns=false - allows start pages to be turned off for partners
			util.logDebugOptional ("firstrun","try to get setting: getBoolPref(enablefirstruns)");
			try { showFirsts = ssPrefs.getBoolPref("enablefirstruns"); } catch (e) { showFirsts = true; }

			util.logDebugOptional ("firstrun", "Settings retrieved:"
					+ "\nprevious version=" + prev
					+ "\ncurrent version=" + current
					+ "\nfirstrun=" + firstrun
					+ "\nshowfirstruns=" + showFirsts
					+ "\ndebugFirstRun=" + debugFirstRun);

		}
		catch(e) {
			util.alert("QuickFolders exception in QuickFolders-util.js: " + e.message
				+ "\n\ncurrent: " + current
				+ "\nprev: " + prev
				+ "\nfirstrun: " + firstrun
				+ "\nshowFirstRuns: " + showFirsts
				+ "\ndebugFirstRun: " + debugFirstRun);
		}
		finally {
			util.logDebugOptional ("firstrun","finally - firstrun=" + firstrun);
      let suppressDonationScreen = false,
			// AG if this is a pre-release, cut off everything from "pre" on... e.g. 1.9pre11 => 1.9
			    pureVersion = util.VersionSanitized;
			util.logDebugOptional ("firstrun","finally - pureVersion=" + pureVersion);
			// change this depending on the branch
			let versionPage = "http://quickfolders.mozdev.org/version.html#" + pureVersion;
			util.logDebugOptional ("firstrun","finally - versionPage=" + versionPage);
			
			if (pureVersion >= '3.12' && prev < "3.12") {
				QuickFolders.Model.upgradePalette(ssPrefs);
			}
			
			// STORE CURRENT VERSION NUMBER!
			if (prev!=pureVersion && current!='?' && (current.indexOf(util.HARDCODED_EXTENSION_TOKEN) < 0)) {
				util.logDebugOptional ("firstrun","Store current version " + current);
				ssPrefs.setCharPref("version", pureVersion); // store sanitized version! (no more alert on pre-Releases + betas!)
			}
			else {
				util.logDebugOptional ("firstrun","Can't store current version: " + current
					+ "\nprevious: " + prev.toString()
					+ "\ncurrent!='?' = " + (current!='?').toString()
					+ "\nprev!=current = " + (prev!=current).toString()
					+ "\ncurrent.indexOf(" + util.HARDCODED_EXTENSION_TOKEN + ") = " + current.indexOf(util.HARDCODED_EXTENSION_TOKEN).toString());
			}
			// NOTE: showfirst-check is INSIDE both code-blocks, because prefs need to be set no matter what.
			if (firstrun){  // FIRST TIME INSTALL
				util.logDebugOptional ("firstrun","set firstrun=false");
				ssPrefs.setBoolPref("firstrun",false);

				if (showFirsts) {
					// on very first run, we go to the index page - welcome blablabla
					util.logDebugOptional ("firstrun","setTimeout for content tab (index.html)");
					window.setTimeout(function() {
						util.openURL(null, "http://quickfolders.mozdev.org/index.html");
					}, 1500); 
				}
			}
			else { // this section does not get loaded if it's a fresh install.
				// Check for Maintenance updates (no donation screen when updating to 3.12.1, 3.12.2, etc.)
				//  same for 3.14.1, 3.14.2 etc - no donation screen
				if ((pureVersion.indexOf('3.12.') == 0 && prev.indexOf("3.12") == 0) ||
				    (pureVersion.indexOf('3.14.') == 0 && prev.indexOf("3.14") == 0))
        {
					suppressDonationScreen = true;
				}
				
				let isThemeUpgrade = QuickFolders.Preferences.tidyUpBadPreferences();
				QuickFolders.Model.updatePalette();

				if (prev!=pureVersion && current.indexOf(util.HARDCODED_EXTENSION_TOKEN) < 0) {
					util.logDebugOptional ("firstrun","prev!=current -> upgrade case.");
					// upgrade case!!
					let sUpgradeMessage = util.getBundleString ("qfAlertUpgradeSuccess", "QuickFolders was successfully upgraded to version:")
						 + " " + current;

					if (showFirsts) {
						// version is different => upgrade (or conceivably downgrade)

						// DONATION PAGE
						// display donation page - disable by right-clicking label above version jump panel
						if (suppressDonationScreen) { ; }
						else {
							if ((QuickFolders.Preferences.getBoolPrefSilent("extensions.quickfolders.donateNoMore"))) {
								util.logDebugOptional ("firstrun","Jump to donations page disabled by user");
							}
							else {
								util.logDebugOptional ("firstrun","setTimeout for donation link");
								window.setTimeout(function() {util.openURL(null, "http://quickfolders.mozdev.org/donate.html");}, 2000);
							}
						}

						// VERSION HISTORY PAGE
						// display version history - disable by right-clicking label above show history panel
						if (!QuickFolders.Preferences.getBoolPrefSilent("extensions.quickfolders.hideVersionOnUpdate")) {
							util.logDebugOptional ("firstrun","open tab for version history, QF " + current);
							window.setTimeout(function(){util.openURL(null, versionPage);}, 2200);
						}
					}

					if (isThemeUpgrade) {
						sUpgradeMessage +=
						  "\n" +
						  util.getBundleString("qfUpdatedThemesEngineMsg",
						  	"A new theming engine for QuickFolders has been installed, please select a look from the drop down box and click [Ok].");
						window.setTimeout(function(){
							// open options window for setting new theming engine options! for pimp my Tabs panel visible
							QuickFolders.Interface.viewOptions(1, sUpgradeMessage);
						}, 4600);
					}
					else
						window.setTimeout(function(){
							util.slideAlert("QuickFolders",sUpgradeMessage);
						}, 3000);


				}
			}
			util.logDebugOptional ("firstrun","finally { } ends.");
		} // end finally

		//window.removeEventListener("load",function(){ QuickFolders.Util.FirstRun.init(); },true);
	}


// // fire this on application launch, which includes open-link-in-new-window
// window.addEventListener("load",function(){ QuickFolders.Util.FirstRun.init(); },true);

};  // QuickFolders.Util.FirstRun

//			//// CHEAT SHEET
// 			// from comm-central/mailnews/test/resources/filterTestUtils.js
// 			let ATTRIB_MAP = {
// 				// Template : [attrib, op, field of value, otherHeader]
// 				"subject" : [Ci.nsMsgSearchAttrib.Subject, contains, "str", null],
// 				"from" : [Ci.nsMsgSearchAttrib.Sender, contains, "str", null],
// 				"date" : [Ci.nsMsgSearchAttrib.Date, Ci.nsMsgSearchOp.Is, "date", null],
// 				"size" : [Ci.nsMsgSearchAttrib.Size, Ci.nsMsgSearchOp.Is, "size", null],
// 				"message-id" : [Ci.nsMsgSearchAttrib.OtherHeader+1, contains, "str", "Message-ID"],
// 				"user-agent" : [Ci.nsMsgSearchAttrib.OtherHeader+2, contains, "str", "User-Agent"]
// 			 };
// 			 // And this maps strings to filter actions
// 			 let ACTION_MAP = {
// 				// Template : [action, auxiliary attribute field, auxiliary value]
// 				"priority" : [Ci.nsMsgFilterAction.ChangePriority, "priority", 6],
// 				"delete" : [Ci.nsMsgFilterAction.Delete],
// 				"read" : [Ci.nsMsgFilterAction.MarkRead],
// 				"unread" : [Ci.nsMsgFilterAction.MarkUnread],
// 				"kill" : [Ci.nsMsgFilterAction.KillThread],
// 				"watch" : [Ci.nsMsgFilterAction.WatchThread],
// 				"flag" : [Ci.nsMsgFilterAction.MarkFlagged],
// 				"stop": [Ci.nsMsgFilterAction.StopExecution],
// 				"tag" : [Ci.nsMsgFilterAction.AddTag, "strValue", "tag"]
// 				"move" : [Ci.nsMsgFilterAction.MoveToFolder, "folder"]
// 			 };
