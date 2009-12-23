
/*===============
  Project History
  ===============

  05/09/2008
    AG added Code to remove dynamic "subfolder" popup menus that act as drop targets. this should also deal with resource issues
       made sorting with mouse more persistant (it sometimes jumped back!)

  07/07/2008
    AG added visual indication for drop position (like FX tabs)

  10/09/2008
    AG added Quick Help tab (options.xul, options.js)
       removed 'toolbar' style from option window to support tabbed interface

  05/10/2008
    AG loading version number dynamically in options dialog

  19/11/2008 - Release 0.9.3
    AG fixed bug with drifting popup menus
       fixed same popup not reappearing if first drag not completed

  24/11/2008
    AG rename bug fixed (this used to show original folder name not quickfolder name)

  04/01/2009 - Release 0.9.4
    AM added folder category feature
       split sources into more manageable portions

  09/01/2009 - Release 0.9.5
    AG added "Always show" category and moved "(All)" to the top
       set category dialog: added [Add] button and made [Ok] button work differently
       re-added addon icon to install.rdf

  14/01/2009
    AG Split main options dialog into 3 tabs and added Layout tab
       Added Color Picker to Layout tab (WIP)
       Added Color Picker to Categories dialog (WIP)
       Added accelerator keys to popup menus
       Layout Improvements in style sheet (saves space)
       Tidied up Project History

  17/01/2009 0.9.7
    AG added locale support with help of goofy's sent code
       coloring of active, hovered tab and tabbar background
       German locale

  19/01/2009 0.9.8
    AG storing of colors
       rounded tabs (flat style)!
       updated screenshots on the site and added German translations
    Alex added Dutch locale

  28/01/2009 0.9.9
    AG Improved layout of flat style - tested under Crystal, default and outlook themes.
       added "show icons" option which displays special icons for Inbox, Sent, Trash and current folder
       tried "3d" look on flat-style tabs but removed it again
       fixed an issue with height of category dropdown
       removed (test) color picker from category dialog
       added menu highlighting on drag mail to popup

   07/02/2009 0.9.9.1
     AG force display of OK / Cancel button for applying color options
        improved detection of URIs for special icons

   08/02/2009
     AG update count if total count is displayed

   12/02/2009 0.9.9.2
     AG added menu icons
        added gradient display for menu items

   15/02/2009
     AG+Alex added error handlers for isCorrectWindow and initDelayed functions

   17/02/2009
     AG added number of unread messages to popup menu (jump to menu, not drag menu)

   18/02/2009
     AG do not force switching to All Folders view if not necessary
        added debug mode switch to options
        tidied options layout

   26/02/2009
     AG added configurable init Delay and better error logging

   04/03/2009
     AG added more focused stylesheet logging
        added an option for changing color of inactive tabs

   05/03/2009
     AG do not display folders of category "ALWAYS" when "Uncategorized" is selected.
        for consistency, categories drop down now shows the translated string for "uncategorized"

   08/03/2009  0.9.9.7
     AG  made compatible with TB 3.0 beta 2
   20/03/2009  0.9.10
     AG renamed global instances of Compontents.classes & interfaces to QF_CC, QF_CI to allow for release from sandbox

   30/03/2009
     AG added option to use CTRL instead of ALT for keyboard shortcuts
        suppress event bubbling (for better Lightning compatibility)
        added button for copying folder string to clipboard

   17/04/2009  0.9.12
     AM Fixed some problems with keyboard handler
     AM added italian locale (provided by Leopoldo Saggin)

   19/04/2008
     AG removed constant debug output of keyboard handler (now only visible in debug mode and when relevant)
        increased width of options window to avoid truncation of italian quickhelp texts
        added language resources for debug items
        added icon for folder to clipboard

   11/05/2009
     AG added multiple line support
        added option for focusing message pane after changing category & selecting a tab (to be improved)

   12/05/2009
     AM added Delete and Rename Category features.

   13/05/2009 Release 1.0.1
     AG fixed focus problem after changing of categories
        fixed remembered categories not being selected on startup

   15/05/2009  Release 1.0.2 (permanently sandboxed)
     AG fixed problem on startup when short delay - GetMsgFolderFromUri did not work!!
        Rejected by AMO - not able to add new Category

   26/05/2009 Release 1.0.3
     AG Fixed previous problem by AMO
        added l10n for copy folders to clipboard message
        added colored panels to category screen

   02/06/2009
     AG added individual Tab Color feature (experimental, does not save yet!)
        added feedback link (mail to me) to options dialog
        made options dialog resizable

   24/06/2009
     AG fixed renaming bug for numbered folders
        automatically switch to folder when trying to add it and it already exists.
        Store Tab Colors!

   02/07/2009 Release 1.1
     AG fixed renaming bug for total/unread folders

   28/07/2009 Release 1.2
     AG added: Categories are sorted alphabetically
               Compatibility for Tb3.0b3
        fixed: Quickfolders label floats to right when switched on via options dialog
               warning "QuickFolders is not defined" in quickfolders.js

   26/08/2009:
     AG fixed: in Tb3 the folder tree view would not scroll
        added: whole tab coloring

   12/09/2009  Release 1.3 (Test Release)
     AG added subfolders in popup menus - configurable
               whole / striped tab option and backgrounds
     fixed slowdown of operations that change the number of Total / Unread emails because QF was updated every time
            this is now donw asynchroneously with a 1000ms timer.

    23/09/2009 Release 1.4
      AG added scrollbars and animation to "change order of bookmarks" dialog
         added subfolder expansion
         added Postbox support
    open items tweaks in whole tab coloring (active, hover consistency)
  known issues  sometimes the colors do not show up on program startup. Any folder modification (e.g. unread/read) or Category selection will make the color appear
                popup menus might close delayed
                change the order of bookmarks has the wrong height (should be 80% of its parent)
                chevrons for moving Tabs don't show up in TB3 (beta bug?)
  --------------1.4  Postbox specific
  known issues color submenu still has no colors
               some minor CSS errors


    23/09/2009 Release 1.5b
      AG bumped compatibility to 3.0.4b
         fixed 2 security issues releated to setTimer


    21/10/2009 Release 1.6 23/10/2009
      AG added locales for Japan (Masahiko Imanaka), Portuguese (Marcelo Ghelman), Russian (Anton Pinsky)
         fixed TB not displaying the colors on start up
         fixed in Postbox - the color sub menu now displays colors
      improved error handling in Drag-Drop (WIP for some Linux users)

    09/11/2009 Release 1.6.3
      AG fixed bug 21919 removed popup remove code for linux users as it crashed Thunderbird (not confirmed for TB 3)

    09/11/2009 Release 1.6.4
      AG fixed bug 21960 icon for inbox not visible in postbox
      AG fixed disabled dropping emails to virtual (search) folders

    15/12/2009 Release 1.7
      AG fixed drag & drop layout issues for the new versions of TB3, SeaMonkey and Postbox 1.1
      AG bug 22121 fixed?
      AG fixed bug 22067 (TB3 did not display colors in tab colors submenu)

   WIP
      added time logging to debug output


  KNOWN ISSUES
  ============
  23/10/2009
    - if folders are added / removed during session this is not refreshed in subfolder list of popup set
      workaround: select another Category this will rebuild the menus
    - folders can be orphaned in config settings and are not removable via interface
    - Warning: Unexpected end of file while searching for end of declaration.
               Unexpected end of file while searching for closing } of declaration block.
               Source file: chrome://quickfolders/content/layout.css
               have not found the source of this problem yet.

  OPEN BUGS
  ============
    Bug 22122 	External links in QF settings to not work anymore - only TB 3.0.1 - likely a Mozilla Bug

    A complete list of bugs can be viewed at http://quickfolders.mozdev.org/bugs.html




  PLANNED FEATURES
  ================
    - persist categories in separate JSON list for more flexibility (e.g. rename)
    - size of category dropdown should expand with length of list

  WISHLIST
  ========
    - drag to thread finds quickfolder with correct thread and drops message there
    - instantApply support (difficult, as there is no onclose event)
    - multiple categories per folder (like tags)
*/


