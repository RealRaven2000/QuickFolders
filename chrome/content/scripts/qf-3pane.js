/* 
  globals
    WL
*/


let windowMode = "";

var viewLayoutObserver = function () {
  const WAIT_FOR_VIEWSWITCH = 250;
  try {
    // if this gets implemented as a "per-tab setting", only execute on active tab:
    //   window.parent.gTabmail.currentTabInfo.tabId == window.tabOrWindow.tabId
    const isLayoutGlobal = true;
    if (isLayoutGlobal) {
      window.setTimeout( 
        () => {
          window.QuickFolders.Interface.liftNavigationbar(window.document);
        },
        WAIT_FOR_VIEWSWITCH
      );
    }
  }
  catch(ex) {
    window.QuickFolders.Util.logException("viewLayoutObserver", ex);
  }
}

async function notificationHandler(data) {
  let command = data.func || data.command || data.event;
  const isEvent = (data.event);
  const contentDoc = window.document;

  switch (command) {
    case "updateNavigationBar": {
      let tabInfo;
      try {
        tabInfo = contentDoc.defaultView.tabOrWindow.tabNode;
      } catch {;}      
      window.QuickFolders.Interface.updateNavigationBar(window.document, tabInfo);
    } break;

    case "toggleNavigationBars": { // toggles _all_ navigation bars (comes from options window)
      let displayDefault = window.QuickFolders.Preferences.isShowCurrentFolderToolbar(windowMode);
      let isDisplay = isEvent ? displayDefault : 
        (typeof data.display == "boolean" ? data.display : displayDefault) ;
      await window.QuickFolders.Interface.displayNavigationToolbar(
        {
          display: isDisplay,
          doc: contentDoc,
          selector: data.selector || windowMode
        }
      );
    } break;
  }
}


var globalThemehandler;

