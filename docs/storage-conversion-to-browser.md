# Converting Legacy Preferences to browser.storage.local

## Overview

This document describes the conversion from legacy about:config preferences to browser.storage.local for Thunderbird add-ons using chrome-privileged code with the WindowListener pattern.

**Goal:** Replace NotifyTools round-trips for preference writes with direct parent-side storage access, while preserving multi-window synchronization through background storage.onChanged listener.

**Key Architecture:**
- Chrome-privileged code maintains synchronous cache for reads
- Writes go directly to browser.storage.local via parent-side API
- Background storage.onChanged broadcasts updates to all windows
- No permanent storage listeners on legacy side (passive receivers only)

## Prerequisites

- Thunderbird 140+ (ESR140+)
- WindowListener API v1.66+ with WL.context exposure
- manifest.json with "storage" permission
- Existing NotifyTools integration (to be removed)

---

## Step 1: Update WindowListener Implementation

**File:** `chrome/content/api/WindowListener/implementation.js`

Copy the updated WindowListener v1.66 from QuickFolders which includes:

1. **Line 742**: Add context exposure in `_loadIntoWindow()`:
   ```javascript
   window[this.uniqueRandomID].WL.context = this.context;
   ```

2. **Lines 163-182**: Update `getMessenger()` to include storage API:
   ```javascript
   function getStorage() {
     let localstorage = null;
     try {
       localstorage = context.apiCan.findAPIPath("storage");
       localstorage.local.get = (...args) =>
         localstorage.local.callMethodInParentProcess("get", args);
       localstorage.local.set = (...args) =>
         localstorage.local.callMethodInParentProcess("set", args);
       localstorage.local.remove = (...args) =>
         localstorage.local.callMethodInParentProcess("remove", args);
       localstorage.local.clear = (...args) =>
         localstorage.local.callMethodInParentProcess("clear", args);
     } catch (e) {
       console.info("Storage permission is missing");
     }
     return localstorage;
   }
   ```

3. **Update changelog.md** to version 1.66

**Result:** WindowListener now exposes extension context to chrome code, enabling direct parent-side storage API access.

---

## Step 2: Create Storage Facade

**New File:** `chrome/content/addonname-storage.js`

Create a storage wrapper that accesses parent-side API via WL.context:

```javascript
"use strict";
/* 
  BEGIN LICENSE BLOCK
  ... license header ...
  END LICENSE BLOCK 
*/

// Direct access to browser.storage.local from legacy chrome code
AddonName.Storage = new (class LocalStorage {
  constructor(extensionId) {
    var { ExtensionParent } = ChromeUtils.importESModule(
      "resource://gre/modules/ExtensionParent.sys.mjs"
    );
    const extension = ExtensionParent.GlobalManager.getExtension(extensionId);
    this.uniqueRandomID = "AddOnNS" + extension.instanceId;
    this._context = window[this.uniqueRandomID].WL.context;
    console.log("AddonNameStorage context:", this._context);
  }

  async _init() {
    if (this._storage) {
      return;
    }
    // An Experiment runs in the parent process, where the local storage only
    // exposes callMethodInParentProcess(). The familiar get/set/remove/clear
    // belong to the child process implementation.
    this._storage = this._context.apiCan.findAPIPath("storage");
    this._call =
      (method) =>
      (...args) =>
        this._storage.local.callMethodInParentProcess(method, args);
  }

  async get(keys = null) {
    await this._init();
    const rv = await this._call("get")(keys);
    console.log(`AddonNameStorage get`, keys, rv);
    return rv;
  }

  async set(items) {
    await this._init();
    return this._call("set")(items);
  }

  async remove(keys) {
    await this._init();
    return this._call("remove")(keys);
  }

  async clear() {
    await this._init();
    return this._call("clear")();
  }
})("addonid@extension.id");
```