var gFolderTree;

function qfLocalErrorLogger (msg) {
	var Cc = Components.classes;
    var Ci = Components.interfaces;

	var cserv = Cc["@mozilla.org/consoleservice;1"].getService(Ci.nsIConsoleService);
	cserv.logStringMessage("QuickFolders:" + msg);
}


var QuickFolders = {
	keyListen: EventListener,
	loadListen: false,
	tabContainer: null,
	initDone: false,
    initDelayed: function() {
       var sWinLocation;
       if (this.initDone) return;
       var nDelay = QuickFolders.Preferences.getIntPref('extensions.quickfolders.initDelay');
       if (!nDelay>0) nDelay = 750;
       sWinLocation = new String(window.location);

       if(QuickFolders.isCorrectWindow()) {
		    QuickFolders.Util.logDebug ("initDelayed ==== correct window: " + sWinLocation + " - " + window.document.title + "\nwait " + nDelay + " msec until init()...");
            // document.getElementById('QuickFolders-Toolbar').style.display = '-moz-inline-box';
            var thefunc='QuickFolders.init()';
            setTimeout(thefunc, nDelay);
	        this.initDone=true;
        }
        else {
	      try {
		    document.getElementById('QuickFolders-Toolbar').style.display = 'none';

		    QuickFolders.Util.logDebug ("DIFFERENT window type(messengerWindow): "
		            + document.getElementById('messengerWindow').getAttribute('windowtype')
		            + "\ndocument.title: " + window.document.title )
          }
	      catch(e) { qfLocalErrorLogger("Exception in initDelayed: " + e);}
        }
    } ,

    isCorrectWindow: function() {
	    try {
          return document.getElementById('messengerWindow').getAttribute('windowtype') == "mail:3pane";
        }
        catch(e) { return false; }
    } ,


    init: function() {
		var em = Components.classes["@mozilla.org/extensions/manager;1"]
	       .getService(Components.interfaces.nsIExtensionManager);
	    var myver=em.getItemForID("quickfolders@curious.be").version;

	    var ApVer; try{ ApVer=QuickFolders.Util.AppverFull()} catch(e){ApVer="?"};
	    var ApName; try{ ApName= QuickFolders.Util.Application()} catch(e){ApName="?"};

		qfLocalErrorLogger("QF.init() - QuickFolders Version " + myver + "\n" + "Running on " + ApName + " Version " + ApVer);
		QuickFolders.addTabEventListener();

        document.getElementById('QuickFolders-Toolbar').style.display = '-moz-inline-box';

        // only add event listener on startup if necessary as we don't
        // want to consume unnecessary performance during keyboard presses!
        if (QuickFolders.Preferences.isUseKeyboardShortcuts()) {
            if(!QuickFolders.Interface.boundKeyListener) {
                window.addEventListener("keypress", this.keyListen = function(e) {
                    QuickFolders.Interface.windowKeyPress(e,'down');
                }, true);
                window.addEventListener("keyup", function(e) {
                    QuickFolders.Interface.windowKeyPress(e,'up');
                }, true);

                QuickFolders.Interface.boundKeyListener = true;
            }
        }
        var folderEntries = QuickFolders.Preferences.getFolderEntries();

        if(folderEntries.length > 0) {
            QuickFolders.Model.selectedFolders = folderEntries;

            QuickFolders.Interface.updateUserStyles();

            var lastSelectedCategory = QuickFolders.Preferences.getLastSelectedCategory()
            QuickFolders.Util.logDebug("last selected Category:" + lastSelectedCategory );

            if(QuickFolders.Model.isValidCategory(lastSelectedCategory))
              QuickFolders.Interface.selectCategory(lastSelectedCategory, true)
            else
              QuickFolders.Interface.updateFolders(true);  // selectCategory already called updateFolders!

        }

        var observerService = Components.classes["@mozilla.org/observer-service;1"].getService(Components.interfaces.nsIObserverService);

        observerService.addObserver({
            observe: function() {
                QuickFolders.Interface.updateFolders(true);
                QuickFolders.Interface.updateUserStyles();
            }
        },"quickfolders-options-saved", false);
        QuickFolders.Util.logDebug("QF.init() ends.");
    } ,

    sayHello: function() {
        alert("Hello from QuickFolders")
    } ,

    // handler for dropping folder shortcuts
    toolbarDragObserver: {
        getSupportedFlavours : function () {
            var flavours = new FlavourSet();
            flavours.appendFlavour("text/x-moz-folder"); // folder tree items
            flavours.appendFlavour("text/unicode"); // buttons
            return flavours;
        },

        onDragEnter: function (evt,flavour,session){
            if (!((QuickFolders.Util.Appver() < 3) && (QuickFolders.Util.Application()=='Thunderbird'))) {
		        evt.preventDefault();
		        return false;
            }
            return true;
        },

        onDragOver: function (evt,flavour,session){
            if (flavour.contentType=="text/x-moz-folder" || flavour.contentType=="text/unicode") // only allow folders or  buttons!
              session.canDrop = true;
            else {
	          QuickFolders.Util.logDebugOptional("dnd","toolbarDragObserver.onDragover - can not drop " + flavour.contentType);
              session.canDrop = false;
            }
        },

        onDrop: function (evt,dropData,dragSession) {
            QuickFolders.Util.logDebugOptional("dnd","toolbarDragObserver.onDrop " + dropData.flavour.contentType);
            switch (dropData.flavour.contentType) {
                case  "text/x-moz-folder":
                    var sourceUri;
                    if ((QuickFolders.Util.Appver() > 2)
                        && (QuickFolders.Util.Application()=='Thunderbird')) {
                      var msgFolder = evt.dataTransfer.mozGetDataAt("text/x-moz-folder", 0);
                      sourceUri = msgFolder.URI;
                      if (!sourceUri) sourceUri = msgFolder;  // SeaMonkey
                    }
                    else
                      sourceUri = QuickFolders.Util.getFolderUriFromDropData(dropData, dragSession)
                    if(sourceUri) {
	                  var cat=QuickFolders.Interface.getCurrentlySelectedCategoryName();
                      if (QuickFolders.Model.addFolder(sourceUri, cat)) {
                        var s = "Added shortcut " + msgFolder + " to QuickFolders"
                        if (cat!=null) s = s + " Category " + cat;
                        try{window.MsgStatusFeedback.showStatusString(s);} catch (e) {};
                      }

                    }

                    break;
                case "text/unicode":  // plain text: button was moved
                    var myDragPos;
                    if (evt.pageX<120) // should find this out by checking whether "Quickfolders" label is hit
                        myDragPos="LeftMost"
                    else
                        myDragPos="RightMost"
                    QuickFolders.ChangeOrder.insertAtPosition(dropData.data, "", myDragPos);
                    break;
            }
        }
    } ,

    // recursive popups have to react to drag mails!
    popupDragObserver: {
        getSupportedFlavours : function () {
            var flavours = new FlavourSet();
            flavours.appendFlavour("text/x-moz-message");
            flavours.appendFlavour("text/unicode");  // test
            return flavours;
        },
        dragOverTimer: null,
        onDragEnter: function(evt, dragSession) {
            try {
	            if (!(QuickFolders.Util.Application()=='Thunderbird' && QuickFolders.Util.Appver()<3))
	                evt.preventDefault(); // fix layout issues in TB3 + Postbox!

	            var popupStart = evt.target;
	            var pchild = popupStart.firstChild;
	            if (pchild.nodeName == 'menupopup') {
	              // hide all sibling popup menus
	              var psib = popupStart.nextSibling;
	              while (psib) {
		              if (psib.nodeName == 'menu' && popupStart!=psib)
		                psib.firstChild.hidePopup();
		              psib = psib.nextSibling;
	              }
	              psib = popupStart.previousSibling;
	              while (psib) {
		              if (psib.nodeName == 'menu' && popupStart!=psib)
		                psib.firstChild.hidePopup();
		              psib = psib.previousSibling;
	              }
	              pchild.showPopup();
 	              QuickFolders.Util.logDebugOptional("dnd","Displayed popup " + popupStart.getAttribute('label'));
                }
                else
 	              QuickFolders.Util.logDebugOptional("dnd","Ignoring DragEnter with child node: " + pchild.nodeName);
            }
            catch(e) {
                QuickFolders.Util.logDebug ("onDragEnter: failure - " + e);
            }
        },

        // deal with old folder popups
        onDragExit: function(evt, dragSession) {
	        var popupStart = evt.target;
	        // find parent node!
            QuickFolders.Util.logDebugOptional("dnd","popupDragObserver.DrageExit " + popupStart.nodeName + " - " + popupStart.getAttribute('label'));
	        try {
		        if (popupStart.nodeName=='menu') {
			        globalLastChildPopup=popupStart; // remember to destroy!
                }
            }
            catch (e) {
              QuickFolders.Util.logDebugOptional("dnd","CATCH popupDragObserver DragExit: \n" + e);
            }
        } ,

        onDragOver: function (evt, flavor, session){
	        session.canDrop = (flavor.contentType == "text/x-moz-message");
	        if (null!=globalLastChildPopup) {
	          /*globalLastChildPopup.firstChild.hidePopup();*/
	          globalLastChildPopup=null;
			}
        },

        // drop mails on popup: move mail, like in buttondragobserver - this is set up to point to the other one
        onDrop: function (evt,dropData,dragSession) {
            var popupStart = evt.target;
            try {
                QuickFolders.Util.logDebugOptional("dnd","popupDragObserver.onDrop " + dropData.flavour.contentType);
	            QuickFolders.Util.logDebugOptional("dnd","Popup Drop on" + popupStart.name);
            } catch(e) { qfLocalErrorLogger("Exception in OnDrop event: " + e)}
            try {
	            popupStart.firstChild.hidePopup(); // new
            } catch(e) { qfLocalErrorLogger("Exception in OnDrop hidePopup: " + e)}
        }

    },

    buttonDragObserver: {
        getSupportedFlavours : function () {
            var flavours = new FlavourSet();
            flavours.appendFlavour("text/x-moz-message"); // emails
            flavours.appendFlavour("text/unicode");  // tabs
            return flavours;
        },

        dragOverTimer: null,

        onDragEnter: function(evt, dragSession) {

            try {
	            if (null==dragSession.sourceNode) {
	              QuickFolders.Util.logToConsole ("UNEXPECTED ERROR QuickFolders.OnDragEnter - empty sourceNode!");
	              return;
                }
		        QuickFolders.Util.logDebugOptional("dnd","buttonDragObserver.onDragEnter - sourceNode = " + dragSession.sourceNode.nodeName);
		        if (dragSession.sourceNode.nodeName == 'toolbarpaletteitem') {
		          QuickFolders.Util.logDebug("trying to drag a toolbar palette item - not allowed.");
		          dragSession.canDrop=false;
		          return;
	            }
                var button = evt.target;
		        // delete previous drag folders popup!
                if (globalHidePopupId && globalHidePopupId!="") {
                    var popup = document.getElementById(globalHidePopupId);
			        try {
				        if (QuickFolders.Util.Application() == 'SeaMonkey')
				          popup.parentNode.removeChild(popup);
				        else
				          popup.hidePopup(); // parentNode.removeChild(popup)
				       QuickFolders.Util.logDebugOptional("dnd", "removed popup globalHidePopupId: " + globalHidePopupId );
			        }
			        catch (e) {
				       QuickFolders.Util.logDebugOptional("dnd", "removing popup:  globalHidePopupId  failed!\n" + e + "\n");
			        }
			        globalHidePopupId="";
               }

                if(button.tagName == "toolbarbutton") {
                    // highlight drop target
                    if (dragSession.numDropItems==1) {
                      if (dragSession.isDataFlavorSupported("text/unicode" )) {
	                    // show reordering target position!
	                    // right or left of current button! (try styling button with > OR < to show on which side the drop will happen)
	                    var node = dragSession.sourceNode;

	                    // find out whether drop target button is right or left from source button:
	                    if (node.hasAttributes()) {
							var j;
							var sDirection;
							  var box = node.boxObject;
							  if (box) {
								  var dx = (box.x - button.boxObject.x);
								  if (dx != 0) {
									  sDirection=(dx>0 ? "dragLEFT" : "dragRIGHT")
								      button.className += (" " + sDirection); // add style for drop arrow (remove onDragExit)
							      }
							  }
	                    }
                      }
                    }

	                //show context menu if dragged over a button which has subfolders
                    var targetFolder = button.folder;

                    if (targetFolder.hasSubFolders) {
                        var otherPopups = QuickFolders.Interface.menuPopupsByOffset;
                        for(var i = 0; i < otherPopups.length; i++) {
	                        if (otherPopups[i].folder!=targetFolder)
                              otherPopups[i].hidePopup();
                        }
                    }

                    // only show popups when dragging messages!
                    if(dragSession.isDataFlavorSupported("text/x-moz-message") && targetFolder.hasSubFolders)
                    try {
                        //close any other context menus
                        if (dragSession.isDataFlavorSupported("text/unicode" ))
	                      return;  // don't show popup when reordering tabs
	                    QuickFolders.Util.logDebugOptional("dnd", "creating popupset for " + targetFolder.name );

                        // instead of using the full popup menu (containing the 3 top commands)
                        // try to create droptarget menu that only contains the target subfolders "on the fly"
                        // haven't found a way to tidy these up, yet (should be done in onDragExit?)
                        // Maybe they have to be created at the same time as the "full menus" and part of another menu array like menuPopupsByOffset
                        // no menus necessary for folders without subfolders!
			            var popupset = document.createElement('popupset');
			            QuickFolders.Interface.getToolbar().appendChild(popupset);
			            var menupopup = document.createElement('menupopup');
			            var popupId = 'moveTo_'+targetFolder.URI;
			            menupopup.setAttribute('id', popupId);
			            menupopup.className = 'QuickFolders-folder-popup';
			            menupopup.folder = targetFolder;
			            popupset.appendChild(menupopup);
	                    QuickFolders.Interface.addSubFoldersPopup(menupopup, targetFolder);
	                    // a bug in showPopup when used with coordinates makes it start from the wrong origin
	                    //document.getElementById(popupId).showPopup(button, button.boxObject.screenX, Number(button.boxObject.screenY) + Number(button.boxObject.height));
	                    // AG fixed, 19/11/2008 - showPopup is deprecated in FX3!
	                    QuickFolders.Util.logDebugOptional("dnd", "showPopup with id " + popupId );
	                    if (QuickFolders.Util.Application() == 'SeaMonkey')
	                      document.getElementById(popupId).openPopup(button,'after_start', -1,-1,"context");
	                    else
	                    document.getElementById(popupId).showPopup(button, -1,-1,"context","bottomleft","topleft");

	                    if (popupId==globalHidePopupId) globalHidePopupId=""; // avoid hiding "itself". globalHidePopupId is not cleared if previous drag cancelled.

                    }


                    catch(e) { QuickFolders.Util.logDebugOptional("dnd", "Exception creating folder popup: " + e);};
                    }
            }
            catch(e) {
	            QuickFolders.Util.logToConsole ("EXCEPTION buttonDragObserver.onDragEnter: " + e);
            }
        } ,

        // deal with old folder popups
        onDragExit: function(event, dragSession) {
             if (null==dragSession.sourceNode) { return; }
             try {
	        //QuickFolders.Util.logDebugOptional("dnd", "buttonDragObserver.onDragExit - sourceNode = " + dragSession.sourceNode.nodeName);
             } catch(e) { QuickFolders.Util.logDebugOptional("dnd", "buttonDragObserver.onDragExit - " + e); }
            if (dragSession.sourceNode.nodeName == 'toolbarpaletteitem') {
	            QuickFolders.Util.logDebugOptional("dnd", "trying to drag a toolbar palette item - ignored.");
		        dragSession.canDrop=false;
	            return;
            }
	        var button = event.target;
	        globalHidePopupId="";
	        if (dragSession.isDataFlavorSupported("text/unicode" )) // drag buttons
	        {
		        // remove dragdrop marker:
		        button.className = button.className.replace(/\s*dragLEFT/,"");
		        button.className = button.className.replace(/\s*dragRIGHT/,"");
		    	return;  // don't remove popup when reordering tabs
	        }
		    // problem: event also fires when dragging into the menu, so we can not remove it then!
	        var targetFolder = button.folder;
	        var popupId = 'moveTo_'+targetFolder.URI;

	        // this popup needs to be removed if we drag into another button.
	        try {
		        if (document.getElementById(popupId))
			        globalHidePopupId = popupId; // arm for hiding! GLOBAL VAR!!
            }
            catch(ex) {
	            window.dump("Cannot setup for delete: popup \n" + ex);
            }


        } ,


        onDragOver: function (evt,flavor,session){
	        //QuickFolders.Util.logDebug("buttonDragObserver.onDragOver flavor=" + flavor.contentType);
	        session.canDrop = true;
	        if (flavor.contentType == "text/x-moz-message" || flavor.contentType == "text/unicode" || flavor.contentType == "text/x-moz-folder")
              session.canDrop = true;
            else {
              QuickFolders.Util.logDebugOptional("dnd", "buttonDragObserver.onDragover - can not drop " + flavor.contentType);
              session.canDrop = false;
            }

        },

        onDrop: function (evt,dropData,dragSession) {
            var debugDragging = false;
	        //alert('test: dropped item, flavor=' + dropData.flavour.contentType);
	        QuickFolders.Util.logDebugOptional("dnd", "buttonDragObserver.onDrop flavor=" + dropData.flavour.contentType);
            var DropTarget = evt.target;
            var targetFolder = DropTarget.folder;
            globalHidePopupId="";

            switch (dropData.flavour.contentType) {
                //case  "text/x-moz-folder": // not supported! You can not drop a folder from foldertree on a tab!
                case  "text/x-moz-message":
                    var trans = Components.classes["@mozilla.org/widget/transferable;1"].createInstance(Components.interfaces.nsITransferable);
	                //alert('trans.addDataFlavor: trans=' + trans + '\n numDropItems=' + dragSession.numDropItems);
                    trans.addDataFlavor("text/x-moz-message");

                    var messageUris = [];

                    for (var i = 0; i < dragSession.numDropItems; i++) {
                        //alert('dragSession.getData ... '+(i+1));
                        dragSession.getData (trans, i);
                        var dataObj = new Object();
                        var flavor = new Object();
                        var len = new Object();
                        if (debugDragging ) alert('trans.getAnyTransferData ... '+(i+1));
                        try {
	                        trans.getAnyTransferData(flavor, dataObj, len);

	                        if (flavor.value == "text/x-moz-message" && dataObj) {
	                            dataObj = dataObj.value.QueryInterface(Components.interfaces.nsISupportsString);
		                        if (debugDragging ) alert('getting data from dataObj...');
	                            var messageUri = dataObj.data.substring(0, len.value);
		                        if (debugDragging ) alert('messageUris.push...');
		                        if (debugDragging ) alert('messageUri=' + messageUri) ;
	                            messageUris.push(messageUri);
	                        }
                        }
                        catch (e) {
					        qfLocalErrorLogger("Exception in onDrop item " + i + " of " + dragSession.numDropItems + "\nException: " + e);
                        }
                    }
                    // handler for dropping messages
                    try {
	                    if(messageUris.length > 0) {
	                        QuickFolders.Util.moveMessages(
	                          targetFolder,
	                          messageUris,
	                          dragSession.dragAction == Components.interfaces.nsIDragService.DRAGDROP_ACTION_COPY
	                        )
	                    }
                    }
                    catch(e) {qfLocalErrorLogger("Exception in onDrop - QuickFolders.Util.moveMessages:" + e); };
                    // close any top level menu items after message drop!
                    //hide popups menus!
                   QuickFolders.Util.logDebug ("buttonDragObserver.onDrop " + DropTarget.tagName+ '  Target:' + targetFolder.name );
                   var p=DropTarget;
                   QuickFolders.Util.logDebug ("Close menus for node=" + p.nodeName
                                             + "\nlabel=" + p.getAttribute('label')
                                             + "\nparent tag=" + p.parentNode.tagName);
                   if (p.tagName=='menuitem') // drop to a menu item
                   {
                       // close all containing menus
                        // hidepopup is broken in linkux during OnDrag action!!
                        // bug only confirmed on TB 2.0!
						if (QuickFolders.Util.HostSystem()=='linux' && QuickFolders.Util.Appver()<3) {
							var lastmenu=p;

							// in linux, toolbarbutton is box - let's navigate up to the toolbar instead
	                       	while (null!=p.parentNode && p.parentNode.tagName!='toolbar') {
		                        if(p.tagName=='menupopup') lastmenu=p;
		                        p=p.parentNode;
							}

						  if (lastmenu.tagName=='menupopup') {
							globalHidePopupId = lastmenu.id;
							var popOne = document.getElementById(globalHidePopupId);
							try {
						        //popOne.parentNode.removeChild(popOne); //was popup.hidePopup()
						        //globalHidePopupId="";
							} catch (e) { alert (e); }
						  }
						}
						else {  // not linux
	                       while (null!=p.parentNode && p.tagName!='toolbar') {
	                         p=p.parentNode;
	                         QuickFolders.Util.logDebug ("parenttag=" + p.tagName);
	                         QuickFolders.Util.logDebug ("node= " + p.nodeName);
	                         if (p.tagName=='menupopup') {
						        QuickFolders.Util.logDebug ("Try hide parent Popup " + p.getAttribute('label'));
						        p.hidePopup();
	                         }
	                       }
					    } // else not linux
                   }

                   else if (p.tagName=='toolbarbutton') {// drop to a button
                     globalHidePopupId='moveTo_'+DropTarget.folder.URI;
                     QuickFolders.Util.logDebug ("set globalHidePopupId to " + globalHidePopupId);

	                    var popup = document.getElementById(globalHidePopupId);
				        try {
					        popup.parentNode.removeChild(popup); //was popup.hidePopup()
					        globalHidePopupId="";
				        }
				        catch(e) {
					        QuickFolders.Util.logDebug ("Could not remove popup of " + globalHidePopupId );
				        }
                   }


                    break;
                case "text/unicode":  // dropping another tab on this tab inserts it before
                    QuickFolders.ChangeOrder.insertAtPosition(dropData.data, DropTarget.folder.URI, "");
                    break;
            }
        },
        // new handler for starting drag of buttons (re-order)
        onDragStart: function (event, transferData, action) {
            var button = event.target;
            transferData.data = new TransferData();
            transferData.data.addDataForFlavour("text/unicode", button.folder.URI); // test
        }

    },

	addLoadEventListener: function() {
		// avoid registering this event listener twice!
		if (!this.loadListen) {
			window.addEventListener("load", QuickFolders.initDelayed, true);
		}
		this.loadListen=true;
	},

	addTabEventListener: function() {
		if (((QuickFolders.Util.Appver() < 3) && (QuickFolders.Util.Application()=='Thunderbird')))
		  return;
		try{
			this.tabContainer = document.getElementById('tabmail'); // tabbrowser // .tabContainer; // tabmail-container
		    //qfLocalErrorLogger("id=" + document.getElementById('tabmail') + " tabContainer att:" + this.tabContainer.attributes);
			//other events: "TabClose", "TabOpen"
			document.getElementById('tabmail').addEventListener("TabSelect", qfTabListener.mailTabSelected, false);
			//qfLocalErrorLogger("after addEventListener id=" + this.tabContainer.id);
	    }
	    catch (e) {
		    qfLocalErrorLogger("No tabContainer available! " + e);
		    this.tabContainer = null;
	    }
	}


}

