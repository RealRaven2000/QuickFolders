
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
			if (whiteList.indexOf(hdr)<0) {
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
					ComposeFields.from = targetString;
					break;
				case 'reply-to':
					ComposeFields.replyTo = targetString;
					break;
			}
			// try to update headers - ComposeFieldsReady()
			// http://mxr.mozilla.org/comm-central/source/mail/components/compose/content/MsgComposeCommands.js#3971
			if (modType == 'address')
				CompFields2Recipients(ComposeFields);
		}
		catch(ex) {
			util.logException('modifyHeader()', ex);
		}
		return ''; // consume
	}
			
	try {
		let currentFolder = util.CurrentFolder,
		    entry;
		if (currentFolder && currentFolder.URI)
			entry = QuickFolders.MainQuickFolders.Model.getFolderEntry(currentFolder.URI)
		else 
			return;
		
		if (!entry) return; // no changes
		
		if (entry.toAddress)
			modifyHeader('to', 'set', entry.toAddress);
		if (entry.fromIdentity) {
		  let actMgr = MailServices.accounts,
			    allIdentities = actMgr.allIdentities;
			for (let i=0; i<allIdentities.length; i++) {
				let identity = allIdentities.queryElementAt(i, Ci.nsIMsgIdentity);
				if (identity.identityName == entry.fromIdentity) {
					modifyHeader('from', 'set', identity.email);
					break;
				}
			}		
		}
	}
	catch(ex) {
		util.logException("notifyComposeBodyReady", ex);
	}
};


QuickFolders.stateListener = {
	NotifyComposeFieldsReady: function() {},
	NotifyComposeBodyReady: function() {
		QuickFolders.notifyComposeBodyReady();
	},
	ComposeProcessDone: function(aResult) {},
	SaveInFolderDone: function(folderURI) {}
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
