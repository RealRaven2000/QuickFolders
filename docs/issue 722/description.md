## Bug: Current Folder Toolbar visibility state not synchronized between menus

### Description

The visibility state of the **Current Folder Toolbar** is not synchronized correctly between the main QuickFolders menu and the Advanced submenu.

When enabling the toolbar through the main menu, the corresponding checkbox in the Advanced submenu does not reflect the new state.

### Steps to Reproduce

1. Make sure the Current Folder Toolbar is initially hidden.
2. Open the main **QuickFolders** menu and select **Display Current Folder Tools**.
3. The toolbar becomes visible as expected.
4. Open **QuickFolders → Advanced → Current Folder Toolbar**.
5. Observe that **Display the Toolbar** remains unchecked, although the toolbar is visible.
6. Click **Display the Toolbar** once. The checkbox becomes checked, but the toolbar remains visible.
7. Click it again. The checkbox becomes unchecked, and the toolbar finally disappears.

### Expected Behavior

- Both menu commands should reflect the same toolbar visibility state.
- Enabling the toolbar through the main menu should immediately update the checkbox in the Advanced submenu.
- The **Display Current Folder Tools** command in the main menu should ideally act as a toggle, allowing the toolbar to be shown or hidden.
- Both menus should remain synchronized regardless of which one is used to change the toolbar visibility.

### Actual Behavior

- The main menu command enables the toolbar but does not update the checkbox state in the Advanced submenu.
- Selecting the main menu command again does not hide the toolbar.
- The first click on **Display the Toolbar** in the Advanced submenu only synchronizes its checkbox state without changing toolbar visibility.
- A second click is required to actually hide the toolbar.

### Suggested Fix

Ensure that both menu commands use the same underlying toolbar visibility state and update their checked states whenever visibility changes.

Consider making **Display Current Folder Tools** in the main menu a proper toggle command, with a checked indicator or a dynamic label reflecting the current visibility state.