**Replace:**
- `AddonName` with your add-on's namespace (QuickFolders, quickFilters, SmartTemplates, etc.)
- `"addonid@extension.id"` with your actual extension ID from manifest.json

**Result:** Single-instance storage facade available as `AddonName.Storage` with async get/set/remove/clear methods.

---

## Step 3: Load Storage Facade in Bootstrap Scripts

**Files:** All window bootstrap scripts (e.g., `qf-messenger.js`, `qf-composer.js`, etc.)

Add storage script to loading sequence **after** `addonname-util.js` and **before** `addonname-preferences.js`:

```javascript
WL.loadSubScript(WL.chromeURL + "content/addonname.js", WL);
WL.loadSubScript(WL.chromeURL + "content/addonname-util.js", WL);
WL.loadSubScript(WL.chromeURL + "content/addonname-storage.js", WL);  // ← ADD THIS
WL.loadSubScript(WL.chromeURL + "content/addonname-preferences.js", WL);
```

**Note:** The `WL` parameter passed to bootstrap scripts is the **namespaced** version (`window[uniqueRandomID].WL`), not a global. This is safe to use within the bootstrap script context. However, in other contexts (preferences code, UI code), always access via `window[uniqueRandomID].WL` to avoid conflicts.

**Result:** Storage facade available before preferences code initializes.

---

## Step 4: Refactor Preferences Cache

**File:** `chrome/content/addonname-preferences.js`

⚠️ **IMPORTANT: Use Namespaced WL Reference**

**Do NOT access WL from global scope** - it may conflict with other add-ons or be overwritten:
```javascript
// ❌ WRONG - global WL can conflict with other add-ons
const context = WL.context;

// ✅ CORRECT - use unique namespace
const uniqueID = "AddOnNS" + AddonName.extension.instanceId;
const context = window[uniqueID].WL.context;
```

**Why:** Multiple add-ons using WindowListener can overwrite each other's global `WL` object. Always access via the unique namespace created by WindowListener (`window[uniqueRandomID].WL`). This is especially critical when:
- Injecting XHTML elements in privileged context
- Accessing storage or extension APIs
- Multiple add-ons are active simultaneously

**Best practice:** Store the namespaced reference once in your add-on's init:
```javascript
AddonName.WL = window["AddOnNS" + AddonName.extension.instanceId].WL;
```

### 4.1 Update `cache.init()`

Replace NotifyTools round-trip with direct storage read:

**Before:**
```javascript
cache.init: async function cache_init() {
  if (addonName.Util.notifyTools) {
    await addonName.Util.notifyTools.notifyBackground({ func: "requestPrefCache" });
  }
},
```

**After:**
```javascript
cache.init: async function cache_init() {
  try {
    const data = await AddonName.Storage.get({ settings: {}, debug: {}, model: { folders: [] } });
    
    // Merge settings
    if (data.settings) {
      for (let [key, value] of Object.entries(data.settings)) {
        cache._data[key] = value;
      }
    }
    
    // Merge debug (including debugActive → "debug" key mapping)
    if (data.debug) {
      for (let [key, value] of Object.entries(data.debug)) {
        if (key === "debugActive") {
          cache._data["debug"] = value;
        }
        cache._data[key] = value;
      }
    }
    
    // Store model separately if needed
    if (data.model) {
      cache._model = data.model;
    }
    
    addonName.Util.logDebug("Cache initialized with data:", cache._data);
  } catch (ex) {
    console.error("Cache init failed:", ex);
  }
},
```

### 4.2 Update `cache.setValue()`

Replace NotifyTools round-trip with direct storage write:

**Before:**
```javascript
cache.setValue: async function cache_setValue(prefName, value, silent) {
  cache._data[prefName] = value;
  if (addonName.Util.notifyTools) {
    await addonName.Util.notifyTools.notifyBackground({
      func: "setCachedPref",
      prefName,
      value
    });
  }
},
```

