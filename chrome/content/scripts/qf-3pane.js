

async function onLoad(activatedWhileWindowOpen) {
  let WAIT_FOR_3PANE = 5000;
  // const win = window;
  console.log("qf-3pane.js - onLoad()");
  window.QuickFolders = window.parent.QuickFolders;
  // let's make sure 3Pane is really ready (we might want to attach this to a window.DOMContentLoaded event instead)
  window.setTimeout( 
    (win = window) => {
    console.log("QuickFolders: injecting 3pane");
    win.QuickFolders.Util.logDebug(`============INJECT==========\nqf-3pane.js onLoad(${activatedWhileWindowOpen})`);
    let layout = WL.injectCSS("chrome://quickfolders/content/quickfolders-layout.css");
    let layout2 = WL.injectCSS("chrome://quickfolders/content/quickfolders-tools.css");
    // current folder bar specific styling
    let layout3 = WL.injectCSS("chrome://quickfolders/content/skin/quickfolders-navigation.css"); 
    WL.injectCSS("chrome://quickfolders/content/quickfolders-filters.css");

    //------------------------------------ overlay current folder (navigation bar)
    // inject into <vbox id="messagepanebox"> !!


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
          oncommand="QuickFolders.Interface.displayNavigationToolbar(false);" />

      </toolbar>
      
      <span flex="5" id="QF-CurrentRightSpacer"> </span>
    </hbox>
</vbox>
    `);
/*
<!-- if conversation view (extension) is active ?? then the browser element multimessage will be visible
    in this case we need to move the toolbar panel into the messagepanebox before multimessage
    <hbox id="QuickFolders-PreviewToolbarPanel-ConversationView" class=QuickFolders-PreviewToolbarPanel insertbefore="multimessage">
    
    </hbox>
-->
*/
    // main window: win.parent

    // relocated to make it visible (bottom of thread)
    win.QuickFolders.Interface.liftNavigationbar(win.document);    // passes HTMLDocument "about:3pane"
    },
    WAIT_FOR_3PANE
  );

}