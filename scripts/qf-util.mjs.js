
export async function waitForSessionReady() {
  const task = Promise.withResolvers();
  const readyListener = (changes, area) => {
    if (area !== "session") {
      return;
    }
    if (typeof changes["quickfolders.sessionReady"] !== "undefined") {
      task.resolve();
      browser.storage.onChanged.removeListener(readyListener);
    }
  };
  browser.storage.onChanged.addListener(readyListener);
  const readyStatus = await browser.storage.session
    .get("quickfolders.sessionReady")
    .then((result) => result["quickfolders.sessionReady"] || false);
  console.log("readyStatus", readyStatus);
  if (!readyStatus) {
    await task.promise;
  } else {
    browser.storage.onChanged.removeListener(readyListener);
  }
}

export function slideAlert(title, text, icon) {
  try {
    // we need permissions to use messenger.notifications
    // ex_notifications doesn't quite work (code from c-c) 
    messenger.notifications.create({
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