**After:**
```javascript
cache.setValue: async function cache_setValue(prefName, value, silent) {
  // Update synchronous cache immediately
  cache._data[prefName] = value;
  
  try {
    // Determine if debug or settings key
    const isDebug = prefName.startsWith("debug") || prefName === "debug";
    
    if (isDebug) {
      const { debug = {} } = await AddonName.Storage.get({ debug: {} });
      if (prefName === "debug") {
        debug.debugActive = value;
      } else {
        debug[prefName] = value;
      }
      await AddonName.Storage.set({ debug });
    } else {
      const { settings = {} } = await AddonName.Storage.get({ settings: {} });
      settings[prefName] = value;
      await AddonName.Storage.set({ settings });
    }
  } catch (ex) {
    console.error(`Failed to persist ${prefName}:`, ex);
  }
},
```

### 4.3 Update `cache.setValueSet()` (if exists)

For batch updates:

```javascript
cache.setValueSet: async function cache_setValueSet(prefs) {
  // Update synchronous cache
  for (let [key, value] of Object.entries(prefs)) {
    cache._data[key] = value;
  }
  
  try {
    const settingsChanges = {};
    const debugChanges = {};
    
    for (let [key, value] of Object.entries(prefs)) {
      if (key.startsWith("debug") || key === "debug") {
        if (key === "debug") {
          debugChanges.debugActive = value;
        } else {
          debugChanges[key] = value;
        }
      } else {
        settingsChanges[key] = value;
      }
    }
    
    if (Object.keys(settingsChanges).length > 0) {
      const { settings = {} } = await AddonName.Storage.get({ settings: {} });
      Object.assign(settings, settingsChanges);
      await AddonName.Storage.set({ settings });
    }
    
    if (Object.keys(debugChanges).length > 0) {
      const { debug = {} } = await AddonName.Storage.get({ debug: {} });
      Object.assign(debug, debugChanges);
      await AddonName.Storage.set({ debug });
    }
  } catch (ex) {
    console.error("Failed to persist batch update:", ex);
  }
},
```

### 4.4 Update `cache.storeModel()` (if exists)

For model/folder data:

```javascript
cache.storeModel: async function cache_storeModel(model) {
  cache._model = model;
  try {
    await AddonName.Storage.set({ model: { folders: model } });
  } catch (ex) {
    console.error("Failed to persist model:", ex);
  }
},
```

**Result:** All preference writes now go directly to storage, cache stays synchronous for reads.

### 4.5 Gate Options Page Initialization (Race Condition Fix)

**File:** Options page initialization (e.g., `html/options.js`)

When the options tab is restored on Thunderbird startup, there's a race condition between:
- WindowListener injecting scripts
- Options page trying to read preferences

**Problem:** Options page loads before cache.init() completes → reads undefined values

**Solution:** Wait for `sessionReady` flag before initializing preferences UI:

```javascript
async function init() {
  // Wait for WindowListener to inject scripts and initialize storage
  while (!AddonName.sessionReady) {
    await new Promise(resolve => setTimeout(resolve, 50));
  }
  
  // Now safe to initialize preferences cache
  await AddonName.Preferences.cache.init();
  
  // Load UI with preferences
  loadPreferencesIntoUI();
}

document.addEventListener("DOMContentLoaded", init);
```

**Set sessionReady flag** in your main bootstrap script after all scripts load:

```javascript
// In qf-messenger.js or similar (after all loadSubScript calls)
// Note: WL here is the namespaced version passed to bootstrap function
WL.loadSubScript(WL.chromeURL + "content/addonname.js", WL);
WL.loadSubScript(WL.chromeURL + "content/addonname-util.js", WL);
WL.loadSubScript(WL.chromeURL + "content/addonname-storage.js", WL);
WL.loadSubScript(WL.chromeURL + "content/addonname-preferences.js", WL);

// Signal that all scripts are loaded (using add-on's namespace, not global)
AddonName.sessionReady = true;
```

