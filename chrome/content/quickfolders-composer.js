/* BEGIN LICENSE BLOCK

	QuickFolders is released under the Creative Commons (CC BY-ND 4.0)
	Attribution-NoDerivatives 4.0 International (CC BY-ND 4.0) 
	For details, please refer to license.txt in the root folder of this extension

  END LICENSE BLOCK */

// adding getter for main instance as a property
Object.defineProperty(QuickFolders, "MainQuickFolders", 
{ get : function QF_getMainInstance() {
	if (QuickFolders.ComposerMainInstance) return QuickFolders.ComposerMainInstance;
	let mail3PaneWindow = Components.classes["@mozilla.org/appshell/window-mediator;1"]
			.getService(Components.interfaces.nsIWindowMediator)
			.getMostRecentWindow("mail:3pane"),
			QF = mail3PaneWindow.QuickFolders;
	QuickFolders.ComposerMainInstance = QF;
	return mail3PaneWindow.QuickFolders;
} } );


	// -------------------------------------------------------------------
	// A handler to add template message
	// -------------------------------------------------------------------
QuickFolders.notifyComposeBodyReady = function QF_notifyComposeBodyReady(evt) {
	const Ci = Components.interfaces,
	      dbg = 'QuickFolders.notifyComposeBodyReady()',
	      util = QuickFolders.MainQuickFolders.Util,
				preferences = QuickFolders.MainQuickFolders.Preferences;
	util.logDebug(dbg);
	// Add template message
	/* if (evt && evt.type && evt.type =="stationery-template-loaded") {;} */
	// guard against this being called multiple times from stationery
	// avoid this being called multiple times
	let editor = GetCurrentEditor().QueryInterface(Ci.nsIEditor),		
	    root = editor.rootElement;
			
	function modifyHeader(hdr, cmd, argument) {
		const whiteList = ["subject","to","from","cc","bcc","reply-to"],
					ComposeFields = gMsgCompose.compFields;
		let targetString = '',
				modType = ''; 
		try {
			util.logDebug("modifyHeader(" + hdr +", " + cmd + ", " + argument + ")");
			if (!whiteList.includes(hdr)) {
				util.logToConsole("invalid header - no permission to modify: " + hdr);
				return '';
			}
			// get
			modType = 'address';
			switch (hdr) {
				case 'subject':
					targetString = ComposeFields.subject;
					modType = 'string';
					break;
				case 'to':
					targetString = ComposeFields.to;
					break;
				case 'cc':
					targetString = ComposeFields.cc;
					break;
				case 'bcc':
					targetString = ComposeFields.bcc;
					break;
				case 'from':
					targetString = ComposeFields.from;
					break;
				case 'reply-to':
					targetString = ComposeFields.replyTo;
					break;
				default:
					modType = '';
					break;
			}
			// modify
			switch (modType) {
				case 'string': // single string
					switch (cmd) {
						case 'set':
							targetString = argument; 
							break;
						case 'prefix':
							let replyPrefix = targetString.lastIndexOf(':'),
									testSubject = targetString;
							if (replyPrefix>0) { // caveat: won't work well if subject also contains a ':'
								// cut off Re: Fwd: etc.
								testSubject = targetString.substr(0, replyPrefix).trim();
								if (testSubject.indexOf(argument)>=0) break; // keyword is (anywhere) before colon?
								// cut off string after last prefix to restore original subject
								testSubject = targetString.substr(replyPrefix+1).trim(); // where we can check at the start...
							}
							// keyword is immediately after last colon, or start of original subject
							if (testSubject.indexOf(argument)!=0)  { // avoid duplication!
								targetString = argument + targetString; 
							}
							break;
						case 'append':
							// problem - if there are encoding breaks, will this comparison fail?
							let argPos = targetString.toLowerCase().trim().lastIndexOf(argument.toLowerCase().trim()); // avoid duplication
							if (argPos < 0 || argPos < targetString.length-argument.length ) 
								targetString = targetString + argument; 
							break;
					}
					break;
				case 'address': // address field
					switch (cmd) {
						case 'set': // overwrite address field
							targetString = argument.toString(); 
							break;
						case 'prefix':
							// targetString = argument.toString() + ' ' + targetString; 
							// invalid!
							break;
						case 'append': // append an address field (if not contained already)
													 // also omit in Cc if already in To and vice versa
							if (hdr=='cc' && ComposeFields.to.toLowerCase().indexOf(argument.toLowerCase())>=0)
								break;
							if (hdr=='to' && ComposeFields.cc.toLowerCase().indexOf(argument.toLowerCase())>=0)
								break;
							
							if (targetString.toLowerCase().indexOf(argument.toLowerCase())<0) {
								targetString = targetString + ', ' + argument; 
							}
							break;
					}
					break;
			}
			
			// set
			// https://developer.mozilla.org/en-US/docs/Mozilla/Tech/XPCOM/Reference/Interface/NsIMsgCompFields
			switch (hdr) {
				case 'subject':
					document.getElementById("msgSubject").value = targetString;
					ComposeFields.subject = targetString;
					break;
				case 'to':
					ComposeFields.to = targetString;
					break;
				case 'cc':
					ComposeFields.cc = targetString;
					break;
				case 'bcc':
					ComposeFields.bcc = targetString;
					break;
				case 'from':
				  // ComposeFields.setAddressingHeader("From", [{name:'John Doe', email:'joe.doe@ttt.com'}], 1)
					ComposeFields.from = targetString;
					break;
				case 'reply-to':
					ComposeFields.replyTo = targetString;
					break;
			}
			// try to update headers - ComposeFieldsReady()
			// http://mxr.mozilla.org/comm-central/source/mail/components/compose/content/MsgComposeCommands.js#3971
			if (modType == 'address') {
        // we need to prep the addressing widget to avoid inserting an empty line on top
        // rebuild all addresses - for this we need to remove all [dummy] rows
        // except for the very first one.
        let listbox = document.getElementById("addressingWidget");
        while (listbox.itemCount>1) { // remove everything apart from first item:
          listbox.getItemAtIndex(listbox.itemCount-1).remove();
        }
				CompFields2Recipients(ComposeFields);
      }
		}
		catch(ex) {
			util.logException('modifyHeader()', ex);
		}
		return ''; // consume
	}
					
	function setMailHeaders(folder, options, isOrigin) {
		const ADVANCED_FLAGS = util.ADVANCED_FLAGS;
		
		var {MailServices} = 
		  (util.versionGreaterOrEqual(util.ApplicationVersion, "64")) ?
				ChromeUtils.import("resource:///modules/MailServices.jsm") : // new module spelling
				Components.utils.import("resource:///modules/mailServices.js", {});
		
		if (!folder.URI) return;
		if (preferences.isDebugOption('composer')) debugger;		
		let entry = QuickFolders.MainQuickFolders.Model.getFolderEntry(folder.URI);
		
		if (entry) {
			let entryName = entry.name,
			    entryFlags = entry.flags || 0,
			    txt = 'Overriding {2} from QuickFolder [{0}] with {1}'.replace('{0}', entryName);
					
			if (!isOrigin && !(entryFlags & ADVANCED_FLAGS.EMAIL_RECURSIVE)) {
				// parent folder - do nothing - recursive flag is not engaged
			}
			else {
				// already explicitely set child folder settings are not overwritten by parents!
				if (entry.toAddress && !options.toAddress) {
					options.toAddress = entry.toAddress;
					let dbg = txt.replace('{1}', entry.toAddress);
					util.logDebugOptional('composer', dbg.replace('{2}',"toAddress"));
				}
				if (entry.fromIdentity && !options.identity) {
					let dbg = txt.replace('{1}', entry.fromIdentity);
					let actMgr = MailServices.accounts,
							allIdentities = actMgr.allIdentities;
					for (let i=0; i<allIdentities.length; i++) {
						let identity = allIdentities.queryElementAt(i, Ci.nsIMsgIdentity);
						if (identity.key == entry.fromIdentity) {
							util.logDebugOptional('composer', dbg.replace('{2}',"identity") + "\n" + (identity.identityName || identity.email ));
							options.identity = identity; // use the object, not the string [entry.fromIdentity is only a string]
							break;
						}
					}		
				}
			}
		}
		
		// no need to recurse if both are set (child folders override parents)
		if (folder.parent && (!options.toAddress || !options.identity))
			setMailHeaders(folder.parent, options, false);
	}
	
	// check for advanced properties (rules) for overriding To: or Identity (From:)
	try {
		let currentFolder = util.CurrentFolder,
		    entry,
				options = {
				  identity: null,
					toAddress: ''
				};
		if (preferences.isDebugOption('composer')) debugger;
		
		// we need to check all parent folders for entries as well.
		if (currentFolder && currentFolder.URI)
			setMailHeaders(currentFolder, options, true);
		else 
			return;
		
		if (options.toAddress)
			modifyHeader('to', 'set', options.toAddress);
		if (options.identity) {
			let identity = options.identity,
			    address = identity.fullName + " <" + identity.email +">";
			// modifyHeader('from', 'set', address);
			if (gMsgCompose.identity.key != identity.key) {
				gMsgCompose.identity = identity;
				// from MsgComposeCommands.js#4203
				var identityList = document.getElementById("msgIdentity");
				identityList.selectedItem =
					identityList.getElementsByAttribute("identitykey", identity.key)[0];
				let event = document.createEvent('Events');
				event.initEvent('compose-from-changed', false, true);
				document.getElementById("msgcomposeWindow").dispatchEvent(event);
			}
		}

		
		
	}
	catch(ex) {
		util.logException("notifyComposeBodyReady", ex);
	}
};


