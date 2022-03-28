var { Services } = ChromeUtils.import("resource://gre/modules/Services.jsm");

Services.scriptloader.loadSubScript("chrome://quickfolders/content/quickfolders.js", window, "UTF-8");
window.QuickFolders.WL = WL; // this will be used wherever Add-on version is needed.
Services.scriptloader.loadSubScript("chrome://quickfolders/content/quickfolders-preferences.js", window, "UTF-8");
Services.scriptloader.loadSubScript("chrome://quickfolders/content/quickfolders-themes.js", window, "UTF-8");
Services.scriptloader.loadSubScript("chrome://quickfolders/content/quickfolders-filterWorker.js", window, "UTF-8");
Services.scriptloader.loadSubScript("chrome://quickfolders/content/quickfolders-util.js", window, "UTF-8");
Services.scriptloader.loadSubScript("chrome://quickfolders/content/quickfolders-interface.js", window, "UTF-8");
Services.scriptloader.loadSubScript("chrome://quickfolders/content/quickfolders-quickMove.js", window, "UTF-8");
Services.scriptloader.loadSubScript("chrome://quickfolders/content/quickmove-settings.js", window, "UTF-8");
Services.scriptloader.loadSubScript("chrome://quickfolders/content/quickfolders-bookmarks.js", window, "UTF-8");
Services.scriptloader.loadSubScript("chrome://quickfolders/content/quickfolders-model.js", window, "UTF-8");
Services.scriptloader.loadSubScript("chrome://quickfolders/content/quickfolders-folderTree.js", window, "UTF-8");
Services.scriptloader.loadSubScript("chrome://quickfolders/content/quickfolders-folder-category.js", window, "UTF-8");
Services.scriptloader.loadSubScript("chrome://quickfolders/content/qf-styles.js", window, "UTF-8");
Services.scriptloader.loadSubScript("chrome://quickfolders/content/quickfolders-listener.js", window, "UTF-8");
Services.scriptloader.loadSubScript("chrome://quickfolders/content/quickfolders-tablistener.js", window, "UTF-8");
Services.scriptloader.loadSubScript("chrome://quickfolders/content/qf-scrollmenus.js", window, "UTF-8");

var mylisteners = {};