async function injectCurrentFolderBar(activatedWhileWindowOpen, isManual = false) {
  const WAIT_FOR_3PANE = 1000;
  // const win = window;
  const util = window.parent?.QuickFolders?.Util,
    prefs = window.parent?.QuickFolders?.Preferences;
  util.logHighlight(
    "qf-3pane.js - injectCurrentFolderBar()",
    {
      color: "lightyellow",
      background: "#AF3C00",
    },
    `\n activatedWhileWindowOpen = ${activatedWhileWindowOpen}\n isManual=${isManual}`
  );

  if (window?.parent?.document?.URL == "about:3pane") {
    // parent document should already be patched!
    if (prefs.isDebug) {
      console.log("injectCurrentFolderBar() early exit, parent document URL==about:3pane");
    }
    return null;
  }
  if (prefs.isDebugOption("interface.currentFolderBar")) { 
    // eslint-disable-next-line no-debugger
    debugger;
  }  
  let sheet = WL.injectCSS("chrome://quickfolders/content/qf-foldertree.css");
  sheet.setAttribute("title", "QuickFoldersFolderTreeGlobalStyles"); 

  window.QuickFolders = window.parent.QuickFolders;
  window.QuickFolders.WLM = WL; // closure a separate instace of the WindowListener that works in messagepane
  // let's make sure 3Pane is really ready (we might want to attach this to a window.DOMContentLoaded event instead)
  window.setTimeout(async (win = window) => {
    util.logDebug("QuickFolders: injecting current folder");
    const contentDoc = win.document;
    win.QuickFolders.Util.logDebug(
      `============INJECT==========\nqf-3pane.js onLoad(${activatedWhileWindowOpen})`
    );
    WL.injectCSS("chrome://quickfolders/content/quickfolders-layout.css?v=6.13.2");
    WL.injectCSS("chrome://quickfolders/content/quickfolders-tools.css?v=2");

    // current folder bar specific styling
    WL.injectCSS("chrome://quickfolders/content/skin/quickfolders-navigation.css");
    WL.injectCSS("chrome://quickfolders/content/quickfolders-filters.css");

    // inject palette
    WL.injectCSS("chrome://quickfolders/content/skin/quickfolders-palettes.css");

    //------------------------------------ overlay current folder (navigation bar)
    const INJECTED_ELEMENTS = `<hbox id="QuickFolders-PreviewToolbarPanel" class="QuickFolders-NavigationPanel quickFoldersToolbar">
  <span flex="5" id="QF-CurrentLeftSpacer"> </span>
  <toolbar id="QuickFolders-CurrentFolderTools" class="contentTabToolbar quickFoldersToolbar" iconsize="small">
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
    <toolbarbutton id="QuickFolders-findRelated"
      class="icon"
      tooltiptext="__MSG_findRelated.prompt.title__"
      onclick="QuickFolders.Interface.findRelated_Click(event);"
       />    

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
    <toolbarseparator id="QuickFolders-Navigate-Separator" class="qf_navigation"/>
    <toolbarbutton id="QuickFolders-NavigateUp"
      class="icon qf_navigation"
      onclick="QuickFolders.Interface.goUpFolder();"
      tooltiptext="__MSG_qf.tooltip.folderUp__"/>
    <toolbarbutton id="QuickFolders-NavigateLeft"
      class="icon qf_navigation"
      onclick="QuickFolders.Interface.goPreviousSiblingFolder();"/>

    <hbox class="folderBarContainer">
      <toolbarbutton id="QuickFoldersCurrentFolder"
        label="Current Folder"
        class="selected-folder"
        ondragenter="QuickFolders.buttonDragObserver.dragEnter(event);"
        ondragover="QuickFolders.buttonDragObserver.dragOver(event);"/>
    </hbox>

    <toolbarbutton id="QuickFolders-NavigateRight"
      class="icon qf_navigation"
      onclick="QuickFolders.Interface.goNextSiblingFolder();"/>
    <toolbarseparator id="QuickFolders-Navigate-Separator2" class="qf_navigation"/>
    <toolbarbutton id="QuickFolders-currentFolderMailFolderCommands"
      class="icon"
      tooltiptext="__MSG_qf.tooltip.mailFolderCommands__"
      onclick="QuickFolders.Interface.showCurrentFolderMailContextMenu(event.target);"
      oncontextmenu="QuickFolders.Interface.showCurrentFolderMailContextMenu(event.target);" 
      collapsed="true"/>
    <toolbarbutton id="QuickFolders-RepairFolderBtn"
      class="icon"
      tooltiptext="__MSG_qfFolderRepair__"
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
</hbox>`;

    switch (contentDoc.URL) {
      case "about:3pane": // inject into thread pane (bottom)
        WL.injectElements(`<div id="threadPane">${INJECTED_ELEMENTS}</div>`);
        windowMode = "";
        break;
      case "about:message": // inject into messagepane (on top)
        WL.injectElements(`<vbox id="messagepanebox">${INJECTED_ELEMENTS}</vbox>`);
        if (window.parent.document.URL.endsWith("messageWindow.xhtml")) {
          // single message windows get a reduced set of commands:
          windowMode = "messageWindow";
          let ft = contentDoc.getElementById("QuickFolders-CurrentFolderTools");
          if (ft) {
            // remove obsolete navigation elements!
            let navs = ft.querySelectorAll(".qf_navigation");
            for (let navElement of navs) {
              navElement.remove();
            }
          }
          let fa = contentDoc.getElementById("QuickFolders-currentFolderFilterActive");
          if (fa) {
            fa.remove();
          }
        } else {
          windowMode = "singleMailTab";
        }

        break;
    }
    // when to set windowMode = "messageWindow" ??

    /*
  <!-- if conversation view (extension) is active ?? then the browser element multimessage will be visible
      in this case we need to move the toolbar panel into the messagepanebox before multimessage
      <hbox id="QuickFolders-PreviewToolbarPanel-ConversationView" class=QuickFolders-PreviewToolbarPanel insertbefore="multimessage">
      
      </hbox>
  -->
  */
    // main window: win.parent

    // relocate to make it visible (bottom of thread)
    win.QuickFolders.Interface.liftNavigationbar(contentDoc); // passes HTMLDocument "about:3pane"

    const myToolbar = contentDoc.getElementById("QuickFolders-CurrentFolderTools");
    if (myToolbar) {
      // inject brighttext if necessary
      // for some reason this is not generated automatically
      // which leads to badly matching icons in the toolbar...
      if (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) {
        myToolbar.setAttribute("brighttext", true);
      } else {
        myToolbar.removeAttribute("brighttext");
      }
    }

    const themeHandler = {
      handleEvent(event) {
        window.QuickFolders.Util.logDebugOptional("interface", "3pane themeHandler..");
        window.QuickFolders.Interface.patchToolbarTheme(event, {
          win: win,
          doc: contentDoc,
          toolbarId: "QuickFolders-CurrentFolderTools",
        });
      },
    };
    win.addEventListener("windowlwthemeupdate", themeHandler);
    globalThemehandler = themeHandler; // keep a reference to unload

    /* Bridge the gap for theme changes (e.g., system or custom themes) that
    // don't trigger windowlwthemeupdate.
    Services.obs.addObserver(() => {
      const event = { type: "lightweightthemechange" };
      window.QuickFolders.themeHandler.handleEvent(event);
    }, "lightweight-theme-changed");
    */

    // remember whether toolbar was shown, and make invisible or initialize if necessary
    // default to folder view
    const prefs = win.QuickFolders.Preferences;
    // avoid circular calling:

    if (!isManual) {
      // this parameter is set when we want to force display and the element was not already injected onLoad:
      await win.QuickFolders.Interface.displayNavigationToolbar({
        isFromWindow: true,
        display: prefs.isShowCurrentFolderToolbar(windowMode),
        doc: contentDoc,
        selector: windowMode,
      });
    }
    let tabInfo;
    try {
      tabInfo = contentDoc.defaultView.tabOrWindow.tabNode;
    } catch {;}
    win.QuickFolders.Interface.updateNavigationBar(contentDoc, tabInfo);
    // -- now we have the current folder toolbar, tell quickFilters to inject its buttons:
    window.QuickFolders.Util.notifyTools.notifyBackground({ func: "updateQuickFilters" });

    // initialise custom icons in folder tree (only 3pane tabs)
    if (windowMode == "" && win.QuickFolders.FolderTree) {
      win.QuickFolders.FolderTree.init(contentDoc, win.tabOrWindow);
    }

    // add a listener for switching the view
    Services.prefs.addObserver("mail.pane_config.dynamic", viewLayoutObserver);
  }, WAIT_FOR_3PANE);


  if (!window.QuickFolders_notifyToolsLoaded) {
    // the following adds the notifyTools API to communicate with the background page
    var { ExtensionParent } = ChromeUtils.importESModule(
      "resource://gre/modules/ExtensionParent.sys.mjs"
    );
    let ext = ExtensionParent.GlobalManager.getExtension("quickfolders@curious.be");
    Services.scriptloader.loadSubScript(
      ext.rootURI.resolve("chrome/content/scripts/notifyTools.js"),
      this,
      "UTF-8"
    );

    this.notifyTools.setAddOnId("quickfolders@curious.be");
    this.notifyTools.addListener((data) => {
      return notificationHandler(data);
    });
    window.QuickFolders_notifyToolsLoaded = true;
  }

  const toolbar = window.document.getElementById("QuickFolders-PreviewToolbarPanel") || null;
  return toolbar; // null if injection failed
}

// eslint-disable-next-line no-unused-vars
async function onLoad(activatedWhileWindowOpen) {
  return injectCurrentFolderBar(activatedWhileWindowOpen);
}

// eslint-disable-next-line no-unused-vars
function onUnload(isAddOnShutown) {
  let document3pane = window.document;
  Services.prefs.removeObserver("mail.pane_config.dynamic", viewLayoutObserver);

  const threadPane = document3pane.querySelector("#threadPane");
				
  function removeBtn(id) {
    let btn = document3pane.getElementById(id);
    if (btn) {
      btn.parentNode.removeChild(btn);
      threadPane.append(btn); // remove the buttons
    }
  }

  // clean up any elements of quickFilters from current folder bar 
  removeBtn('quickfilters-current-listbutton');
  removeBtn('quickfilters-current-runbutton');
  removeBtn('quickfilters-current-msg-runbutton');
  removeBtn('quickfilters-current-searchfilterbutton');

  window.removeEventListener("windowlwthemeupdate", globalThemehandler);  
  globalThemehandler = null;
}
// store a global reference for manual calling:
window.QuickFolders_injectCurrentFolderBar = injectCurrentFolderBar;