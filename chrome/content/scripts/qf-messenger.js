
console.log("load");

function onLoad(window, wasAlreadyOpen) {
	console.log("onload");
	// Get the label using an entry from the i18n locale JSON file in the _locales folder.
	// you currently do not have any JSON locales
	// let label = this.extension.localeData.localizeMessage("menuLabel");

	// Parse a XUL fragment
	// The oncommand attribute does not know "this", so we need to specify
	// the entiry hierachy, including "ListenerExampleAddon" namespace of this
	// JavaScript files as defined in messenger.WindowListener.startListening()
	// in background.js.
	
	// append to MailToolbarPalette
	let toolbarpalette = window.MozXULElement.parseXULToFragment(`
	  <toolbarbutton id="QuickFolders-toolbar-button" 
			class="qfElement toolbarbutton-1 chromeclass-toolbar-additional"
			label="&qf.toolbar.quickfolders.toolbar;" 
			tooltiptext="&qf.toolbar.quickfolders.toolbar;"
			oncommand="QuickFolders.Interface.toggleToolbar(this);"
			checked="true"
			/>
	  <toolbarbutton id="QuickFolders-createfolder" 
			class="qfElement toolbarbutton-1 chromeclass-toolbar-additional"
			label="&quickfolders.toolbar.newsubfolder;" 
			tooltiptext="&quickfolders.toolbar.newsubfolder;" 
			oncommand="QuickFolders.Interface.onCreateInstantFolder();"
		  />
		<toolbarbutton id="QuickFolders-skipfolder"
			class="qfElement toolbarbutton-1 chromeclass-toolbar-additional"
			label="&quickfolders.toolbar.skip;" 
			tooltiptext="&qf.tooltip.skipUnreadFolder;" 
			oncommand="QuickFolders.Interface.onSkipFolder(null);"
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
				               oncommand="QuickFolders.Interface.clickTitleLabel(this);"
											 label="&qf.label.quickfolders;" />
			</vbox>
			
		</hbox>
		
		<popupset id="QuickFolders-Palette" xmlns="http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul">
			<menupopup id="QuickFolders-PalettePopup" 
			           class="QuickFolders-folder-popup" 
								 xmlns="http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul"
								 onclick="QuickFolders.Interface.clickHandler(event,this);">
			</menupopup>
			<menupopup id="QuickFolders-FindPopup" 
			           class="menu-iconic widerMenu" 
					   position="after_start"
					   oncommand="QuickFolders.Interface.selectFound(this, event);"
					   onkeypress="QuickFolders.Interface.foundInput(this, event);"
					   onblur="QuickFolders.Interface.findPopupBlur(this, event);"
					   ignorekeys="false">
			</menupopup>
		</popupset>

		<popupset id="QuickFolders-QuickMovePopupSet">
			<menupopup id="QuickFolders-quickMoveMenu">
				<menuitem id="QuickFolders-quickMove-suspend"
				          label="&quickfolders.quickMove.menu.suspend;"
				          oncommand="QuickFolders.quickMove.toggleSuspendMove(this);" 
				          type="checkbox"
				          />
				<menuitem id="QuickFolders-quickMove-cancel"
				          label="&quickfolders.quickMove.menu.cancel;"
				          oncommand="QuickFolders.quickMove.cancel();" 
				          collapsed="true"
				          />
				<menuitem id="QuickFolders-quickMove-showSearch"
				          label="&quickfolders.quickMove.menu.showSearch;"
				          oncommand="QuickFolders.quickMove.showSearch();" 
				          />
				<menuitem id="QuickFolders-quickMove-hideSearch"
				          label="&quickfolders.quickMove.menu.hideSearch;"
				          oncommand="QuickFolders.quickMove.hideSearch();" 
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
				          oncommand="QuickFolders.bookmarks.resetList(true);" 
				          />
				<menuitem id="QuickFolders-readingList-add"
				          label="&quickfolders.readingList.addCurrent;"
									class="cmd"
				          oncommand="QuickFolders.bookmarks.addCurrent();" 
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
											oncommand="QuickFolders.Interface.testTreeIcons();" 
											class="menuitem-iconic"
											/>
											
						<menuitem id="QuickFolders-ToolbarPopup-dbg2"
											label="Load FolderTree Dictionary"
											oncommand="QuickFolders.FolderTree.loadDictionary();" 
											class="menuitem-iconic"
											/>														
					  <menuitem id="QuickFolders-ToolbarPopup-dbg3"
						          label="Platform info - aboutHost()"
											oncommand="QuickFolders.Util.aboutHost();"
											class="menuitem-iconic"
											/>
					  <menuitem id="QuickFolders-ToolbarPopup-dbg4"
						          label="Load Platform CSS"
											oncommand="QuickFolders.Util.loadPlatformStylesheet();"
											class="menuitem-iconic"
											/>


					</menupopup>
				</menu>
				<menuitem id="QuickFolders-ToolbarPopup-find"
				          label="&qf.menuitem.quickfolders.find;"
				          accesskey="&qf.menuitem.quickfolders.findAccess;"
				          oncommand="QuickFolders.Interface.findFolder(true,'quickJump');" 
				          class="cmd menuitem-iconic"
				          tagName="qfFindFolder"
									collapsed="true"
				          />
				<menuitem id="QuickFolders-ToolbarPopup-options"
				          label="&qf.menuitem.quickfolders.options;"
				          accesskey="&qf.menuitem.quickfolders.optionsAccess;"
				          oncommand="QuickFolders.Interface.viewOptions(-1);" 
				          class="cmd menuitem-iconic"
				          tagName="qfOptions"
				          />
				<menuitem id="QuickFolders-ToolbarPopup-filterMode"
				          label="&qf.menuitem.quickfolders.filters;"
				          accesskey="&qf.menuitem.quickfolders.filtersAccess;"
				          oncommand="QuickFolders.Interface.toggle_FilterMode(!QuickFolders.FilterWorker.FilterMode);"
				          class="cmd menuitem-iconic"
				          tagName="qfFilter"
				          />
				<menuitem id="QuickFolders-ToolbarPopup-paintBucket"
				          label="&qf.menuitem.quickfolders.togglePaintMode;"
				          accesskey="&qf.menuitem.quickfolders.togglePaintModeAccess;"
				          oncommand="QuickFolders.Interface.togglePaintMode('toggle');"
				          class="cmd menuitem-iconic"
				          tagName="qfPaintBucket"
				          context="QuickFolders-Palette"
				          />
				<menuitem id="QuickFolders-ToolbarPopup-changeOrder"
				          label="&qf.menuitem.quickfolders.changeOrder;"
				          accesskey="&qf.menuitem.quickfolders.changeOrderAccess;"
				          oncommand="QuickFolders.Interface.viewChangeOrder();"
				          class="cmd menuitem-iconic"
				          tagName="qfOrder"
				          />
				<menuitem id="QuickFolders-ToolbarPopup-support"
				          label="&qf.menuitem.quickfolders.support;"
				          accesskey="&qf.menuitem.quickfolders.supportAccess;"
				          oncommand="QuickFolders.Interface.viewSupport();"
				          class="cmd menuitem-iconic"
				          tagName="qfSupport"
				          />
				<menuitem id="QuickFolders-ToolbarPopup-help"
				          label="&qf.menuitem.quickfolders.help;"
				          accesskey="&qf.menuitem.quickfolders.helpAccess;"
				          oncommand="QuickFolders.Interface.viewHelp();" 
				          class="cmd menuitem-iconic"
				          tagName="qfHelp"
				          />
				<menuseparator />
				<menuitem id="QuickFolders-ToolbarPopup-refresh"
				          label="&qf.menuitem.quickfolders.repairTabs;"
				          accesskey="&qf.menuitem.quickfolders.repairTabsAccess;"
				          oncommand="QuickFolders.Interface.updateMainWindow();" 
				          class="cmd menuitem-iconic"
				          tagName="qfRebuild"
				          />
				<menuitem id="QuickFolders-ToolbarPopup-repair"
				          label="&qf.menuitem.quickfolders.repairTreeIcons;"
				          oncommand="QuickFolders.Interface.repairTreeIcons();" 
				          class="cmd menuitem-iconic"
				          tagName="qfRepairTreeIcons"
				          />
				<menuitem id="QuickFolders-ToolbarPopup-tidy"
				          label="&qf.menuitem.quickfolders.deleteDeadTabs;"
				          accesskey="&qf.menuitem.quickfolders.deleteDeadTabsAccess;"
				          oncommand="QuickFolders.Interface.tidyDeadFolders();" 
				          class="cmd menuitem-iconic"
				          tagName="qfTidyTabs"
				          />
				<menuseparator />
				<menuitem id="QuickFolders-ToolbarPopup-displayPreviewToolbar"
				          label="&qf.menuitem.quickfolders.displayPreviewToolbar;"
				          accesskey="&qf.menuitem.quickfolders.displayPreviewToolbarAccessKey;"
				          oncommand="QuickFolders.Interface.displayNavigationToolbar(true,'?');"
				          class="cmd menuitem-iconic"
				          tagName="qfPreviewToolbar" 
				          />
				<menuitem id="QuickFolders-ToolbarPopup-register"
				          label="&qf.menuitem.quickfolders.register;"
				          oncommand="QuickFolders.Licenser.showDialog('mainPopup');"
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
              oncommand="QuickFolders.Interface.onSelectIcon(this,event);"/>
    <menuitem id="context-quickFoldersRemoveIcon"
              label="&qf.foldercontextmenu.quickfolders.removeIcon;"
			  tag="qfIconRemove"
              class="qfElement menuitem-iconic"
              insertafter="context-quickFoldersIcon"
              oncommand="QuickFolders.Interface.onRemoveIcon(this,event);"/>
  </popup>	
`, 
	["chrome://quickfolders/locale/overlay.dtd"]);
	window.document.getElementById("folderPaneContext").appendChild(folderPaneContextMenuItems);
	
	let documentRoot = window.MozXULElement.parseXULToFragment(`
	<script type="application/javascript" src="chrome://quickfolders/content/quickfolders.js" />
	<script type="application/javascript" src="chrome://quickfolders/content/quickfolders-tablistener.js" />
	<script type="application/javascript" src="chrome://quickfolders/content/quickfolders-preferences.js" />
	<script type="application/javascript" src="chrome://quickfolders/content/quickfolders-themes.js" />
	<script type="application/javascript" src="chrome://quickfolders/content/quickfolders-filterWorker.js" />
	<script type="application/javascript" src="chrome://quickfolders/content/quickfolders-util.js" />
	<script type="application/javascript" src="chrome://quickfolders/content/quickfolders-interface.js" />
	<script type="application/javascript" src="chrome://quickfolders/content/quickfolders-rsa.js" />
	<script type="application/javascript" src="chrome://quickfolders/content/quickfolders-register.js" />
	<script type="application/javascript" src="chrome://quickfolders/content/quickfolders-quickMove.js" />
	<script type="application/javascript" src="chrome://quickfolders/content/quickfolders-bookmarks.js" />
	<script type="application/javascript" src="chrome://quickfolders/content/quickfolders-change-order.js" />
	<script type="application/javascript" src="chrome://quickfolders/content/quickfolders-model.js" />
	<script type="application/javascript" src="chrome://quickfolders/content/qf-advancedTab.js" />
	<script type="application/javascript" src="chrome://quickfolders/content/quickfolders-folderTree.js" />
	<script type="application/javascript" src="chrome://quickfolders/content/quickfolders-folder-category.js" />
	<script type="application/javascript" src="chrome://quickfolders/content/qf-styles.js" />
	<script type="application/javascript" src="chrome://quickfolders/content/quickfolders-listener.js" />
	
	<keyset class="qfElement">
		<key id="quickFolders-ToggleTree" keycode="VK_F9" oncommand="QuickFolders.Interface.toggleFolderTree();"/>
	</keyset>
`, 
	["chrome://quickfolders/locale/overlay.dtd"]);

	// Add the parsed fragment to the UI.
	window.document.appendChild(documentRoot);
	
	QuickFolders.Util.logDebug('Adding Folder Listener...');
	QuickFolders_mailSession.AddFolderListener(QuickFolders.FolderListener, Components.interfaces.nsIFolderListener.all);
    QuickFolders.addLoadEventListener();
	
}

function onUnload(window, isAddOnShutDown) {
	// Remove all our elementsof class qfElement
	let elements = window.document.getElementsByClassName("qfElement");
	for (let element of elements) {
		console.log("Removing: " + (element.id || element.tagName))
		element.remove();
	}
}