function MyEnsureFolderIndex(tree, msgFolder)
{
    // try to get the index of the folder in the tree
    try {
	    var index ;
        if (((QuickFolders.Util.Application() == 'Thunderbird')
             && (QuickFolders.Util.Appver() > 2))
           || (QuickFolders.Util.Application() == 'Postbox'))
	      index = tree.getIndexOfFolder(msgFolder);
        else
          index= tree.builderView.getIndexOfResource(msgFolder);
        QuickFolders.Util.logDebug ("folders","MyEnsureFolderIndex - index of " + msgFolder.name + ": " + index);

	    if (index == -1) {
	  	  var parentIndex = MyEnsureFolderIndex(tree, msgFolder.parent);

	      // if we couldn't find the folder, open the parent
	      if(!tree.builderView.isContainerOpen(parentIndex)) {
	            tree.builderView.toggleOpenState(parentIndex);
	      }

          if ((QuickFolders.Util.Application() == 'Thunderbird' && QuickFolders.Util.Appver() > 2)
            || QuickFolders.Util.Application() == 'Postbox' )
	        index = tree.getIndexOfFolder(msgFolder);
          else  //TB3, SeaMonkey
	        index = tree.builderView.getIndexOfResource(msgFolder);
	    }
	    return index;
	}
	catch(e) {
        qfLocalErrorLogger("Exception in MyEnsureFolderIndex: " + e);
		return -1;
	}

}

