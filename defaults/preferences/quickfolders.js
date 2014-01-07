pref("extensions.quickfolders@curious.be.description", "chrome://quickfolders/locale/quickfolders.properties");
// Model
pref("extensions.quickfolders.lastSelectedCategory","");
// General Prefs
pref("extensions.quickfolders.showShortcutNumber",true);
pref("extensions.quickfolders.showUnreadOnButtons",true);
pref("extensions.quickfolders.showQuickfoldersLabel",true);
pref("extensions.quickfolders.textQuickfoldersLabel","QuickFolders");
pref("extensions.quickfolders.showUnreadFoldersBold",true);
pref("extensions.quickfolders.useNavigateShortcuts",true);
pref("extensions.quickfolders.useKeyboardShortcuts",true);
pref("extensions.quickfolders.useKeyboardShortcutCTRL",false);
pref("extensions.quickfolders.showTotalNumber",false);
pref("extensions.quickfolders.showFoldersWithMessagesItalic",false);
pref("extensions.quickfolders.showFoldersWithNewMailItalic",false);
pref("extensions.quickfolders.showCategoryCounts",false);
pref("extensions.quickfolders.showNewMailHighlight",false);
pref("extensions.quickfolders.showRecentTab",false);
pref("extensions.quickfolders.autoFocusPreview",true);
pref("extensions.quickfolders.showSubfolders",false);
pref("extensions.quickfolders.disableFolderSwitching",false);
pref("extensions.quickfolders.showCountInSubFolders",false);
pref("extensions.quickfolders.enableMenuAlphaSorting",false);
pref("extensions.quickfolders.useRebuildShortcut", false);
pref("extensions.quickfolders.rebuildShortcutKey", 'F');
pref("extensions.quickfolders.useFindFolderShortcut", true);
pref("extensions.quickfolders.findFolderShortcutKey", 'J');
pref("extensions.quickfolders.showToolIcon",true);
pref("extensions.quickfolders.toolbar.minHeight", "24px");
pref("extensions.quickfolders.toolbar.onlyShowInMailWindows",false);
pref("extensions.quickfolders.toolbar.hideInSingleMessage",true);
pref("extensions.quickfolders.style.transitions",true); // changing to true because of wobbly bug
pref("extensions.quickfolders.tooltips.parentFolder",false);
pref("extensions.quickfolders.tooltips.baseFolder",true);
pref("extensions.quickfolders.tooltips.serverName",true);
pref("extensions.quickfolders.tooltips.virtualFlag",true);
pref("extensions.quickfolders.tooltips.msgFolderFlags",false);
// Current Folder Toolbar
pref("extensions.quickfolders.showCurrentFolderToolbar",true);
pref("extensions.quickfolders.messageWindow.showCurrentFolderToolbar",false);
pref("extensions.quickfolders.currentFolderBar.showClose",true);
pref("extensions.quickfolders.currentFolderBar.showRecentButton",true);
pref("extensions.quickfolders.currentFolderBar.showFilterButton",true);
pref("extensions.quickfolders.currentFolderBar.showFolderMenuButton",false);
pref("extensions.quickfolders.currentFolderBar.navigation.showButtons",true);
pref("extensions.quickfolders.currentFolderBar.navigation.showToggle",true);
pref("extensions.quickfolders.currentFolderBar.background","linear-gradient(to top, #FFF 7%, rgb(189,185,189) 88%, #EEE 100%)");
pref("extensions.quickfolders.currentFolderBar.background.selection","default");
// off the wall German flag style:
pref("extensions.quickfolders.currentFolderBar.background.custom","linear-gradient(140deg, rgba(0,0,0,0) 0%,rgba(0,0,0,0) 12%,rgba(0,0,0,1) 14%,rgba(214,40,40,1) 24%,rgba(255,231,50,1) 32%,rgba(255,231,50,0.0) 34%,rgba(0,0,0,0) 100%)"); 
// note: in old Gecko versions it would be -moz-linear-gradient(-30deg, rgba(0,0,0,0) 0%,rgba(0,0,0,0) 12%,rgba(0,0,0,1) 14%,rgba(214,40,40,1) 24%,rgba(255,231,50,1) 32%,rgba(255,231,50,0.0) 34%,rgba(0,0,0,0) 100%)
// Layout
pref("extensions.quickfolders.style.theme", "flatTabs");
pref("extensions.quickfolders.buttonFontSize","");
pref("extensions.quickfolders.showIcons",true);
pref("extensions.quickfolders.debug",false);
pref("extensions.quickfolders.initDelay", 2500);
pref("extensions.quickfolders.colorTabStyle",0);
pref("extensions.quickfolders.queuedFolderUpdateDelay",500);
pref("extensions.quickfolders.transparentButtons", false);
pref("extensions.quickfolders.transparentToolbar", true);
pref("extensions.quickfolders.buttonShadows", false);
pref("extensions.quickfolders.pastelColors", true); // legacy, now obsolete
pref("extensions.quickfolders.style.corners.customizedRadius", false);
pref("extensions.quickfolders.style.corners.customizedTopRadius", "4px");
pref("extensions.quickfolders.style.corners.customizedBottomRadius", "0px");
pref("extensions.quickfolders.style.borders",true);

// Special State colors
pref("extensions.quickfolders.style.Toolbar.background-color", "transparent");
pref("extensions.quickfolders.style.ActiveTab.color", "#FFFFFF");
pref("extensions.quickfolders.style.ActiveTab.background-color", "#000090");
pref("extensions.quickfolders.style.ActiveTab.paletteEntry", 5);
pref("extensions.quickfolders.style.ActiveTab.paletteType", -1);
pref("extensions.quickfolders.style.palette.version", 0);

