/* 
  globals  
    WL
*/

const QFInjector = {
  injectCSS(win, url) {
    const WL = win.WL;

    if (WL?.injectCSS) {
      return WL.injectCSS(url);
    }

    const doc = win.document;

    const link = doc.createElement("link");
    link.rel = "stylesheet";
    link.type = "text/css";
    link.href = url;

    doc.head.appendChild(link);
    return link;
  },

  injectElements(xulString) {
    function localize(entity) {
      let msg = entity.slice("__MSG_".length, -2);
      return extension.localeData.localizeMessage(msg);
    }    
    // const WL = window.WL;
    const prefs = window.parent?.QuickFolders?.Preferences;
    const util = window.parent?.QuickFolders?.Util;
    const debug = prefs?.isDebug;
    const debug3pane = prefs?.isDebugOption?.("3pane");

    const logDebug = (...args)  => {
      if (!debug3pane) {
        return;
      }
      if (!debug) {
        return;
      }
      const format = {
        color: "white",
        background: "#5f0404",
        fontWeight: "bold",
      };
      util.logHighlight("[QF 3pane]", format, ...args);      
    }

    if (debug) {
      console.log("QuickFolders injector path:", {
        hasWL: !!WL,
        globalThis: globalThis.WL,
        hasInject: !!WL?.injectElements,
        url: window.location.href,
      });    
    }

    var { ExtensionParent } = ChromeUtils.importESModule(
      "resource://gre/modules/ExtensionParent.sys.mjs",
    );    
    const extension = ExtensionParent.GlobalManager.getExtension("quickfolders@curious.be");

    // Primary: real WL path
    if (WL?.injectElements) {
      if (debug) {
        console.log("Using WindowListener:injectElements");
      }
      if (debug || debug3pane) {
        logDebug("Injection path: WindowListener (WL)");
      }
      WL.injectElements(xulString, [], debug); // always returns undefined by design
      if (debug) {
        const panel = window.document.getElementById("QuickFolders-PreviewToolbarPanel");
        logDebug(
          `WL.injectElements done - panel in DOM: ${!!panel}, panel parent: ${panel?.parentElement?.id || "(none)"}`
        );
      }
      
      return null;
    }

    // Fallback: minimal safe DOM injection
    logDebug("Injection path: QFInjector fallback (no WL)");
    
    const doc = window.document;
    try {
      let localizedXulString = xulString.replace(/__MSG_(.*?)__/g, localize);
      const frag = window.MozXULElement.parseXULToFragment(localizedXulString);
      const root = frag.firstElementChild;
      if (!root) {
        console.warn("injectElements: empty XUL fragment");
        return null;
      }
      logDebug(
        `QFInjector.injectElements (fallback): root id=${root.id}, children=${root.childElementCount}`
      );
      const after = root.getAttribute("insertafter");
      const before = root.getAttribute("insertbefore");
      const children = [...root.children]; // .filter((n) => n.nodeType !== 3); // avoid Node.TEXT_NODE
      if (debug) {
        for (const child of children) {
          console.log({
            type: child?.nodeType,
            name: child?.nodeName,
            isNode: child?.nodeType,
          });
        }
      }

      if (after || before) {
        const refId = after || before;
        const ref = doc.getElementById(refId);

        if (ref && ref.parentNode) {
          const frag = doc.createDocumentFragment();
          for (const c of children) {
            if (c.id) {
              // make sure to remove previously added because we make an update.
              const existing = doc.getElementById(c.id);
              if (existing) {
                existing.remove();
              }
            }

            frag.appendChild(c);
          }

          if (after) {
            ref.parentNode.insertBefore(frag, ref.nextSibling);
          } else {
            ref.parentNode.insertBefore(frag, ref);
          }

          return target;
        }
      }

      // find the target element to inject into (if specified by id), otherwise inject into document root
      const target = root.id && doc.getElementById(root.id);
      logDebug(`QFInjector.injectElements: target lookup id="${root.id}" → ${target ? `FOUND (${target.tagName}, childCount=${target.childElementCount})` : 'NOT FOUND → will create new element'}`);
      
      // CASE 2: insert at the end of the document
      if (!target) {
        logDebug(`QFInjector.injectElements: CASE 2 - appending new <${root.tagName} id="${root.id}"> to documentElement`);
        doc.documentElement.appendChild(root);
        return root;
      }
      // CASE 1: WL-style injection (existing node → recurse only)
      logDebug(`QFInjector.injectElements: CASE 1 - merging ${children.length} child(ren) into existing #${target.id}`);
      
      [...children].forEach((c) => {
        const id = c.id;
        if (id) {
          // make sure to remove previously added because we make an update.
          const existing = doc.getElementById(id);
          if (existing) {
            logDebug(`QFInjector.injectElements: replacing existing #${id} inside #${target.id}`);
            existing.replaceWith(c);
            return; // skips append for this iteration
          }
        }
        
        logDebug(`QFInjector.injectElements: appending <${c.tagName} id="${c.id || '(no id)'}"> to #${target.id}`);
        target.append(c);
      });

      return root;
    } catch (e) {
      console.error("injectElements: XUL parse failed", e);
      return null;
    }
  },
};


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

    case "setCurrentFolderFilterButton":
      return setCurrentFolderButtonState(data.active, command);

    case "setCurrentFolderFilterActive":
      return setCurrentFolderButtonState(data.active, command);
  }
}