async function onLoad(activatedWhileWindowOpen) {
  let layout = WL.injectCSS("chrome://quickfolders/content/quickfolders-layout.css");
  layout.setAttribute("title", "QuickFolderStyles");
  
  // version specific:
  WL.injectCSS("chrome://quickfolders-skins/content/qf-current.css");  
         
  let tb = WL.injectCSS("chrome://quickfolders/content/quickfolders-thunderbird.css");
  
  WL.injectCSS("chrome://quickfolders/content/skin/quickfolders-widgets.css");
  WL.injectCSS("chrome://quickfolders/content/qf-foldertree.css");
  WL.injectCSS("chrome://quickfolders/content/quickfolders-filters.css");
  WL.injectCSS("chrome://quickfolders/content/quickfolders-68.css");
  WL.injectCSS("chrome://quickfolders/content/quickfolders-mods.css");

  WL.injectElements(`

    <keyset>
      <key id="quickFolders-ToggleTree" keycode="VK_F9" oncommand="QuickFolders.Interface.toggleFolderTree();"/>
    </keyset>

    <!-- Thunderbird & SeaMonkey -->
    <toolbarpalette id="MailToolbarPalette">
      <toolbarbutton id="QuickFolders-toolbar-button" 
            class="toolbarbutton-1 chromeclass-toolbar-additional"
            label="__MSG_qf.toolbar.quickfolders.toolbar__" 
            tooltiptext="__MSG_qf.toolbar.quickfolders.toolbar__"
            oncommand="QuickFolders.Interface.toggleToolbar(this);"
            checked="true"
            />
      <toolbarbutton id="QuickFolders-createfolder" 
            class="toolbarbutton-1 chromeclass-toolbar-additional"
            label="__MSG_quickfolders.toolbar.newsubfolder__" 
            tooltiptext="__MSG_quickfolders.toolbar.newsubfolder__" 
            oncommand="QuickFolders.Interface.onCreateInstantFolder();"
          />
      <toolbarbutton id="QuickFolders-skipfolder"
            class="toolbarbutton-1 chromeclass-toolbar-additional"
            label="__MSG_quickfolders.toolbar.skip__" 
            tooltiptext="__MSG_qf.tooltip.skipUnreadFolder__" 
            oncommand="QuickFolders.Interface.onSkipFolder(null);"
          />
    </toolbarpalette>


    <toolbox id="mail-toolbox">
      <toolbar
            id="QuickFolders-Toolbar"
            toolbarname="QuickFolders Toolbar"
            class="toolbar-primary contentTabToolbar"
            ondragover="(QuickFolders.toolbarDragObserver).dragOver(event);"
            ondrop="(QuickFolders.toolbarDragObserver).drop(event);"
            ondragenter="QuickFolders.toolbarDragObserver.debug_log(event);"
            dragdroparea="QuickFolders-FoldersBox"
            customizable="false"
            context="QuickFolders-ToolbarPopup"
            flex="10" >
        <hbox id="QuickFolders-left" align="center">
          <vbox id="QuickFolders-LabelBox" flex="0">
            <toolbarbutton id="QuickFolders-title-label" 
                           oncommand="QuickFolders.Interface.clickTitleLabel(this);"
                                         label="__MSG_qf.label.quickfolders__" />
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
                      label="__MSG_quickfolders.quickMove.menu.suspend__"
                      oncommand="QuickFolders.quickMove.toggleSuspendMove(this);" 
                      type="checkbox"
                      />
            <menuitem id="QuickFolders-quickMove-cancel"
                      label="__MSG_quickfolders.quickMove.menu.cancel__"
                      oncommand="QuickFolders.quickMove.cancel();" 
                      collapsed="true"
                      />
            <menuitem id="QuickFolders-quickMove-showSearch"
                      label="__MSG_quickfolders.quickMove.menu.showSearch__"
                      oncommand="QuickFolders.quickMove.showSearch();" 
                      />
            <menuitem id="QuickFolders-quickMove-hideSearch"
                      label="__MSG_quickfolders.quickMove.menu.hideSearch__"
                      oncommand="QuickFolders.quickMove.hideSearch();" 
                      collapsed="true"
                      />
          </menupopup>
        </popupset>	
        
        <popupset id="QuickFolders-ReadingListPopupSet">
          <menupopup id="QuickFolders-readingListMenu" class="widerMenu">
            <menuitem id="QuickFolders-readingList-reset"
                      label="__MSG_quickfolders.readingList.clear__"
                                class="cmd"
                                collapsed="true"
                      oncommand="QuickFolders.bookmarks.resetList(true);" 
                      />
            <menuitem id="QuickFolders-readingList-add"
                      label="__MSG_quickfolders.readingList.addCurrent__"
                                class="cmd"
                      oncommand="QuickFolders.bookmarks.addCurrent();" 
                      />
          </menupopup>
        </popupset>	
        
        <popupset id="QuickFolders-MainPopupSet">
          <menupopup id="QuickFolders-ToolbarPopup" class="QuickFolders-folder-popup">
            <!-- debug submenu -->
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
                <menuitem id="QuickFolders-ToolbarPopup-dbg2"
                                    label="Force Tree Refresh"
                                    oncommand="QuickFolders.FolderTree.refreshTree();" 
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
                      label="__MSG_qf.menuitem.quickfolders.find__"
                      accesskey="__MSG_qf.menuitem.quickfolders.findAccess__"
                      oncommand="QuickFolders.Interface.findFolder(true,'quickJump');" 
                      class="cmd menuitem-iconic"
                      tagName="qfFindFolder"
                      collapsed="true"
                      />
            <menuitem id="QuickFolders-ToolbarPopup-options"
                      label="__MSG_qf.menuitem.quickfolders.options__"
                      accesskey="__MSG_qf.menuitem.quickfolders.optionsAccess__"
                      oncommand="QuickFolders.Interface.viewOptions(-1);" 
                      class="cmd menuitem-iconic"
                      tagName="qfOptions"
                      />
            <menuitem id="QuickFolders-ToolbarPopup-options"
                      label="QuickFolders Options (classic)…"
                      oncommand="QuickFolders.Interface.viewOptionsLegacy(-1, null);" 
                      class="cmd menuitem-iconic"
                      tagName="qfOptions"
                      />                      
            <menuitem id="QuickFolders-ToolbarPopup-splash"
                      label="__MSG_qf.menuitem.quickfolders.splash__"
                      oncommand="QuickFolders.Interface.viewSplash();" 
                      class="cmd menuitem-iconic"
                      tagName="qfSplash"
                      />
                      
            <menuitem id="QuickFolders-ToolbarPopup-filterMode"
                      label="__MSG_qf.menuitem.quickfolders.filters__"
                      accesskey="__MSG_qf.menuitem.quickfolders.filtersAccess__"
                      oncommand="QuickFolders.Interface.toggle_FilterMode(!QuickFolders.FilterWorker.FilterMode);"
                      class="cmd menuitem-iconic"
                      tagName="qfFilter"
                      />
            <menuitem id="QuickFolders-ToolbarPopup-paintBucket"
                      label="__MSG_qf.menuitem.quickfolders.togglePaintMode__"
                      accesskey="__MSG_qf.menuitem.quickfolders.togglePaintModeAccess__"
                      oncommand="QuickFolders.Interface.togglePaintMode('toggle');"
                      class="cmd menuitem-iconic"
                      tagName="qfPaintBucket"
                      context="QuickFolders-Palette"
                      />
            <menuitem id="QuickFolders-ToolbarPopup-changeOrder"
                      label="__MSG_qf.menuitem.quickfolders.changeOrder__"
                      accesskey="__MSG_qf.menuitem.quickfolders.changeOrderAccess__"
                      oncommand="QuickFolders.Interface.viewChangeOrder();"
                      class="cmd menuitem-iconic"
                      tagName="qfOrder"
                      />
            <menuitem id="QuickFolders-ToolbarPopup-support"
                      label="__MSG_qf.menuitem.quickfolders.support__"
                      accesskey="__MSG_qf.menuitem.quickfolders.supportAccess__"
                      oncommand="QuickFolders.Interface.viewSupport();"
                      class="cmd menuitem-iconic"
                      tagName="qfSupport"
                      />
            <menuitem id="QuickFolders-ToolbarPopup-help"
                      label="__MSG_qf.menuitem.quickfolders.help__"
                      accesskey="__MSG_qf.menuitem.quickfolders.helpAccess__"
                      oncommand="QuickFolders.Interface.viewHelp();" 
                      class="cmd menuitem-iconic"
                      tagName="qfHelp"
                      />
            <menuseparator />
            <menuitem id="QuickFolders-ToolbarPopup-refresh"
                      label="__MSG_qf.menuitem.quickfolders.repairTabs__"
                      accesskey="__MSG_qf.menuitem.quickfolders.repairTabsAccess__"
                      oncommand="QuickFolders.Util.notifyTools.notifyBackground({ func: 'updateMainWindow', minimal: false });" 
                      class="cmd menuitem-iconic"
                      tagName="qfRebuild"
                      />
            <menuitem id="QuickFolders-ToolbarPopup-repair"
                      label="__MSG_qf.menuitem.quickfolders.repairTreeIcons__"
                      oncommand="QuickFolders.Interface.repairTreeIcons();" 
                      class="cmd menuitem-iconic"
                      tagName="qfRepairTreeIcons"
                      />
            <menuitem id="QuickFolders-ToolbarPopup-tidy"
                      label="__MSG_qf.menuitem.quickfolders.deleteDeadTabs__"
                      accesskey="__MSG_qf.menuitem.quickfolders.deleteDeadTabsAccess__"
                      oncommand="QuickFolders.Interface.tidyDeadFolders();" 
                      class="cmd menuitem-iconic"
                      tagName="qfTidyTabs"
                      />
            <menuseparator />
            <menuitem id="QuickFolders-ToolbarPopup-displayPreviewToolbar"
                      label="__MSG_qf.menuitem.quickfolders.displayPreviewToolbar__"
                      accesskey="__MSG_qf.menuitem.quickfolders.displayPreviewToolbarAccessKey__"
                      oncommand="QuickFolders.Interface.displayNavigationToolbar(true);"
                      class="cmd menuitem-iconic"
                      tagName="qfPreviewToolbar" 
                      />
            <menuitem id="QuickFolders-ToolbarPopup-register"
                      label="__MSG_qf.menuitem.quickfolders.register__"
                      oncommand="QuickFolders.Interface.showLicenseDialog('mainPopup');"
                      class="cmd menuitem-iconic free"
                      tagName="qfRegister"
                      />
          </menupopup>
        </popupset>


        <!-- 		-->		
        <vbox id="QuickFolders-Folders-Pane"  flex="1">
          <spacer flex="4" id="QuickFolders-FoldersBox-PushDown"/>
          
          <box id="QuickFolders-FoldersBox" flex="1" class="folderBarContainer">
            <label class="QuickFolders-Empty-Toolbar-Label" crop="end">Initialising QuickFolders…</label>
          </box>
        <!-- 		-->		
        </vbox>
      </toolbar>
    </toolbox>
    
    
  <popup id="folderPaneContext">
    <menuitem id="context-quickFoldersIcon"
              label="__MSG_qf.foldercontextmenu.quickfolders.customizeIcon__"
              tag="qfIconAdd"
              class="menuitem-iconic"
              insertafter="folderPaneContext-properties"
              oncommand="QuickFolders.Interface.onSelectIcon(this,event);"/>
    <menuitem id="context-quickFoldersRemoveIcon"
              label="__MSG_qf.foldercontextmenu.quickfolders.removeIcon__"
              tag="qfIconRemove"
              class="menuitem-iconic"
              insertafter="context-quickFoldersIcon"
              oncommand="QuickFolders.Interface.onRemoveIcon(this,event);"/>
  </popup>	
`);


  //------------------------------------ overlay current folder (navigation bar)
  WL.injectElements(`
<hbox id="messagepaneboxwrapper">
  <vbox id="messagepanebox">

    <menupopup id="QuickFolders-currentContextMenuMessagesBox">
        <menuitem  label = "Thunderbird12/overlayCurrentfolder.xul (messagesBox)"/>
    </menupopup>
    <menupopup id="QuickFolders-currentContextMenu">
        <menuitem  label = "Thunderbird12/overlayCurrentfolder.xul (singlemessage)"/>
    </menupopup>
    
    <hbox id="QuickFolders-PreviewToolbarPanel" 
          position="1"
          insertbefore="multimessage"
          class="QuickFolders-NavigationPanel"
          style="display:none;">
      <spacer flex="5" id="QF-CurrentLeftSpacer"/>
      <toolbar id="QuickFolders-CurrentFolderTools" class="contentTabToolbar" iconsize="small">
        <toolbarbutton id="QuickFolders-CurrentMail"
                       class="icon draggable"
                       tooltiptext="__MSG_qf.tooltip.emailIcon__" />
        <toolbarbutton id="QuickFolders-Recent-CurrentFolderTool" tag="#Recent" class="recent icon"
                       context="QuickFolders-folder-popup-Recent-CurrentFolderTool"
                       position="after_start"
                       oncontextmenu="QuickFolders.Interface.onClickRecentCurrentFolderTools(event.target, event, true); return false;"
                       onclick= "QuickFolders.Interface.onClickRecentCurrentFolderTools(event.target, event, true); return false;"
                       ondragenter="QuickFolders.buttonDragObserver.dragEnter(event);"
                       ondragover="QuickFolders.buttonDragObserver.dragOver(event);"
                       tooltiptext="__MSG_qf.tooltip.RecentFolders__"/>
        <toolbarseparator special="qfMsgFolderNavigation" />
        <toolbarbutton id="quickFoldersPreviousUnread"
                       class="icon"
                       special="qfMsgFolderNavigation" 
                       tooltiptext="__MSG_qf.tooltip.goPreviousFolder__"
                       onclick="QuickFolders.Interface.onGoPreviousMsg(this);" />
        <toolbarbutton id="quickFoldersNavToggle" 
                       special="qfMsgFolderNavigation" 
                       tooltiptext="__MSG_qf.tooltip.quickFoldersNavToggle__"
                       onclick="QuickFolders.Interface.onToggleNavigation(this);" />
        <toolbarbutton id="quickFoldersNextUnread"
                       class="icon"
                       special="qfMsgFolderNavigation" 
                       tooltiptext="__MSG_qf.tooltip.goNextFolder__"
                       onclick="QuickFolders.Interface.onGoNextMsg(this);" />
        <toolbarbutton id="QuickFolders-CurrentThread"
                       class="icon"
                       special="qfMsgFolderNavigation" 
                       oncommand="QuickFolders.Interface.onClickThreadTools(event.target, event); return false;"
                       tooltiptext="__MSG_qf.tooltip.conversationRead__" />
                                     
        <toolbarbutton id="quickFoldersSkipFolder"
                       class="icon"
                       special="qfMsgFolderNavigation" 
                       oncommand="QuickFolders.Interface.onSkipFolder(this);"
                       tooltiptext="__MSG_qf.tooltip.skipUnreadFolder__" />
        <toolbarseparator id="QuickFolders-Navigate-Separator" />
        <toolbarbutton id="QuickFolders-NavigateUp"
                       class="icon"
                       onclick="QuickFolders.Interface.goUpFolder();"
                       tooltiptext="__MSG_qf.tooltip.folderUp__"/>
        <toolbarbutton id="QuickFolders-NavigateLeft"
                       class="icon"
                       onclick="QuickFolders.Interface.goPreviousSiblingFolder();"/>
        <hbox class="folderBarContainer" xulPlatform="xul12">
          <toolbarbutton id="QuickFoldersCurrentFolder"
                         label="Current Folder"
                         class="selected-folder"
                         ondragenter="QuickFolders.buttonDragObserver.dragEnter(event);"
                         ondragover="QuickFolders.buttonDragObserver.dragOver(event);"/>
        </hbox>
        <toolbarbutton id="QuickFolders-NavigateRight"
                       class="icon"
                       onclick="QuickFolders.Interface.goNextSiblingFolder();"/>
        <toolbarseparator id="QuickFolders-Navigate-Separator2" />
        <toolbarbutton id="QuickFolders-currentFolderMailFolderCommands"
                       class="icon"
                       tooltiptext="__MSG_qf.tooltip.mailFolderCommands__"
                       onclick="QuickFolders.Interface.showCurrentFolderMailContextMenu(event.target);"
                       oncontextmenu="QuickFolders.Interface.showCurrentFolderMailContextMenu(event.target);" 
                       collapsed="true"/>
        <toolbarbutton id="QuickFolders-RepairFolderBtn"
                       class="icon"
                       tooltiptext="Repair Folder..."
                       oncommand="QuickFolders.Interface.onRepairFolder(null);"
                       tag="qfIconRepairFolders"
                       collapsed="true"/>
                                       
        <hbox id="QuickFolders-currentFolderIconCommands" >
          <toolbarbutton id="QuickFolders-SelectIcon"
                         class="icon"
                         tooltiptext="__MSG_qf.foldercontextmenu.quickfolders.customizeIcon__"
                         oncommand="QuickFolders.Interface.onSelectIcon(this,event);"
                         tag="qfIconAdd"/>
          <toolbarbutton id="QuickFolders-RemoveIcon"
                         class="icon"
                         tooltiptext="__MSG_qf.foldercontextmenu.quickfolders.removeIcon__"
                         collapsed = "true"
                         oncommand="QuickFolders.Interface.onRemoveIcon(this,event);"
                         tag="qfIconRemove"/>
        </hbox>
        <toolbarbutton id="QuickFolders-currentFolderFilterActive"
                       class="icon"
                       tooltiptext="__MSG_qf.tooltip.filterStart__"
                       oncommand="QuickFolders.Interface.toggle_FilterMode(!QuickFolders.FilterWorker.FilterMode);" />
        <toolbarbutton id="QuickFolders-Options"
                       class="icon"
                       tooltiptext="__MSG_qf.menuitem.quickfolders.options__"
                       oncommand="QuickFolders.Interface.viewOptions(-1);"
                       tagName="qfOptions"
                       context="QuickFolders-currentContextMenu"
                       oncontextmenu="QuickFolders.Interface.showPopup(this,this.getAttribute('context'));"/>
        <toolbarbutton id="QuickFolders-Close"
                       class="icon"
                       tooltiptext="__MSG_qf.tooltip.closeToolbar__"
                       oncommand="QuickFolders.Interface.displayNavigationToolbar(false);" />
      </toolbar>
      <spacer flex="5" id="QF-CurrentRightSpacer" />
    </hbox>` +
/*
<!-- if conversation view (extension) is active ?? then the browser element multimessage will be visible
     in this case we need to move the toolbar panel into the messagepanebox before multimessage
    <hbox id="QuickFolders-PreviewToolbarPanel-ConversationView" class=QuickFolders-PreviewToolbarPanel insertbefore="multimessage">
    
    </hbox>
-->
*/
`
  </vbox>
</hbox>
`);


  //-----------------------------
  // qf-tools69.xul
  WL.injectElements(`
    
<hbox id="QuickFolders-left">
  <vbox id="QuickFolders-Tools-Pane" insertafter="QuickFolders-LabelBox">
    <hbox id="QuickFolders-Category-Box"
              ondragenter="QuickFolders.buttonDragObserver.dragEnter(event)">
      <menulist id="QuickFolders-Category-Selection" 
                          oncommand="QuickFolders.Interface.selectCategory(this.value,false,this,event);" 
                          sizetopopup="none" 
                          collapsed="true">
        <menupopup>
            <!-- filled dynamically from JS -->
        </menupopup>
      </menulist>
      <hbox id="QuickFolders-oneButtonPanel">
        <toolbarbutton id="QuickFolders-mainPopup"
                       class="popupButton"
                       tooltiptext="__MSG_qf.tooltip.mainOptions__"
                       context="QuickFolders-ToolbarPopup"
                       onclick="QuickFolders.Interface.showPopup(this,'QuickFolders-ToolbarPopup',event);"/>
        <toolbarbutton id="QuickFolders-filterActive"
                       tooltiptext="__MSG_qf.tooltip.filters__"
                       oncommand="QuickFolders.Interface.toggle_FilterMode(false);"
                       collapsed="true"/>
        <toolbarbutton id="QuickFolders-paintBucketActive"
                       label="ABC"
                       tooltiptext="__MSG_qf.tooltip.paintCanActive__"
                       context="QuickFolders-PalettePopup" 
                       oncommand="QuickFolders.Interface.showPalette(this);"
                       collapsed="true"/>
        <toolbarbutton id="QuickFolders-readingList"
                       class="popupButton"
                       tooltiptext="__MSG_quickfolders.readingList.tooltip__"
                       label=""
                       onclick="QuickFolders.Interface.readingListClick(event,this);"
                       ondrop="QuickFolders.buttonDragObserver.drop(event);"
                       ondragenter="QuickFolders.buttonDragObserver.dragEnter(event);"
                       ondragover="QuickFolders.buttonDragObserver.dragOver(event);"
                       context="QuickFolders-readingListMenu"
                       collapsed="true"/>
        <toolbarbutton id="QuickFolders-quickMove"
                       class="popupButton"
                       tooltiptext="__MSG_qf.tooltip.quickMove__"
                       label=""
                       onclick="QuickFolders.Interface.quickMoveButtonClick(event,this);"
                       ondrop="QuickFolders.buttonDragObserver.drop(event);"
                       ondragenter="QuickFolders.buttonDragObserver.dragEnter(event);"
                       ondragover="QuickFolders.buttonDragObserver.dragOver(event);"
                       context="QuickFolders-quickMoveMenu"
                       />
        <!-- removed searchbutton=true so pressing [Enter] is not necessary-->
        <search-textbox id="QuickFolders-FindFolder" 
                 oncommand="QuickFolders.Interface.findFolderName(this);"
                 onkeypress="QuickFolders.Interface.findFolderKeyPress(event);"
                 class="searchBox"
                 type="search"
                 collapsed="true"
                 placeholder="__MSG_quickfolders.findFolder.placeHolder__"/>
        <toolbarbutton id="QuickFolders-FindFolder-Help"
                       class = "popupButton"
                       label = ""
                       tooltiptext="help with search"
                       collapsed="true"
                       onclick="QuickFolders.Interface.quickMoveHelp(this);"
                       />
       </hbox>
    </hbox>
  </vbox>
</hbox>

`);

  // remove category to force selection when loading new version
  window.QuickFolders.Interface.currentActiveCategories = window.QuickFolders.FolderCategory.ALL;
  window.QuickFolders.prepareSessionStore();
  // window.QuickFolders.initDocAndWindow(window);
  
  
  // add listeners
  window.QuickFolders.Util.logDebug('Adding Folder Listener...');
  window.QuickFolders_mailSession.AddFolderListener(window.QuickFolders.FolderListener, Components.interfaces.nsIFolderListener.all);
  
  // Enable the global notify notifications from background.
  window.QuickFolders.Util.notifyTools.enable();
  await window.QuickFolders.Util.init();
  window.QuickFolders.quickMove.initLog();
  window.addEventListener("QuickFolders.BackgroundUpdate", window.QuickFolders.initLicensedUI);
  const QI = window.QuickFolders.Interface;
  
  mylisteners["updateFoldersUI"] = QI.updateFoldersUI.bind(QI);
  mylisteners["updateAllTabs"] = QI.updateAllTabs.bind(QI);
  mylisteners["updateUserStyles"] = QI.updateUserStyles.bind(QI);
  mylisteners["updateNavigationBar"] = QI.updateNavigationBar.bind(QI);
  mylisteners["toggleNavigationBar"] = QI.displayNavigationToolbar.bind(QI);
  mylisteners["updateQuickFoldersLabel"] = QI.updateQuickFoldersLabel.bind(QI);
  mylisteners["updateCategoryBox"] = QI.updateCategoryLayout.bind(QI);
  mylisteners["copyFolderEntriesToClipboard"] = QI.copyFolderEntriesToClipboard.bind(QI);
  mylisteners["pasteFolderEntriesFromClipboard"] = QI.pasteFolderEntriesFromClipboard.bind(QI);
  // function parameters in event.detail
  mylisteners["updateMainWindow"] = 
    (event) => QI.updateMainWindow.call(QI, event.detail ? event.detail.minimal : null); 
  mylisteners["currentDeckUpdate"] = QI.currentDeckUpdate.bind(QI); 
  mylisteners["initKeyListeners"] = window.QuickFolders.initKeyListeners.bind(window.QuickFolders);
  mylisteners["firstRun"] = window.QuickFolders.Util.FirstRun.init.bind(window.QuickFolders.Util.FirstRun);
  // store and load config
  const model =  window.QuickFolders.Model;
  mylisteners["loadConfigLegacy"] = (event) => model.loadConfig.call(model, event);
  mylisteners["storeConfigLegacy"] = (event) => model.storeConfig.call(model, event);
  
  
  for (let m in mylisteners) {
    window.addEventListener(`QuickFolders.BackgroundUpdate.${m}`, mylisteners[m]);
  }
  
  window.QuickFolders.initDelayed(WL); // should call updateMainWindow!
}

