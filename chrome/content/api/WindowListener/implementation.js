/*
 * This file is provided by the addon-developer-support repository at
 * https://github.com/thundernest/addon-developer-support
 *
 * Version: 1.5
 * Author: John Bieling (john@thunderbird.net)
 * 
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. 
 */


// Import some things we need. 
var { ExtensionCommon } = ChromeUtils.import("resource://gre/modules/ExtensionCommon.jsm");
var { ExtensionSupport } = ChromeUtils.import("resource:///modules/ExtensionSupport.jsm");
var { Services } = ChromeUtils.import("resource://gre/modules/Services.jsm");

var WindowListener = class extends ExtensionCommon.ExtensionAPI {
  getAPI(context) {
    // track if this is the background/main context
    this.isBackgroundContext = (context.viewType == "background");
    
    this.namespace = "AddOnNS" + context.extension.instanceId;
    this.menu_addonsManager_id ="addonsManager";
    this.menu_addonsManager_prefs_id = "addonsManager_prefs_revived";
    this.menu_addonPrefs_id = "addonPrefs_revived";

    this.registeredWindows = {};
    this.pathToStartupScript = null;
    this.pathToShutdownScript = null;
    this.pathToOptionsPage = null;
    this.chromeHandle = null;
    this.chromeData = null;
    this.openWindows = [];
  
    const aomStartup = Cc["@mozilla.org/addons/addon-manager-startup;1"].getService(Ci.amIAddonManagerStartup);
    
    let self = this;
    
    this.counts = 0;
    
    return {
      WindowListener: {
        
        consolelog_test() {
         console.log("from windowslistener experiment");
        },
        registerOptionsPage(optionsUrl) {
          self.pathToOptionsPage = optionsUrl.startsWith("chrome://") 
            ? optionsUrl 
            : context.extension.rootURI.resolve(optionsUrl);
        },
        
        registerDefaultPrefs(defaultUrl) {
          let url = context.extension.rootURI.resolve(defaultUrl);
          let prefsObj = {};
          prefsObj.Services = ChromeUtils.import("resource://gre/modules/Services.jsm").Services;
          prefsObj.pref = function(aName, aDefault) {
            let defaults = Services.prefs.getDefaultBranch("");
            switch (typeof aDefault) {
              case "string":
                  return defaults.setCharPref(aName, aDefault);

              case "number":
                  return defaults.setIntPref(aName, aDefault);
              
              case "boolean":
                  return defaults.setBoolPref(aName, aDefault);
                
              default:
                throw new Error("Preference <" + aName + "> has an unsupported type <" + typeof aDefault + ">. Allowed are string, number and boolean.");            
            }
          }          
          Services.scriptloader.loadSubScript(url, prefsObj, "UTF-8");
        },
        
        registerChromeUrl(chromeData) {
          if (!self.isBackgroundContext) 
            throw new Error("The WindowListener API may only be called from the background page.");

          const manifestURI = Services.io.newURI(
            "manifest.json",
            null,
            context.extension.rootURI
          );
          self.chromeHandle = aomStartup.registerChrome(manifestURI, chromeData);
          self.chromeData = chromeData;
        },

        registerWindow(windowHref, jsFile) {
          if (!self.isBackgroundContext) 
            throw new Error("The WindowListener API may only be called from the background page.");

          if (!self.registeredWindows.hasOwnProperty(windowHref)) {
            // path to JS file can either be chrome:// URL or a relative URL
            let path = jsFile.startsWith("chrome://") 
              ? jsFile 
              : context.extension.rootURI.resolve(jsFile)
            self.registeredWindows[windowHref] = path;
          } else {
            console.error("Window <" +windowHref + "> has already been registered");
          }
        },

        registerStartupScript(aPath) {
          if (!self.isBackgroundContext) 
            throw new Error("The WindowListener API may only be called from the background page.");

          self.pathToStartupScript = aPath.startsWith("chrome://") 
            ? aPath
            : context.extension.rootURI.resolve(aPath);
        },
        
        registerShutdownScript(aPath) {
          if (!self.isBackgroundContext) 
            throw new Error("The WindowListener API may only be called from the background page.");

          self.pathToShutdownScript = aPath.startsWith("chrome://") 
            ? aPath
            : context.extension.rootURI.resolve(aPath);
        },
        
        startListening() {
          if (!self.isBackgroundContext) 
            throw new Error("The WindowListener API may only be called from the background page.");

          let urls = Object.keys(self.registeredWindows);
          if (urls.length > 0) {
            // Before registering the window listener, check which windows are already open
            self.openWindows = [];
            for (let window of Services.wm.getEnumerator(null)) {
              self.openWindows.push(window);
            }
            
            // Register window listener for all pre-registered windows
            ExtensionSupport.registerWindowListener("injectListener", {
              // React on all windows and manually reduce to the registered
              // windows, so we can do special actions when the main 
              // messenger window is opened.
              //chromeURLs: Object.keys(self.registeredWindows),
              onLoadWindow(window) {                
                // special action if this is the main messenger window
                if (window.location.href == "chrome://messenger/content/messenger.xul" ||
                  window.location.href == "chrome://messenger/content/messenger.xhtml") {

                  if (self.pathToOptionsPage) {                   
                    try {
                      // add the add-on options menu if needed
                      if (!window.document.getElementById(self.menu_addonsManager_prefs_id)) {
                        let addonprefs = window.MozXULElement.parseXULToFragment(`
                          <menu id="${self.menu_addonsManager_prefs_id}" label="&addonPrefs.label;">
                            <menupopup id="${self.menu_addonPrefs_id}">
                            </menupopup>
                          </menu>                    
                        `, ["chrome://messenger/locale/messenger.dtd"]);
                      
                      let element_addonsManager = window.document.getElementById(self.menu_addonsManager_id);
                      element_addonsManager.parentNode.insertBefore(addonprefs, element_addonsManager.nextSibling);	
                      }
                      
                      // add the options entry
                      let element_addonPrefs = window.document.getElementById(self.menu_addonPrefs_id);
                      let id = self.menu_addonPrefs_id + "_" + self.namespace;
                      let icon = self.extension.manifest.icons[16];
                      let name = self.extension.manifest.name;
                      let entry = window.MozXULElement.parseXULToFragment(
                        `<menuitem class="menuitem-iconic" id="${id}" image="${icon}" label="${name}" />`);
                      element_addonPrefs.appendChild(entry);
                      window.document.getElementById(id).addEventListener("command", function() {window.openDialog(self.pathToOptionsPage, "AddonOptions")});
                    } catch (e) {
                      Components.utils.reportError(e)
                    }
                  }
                  
                  // load the registered startup script, if one has been registered
                  // (only for the initial main window9
                  if (self.counts == 0 && self.pathToStartupScript) {
                    self.counts++;
                    let startupJS = {};
                    startupJS.extension = self.extension;
                    try {
                      if (self.pathToStartupScript) Services.scriptloader.loadSubScript(self.pathToStartupScript, startupJS, "UTF-8");
                    } catch (e) {
                      Components.utils.reportError(e)
                    }                    
                  }
                }
                                
                if (self.registeredWindows.hasOwnProperty(window.location.href)) {
                  try {
                    // Create add-on specific namespace
                    window[self.namespace] = {};
                    window[self.namespace].namespace = self.namespace;
                    window[self.namespace].window = window;
                    window[self.namespace].document = window.document;
                    
                    // Make extension object available in loaded JavaScript
                    window[self.namespace].extension = self.extension;
                    // Add messenger obj
                    window[self.namespace].messenger = Array.from(self.extension.views).find(
                      view => view.viewType === "background").xulBrowser.contentWindow
                      .wrappedJSObject.browser;                  
                    // Load script into add-on specific namespace
                    Services.scriptloader.loadSubScript(self.registeredWindows[window.location.href], window[self.namespace], "UTF-8");
                    // Call onLoad(window, wasAlreadyOpen)
                    window[self.namespace].onLoad(self.openWindows.includes(window));
                  } catch (e) {
                    Components.utils.reportError(e)
                  }
                }
              },

              onUnloadWindow(window) {
                if (self.registeredWindows.hasOwnProperty(window.location.href)) {
                  //  Remove this window from the list of open windows
                  self.openWindows = self.openWindows.filter(e => (e != window));    
                  
                  try {
                    // Call onUnload()
                    window[self.namespace].onUnload(false);
                  } catch (e) {
                    Components.utils.reportError(e)
                  }
                }
              }
            });
          } else {
            console.error("Failed to start listening, no windows registered");
          }
        },
        
      }
    };
  }

  onShutdown(isAppShutdown) {
    if (isAppShutdown)
      return;
  
    // Unload from all still open windows
    let urls = Object.keys(this.registeredWindows);
    if (urls.length > 0) {          
      for (let window of Services.wm.getEnumerator(null)) {

        //remove our entry in the add-on options menu
        if (
          this.pathToOptionsPage && 
          (window.location.href == "chrome://messenger/content/messenger.xul" ||
          window.location.href == "chrome://messenger/content/messenger.xhtml")) {            
          let id = this.menu_addonPrefs_id + "_" + this.namespace;
          window.document.getElementById(id).remove();
          
          //do we have to remove the entire add-on options menu?
          let element_addonPrefs = window.document.getElementById(this.menu_addonPrefs_id);
          if (element_addonPrefs.children.length == 0) {
            window.document.getElementById(this.menu_addonsManager_prefs_id).remove();
          }
        }
          
        if (this.registeredWindows.hasOwnProperty(window.location.href)) {
          try {
            // Call onUnload()
            window[this.namespace].onUnload(true);
          } catch (e) {
            Components.utils.reportError(e)
          }
        }
      }
      // Stop listening for new windows.
      ExtensionSupport.unregisterWindowListener("injectListener");
    }
    
    // Load registered shutdown script
    let shutdownJS = {};
    shutdownJS.extension = this.extension;
    try {
      if (this.pathToShutdownScript) Services.scriptloader.loadSubScript(this.pathToShutdownScript, shutdownJS, "UTF-8");
    } catch (e) {
      Components.utils.reportError(e)
    }

    // Extract all registered chrome content urls
    let chromeUrls = [];
    if (this.chromeData) {
        for (let chromeEntry of this.chromeData) {
        if (chromeEntry[0].toLowerCase().trim() == "content") {
          chromeUrls.push("chrome://" + chromeEntry[1] + "/");
        }
      }
    }

    // Unload JSMs of this add-on    
    const rootURI = this.extension.rootURI.spec;
    for (let module of Cu.loadedModules) {
      if (module.startsWith(rootURI) || (module.startsWith("chrome://") && chromeUrls.find(s => module.startsWith(s)))) {
        console.log("Unloading: " + module);
        Cu.unload(module);
      }
    }    

    // Flush all caches
    Services.obs.notifyObservers(null, "startupcache-invalidate");
    this.registeredWindows = {};
    
    if (this.chromeHandle) {
      this.chromeHandle.destruct();
      this.chromeHandle = null;
    }    
  }
};
