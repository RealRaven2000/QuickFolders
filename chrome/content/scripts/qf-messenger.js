var { Services } = ChromeUtils.import("resource://gre/modules/Services.jsm");

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

function onLoad(wasAlreadyOpen) {

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
	  <toolbarpalette class="${namespace}">
		<toolbarbutton id="QuickFolders-toolbar-button" 
			class="toolbarbutton-1 chromeclass-toolbar-additional"
			label="&qf.toolbar.quickfolders.toolbar;" 
			tooltiptext="&qf.toolbar.quickfolders.toolbar;"
			oncommand="${namespace}.QuickFolders.Interface.toggleToolbar(this);"
			checked="true"
			/>
	  <toolbarbutton id="QuickFolders-createfolder" 
			class="toolbarbutton-1 chromeclass-toolbar-additional"
			label="&quickfolders.toolbar.newsubfolder;" 
			tooltiptext="&quickfolders.toolbar.newsubfolder;" 
			oncommand="${namespace}.QuickFolders.Interface.onCreateInstantFolder();"
		  />
		<toolbarbutton id="QuickFolders-skipfolder"
			class="toolbarbutton-1 chromeclass-toolbar-additional"
			label="&quickfolders.toolbar.skip;" 
			tooltiptext="&qf.tooltip.skipUnreadFolder;" 
			oncommand="${namespace}.QuickFolders.Interface.onSkipFolder(null);"
		  />
	  </toolbarpalette>		  
`, 
	["chrome://quickfolders/locale/overlay.dtd"]);
	// Add the parsed fragment to the UI.
	window.document.documentElement.appendChild(toolbarpalette);


	// append to mail-toolbox
	let QuickFoldersToolbar = window.MozXULElement.parseXULToFragment(`
		<toolbar
			id="QuickFolders-Toolbar"
			toolbarname="QuickFolders Toolbar"
			class="${namespace} toolbar-primary"
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
				               oncommand="${namespace}.QuickFolders.Interface.clickTitleLabel(this);"
											 label="&qf.label.quickfolders;" />
			</vbox>
			
		</hbox>
		
		<popupset id="QuickFolders-Palette" xmlns="http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul">
			<menupopup id="QuickFolders-PalettePopup" 
			           class="QuickFolders-folder-popup" 
								 xmlns="http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul"
								 onclick="${namespace}.QuickFolders.Interface.clickHandler(event,this);">
			</menupopup>
			<menupopup id="QuickFolders-FindPopup" 
			           class="menu-iconic widerMenu" 
					   position="after_start"
					   oncommand="${namespace}.QuickFolders.Interface.selectFound(this, event);"
					   onkeypress="${namespace}.QuickFolders.Interface.foundInput(this, event);"
					   onblur="${namespace}.QuickFolders.Interface.findPopupBlur(this, event);"
					   ignorekeys="false">
			</menupopup>
		</popupset>

		<popupset id="QuickFolders-QuickMovePopupSet">
			<menupopup id="QuickFolders-quickMoveMenu">
				<menuitem id="QuickFolders-quickMove-suspend"
				          label="&quickfolders.quickMove.menu.suspend;"
				          oncommand="${namespace}.QuickFolders.quickMove.toggleSuspendMove(this);" 
				          type="checkbox"
				          />
				<menuitem id="QuickFolders-quickMove-cancel"
				          label="&quickfolders.quickMove.menu.cancel;"
				          oncommand="${namespace}.QuickFolders.quickMove.cancel();" 
				          collapsed="true"
				          />
				<menuitem id="QuickFolders-quickMove-showSearch"
				          label="&quickfolders.quickMove.menu.showSearch;"
				          oncommand="${namespace}.QuickFolders.quickMove.showSearch();" 
				          />
				<menuitem id="QuickFolders-quickMove-hideSearch"
				          label="&quickfolders.quickMove.menu.hideSearch;"
				          oncommand="${namespace}.QuickFolders.quickMove.hideSearch();" 
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
				          oncommand="${namespace}.QuickFolders.bookmarks.resetList(true);" 
				          />
				<menuitem id="QuickFolders-readingList-add"
				          label="&quickfolders.readingList.addCurrent;"
									class="cmd"
				          oncommand="${namespace}.QuickFolders.bookmarks.addCurrent();" 
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
											oncommand="${namespace}.QuickFolders.Interface.testTreeIcons();" 
											class="menuitem-iconic"
											/>
											
						<menuitem id="QuickFolders-ToolbarPopup-dbg2"
											label="Load FolderTree Dictionary"
											oncommand="${namespace}.QuickFolders.FolderTree.loadDictionary();" 
											class="menuitem-iconic"
											/>														
					  <menuitem id="QuickFolders-ToolbarPopup-dbg3"
						          label="Platform info - aboutHost()"
											oncommand="${namespace}.QuickFolders.Util.aboutHost();"
											class="menuitem-iconic"
											/>
					  <menuitem id="QuickFolders-ToolbarPopup-dbg4"
						          label="Load Platform CSS"
											oncommand="${namespace}.QuickFolders.Util.loadPlatformStylesheet();"
											class="menuitem-iconic"
											/>


					</menupopup>
				</menu>
				<menuitem id="QuickFolders-ToolbarPopup-find"
				          label="&qf.menuitem.quickfolders.find;"
				          accesskey="&qf.menuitem.quickfolders.findAccess;"
				          oncommand="${namespace}.QuickFolders.Interface.findFolder(true,'quickJump');" 
				          class="cmd menuitem-iconic"
				          tagName="qfFindFolder"
									collapsed="true"
				          />
				<menuitem id="QuickFolders-ToolbarPopup-options"
				          label="&qf.menuitem.quickfolders.options;"
				          accesskey="&qf.menuitem.quickfolders.optionsAccess;"
				          oncommand="${namespace}.QuickFolders.Interface.viewOptions(-1);" 
				          class="cmd menuitem-iconic"
				          tagName="qfOptions"
				          />
				<menuitem id="QuickFolders-ToolbarPopup-filterMode"
				          label="&qf.menuitem.quickfolders.filters;"
				          accesskey="&qf.menuitem.quickfolders.filtersAccess;"
				          oncommand="${namespace}.QuickFolders.Interface.toggle_FilterMode(!QuickFolders.FilterWorker.FilterMode);"
				          class="cmd menuitem-iconic"
				          tagName="qfFilter"
				          />
				<menuitem id="QuickFolders-ToolbarPopup-paintBucket"
				          label="&qf.menuitem.quickfolders.togglePaintMode;"
				          accesskey="&qf.menuitem.quickfolders.togglePaintModeAccess;"
				          oncommand="${namespace}.QuickFolders.Interface.togglePaintMode('toggle');"
				          class="cmd menuitem-iconic"
				          tagName="qfPaintBucket"
				          context="QuickFolders-Palette"
				          />
				<menuitem id="QuickFolders-ToolbarPopup-changeOrder"
				          label="&qf.menuitem.quickfolders.changeOrder;"
				          accesskey="&qf.menuitem.quickfolders.changeOrderAccess;"
				          oncommand="${namespace}.QuickFolders.Interface.viewChangeOrder();"
				          class="cmd menuitem-iconic"
				          tagName="qfOrder"
				          />
				<menuitem id="QuickFolders-ToolbarPopup-support"
				          label="&qf.menuitem.quickfolders.support;"
				          accesskey="&qf.menuitem.quickfolders.supportAccess;"
				          oncommand="${namespace}.QuickFolders.Interface.viewSupport();"
				          class="cmd menuitem-iconic"
				          tagName="qfSupport"
				          />
				<menuitem id="QuickFolders-ToolbarPopup-help"
				          label="&qf.menuitem.quickfolders.help;"
				          accesskey="&qf.menuitem.quickfolders.helpAccess;"
				          oncommand="${namespace}.QuickFolders.Interface.viewHelp();" 
				          class="cmd menuitem-iconic"
				          tagName="qfHelp"
				          />
				<menuseparator />
				<menuitem id="QuickFolders-ToolbarPopup-refresh"
				          label="&qf.menuitem.quickfolders.repairTabs;"
				          accesskey="&qf.menuitem.quickfolders.repairTabsAccess;"
				          oncommand="${namespace}.QuickFolders.Interface.updateMainWindow();" 
				          class="cmd menuitem-iconic"
				          tagName="qfRebuild"
				          />
				<menuitem id="QuickFolders-ToolbarPopup-repair"
				          label="&qf.menuitem.quickfolders.repairTreeIcons;"
				          oncommand="${namespace}.QuickFolders.Interface.repairTreeIcons();" 
				          class="cmd menuitem-iconic"
				          tagName="qfRepairTreeIcons"
				          />
				<menuitem id="QuickFolders-ToolbarPopup-tidy"
				          label="&qf.menuitem.quickfolders.deleteDeadTabs;"
				          accesskey="&qf.menuitem.quickfolders.deleteDeadTabsAccess;"
				          oncommand="${namespace}.QuickFolders.Interface.tidyDeadFolders();" 
				          class="cmd menuitem-iconic"
				          tagName="qfTidyTabs"
				          />
				<menuseparator />
				<menuitem id="QuickFolders-ToolbarPopup-displayPreviewToolbar"
				          label="&qf.menuitem.quickfolders.displayPreviewToolbar;"
				          accesskey="&qf.menuitem.quickfolders.displayPreviewToolbarAccessKey;"
				          oncommand="${namespace}.QuickFolders.Interface.displayNavigationToolbar(true,'?');"
				          class="cmd menuitem-iconic"
				          tagName="qfPreviewToolbar" 
				          />
				<menuitem id="QuickFolders-ToolbarPopup-register"
				          label="&qf.menuitem.quickfolders.register;"
				          oncommand="${namespace}.QuickFolders.Licenser.showDialog('mainPopup');"
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
              class="${namespace} menuitem-iconic"
              insertafter="folderPaneContext-properties"
              oncommand="${namespace}.QuickFolders.Interface.onSelectIcon(this,event);"/>
    <menuitem id="context-quickFoldersRemoveIcon"
              label="&qf.foldercontextmenu.quickfolders.removeIcon;"
			  tag="qfIconRemove"
              class="${namespace} menuitem-iconic"
              insertafter="context-quickFoldersIcon"
              oncommand="${namespace}.QuickFolders.Interface.onRemoveIcon(this,event);"/>
`, 
	["chrome://quickfolders/locale/overlay.dtd"]);
	window.document.getElementById("folderPaneContext").appendChild(folderPaneContextMenuItems);
	
  debugger;
	let styleStuff1 = window.MozXULElement.parseXULToFragment(`	
  <html:link rel="stylesheet" href="chrome://quickfolders/content/quickfolders-layout.css"  title="QuickFolderStyles" />
`);  
  window.document.documentElement.appendChild(styleStuff1);
  // NOT WORKING, THROWS:
  // Content at moz-nullprincipal:{57c1344e-fea9-43ed-9ee5-0290b1f7741f} may not load or link to chrome://quickfolders/content/quickfolders-layout.css.
  
	let styleStuff = window.MozXULElement.parseXULToFragment(`	
  <html:link rel="stylesheet" href="chrome://quickfolders/content/quickfolders-layout.css"  title="QuickFolderStyles" />
  <html:link rel="stylesheet" href="chrome://quickfolders/content/quickfolders-thunderbird.css"  title="QuickFolderStyles" />
  <html:link rel="stylesheet" href="chrome://quickfolders/content/quickfolders-filters.css" title="QuickFoldersFilters" />
  <html:link rel="stylesheet" href="chrome://quickfolders/content/skin/quickfolders-widgets.css" />
  <html:link rel="stylesheet" href="chrome://quickfolders/content/qf-foldertree.css" />
	<keyset class="${namespace}">
		<key id="quickFolders-ToggleTree" keycode="VK_F9" oncommand="${namespace}.QuickFolders.Interface.toggleFolderTree();"/>
	</keyset>
`, 
	["chrome://quickfolders/locale/overlay.dtd"]);

	// Add the parsed fragment to the UI.
	window.document.documentElement.appendChild(styleStuff);
	
	QuickFolders.Util.logDebug('Adding Folder Listener...');
	QuickFolders_mailSession.AddFolderListener(QuickFolders.FolderListener, Components.interfaces.nsIFolderListener.all);
    QuickFolders.addLoadEventListener();
	
}

function onUnload(isAddOnShutDown) {
	// Remove all our elementsof class ${namespace}
	let elements = Array.from(window.document.getElementsByClassName(namespace));
	for (let element of elements) {
		console.log("Removing: " + (element.id || element.tagName))
		element.remove();
	}
}