function onUnload(isAddOnShutDown) {
  // Disable the global notify notifications from background.
  window.QuickFolders.Util.notifyTools.disable();
  window.removeEventListener("QuickFolders.BackgroundUpdate", window.QuickFolders.initLicensedUI);

  for (let m in mylisteners) {
    window.removeEventListener(`QuickFolders.BackgroundUpdate.${m}` , mylisteners[m]);
  }
  
  // restore global overwritten functions 
  try {
    // window.QuickFolders.restoreSessionStore();
  }
  catch(ex) {
    console.log(ex);
  }
    
  // remove all listeners
  try {
    window.QuickFolders.Interface.removeToolbarHiding.call(window.QuickFolders.Interface);
    window.QuickFolders_mailSession.RemoveFolderListener(window.QuickFolders.FolderListener);
    window.QuickFolders.removeTabEventListener.call(window.QuickFolders);
    window.QuickFolders.removeFolderPaneListener.call(window.QuickFolders);
  }
  catch(ex) {
    console.log(ex);
  }
  
  
  // remove icon patch
  let treeView = window.gFolderTreeView;
  if (treeView) {
    // remove  custom flags!
    delete treeView["supportsIcons"];  
    delete treeView["qfIconsEnabled"];
    // remove my opwn function and restore the original
    if (window.QuickFolders.FolderTree.GetCellProperties) {
      window.gFolderTreeView.getCellProperties = window.QuickFolders.FolderTree.GetCellProperties;
      delete window.QuickFolders.FolderTree["GetCellProperties"];
    }
  }
}
