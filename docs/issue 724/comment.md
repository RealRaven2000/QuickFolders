# Issue #724: Search Messages opens an empty window in Thunderbird 160

## Cause

QuickFolders' **Mail Commands → Search Messages** command was being invoked correctly. The folder context handler opened Thunderbird's built-in search window with `top.openDialog()` and passed the selected `nsIMsgFolder` as the dialog argument.

Thunderbird 160 renamed the dialog resource from `chrome://messenger/content/SearchDialog.xhtml` to `chrome://messenger/content/searchDialog.xhtml` (lowercase `s`). On Thunderbird 160, opening the old URL produced a small, empty error window. The console showed an `RPMGetBoolPref is not defined` exception from `aboutNetErrorHelpers.mjs` while that failed page was loading.

This is a resource-path compatibility change, not a problem with the menu event or the folder object. Thunderbird's MailExtension `messages.query()` API can return search results, but it does not open or populate the built-in Search Messages window. Reimplementing the search UI would not preserve the intent of the Mail Folder Commands menu.

## Fix

`QuickFolders.Interface.onSearchMessages()` continues to open Thunderbird's native dialog and pass the selected folder. It now uses `QuickFolders.Util.versionGreaterOrEqual("160.0")` to choose the lowercase URL on Thunderbird 160 and later, and the original uppercase URL on earlier versions. This preserves compatibility with Thunderbird 140–159, including ESR 153.

The background registers the existing QuickFolders SearchDialog integration script for both URL spellings, so it continues to load after Thunderbird's rename.

## Verification

Tested in Thunderbird 160.0 (64-bit): **PASS**. The Search Messages window opens with its content, and the folder command uses Thunderbird's built-in search functionality.
