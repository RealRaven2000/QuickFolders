"use strict";
/* BEGIN LICENSE BLOCK

	QuickFolders is released under the Creative Commons (CC BY-ND 4.0)
	Attribution-NoDerivatives 4.0 International (CC BY-ND 4.0) 
	For details, please refer to license.txt in the root folder of this extension

  END LICENSE BLOCK */

if (typeof ChromeUtils.import == "undefined")
	Components.utils.import('resource://gre/modules/Services.jsm'); // Thunderbird 52
else
	var { Services } = ChromeUtils.import('resource://gre/modules/Services.jsm');

var QuickFolders_ConsoleService=null;

if (!QuickFolders.StringBundleSvc)
	QuickFolders.StringBundleSvc = Components.classes["@mozilla.org/intl/stringbundle;1"].getService(Components.interfaces.nsIStringBundleService);
if (!QuickFolders.Properties)
	QuickFolders.Properties =
		QuickFolders.StringBundleSvc.createBundle("chrome://quickfolders/locale/quickfolders.properties")
			.QueryInterface(Components.interfaces.nsIStringBundle);

if (!QuickFolders.Filter)
	QuickFolders.Filter = {};
	
// code moved from options.js
// open the new content tab for displaying support info, see
// https://developer.mozilla.org/en/Thunderbird/Content_Tabs
var QuickFolders_TabURIopener = {
	openURLInTab: function openURLInTab(URL) {
    let util = QuickFolders.Util;
		URL = util.makeUriPremium(URL);
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
				// find existing tab with URL
				if (!util.findMailTab(tabmail, URL)) {
					sTabMode = "contentTab";
					tabmail.openTab(sTabMode,
					{contentPage: URL, clickHandler: "specialTabs.siteClickHandler(event, QuickFolders_TabURIregexp._thunderbirdRegExp);"});
				}
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
	_isCSSShadow: true,
	HARDCODED_CURRENTVERSION : "5.2", // will later be overriden call to AddonManager
	HARDCODED_EXTENSION_TOKEN : ".hc",
	ADDON_ID: "quickfolders@curious.be",
	ADDON_NAME: "QuickFolders",
	FolderFlags : {  // nsMsgFolderFlags
		MSG_FOLDER_FLAG_NEWSGROUP : 0x0001,
		MSG_FOLDER_FLAG_NEWSHOST  : 0x0002,
		MSG_FOLDER_FLAG_MAIL      : 0x0004,
		MSG_FOLDER_FLAG_TRASH 	  : 0x0100,
		MSG_FOLDER_FLAG_SENTMAIL	: 0x0200,
		MSG_FOLDER_FLAG_DRAFTS  	: 0x0400,
		MSG_FOLDER_FLAG_QUEUE 	  : 0x0800,
		MSG_FOLDER_FLAG_INBOX 	  : 0x1000,
		MSG_FOLDER_FLAG_TEMPLATES : 0x400000,
		MSG_FOLDER_FLAG_JUNK	    : 0x40000000,
		MSG_FOLDER_FLAG_ARCHIVES  : 0x4000, // just a guess, used to be for category container
		//MSG_FOLDER_FLAG_SMART   : 0x10000, // another guess, used to be for categories, use MSG_FOLDER_FLAG_VIRTUAL instead
		MSG_FOLDER_FLAG_VIRTUAL   : 0x0020,
		MSG_FOLDER_FLAG_GOTNEW    : 0x00020000,
    MSG_FOLDER_FLAG_OFFLINE   : 0x08000000
	},
  ADVANCED_FLAGS: {
    NONE : 0x0000,
    SUPPRESS_UNREAD : 0x0001,
    SUPPRESS_COUNTS : 0x0002,
		EMAIL_RECURSIVE : 0x0004,
    CUSTOM_CSS :      0x0100,
    CUSTOM_PALETTE :  0x0200,
		IGNORE_QUICKJUMP: 0x0400,
    SETMAIL_UNREAD:   0x0800         // [Bug 26683]
  } ,	
	// avoid these global objects
	Cc: Components.classes,
	Ci: Components.interfaces,
	VersionProxyRunning: false,
	mAppver: null,
	mAppName: null,
	mAppNameFull: '',
	mHost: null,
	mPlatformVer: null,
	mExtensionVer: null,
	lastTime: 0,
	get Licenser() { // retrieve Licenser always from the main window to keep everything in sync
		const util = QuickFolders.Util;
	  try { 
      let mail3Pane = util.getMail3PaneWindow();
			return mail3Pane.QuickFolders.Licenser;
		}
		catch(ex) {
			util.logException('Retrieve Licenser failed: ', ex);
		}
		return QuickFolders.Licenser;
	} ,

	$: function(id) {
		// get an element from the main window for manipulating
		let doc = document; // we want the main document
		if (doc.documentElement && doc.documentElement.tagName) {
			if (doc.documentElement.tagName=="prefwindow" || doc.documentElement.tagName=="dialog") {
					let mail3PaneWindow = QuickFolders.Util.getMail3PaneWindow();
					if (mail3PaneWindow && mail3PaneWindow.document)
						doc = mail3PaneWindow.document;
			}
		}
		let elem = doc.getElementById(id);
		return elem;
	} ,
  
  enumProperties: function enumProps(v) {
    let txt = '';
    if (!v) return '';
    Object.getOwnPropertyNames(v).forEach(
      function (prop) {
        let lbl = v[prop];
        if  (typeof lbl === 'function') 
          lbl = lbl.toString().substring(0, lbl.toString().indexOf(")")+1);
        txt += prop + ': ' + lbl + '\n';
      }
    )
    return txt;
  } ,

	get ApplicationVersion() {
		let appInfo = Components.classes["@mozilla.org/xre/app-info;1"]
						.getService(Components.interfaces.nsIXULAppInfo);
		return appInfo.version;
	},

	get Appversion() {
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
			const THUNDERBIRD_ID = "{3550f703-e582-4d05-9a08-453d09bdfdc6}";
			const SEAMONKEY_ID = "{92650c4d-4b8e-4d2a-b7eb-24ecf4f6b63a}";
			const POSTBOX_ID = "postbox@postbox-inc.com";
			this.mAppNameFull = appInfo.name;
			switch(appInfo.ID) {
				case THUNDERBIRD_ID:
					return this.mAppName='Thunderbird';
				case SEAMONKEY_ID:
					return this.mAppName='SeaMonkey';
				case POSTBOX_ID:
					return this.mAppName='Postbox';
				default:
					this.mAppName=appInfo.name;
					this.logDebug ( 'Unknown Application: ' + appInfo.name + '\n'
            + 'appInfo.id:' + appInfo.ID);
					return appInfo.name;
			}
		}
		return this.mAppName;
	},
	
	get ApplicationName() {
		if (!this.mAppName) {
			let dummy = this.Application;
		}
		return this.mAppNameFull;
	} ,
	
	get HostSystem() {
		if (null==this.mHost) {
			let osString = Components.classes["@mozilla.org/xre/app-info;1"]
						.getService(Components.interfaces.nsIXULRuntime).OS;
			this.mHost = osString.toLowerCase();
		}
		return this.mHost; // linux - winnt - darwin
	},
  
  // return the button pressed:
  // 0 - ok / yes / default
  // 1 - cancel
  alert: function alert(msg, caption) {
    caption = caption || "QuickFolders";
    Services.prompt.alert(null, caption, msg);
  },


  checkDonationOrBuyLicenceReminder: function checkDonationOrBuyLicenceReminder () {

  },
  
  get supportsMap() {
    return (typeof Map == "function");
  } ,

	// detect current QuickFolders version and storing it in mExtensionVer
	// this is done asynchronously, so it respawns itself
	VersionProxy: function VersionProxy() {
    const util = QuickFolders.Util;
		try {
			if (util.mExtensionVer // early exit, we got the version!
				||
			    util.VersionProxyRunning) // no recursion...
				return;
			util.VersionProxyRunning = true;
			util.logDebugOptional("firstrun", "Util.VersionProxy() started.");
			if (Components.utils.import) {
				
				let versionCallback = function(addon) {
					let versionLabel = window.document.getElementById("qf-options-header-description");
					if (versionLabel) versionLabel.setAttribute("value", addon.version);

					util.mExtensionVer = addon.version;
					util.logDebug("AddonManager: QuickFolders extension's version is " + addon.version);
					util.logDebug("QuickFolders.VersionProxy() - DETECTED QuickFolders Version " + util.mExtensionVer + "\n" + "Running on " + util.Application	 + " Version " + util.ApplicationVersion);
					// make sure we are not in options window
					if (!versionLabel)
						util.FirstRun.init();
				}
				
				Components.utils.import("resource://gre/modules/AddonManager.jsm");
				const addonId = util.ADDON_ID.toString();
        AddonManager.getAddonByID(addonId).then(function(addonId) { versionCallback(addonId); } ); // this function is now a promise
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
		// returns the current QuickFolders (full) version number.
		if (util.mExtensionVer)
			return util.mExtensionVer; // set asynchronously
		let current = util.HARDCODED_CURRENTVERSION + util.HARDCODED_EXTENSION_TOKEN;
		// Addon Manager: use Proxy code to retrieve version asynchronously
		util.VersionProxy(); // modern Mozilla builds.
											// these will set mExtensionVer (eventually)
											// also we will delay FirstRun.init() until we _know_ the version number
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
  
	versionGreaterOrEqual: function(a, b) {
		let versionComparator = Components.classes["@mozilla.org/xpcom/version-comparator;1"]
														.getService(Components.interfaces.nsIVersionComparator);
		return (versionComparator.compare(a, b) >= 0);
	} ,

	versionSmaller: function(a, b) {
		let versionComparator = Components.classes["@mozilla.org/xpcom/version-comparator;1"]
														.getService(Components.interfaces.nsIVersionComparator);
		 return (versionComparator.compare(a, b) < 0);
	} ,	
		
	
	getMail3PaneWindow: function getMail3PaneWindow() {
		let windowManager = Components.classes['@mozilla.org/appshell/window-mediator;1']
				.getService(Components.interfaces.nsIWindowMediator),
		    win3pane = windowManager.getMostRecentWindow("mail:3pane");
		return win3pane;
	} ,
  
  getSingleMessageWindow: function getSingleMessageWindow() {
    let winMediator = Components.classes["@mozilla.org/appshell/window-mediator;1"].getService(Components.interfaces.nsIWindowMediator),
        singleMessageWindow = winMediator.getMostRecentWindow("mail:messageWindow");
    return singleMessageWindow;
  } ,
  
  // safe wrapper to get member from account.identities array
  getIdentityByIndex: function getIdentityByIndex(ids, index) {
    const Ci = Components.interfaces;
    if (!ids) return null;
    try {
      // replace queryElementAt with array[index].QueryInterface!
      if (ids[index])
        return ids[index].QueryInterface(Ci.nsIMsgIdentity);
      return null;
    }
    catch(ex) {
      QuickFolders.Util.logDebug('Exception in getIdentityByIndex(ids,' + index + ') \n' + ex.toString());
    }
    return null;
  } ,
  
	get mailFolderTypeName() {
    return "folder";
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
		const util = QuickFolders.Util;
		util.logDebug('slideAlert: ' + text);
		setTimeout(function() {
				try {
					if (!icon)
						icon = "chrome://quickfolders/content/skin/ico/quickfolders-Icon.png";
					Components.classes['@mozilla.org/alerts-service;1'].
								getService(Components.interfaces.nsIAlertsService).
								showAlertNotification(icon, title, text, false, '', null, 'quickfolders-alert');
				} catch(e) {
				// prevents runtime error on platforms that don't implement nsIAlertsService
				}
			} , 0);
	} ,
	
//	disableFeatureNotification: function disableFeatureNotification(featureName) {
//		QuickFolders.Preferences.setBoolPref("proNotify." + featureName, false);
//	} ,
  
	addConfigFeature: function addConfigFeature(filter, Default, textPrompt) {
		// adds a new option to about:config, that isn't there by default
		if (confirm(textPrompt)) {
			// create (non existent filter setting:
			QuickFolders.Preferences.setBoolPrefVerbose(filter, Default);
			QuickFolders.Options.showAboutConfig(null, filter, true, false);
		}
	},
	
	onCloseNotification: function onCloseNotification(eventType, notifyBox, notificationKey) {
		QuickFolders.Util.logDebug ("onCloseNotification(" + notificationKey + ")");
		window.setTimeout(function() {
	  // Postbox doesn't tidy up after itself?
		if (!notifyBox)
			return;
		let item = notifyBox.getNotificationWithValue(notificationKey);
		if(item) {
		  // http://mxr.mozilla.org/mozilla-central/source/toolkit/content/widgets/notification.xml#164
			notifyBox.removeNotification(item, false);	 // skipAnimation
		}
			}, 200);
	} ,
  
  hasPremiumLicense: function hasPremiumLicense(reset) {
		const licenser = QuickFolders.Util.Licenser;
    // early exit for Licensed copies
    if (licenser.isValidated) 
      return true;
    // short circuit if we already validated:
    if (!reset && licenser.wasValidityTested)
      return licenser.isValidated;
    let licenseKey = QuickFolders.Preferences.getStringPref('LicenseKey'),
        util = QuickFolders.Util;
    if (!licenseKey) 
      return false; // short circuit if no license key!
    if (!licenser.isValidated || reset) {
      licenser.wasValidityTested = false;
      licenser.validateLicense(licenseKey);
			// store license key in this object
			licenser.LicenseKey = licenseKey;
    }
    if (licenser.isValidated) 
      return true;
    return false;
  },
  
	popupProFeature: function popupProFeature(featureName, text) {
		let notificationId,
		    notifyBox,
        util = QuickFolders.Util,
				prefs = QuickFolders.Preferences,
				maindoc = util.getMail3PaneWindow().document;
    if (util.hasPremiumLicense(false))
      return;
    util.logDebugOptional("premium", "popupProFeature(" + featureName + ", " + text + ")");
		// is notification disabled?
		// check setting extensions.quickfolders.proNotify.<featureName>
    let usage = prefs.getIntPref("premium." + featureName + ".usage");
    usage++;
    prefs.setIntPref("premium." + featureName + ".usage", usage);
    notificationId = 'mail-notification-box';
		
		if (typeof specialTabs == 'object' && specialTabs.msgNotificationBar) { // Tb 68
			notifyBox = specialTabs.msgNotificationBar;
		}
		else {
			notifyBox = maindoc.getElementById (notificationId);
			if (notifyBox)
				util.logDebugOptional("premium", "notificationId = " + notificationId + ", found" + notifyBox);
		}
		let title=util.getBundleString("qf.notification.premium.title", "Premium Feature"),
		    theText=util.getBundleString("qf.notification.premium.text",
				        "{1} is a Premium feature, please get a QuickFolders Pro License for using it permanently.");
		theText = theText.replace ("{1}", "'" + featureName + "'");
    if (text)
      theText = theText + '  ' + text;
    
    let regBtn = util.getBundleString("qf.notification.premium.btn.getLicense", "Buy License!"),
        hotKey = util.getBundleString("qf.notification.premium.btn.hotKey", "L"),
		    nbox_buttons;
		// overwrite for renewal
		if (util.Licenser.isExpired)
				regBtn = util.getBundleString("qf.notification.premium.btn.renewLicense", "Renew License!");
		if (notifyBox) {
			let notificationKey = "quickfolders-proFeature";
      util.logDebugOptional("premium", "configure buttons…");
			// button for disabling this notification in the future
      nbox_buttons = [
        {
          label: regBtn,
          accessKey: hotKey, 
          callback: function() {
						util.getMail3PaneWindow().QuickFolders.Util.Licenser.showDialog(featureName); 
          },
          popup: null
        }
      ];
			
			if (notifyBox) {
				let item = notifyBox.getNotificationWithValue(notificationKey)
				if (item)
					notifyBox.removeNotification(item, false);
			}
		
      util.logDebugOptional("premium", "notifyBox.appendNotification()…");
			notifyBox.appendNotification( theText, 
					notificationKey , 
					"chrome://quickfolders/content/skin/ico/proFeature.png" , 
					notifyBox.PRIORITY_INFO_HIGH, 
					nbox_buttons ); // , eventCallback
		}
		else {
      // code should not be called, on SM we would have a sliding notification for now
			// fallback for systems that do not support notification (currently: SeaMonkey)
      util.logDebugOptional("premium", "fallback for systems without notification-box…");
			let prompts = Components.classes["@mozilla.org/embedcomp/prompt-service;1"]  
															.getService(Components.interfaces.nsIPromptService),
			    // check = {value: false},   // default the checkbox to true  
		      // dontShow = util.getBundleString("qf.notification.dontShowAgain",
		  	  //            "Do not show this message again.") + ' [' + featureName + ']',
			    result = prompts.alert(null, title, theText);
			//if (check.value==true)
			//	util.disableFeatureNotification(featureName);
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
		
		const prefs = QuickFolders.Preferences;
		
		try {
			if (sColorString.startsWith('rgb')) {
				// rgb colors.
				let components = sColorString.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*(\d+(?:\.\d+)?))?\)$/),
				    hexColor = "#" + hex(components[1]) + hex(components[2]) + hex(components[3]); // ignore transparency
				return hexColor;
			}
			let theColor, // convert system colors such as menubackground etc. to hex
			    d = document.createXULElement ? document.createXULElement("div") : document.createElement("div");
			d.style.color = sColorString;
			getContainer().appendChild(d)
			theColor = window.getComputedStyle(d,null).color;
			getContainer().removeChild(d);

			if (theColor.search("rgb") == -1)
				return theColor; // unchanged
			else {
				// rgb colors.
				theColor = theColor.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*(\d+(?:\.\d+)?))?\)$/);
				let hexColor = "#" + hex(theColor[1]) + hex(theColor[2]) + hex(theColor[3]);
				return hexColor;
			}
		}
		catch(ex) { // Bug 26387
			if (prefs.isDebug) debugger;
			this.logException('getSystemColor(' + sColorString + ') failed', ex);
			return "#000000";
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

	clearChildren: function clearChildren(element, withCategories) {
    if (!element) return;
		QuickFolders.Util.logDebugOptional ("events","clearChildren(withCategories= " + withCategories + ")");
		if (withCategories)
			while(element.children.length > 0) {
				element.removeChild(element.children[0]);
			}
		else {
			let nCount=0;	// skip removal of category selection box
			while(element.children.length > nCount) {
				if (element.children[nCount].id=='QuickFolders-Category-Box')
					nCount++;
				else
					element.removeChild(element.children[nCount]);
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
		const util = QuickFolders.Util;
		// TB 3 bug 22295 - if a single mail tab is opened this appears to close it!
		let found=false,
		    tabmail = document.getElementById("tabmail");
		if (tabmail) {
			let tab =  tabmail.selectedTab;

			if (tab) {
			  let tabMode = this.getTabMode(tab);
				util.logDebugOptional ("mailTabs", "ensureFolderViewTab - current tab mode: " + tabMode);
				if (tabMode != util.mailFolderTypeName) { //  TB: 'folder', SM: '3pane'
					// move focus to a messageFolder view instead!! otherwise TB3 would close the current message tab
					// switchToTab
					// iterate tabs
					let tabInfoCount = util.getTabInfoLength(tabmail);
					for (let i = 0; i < tabInfoCount; i++) {
					  let info = util.getTabInfoByIndex(tabmail, i);
						if (info && this.getTabMode(info) == util.mailFolderTypeName) { 
							util.logDebugOptional ("mailTabs","switching to tab: " + info.title);
							tabmail.switchToTab(i);
							found = true;
							break;
						}
					}
					// if it can't find a tab with folders ideally it should call openTab to display a new folder tab
					for (let i=0;(!found) && i < tabInfoCount; i++) {
					  let info = util.getTabInfoByIndex(tabmail, i);
						if (info && util.getTabMode(info)!='message') { // SM: tabmail.tabInfo[i].getAttribute("type")!='message'
							util.logDebugOptional ("mailTabs","Could not find folder tab - switching to msg tab: " + info.title);
							tabmail.switchToTab(i);
						  break;
						}
					}
				}
			}
		}
		return found;
	 } ,

	showStatusMessage: function showStatusMessage(s, isTimeout) {
		try {
			let win = QuickFolders_getWindow(),
			    sb = QuickFolders_getDocument().getElementById('status-bar'),
			    el, sbt;
			if (sb) {
				for (let i = 0; i < sb.children.length; i++)
				{
					el = sb.children[i];
					if (el.nodeType == 1 && el.id == 'statusTextBox') {
						sbt = el;
					    break;
					}
				}
				// SeaMonkey
				if (!sbt)
					sbt = sb;
				for (let i = 0; i < sbt.children.length; i++)
				{
					el = sbt.children[i];
					if (el.nodeType == 1 && el.id == 'statusText') {
					    el.label = s;
							if (isTimeout) {
								// erase my status message after 5 secs
								win.setTimeout(function() { 
								    if (el.label == s) // remove my message if it is still there
											el.label = "";
									}, 
									5000);
							}
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

	getFolderUriFromDropData: function getFolderUriFromDropData(evt, dragSession) {
		let trans = Components.classes["@mozilla.org/widget/transferable;1"].createInstance(Components.interfaces.nsITransferable);
		trans.addDataFlavor("text/x-moz-folder");
		trans.addDataFlavor("text/x-moz-newsfolder");
    if (!evt) debugger;
    if (!dragSession) dragSession = Cc["@mozilla.org/widget/dragservice;1"].getService(Ci.nsIDragService).getCurrentSession(); 

		// alert ("numDropItems = " + dragSession.numDropItems + ", isDataFlavorSupported=" + dragSession.isDataFlavorSupported("text/x-moz-folder"));

		dragSession.getData (trans, 0);

		let dataObj = new Object(),
		    len = new Object(),
        types = Array.from(evt.dataTransfer.mozTypesAt(0)),
        contentType = types[0],
		    flavour = contentType; // dropData.flavour ? dropData.flavour.contentType : dragSession.dataTransfer.items[0].type;
		try {
			trans.getTransferData(flavour, dataObj, len);

			if (dataObj) {
				dataObj = dataObj.value.QueryInterface(Components.interfaces.nsISupportsString);
				let sourceUri = dataObj.data.substring(0, len.value);
				return sourceUri;
			}
		}
		catch(e) {
			if (evt.dataTransfer.mozGetDataAt) {
				let f = evt.dataTransfer.mozGetDataAt(flavour, 0)
				if (f && f.URI)
					return f.URI;
			}
			this.logToConsole("getTransferData " + e);
		};

		return null;
	} ,

	getFolderFromDropData: function getFolderFromDropData(evt, dragSession) {
		let msgFolder=null;

    let uri = this.getFolderUriFromDropData(evt, dragSession); // older gecko versions.
    if (!uri)
      return null;
    msgFolder = QuickFolders.Model.getMsgFolderFromUri(uri, true).QueryInterface(Components.interfaces.nsIMsgFolder);

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
    const Ci = Components.interfaces,
          util = QuickFolders.Util; 
		let step = 0;
    if (!messageUris) 
      return null;
		try {
			try {
        util.logDebugOptional('dnd,quickMove', 'QuickFolders.Util.moveMessages: target = ' + targetFolder.prettyName + ', makeCopy=' + makeCopy);
      }
			catch(e) { util.alert('QuickFolders.Util.moveMessages:' + e); }

			if (targetFolder.flags & this.FolderFlags.MSG_FOLDER_FLAG_VIRTUAL) {
        util.slideAlert (util.getBundleString ("qfAlertDropFolderVirtual", "you can not drop messages to a search folder"));
				return null;
			}
			step = 1;

			let messageList,
          isListArray = util.versionGreaterOrEqual(util.ApplicationVersion, "85"); // [issue 96]
          
      if (isListArray) 
        messageList = [];
      else
        messageList = Components.classes["@mozilla.org/array;1"].createInstance(Ci.nsIMutableArray);
        
			step = 2;

			// copy what we need...
			let messageIdList = [],
          isMarkAsRead = QuickFolders.Preferences.getBoolPref('markAsReadOnMove'),
          bookmarks = QuickFolders.bookmarks,
          isTargetDifferent = false,
          sourceFolder;
			for (let i = 0; i < messageUris.length; i++) {
				let messageUri = messageUris[i],
				    Message = messenger.messageServiceFromURI(messageUri).messageURIToMsgHdr(messageUri),
            bookmarked = bookmarks.indexOfEntry(messageUri);
        if(isMarkAsRead) {
          Message.markRead(true);
        }
        step = 3;
        // if we move, check our reading list!
        if (!makeCopy && bookmarked>=0) {
          let entry = bookmarks.Entries[bookmarked];
          // overwrite the folder URI: we will hope to find it here after being moved
          if (entry.FolderUri != targetFolder.URI) {
            bookmarks.dirty = true;
            util.logDebug('Moving Mail from ' + entry.Uri + ' to folder ' + targetFolder.URI + '\n'
              + 'Reading List item marked as invalid.');
            entry.FolderUri = targetFolder.URI; 
            entry.invalid = true;
          }
        }

				messageIdList.push(Message.messageId);
        if (isListArray) 
          messageList.push(Message);
        else
          messageList.appendElement(Message , false);
        // [issue 23]  quick move from search list fails if first mail is already in target folder
        //  What to do if we have "various" source folders?
        if (Message.folder.QueryInterface(Ci.nsIMsgFolder) != targetFolder) {
          sourceFolder = Message.folder.QueryInterface(Ci.nsIMsgFolder); // force nsIMsgFolder interface for postbox 2.1
          isTargetDifferent = true;
        }
			}

			step = 4;
      if (!isTargetDifferent) {
        util.slideAlert("QuickFolders", 'Nothing to do: Message is already in folder: ' + targetFolder.prettyName);
        return null;
      }
			step = 5;
			let cs = Components.classes["@mozilla.org/messenger/messagecopyservice;1"].getService(Ci.nsIMsgCopyService);
			step = 6;
			targetFolder = targetFolder.QueryInterface(Ci.nsIMsgFolder);
			step = 7;
      let isMove = (!makeCopy), // mixed!
          mw = msgWindow; // msgWindow  - global
      util.logDebugOptional('dnd,quickMove,dragToNew', 'calling CopyMessages (\n' +
        'sourceFolder = ' + sourceFolder.prettyName + '\n'+
        'messages = ' + messageList + '\n' +
        'destinationFolder = ' + targetFolder.prettyName + '\n' + 
        'isMove = (various)\n' + 
        'listener = QuickFolders.CopyListener\n' +
        'window = ' + mw + '\n' +
        'allowUndo = true)');      
			cs.CopyMessages(sourceFolder, messageList, targetFolder, isMove, QuickFolders.CopyListener, mw, true);
			step = 8;
			util.touch(targetFolder); // set MRUTime
			return messageIdList; // we need the first element for further processing
		}
		catch(e) {
			this.logToConsole('Exception in QuickFolders.Util.moveMessages, step ' + step + ':\n' + e);
		};
		return null;
	} ,
	
	// Set the MRU time for a folder to make it appear in recent folders list
	touch: function touch(folder) {
		const util = QuickFolders.Util,
          FLAGS = util.FolderFlags;
		try {
      // special folders we do not want / need in recent history:
      if (folder.flags & 
            (FLAGS.MSG_FOLDER_FLAG_TRASH | FLAGS.MSG_FOLDER_FLAG_SENTMAIL | FLAGS.MSG_FOLDER_FLAG_QUEUE | 
             FLAGS.MSG_FOLDER_FLAG_JUNK  | FLAGS.MSG_FOLDER_FLAG_ARCHIVES | FLAGS.MSG_FOLDER_FLAG_DRAFTS)) return;
			if (folder.SetMRUTime)
				folder.SetMRUTime();
			else {
				let ct = parseInt(new Date().getTime() / 1000); // current time in secs
				folder.setStringProperty("MRUTime", ct);
			}
			let time = folder.getStringProperty("MRUTime");
			util.logDebug("util.touch(" + folder.prettyName + ")\n" + time + '\n' + util.getMruTime(folder));
		}
		catch(ex) {
			util.logException("util.touch failed on " + folder.prettyName, ex);
		}
	} ,
	
	getMruTime: function getMruTime(fld) {
		let theDate = 'no date';
		if (typeof fld.getStringProperty != 'undefined') {
			try {
				let mru = fld.getStringProperty("MRUTime");
				if (mru) {
					let dt	= new Date(Number(mru) * 1000);
					theDate = dt.getDate().toString() + '/' + (dt.getMonth()+1) + ' ' + dt.getHours() + ':' + dt.getMinutes() + ':' + dt.getSeconds();
				}
			}
			catch(ex) {;}
		}
		return theDate;
	} ,
	
	getTabInfoLength: function getTabInfoLength(tabmail) {
		if (tabmail.tabInfo)
		  return tabmail.tabInfo.length;
		return null;
	} ,
	
	getTabInfoByIndex: function getTabInfoByIndex(tabmail, idx) {
		if (tabmail.tabInfo && tabmail.tabInfo.length)
			return tabmail.tabInfo[idx];
    this.logDebug("getTabInfoByIndex("+ tabmail + ", " + idx +") fails: check tabInfo length! = " + tabmail.tabInfo);
    console.log(tabmail);
		return null;
	} ,
	
	getTabMode: function getTabMode(tab) {
	  if (tab.mode) {   // Tb / Sm
			return tab.mode.name;
		}
		return "";
	},
	
	// of folder is deleted we should not throw an error!
	get CurrentFolder() {
		const util = QuickFolders.Util;
		let aFolder;
		if (typeof(GetLoadedMsgFolder) != 'undefined') {
			aFolder = GetLoadedMsgFolder();
		}
		else
		{
			let currentURI = null;
			if (gFolderDisplay && gFolderDisplay.displayedFolder)
				currentURI = gFolderDisplay.displayedFolder.URI;
			// in search result folders, there is no current URI!
			if (!currentURI)
				return null;
			try {
				aFolder = QuickFolders.Model.getMsgFolderFromUri(currentURI, true).QueryInterface(Components.interfaces.nsIMsgFolder); // inPB case this is just the URI, not the folder itself??
			}
			catch(ex) {
				util.logException(ex, "QuickFolders.Util.CurrentFolder (getter) failed.");
				return null;
			}
		}
		return aFolder;
	} ,

	
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

  getSelectedMsgUris: function getSelectedMsgUris() {
		let messages;
		if (typeof gFolderDisplay !='undefined') {
			messages = gFolderDisplay.selectedMessageUris;
			gFolderDisplay.hintAboutToDeleteMessages();
		}
		if (!messages)
			return null;
    return messages;
  },
  
  getFriendlyMessageLabel: function getFriendlyMessageLabel(hdr) {
    let fromName = hdr.mime2DecodedAuthor,
        date,
        maxLen = QuickFolders.Preferences.maxSubjectLength,
        subject = hdr.mime2DecodedSubject.substring(0, maxLen);
    if (hdr.mime2DecodedSubject.length>maxLen)
      subject += ("\u2026".toString()); // ellipsis
    let matches = fromName.match(/([^<]+)\s<(.*)>/);
    if (matches && matches.length>=2)
      fromName = matches[1];
    try {
      date =(new Date(hdr.date/1000)).toLocaleString();
    } catch(ex) {date = '';}
    return fromName + ': ' + (subject ? (subject + ' - ') : '') + date;    
  } ,
  
	threadPaneOnDragStart: function threadPaneOnDragStart(aEvent) {
		QuickFolders.Util.logDebugOptional ("dnd","threadPaneOnDragStart(" + aEvent.originalTarget.localName
			+ (aEvent.isThread ? ",thread=true" : "")
			+ ")");
		if (aEvent.originalTarget.localName != "toolbarbutton")
			return;
    
    let messages = this.getSelectedMsgUris();
    if (!messages) return;
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
    let summary = '';
		for (let i in messages) {
      let message = messages[i];
      // copy message URLs:
			messenger.messageServiceFromURI(message).GetUrlForUri(message, msgUrls, null);
			aEvent.dataTransfer.mozSetDataAt("text/x-moz-message", message, i);
      let header = messenger.messageServiceFromURI(message).messageURIToMsgHdr(message),
			    subject = header.mime2DecodedSubject;
			uniqueFileName = newUF ?
				this.suggestUniqueFileName(subject.substr(0,124), ".eml", fileNames) :
				this.suggestUniqueFileName_Old(subject.substr(0,124), ".eml", fileNames);
			fileNames.add(uniqueFileName);
			try {
				aEvent.dataTransfer.mozSetDataAt("text/x-moz-url", msgUrls.value.spec, i);
				aEvent.dataTransfer.mozSetDataAt("application/x-moz-file-promise-url", 
																				 msgUrls.value.spec + "&fileName=" + 
																				 uniqueFileName, i);
				aEvent.dataTransfer.mozSetDataAt("application/x-moz-file-promise", null, i);
				count++;
        summary += '\n' + count + '.  ' + QuickFolders.Util.getFriendlyMessageLabel(header);
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
		QuickFolders.Util.logDebugOptional ("dnd","threadPaneOnDragStart() ends: " + count + " messages prepared:" + summary);
	},

	debugVar: function debugVar(value) {
		let str = "Value: " + value + "\r\n";
		for (let prop in value) {
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
	  try {
      scriptError.init(aMessage, aSourceName, aSourceLine, aLineNumber, aColumnNumber, aFlags, aCategory);
      consoleService.logMessage(scriptError);
    }
    catch(ex) {
      alert('logError failed: ' + aMessage);
    }
	} ,

	logException: function logException(aMessage, ex) {
		let stack = ''
		if (typeof ex.stack!='undefined')
			stack= ex.stack.replace("@","\n  ");
		// let's display a caught exception as a warning.
		let fn = ex.fileName || "?";
		this.logError(aMessage + "\n" + ex.message, fn, stack, ex.lineNumber, 0, 0x1);
	} ,

	logDebug: function (msg) {
		if (QuickFolders.Preferences.isDebug)
			this.logToConsole(msg);
	},
	
	get isDebug() {
		return QuickFolders.Preferences.isDebug;
	},	

  /** 
	* only logs if debug mode is set and specific debug option are active
	* 
	* @optionString {string}: comma delimited options
  * @msg {string}: text to log 
	*/   
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
  
  logIdentity: function logIdentity(id) {  // debug a nsIMsgIdentity 
    if (!id) return "EMPTY id!"
    let txt = '';
    try { // building this incremental in case of problems. I know this is bad for performance, because immutable strings.
      txt += "key: " + id.key + '\n';
      txt += "email:" + (id.email || 'EMPTY') + '\n';
      txt += "fullName:" + (id.fullName || 'EMPTY') + '\n';
      txt += "valid:" + (id.valid || 'EMPTY') + '\n';
      txt += "identityName: " + id.identityName + '\n';
    }
    catch(ex) {
      this.logException('validateLicense (identity info:)\n' + txt, ex);
    }
    finally {
      return txt;
    }
  } ,

	getBaseURI: function baseURI(URL) {
		let hashPos = URL.indexOf('#'),
				queryPos = URL.indexOf('?'),
				baseURL = URL;
				
		if (hashPos>0)
			baseURL = URL.substr(0, hashPos);
		else if (queryPos>0)
			baseURL = URL.substr(0, queryPos);
		if (baseURL.endsWith('/'))
			return baseURL.substr(0, baseURL.length-1); // match "x.com" with "x.com/"
		return baseURL;		
	} ,
	
	findMailTab: function findMailTab(tabmail, URL) {
		const util = QuickFolders.Util;
    var { Services } = ChromeUtils.import("resource://gre/modules/Services.jsm");
		// mail: tabmail.tabInfo[n].browser		
		let baseURL = util.getBaseURI(URL),
				numTabs = util.getTabInfoLength(tabmail);
		
		for (let i = 0; i < numTabs; i++) {
			let info = util.getTabInfoByIndex(tabmail, i);
			if (info.browser && info.browser.currentURI) {
				let tabUri = util.getBaseURI(info.browser.currentURI.spec);
				if (tabUri == baseURL) {
					tabmail.switchToTab(i);
          try {
            let params = {
              triggeringPrincipal: Services.scriptSecurityManager.getSystemPrincipal()
            }
            info.browser.loadURI(URL, params);
          }
          catch(ex) {
            util.logException(ex);
          }
					return true;
				}
			}
		}
		return false;
	} ,	
	
	// dedicated function for email clients which don't support tabs
	// and for secured pages (donation page).
	openLinkInBrowserForced: function openLinkInBrowserForced(linkURI) {
    let Ci = Components.interfaces;
		try {
			this.logDebug("openLinkInBrowserForced (" + linkURI + ")");
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
	
	// appends user=pro OR user=proRenew if user has a valid / expired license
	makeUriPremium: function makeUriPremium(URL) {
		const util = QuickFolders.Util,
					isPremiumLicense = util.hasPremiumLicense(false) || util.Licenser.isExpired;
		try {
			let uType = "";
			if (util.Licenser.isExpired) 
				uType = "proRenew"
			else if (util.hasPremiumLicense(false))
			  uType = "pro";
			// make sure we can sanitize all pages for our premium users!
			if (   uType
			    && URL.indexOf("user=")==-1 
					&& URL.indexOf("quickfolders.org")>0 ) {
				// remove #NAMED anchors
				let x = URL.indexOf("#"),
				    anchor = '';
				if (x>0) {
					anchor = URL.substr(x);
					URL = URL.substr(0, x)
				}
				if (URL.indexOf("?")==-1)
					URL = URL + "?user=" + uType;
				else
					URL = URL + "&user=" + uType;
			}
		}
		catch(ex) {
		}
		finally {
			return URL;
		}
	} ,

	// moved from options.js
	// use this to follow a href that did not trigger the browser to open (from a XUL file)
	openLinkInBrowser: function openLinkInBrowser(evt, linkURI) {
		const Cc = Components.classes,
					Ci = Components.interfaces,
					util = QuickFolders.Util;
		linkURI = util.makeUriPremium(linkURI);
		try {
      let service = Cc["@mozilla.org/uriloader/external-protocol-service;1"].getService(Ci.nsIExternalProtocolService),
          ioservice = Cc["@mozilla.org/network/io-service;1"].getService(Ci.nsIIOService);
      service.loadURI(ioservice.newURI(linkURI, null, null));
      if (null!=evt)
        evt.stopPropagation();
		}
		catch(e) { 
      this.logDebug("openLinkInBrowser (" + linkURI + ") " + e.toString()); 
      this.openLinkInBrowserForced(linkURI);
    }
	},

	// moved from options.js (then called
	openURL: function openURL(evt,URL) { // workaround for a bug in TB3 that causes href's not be followed anymore.
    if (QuickFolders_TabURIopener.openURLInTab(URL) && null!=evt) {
      if (evt.preventDefault)  evt.preventDefault();
      if (evt.stopPropagation)  evt.stopPropagation();
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

	getFolderTooltip: function getFolderTooltip(folder, btnLabel) {
		// tooltip - see also Attributes section of
		// https://developer.mozilla.org/en/XPCOM_Interface_Reference/nsIMsgFolder#getUriForMsg.28.29
		// and docs for nsIMsgIncomingServer
		let getPref = function(arg) { return QuickFolders.Preferences.getBoolPref('tooltips.' + arg); },
		    sVirtual = folder && (folder.flags & this.FolderFlags.MSG_FOLDER_FLAG_VIRTUAL) ? " (virtual)" : "",
			  baseFolder = '',
		    srvName = '',
				tooltip = '',
				folderName = '',
			  flags = '';
		if (!folder) {
			if (btnLabel)
				return "No Folder for [" + btnLabel + "] - try the 'Find Orphaned Tabs' command.";
			return "Missing Folder - try the 'Find Orphaned Tabs' command.";
		}
		
		try {
			folderName = folder.name;
		}
		catch(ex) {
			folderName = 'no name?';
      this.logException('No folder.name for folder:' + folder.toString() + '!', ex);
		}
		
		try {
			try {
				let srv = folder.server;
				if (getPref('serverName')) {
					if (srv) {
						try {srvName = ' [' + srv.hostName + ']';}
						catch(e) { };
					}
				}
			}
			catch(ex) {
				this.logException('No folder.server for folder:' + folderName + '!', ex);
			}
			
			if (getPref('baseFolder')) {
				try {
					if (folder.rootFolder) {
						try {baseFolder = ' - ' + folder.rootFolder.name;}
						catch(e) { };
					}
					else
						this.logDebug('getFolderTooltip() - No rootFolder on: ' + folderName + '!');
				}
				catch(e) { 
					this.logDebug('getFolderTooltip() - No rootFolder on: ' + folderName + '!');
				};
			}
			
			if (getPref('msgFolderFlags')) {
				flags = ' 0x' + folder.flags.toString(16);
			}
		
			if (getPref('parentFolder')) {
				let parent = folder.parent;
				if (parent && !parent.isServer) {
					tooltip += parent.name+'/';
				}
			}
		} // outer try for "foreign" objects, such as localfolders
		catch(ex) {
			this.logDebug('could not retrieve tooltip data for a folder');
		}
		
		tooltip += folderName + baseFolder + srvName + flags;
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
      this._isCSSGradients = true; // Thunderbird
		}
		catch(ex) {
			this._isCSSGradients = false;
		}
		return this._isCSSGradients;
	},
	
	// use legacy iterator code
	get isLegacyIterator() {
    // only gecko <13 or Interlink
		return false;
	} ,
	
	aboutHost: function aboutHost() {
		const util = QuickFolders.Util;
		let txt = "App: " + util.Application + " " + util.ApplicationVersion + "\n" + 
		   "PlatformVersion: " + util.PlatformVersion + "\nname: " + util.ApplicationName;
		util.logToConsole(txt);
		  
	} ,
	
	get isCSSRadius() {
	  if (this._isCSSRadius === -1) {
			this._isCSSRadius =	true
		}
		return this._isCSSRadius;
	},
	
	get isCSSShadow() {
		if (this._isCSSShadow === -1) {
			this._isCSSShadow = true;
		}
		return this._isCSSShadow;
	} ,
	
	// helper function for css value entries - strips off rule part and semicolon (end)
	sanitizeCSSvalue: function sanitizeCSSvalue(val) {
		let colon = val.indexOf(':');
		if (colon>=0) val = val.substr(colon+1);
		let semicolon = val.indexOf(';');
		if (semicolon>0) val = val.substr(0,semicolon);
		val = val.trim ? val.trim() : val;
		return val;
	} ,
	
	doesMailFolderExist: function checkExists(msgFolder) {
    const FLAGS = QuickFolders.Util.FolderFlags;
    if (!msgFolder) return false;
		if (!msgFolder.filePath)	{
			QuickFolders.Util.logDebug('doesMailFolderExist() msgFolder.filePath missing! - returning false');
			return false;
		}
		if (msgFolder.flags & FLAGS.MSG_FOLDER_FLAG_NEWSGROUP)
		  return true; // we do not validate nntp folders
		if (msgFolder.filePath.exists()) {
			return true;
		}
		else {
		  // jcranmer's method. Just check for the parent, and we are done.
      // empty folder:
      let p = msgFolder.parent;
      if(!p) return false;
      if (p.flags & FLAGS.MSG_FOLDER_FLAG_TRASH)
        return false; // empty folder, in trash
			return true; // msgFolder.parent != null;
		}
		return false;
	},
	
	doesMailUriExist: function checkUriExists(URI) {
		let f = QuickFolders.Model.getMsgFolderFromUri(URI);
		return (f && f.parent) ? true : false;
	},
	
	polyFillEndsWidth: function polyFillEndsWidth() {
		if (!String.prototype.endsWith) {
			Object.defineProperty(String.prototype, 'endsWith', {
					enumerable: false,
					configurable: false,
					writable: false,
					value: function (searchString, position) {
							position = (position || this.length) - searchString.length;
							let lastIndex = this.lastIndexOf(searchString);
							return lastIndex !== -1 && lastIndex === position;
					}
			});
		}
	},
  
  // open an email in a new tab
  openMessageTabFromHeader: function openMessageTabFromHeader(hdr) {
    let util = QuickFolders.Util,
        tabmail = util.$("tabmail");
    // TO DO - do sanity check on msgHdr (does the message still exist) and throw!
    tabmail.openTab('message', {msgHdr: hdr, background: false}); 
  },
  
  // open an email in a new tab
  openMessageTabFromUri: function openMessageTabFromUri(messageUri) {
    try {
      let hdr = messenger.messageServiceFromURI(messageUri).messageURIToMsgHdr(messageUri);
      if (!hdr || hdr.messageId==0) {
        return false;
      }
      this.openMessageTabFromHeader(hdr);
    }
    catch(ex) {
      return false;
    }
    return true;
  } ,
 
  pbGetSelectedMessageUris: function pbGetSelectedMessageUris() {
    let messageArray = {},
        length = {},
        view = GetDBView();
    view.getURIsForSelection(messageArray, length);
    if (length.value) {
      return messageArray.value;
    }
    else
      return null;
  },
	
	loadPlatformStylesheet: function loadPlatformStylesheet(win) {
		const QI = QuickFolders.Interface,
		      util = QuickFolders.Util,
					styleEngine = QuickFolders.Styles;
		util.logDebug("Loading platform styles for " + util.HostSystem + "…");
		let path="";
		switch (util.HostSystem) {
			case "linux":
				path= 'chrome://quickfolders/content/skin/unix/qf-platform.css', 'QuickFolderPlatformStyles';
				//QI.ensureStyleSheetLoaded('chrome://quickfolders/content/skin/unix/qf-platform.css', 'QuickFolderPlatformStyles');
				break;
			case "winnt":
				path= 'chrome://quickfolders/content/skin/win/qf-platform.css', 'QuickFolderPlatformStyles';
//				QI.ensureStyleSheetLoaded('chrome://quickfolders/content/skin/win/qf-platform.css', 'QuickFolderPlatformStyles');
				break;
			case "darwin":
				path= 'chrome://quickfolders/content/skin/mac/qf-platform.css', 'QuickFolderPlatformStyles';
				//QI.ensureStyleSheetLoaded('chrome://quickfolders/content/skin/mac/qf-platform.css', 'QuickFolderPlatformStyles');
				break;
		}
    
    setTimeout(function() {
      // note - in a single message window  QuickFolders_globalWin == messageWindow.xhtml
      let newCSS = QuickFolders_globalWin.QuickFolders.WL.injectCSS(path);
      newCSS.setAttribute("title", "QuickFolderPlatformStyles");
    },150);
    
	} ,
	
  Postbox_writeFile: function Pb_writeFile(path, jsonData) {
    const Ci = Components.interfaces,
          Cc = Components.classes,
					NSIFILE = Ci.nsILocalFile || Ci.nsIFile;
    
    let file = Cc["@mozilla.org/file/local;1"].createInstance(NSIFILE); // Postbox specific. deprecated in Tb 57
    file.initWithPath(path);
    // stateString.data = aData;
    // Services.obs.notifyObservers(stateString, "sessionstore-state-write", "");

    // Initialize the file output stream.
    let ostream = Cc["@mozilla.org/network/safe-file-output-stream;1"].createInstance(Ci.nsIFileOutputStream);
    ostream.init(file, 
                 0x02 | 0x08 | 0x20,   // write-only,create file, reset if exists
                 0x600,   // read+write permissions
                 ostream.DEFER_OPEN); 

    // Obtain a converter to convert our data to a UTF-8 encoded input stream.
    let converter = Cc["@mozilla.org/intl/scriptableunicodeconverter"].createInstance(Ci.nsIScriptableUnicodeConverter);
    converter.charset = "UTF-8";

    // Asynchronously copy the data to the file.
    let istream = converter.convertToInputStream(jsonData); // aData
    NetUtil.asyncCopy(istream, ostream, function(rc) {
      if (Components.isSuccessCode(rc)) {
        // do something for success
      }
    });
  } ,
  
  Postbox_readFile: function Pb_readFile(path) {
    const Ci = Components.interfaces,
          Cc = Components.classes,
					NSIFILE = Ci.nsILocalFile || Ci.nsIFile;
    let file = Cc["@mozilla.org/file/local;1"].createInstance(NSIFILE); // Postbox specific. deprecated in Tb 57
    file.initWithPath(path);
          
    let fstream = Cc["@mozilla.org/network/file-input-stream;1"].
                  createInstance(Ci.nsIFileInputStream);
    fstream.init(file, -1, 0, 0);

    let cstream = Cc["@mozilla.org/intl/converter-input-stream;1"].
                  createInstance(Ci.nsIConverterInputStream);
    cstream.init(fstream, "UTF-8", 0, 0);

    let string  = {};
    cstream.readString(-1, string);
    cstream.close();
    return string.value;    
  }, 
	
	alertButtonNoFolder: function alertButtonNoFolder(button) {
		let txt = button ? button.getAttribute('folderURI') : "";
		alert("This folder doesn't exist! Function not available.." 
		  + txt ? "\nFolder URI = " + txt : "");
	} ,
  
  getAnonymousNodes(doc,el) {
    let aN = [];
    for (let i = el.childNodes.length-1; i>0; i--) {
      if (!el.childNodes[i].getAttribute("id") && !el.childNodes[i].getAttribute("name"))
        aN.push(el);
    }
    return aN;
  } ,
	
	// helper function to get a name from an uri that has no folder
	getNameFromURI: function getNameFromURI(uri) {
		if (!uri) return "no uri";
		const ellipsis = "\u2026".toString();
		let slash = uri.lastIndexOf("/");
		return slash>0 ? ellipsis  + uri.substr(slash) : ellipsis + uri.substr(-16);
	},
	
  // moved from FilterList!
	validateFilterTargets: function(sourceURI, targetURI) {
		// fix any filters that might still point to the moved folder.
		// 1. nsIMsgAccountManager  loop through list of servers
		try {
			const Ci = Components.interfaces,
			      util = QuickFolders.Util;
			let Accounts = util.Accounts,
			    acctMgr = Components.classes["@mozilla.org/messenger/account-manager;1"]  
	                        .getService(Ci.nsIMsgAccountManager); 
			for (let a=0; a<Accounts.length; a++) {
				let account = Accounts[a];
				if (account.incomingServer && account.incomingServer.canHaveFilters ) 
				{ 
					let srv = account.incomingServer.QueryInterface(Ci.nsIMsgIncomingServer);
					QuickFolders.Util.logDebugOptional("filters", "checking account for filter changes: " +  srv.prettyName);
					// 2. getFilterList
					let filterList = srv.getFilterList(msgWindow).QueryInterface(Ci.nsIMsgFilterList);
					// 3. use  nsIMsgFilterList.matchOrChangeFilterTarget(oldUri, newUri, false) 
					if (filterList) {
						filterList.matchOrChangeFilterTarget(sourceURI, targetURI, false) 
					}
				}
			}    
		}
		catch(ex) {
			QuickFolders.Util.logException("Exception in QuickFolders.Util.validateFilterTargets ", ex);
		}
	}

  
};  // QuickFolders.Util


// https://developer.mozilla.org/en/Code_snippets/On_page_load#Running_code_on_an_extension%27s_first_run_or_after_an_extension%27s_update
QuickFolders.Util.FirstRun = {
	init: function init() {
    const util = QuickFolders.Util,
          prefs = QuickFolders.Preferences;
		let prev = -1, firstrun = true,
		    showFirsts = true, debugFirstRun = false,
		    prefBranchString = "extensions.quickfolders.",
		    svc = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefService),
		    ssPrefs = svc.getBranch(prefBranchString);

		try { debugFirstRun = Boolean(ssPrefs.getBoolPref("debug.firstrun")); } 
    catch (e) { debugFirstRun = false; }

		util.logDebugOptional ("firstrun","QuickFolders.Util.FirstRun.init()");
		if (!ssPrefs) {
			util.logDebugOptional ("firstrun","Could not retrieve prefbranch for " + prefBranchString);
		}

		let current = util.Version;
		util.logDebug("Current QuickFolders Version: " + current);

		try {
			util.logDebugOptional ("firstrun","try to get setting: getStringPref(version)");
			try { prev = ssPrefs.getStringPref("version"); }
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
      let suppressVersionScreen = false,
			// AG if this is a pre-release, cut off everything from "pre" on... e.g. 1.9pre11 => 1.9
			    pureVersion = util.VersionSanitized;
			util.logDebugOptional ("firstrun","finally - pureVersion=" + pureVersion);
			
			if (pureVersion >= '3.12' && prev < "3.12") {
				QuickFolders.Model.upgradePalette(ssPrefs);
			}
			
			// STORE CURRENT VERSION NUMBER!
			if (prev!=pureVersion && current!='?' && (current.indexOf(util.HARDCODED_EXTENSION_TOKEN) < 0)) {
				util.logDebugOptional ("firstrun","Store current version " + current);
				ssPrefs.setStringPref("version", pureVersion); // store sanitized version! (no more alert on pre-Releases + betas!)
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
						util.openURL(null, "https://quickfolders.org/index.html");
					}, 1500); 
				}
			}
			else { 
        let isPremiumLicense = util.hasPremiumLicense(false) || util.Licenser.isExpired,
        		versionPage = util.makeUriPremium("https://quickfolders.org/version.html") + "#" + pureVersion;
        // UPDATE CASE 
        // this section does not get loaded if it's a fresh install.
				suppressVersionScreen = prefs.getBoolPrefSilent("extensions.quickfolders.hideVersionOnUpdate");
				
				/** minor version upgrades / sales  **/
				if (pureVersion.indexOf('4.8.3') == 0 && prev.indexOf("4.8") == 0)
          suppressVersionScreen = true;
				
				
				// SILENT UPDATES
				// Check for Maintenance updates (no donation screen when updating to 3.12.1, 3.12.2, etc.)
				//  same for 3.14.1, 3.14.2 etc - no donation screen
				if ((pureVersion.indexOf('4.7.') == 0 && prev.indexOf("4.7") == 0)
					  ||
					  (pureVersion.indexOf('4.9.') == 0 && prev.indexOf("4.9") == 0)
            ||
            (pureVersion.indexOf('4.17.4') == 0 && prev.indexOf("4.17.3") == 0)
					  )
        {
					suppressVersionScreen = true;
				}
        if (isPremiumLicense) {
					util.logDebugOptional ("firstrun","has premium license.");
					if ((pureVersion.indexOf('4.8.1')==0  || pureVersion.indexOf('4.8.2')==0 )
					    && prev.indexOf("4.8") == 0) {
						suppressVersionScreen = true;
					}
				}
				
				let isThemeUpgrade = prefs.tidyUpBadPreferences();
				QuickFolders.Model.updatePalette();

				if (prev!=pureVersion && current.indexOf(util.HARDCODED_EXTENSION_TOKEN) < 0) {
					util.logDebugOptional ("firstrun","prev!=current -> upgrade case.");
					// upgrade case!!
					let sUpgradeMessage = util.getBundleString ("qfAlertUpgradeSuccess", "QuickFolders was successfully upgraded to version:")
						 + " " + current;

					if (showFirsts) {
						// version is different => upgrade (or conceivably downgrade)

						// DONATION PAGE - REMOVED

						// VERSION HISTORY PAGE
						// display version history - disable by right-clicking label above show history panel
						if (!suppressVersionScreen) {
							util.logDebugOptional ("firstrun","open tab for version history, QF " + current);
							window.setTimeout(function(){ util.openURL(null, versionPage); }, 2200);
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
				
				util.loadPlatformStylesheet(window);
			}
			util.logDebugOptional ("firstrun","finally { } ends.");
		} // end finally

		//window.removeEventListener("load",function(){ QuickFolders.Util.FirstRun.init(); },true);
	}


// // fire this on application launch, which includes open-link-in-new-window
// window.addEventListener("load",function(){ QuickFolders.Util.FirstRun.init(); },true);

};  // QuickFolders.Util.FirstRun



// MODERN SHIM CODES - reintegrate these into Util={..} later.

// Modern platform js (for of instead for in)
QuickFolders.Util.iterateFolders = function folderIterator(folders, findItem, fnPayload) {
  const util = QuickFolders.Util;
  let found = false;
  // old style iterator (Postbox) - avoid in Thunderbird to avoid warning
  for (let folder of folders) {
    if (folder == findItem) {
      found = true;
      util.logDebugOptional('events','iterateFolders()\nfor..of - found the item and calling payload function(null, folder): ' + folder.prettyName);
      fnPayload(null, folder);
      break;
    }
  }
  return found;
}



  // iterate all folders
  // writable - if this is set, exclude folders that do not accept mail from move/copy (e.g. newsgroups)
QuickFolders.Util.allFoldersIterator = function allFoldersIterator(writable) {
	let Ci = Components.interfaces,
			Cc = Components.classes,
			acctMgr = Cc["@mozilla.org/messenger/account-manager;1"].getService(Ci.nsIMsgAccountManager),
			FoldersArray, allFolders,
			util = QuickFolders.Util;
	
	if (typeof ChromeUtils.import == "undefined")
		Components.utils.import('resource:///modules/iteratorUtils.jsm'); 
	else
		var { fixIterator } = ChromeUtils.import('resource:///modules/iteratorUtils.jsm');
	
  if (acctMgr.allFolders) { // Thunderbird & modern builds
		FoldersArray = Cc["@mozilla.org/array;1"].createInstance(Ci.nsIMutableArray);
		allFolders = acctMgr.allFolders;
		for (let aFolder of fixIterator(allFolders, Ci.nsIMsgFolder)) {
			// filter out non-fileable folders (newsgroups...)
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
		for (let account of fixIterator(acctMgr.accounts, Ci.nsIMsgAccount)) {
			if (account.rootFolder)
				account.rootFolder.ListDescendents(allFolders);
			for (let aFolder of fixIterator(allFolders, Ci.nsIMsgFolder)) {
				FoldersArray.appendElement(aFolder, false);
				if (writable && !folder.canFileMessages) {
					continue;
				}
			}		 
		}	
		return fixIterator(FoldersArray, Ci.nsIMsgFolder);
	}
} 


// find next unread folder
QuickFolders.Util.getNextUnreadFolder = function getNextUnreadFolder(currentFolder) {
	const util = QuickFolders.Util,
				unwantedFolders = util.FolderFlags.MSG_FOLDER_FLAG_DRAFTS   // skip drafts
					                   | util.FolderFlags.MSG_FOLDER_FLAG_TRASH // skip trash
					                   | util.FolderFlags.MSG_FOLDER_FLAG_QUEUE // skip queue
					                   | util.FolderFlags.MSG_FOLDER_FLAG_JUNK; // skip spam
	let found = false,
	    isUnread = false,
		  lastFolder,
			firstUnread = null,
			folder; // remember this one for turnaround!
		// progress the folder variable to the next sibling
		// if no next sibling available to next sibling of parent folder (recursive)
		// question: should own child folders also be included?


	for (folder of util.allFoldersIterator(false)) {
		if (!found && !firstUnread) {
			// get first unread folder (before current folder)
			if (folder.getNumUnread(false) && !(folder.flags & unwantedFolders)) {
				firstUnread = folder; // remember the first unread folder before we hit current folder
				util.logDebugOptional("navigation", "first unread folder: " + firstUnread.prettyName);
			}
		}
		if (found) {
			// after current folder: unread folders only
			if (folder.getNumUnread(false) && !(folder.flags & unwantedFolders)) {
				isUnread = true;
				util.logDebugOptional("navigation", "Arrived in next unread after found current: " + folder.prettyName);
				break; // if we have skipped the folder in the iterator and it has unread items we are in the next unread folder
			}
		} 
		if (folder.URI === currentFolder.URI) {
			util.logDebugOptional("navigation", "Arrived in current folder. ");
			found = true; // found current folder
		}
		lastFolder = folder;
	}
	if (!isUnread) {
		if (firstUnread && firstUnread!=currentFolder) {
			util.logDebugOptional("navigation", "no folder found. ");
			return firstUnread;
		}
		util.logDebug("Could not find another unread folder after:" + lastFolder ? lastFolder.URI : currentFolder.URI);
		return currentFolder;
	}
	return folder;
}


QuickFolders.Util.generateMRUlist = function qfu_generateMRUlist(ftv) { 
  // generateMap: function ftv_recent_generateMap(ftv)
  const util = QuickFolders.Util,
	      prefs = QuickFolders.Preferences;
  let oldestTime = 0,
      recent = [],
      items = [],
      MAXRECENT = QuickFolders.Preferences.getIntPref("recentfolders.itemCount");
  function sorter(a, b) {
    return Number(a.getStringProperty("MRUTime")) < Number(b.getStringProperty("MRUTime"));
  }
  
  function addIfRecent(aFolder) {
    let time = 0;
		if (typeof aFolder.getStringProperty != 'undefined') {
			try {
				time = Number(aFolder.getStringProperty("MRUTime")) || 0;
			} catch (ex) {return;}
			if (time <= oldestTime)
				return -time;
			if (recent.length == MAXRECENT) {
				recent.sort(sorter);
				recent.pop();
				let oldestFolder = recent[recent.length - 1];
				oldestTime = Number(oldestFolder.getStringProperty("MRUTime"));
			}
			recent.push(aFolder);
		}
		return time;
  }

  util.logDebugOptional("interface,recentFolders", "generateMRUlist()");
  try {
    /**
     * Sorts our folders by their recent-times.
     */

    /**
     * This function will add a folder to the recentFolders array if it
     * is among the 15 most recent.  If we exceed 15 folders, it will pop
     * the oldest folder, ensuring that we end up with the right number
     *
     * @param aFolder the folder to check
     */

		let debugTxt = prefs.isDebugOption('recentFolders.detail') ? 'Recent Folders List\n' : '';
    for (let folder of ftv._enumerateFolders) {
			let t = addIfRecent(folder);
			if (debugTxt) {
				if (t>0)
					debugTxt += '--- ADDED: ' + folder.prettyName.padEnd(23, " ") + ' - : time = ' + t + ' = ' + util.getMruTime(folder) + '\n';
				else
					debugTxt += 'NOT ADDED: '  + folder.prettyName.padEnd(25, " ") + ' : time = ' + (-t) + ' = ' + util.getMruTime(folder) + '\n';;
			}
		}
		if (debugTxt)
			util.logDebug(debugTxt);
      

    recent.sort(sorter);

    // remove legacy syntax:
		// https://bugzilla.mozilla.org/show_bug.cgi?id=1220564
		//items = [new ftvItem(f) for each (f in recent)];
		for (let f of recent) { 
		  items.push(new ftvItem(f)) 
	  };
		
    // There are no children in this view! flatten via empty array
    for (let folder of items)
      folder.__defineGetter__("children", function() { return [];});

  }
  catch(ex) {
    util.logException('Exception during generateMRUlist: ', ex);
    return null;
  }

  return items;
}

QuickFolders.Util.iterateDictionary = function iterateKeys(dictionary, iterateFunction) {
	for (let [key, value] of dictionary.items) {
		iterateFunction(key,value);
	}
};

QuickFolders.Util.iterateDictionaryObject = function iterateKeysO(dictionary, iterateFunction, obj) {
	for (let [key, value] of dictionary.items) {
		iterateFunction(key,value,obj);
	}
};

QuickFolders.Util.allFoldersMatch = function allFoldersMatch(isFiling, isParentMatch, parentString, maxParentLevel, parents, addMatchingFolder, matches) {
	const util = QuickFolders.Util;
	util.logDebugOptional("interface.findFolder","allFoldersMatch()");
	for (let folder of util.allFoldersIterator(isFiling)) {
		if (!isParentMatch(folder, parentString, maxParentLevel, parents)) continue;
		addMatchingFolder(matches, folder);
	}
};

Object.defineProperty(QuickFolders.Util, "Accounts",
{ get: function() {
    const Ci = Components.interfaces,
		      Cc = Components.classes;
    let util = QuickFolders.Util, 
        aAccounts=[];
    Components.utils.import("resource:///modules/iteratorUtils.jsm");
    let accounts = Cc["@mozilla.org/messenger/account-manager;1"]
                 .getService(Ci.nsIMsgAccountManager).accounts;
    aAccounts = [];
    for (let ac of fixIterator(accounts, Ci.nsIMsgAccount)) {
      aAccounts.push(ac);
    };
    return aAccounts;
  }
});



// refactored from async Task with help of @freaktechnik
// asyunc function should be fine for Tb52.
// Tb68: originally this code was resident in
//       chrome/content/shimECMAnew/quickfolders-shimEcma.js
//       and has dependencies on the existence of the following core modules:
//       Task.jsm  (integrated since Tb67)
//       PromiseUtils.jsm (obsolete?)
// 
QuickFolders.Util.getOrCreateFolder = async function (aUrl, aFlags) {
		const Ci = Components.interfaces,
		      Cc = Components.classes,
					Cr = Components.results,
          util = QuickFolders.Util,
	        prefs = QuickFolders.Preferences,
					isDebug = prefs.isDebugOption('getOrCreateFolder');
    let folder = null;
    function logDebug(text) {
      if (isDebug) 
        util.logDebugOptional('getOrCreateFolder', text);
    }			
		// Thunderbird 68
		var { XPCOMUtils } = ChromeUtils.import("resource://gre/modules/XPCOMUtils.jsm");
    
		logDebug('getOrCreateFolder (' + aUrl + ', ' + aFlags + ')');
    
    let fls = Cc["@mozilla.org/mail/folder-lookup;1"].getService(
      Ci.nsIFolderLookupService
    );
    if (fls)
      folder = fls.getOrCreateFolderForURL(aUrl); 
    else {
      // old method, relying on Ci.nsIRDFService
      // let rdf = Cc["@mozilla.org/rdf/rdf-service;1"].getService(Ci.nsIRDFService);
      // folder = rdf.GetResource(aUrl).QueryInterface(Ci.nsIMsgFolder);
      folder = null;
    }

		logDebug('folder = ' + folder);		
    // Now try to ask the server if it has the folder. This will force folder
    // discovery, so if the folder exists, its properties will be properly
    // fleshed out if it didn't exist. This also catches folders on servers
    // that don't exist.
    try {
      folder = folder.server.getMsgFolderFromURI(folder, aUrl);
    } catch (e) {
			util.logException('getMsgFolderFromURI ', ex);		
      throw Cr.NS_ERROR_INVALID_ARG;
    }

    // We explicitly do not want to permit root folders here. The purpose of
    // ensuring creation in this manner is to be able to query or manipulate
    // messages in the folder, and root folders don't have that property.
    if (folder.rootFolder == folder) {
			logDebug('root folder, not allowed');		
      throw Cr.NS_ERROR_INVALID_ARG;
		}

    // Now set the folder flags if we need to.
    if (aFlags)
      folder.setFlag(aFlags);

    // If we are not a valid folder, we need to create the storage to validate
    // the existence of the folder. Unfortunately, the creation code is
    // sometimes synchronous and sometimes asynchronous, so handle that.
    if (folder.parent == null) {
      // Async folder creation is assumed to always succeed even if it exists.
      // Presumably, the same could apply for local message folders.
      let isAsync = folder.server.protocolInfo.foldersCreatedAsync,
          needToCreate = isAsync || !folder.filePath.exists();
					
			logDebug('no folder parent. needToCreate = ' + needToCreate + ' async = ' + isAsync);		
			
			
      if (needToCreate) {
				const GP = 
				  ChromeUtils.generateQI ? ChromeUtils : XPCOMUtils;
        const deferred = new Promise((resolve, reject) => {
          const listener = {
            OnStartRunningUrl(url) {},
            OnStopRunningUrl(url, aExitCode) {
              if (aExitCode == Cr.NS_OK)
                resolve();
              else
                reject(aExitCode);
            },
            QueryInterface:  // Tb 68 XPCOMUtils.generateQI doesn't exist anymore
						  GP.generateQI([Ci.nsIUrlListener])
							
          };
   
          // If any error happens, it will throw--causing the outer promise to
          // reject.
          logDebug('folder.createStorageIfMissing()...'); 
          folder.createStorageIfMissing(isAsync ? listener : null);
          if (!isAsync || !needToCreate)
            resolve();
        });
        await deferred;
			
				
/*				
      if (needToCreate) {
        let deferred = PromiseUtils.defer();
        let listener = {
          OnStartRunningUrl(url) {},
          OnStopRunningUrl(url, aExitCode) {
            if (aExitCode == Cr.NS_OK)
              deferred.resolve();
            else
              deferred.reject(aExitCode);
          },
          QueryInterface: XPCOMUtils.generateQI([Ci.nsIUrlListener])
        };

        // If any error happens, it will throw--causing the outer promise to
        // reject.
				logDebug('folder.createStorageIfMissing()...');		
        folder.createStorageIfMissing(isAsync ? listener : null);
        if (!isAsync || !needToCreate)
          deferred.resolve();
        yield deferred.promise;
      }
*/
			
			
      }
/*
      if (needToCreate && (folder.parent == null || folder.rootFolder == folder)) {
        logDebug('unexpected: no folder.parent or folder is its own root');		
        throw Cr.NS_ERROR_UNEXPECTED;
      }
      */
    }

    // Finally, we have a valid folder. Return it.
    return folder;
  };

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
