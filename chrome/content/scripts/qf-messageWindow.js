var { Services } = ChromeUtils.import("resource://gre/modules/Services.jsm");

Services.scriptloader.loadSubScript("chrome://quickfolders/content/quickfolders.js", window, "UTF-8");
Services.scriptloader.loadSubScript("chrome://quickfolders/content/quickfolders-listener.js", window, "UTF-8");
Services.scriptloader.loadSubScript("chrome://quickfolders/content/quickfolders-preferences.js", window, "UTF-8");
Services.scriptloader.loadSubScript("chrome://quickfolders/content/quickfolders-themes.js", window, "UTF-8");
Services.scriptloader.loadSubScript("chrome://quickfolders/content/quickfolders-util.js", window, "UTF-8");
Services.scriptloader.loadSubScript("chrome://quickfolders/content/quickfolders-interface.js", window, "UTF-8");
Services.scriptloader.loadSubScript("chrome://quickfolders/content/quickfolders-quickMove.js", window, "UTF-8");
Services.scriptloader.loadSubScript("chrome://quickfolders/content/quickmove-settings.js", window, "UTF-8");
Services.scriptloader.loadSubScript("chrome://quickfolders/content/quickfolders-model.js", window, "UTF-8");
Services.scriptloader.loadSubScript("chrome://quickfolders/content/quickfolders-folder-category.js", window, "UTF-8");
Services.scriptloader.loadSubScript("chrome://quickfolders/content/qf-styles.js", window, "UTF-8");
Services.scriptloader.loadSubScript("chrome://quickfolders/content/options.js", window, "UTF-8");

