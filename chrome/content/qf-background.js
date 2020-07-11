/* qf-background.js 
   background scripts
*/
console.log("backgr");


async function main() {

   // setup ConversionHelper
   await browser.ConversionHelper.registerChromeUrl([ ["content", "quickfolders", "chrome/content/"] ]);
   await browser.ConversionHelper.registerApiFolder("chrome://quickfolders/content/api/ConversionHelper/");
   
   // define default prefs and migrate legacy settings
   let defaultPrefs = {
     "counter": 0,
     "settingsFolder": "",
     "defaultImport": "",
     "menuCollapse": true,
     "toolbar": true,
     "popup": false,
     "keywordKey": "Tab",
     "shortcutModifier": "alt",
     "shortcutTypeAdv": false,
     "collapseState": ""
   };
 
  // await quicktextPreferences.setDefaults(defaultPrefs);
  // await quicktextPreferences.migrateFromLegacy(defaultPrefs, "extensions.quicktext.");
 
   await browser.ConversionHelper.setOverlayVerbosity(9);
 
   // register and activate overlays
   //await browser.ConversionHelper.registerOverlay("chrome://messenger/content/messengercompose/messengercompose.xul", "chrome://quicktext/content/quicktext.xul");        
   await browser.ConversionHelper.registerOverlay("chrome://messenger/content/messenger.xul", "chrome://quickfolders/content/main.xul");        
   //await browser.ConversionHelper.registerOverlay("chrome://messenger/content/messengercompose/messengercompose.xhtml", "chrome://quicktext/content/quicktext.xul");        
   await browser.ConversionHelper.registerOverlay("chrome://messenger/content/messenger.xhtml", "chrome://quickfolders/content/main.xul");        
   await browser.ConversionHelper.registerOverlay("chrome://messenger/content/messenger.xhtml", "chrome://quickfolders/content/overlay.xhtml");        
      
   // register a script which is called upon add-on unload (to unload any JSM loaded via overlays)
  //!! await browser.ConversionHelper.registerUnloadScript("chrome://quickfolders/content/scripts/unload.js");
   
   // activate all registered overlays
   await browser.ConversionHelper.activateOverlays();
   
   await browser.ConversionHelper.notifyStartupCompleted();
 }
 
 main();
 