function myRDF()
{
  if (QuickFolders.Util.Appver() > 2)
    return Components.classes["@mozilla.org/rdf/rdf-service;1"].getService(Components.interfaces.nsIRDFService);
  else
    return RDF;
}

// replaces TB2 only helper method GetFolderTree()
function MyGetFolderTree() {
  if (!gFolderTree)
     gFolderTree = document.getElementById("folderTree");
  return gFolderTree;
}

function MyChangeSelection(tree, newIndex)
{
  if(newIndex >= 0)
 {
    QuickFolders.Util.logDebug("folders","ChangeSelection of folder tree.index " + tree.currentIndex + " to " + newIndex);
    tree.view.selection.select(newIndex);
    tree.treeBoxObject.ensureRowIsVisible(newIndex);
  }
}

function MySelectFolder(folderUri)
{
	QuickFolders.Util.logDebugOptional("folders", "MySelectFolder: " + folderUri);
    var folderTree = MyGetFolderTree();
    var folderResource = myRDF().GetResource(folderUri);
    var msgFolder = folderResource.QueryInterface(Components.interfaces.nsIMsgFolder);
    var folderIndex;

    if (QuickFolders.Util.Appver() <= 2
        || QuickFolders.Util.Application()=='Postbox'
        || QuickFolders.Util.Application()=='SeaMonkey' ) {
    // before we can select a folder, we need to make sure it is "visible"
    // in the tree.  to do that, we need to ensure that all its
    // ancestors are expanded
	    if (QuickFolders.Util.Application()=='Postbox')
		   folderIndex = EnsureFolderIndex(msgFolder);
		else
		   folderIndex = MyEnsureFolderIndex(folderTree, msgFolder);
      // AG no need to switch the view if folder exists in the current one (eg favorite folders or unread Folders
      if (folderIndex<0) {
  		QuickFolders.Util.ensureNormalFolderView();
  		folderIndex = MyEnsureFolderIndex(folderTree, msgFolder);
      }
	  MyChangeSelection(folderTree, folderIndex);
	  // select message in top pane for keyboard navigation
	  if (QuickFolders.Preferences.isFocusPreview() && !(GetMessagePane().collapsed)) {
	      GetMessagePane().focus();
	      document.commandDispatcher.advanceFocus();
	      document.commandDispatcher.rewindFocus();
      }
	}
	else { // TB 3
		gFolderTreeView.selectFolder (msgFolder);
		folderTree.treeBoxObject.ensureRowIsVisible(folderTree.currentIndex);
	}

}


