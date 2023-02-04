"use strict";
// this will be initialized in qf-messenger.js
// now register myself as a listener on every mail folder
var { MailServices } = ChromeUtils.import("resource:///modules/MailServices.jsm");
var QuickFolders_mailSession = MailServices.mailSession; // nsIMsgMailSession