QuickFolders.stateListener = {
	NotifyComposeFieldsReady: function() {
		QuickFolders.MainQuickFolders.Util.logDebugOptional('composer', 'NotifyComposeFieldsReady');
	},
	NotifyComposeBodyReady: function() {
		QuickFolders.MainQuickFolders.Util.logDebugOptional('composer', 'NotifyComposeBodyReady');
		QuickFolders.notifyComposeBodyReady();
	},
	ComposeProcessDone: function(aResult) {
		QuickFolders.MainQuickFolders.Util.logDebugOptional('composer', 'ComposeProcessDone');
	},
	SaveInFolderDone: function(folderURI) {
		QuickFolders.MainQuickFolders.Util.logDebugOptional('composer', 'SaveInFolderDone');
	}
};

QuickFolders.initComposeListener = function QF_initListener() {
	let util = QuickFolders.MainQuickFolders.Util,
			log = util.logDebugOptional.bind(util),
			notifyComposeBodyReady = QuickFolders.notifyComposeBodyReady.bind(QuickFolders);
	log('composer', 'Registering State Listener...');
	try {
		gMsgCompose.RegisterStateListener(QuickFolders.stateListener);
	}
	catch (ex) {
		util.logException("Could not register status listener", ex);
	}
};

window.setTimeout ( function() {
  let util = QuickFolders.MainQuickFolders.Util,
      logDebugOptional = util.logDebugOptional.bind(util);
	// QuickFolders.init();
	// the starting point of this listener is triggered by composers
  logDebugOptional('composer', "Adding initComposeListener for msgcomposeWindow...");
  let composer = document.getElementById("msgcomposeWindow");
  composer.addEventListener("compose-window-init", QuickFolders.initComposeListener, false);
},10 );