pref("extensions.quickfolders.style.DragOver.color", "#E93903");
pref("extensions.quickfolders.style.DragOver.background-color", "#FFFFFF");
pref("extensions.quickfolders.style.DragOver.paletteEntry", 10);
pref("extensions.quickfolders.style.DragOver.paletteType", -1);

pref("extensions.quickfolders.style.DragTab.color", "#FFFFFF");
pref("extensions.quickfolders.style.DragTab.background-color", "#E93903");

pref("extensions.quickfolders.style.HoveredTab.color", "#FFFFFF");
pref("extensions.quickfolders.style.HoveredTab.background-color", "orange");
pref("extensions.quickfolders.style.HoveredTab.paletteEntry", 3);
pref("extensions.quickfolders.style.HoveredTab.paletteType", -1);

pref("extensions.quickfolders.style.InactiveTab.color", "buttontext");
pref("extensions.quickfolders.style.InactiveTab.background-color", "buttonface");
pref("extensions.quickfolders.style.InactiveTab.paletteEntry", 20);
pref("extensions.quickfolders.style.InactiveTab.paletteType", 0); // InactiveTab = "uncolored tab" default to none, but is set on upgradePalette
pref("extensions.quickfolders.style.ColoredTab.paletteType", 1); // default to none, but is set on upgradePalette

// Debugging Options
pref("extensions.quickfolders.debug.firstrun", false);
pref("extensions.quickfolders.debug.buttonStyle", false);
pref("extensions.quickfolders.debug.categories",false);
pref("extensions.quickfolders.debug.css",false);
pref("extensions.quickfolders.debug.css.Detail",false);
pref("extensions.quickfolders.debug.css.AddRule",false);
pref("extensions.quickfolders.debug.css.styleSheets",false);
pref("extensions.quickfolders.debug.css.palette.styleSheets",false);
pref("extensions.quickfolders.debug.css.palette",false);
pref("extensions.quickfolders.debug.dnd",false);
pref("extensions.quickfolders.debug.folders",false);
pref("extensions.quickfolders.debug.popupmenus",false);
pref("extensions.quickfolders.debug.popupmenus.drag",false);
pref("extensions.quickfolders.debug.mouseclicks",false);
pref("extensions.quickfolders.debug.events",false);
pref("extensions.quickfolders.debug.interface", false);
pref("extensions.quickfolders.debug.interface.tabs", false);
pref("extensions.quickfolders.debug.interface.buttonStyles", false);
pref("extensions.quickfolders.debug.interface.findFolder", false);
pref("extensions.quickfolders.debug.mailTabs",false);
pref("extensions.quickfolders.debug.dragToNew",false);
pref("extensions.quickfolders.debug.recentFolders",false);
pref("extensions.quickfolders.debug.recentFolders.detail",false);
pref("extensions.quickfolders.debug.toolbarHiding",false);
pref("extensions.quickfolders.debug.filters",false);
pref("extensions.quickfolders.debug.listeners.tabmail",false);
pref("extensions.quickfolders.debug.listeners.folder",false);
// New Folder Item
pref("extensions.quickfolders.dragToCreateFolder.pop3",true);
pref("extensions.quickfolders.dragToCreateFolder.imap",false);
pref("extensions.quickfolders.dragToCreateFolder.local",true);
// Recent Folder Item
pref("extensions.quickfolders.recentfolders.itemCount", 12);
pref("extensions.quickfolders.recentfolders.showLabel", true);
pref("extensions.quickfolders.recentfolders.sortAlphabetical", false);
pref("extensions.quickfolders.recentfolders.color", 10);
pref("extensions.quickfolders.recentfolders.showIcon",true);
pref("extensions.quickfolders.recentfolders.folderPathDetail", 1);
// new Folder Optimization
pref("extensions.quickfolders.update.disableMinimal", false);
// Tab Context Menu items
pref("extensions.quickfolders.folderMenu.getMessagesForInbox", true);
pref("extensions.quickfolders.folderMenu.getMessagesForNews", true);
pref("extensions.quickfolders.folderMenu.markAllRead", true);
pref("extensions.quickfolders.folderMenu.emptyJunk", true);
pref("extensions.quickfolders.folderMenu.emptyTrash", true);
pref("extensions.quickfolders.folderMenu.dragToNew", true);
pref("extensions.quickfolders.folderMenu.openNewTab", true);
pref("extensions.quickfolders.folderMenu.realignMinTabs", 0);
pref("extensions.quickfolders.commandMenu.options", true);
pref("extensions.quickfolders.commandMenu.separator", true);
pref("extensions.quickfolders.commandMenu.lineBreak", true);
pref("extensions.quickfolders.commandMenu.icon", false);
pref("extensions.quickfolders.tabIcons.defaultPath","");
pref("extensions.quickfolders.commandMenu.support", true);
pref("extensions.quickfolders.commandMenu.help", true);

pref("extensions.quickfolders.hideVersionOnUpdate",false);
// Filter Template
pref("extensions.quickfolders.filters.currentTemplate", "from");
pref("extensions.quickfolders.filters.showMessage", true);
pref("extensions.quickfolders.contextMenu.hideFilterMode", false);
// Pro Features
pref("extensions.quickfolders.proNotify.findFolder", true);
pref("extensions.quickfolders.proNotify.findFolder.countDown", 5);
pref("extensions.quickfolders.proNotify.lineBreaks", true);
pref("extensions.quickfolders.proNotify.lineBreaks.countDown", 3);
pref("extensions.quickfolders.proNotify.tabSeparator", true);
pref("extensions.quickfolders.proNotify.tabSeparator.countDown", 3);
// we need this to better integrate with quickFilters - therefore using the same extension naming space is intended!
pref("extensions.quickfilters.naming.keyWord", true);
pref("extensions.quickfilters.naming.parentFolder", false);