function onLoad(activatedWhileWindowOpen) {
    let layout = WL.injectCSS("chrome://quickfolders/content/quickfolders-layout.css");
    layout.setAttribute("title", "QuickFolderStyles");
    
    let layout1 = WL.injectCSS("chrome://quickfolders/content/quickfolders-palettes.css");
    layout1.setAttribute("title", "QuickFolderPalettes");
    
    WL.injectCSS("chrome://quickfolders/content/skin/quickfolders-widgets.css");
    WL.injectCSS("chrome://quickfolders/content/quickfolders-68.css");
    WL.injectCSS("chrome://quickfolders/content/quickfolders-mods.css");

    

    WL.injectElements(`
    <menupopup id="QuickFolders-currentContextMenuSingle">
    <menuitem  label="Thunderbird12-currentFolderSingleMessage" />
</menupopup>

<vbox id="messagepanebox">
    <hbox id="QuickFolders-PreviewToolbarPanel-Single" insertbefore="singlemessage" style="display:none;">
        <spacer flex="5" id="QF-CurrentLeftSpacer" style="min-width:5px;" />
        <toolbar id="QuickFolders-CurrentFolderTools" iconsize="small">
            <toolbarbutton id="QuickFolders-CurrentMail"
                             class="icon draggable"
                             tooltiptext="__MSG_qf.tooltip.emailIcon__" />
            <toolbarseparator special="qfMsgFolderNavigation"  />
            <toolbarbutton id="quickFoldersPreviousUnread"
                                   class="icon"
                             special="qfMsgFolderNavigation" 
                             tooltiptext="__MSG_qf.tooltip.goPreviousFolder__"
                             onclick="QuickFolders.Interface.onGoPreviousMsg(this, true);" />
            <toolbarbutton id="quickFoldersNavToggle" 
                             special="qfMsgFolderNavigation" 
                             tooltiptext="__MSG_qf.tooltip.quickFoldersNavToggle__"
                             onclick="QuickFolders.Interface.onToggleNavigation(this);" />
            <toolbarbutton id="quickFoldersNextUnread"
                                   class="icon"
                             special="qfMsgFolderNavigation" 
                             tooltiptext="__MSG_qf.tooltip.goNextFolder__"
                             onclick="QuickFolders.Interface.onGoNextMsg(this, true);" />
            <toolbarbutton id="QuickFolders-CurrentThread"
                             class="icon"
                             special="qfMsgFolderNavigation" 
                                         oncommand="QuickFolders.Interface.onClickThreadTools(event.target, event); return false;"
                             tooltiptext="__MSG_qf.tooltip.conversationRead__" />`
                             +

  //          <!-- skip folder -->
  `
            <toolbarbutton id="quickFoldersSkipFolder"
                                         class="icon"
                                         special="qfMsgFolderNavigation" 
                                         oncommand="QuickFolders.Interface.onSkipFolder(this);"
                                         tooltiptext="__MSG_qf.tooltip.skipUnreadFolder__" />
            <toolbarseparator id="QuickFolders-Navigate-Separator" />
            <toolbarbutton id="QuickFolders-NavigateUp"
                             class="icon"
                             onclick="QuickFolders.Interface.goUpFolder();"
                             tooltiptext="__MSG_qf.tooltip.folderUp__"
                             collapsed="true"/>
            <toolbarbutton id="QuickFolders-NavigateLeft"
                             class="icon"
                             onclick="QuickFolders.Interface.goPreviousSiblingFolder();"
                             collapsed="true"/>
            <hbox class="folderBarContainer" xulPlatform="xul12">
                <toolbarbutton id="QuickFoldersCurrentFolder"
                               label="Current Folder"
                               class="selected-folder"
                               ondragenter="QuickFolders.buttonDragObserver.dragEnter(event);"
                               ondragover="QuickFolders.buttonDragObserver.dragOver(event);"/>
            </hbox>
            <toolbarbutton id="QuickFolders-NavigateRight"
                             class="icon"
                             onclick="QuickFolders.Interface.goNextSiblingFolder();"
                             collapsed="true"/>
            <toolbarseparator id="QuickFolders-Navigate-Separator2" />
            <toolbarbutton id="QuickFolders-currentFolderMailFolderCommands"
                             class="icon"
                             tooltiptext="__MSG_qf.tooltip.mailFolderCommands__"
                             onclick="QuickFolders.Interface.showCurrentFolderMailContextMenu(event.target);"
                             oncontextmenu="QuickFolders.Interface.showCurrentFolderMailContextMenu(event.target);" 
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
            <toolbarbutton id="QuickFolders-Options"
                             class="icon"
                             tooltiptext="__MSG_qf.menuitem.quickfolders.options__"
                             oncommand="QuickFolders.Interface.viewOptions(-1);"
                             tagName="qfOptions"
                             context="QuickFolders-currentContextMenuSingle"
                             oncontextmenu="QuickFolders.Interface.showPopup(this,this.getAttribute('context'));"/>
            <toolbarbutton id="QuickFolders-Close"
                             class="icon"
                             tooltiptext="__MSG_qf.tooltip.closeToolbar__"
                             oncommand="QuickFolders.Interface.displayNavigationToolbar(false,'messageWindow');" />
        </toolbar>
        <spacer flex="5" id="QF-CurrentRightSpacer" style="min-width:5px !important;" />
    </hbox>
</vbox>

`);

/*
    // renamed QuickFolders-oneButtonPanel to QuickFolders-Toolbar to snatch css rules:
    WL.injectElements(`   
<vbox id="messagepanebox">    
  <hbox id="QuickFolders-PreviewToolbarPanel-Single">
    <hbox id="QuickFolders-Toolbar" insertbefore="QF-CurrentLeftSpacer">
      <hbox id="QuickFolders-oneButtonPanel">
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
          <search-textbox id="QuickFolders-FindFolder" 
                   oncommand="QuickFolders.Interface.findFolderName(this);"
                   onkeypress="QuickFolders.Interface.findFolderKeyPress(event);"
                   class="searchBox"
                   type="search"
                   collapsed="true"
                   placeholder="__MSG_quickfolders.findFolder.placeHolder__"/>
      </hbox>
       
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

      <vbox id="QuickFolders-Folders-Pane"  flex="1">
          <spacer flex="4" id="QuickFolders-FoldersBox-PushDown"/>
          
          <box id="QuickFolders-FoldersBox" flex="1" class="folderBarContainer">
      </box>
      
      </vbox>
    </hbox>
  </hbox>
</vbox>
`);
*/
        
    window.QuickFolders.Util.logDebug('Adding messageWindow...');
    // window.QuickFolders_mailSession.AddFolderListener(window.QuickFolders.FolderListener, Components.interfaces.nsIFolderListener.all);
    window.QuickFolders.initDelayed(window);
}

function onUnload(isAddOnShutDown) {
}
