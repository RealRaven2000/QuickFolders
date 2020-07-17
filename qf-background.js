/* qf-background.js 
   background scripts
*/
console.log("backgr");

async function main() {
  /* 
  * The registerWindow() and registerShutdownScript() functions used below can use
  * relative URLs from the root of the extensions folder structure to specify the
  * location of the JavaScript files. Internally these URLs will be automatically
  * converted to file://* URLs.
  *
  * If you need to specify additional paths inside the registered scripts below,
  * you can generate the file://* URL via the extensions object available to your
  * scripts
  *
  *	  this.extension.rootURI.resolve(relativePath)
  *
  * If these file://* URLs do not work (e.g. with new ChromeWorker()), register a 
  * chrome://* URL and use that. The registerWindow() and registerShutdownScript()
  * functions used below can also be used with chrome://* URLs.
  */
 messenger.WindowListener.registerChromeUrl([ 
  ["content", "quickfolders", "chrome/content/"],
  ["locale", "quickfolders", "en-US", "chrome/locale/en-US/"],
  ["locale", "quickfolders", "ca", "chrome/locale/ca/"],
  ["locale", "quickfolders", "de", "chrome/locale/de/"],
  ["locale", "quickfolders", "es-MX", "chrome/locale/es-MX/"],
  ["locale", "quickfolders", "es", "chrome/locale/es/"],
  ["locale", "quickfolders", "fr", "chrome/locale/fr/"],
  ["locale", "quickfolders", "hu-HU", "chrome/locale/hu-HU/"],
  ["locale", "quickfolders", "it", "chrome/locale/it/"],
  ["locale", "quickfolders", "ja-JP", "chrome/locale/ja-JP/"],
  ["locale", "quickfolders", "nl", "chrome/locale/nl/"],
  ["locale", "quickfolders", "pl", "chrome/locale/pl/"],
  ["locale", "quickfolders", "pt-BR", "chrome/locale/pt-BR/"],
  ["locale", "quickfolders", "ru", "chrome/locale/ru/"],
  ["locale", "quickfolders", "sl-SI", "chrome/locale/sl-SI/"],
  ["locale", "quickfolders", "sr", "chrome/locale/sr/"],
  ["locale", "quickfolders", "sv-SE", "chrome/locale/sv-SE/"],
  ["locale", "quickfolders", "vi", "chrome/locale/vi/"],
  ["locale", "quickfolders", "zh-CN", "chrome/locale/zh-CN/"],
  ["locale", "quickfolders", "zh-CHS chrome/locale/zh-CN/"],
  ["locale", "quickfolders", "zh", "chrome/locale/zh/"],
  ["locale", "quickfolders", "zh-CHT chrome/locale/zh/"],
  ["locale", "quickfolders", "zh-TW", "chrome/locale/zh/"],
]);

 /* 
  * Register JavaScript files, which should be loaded into opened windows. The API
  * expects two functions to exist and will call
  * - onLoad(window, wasAlreadyOpen) during window load and during add-on start
  *   (if window is already open)
  * - onUnload(window, isAddOnShutDown) during window unload and during add-on
  *   shutdown (if window is still open)
  *
  * The additional parameters are:
  * - wasAlreadyOpen : indicates, if onLoad() has been called during add-on start
  *   while the window was already open
  * - isAddOnShutDown : indicates, if onUnload() has been called due to manual 
  *   window closing or add-on shutdown
  */
 messenger.WindowListener.registerWindow("chrome://messenger/content/messenger.xhtml", "content/scripts/qf-messenger.js");

 /* 
  * Any JSM which has been loaded by any of the registered JavaScript file, needs
  * to be unloaded upon shutdown. Register a script, where this and other cleanup 
  * actions can be performed on add-on shutdown. The script will be loaded into an
  * object, which also contains an extension member.
  */
 //messenger.WindowListener.registerShutdownScript("content/shutdown.js");

 /*
  * Start listening for opened windows. Whenever a window is opened, the registered
  * JS file is loaded. To prevent namespace collisions, the files are loaded into
  * an object inside the global window. The name of that object can be specified via
  * the parameter of startListening(). This object also contains an extension member.
  */
 messenger.WindowListener.startListening("QuickFolders");
}

main();
