/* BEGIN LICENSE BLOCK

	QuickFolders is released under the Creative Commons (CC BY-ND 4.0)
	Attribution-NoDerivatives 4.0 International (CC BY-ND 4.0) 
	For details, please refer to license.txt in the root folder of this extension

  END LICENSE BLOCK */

// adding getter for main instance as a property

Object.defineProperty(QuickFolders, "MainQuickFolders", 
{ get : function QF_getMainInstance() {
	if (QuickFolders.ComposerMainInstance) return QuickFolders.ComposerMainInstance;
	let mail3PaneWindow = Services.wm.getMostRecentWindow("mail:3pane"),
			QF = mail3PaneWindow.QuickFolders;
	QuickFolders.ComposerMainInstance = QF;
	return mail3PaneWindow.QuickFolders;
} } );


	// -------------------------------------------------------------------
	// A handler to change headers in composer
	// -------------------------------------------------------------------
QuickFolders.notifyComposeBodyReady = function(evt) {
	const Ci = Components.interfaces,
	      dbg = 'QuickFolders.notifyComposeBodyReady()',
	      util = QuickFolders.MainQuickFolders.Util,
				preferences = QuickFolders.MainQuickFolders.Preferences;
	util.logDebug(dbg);
	// let editor = GetCurrentEditor().QueryInterface(Ci.nsIEditor);
			
	function modifyHeader(hdr, cmd, argument) {
		const whiteList = ["subject","to","from","cc","bcc","reply-to"],
					ComposeFields = gMsgCompose.compFields;
		let targetString = '',
				modType = ''; 
		try {
			util.logDebug("modifyHeader(" + hdr +", " + cmd + ", " + argument + ")");
			if (!whiteList.includes(hdr)) {
				util.logToConsole("Invalid header - no permission to modify: " + hdr);
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
							// not valid!
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
				CompFields2Recipients(ComposeFields); 
      }
		}
		catch(ex) {
			util.logException('modifyHeader()', ex);
		}
		return ''; // consume
	}
					
	function setMailHeaders(folder, options, isOrigin) {
		const ADVANCED_FLAGS = util.ADVANCED_FLAGS,
          msgComposeType = Ci.nsIMsgCompType;
		var {MailServices} = ChromeUtils.import("resource:///modules/MailServices.jsm");
		
		if (!folder.URI) return;
		if (preferences.isDebugOption('composer')) debugger;
    
		let entry = QuickFolders.MainQuickFolders.Model.getFolderEntry(folder.URI);
    try {
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
            // [issue 92] - do not apply when replying!
            if (gMsgCompose.type == msgComposeType.Reply
             || gMsgCompose.type == msgComposeType.ReplyAll
             || gMsgCompose.type == msgComposeType.ReplyToSender
             || gMsgCompose.type == msgComposeType.ReplyToGroup
             || gMsgCompose.type == msgComposeType.ReplyToSenderAndGroup
             || gMsgCompose.type == msgComposeType.ReplyToList)
              util.logDebugOptional('composer', "not overwriting to address: this is a reply case");
            else {
              if (gMsgCompose.type == msgComposeType.New && gMsgCompose.compFields.to) {
                // [issue 110] "Tab-specific Properties" overwrites To Address when selecting to from AB
                util.logDebugOptional('composer', "New mail: not overwriting to address - " + gMsgCompose.compFields.to + "\n"
                  + "this was probably set by clicking Write from AB.");
              }
              else {
                options.toAddress = entry.toAddress;
                let dbg = txt.replace('{1}', entry.toAddress);
                util.logDebugOptional('composer', dbg.replace('{2}',"toAddress"));
              }
            }
          }
          if (entry.fromIdentity && !options.identity) {
            let dbg = txt.replace('{1}', entry.fromIdentity);
            let actMgr = MailServices.accounts,
                allIdentities = actMgr.allIdentities;
            for (let i=0; i<allIdentities.length; i++) {
              let identity = allIdentities[i].QueryInterface(Ci.nsIMsgIdentity); 
              if (identity.key == entry.fromIdentity) {
                util.logDebugOptional('composer', dbg.replace('{2}',"identity") + "\n" + (identity.identityName || identity.email ));
                options.identity = identity; // use the object, not the string [entry.fromIdentity is only a string]
                break;
              }
            }		
          }
        }
      }      
    }
    catch (ex) {
      util.logException("setMailHeaders()", ex);
    }
    
		// no need to recurse if both are set (child folders override parents)
		if (folder.parent && (!options.toAddress || !options.identity))
			setMailHeaders(folder.parent, options, false);
	}
	
	// check for advanced properties (rules) for overriding To: or Identity (From:)
	try {
		let currentFolder = util.CurrentFolder,
				options = {
				  identity: null,
					toAddress: ''
				};
		if (preferences.isDebugOption('composer')) debugger;
		
		// we need to check all parent folders for entries as well.
		if (currentFolder && currentFolder.URI) {
			setMailHeaders(currentFolder, options, true);
		}
		else {
			return;
		}
		
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
        // instead of sending the compose-from-changed event to msgcomposeWindow,
        // we will trigger the command that is also bound to the dropdown.
        LoadIdentity(false);
			}
		}

		
		
	}
	catch(ex) {
		util.logException("notifyComposeBodyReady", ex);
	}
};


// replace notifyComposeBodyReady with startup function (like in SmartTemplates)
QuickFolders.composer = {
	startup: async () => {
		const util = QuickFolders.Util,
		      logOptions = {color:"yellow", background:"rgb(0,0,130)"};
		util.logHighlight("quickfolders-composer.js - startup",logOptions);
		
		// block running code until editor is ready:
		await new Promise(resolve => {
			if (window.composeEditorReady) {
				resolve();
				return;
			}
			window.addEventListener("compose-editor-ready", resolve, {
				once: true,
			});
		});  
		QuickFolders.notifyComposeBodyReady();
		util.logHighlight("quickfolders-composer.js - end",logOptions, "(after QuickFolders.notifyComposeBodyReady())");

	}
};
