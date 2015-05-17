"use strict";

/* BEGIN LICENSE BLOCK

QuickFolders is released under the Creative Commons (CC BY-ND 4.0)
Attribution-NoDerivatives 4.0 International (CC BY-ND 4.0) 
For details, please refer to license.txt in the root folder of this extension

END LICENSE BLOCK */


QuickFolders.FilterWorker = {

  bundle: null,
	FilterMode: false,
	reRunCount: 0,  // avoid endless loop
	TemplateSelected: null,
	SelectedValue: '',
	
	// FILTER WIZARD FUNCTIONS ...
	showMessage: function showMessage(show) {
		QuickFolders.Preferences.setBoolPref("filters.showMessage", show);
	} ,
	
  /** 
	* toggles the filter mode so that dragging emails will
	* open the filter wizard
	* 
	* @param {bool} start or stop filter mode
	*/  
	toggle_FilterMode: function toggle_FilterMode(active) {
    function removeOldNotification(box, active, id) {
      if (!active && box) {
        let item = box.getNotificationWithValue(id);
        if(item)
          box.removeNotification(item, (util.Application == 'Postbox'));
      }   
    }
    let util = QuickFolders.Util,
        QI = QuickFolders.Interface,
        prefs = QuickFolders.Preferences,
		    notificationId,
        notifyBox;
        
		util.logDebugOptional ("filters", "toggle_FilterMode(" + active + ")");
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
		let notificationKey = "quickfolders-filter";

		if (notificationId) {
			notifyBox = document.getElementById (notificationId);
			let item=notifyBox.getNotificationWithValue(notificationKey)
			if(item)
				notifyBox.removeNotification(item, (util.Application == 'Postbox')); // second parameter in Postbox(not documented): skipAnimation
		}
		
		if (active 
			&& 
			!QuickFolders.FilterWorker.FilterMode 
			&&
			prefs.getBoolPref("filters.showMessage")) 
		{
			
			let title = util.getBundleString("qf.filters.toggleMessage.title",
                  "Creating Filters"),
			    theText = util.getBundleString("qf.filters.toggleMessage.notificationText",
            "Filter Learning mode started. Whenever you move an email into QuickFolders a 'Create Filter Rule' Wizard will start. Thunderbird uses message filters for automatically moving emails based on rules such as 'who is the sender?', 'is a certain keyword in the subject line?'."
            +" To end the filter learning mode, press the filter button on the top left of QuickFolders bar."),
			    dontShow = util.getBundleString("qf.notification.dontShowAgain", "Do not show this message again.");

			
			if (notifyBox) {
				// button for disabling this notification in the future
					let nbox_buttons;
					// the close button in Postbox is broken: skipAnimation defaults to false and 
					// creates a invisible label with margin = (-height) pixeles, covering toolbars above
					// therefore we implement our own close button in Postbox!!
					if (util.Application == 'Postbox') {
						nbox_buttons = [
							{
								label: dontShow,
								accessKey: null,
								callback: function() { QuickFolders.FilterWorker.showMessage(false); },
								popup: null
							},
							{
								label: 'X',
								accessKey: 'x',
								callback: function() { util.onCloseNotification(null, notifyBox, notificationKey); },
								popup: null
							}
						];
					}
					else {
						nbox_buttons = [
							{
								label: dontShow,
								accessKey: null,
								callback: function() { QuickFolders.FilterWorker.showMessage(false); },
								popup: null
							}
						];
					}
					
				
			
				notifyBox.appendNotification( theText, 
						notificationKey , 
						"chrome://quickfolders/skin/ico/filterTemplate.png" , 
						notifyBox.PRIORITY_INFO_LOW, 
              nbox_buttons,
							function(eventType) { util.onCloseNotification(eventType, notifyBox, notificationKey); } // eventCallback
							); 
						
				if (util.Application == 'Postbox') {
					util.fixLineWrap(notifyBox, notificationKey);
				}						
						
			}
			else {
				// fallback for systems that do not support notification (currently: SeaMonkey)
				let prompts = Components.classes["@mozilla.org/embedcomp/prompt-service;1"]  
				                        .getService(Components.interfaces.nsIPromptService);  
				  
				let check = {value: false};   // default the checkbox to true  
				  
				let result = prompts.alertCheck(null, title, theText, dontShow, check);
				if (check.value==true)
					QuickFolders.FilterWorker.showMessage(false);
			}
		}

		QuickFolders.FilterWorker.FilterMode = active;
		
    /* Configure Optional buttons on Toolbar */
		if (QI.CogWheelPopupButton)
			QI.CogWheelPopupButton.collapsed = active || !prefs.isShowToolIcon;
    if (QI.ReadingListButton)
      QI.ReadingListButton.collapsed = !prefs.isShowReadingList;
		if (QI.FilterToggleButton)
			QI.FilterToggleButton.collapsed = !active;
		if (QI.CategoryBox)
			QI.CategoryBox.setAttribute('mode', active ? 'filter' : '');
		let btnFilterToggle = QI.CurrentFolderFilterToggleButton;
		if (btnFilterToggle)
			btnFilterToggle.setAttribute('mode', active ? 'filter' : '');
      
			
		// tidy up notifications
		if (!active && notifyBox) {
			let item = notifyBox.getNotificationWithValue(notificationKey);
			if(item)
				notifyBox.removeNotification(item, true);
		}
			
		// sync with quickFilters
		if (typeof window.quickFilters != 'undefined') {
			if (active != window.quickFilters.Worker.FilterMode) {
				window.quickFilters.Worker.toggleFilterMode(active);
				if (!active && notifyBox) {
					let item = notifyBox.getNotificationWithValue("quickFilters-filter");
					if(item)
						notifyBox.removeNotification(item, true);
				}
			}
		}
	},
	
  openFilterList: function openFilterList(isRefresh, sourceFolder) {
    try {
			let mediator = Components.classes["@mozilla.org/appshell/window-mediator;1"].getService(Components.interfaces.nsIWindowMediator);
			let w = mediator.getMostRecentWindow('mailnews:filterlist');
	    
	    // [Bug 25203] "Error when adding a filter if Message Filters window is already open"
	    // Thunderbird bug - if the filter list is already open and refresh is true
	    // it throws "desiredWindow.refresh is not a function"
	    if (!w) {
		    let args = { refresh: isRefresh, folder: sourceFolder };
		    MsgFilterList(args);
    	}
    	else {
	    	// we must make sure server and sourceFolder are selected!!
	    	let runFolder = w.document.getElementById('runFiltersFolder');
	    	let serverMenu = w.document.getElementById('serverMenu');
	    	let filterList = w.document.getElementById('filterList');
	    	
    	}
    }
    catch (ex) {
      ;
    }
  } ,

	getSourceFolder: function getSourceFolder(msg) {
    let accountCount = 0,
        aAccounts,
        sourceFolder = null,
        Cc = Components.classes,
        Ci = Components.interfaces,
        util = QuickFolders.Util,
        accounts = Cc["@mozilla.org/messenger/account-manager;1"].getService(Ci.nsIMsgAccountManager).accounts;

    for (let ab in fixIterator(accounts, Ci.nsIMsgAccount)) { 
      if (ab.defaultIdentity)
        accountCount++; 
    }
    
    if (util.Application == 'Postbox') 
      aAccounts = util.getAccountsPostbox();
    else {
      aAccounts = [];
      for (let ac in fixIterator(accounts, Ci.nsIMsgAccount)) {
        aAccounts.push(ac);
      };
    }

    // Get inbox from original account key - or use the only account if a SINGLE one exists
    // (Should we count LocalFolders? typically no filtering on that inbox occurs?)
    //    we could also add an account picker GUI here for Postbox,
    //    or parse From/To/Bcc for account email addresses
    if (msg.accountKey || accountCount==1) {
      util.logDebugOptional('filters', "sourceFolder: get Inbox from account of first message, key:" + msg.accountKey);
      for each (let ac in aAccounts) {
        // Postbox quickFix: we do not need a match if only 1 account exists :-p
        if ((ac.key == msg.accountKey) || (accountCount==1 && ac.defaultIdentity)) {
          // account.identities is an nsISupportsArray of nsIMsgIdentity objects
          // account.defaultIdentity is an nsIMsgIdentity
          if (msg.accountKey)
            util.logDebugOptional('filters', "Found account with matching key: " + ac.key);
          // account.incomingServer is an nsIMsgIncomingServer
          if (ac.incomingServer && ac.incomingServer.canHaveFilters) {
            // ac.defaultIdentity
            sourceFolder = ac.incomingServer.rootFolder;
            util.logDebugOptional('filters', "rootfolder: " + sourceFolder.prettyName || '(empty)');
          }
          else {
            util.logDebugOptional('filters', "Account - No incoming Server or cannot have filters!");
            let wrn = 'Account [{1}] of mail origin cannot have filters!\nUsing current Inbox instead.';
            util.popupAlert(wrn.replace('{1}', ac.key));
          }
          break;
        }
      }                       
    }
    return sourceFolder; 
  } ,
	
  // folder is the target folder - we might also need the source folder
	createFilter: function createFilter(sourceFolder, targetFolder, messageList, isCopy) {
		let Ci = Components.interfaces,
        msg,
        util = QuickFolders.Util;
		function getMailKeyword(subject) {
			let topicFilter = subject,
			    left,right;
			if ( (left=subject.indexOf('[')) < (right=subject.indexOf(']')) ) {
				topicFilter = subject.substr(left, right-left+1);
			}
			else if ( (left=subject.indexOf('{')) < (right=subject.indexOf('}')) ) {
				topicFilter = subject.substr(left, right-left+1);
			}
			return topicFilter;
		}
		
		function createTerm(filter, attrib, op, val) {
			let searchTerm = filter.createTerm(),
			    value = searchTerm.value; // Ci.nsIMsgSearchValue
			searchTerm.attrib = attrib;
			searchTerm.op = op;
			searchTerm.booleanAnd = false;
			value.attrib = searchTerm.attrib;
			value.str = val;
			searchTerm.value = value;
			return searchTerm;
		}
		
    
		// do an async repeat if it fails for the first time
		function rerun() {
			QuickFolders.FilterWorker.reRunCount++;
			if (QuickFolders.FilterWorker.reRunCount > 5) {
				util.alert("Tried to create a filter " + (QuickFolders.FilterWorker.reRunCount+1) + " times, but it didn't work out.\n"
					+"Try to move a different message. Otherwise, updating " + util.Application + " to a newer version might help",
          "QuickFolders");
				QuickFolders.FilterWorker.reRunCount=0;
				return 0;
			}
			window.setTimeout(function() {
						let filtered = QuickFolders.FilterWorker.createFilter(sourceFolder, targetFolder, messageList, isCopy);
            util.logDebug('createFilter returned: ' + filtered);
					}, 400);
			return 0;
		}
		
		if (!messageList || !targetFolder || !messageList.length)
			return null;
    
    /* retrieve (first) message detail */
    util.logDebugOptional ("filters","messageList.length = " + messageList.length);
    let messageId = messageList[0],
        messageDb = targetFolder.msgDatabase ? targetFolder.msgDatabase : null,
        messageHeader;
    // for the moment, let's only process the first element of the message Id List;
    if (messageDb) {
      messageHeader = messageDb.getMsgHdrForMessageID(messageId);
    }
    else { // Postbox ??
      // let globalIndex = Cc['@mozilla.org/msg-global-index;1'].getService(QuickFolders_CI.nsIMsgGlobalIndex);
      try {
        // see nsMsgFilleTextIndexer
        messageDb = targetFolder.getMsgDatabase(null); //GetMsgFolderFromUri(currentFolderURI, false)
        messageHeader = messageDb.getMsgHdrForMessageID(messageId);
      }
      catch(e) {
        util.alert("cannot access database for folder "+ targetFolder.prettyName + "\n" + e);
        return null;
      }
    }

    if (!messageHeader) 
      return rerun();
    msg = messageHeader.QueryInterface(Components.interfaces.nsIMsgDBHdr);
    if (!msg) 
      return rerun();
    
    
    if (!sourceFolder) {
      // find out whether all mails come from the same sourceFolder, otherwise we need to fail this step!
      sourceFolder = this.getSourceFolder(msg);
      if (!sourceFolder) {
        util.alert("No Filter can be created - I could not determine an originating folder for message:\n" + 
                   msg.mime2DecodedSubject + "\n");
        return false;
      }
    }
		
		if (!sourceFolder.server.canHaveFilters) {
      if (sourceFolder.server) {
      	let serverName = sourceFolder.server.name ? sourceFolder.server.name : "unknown";
			util.slideAlert("QuickFolders", "This account (" + serverName + ") cannot have filters");
      }
      else {
        if (sourceFolder.prettyName) {
          util.slideAlert("QuickFolders", "Folder (" + sourceFolder.prettyName + ") does not have a server.");
        }
      }
			return false;
		}

		if (!QuickFolders.FilterWorker.FilterMode)
			return -2;
    /************* MESSAGE PROCESSING  ********/
		try {
			if (msg) {
				let key = msg.messageKey,
				    threadParent = msg.threadParent,
				    thread = msg.thread,
            // some of the fields are not filled, so we need to go to the db to get them
            //let msgHdr = targetFolder.msgDatabase.GetMsgHdrForKey(key); // .QueryInterface(Ci.nsIMsgDBHdr);
				    folderName = targetFolder.prettyName,
            filterName = folderName,
            emailAddress, ccAddress, bccAddress;
				
				util.logDebugOptional ("filters","got msg; key=" + key);

				let headerParser = Components.classes["@mozilla.org/messenger/headerparser;1"].getService(Components.interfaces.nsIMsgHeaderParser);
				if (headerParser) {
					util.logDebugOptional ("filters","parsing msg header...");
					if (headerParser.extractHeaderAddressMailboxes) { // Tb 2 can't ?
						if (util.Application=='Postbox') {
							// guessing guessing guessing ...
							// somehow this takes the C++ signature?
							emailAddress = headerParser.extractHeaderAddressMailboxes(null, msg.author); 
							ccAddress  =  headerParser.extractHeaderAddressMailboxes(null, msg.ccList)
							bccAddress  =  headerParser.extractHeaderAddressMailboxes(null, msg.bccList)
						}
						else {
							// Tb + SM
							emailAddress = headerParser.extractHeaderAddressMailboxes(msg.author);
							ccAddress  =  headerParser.extractHeaderAddressMailboxes(msg.ccList);
							bccAddress  =  headerParser.extractHeaderAddressMailboxes(msg.bccList);
						}
					}
					else { //exception for early versions of Tb - hence no l10n
						util.alert("Sorry, but in this version of " + util.Application + ", we cannot do filters as it does not support extracting addresses from the message header!\n"
						    + "Consider updating to a newer version to get this feature.");
						util.logDebugOptional ("filters","no header parser :(\nAborting Filter Operation");
						return false;
					}
					util.logDebugOptional ("filters","msg header parsed...");
				}
				else { // exception
					util.alert("Sorry, but in this version of " + util.Application + ", we cannot do filters as it does not support parsing message headers!\n"
					    + "Consider updating to a newer version to get this feature.");
					util.logDebugOptional ("filters","no header parser :(\nAborting Filter Operation");
					return false;
				}

				try {
				util.logDebugOptional ("filters",
						"createFilter(target folder="+ targetFolder.prettyName
							+ ", messageId=" + msg.messageId
							+ ", author=" + msg.mime2DecodedAuthor + "\n"
							+ ", subject=" + msg.mime2DecodedSubject + "\n"
							+ ", recipients=" + msg.mime2DecodedRecipients + "\n"
							+ ", copy=" + isCopy + "\n"
							+ ", cc=" + (ccAddress || '') + "\n"
							+ ", bcc=" + (bccAddress || '') + "\n"
							+ ", source folder =" + sourceFolder 
							+ ", parsed email address=" + emailAddress);
				} catch(ex) {;} 
							
				let previewText = msg.getStringProperty('preview');
				util.logDebugOptional ("filters", "previewText="+ previewText );


				let args;
				if (emailAddress) {
					let retVals = { answer: null },
					    win = window.openDialog('chrome://quickfolders/content/filterTemplate.xul',
						'quickfolders-filterTemplate',
						'chrome,titlebar,centerscreen,modal,centerscreen,dialog=yes,accept=yes,cancel=yes',
						retVals).focus();
					
					if (!retVals.answer)
						return false;
					
					let searchTerm, searchTerm2, searchTerm3,
              filtersList, newFilter, emailAddress2,
              // We have to do prefill filter so we are going to launch the
              // filterEditor dialog and prefill that with the emailAddress.
					    template = this.getCurrentFilterTemplate();
					
					if (util.Application=='Postbox') {
						// mailWindowOverlay.js:1790
						filtersList = sourceFolder.getFilterList(msgWindow);
						newFilter = filtersList.createFilter(folderName);
					}
					else {
						filtersList = sourceFolder.getEditableFilterList(msgWindow);
						newFilter = filtersList.createFilter(folderName);
					}
					emailAddress2 = '';

					switch (template) {
						// 1st Filter Template: Conversation based on a Person (email from ..., replies to ...)
						case 'to':
							emailAddress = msg.mime2DecodedRecipients;
							// fallthrough is intended!
						case 'from': // was 'person' but that was badly labelled, so we are going to retire this string
							// sender ...
							searchTerm = createTerm(newFilter, Components.interfaces.nsMsgSearchAttrib.Sender, Components.interfaces.nsMsgSearchOp.Contains, emailAddress);
		
							// ... recipient, to get whole conversation based on him / her
							// ... we exclude "reply all", just in case; hence Is not Contains
							searchTerm2 = createTerm(newFilter, Components.interfaces.nsMsgSearchAttrib.To, Components.interfaces.nsMsgSearchOp.Contains, emailAddress);
							newFilter.appendTerm(searchTerm);
							newFilter.appendTerm(searchTerm2);
              
							if (QuickFolders.Preferences.getFiltersBoolPref("naming.keyWord", false))
							  filterName += " - " + emailAddress;
							break;

						// 2nd Filter Template: Conversation based on a Mailing list (email to fooList@bar.org )
						case 'list':
							//// TO 
							//createTerm(filter, attrib, op, val)
							searchTerm = createTerm(newFilter, Components.interfaces.nsMsgSearchAttrib.Sender, Components.interfaces.nsMsgSearchOp.Contains, emailAddress);
							newFilter.appendTerm(searchTerm);
							
							//// CC
              if (msg.ccList) {
                let ccArray = ccAddress.split(",");
                for (let counter=0; counter<ccArray.length; counter++) {
                  searchTerm2 = createTerm(newFilter, Components.interfaces.nsMsgSearchAttrib.CC, Components.interfaces.nsMsgSearchOp.Contains, ccArray[counter]);
                  newFilter.appendTerm(searchTerm2);
                }
              }
							if (QuickFolders.Preferences.getFiltersBoolPref("naming.keyWord", false))
								filterName += " - " + emailAddress;

							break;
		
						// 3nd Filter Template: Conversation based on a Subject  (starts with [blabla])
						case 'topic':
							//// TO DO ... improve parsing of subject keywords
							//createTerm(filter, attrib, op, val)
							//searchTerm = createTerm(newFilter, Ci.nsMsgSearchAttrib.Subject, Ci.nsMsgSearchOp.Contains, emailAddress);
							searchTerm = newFilter.createTerm();
							searchTerm.attrib = Components.interfaces.nsMsgSearchAttrib.Subject;
							searchTerm.op = Components.interfaces.nsMsgSearchOp.Contains;
							let topicFilter = getMailKeyword(msg.mime2DecodedSubject);
							searchTerm.value = { 
								attrib: searchTerm.attrib, 
								str: topicFilter 
							};
							newFilter.appendTerm(searchTerm);
							if (QuickFolders.Preferences.getFiltersBoolPref("naming.keyWord", false))
							  filterName += " - " + topicFilter;
							break;
							
						// 4th Filter Template: Based on a Tag
						case 'tag':
							// get the list of known tags
							let tagService = Components.classes["@mozilla.org/messenger/tagservice;1"]
							        .getService(Components.interfaces.nsIMsgTagService),
							    tagArray = tagService.getAllTags({}),
							    tagKeys = {};
							for each (let tagInfo in tagArray)
								if (tagInfo.tag) 
									tagKeys[tagInfo.key] = true;

							// extract the tag keys from the msgHdr
							let msgKeyArray = msg.getStringProperty("keywords").split(" ");
							
							// attach legacy label to the front if not already there
							let label = msg.label;
							if (label)
							{
								let labelKey = "$label" + label;
								if (msgKeyArray.indexOf(labelKey) < 0)
								msgKeyArray.unshift(labelKey);
							}
							
							// Rebuild the keywords string with just the keys that are actual tags or
							// legacy labels and not other keywords like Junk and NonJunk.
							// Retain their order, though, with the label as oldest element.
							for (let i = msgKeyArray.length - 1; i >= 0; --i)
								if (!(msgKeyArray[i] in tagKeys))
									msgKeyArray.splice(i, 1); // remove non-tag key

							// -- Now try to match the search term
							
							//createTerm(filter, attrib, op, val)
							for (let i = msgKeyArray.length - 1; i >= 0; --i) {
								searchTerm = createTerm(newFilter, Components.interfaces.nsMsgSearchAttrib.Keywords, Components.interfaces.nsMsgSearchOp.Contains, msgKeyArray[i]);
								newFilter.appendTerm(searchTerm);
								if (QuickFolders.Preferences.getFiltersBoolPref("naming.keyWord", false)) {
								for each (tagInfo in tagArray)
                  if (tagInfo.key === msgKeyArray[i]) 
										filterName += ' ' + tagInfo.tag;
								}
							}
							break;
						default:
							util.alert('invalid template: ' + template);
							return false;
					}

					if (QuickFolders.Preferences.getFiltersBoolPref("naming.parentFolder" == true)) {
					  if (targetFolder.parent)
					    filterName = targetFolder.parent.prettyName + " - " + filterName;
					}
					newFilter.filterName = filterName;

 
					let moveAction = newFilter.createAction();
					moveAction.type = Components.interfaces.nsMsgFilterAction.MoveToFolder;
					moveAction.targetFolderUri = targetFolder.URI;
					newFilter.appendAction(moveAction);
					
					
					// Add to the end
					util.logDebug("Adding new Filter '" + newFilter.filterName + "' "
							 + "for email " + emailAddress
							 + ": current list has: " + filtersList.filterCount + " items");
					filtersList.insertFilterAt(0, newFilter);
					
					args = { filter:newFilter, filterList: filtersList};
					//args.filterName = newFilter.filterName;
					// check http://mxr.mozilla.org/comm-central/source/mailnews/base/search/content/FilterEditor.js
					// => filterEditorOnLoad()
					window.openDialog("chrome://messenger/content/FilterEditor.xul", "",
					                  "chrome, modal, resizable,centerscreen,dialog=yes", args);

					// If the user hits ok in the filterEditor dialog we set args.refresh=true
					// there we check this here in args to show filterList dialog.
					if ("refresh" in args && args.refresh)
					{
            QuickFolders.FilterWorker.openFilterList(true, sourceFolder);
					} //else, let's remove the filter (Cancel case)
					else {
						filtersList.removeFilterAt(0);
					}
				}
				else  // just launch filterList dialog
				{
					QuickFolders.FilterWorker.openFilterList(false, sourceFolder);
				}
			}
			else
				util.logDebugOptional ("filters","no message found to set up filter");

			return 1;
		}
		catch(e) {
			util.alert("Exception in QuickFolders.FilterWorker.createFilter: " + e.message);
			return -1;
		}
		return null;

	} ,

	createFilterAsync: function createFilterAsync(sourceFolder, targetFolder, messageList, isCopy, isSlow) {
    let util = QuickFolders.Util;
    util.logDebugOptional ("filters", "createFilterAsync()");
		if (QuickFolders.win.quickFilters && QuickFolders.win.quickFilters.Worker) {
      util.logDebugOptional ("filters", "redirecting to quickFilters createFilterAsync()...");
			QuickFolders.win.quickFilters.Worker.createFilterAsync(sourceFolder, targetFolder, messageList, isCopy, isSlow);
			return;
		}
		
		let delay = isSlow ? 1200 : 300; // wait for the filter dialog to be updated with the new folder if drag to new
    util.logDebugOptional ("filters", "Preparing filter creation with delay: " + delay + "ms...");
		window.setTimeout(function() {
			let filtered = QuickFolders.FilterWorker.createFilter(sourceFolder, targetFolder, messageList, isCopy);
		}, delay);
		
	},
	
	selectTemplate : function selectTemplate(element) {
		if (!element) {
			element = document.getElementById('qf-filter-templates');
		}
		QuickFolders.FilterWorker.SelectedValue = element.selectedItem.value;
		this.setCurrentFilterTemplate(element.selectedItem.value);
	} ,
	
	
	acceptTemplate : function acceptTemplate() {
		QuickFolders.FilterWorker.selectTemplate();
		QuickFolders.FilterWorker.TemplateSelected = true;
		let retVals = window.arguments[0];
		retVals.answer  = true;
		setTimeout(function() {window.close()});
		return true;
	} ,
	
	cancelTemplate : function cancelTemplate() {
		QuickFolders.FilterWorker.TemplateSelected = false;
		let retVals = window.arguments[0];
		retVals.answer = false;
		return true;
	} ,
	
	
	loadTemplate : function loadTemplate() {
		// initialize list and preselect last chosen item!
		let element = document.getElementById('qf-filter-templates'),
        util = QuickFolders.Util;
		element.value = this.getCurrentFilterTemplate();
    try {
      let loc = QuickFolders.Preferences.service.getCharPref("general.useragent.locale");
      if (loc) {
        util.logDebug('Locale found: ' + loc);
        if (loc.indexOf('en')!=0) {
          // hide quickFilters hint for non-english locales for now:
          // document.getElementById('quickFiltersPromoBox').collapsed = true;
        }
      }
    }
    catch (ex) {
      util.logException("QuickFolders.FilterWorker.loadTemplate()", e);
    }
    
	} ,
	
	getCurrentFilterTemplate : function getCurrentFilterTemplate() {
		return QuickFolders.Preferences.getCharPrefQF("filters.currentTemplate");
	} ,
	
	setCurrentFilterTemplate : function setCurrentFilterTemplate(pref) {
		return QuickFolders.Preferences.setCharPrefQF("filters.currentTemplate", pref);
	} ,
	
  getBundleString  : function getBundleString(id) {
    //let bundle = document.getElementById("bundle_filter");
    try {
      if(!this.bundle)
        this.bundle = Components.classes["@mozilla.org/intl/stringbundle;1"].getService(Components.interfaces.nsIStringBundleService).createBundle("chrome://quickfolders/locale/filters.properties");
      return this.bundle.GetStringFromName(id);
    }
    catch(e) {
      QuickFolders.Util.logException("Could not retrieve bundle string: " + id + "\n", e);
    }
    return '';
  },
	
  selectTemplateFromList: function selectTemplateFromList(element) {
    let descriptionId = "qf.filters.template." + element.selectedItem.value + ".description";
    let desc = document.getElementById ("templateDescription");
    if (desc) {
      desc.textContent = this.getBundleString(descriptionId);
    }
    window.sizeToContent();
    let rect = desc.getBoundingClientRect ? desc.getBoundingClientRect() : desc.boxObject;
    if (rect && rect.height && window.height) {
      window.height += rect.height;
    }
    else if (window.height) {
      // say 1 line of 20px per 50 characters
      window.height += (desc.textContent.length * 20) / 50;
    }
  },
  
  showQuickFilters: function showQuickFilters(event) {
    QuickFolders.Util.openURL(event,'https://addons.mozilla.org/thunderbird/addon/quickfilters');
  }
  

};

