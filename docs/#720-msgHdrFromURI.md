# Replace deprecated messenger.msgHdrFromURI

QuickFolders still uses the deprecated `messenger.msgHdrFromURI()` in two message drag-and-drop paths. Replace both calls with `MailServices.messageServiceFromURI(messageUri).messageURIToMsgHdr(messageUri)` to retain compatibility with Thunderbird.

Check dragging messages to a new folder with the quickFilters Assistant active, including from a virtual folder, and dropping messages onto QuickFolders targets, including from search results.

Reference: [FiltaQuilla #421](https://github.com/RealRaven2000/FiltaQuilla/issues/421).
