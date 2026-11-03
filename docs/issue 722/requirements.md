**Requirements: Current Folder Toolbar visibility controls**

- **Advanced Settings:** Rename `Display the Toolbar` to `Display on Startup`.
- **Persistent preference:** This checkbox controls whether the Current Folder Toolbar is displayed when Thunderbird starts.
- **Immediate feedback:** Changing the checkbox must also immediately show or hide the toolbar.
- **Main menu:** Make `Display Current Folder Tools` a context-sensitive toggle:
  - Toolbar hidden → `Display Current Folder Tools`
  - Toolbar visible → `Hide Current Folder Tools`
- **Toolbar close button (X):** Hides the toolbar for the current session only.
- **Preference independence:** Using the main menu toggle or the X button must **not** modify the `Display on Startup` preference.
- **Menu state:** Determine the main menu label from the toolbar's actual visibility, not from the saved preference.

**Additional requirements / considerations**

- The Current Folder Toolbar's contents are fully configurable under **QuickFolders → Advanced → Current Folder Toolbar**.
- The **Close Toolbar (X)** button is optional and can be disabled to prevent accidental closing.
- The main menu's **Display / Hide Current Folder Tools** toggle must work regardless of whether the X button is enabled.
- Hiding the toolbar must preserve all configured toolbar buttons and settings.
- Neither the main menu toggle nor the X button should modify the persistent **Display on Startup** preference.

**Expected behavior**

Users can temporarily show or hide the toolbar without affecting its startup configuration. The Advanced checkbox provides persistent configuration while also applying changes immediately.