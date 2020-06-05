// NEW CODE
if (typeof ChromeUtils.import == "undefined") {
	if (QuickFolders.Util.versionSmaller(util.ApplicationVersion, "67")) {
		// Task.jsm: function generators (function*)
		Components.utils.import("resource://gre/modules/Task.jsm"); // adds Deferred() function
	}
	
	// throws PromiseUtils not defined
	Components.utils.import("resource://gre/modules/PromiseUtils.jsm");
}
else {
	let util = QuickFolders.Util;
	if (util.versionSmaller(util.ApplicationVersion, "67")) {
		ChromeUtils.import("resource://gre/modules/Task.jsm");
	}
	ChromeUtils.import("resource://gre/modules/PromiseUtils.jsm");
}

// ChromeUtils.defineModuleGetter(this, "PromiseUtils", "resource://gre/modules/PromiseUtils.jsm");

// refactored from async Task with help of @freaktechnik
// asyunc function should be fine for Tb52.
QuickFolders.Util.getOrCreateFolder = async function (aUrl, aFlags) {
		const Ci = Components.interfaces,
		      Cc = Components.classes,
					Cr = Components.results,
          util = QuickFolders.Util,
	        prefs = QuickFolders.Preferences,
					isDebug = prefs.isDebugOption('getOrCreateFolder');
    let folder = null;
    function logDebug(text) {
      if (isDebug) 
        util.logDebugOptional('getOrCreateFolder', text);
    }			
		// Thunderbird 68
		var { XPCOMUtils } = ChromeUtils.import("resource://gre/modules/XPCOMUtils.jsm");
    
		logDebug('getOrCreateFolder (' + aUrl + ', ' + aFlags + ')');
    
    let fls = Cc["@mozilla.org/mail/folder-lookup;1"].getService(
      Ci.nsIFolderLookupService
    );
    if (fls)
      folder = fls.getOrCreateFolderForURL(aUrl); 
    else {
      // In theory, we should query our map first to see if we have the folder.
      // However, the way you create a new folder anyways presently requires
      // hitting up the RDF service in the first place, so there's no point trying
      // to force a double-query of the map in this error scenario.
      let rdf = Cc["@mozilla.org/rdf/rdf-service;1"].getService(Ci.nsIRDFService);
      // Unlike above, we don't want to catch the exception--it will propagate to
      // a promise rejection.
      folder = rdf.GetResource(aUrl).QueryInterface(Ci.nsIMsgFolder);
    }

		logDebug('folder = ' + folder);		
    // Now try to ask the server if it has the folder. This will force folder
    // discovery, so if the folder exists, its properties will be properly
    // fleshed out if it didn't exist. This also catches folders on servers
    // that don't exist.
    try {
      folder = folder.server.getMsgFolderFromURI(folder, aUrl);
    } catch (e) {
			util.logException('getMsgFolderFromURI ', ex);		
      throw Cr.NS_ERROR_INVALID_ARG;
    }

    // We explicitly do not want to permit root folders here. The purpose of
    // ensuring creation in this manner is to be able to query or manipulate
    // messages in the folder, and root folders don't have that property.
    if (folder.rootFolder == folder) {
			logDebug('root folder, not allowed');		
      throw Cr.NS_ERROR_INVALID_ARG;
		}

    // Now set the folder flags if we need to.
    if (aFlags)
      folder.setFlag(aFlags);

    // If we are not a valid folder, we need to create the storage to validate
    // the existence of the folder. Unfortunately, the creation code is
    // sometimes synchronous and sometimes asynchronous, so handle that.
    if (folder.parent == null) {
      // Async folder creation is assumed to always succeed even if it exists.
      // Presumably, the same could apply for local message folders.
      let isAsync = folder.server.protocolInfo.foldersCreatedAsync,
          needToCreate = isAsync || !folder.filePath.exists();
					
			logDebug('no folder parent. needToCreate = ' + needToCreate + ' async = ' + isAsync);		
			
			
      if (needToCreate) {
				const GP = 
				  ChromeUtils.generateQI ? ChromeUtils : XPCOMUtils;
        const deferred = new Promise((resolve, reject) => {
          const listener = {
            OnStartRunningUrl(url) {},
            OnStopRunningUrl(url, aExitCode) {
              if (aExitCode == Cr.NS_OK)
                resolve();
              else
                reject(aExitCode);
            },
            QueryInterface:  // Tb 68 XPCOMUtils.generateQI doesn't exist anymore
						  GP.generateQI([Ci.nsIUrlListener])
							
          };
   
          // If any error happens, it will throw--causing the outer promise to
          // reject.
          logDebug('folder.createStorageIfMissing()...'); 
          folder.createStorageIfMissing(isAsync ? listener : null);
          if (!isAsync || !needToCreate)
            resolve();
        });
        await deferred;
			
				
/*				
      if (needToCreate) {
        let deferred = PromiseUtils.defer();
        let listener = {
          OnStartRunningUrl(url) {},
          OnStopRunningUrl(url, aExitCode) {
            if (aExitCode == Cr.NS_OK)
              deferred.resolve();
            else
              deferred.reject(aExitCode);
          },
          QueryInterface: XPCOMUtils.generateQI([Ci.nsIUrlListener])
        };

        // If any error happens, it will throw--causing the outer promise to
        // reject.
				logDebug('folder.createStorageIfMissing()...');		
        folder.createStorageIfMissing(isAsync ? listener : null);
        if (!isAsync || !needToCreate)
          deferred.resolve();
        yield deferred.promise;
      }
*/
			
			
      }
/*
      if (needToCreate && (folder.parent == null || folder.rootFolder == folder)) {
        logDebug('unexpected: no folder.parent or folder is its own root');		
        throw Cr.NS_ERROR_UNEXPECTED;
      }
      */
    }

    // Finally, we have a valid folder. Return it.
    return folder;
  };
	