function externalResult(ok, extra = {}) {
  return { ok, ...extra };
}

async function setCurrentFolderButtonState(active, commandName) {
  const prefs = window.parent?.QuickFolders?.Preferences;
  const normalizedActive = !!active;
  const button = window.QuickFolders?.Interface?.CurrentFolderFilterToggleButton;

  if (prefs?.isDebug) {
    console.log("QuickFolders external command received:", {
      command: commandName,
      active: normalizedActive,
      buttonPresent: !!button,
    });
  }

  if (!button) {
    return externalResult(false, {
      unavailable: true,
      error: "QuickFolders current-folder filter button unavailable.",
    });
  }

  const currentMode = button.getAttribute("mode") === "filter";
  if (currentMode === normalizedActive) {
    if (prefs?.isDebug) {
      console.log("QuickFolders external command applied:", {
        command: commandName,
        active: normalizedActive,
        changed: false,
      });
    }
    return externalResult(true, { active: normalizedActive, changed: false });
  }

  if (normalizedActive) {
    button.setAttribute("mode", "filter");
  } else {
    button.removeAttribute("mode");
  }

  if (prefs?.isDebug) {
    console.log("QuickFolders external command applied:", {
      command: commandName,
      active: normalizedActive,
      changed: true,
    });
  }

  return externalResult(true, { active: normalizedActive, changed: true });
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
  let sheet = QFInjector.injectCSS(window, "chrome://quickfolders/content/qf-foldertree.css");
  sheet.setAttribute("title", "QuickFoldersFolderTreeGlobalStyles"); 

  window.QuickFolders = window.parent.QuickFolders;

  // let's make sure 3Pane is really ready (we might want to attach this to a window.DOMContentLoaded event instead)
  window.setTimeout(async (win = window) => {
    util.logDebug("QuickFolders: injecting current folder");
    const contentDoc = win.document;
    const prefs = win.QuickFolders.Preferences;
    const debug = prefs?.isDebug;
    const isDebug3pane = prefs.isDebugOption("3pane");

    const logDebug3pane = (...args) => {
      if (!isDebug3pane) { return; }
      if (!debug) { return;}
      const format = {
        color: "#f5da3f",
        background: "#5f0404",
        fontWeight: "bold",
      };
      util.logHighlight("[QF 3pane]", format, ...args);
    };
    
    win.QuickFolders.Util.logDebug(
      `============INJECT==========\nqf-3pane.js onLoad(${activatedWhileWindowOpen})`
    );
    QFInjector.injectCSS(window, "chrome://quickfolders/content/quickfolders-layout.css?v=6.15.1");
    QFInjector.injectCSS(window, "chrome://quickfolders/content/quickfolders-tools.css?v=2");

    // current folder bar specific styling
    QFInjector.injectCSS(window, "chrome://quickfolders/content/skin/quickfolders-navigation.css");
    QFInjector.injectCSS(window, "chrome://quickfolders/content/quickfolders-filters.css");

    // inject palette
    QFInjector.injectCSS(window, "chrome://quickfolders/content/skin/quickfolders-palettes.css");

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
      oncommand="QuickFolders.Interface.toggle_FilterMode(!QuickFolders.FilterWorker.AssistantActive);" />
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
        {
          if (isDebug3pane) {
            const existingPane = contentDoc.getElementById('threadPane');
            logDebug3pane(`[QF 3pane] about:3pane PRE-inject: threadPane ${existingPane ? `EXISTS (childCount=${existingPane.childElementCount})` : 'NOT FOUND'}`);
            if (existingPane) {
              logDebug3pane('[QF 3pane] about:3pane threadPane children:', [...existingPane.children].map(c => `${c.tagName}#${c.id || '(no id)'}`).join(', '));
            }
          }
          const el = QFInjector.injectElements(`<div id="threadPane">${INJECTED_ELEMENTS}</div>`);
          windowMode = "";
          logDebug3pane("about:3pane - injected", el);

          // helper: walk up and return id chain (used in repair logging)
          function ancestorChain(node) {
            const parts = [];
            let cur = node;
            while (cur && cur !== contentDoc.documentElement) {
              parts.push(cur.id ? `${cur.tagName}#${cur.id}` : cur.tagName);
              cur = cur.parentElement;
            }
            return parts.join(' > ');
          }

          // Always runs: detect duplicate #threadPane elements, move QF panel to the
          // native one, and remove the stray container if it is empty afterwards.
          function repairDuplicateThreadPanes(label) {
            const allPanes = [...contentDoc.querySelectorAll("#threadPane")];
            if (allPanes.length <= 1) {
              if (allPanes.length === 0) {
                if (isDebug3pane) {
                  logDebug3pane(` ${label}: #threadPane NOT FOUND in DOM`);
                }
                return;
              }
              // Single pane: verify it looks like the native TB one, not a QF-created stray.
              // QFInjector CASE 2 appends to documentElement, so a stray pane's parent is <html>/<window>.
              const pane = allPanes[0];
              const isDirectChildOfRoot = pane.parentElement === contentDoc.documentElement;
              const hasOnlyQFPanel =
                pane.childElementCount === 1 &&
                !!pane.querySelector("#QuickFolders-PreviewToolbarPanel");
              if (isDebug3pane) {
                if (isDirectChildOfRoot || hasOnlyQFPanel) {
                  logDebug3pane(
                    ` ${label}: WARN — single #threadPane looks like QF stray` +
                      ` (parent=${pane.parentElement?.tagName || "none"}, childCount=${pane.childElementCount},` +
                      ` hasOnlyQFPanel=${hasOnlyQFPanel}) — native TB pane may not exist yet`
                  );
                } else {
                  logDebug3pane(
                    ` ${label}: #threadPane count OK (1),` +
                      ` parent=${pane.parentElement?.id || pane.parentElement?.tagName || "unknown"}`
                  );
                }
              }
              return;
            }
            if (isDebug3pane) {
              logDebug3pane(
                `${label}: DUPLICATE #threadPane x${allPanes.length} — attempting repair`
              );
              allPanes.forEach((pane, i) => {
                const hasPanel = !!pane.querySelector("#QuickFolders-PreviewToolbarPanel");
                console.log(
                  `  [${i}] ancestors: ${ancestorChain(pane)} | hasQFPanel: ${hasPanel} | childCount: ${pane.childElementCount}`
                );
              });
            }
            const qfPanel = contentDoc.getElementById("QuickFolders-PreviewToolbarPanel");
            if (!qfPanel) {
              return;
            }
            // The stray pane is a direct child of documentElement (created by QFInjector CASE 2).
            // The native TB pane has a proper parent inside the layout (e.g. #paneLayout).
            // Do NOT use qfPanel containment — WL correctly injects into the native pane,
            // so "contains qfPanel" would misidentify it as the stray.
            const strayPane = allPanes.find((p) => p.parentElement === contentDoc.documentElement);
            const nativePane = allPanes.find((p) => p.parentElement !== contentDoc.documentElement);
            if (!strayPane || !nativePane) {
              logDebug3pane(` ${label}: repair — could not distinguish native vs stray pane`);
              return;
            }
            logDebug3pane(
              ` ${label}: repair — moving #QuickFolders-PreviewToolbarPanel into native #threadPane (parent: ${nativePane.parentElement?.id || nativePane.parentElement?.tagName}, was in: ${qfPanel.parentElement?.id || '?'})`
            );
            nativePane.appendChild(qfPanel);
            if (strayPane.childElementCount === 0) {
              logDebug3pane(` ${label}: repair — stray #threadPane is now empty, removing`);
              strayPane.remove();
            } else {
              logDebug3pane(` ${label}: repair — stray #threadPane still has ${strayPane.childElementCount} child(ren), leaving in place`);
            }
          }

          repairDuplicateThreadPanes('POST-inject (immediate)');
          // delayed re-check catches duplicates that appear after TB finishes its own DOM setup
          window.setTimeout(() => repairDuplicateThreadPanes('POST-inject (delayed 2s)'), 2000);

          if (isDebug3pane) {
            const panel = contentDoc.getElementById('QuickFolders-PreviewToolbarPanel');
            const postPane = contentDoc.getElementById('threadPane');
            logDebug3pane(` about:3pane POST-repair: threadPane ${postPane ? `EXISTS (childCount=${postPane.childElementCount})` : 'NOT FOUND'}, panel parent: ${panel?.parentElement?.id || '(none)'}`);
          }
        }
        break;
      case "about:message": // inject into messagepane (on top)
        QFInjector.injectElements(`<vbox id="messagepanebox">${INJECTED_ELEMENTS}</vbox>`);
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
    // avoid circular calling:

    if (!isManual) {
      // this parameter is set when we want to force display and the element was not already injected onLoad:
      const willDisplay = prefs.isShowCurrentFolderToolbar(windowMode);
      if (prefs.isDebug) {
        console.log(`[QF 3pane] displayNavigationToolbar: isShowCurrentFolderToolbar(windowMode="${windowMode}") = ${willDisplay} — bar will be ${willDisplay ? 'SHOWN' : 'HIDDEN'}`);
      }
      await win.QuickFolders.Interface.displayNavigationToolbar({
        isFromWindow: true,
        display: willDisplay,
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
    // small delay to allow quickFilters to finish registering its external message listener
    window.setTimeout(() => {
      window.QuickFolders.Util.notifyTools.notifyBackground({ func: "updateQuickFilters" });
    }, 500);

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
  if (typeof window.hasDOMContentLoaded === "object") {
    await window.hasDOMContentLoaded;
  }  
  return injectCurrentFolderBar(activatedWhileWindowOpen);
}

// eslint-disable-next-line no-unused-vars
function onUnload(isAddOnShutown) {
  let document3pane = window.document;
  Services.prefs.removeObserver("mail.pane_config.dynamic", viewLayoutObserver);

  const threadPane = document3pane.querySelector("#threadPane");

  // remove any stray #threadPane created by QFInjector CASE 2 (direct child of documentElement)
  for (const stray of document3pane.querySelectorAll("#threadPane")) {
    if (stray.parentElement === document3pane.documentElement) {
      stray.remove();
    }
  }
				
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