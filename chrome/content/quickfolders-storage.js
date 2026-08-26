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
    this.uniqueRandomID = "AddOnNS" + extension.instanceId;
    this._context = window[this.uniqueRandomID].WL.context;
    console.log("QuickFoldersStorage context:", this._context);
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
    console.log(`QuickFoldersStorage get`, keys, rv);
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
})("quickfolders@curious.be");

