"use strict";
/* BEGIN LICENSE BLOCK

	QuickFolders is released under the Creative Commons (CC BY-ND 4.0)
	Attribution-NoDerivatives 4.0 International (CC BY-ND 4.0) 
	For details, please refer to license.txt in the root folder of this extension

  END LICENSE BLOCK */

///// tab listener watches tabmail (mail tabs)
QuickFolders.TabListener = {
  selectTab: async function (_evt) {
    try {
      if (QuickFolders) {
        const util = QuickFolders.Util,
          QI = QuickFolders.Interface,
          tabmail = document.getElementById("tabmail");
        util.logDebugOptional("listeners.tabmail,categories", `TabListener.select()`);
        let info = tabmail.currentTabInfo;
        if (!info) {
          return;
        }
        let tabMode = QI.CurrentTabMode; // util.getTabMode(info);

        const isMailTab = ["mail3PaneTab", "mailMessageTab", "message"].includes(tabMode);

        util.logDebugOptional("listeners.tabmail", "tabMode = " + tabMode, info);

        let wasRestored = false;
        if (
          (tabMode == "mail3PaneTab" || tabMode == "mailMessageTab") &&
          typeof info.QuickFoldersCategory == "undefined"
        ) {
          // need to retrieve the info from the session store!
          if (QuickFolders.Preferences.isDebugOption("listeners.tabmail")) {
            console.log("{LISTENERS.TABMAIL}\nMissing QuickFoldersCategory in tabInfo:", info);
          }

          await QuickFolders.Preferences.ensureReady(); // wait for cache before reading prefs
          let lastCats = QuickFolders.Preferences.getStringPref("lastActiveCategories"); // last one looked at
          if (lastCats) {
            console.log(`{LISTENERS.TABMAIL} select category ${lastCats}`);
            QI.selectCategory(lastCats, false);
            wasRestored = true;
          }
        }

        // restore the category
        if (info.QuickFoldersCategory) {
          let isFolderUpdated = false;
          if (!wasRestored) {
            util.logDebugOptional(
              "listeners.tabmail,categories",
              "tab info - setting QuickFolders category: " + info.QuickFoldersCategory,
            );
            isFolderUpdated = QI.selectCategory(info.QuickFoldersCategory, false);
            util.logDebugOptional(
              "listeners.tabmail",
              `After selectCategory(${info.QuickFoldersCategory}) - isFolderUpdated =${isFolderUpdated}`,
            );
          }
          // do not select folder if selectCategory had to be done
          if (!isFolderUpdated) {
            QI.setFolderSelectTimer();
          }
        }

        if (tabMode == "message" || tabMode == "mailMessageTab") {
          // "mailMessageTab"
          let msg = null,
            fld = null;
          msg = info.message || (info.messageDisplay ? info.messageDisplay.displayedMessage : null);
          if (msg) {
            fld = msg.folder;
          }
          if (fld) {
            // reflect in current folder toolbar!
            QI.initCurrentFolderTab(QI.CurrentFolderTab, fld, null, info);
            // force reselection when we return to a folder tab
            QI.lastTabSelected = null;
            QI.setTabSelectTimer();
          } else {
            util.logDebug(
              "TabListener single message - could not determine currently displayed Message.",
            );
          }
        } else {
          // Do not switch to current folder's category, if current tab has another selected!
          if (tabMode == "mail3PaneTab" && !info.QuickFoldersCategory) {
            QI.setTabSelectTimer(); // there is no need for this if it is not a mail tab.
          }
        }
        if (isMailTab) {
          // ensure dark mode
          window.setTimeout(() => {
            util.logDebugOptional("interface", "Calling patchToolbarTheme()");
            QI.patchToolbarTheme(
              { type: "activate" },
              {
                win: window,
                doc: info.chromeBrowser.contentDocument,
                toolbarId: "QuickFolders-CurrentFolderTools",
              },
            );
          }, 500);
          // hide preview label.
          QuickFolders.Interface.showElement(QuickFolders.Interface.PreviewLabel, false);
        }

        // for non-folder tabs: reset lastTabSelected to force refresh of current folder
        // when we go back to a folder tab
        if (tabMode != "mail3PaneTab") {
          QI.lastTabSelected = null;
        }
      }
    } catch (e) {
      QuickFolders.LocalErrorLogger("Exception in Item event - calling mailTabSelected:\n" + e);
    }
  },

  closeTab: function (evt) {
    if (["folder", "message", "mail3PaneTab"].includes(evt.detail.tabInfo.mode.name)) {
      let info = evt.detail.tabInfo;
      QuickFolders.Util.logDebugOptional(
        "listeners.tabmail",
        "TabListener.closeTab() - " + info.title,
      );
      QuickFolders.FolderTree.release(info); // remove tab from monitored array
    }
  },

  newTab: function (evt) {
    if (["folder", "message", "mail3PaneTab"].includes(evt.detail.tabInfo.mode.name)) {
      // ,"mailMessageTab"
      let newTabInfo = evt.detail.tabInfo;
      if (newTabInfo) {
        newTabInfo.QuickFoldersCategory = QuickFolders.Interface.currentActiveCategories;
      }
    }
  },

  moveTab: function (_evt) {
    let idx = QuickFolders.tabContainer.tabbox.selectedIndex;
    idx = idx || 0;
    QuickFolders.Util.logDebugOptional(
      "listeners.tabmail",
      "TabListener.moveTab()  - idx = " + idx,
    );
  },
};

// global QuickFolders command handler
QuickFolders.onGlobalQFCommand = async (data) => {
  if (data.event) {
    switch (data.event) {
      case "setAssistantModeFallback": {
        // legacy assistant from QuickFolders, if quickFilters Add-on not installed  / active
        const active = data.active;
        if (typeof active !== "boolean") {
          return { ok: false, error: "active must be a boolean" };
        }
    		const changed = QuickFolders.FilterWorker.AssistantActive !== active;
        if (changed) {
          await QuickFolders.Interface.toggle_FilterMode(active);
        }
        return { ok: true, active, changed };
      }
      case "showAboutConfig":
        QuickFolders.Interface.showAboutConfig(
          data.element,
          data.filter,
          data.readOnly,
          data.updateUI,
        );
        break;
      case "showLicenseDialog":
        QuickFolders.Interface.showLicenseDialog(data.referrer);
        break;
      case "legacyAdvancedSearch":
        {
          let params = { inn: { mode: "allOptions", instance: QuickFolders }, out: null };
          window.openDialog(
            "chrome://quickfolders/content/quickmove.xhtml",
            "quickfolders-search-options",
            "chrome,titlebar,centerscreen,resizable,alwaysRaised,instantApply",
            QuickFolders,
            params,
          )
          .focus();
        }
        break;
    }
  }
};

QuickFolders.Util.notifyTools.addListener(QuickFolders.onGlobalQFCommand);
