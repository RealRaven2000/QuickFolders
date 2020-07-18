var { Services } = ChromeUtils.import("resource://gre/modules/Services.jsm");

// this is a polyfill for the buil-in pref function
function pref(aName, aDefault) {
	let defaults = Services.prefs.getDefaultBranch("");
  switch (typeof aDefault) {
	case "string":
		return defaults.setCharPref(aName, aDefault);

	case "number":
		return defaults.setIntPref(aName, aDefault);
	
	case "boolean":
		return defaults.setBoolPref(aName, aDefault);
	  
	default:
	  throw new Error("Preference <" + aName + "> has an unsupported type <" + typeof aDefault + ">. Allowed are string, number and boolean.");
  }
}

function onLoad(window, wasAlreadyOpen) {
	// make window and document available in this "sandbox" (we are inside the window["QF"] namespace)
	this.window = window;
	this.document = window.document;

	//replace old pref default file (without this all your calls to getPref fail as there is no default define)
	Services.scriptloader.loadSubScript("chrome://quickfolders/content/scripts/quickfoldersDefaults.js", this, "UTF-8");
	
	// Load all JS directly
	Services.scriptloader.loadSubScript("chrome://quickfolders/content/quickfolders.js", this, "UTF-8");
	Services.scriptloader.loadSubScript("chrome://quickfolders/content/quickfolders-tablistener.js", this, "UTF-8");
	Services.scriptloader.loadSubScript("chrome://quickfolders/content/quickfolders-preferences.js", this, "UTF-8");
	Services.scriptloader.loadSubScript("chrome://quickfolders/content/quickfolders-themes.js", this, "UTF-8");
	Services.scriptloader.loadSubScript("chrome://quickfolders/content/quickfolders-filterWorker.js", this, "UTF-8");
	Services.scriptloader.loadSubScript("chrome://quickfolders/content/quickfolders-util.js", this, "UTF-8");
	Services.scriptloader.loadSubScript("chrome://quickfolders/content/quickfolders-interface.js", this, "UTF-8");
	Services.scriptloader.loadSubScript("chrome://quickfolders/content/quickfolders-rsa.js", this, "UTF-8");
	Services.scriptloader.loadSubScript("chrome://quickfolders/content/quickfolders-register.js", this, "UTF-8");
	Services.scriptloader.loadSubScript("chrome://quickfolders/content/quickfolders-quickMove.js", this, "UTF-8");
	Services.scriptloader.loadSubScript("chrome://quickfolders/content/quickfolders-bookmarks.js", this, "UTF-8");
	Services.scriptloader.loadSubScript("chrome://quickfolders/content/quickfolders-change-order.js", this, "UTF-8");
	Services.scriptloader.loadSubScript("chrome://quickfolders/content/quickfolders-model.js", this, "UTF-8");
	Services.scriptloader.loadSubScript("chrome://quickfolders/content/qf-advancedTab.js", this, "UTF-8");
	Services.scriptloader.loadSubScript("chrome://quickfolders/content/quickfolders-folderTree.js", this, "UTF-8");
	Services.scriptloader.loadSubScript("chrome://quickfolders/content/quickfolders-folder-category.js", this, "UTF-8");
	Services.scriptloader.loadSubScript("chrome://quickfolders/content/qf-styles.js", this, "UTF-8");
	Services.scriptloader.loadSubScript("chrome://quickfolders/content/quickfolders-listener.js", this, "UTF-8");

	// Get the label using an entry from the i18n locale JSON file in the _locales folder.
	// you currently do not have any JSON locales
	// let label = this.extension.localeData.localizeMessage("menuLabel");

	// Parse a XUL fragment
	// The oncommand attribute does not know "this", so we need to specify
	// the entiry hierachy, including "QF" namespace of this
	// JavaScript files as defined in messenger.WindowListener.startListening()
	// in background.js.	

	// append to MailToolbarPalette
	let toolbarpalette = window.MozXULElement.parseXULToFragment(`
	  <toolbarbutton id="QuickFolders-toolbar-button" 
			class="qfElement toolbarbutton-1 chromeclass-toolbar-additional"
			label="&qf.toolbar.quickfolders.toolbar;" 
			tooltiptext="&qf.toolbar.quickfolders.toolbar;"
			oncommand="window.QF.QuickFolders.Interface.toggleToolbar(this);"
			checked="true"
			/>
	  <toolbarbutton id="QuickFolders-createfolder" 
			class="qfElement toolbarbutton-1 chromeclass-toolbar-additional"
			label="&quickfolders.toolbar.newsubfolder;" 
			tooltiptext="&quickfolders.toolbar.newsubfolder;" 
			oncommand="window.QF.QuickFolders.Interface.onCreateInstantFolder();"
		  />
		<toolbarbutton id="QuickFolders-skipfolder"
			class="qfElement toolbarbutton-1 chromeclass-toolbar-additional"
			label="&quickfolders.toolbar.skip;" 
			tooltiptext="&qf.tooltip.skipUnreadFolder;" 
			oncommand="window.QF.QuickFolders.Interface.onSkipFolder(null);"
		  />
`, 
	["chrome://quickfolders/locale/overlay.dtd"]);
	// Add the parsed fragment to the UI.
	//window.document.getElementById("MailToolbarPalette").appendChild(toolbarpalette);




	// append to mail-toolbox
	let QuickFoldersToolbar = window.MozXULElement.parseXULToFragment(`
		<toolbar
			id="QuickFolders-Toolbar"
			toolbarname="QuickFolders Toolbar"
			class="qfElement toolbar-primary"
			ondragover="nsDragAndDrop.dragOver(event,QuickFolders.toolbarDragObserver)"
			ondrop="nsDragAndDrop.drop(event,QuickFolders.toolbarDragObserver)"
			ondragenter="nsDragAndDrop.dragEnter(event,QuickFolders.toolbarDragObserver)"
			dragdroparea="QuickFolders-FoldersBox"
			customizable="false"
			context="QuickFolders-ToolbarPopup"
			flex="10"
		>
		<hbox id="QuickFolders-left" align="center">
			<vbox id="QuickFolders-LabelBox" flex="0">
				<toolbarbutton id="QuickFolders-title-label" 
				               oncommand="window.QF.QuickFolders.Interface.clickTitleLabel(this);"
											 label="&qf.label.quickfolders;" />
			</vbox>
			
		</hbox>
		
		<popupset id="QuickFolders-Palette" xmlns="http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul">
			<menupopup id="QuickFolders-PalettePopup" 
			           class="QuickFolders-folder-popup" 
								 xmlns="http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul"
								 onclick="window.QF.QuickFolders.Interface.clickHandler(event,this);">
			</menupopup>
			<menupopup id="QuickFolders-FindPopup" 
			           class="menu-iconic widerMenu" 
					   position="after_start"
					   oncommand="window.QF.QuickFolders.Interface.selectFound(this, event);"
					   onkeypress="window.QF.QuickFolders.Interface.foundInput(this, event);"
					   onblur="window.QF.QuickFolders.Interface.findPopupBlur(this, event);"
					   ignorekeys="false">
			</menupopup>
		</popupset>

		<popupset id="QuickFolders-QuickMovePopupSet">
			<menupopup id="QuickFolders-quickMoveMenu">
				<menuitem id="QuickFolders-quickMove-suspend"
				          label="&quickfolders.quickMove.menu.suspend;"
				          oncommand="window.QF.QuickFolders.quickMove.toggleSuspendMove(this);" 
				          type="checkbox"
				          />
				<menuitem id="QuickFolders-quickMove-cancel"
				          label="&quickfolders.quickMove.menu.cancel;"
				          oncommand="window.QF.QuickFolders.quickMove.cancel();" 
				          collapsed="true"
				          />
				<menuitem id="QuickFolders-quickMove-showSearch"
				          label="&quickfolders.quickMove.menu.showSearch;"
				          oncommand="window.QF.QuickFolders.quickMove.showSearch();" 
				          />
				<menuitem id="QuickFolders-quickMove-hideSearch"
				          label="&quickfolders.quickMove.menu.hideSearch;"
				          oncommand="window.QF.QuickFolders.quickMove.hideSearch();" 
				          collapsed="true"
				          />
			</menupopup>
		</popupset>	
		
		<popupset id="QuickFolders-ReadingListPopupSet">
			<menupopup id="QuickFolders-readingListMenu" class="widerMenu">
				<menuitem id="QuickFolders-readingList-reset"
				          label="&quickfolders.readingList.clear;"
									class="cmd"
									collapsed="true"
				          oncommand="window.QF.QuickFolders.bookmarks.resetList(true);" 
				          />
				<menuitem id="QuickFolders-readingList-add"
				          label="&quickfolders.readingList.addCurrent;"
									class="cmd"
				          oncommand="window.QF.QuickFolders.bookmarks.addCurrent();" 
				          />
			</menupopup>
		</popupset>	
		
		<popupset id="QuickFolders-MainPopupSet">
			<menupopup id="QuickFolders-ToolbarPopup" class="QuickFolders-folder-popup">
			  <menu class="menu-iconic dbgMenu"  
							collapsed="true"
							id="QuickFolders-debug" 
				      label="Debug">
					<menupopup class="dbgMenu">
					
						<menuitem id="QuickFolders-ToolbarPopup-dbg1"
											label="Test Tree only Icons"
											oncommand="window.QF.QuickFolders.Interface.testTreeIcons();" 
											class="menuitem-iconic"
											/>
											
						<menuitem id="QuickFolders-ToolbarPopup-dbg2"
											label="Load FolderTree Dictionary"
											oncommand="window.QF.QuickFolders.FolderTree.loadDictionary();" 
											class="menuitem-iconic"
											/>														
					  <menuitem id="QuickFolders-ToolbarPopup-dbg3"
						          label="Platform info - aboutHost()"
											oncommand="window.QF.QuickFolders.Util.aboutHost();"
											class="menuitem-iconic"
											/>
					  <menuitem id="QuickFolders-ToolbarPopup-dbg4"
						          label="Load Platform CSS"
											oncommand="window.QF.QuickFolders.Util.loadPlatformStylesheet();"
											class="menuitem-iconic"
											/>


					</menupopup>
				</menu>
				<menuitem id="QuickFolders-ToolbarPopup-find"
				          label="&qf.menuitem.quickfolders.find;"
				          accesskey="&qf.menuitem.quickfolders.findAccess;"
				          oncommand="window.QF.QuickFolders.Interface.findFolder(true,'quickJump');" 
				          class="cmd menuitem-iconic"
				          tagName="qfFindFolder"
									collapsed="true"
				          />
				<menuitem id="QuickFolders-ToolbarPopup-options"
				          label="&qf.menuitem.quickfolders.options;"
				          accesskey="&qf.menuitem.quickfolders.optionsAccess;"
				          oncommand="window.QF.QuickFolders.Interface.viewOptions(-1);" 
				          class="cmd menuitem-iconic"
				          tagName="qfOptions"
				          />
				<menuitem id="QuickFolders-ToolbarPopup-filterMode"
				          label="&qf.menuitem.quickfolders.filters;"
				          accesskey="&qf.menuitem.quickfolders.filtersAccess;"
				          oncommand="window.QF.QuickFolders.Interface.toggle_FilterMode(!QuickFolders.FilterWorker.FilterMode);"
				          class="cmd menuitem-iconic"
				          tagName="qfFilter"
				          />
				<menuitem id="QuickFolders-ToolbarPopup-paintBucket"
				          label="&qf.menuitem.quickfolders.togglePaintMode;"
				          accesskey="&qf.menuitem.quickfolders.togglePaintModeAccess;"
				          oncommand="window.QF.QuickFolders.Interface.togglePaintMode('toggle');"
				          class="cmd menuitem-iconic"
				          tagName="qfPaintBucket"
				          context="QuickFolders-Palette"
				          />
				<menuitem id="QuickFolders-ToolbarPopup-changeOrder"
				          label="&qf.menuitem.quickfolders.changeOrder;"
				          accesskey="&qf.menuitem.quickfolders.changeOrderAccess;"
				          oncommand="window.QF.QuickFolders.Interface.viewChangeOrder();"
				          class="cmd menuitem-iconic"
				          tagName="qfOrder"
				          />
				<menuitem id="QuickFolders-ToolbarPopup-support"
				          label="&qf.menuitem.quickfolders.support;"
				          accesskey="&qf.menuitem.quickfolders.supportAccess;"
				          oncommand="window.QF.QuickFolders.Interface.viewSupport();"
				          class="cmd menuitem-iconic"
				          tagName="qfSupport"
				          />
				<menuitem id="QuickFolders-ToolbarPopup-help"
				          label="&qf.menuitem.quickfolders.help;"
				          accesskey="&qf.menuitem.quickfolders.helpAccess;"
				          oncommand="window.QF.QuickFolders.Interface.viewHelp();" 
				          class="cmd menuitem-iconic"
				          tagName="qfHelp"
				          />
				<menuseparator />
				<menuitem id="QuickFolders-ToolbarPopup-refresh"
				          label="&qf.menuitem.quickfolders.repairTabs;"
				          accesskey="&qf.menuitem.quickfolders.repairTabsAccess;"
				          oncommand="window.QF.QuickFolders.Interface.updateMainWindow();" 
				          class="cmd menuitem-iconic"
				          tagName="qfRebuild"
				          />
				<menuitem id="QuickFolders-ToolbarPopup-repair"
				          label="&qf.menuitem.quickfolders.repairTreeIcons;"
				          oncommand="window.QF.QuickFolders.Interface.repairTreeIcons();" 
				          class="cmd menuitem-iconic"
				          tagName="qfRepairTreeIcons"
				          />
				<menuitem id="QuickFolders-ToolbarPopup-tidy"
				          label="&qf.menuitem.quickfolders.deleteDeadTabs;"
				          accesskey="&qf.menuitem.quickfolders.deleteDeadTabsAccess;"
				          oncommand="window.QF.QuickFolders.Interface.tidyDeadFolders();" 
				          class="cmd menuitem-iconic"
				          tagName="qfTidyTabs"
				          />
				<menuseparator />
				<menuitem id="QuickFolders-ToolbarPopup-displayPreviewToolbar"
				          label="&qf.menuitem.quickfolders.displayPreviewToolbar;"
				          accesskey="&qf.menuitem.quickfolders.displayPreviewToolbarAccessKey;"
				          oncommand="window.QF.QuickFolders.Interface.displayNavigationToolbar(true,'?');"
				          class="cmd menuitem-iconic"
				          tagName="qfPreviewToolbar" 
				          />
				<menuitem id="QuickFolders-ToolbarPopup-register"
				          label="&qf.menuitem.quickfolders.register;"
				          oncommand="window.QF.QuickFolders.Licenser.showDialog('mainPopup');"
				          class="cmd menuitem-iconic free"
				          tagName="qfRegister"
				          />
			</menupopup>
		</popupset>


		<vbox id="QuickFolders-Folders-Pane"  flex="1">
			<spacer flex="4" id="QuickFolders-FoldersBox-PushDown"/>
			
			<box id="QuickFolders-FoldersBox" flex="1" class="folderBarContainer">
				<label id="QuickFolders-Instructions-Label" crop="end">&qf.label.dragFolderLabel;</label>
			</box>
		</vbox>
		</toolbar>
`, 
	["chrome://quickfolders/locale/overlay.dtd"]);
	// Add the parsed fragment to the UI.
	window.document.getElementById("mail-toolbox").appendChild(QuickFoldersToolbar);


	//append to folderPaneContext
	let folderPaneContextMenuItems = window.MozXULElement.parseXULToFragment(`
    <menuitem id="context-quickFoldersIcon"
              label="&qf.foldercontextmenu.quickfolders.customizeIcon;"
			  tag="qfIconAdd"
              class="qfElement menuitem-iconic"
              insertafter="folderPaneContext-properties"
              oncommand="window.QF.QuickFolders.Interface.onSelectIcon(this,event);"/>
    <menuitem id="context-quickFoldersRemoveIcon"
              label="&qf.foldercontextmenu.quickfolders.removeIcon;"
			  tag="qfIconRemove"
              class="qfElement menuitem-iconic"
              insertafter="context-quickFoldersIcon"
              oncommand="window.QF.QuickFolders.Interface.onRemoveIcon(this,event);"/>
`, 
	["chrome://quickfolders/locale/overlay.dtd"]);
	window.document.getElementById("folderPaneContext").appendChild(folderPaneContextMenuItems);
	
	let documentRoot = window.MozXULElement.parseXULToFragment(`	
	<html:link rel="stylesheet" href="chrome://quickfolders/content/scripts/test.css"/>
	<keyset class="qfElement">
		<key id="quickFolders-ToggleTree" keycode="VK_F9" oncommand="window.QF.QuickFolders.Interface.toggleFolderTree();"/>
	</keyset>
`, 
	["chrome://quickfolders/locale/overlay.dtd"]);

	// Add the parsed fragment to the UI.
	window.document.documentElement.appendChild(documentRoot);
	
	QuickFolders.Util.logDebug('Adding Folder Listener...');
	QuickFolders_mailSession.AddFolderListener(QuickFolders.FolderListener, Components.interfaces.nsIFolderListener.all);
    QuickFolders.addLoadEventListener();
	
}

function onUnload(window, isAddOnShutDown) {
	// Remove all our elementsof class qfElement
	let elements = Array.from(window.document.getElementsByClassName("qfElement"));
	console.log(elements);
	for (let element of elements) {
		console.log("Removing: " + (element.id || element.tagName))
		element.remove();
	}
}
