/* 
  BEGIN LICENSE BLOCK

	QuickFolders is released under the Creative Commons (CC BY-ND 4.0)
	Attribution-NoDerivatives 4.0 International (CC BY-ND 4.0) 
	For details, please refer to license.txt in the root folder of this extension

  END LICENSE BLOCK 
*/

/*
 globals
   insertLocalizedMessage
  */

function showButtons(buttonList) {
  const buttons = buttonList.map((s) => s.trim());
  ["ok", "yes", "no", "cancel"].forEach((id) => {
    const el = document.getElementById(id);
    if (!el) {
      return;
    }
    el.hidden = !buttons.includes(id);
  });
  if (buttons.includes("licensing")) {
    document.getElementById("btnShowLicenser").hidden = false;
  }
  if (buttons.includes("featurecomp")) {
    document.getElementById("btnFeatureCompare").hidden = false;
  }
}

// Helper to get query parameters
function getQueryParams() {
  return Object.fromEntries(new URLSearchParams(window.location.search));
}

// helper to marshall a formatted message without using
// queryParameter directly!
async function getStoredMessage(key, hasMessage) {
  if (!hasMessage) {
    return "";
  }
  try {
    const result = await browser.storage.local.get(key);
    await browser.storage.local.remove(key);
    if (result && typeof result === "object" && key in result) {
      return result[key] || "";
    }
    return `We seem to be missing a stored message in ${key}`;
  } catch (e) {
    console.error("Failed to get or remove message from storage", e);
    return "getStoredMessage failed!";
  }
}

window.addEventListener("load", async () => {
  const MESSAGE_STORAGE_KEY = "QuickFolders_Message_Key";
  const params = getQueryParams();
  const features = (params.features || "ok").split(","); // fallback to "ok"

  /**** Passed Message or message id(s) to retrieve from l10n ****/
  // retrieve an arbitrary message text from storagem
  // but only if the queryparameter msg_storage was set!
  let message = await getStoredMessage(MESSAGE_STORAGE_KEY, !!params.msg_storage);
  if (params.msgId) {
    // allow multiple ids as a comma separated string of localized message ids
    const ids =
      typeof params.msgId === "string" && params.msgId.includes(",")
        ? params.msgId.split(",").map((s) => s.trim())
        : [params.msgId];

    for (const id of ids) {
      message += messenger.i18n.getMessage(id); // Each returns HTML with <p> or {P1}{P2} as needed
    }
  }
  // we need to display _something_
  if (!message) {
    message = messenger.i18n.getMessage("message.placeholder");
  }

  // find all features relating to buttons:
  const buttonsList = features.filter((b) =>
    ["ok", "cancel", "yes", "no", "licensing", "featurecomp"].includes(b)
  );

  // Set message text
  const messageContainer = document.getElementById("innerMessage");
  // generate HTML markup
  await insertLocalizedMessage(messageContainer, message);

  i18n.updateDocument();
  showButtons(buttonsList);

  // Show buttons according to features
  const buttons = {
    ok: document.getElementById("ok"),
    yes: document.getElementById("yes"),
    no: document.getElementById("no"),
    cancel: document.getElementById("cancel"),
    features: document.getElementById("btnFeatureCompare"),
    showLicense: document.getElementById("btnShowLicenser"),
  };

  // Setup button handlers:
  buttons.ok?.addEventListener("click", () => {
    messenger.runtime.sendMessage({ command: "quickfolders-message", result: "ok" });
  });
  buttons.cancel?.addEventListener("click", () => {
    messenger.runtime.sendMessage({ command: "quickfolders-message", result: "cancel" });
  });
  buttons.yes?.addEventListener("click", () => {
    messenger.runtime.sendMessage({ command: "quickfolders-message", result: "yes" });
  });
  buttons.no?.addEventListener("click", () => {
    messenger.runtime.sendMessage({ command: "quickfolders-message", result: "no" });
  });
  buttons.features?.addEventListener("click", async () => {
    // open url
    const dataUrl = "https://quickfolders.org/premium.html#featureComparison";
    let found = await messenger.tabs.query({ url: dataUrl });
    if (found.length) {
      let tab = found[0]; // first result
      await messenger.tabs.update(tab.id, { active: true, url: dataUrl });
      return;
    }
    messenger.tabs.create({ active: true, url: dataUrl });
  });
  buttons.showLicense?.addEventListener("click", async () => {
    const params = new URLSearchParams(window.location.search);
    const features = params.get("addonfeatures");

    await browser.runtime.sendMessage({
      command: "showLicenseDialog",
      referrer: "quickfolders-message",
      addonfeatures: features || "", // future use
    });
  });

  // always allow hitting ESC to cancel
  window.addEventListener("keydown", function (event) {
    if (event.key === "Escape") {
      event.preventDefault();
      event.stopPropagation();
      messenger.runtime
        .sendMessage({ command: "quickfolders-message", result: "cancel" })
        .finally(() => {
          // Delay close slightly to let browser finalize message
          setTimeout(() => window.close(), 150);
        });
    }
  });

  // make sure add-on links stay in Thunderbird!
  document.addEventListener("click", (event) => {
    const link = event.target.closest("a.native");
    if (link) {
      event.preventDefault();
      browser.tabs.create({ url: link.href });
    }
  });
});