**Result:** Options tab waits for WindowListener initialization, preventing race conditions on startup tab restoration.

---

## Step 5: Update Background Script

**File:** `scripts/preferences.mjs` (or main background script)

### 5.1 Ensure storage.onChanged listener exists

```javascript
messenger.storage.onChanged.addListener((changes, area) => {
  if (area !== "local") return;
  if (!changes.settings && !changes.debug) return;
  
  const updates = {};
  
  if (changes.settings) {
    applyChanges(Preferences._data, changes.settings, updates, Preferences.Defaults);
  }
  
  if (changes.debug) {
    applyChanges(Preferences._debugData, changes.debug, updates, Preferences.DebugDefaults);
    if ("debugActive" in updates) {
      updates["debug"] = updates["debugActive"];
      delete updates["debugActive"];
    }
  }
  
  if (!Object.keys(updates).length) return;
  
  console.log("Preferences updates:", updates);
  messenger.Utilities.updatePreferencesCache(updates);
});
```

### 5.2 Remove obsolete NotifyTools handlers

**Remove these cases** from your NotifyTools message handler (typically in main background script):

```javascript
// DELETE:
case "setCachedPref":
case "setCachedPrefSet":
case "setCachedModel":
case "requestPrefCache":
```

### 5.3 Remove redundant updatePreferencesCache calls

Search for any direct calls to `messenger.Utilities.updatePreferencesCache()` in response to preference changes. These are now redundant because storage.onChanged automatically broadcasts changes.

**Example to remove:**
```javascript
// DELETE - storage.onChanged already broadcasts this
await messenger.Utilities.updatePreferencesCache({ 
  'someKey': someValue 
});
```

**Result:** Background script passively listens to storage changes and broadcasts to all windows automatically.

---

## Step 6: Verify Utilities API (No Changes Needed)

**File:** `chrome/content/api/Utilities/implementation.js`

The `updatePreferencesCache(data)` method should remain unchanged:

```javascript
updatePreferencesCache(data) {
  const windowTypes = ["mail:3pane", "msgcompose", "mail:messageWindow"];
  for (const windowType of windowTypes) {
    const windows = Services.wm.getEnumerator(windowType);
    while (windows.hasMoreElements()) {
      const win = windows.getNext();
      if (win.AddonName?.Preferences?.cache?.updateFromBackend) {
        win.AddonName.Preferences.cache.updateFromBackend(data);
      }
    }
  }
}
```

**No changes needed** - this method is still called by storage.onChanged listener.

---

## Step 7: Testing Checklist

### Initial Load
- [ ] Extension loads without errors
- [ ] Console shows "AddonNameStorage context: [object Object]"
- [ ] Preferences load correctly from storage
- [ ] UI reflects saved preferences

### Single Window
- [ ] Change preference → persists after restart
- [ ] Console shows storage get/set operations
- [ ] No "System modules must be loaded from a trusted scheme" errors

### Multi-Window
- [ ] Open main window + composer window
- [ ] Change preference in main window
- [ ] Composer window receives update (check via console or UI)
- [ ] Message window also synchronized

### Debug Keys
- [ ] Debug preferences (debug.*, debugActive) stored in { debug: {} }
- [ ] Regular preferences stored in { settings: {} }
- [ ] "debug" cache key properly mapped to debugActive

### Model/Folder Data (if applicable)
- [ ] Folder data persists in { model: { folders: [] } }
- [ ] Restored correctly on next load

### Edge Cases
- [ ] Rapid preference changes don't cause race conditions
- [ ] No NotifyTools errors about missing handlers
- [ ] Storage write failures logged to console

---

## Troubleshooting

### "Cannot read property 'WL' of undefined"
- Storage facade loads before WindowListener initializes
- **Fix:** Ensure storage script loads in bootstrap scripts, not globally

