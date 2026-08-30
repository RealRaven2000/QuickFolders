"use strict";
/* 
  BEGIN LICENSE BLOCK

	QuickFolders is released under the Creative Commons (CC BY-ND 4.0)
	Attribution-NoDerivatives 4.0 International (CC BY-ND 4.0) 
	For details, please refer to license.txt in the root folder of this extension

  END LICENSE BLOCK 
*/

// Direct access to browser.storage.local from legacy chrome code
QuickFolders.Storage = new (class LocalStorage {
  constructor(extensionId) {
    var { ExtensionParent } = ChromeUtils.importESModule(
      "resource://gre/modules/ExtensionParent.sys.mjs"
    );
    const extension = ExtensionParent.GlobalManager.getExtension(extensionId);
    if (!extension) {
      throw new Error(`QuickFolders extension context not found: ${extensionId}`);
    }
    this.uniqueRandomID = "AddOnNS" + extension.instanceId;

    // Standalone chrome dialogs are not WindowListener-injected.
    // Temporarily obtain the extension API from their injected opener.
    // Remove when dialogs become WebExtension HTML pages.
    const hostWindow = window[this.uniqueRandomID]?.WL ? window : window.opener;
    const WL = hostWindow?.[this.uniqueRandomID]?.WL;
    if (!WL) {
      throw new Error("QuickFolders WindowListener context unavailable");
    }

    this._context = WL.context;
    // Read debug flag once at initialization!
    try {
      this._debugCache = Services.prefs.getBoolPref("extensions.quickfolders.debug.storage.cache");
    } catch {
      // something goes wrong - then we debug!
      this._debugCache = true;
    }
  }

  getTimestamp() {
    return (Date.now() / 100).toFixed(1) + "s";
  }

  logDebug(...args) {
    if (!this._debugCache) {
      return;
    }
    console.log(`[QF Storage] [${this.getTimestamp()}]`, ...args);
  }

  async _init() {
    if (this._storage) {
      return;
    }
    
    const maxRetries = 6;
    const delays = [100, 500, 1000, 2000, 4000, 10000]; // total ~7.6s
    
    // An Experiment runs in the parent process, where the local storage only
    // exposes callMethodInParentProcess(). The familiar get/set/remove/clear
    // belong to the child process implementation.
    
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        this._storage = this._context.apiCan.findAPIPath("storage");
        this._call =
          (method) =>
          (...args) =>
            this._storage.local.callMethodInParentProcess(method, args);

        // Test that storage is actually accessible with a minimal call
        await this._call("get")("dummy"); // becomes await browser.storage.local.get("dummy");
        this.logDebug(`_init() SUCCESS after ${attempt + 1} attempt(s)`);
        return;
      } catch (ex) {
        const isLastAttempt = attempt === maxRetries - 1;
        
        // Detect if it's likely an IndexedDB initialization error (for diagnostic logging)
        const isIndexedDBError = 
          ex.message?.includes("database") ||
          ex.message?.includes("IndexedDB") ||
          ex.name === "UnknownError";
        
        if (isLastAttempt) {
          console.error(`[Storage._init] FAILED after ${maxRetries} attempts:`, ex);
          this.logDebug("_init() Error details:", ex.name, ex.message, ex.stack);
          // Reset state so next call retries
          this._storage = null;
          this._call = null;
          throw ex;
        }
        
        // Startup issue - retry with backoff
        const delay = delays[attempt];
        const errorType = isIndexedDBError
          ? "IndexedDB issue detected"
          : "Storage initialization failed";
        this.logDebug(
          `_init() ${errorType} (${ex.message}), retrying in ${delay}ms (attempt ${attempt + 1}/${maxRetries})`
        );
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  async get(keys = null) {
    this.logDebug("get() START - keys:", keys);
    try {
      await this._init();
      const rv = await this._call("get")(keys);
      this.logDebug("get() SUCCESS - returned keys:", Object.keys(rv));
      return rv;
    } catch (ex) {
      console.error("[Storage.get] FAILED:", ex);
      this.logDebug("get() Error details:", ex.name, ex.message, ex.stack);
      throw ex;
    }
  }
  
  async getWithRetry(keys = null, timeout = 5000) {
    const delays = [250, 1000, 5000, 8000];
    for (let attempt = 0; ; attempt++) {
      let timeoutId;
      try {
        return await Promise.race([
          this.get(keys),
          new Promise((_, reject) => {
            timeoutId = setTimeout(
              () => reject(new Error(`Storage.get() timed out after ${timeout}ms`)),
              timeout
            );
          }),
        ]);
      } catch (ex) {
        if (attempt >= delays.length) {
          throw ex;
        }
        this._storage = null;
        this._call = null;
        await new Promise((resolve) => setTimeout(resolve, delays[attempt]));
      } finally {
        clearTimeout(timeoutId);
      }
    }
  }

  async set(items) {
    this.logDebug("set() START - keys:", Object.keys(items));
    try {
      await this._init();
      const result = await this._call("set")(items);
      this.logDebug("set() SUCCESS");
      return result;
    } catch (ex) {
      console.error("[Storage.set] FAILED:", ex);
      this.logDebug("set() Error details:", ex.name, ex.message, ex.stack);
      throw ex;
    }
  }

  async remove(keys) {
    await this._init();
    return this._call("remove")(keys);
  }

  async clear() {
    await this._init();
    return this._call("clear")();
  }
})("quickfolders@curious.be");

