// Function to open a popup and await user feedback
async function newFolderDialog() {
	async function popupClosePromise(popupId, defaultRetval) {
		try {
      // make sure window it loaded?
			await messenger.windows.get(popupId);
		} catch (e) {
			//window does not exist, assume closed
			return defaultRetval;
		}
		return new Promise(resolve => {
			let rv = defaultRetval;
			function windowCloseListener(closedId) {
				if (popupId == closedId) {
					messenger.windows.onRemoved.removeListener(windowCloseListener);
					messenger.runtime.onMessage.removeListener(messageListener);
					resolve(rv);
				}
			}
			function messageListener(request, sender, sendResponse) {
				if (sender.tab.windowId == popupId && request && request.result) {
					rv = request;
				}
			}
			messenger.runtime.onMessage.addListener(messageListener);
			messenger.windows.onRemoved.addListener(windowCloseListener);
		});
	}

	let window = await messenger.windows.create({
      url: "./newfolderdialog/newFolderDialog.html",
      type: "popup",
      height: 280,
      width: 390 });
  // await the created popup to be closed and define a default
  // return value if the window is closed without clicking a button
  let rv = await popupClosePromise(window.id, { result:"cancel", folderName: "" }); // default cancelt values
  console.log(rv);
  return rv;
}