### "System modules must be loaded from a trusted scheme"
- Attempted to use ChromeUtils.importESModule() from extension URL
- **Fix:** Use the parent-side API pattern via WL.context (this guide)

### Preferences not synchronizing across windows
- storage.onChanged listener not active or not calling updatePreferencesCache
- **Fix:** Verify listener in background script and Utilities API implementation

### Race conditions on rapid changes
- Multiple writes to same key in quick succession
- **Fix:** Consider debouncing or batching writes (future optimization)

### Options page shows undefined/default values on startup
- Race condition: options tab restored before WindowListener initializes
- **Symptom:** Preferences UI loads with defaults instead of saved values
- **Fix:** Implement sessionReady gate (see Step 4.5)

### "WL is not defined" or context access fails intermittently
- Using global `WL` instead of namespaced `window[uniqueRandomID].WL`
- **Problem:** Multiple add-ons can overwrite each other's global WL object
- **Symptom:** Works with one add-on but breaks when multiple add-ons are active
- **Fix:** Always use namespaced reference (see Step 4 warning)

---

## Migration Strategy

For existing users upgrading from about:config preferences:

1. **Background script init:** Read legacy prefs, migrate to storage once
2. **Remove legacy prefs:** Optional cleanup after migration
3. **Fallback:** Keep defaults for fresh installs

**Example migration code** (in background init):
```javascript
async function migratePreferences() {
  const { migrated } = await messenger.storage.local.get({ migrated: false });
  if (migrated) return;
  
  // Read legacy about:config prefs
  const legacyPrefs = await messenger.Utilities.getLegacyPrefs();
  
  // Write to new storage
  await messenger.storage.local.set({
    settings: legacyPrefs,
    migrated: true
  });
  
  console.log("Preferences migrated to storage.local");
}
```

---

## Summary of Changes

| Component | Change Type | Description |
|-----------|-------------|-------------|
| WindowListener v1.66 | **Update** | Expose WL.context for parent-side API access |
| `addonname-storage.js` | **New File** | Storage facade using WL.context |
| Bootstrap scripts | **Modified** | Load storage facade in script sequence |
| `addonname-preferences.js` | **Refactored** | Replace NotifyTools with Storage.get/set |
| Background script | **Cleanup** | Remove NotifyTools handlers, keep storage.onChanged |
| Utilities API | **No Change** | Keep updatePreferencesCache for broadcasts |

**Files to delete:** None (NotifyTools may still be used for other purposes)

**Critical best practices:**
- ⚠️ Always use `window[uniqueRandomID].WL` instead of global `WL` to avoid add-on conflicts
- ⚠️ Implement `sessionReady` gate for options page to prevent race conditions
- ⚠️ Keep synchronous cache for reads, async writes to storage

**Net result:** 
- ✅ Direct storage access from chrome code
- ✅ No NotifyTools round-trips for preferences
- ✅ Multi-window sync via storage.onChanged
- ✅ Synchronous cache preserved for reads
- ✅ Reusable pattern across all add-ons

---

## Replication in Other Add-ons

To apply this pattern to quickFilters, SmartTemplates, quickMove, etc.:

1. Copy WindowListener v1.66 from QuickFolders (with changelog)
2. Create `addonname-storage.js` using template in Step 2
3. Update bootstrap scripts to load storage facade
4. Refactor preferences cache following Step 4 patterns (⚠️ avoid global `WL` usage)
5. Clean up background NotifyTools handlers per Step 5
6. Implement `sessionReady` gate if options tab exists (Step 4.5)
7. Test using checklist in Step 7

**Key pitfalls to avoid:**
- ❌ Using global `WL` reference in preferences or UI code
- ❌ Skipping `sessionReady` gate when options tab can be restored on startup
- ❌ Forgetting to load storage facade before preferences script
- ❌ Leaving obsolete NotifyTools handlers in background script

**Time estimate:** 1-2 hours per add-on (mostly testing)
