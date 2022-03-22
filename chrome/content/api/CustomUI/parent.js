var ex_customui = class extends ExtensionCommon.ExtensionAPI {
  getAPI(context) {
    const Cc = Components.classes;
    const { Services } = ChromeUtils.import(
        "resource://gre/modules/Services.jsm");
    const { ExtensionParent } = ChromeUtils.import(
        "resource://gre/modules/ExtensionParent.jsm");
    const { setTimeout } = ChromeUtils.import(
        "resource://gre/modules/Timer.jsm");
    const { E10SUtils } = ChromeUtils.import(
        "resource://gre/modules/E10SUtils.jsm");

    const XULNS =
        "http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul";

    // Window monitoring helper ===============================================
    // This permits monitoring of all kinds of windows, including those in
    // iframes. Registered listeners are called for all loaded windows.
    const loadedWindows = []; // array of all currently loaded windows
    const windowLoadListeners = []; // array of all registered callbacks
    {
      let active = true;
      const notifyListener = function(listener, window) {
        try {
          const listenerResult = listener(window);
          if (listenerResult instanceof Promise) {
            listenerResult.catch(console.error);
          }
        } catch(e) {
          Components.utils.reportError(e);
        }
      };
      let onWindowLoad;
      const windowMonitor = {
        // This method also supports raw dom windows, in addition to the usual
        // interface requestors
        onOpenWindow(window) {
          if (!(window instanceof Ci.nsIDOMWindow)) {
            window = window.QueryInterface(
                Ci.nsIInterfaceRequestor).getInterface(Ci.nsIDOMWindow);
          }
          if (window.document.readyState === "complete") {
            onWindowLoad(window);
          } else {
            window.addEventListener("load", () => {onWindowLoad(window);},
                {once: true});
          }
        },
        onCloseWindow(window) {
          // not intersted (we detect closing via unloading)
        },
        onWindowTitleChange(window, title) {
           // not interested
        }
      };
      const unloadEventListener = function(event) {
        const index = loadedWindows.indexOf(event.currentTarget);
        if (index >= 0) {
          loadedWindows.splice(index, 1);
        }
      };
      onWindowLoad = function(window) {
        if (!active || loadedWindows.indexOf(window) >= 0) {
          return; // we're done or did already load in this window
        }
        loadedWindows.push(window);
        window.addEventListener("unload", unloadEventListener, {once: true});

        // Find and monitor sub-windows in iframes
        const isChromeIFrame = function(node) {
          return node.tagName === "iframe" && node.namespaceURI === XULNS
              && node.getAttribute("type") !== "content";
        };
        const mutationObserver = new window.MutationObserver(mutations => {
          if (!active) {
            // Unregister mutation observer on the next mutation after context
            // close, as unregistering immediately would require us to keep
            // track of all observers individually.
            mutationObserver.disconnect();
            return;
          }
          // This observation strategy could lead to observing the same window
          // twice – but that's no problem as we only load once per window.
          for (let mutation of mutations) {
            if (mutation.type === "childList") {
              for (let node of mutation.addedNodes) {
                if (isChromeIFrame(node)) {
                  windowMonitor.onOpenWindow(node.contentWindow);
                }
              }
            } else if (mutation.type === "attributes") {
              if (isChromeIFrame(mutation.target)
                  && mutation.attributeName === "src") {
                windowMonitor.onOpenWindow(mutation.target.contentWindow);
              }
            }
          }
        });
        mutationObserver.observe(window.document,
            { childList: true, attributes: true, subtree: true });
        for (let iframe of window.document.getElementsByTagName("iframe")) {
          if (isChromeIFrame(iframe)) {
            windowMonitor.onOpenWindow(iframe.contentWindow);
          }
        }

        // Notify listeners about this window *after* completing our
        // registration tasks.
        for (let listener of windowLoadListeners) {
          notifyListener(listener, window);
        }
      };
      Services.wm.addListener(windowMonitor);
      for (let window of Services.wm.getEnumerator(null)) {
        windowMonitor.onOpenWindow(window);
      }
      context.callOnClose({close(){
        active = false;
        Services.wm.removeListener(windowMonitor);
        for (let window of loadedWindows) {
          window.removeEventListener("unload", unloadEventListener);
        }
      }});
    }

    // WebExtension frame helper ==============================================

    // Causes listeners on the onEvent API to fire within the given frame, for
    // an event with the given type and details. If expectResult is set, the
    // method returns a promise resolving to a truthy listener result or null
    // if no listener returned a truthy value or the request timed out.
    const fireWebextFrameEvent = function(frame, type, details, expectResult) {
      let result = undefined;
      let data = {type, details};
      if (expectResult) {
        // We register a temporary message listener that will resolve our result
        // promise, but is guaranteed to unregister after some time. To ensure
        // that the listener only catches the correct event, we add a message
        // token that should be sufficiently unique.
        // Note that we will always run into the timeout if the client API is
        // not loaded in the frame.
        data.token = Math.random().toString(36).substring(2, 15);
        result = new Promise(resolve => {
          let listener;
          const done = function(result) {
            // it is possible that the frame is already detached, in that case
            // we can't remove our listener.
            if (frame.messageManager) {
              frame.messageManager.removeMessageListener("ex:customui:onEvent",
                  listener);
            }
            resolve(result);
          };
          listener = {
            receiveMessage(message) {
              if (message.data.type === type
                  && message.data.token === data.token) {
                done(message.data.result);
              }
            }
          };
          frame.messageManager.addMessageListener("ex:customui:onEvent",
              listener);
          setTimeout(() => done(null), 1000); // maximal delay: 1 second
        });
      }
      frame.messageManager.sendAsyncMessage("ex:customui:onEvent", data);
      return result;
    };

    // Creates and inserts the WebExtension frame for the given URL and location
    // id as child of the given parent node (inserted before the given reference
    // node, if any), and returns an element containing it. The returned element
    // can be styled (for example for positioning) and has a
    // setCustomUIContextProperty(key, value) function to set
    // structured-clone-able data on the context exposed to the WebExtension as
    // well as a addCustomUILocalOptionsListener(listener) function to register
    // functions called with local options whenever the UI document calls
    // setLocalOptions().
    const insertWebextFrame = function(location, url, parentNode,
        referenceNode) {
      const result = parentNode.ownerDocument.createXULElement("browser");
      result.setAttribute("type", "content");
      result.setAttribute("transparent", "true");
      result.setAttribute("disablehistory", "true");
      result.setAttribute("messagemanagergroup", "webext-browsers");
      result.setAttribute("webextension-view-type", "customui");
      result.setAttribute("id", "customui-" + location + "-"
          + context.contextId + "-" + url);
      result.setAttribute("initialBrowsingContextGroupId",
          context.extension.policy.browsingContextGroupId);
      if (context.extension.remote) {
        result.setAttribute("remote", "true");
        result.setAttribute("remoteType", E10SUtils.getRemoteTypeForURI(url,
            true, false, E10SUtils.EXTENSION_REMOTE_TYPE, null,
            E10SUtils.predictOriginAttributes({ result })));
        result.setAttribute("maychangeremoteness", "true");
      }
      parentNode.insertBefore(result, referenceNode || null);
      const initBrowser = () => {
        ExtensionParent.apiManager.emit("extension-browser-inserted", result);
        result.messageManager.loadFrameScript(
            "chrome://extensions/content/ext-browser-content.js", false, true);
        result.messageManager.sendAsyncMessage("Extension:InitBrowser",
            { stylesheets: ExtensionParent.extensionStylesheets });
      }
      if (context.extension.remote) {
        result.addEventListener("DidChangeBrowserRemoteness", initBrowser);
        result.addEventListener("XULFrameLoaderCreated", initBrowser);
      } else {
        initBrowser();
      }
      const uiContext = {location};
      result.messageManager.addMessageListener("ex:customui:getContext",
          {receiveMessage(message) { return uiContext; }});
      result.setCustomUIContextProperty = function(key, value) {
        uiContext[key] = value;
        fireWebextFrameEvent(result, "context", uiContext, false);
      };
      let localOptions = {};
      const optionsListeners = [];
      result.addCustomUILocalOptionsListener = function(listener) {
        optionsListeners.push(listener);
        listener(localOptions);
      };
      result.messageManager.addMessageListener("ex:customui:setLocalOptions", {
        receiveMessage(message) {
          localOptions = message.data;
          for (let listener of optionsListeners) {
            listener(localOptions);
          }
          return true;
        }
      });
      result.src = url;
      return result;
    };

    // Removes the WebExtension frame with the given tag and URL from the given
    // document, and returns its parent node (or null if there is no such
    // frame.
    const removeWebextFrame = function(tag, url, document) {
      const frame = document.getElementById("customui-" + tag + "-"
          + context.contextId + "-" + url);
      if (!frame) {
        return null;
      }
      const result = frame.parentNode;
      result.removeChild(frame);
      return result;
    };

    // Sets the visibility of a WebExtension frame according to given options
    // and enables changing it dynamically through local options.
    const setWebextFrameDynamicVisibility = function(frame,  options) {
      frame.style.display = options.hidden ? "none" : "block";
      frame.addCustomUILocalOptionsListener(lOptions => {
        if (typeof lOptions.hidden === "boolean") {
          frame.style.display = lOptions.hidden ? "none" : "block";
        }
      });
    };

    // Sets a dimension ("width" or "height") of a WebExtension frame according
    // to given options / default pixel value and enables changing it
    // dynamically through local options.
    const setWebextFrameDynamicDimension = function(frame, options,
        dimensionName, defaultValue) {
      frame[dimensionName] = (options[dimensionName] || defaultValue) + "px";
      frame.addCustomUILocalOptionsListener(lOptions => {
        if (typeof lOptions[dimensionName] === "number") {
          frame[dimensionName] = lOptions[dimensionName] + "px";
          frame.style[dimensionName] = frame[dimensionName];
        }
      });
    };

    // Enables dynamic height & visibility with fixed 100% width for a
    // WebExtension frame registered with given options
    const setWebextFrameSizesForVerticalBox = function(frame, options) {
      frame.width = "100%";
      setWebextFrameDynamicVisibility(frame, options);
      setWebextFrameDynamicDimension(frame, options, "height", 100);
    }
    
    // Creates and inserts the WebExtension frame with additional user provided options
    // for the given URL and location id as element of a customUI-specific sidebar
    // within the container given by a document and the container's id.
    // Returns an element containing the new frame and supporting
    // all functions documented for insertWebextFrame().
    // To remove frames created by this method, use removeSidebarWebextFrame().
    const insertSidebarWebextFrame = function(location, url, document,
        containerId, options) {
      const sidebarBoxId = "customui-sidebar-box-" + containerId;
      let sidebar = document.getElementById(sidebarBoxId);
      if (!sidebar) {
        const container = document.getElementById(containerId);

        const splitter = document.createXULElement("splitter");
        splitter.style["border-inline-end-width"] = "0";
        splitter.style["border-inline-start"] =
            "1px solid var(--splitter-color)";
        splitter.style["min-width"] = "0";
        splitter.style["width"] = "5px";
        splitter.style["background-color"] = "transparent";
        splitter.style["margin-inline-end"] = "-5px";
        splitter.style["position"] = "relative";
        container.appendChild(splitter);           
        
        sidebar = document.createXULElement("vbox");
        sidebar.setAttribute("persist", "width");
        sidebar.id = sidebarBoxId;
        container.appendChild(sidebar);
      }
      const result = insertWebextFrame(location, url, sidebar);
      // Permit dynamic sizing and visibility. This does permit the sidebar to
      // be visible but empty (if all frames are hidden) or unreasonably large
      // (if the largest requested width is too large); an implementation for
      // Core inclusion might want to address these issues.
      setWebextFrameDynamicVisibility(result, options);
      setWebextFrameDynamicDimension(result, options, "width", 244);
      result.flex = "1";
      return result;
    };

    // Removes the WebExtension frame with the given tag and URL from the given
    // document, and returns its parent node (or null if there is no such
    // frame.
    const removeSidebarWebextFrame = function(tag, url, document) {
      const sidebar = removeWebextFrame(tag, url, document);
      if (sidebar && sidebar.childElementCount == 0) {
        sidebar.previousSibling.remove(); // splitter
        sidebar.remove();
      }
    };

    // Location-specific handlers =============================================
    const locationHandlers = {};
    {
      // Helper to reduce boilerplate: adds mandatory handler components with
      // reasonable default implementations and initializes the result.
      function makeLocationHandler(handler) {
        // Map from registered urls to their options
        handler.registered = new Map();
        // Registers an URL, if it has not been registered before.
        handler.onAdd = function(url, options) {
          if (this.registered.has(url)) {
            // already registered, unregister first to trigger a reload
            this.onRemove(url);
          }
          this.registered.set(url, options);
          if (this.injectIntoWindow) {
            for (let window of loadedWindows) {
              this.injectIntoWindow(window, url, options);
            }
          }
        };
        // Unregisters an URL, if it has been registered before.
        handler.onRemove = function(url) {
          if (!this.registered.has(url)) {
            return; // was not registered
          }
          this.registered.delete(url);
          if (this.uninjectFromWindow) {
            for (let window of loadedWindows) {
              this.uninjectFromWindow(window, url);
            }
          }
        };
        // Unregisters all registered URLs
        handler.onRemoveAll = function() {
          for (let url of this.registered.keys()) {
            this.onRemove(url);
          }
        };
        // Create listeners
        if (handler.injectIntoWindow) {
          windowLoadListeners.push((window) => {
            for (let [url, options] of handler.registered) {
              handler.injectIntoWindow(window, url, options);
            }
          });
        }
        // Return updated handler
        return handler;
      }

      // Address Book ---------------------------------------------------------
      locationHandlers.addressbook = makeLocationHandler({
        injectIntoWindow(window, url, options) {
          if (window.location.toString()
              !== "chrome://messenger/content/addressbook/addressbook.xhtml") {
            return; // incompatible window
          }
          const sidebar = window.document.getElementById("dirTreeBox");
          const frame = insertWebextFrame("addressbook", url, sidebar);
          setWebextFrameSizesForVerticalBox(frame, options);
        },
        uninjectFromWindow(window, url) {
          removeWebextFrame("addressbook", url, window.document);
        }
      });

      // Contact editing ------------------------------------------------------
      const cardWindowLocations = [
        "chrome://messenger/content/addressbook/abNewCardDialog.xhtml",
        "chrome://messenger/content/addressbook/abEditCardDialog.xhtml"
      ];
      for (let [suffix, tabId] of [
          ["", "abOtherTab"],
          ["_home", "abHomeTab"],
          ["_work", "abBusinessTab"]]) {
        const locationName = "addressbook_contact_edit" + suffix;
        locationHandlers[locationName] = makeLocationHandler({
          injectIntoWindow(window, url, options) {
            const dialogType = cardWindowLocations.indexOf(
                window.location.toString()); // 0 for new, 1 for editing
            if (dialogType < 0) {
              return; // incompatible window
            }
            const tab = window.document.getElementById(tabId);
            const frame = insertWebextFrame(locationName, url, tab);
            setWebextFrameSizesForVerticalBox(frame, options);

            // Hook up the 'id' and 'parentid' context properties
            if (dialogType === 1) { // editing existing card
              frame.setCustomUIContextProperty("id", window.gEditCard
                  && window.gEditCard.card ? window.gEditCard.card.UID : null);
              const containingDir = window.gEditCard && window.gEditCard.abURI
                  ? window.getContainingDirectory() : null;
              frame.setCustomUIContextProperty("parentid", containingDir
                  ? containingDir.UID : null);
              const origGetCardValues = window.GetCardValues;
              window.GetCardValues = function(card, document) {
                if (window.document.contains(frame) && card
                    && document === window.document) {
                  try {
                    frame.setCustomUIContextProperty("id", card.UID);
                    frame.setCustomUIContextProperty("parentid",
                        window.getContainingDirectory().UID);
                  } catch (e) {
                    // Never block the original implementation, just log issues
                    console.error(e);
                  }
                }
                return origGetCardValues.apply(this, arguments);
              }
            } else { // creating new card
              frame.setCustomUIContextProperty("id", null);
              const abPopup = window.document.getElementById("abPopup");
              const getDirUID = () => {
                const value = abPopup ? abPopup.value : null;
                return value ? window.GetDirectoryFromURI(value).UID : null;
              };
              frame.setCustomUIContextProperty("parentid", getDirUID());
              // abPopup is not necessarily initialized yet, workaround:
              window.setTimeout(() => {
                frame.setCustomUIContextProperty("parentid", getDirUID());
              }, 0);
              if (abPopup) {
                abPopup.addEventListener("command", () => {
                  if (window.document.contains(frame)) {
                    frame.setCustomUIContextProperty("parentid", getDirUID());
                  }
                });
              } else {
                console.warn("New contact window missing abPopup");
              }
            }

            // Hook up the 'apply' event, permitting WebExtensions to alter
            // properties on the card before saving.
            const origCheckAndSetCardValues = window.CheckAndSetCardValues;
            window.CheckAndSetCardValues = function(card, doc, check) {
              const result = origCheckAndSetCardValues.apply(this, arguments);
              if (window.document.contains(frame) && window.document === doc
                  && card) {
                let props = {};
                for (let prop of card.properties) {
                  props[prop.name] = prop.value;
                }
                // Temporarily disable the dialog, while we asynchronously
                // do our event thing. As we're hooking into a synchronous API,
                // we will block until the method ends by repeatedly yielding
                // to other tasks (which keeps the UI responsive).
                const dialog = window.document.getElementById("abcardDialog");
                const origVisibility = dialog.style.visibility;
                dialog.style.visibility = "hidden";
                let done = false;
                let error = null;
                let newProps = null;
                fireWebextFrameEvent(frame, "apply", props, true).then(
                    p => newProps = p).catch(e => error = e).finally(
                    () => done = true);
                const thread = Cc["@mozilla.org/thread-manager;1"].getService()
                    .currentThread;
                while (!done) {
                  thread.processNextEvent(true);
                }
                dialog.style.visibility = origVisibility;
                if (error !== null) {
                  throw error;
                }
                if (newProps) {
                  for (let prop of Object.keys(newProps)) {
                    // note: if this experiment should get migrated to the core,
                    // it might be reasonable to apply a blacklist here for
                    // consistency with the contacts API (preventing changes of
                    // internal properties).
                    card.setProperty(prop, newProps[prop]);
                  }
                }
              }
              return result;
            };
          },
          uninjectFromWindow(window, url) {
            removeWebextFrame(locationName, url, window.document);
            // Contact editing windows don't live long, so cleanup of our
            // injections is not really necessary (as they become transparent
            // once the frame is gone).
          }
        });
      }

      // Calendar -------------------------------------------------------------
      locationHandlers.calendar = makeLocationHandler({
        injectIntoWindow(window, url, options) {
          if (window.location.toString()
              !== "chrome://messenger/content/messenger.xhtml") {
            return; // incompatible window
          }
          const sidebar = window.document.getElementById("calSidebar") // TB 91+
              || window.document.getElementById("ltnSidebar"); // earlier
          const frame = insertWebextFrame("calendar", url, sidebar);
          setWebextFrameSizesForVerticalBox(frame, options);
        },
        uninjectFromWindow(window, url) {
          removeWebextFrame("calendar", url, window.document);
        }
      });

      // Calendar editing -----------------------------------------------------
      const itemIframeURLs = [
        "chrome://calendar/content/calendar-item-iframe.xhtml", // TB 91+
        "chrome://lightning/content/lightning-item-iframe.xhtml" // earlier
      ];
      locationHandlers.calendar_event_edit = makeLocationHandler({
        injectIntoWindow(window, url, options) {
          if (itemIframeURLs.indexOf(window.location.toString()) < 0) {
            return; // incompatible window
          }
          const calendarItem = window.arguments[0].calendarEvent;
          if (!((calendarItem.isEvent && calendarItem.isEvent()) // TB 87+
                || window.cal.item.isEvent(calendarItem) // earlier
              )) {
            return; // item iframe for a non-event item, also incompatible
          }
          const tabBox = window.document.getElementById("event-grid-tab-vbox");
          const frame = insertWebextFrame("calendar_event_edit", url,
              tabBox.parentElement, tabBox);
          setWebextFrameSizesForVerticalBox(frame, options);

          frame.setCustomUIContextProperty("id", calendarItem.id);
          frame.setCustomUIContextProperty("parentid",
              calendarItem.calendar.id);
        },
        uninjectFromWindow(window, url) {
          removeWebextFrame("calendar_event_edit", url, window.document);
        }
      });

      // Message composition --------------------------------------------------
      locationHandlers.compose = makeLocationHandler({
        injectIntoWindow(window, url, options) {
          if (window.location.toString() !== "chrome://messenger/content/"
              + "messengercompose/messengercompose.xhtml") {
            return; // incompatible window
          }
          insertSidebarWebextFrame("compose", url, window.document,
              "composeContentBox", options);
        },
        uninjectFromWindow(window, url) {
          removeSidebarWebextFrame("compose", url, window.document);
        }
      });
      
      // Messaging ------------------------------------------------------------
      locationHandlers.messaging = makeLocationHandler({
        injectIntoWindow(window, url, options) {
          if (window.location.toString() !== "chrome://messenger/content/"
              + "messenger.xhtml") {
            return; // incompatible window
          }
          insertSidebarWebextFrame("messaging", url, window.document,
              "messengerBox", options);
        },
        uninjectFromWindow(window, url) {
          removeSidebarWebextFrame("messaging", url, window.document);
        }
      });

      // Dialog when opening files with unknown content type ------------------
      locationHandlers.unknown_file_action = makeLocationHandler({
        injectIntoWindow(window, url, options) {
          if (window.location.toString() !== "chrome://mozapps/content/"
              + "downloads/unknownContentType.xhtml") {
            return; // incompatible window
          }
          const container = window.document.getElementById("container");
          const frame = insertWebextFrame("unknown_file_action", url,
              container);
          setWebextFrameSizesForVerticalBox(frame, options);

          frame.setCustomUIContextProperty("url",
              window.dialog.mLauncher.source.spec);
          frame.setCustomUIContextProperty("type",
              window.dialog.mLauncher.MIMEInfo.MIMEType);
          frame.setCustomUIContextProperty("filename",
              window.dialog.mLauncher.suggestedFileName);
        },
        uninjectFromWindow(window, url) {
          removeWebextFrame("unknown_file_action", url, window.document);
        }
      });
    }

    // The actual API =========================================================
    context.callOnClose({close(){
      for (let locationHandler of Object.values(locationHandlers)) {
        locationHandler.onRemoveAll();
      }
    }});
    return {
      ex_customui: {
        async add(location, url, options) {
          if (!locationHandlers[location]) {
            throw new context.cloneScope.Error("Unsupported location: "
                + location);
          }
          url = context.extension.baseURI.resolve(url);
          locationHandlers[location].onAdd(url, options || {});
        },
        async remove(location, url) {
          if (!locationHandlers[location]) {
            throw new context.cloneScope.Error("Unsupported location: "
                + location);
          }
          url = context.extension.baseURI.resolve(url);
          locationHandlers[location].onRemove(url);
        }
      }
    };
  }
};
