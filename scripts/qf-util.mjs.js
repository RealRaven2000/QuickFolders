export function slideAlert(title, text, icon) {
  try {
    // we need permissions to use messenger.notifications
    // ex_notifications doesn't quite work (code from c-c) 
    messenger.ex_notifications.create({
      type: "basic",
      title,
      message: text,
      iconUrl: icon || "/chrome/content/skin/ico/QuickFolders_32.svg"
    });
  }
  catch(ex) {
    console.log(ex);
  }
}

export function log(msg, data, mode = "log") { // log, info, warn, error
	console[mode](msg, data);
}