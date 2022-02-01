
/* function originally contained in scrollMenus.xul */
(function(){
  function repeatOnDragover (evt) {
    var now = evt.timeStamp || (new Date()).getTime(), timeWarp = (now < tsLastRepeat);
    if (timeWarp || now >= (tsLastRepeat + REPEAT_DELAY_MS)) {
      tsLastRepeat = now;
      if (!timeWarp) { fnRepeat(); }
    }
  };
  
  var	REPEAT_DELAY_MS = 50,
      REPEAT_RE = /arrowscrollbox$/i,
      tsLastRepeat,
      fnRepeat;
  var BookmarksMenuDNDObserver = QuickFolders.popupDragObserver;
  // prevent the bookmarks menu from closing when a drag is held over the autorepeatbuttons
  // 	and menuseparators (bug 349932 and maybe bug 194319/bug 240709)
  if (BookmarksMenuDNDObserver) {
    BookmarksMenuDNDObserver.getObserverForNode_SMOD = BookmarksMenuDNDObserver.getObserverForNode;
    BookmarksMenuDNDObserver.onDragCloseTarget_SMOD = BookmarksMenuDNDObserver.onDragCloseTarget;

    BookmarksMenuDNDObserver.getObserverForNode = function (aNode) {
      var observer;
      try {
        observer = BookmarksMenuDNDObserver.getObserverForNode_SMOD(aNode);
      } catch (ex) {}
      if (!observer && aNode && aNode.id == "bookmarks-menu") {
        observer = this.getObserverForNode(aNode.getElementsByTagName("menupopup")[0]);
      }
      return observer;
    };
    BookmarksMenuDNDObserver.onDragCloseTarget = function () {
      var currentObserver = this.getObserverForNode(this.mCurrentDragOverTarget);
      // close all the menus not hovered by the mouse
      for (var i=0; i < this.mObservers.length; i++) {
        if (currentObserver != this.mObservers[i]) {
          this.onDragCloseMenu(this.mObservers[i]);
          if (this.mObservers[i].parentNode.id == "bookmarks-menu")
            this.mObservers[i].hidePopup();
        }
        else {
          this.onDragCloseMenu(this.mCurrentDragOverTarget.id == "bookmarks-menu"
            ? this.mCurrentDragOverTarget.getElementsByTagName("menupopup")[0]
            : this.mCurrentDragOverTarget.parentNode
          );
        }
      }
    };
  }

  // activate autorepeatbuttons on dragover (bug 194319)
  document.addEventListener("dragenter", function (evt) {
    function removeRepeat (evt) {
      el.removeEventListener("dragover", repeatOnDragover, true);
      el.removeEventListener("dragend", removeRepeat, false);
    }
    var el = evt.originalTarget, hierarchyLimit = 3;
    while (el &&
       (el.nodeName!="toolbarbutton" ||
       el.id!="scrollbutton-down" && el.id!="scrollbutton-up")) {  // scrollbutton-down // !REPEAT_RE.test(el.nodeName)
      el = (--hierarchyLimit && el.parentNode);
    }
    if (el) {
      tsLastRepeat = (evt.timeStamp || (new Date()).getTime()) - REPEAT_DELAY_MS;
      fnRepeat = function(){ 
        switch(el.id) {
          case "scrollbutton-down":
            el.parentNode.host.scrollByIndex(1,true);
            break;
          case "scrollbutton-up":
            el.parentNode.host.scrollByIndex(-1,true);
            break;
        }
      };

      el.addEventListener("dragover", repeatOnDragover, true);
      el.addEventListener("dragend", removeRepeat, false);
      repeatOnDragover({timeStamp: evt.timeStamp});

    }
  }, true);

})();