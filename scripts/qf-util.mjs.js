export function slideAlert(title, text, icon) {
	messenger.notifications.create({
		type: "basic",
		title,
		message: text,
		iconUrl: icon || "/chrome/content/skin/ico/quickfolders-Icon.png"
	});
}

export function log(origin, data, mode = "log") { // log, info, warn, error
	console[mode](origin, data);
}