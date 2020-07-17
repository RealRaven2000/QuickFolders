// Import some things we need. 
var { ExtensionCommon } = ChromeUtils.import("resource://gre/modules/ExtensionCommon.jsm");
var { ExtensionSupport } = ChromeUtils.import("resource:///modules/ExtensionSupport.jsm");
var { Services } = ChromeUtils.import("resource://gre/modules/Services.jsm");

var WindowListener = class extends ExtensionCommon.ExtensionAPI {
  getAPI(context) {

    // track if this is the background/main context
    this.isBackgroundContext = (context.viewType == "background");
    if (this.isBackgroundContext) {
      context.callOnClose(this);      
    }

    this.registeredWindows = {};
    this.pathToShutdownScript = null;
    this.chromeHandle = null;
    this.openWindows = [];
    this.namespace = "";

    const aomStartup = Cc["@mozilla.org/addons/addon-manager-startup;1"].getService(Ci.amIAddonManagerStartup);

    let self = this;

    return {
      WindowListener: {
        
        registerChromeUrl(chromeData) {
          if (!self.isBackgroundContext) 
            throw new Error("The WindowListener API may only be called from the background page.");

          const manifestURI = Services.io.newURI(
            "manifest.json",
            null,
            context.extension.rootURI
          );
          self.chromeHandle = aomStartup.registerChrome(manifestURI, chromeData);          
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

        registerShutdownScript(aPath) {
          if (!self.isBackgroundContext) 
            throw new Error("The WindowListener API may only be called from the background page.");

          self.pathToShutdownScript = aPath.startsWith("chrome://") 
            ? aPath
            : context.extension.rootURI.resolve(aPath);
        },
        
        startListening(namespace) {
          if (!self.isBackgroundContext) 
            throw new Error("The WindowListener API may only be called from the background page.");

          self.namespace = namespace;
          let urls = Object.keys(self.registeredWindows);
          if (urls.length > 0) {
            // Before registering the window listener, check which windows are already open
            self.openWindows = [];
            for (let window of Services.wm.getEnumerator(null)) {
              self.openWindows.push(window);
            }
            
            
            // Register window listener for all pre-registered windows
            ExtensionSupport.registerWindowListener("injectListener", {
              chromeURLs: Object.keys(self.registeredWindows),
              onLoadWindow(window) {
                try {
                  // Create add-on specific namespace
                  window[namespace] = {};
                  // Make extension object available in loaded JavaScript
                  window[namespace].extension = self.extension;
                  // Add messenger obj
                  window[namespace].messenger = Array.from(self.extension.views).find(
                    view => view.viewType === "background").xulBrowser.contentWindow
                    .wrappedJSObject.browser;                  
                  // Load script into add-on specific namespace
                  Services.scriptloader.loadSubScript(self.registeredWindows[window.location.href], window[namespace], "UTF-8");
                  // Call onLoad(window, wasAlreadyOpen)
                  window[namespace].onLoad(window, self.openWindows.includes(window));
                } catch (e) {
                  Components.utils.reportError(e)
                }
              },
              onUnloadWindow(window) {
                //  Remove this window from the list of open windows
                self.openWindows = self.openWindows.filter(e => (e != window));    
                
                try {
                  // Call onUnload()
                  window[self.namespace].onUnload(window, false);
                } catch (e) {
                  Components.utils.reportError(e)
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

  close() {
    console.log("WindowListener API is shutting down");
  
    // Unload from all still open windows
    let urls = Object.keys(this.registeredWindows);
    if (urls.length > 0) {          
      for (let window of Services.wm.getEnumerator(null)) {
        if (this.registeredWindows.hasOwnProperty(window.location.href)) {
          try {
            // Call onUnload()
            window[this.namespace].onUnload(window, true);
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
    
    // Flush all caches
    Services.obs.notifyObservers(null, "startupcache-invalidate");
    this.registeredWindows = {};
    
    if (this.chromeHandle) {
      this.chromeHandle.destruct();
      this.chromeHandle = null;
    }    
  }
};
