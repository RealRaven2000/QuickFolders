  window.addEventListener("load", onLoad);

  async function notifyMode(event) {
    // send message back to background script
    await messenger.runtime.sendMessage({
      result: event.target.dataset.formResult,           // from data-form-result
      folderName: document.getElementById("folderName").value 
    });
    // window.close();
    //does not work until bug 1675940 has landed on ESR
    let win = await messenger.windows.getCurrent();
    messenger.windows.remove(win.id);
  }

  async function onLoad() {
	document.getElementById("button_ok").addEventListener("click", notifyMode);
	document.getElementById("button_cancel").addEventListener("click", notifyMode);
}