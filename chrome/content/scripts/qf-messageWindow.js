Services.scriptloader.loadSubScript("chrome://quickfolders/content/quickfolders.js", window, "UTF-8");
Services.scriptloader.loadSubScript("chrome://quickfolders/content/quickfolders-preferences.js", window, "UTF-8");
Services.scriptloader.loadSubScript("chrome://quickfolders/content/quickfolders-themes.js", window, "UTF-8");
Services.scriptloader.loadSubScript("chrome://quickfolders/content/quickfolders-util.js", window, "UTF-8");
Services.scriptloader.loadSubScript("chrome://quickfolders/content/quickfolders-interface.js", window, "UTF-8");
Services.scriptloader.loadSubScript("chrome://quickfolders/content/quickfolders-quickMove.js", window, "UTF-8");
Services.scriptloader.loadSubScript("chrome://quickfolders/content/quickmove-settings.js", window, "UTF-8");
Services.scriptloader.loadSubScript("chrome://quickfolders/content/quickfolders-model.js", window, "UTF-8");
Services.scriptloader.loadSubScript("chrome://quickfolders/content/quickfolders-folder-category.js", window, "UTF-8");
Services.scriptloader.loadSubScript("chrome://quickfolders/content/qf-styles.js", window, "UTF-8");

var mylisteners = {};

function onLoad(activatedWhileWindowOpen) {
  let layout = WL.injectCSS("chrome://quickfolders/content/quickfolders-layout.css");
  layout.setAttribute("title", "QuickFolderStyles");
  let layout2 = WL.injectCSS("chrome://quickfolders/content/quickfolders-tools.css");
  
  // version specific:
  WL.injectCSS("chrome://quickfolders-skins/content/qf-current.css");
  
  let layout1 = WL.injectCSS("chrome://quickfolders/content/quickfolders-palettes.css");
  layout1.setAttribute("title", "QuickFolderPalettes");
  
  WL.injectCSS("chrome://quickfolders/content/skin/quickfolders-widgets.css");
  WL.injectCSS("chrome://quickfolders/content/quickfolders-68.css");
  WL.injectCSS("chrome://quickfolders/content/quickfolders-mods.css");
  

  WL.injectElements(`

  <vbox id="messagepanebox">
      
      <hbox id="QuickFolders-PreviewToolbarPanel" 
            class="QuickFolders-NavigationPanel">
        <span flex="5" id="QF-CurrentLeftSpacer"> </span>
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
  
          <hbox class="folderBarContainer">
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
            tagName="qfOptions"/>
          <toolbarbutton id="QuickFolders-Close"
            class="icon"
            tooltiptext="__MSG_qf.tooltip.closeToolbar__"
            oncommand="QuickFolders.Interface.displayNavigationToolbar({display:false});" />
  
        </toolbar>
        
        <span flex="5" id="QF-CurrentRightSpacer"> </span>
      </hbox>
  </vbox>
      `);
        
  window.QuickFolders.Util.logDebug('Adding messageWindow...');
  window.QuickFolders.Util.notifyTools.enable();
  window.QuickFolders.Util.init();
  window.QuickFolders.quickMove.initLog();

  const QI = window.QuickFolders.Interface;
  mylisteners["updateUserStyles"] = QI.updateUserStyles.bind(QI);
  mylisteners["updateNavigationBar"] = QI.updateNavigationBar.bind(QI);
  mylisteners["toggleNavigationBars"] = QI.displayNavigationToolbar.bind(QI);
  for (let m in mylisteners) {
    window.addEventListener(`QuickFolders.BackgroundUpdate.${m}`, mylisteners[m]);
  }


  const prefs = window.QuickFolders.Preferences;
  let messageDoc = window.messageBrowser.contentDocument; // messagePaneBox
  // relocate to make it visible (bottom of thread)
  window.QuickFolders.Interface.liftNavigationbar(messageDoc);    // passes HTMLDocument "about:message"

  // single Message
  window.QuickFolders.Interface.displayNavigationToolbar(
    {
      display: prefs.isShowCurrentFolderToolbar("messageWindow"),
      doc: messageDoc,
      selector: "messageWindow"
    }
  ); 
  window.QuickFolders.Interface.updateNavigationBar(messageDoc);
  // should we allow the "run filters on selected messages" button ?
  // window.QuickFolders.Util.notifyTools.notifyBackground({ func: "updateQuickFilters" });

}

function onUnload(isAddOnShutDown) {
  window.QuickFolders.Util.notifyTools.disable();
  for (let m in mylisteners) {
    window.removeEventListener(`QuickFolders.BackgroundUpdate.${m}`, mylisteners[m]);
  }
}


window.document.addEventListener('DOMContentLoaded', 
  () => {
    window.QuickFolders.initSingleMsg(WL);
  }, 
  { once: true }
);