// set up the folder listener to point to the above function
var qfFolderListener = {
	ELog: function(msg)
	{
	try {
	  try {Components.utils.reportError(msg);}
	  catch(e) {
		  var Cc = Components.classes;
		  var Ci = Components.interfaces;
		  var cserv = this.Cc["@mozilla.org/consoleservice;1"].getService(this.Ci.nsIConsoleService);
		  cserv.logStringMessage("QuickFolders:" + msg);
      }
    }
    catch(e) {
	    // write to TB status bar??
	    try{QuickFolders.Util.logToConsole("Error: " + msg);} catch(e) {;};
	};
    },

    OnItemAdded: function(parent, item, viewString) {},
    OnItemRemoved: function(parent, item, viewString) {},
    OnItemPropertyChanged: function(parent, item, viewString) {},
    OnItemIntPropertyChanged: function(item, property, oldValue, newValue) {
        try {

          if (property == "TotalUnreadMessages" ||
              (QuickFolders.Preferences.isShowTotalCount() && property == "TotalMessages")) {  // FolderSize
	            if(QuickFolders) {
				    QuickFolders.Util.logDebugOptional("folders", "qfFolderListener: " + property);
		            QuickFolders.Interface.setFolderUpdateTimer();
		            QuickFolders.Util.logDebugOptional("folders", "qfFolderListener: called setFolderUpdateTimer()");
                }
          }
        }
        catch(e) {this.ELog("Exception in Item OnItemIntPropertyChanged - TotalUnreadMessages: " + e);};
    },
    OnItemBoolPropertyChanged: function(item, property, oldValue, newValue) {},
    OnItemUnicharPropertyChanged: function(item, property, oldValue, newValue) {},
    OnItemPropertyFlagChanged: function(item, property, oldFlag, newFlag) {},
    OnItemEvent: function(item, event) {
	    try {
          QuickFolders.Util.logDebugOptional("events","event: " + event);
	      if(event == "FolderLoaded") {  // DeleteOrMoveMsgCompleted
		    try {
	          if(QuickFolders)
	                QuickFolders.Interface.onFolderSelected();
	          }
	          catch(e) {this.ELog("Exception in Item event - calling onFolderSelected: " + e)};
	        }
        }
        catch(e) {this.ELog("Exception in Item event: " + e)};
    },
    OnFolderLoaded: function(aFolder) { },
    OnDeleteOrMoveMessagesCompleted: function( aFolder) {}
}

var qfTabListener = {
    mailTabSelected: function(evt){
      qfLocalErrorLogger('mailTabSelected');
      try {

	    QuickFolders.Util.logToConsole('event ' + evt);

        if(QuickFolders)
            QuickFolders.Interface.onFolderSelected();
      }
      catch(e) {qfLocalErrorLogger("Exception in Item event - calling mailTabSelected: " + e)};
    }
}





// now register myself as a listener on every mail folder
var mailSession = Components.classes["@mozilla.org/messenger/services/session;1"].getService(Components.interfaces.nsIMsgMailSession);
mailSession.AddFolderListener(qfFolderListener, Components.interfaces.nsIFolderListener.all);



QuickFolders.addLoadEventListener();


var globalHidePopupId="";
var globalLastChildPopup=null;
window.dump("globalHidePopupId=" + globalHidePopupId + "\n");
