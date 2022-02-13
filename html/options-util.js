// Functions from quickfolders-util - specific to options.js
QuickFolders.Util = {
  getSystemColor : function (sColorString) {
    function hex(x) { return ("0" + parseInt(x).toString(16)).slice(-2); }

    try {
      let container = document.getElementById("qf-options-prefpane");
      if (!container) return sColorString;
      
      if (sColorString.startsWith('rgb')) {
        // rgb colors.
        let components = sColorString.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*(\d+(?:\.\d+)?))?\)$/),
            hexColor = "#" + hex(components[1]) + hex(components[2]) + hex(components[3]); // ignore transparency
        return hexColor;
      }
      let theColor, // convert system colors such as menubackground etc. to hex
          d = document.createElement("div");
      d.style.color = sColorString;
      container.appendChild(d)
      theColor = window.getComputedStyle(d,null).color;
      container.removeChild(d);

      if (theColor.search("rgb") == -1)
        return theColor; // unchanged
      else {
        // rgb colors.
        theColor = theColor.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*(\d+(?:\.\d+)?))?\)$/);
        let hexColor = "#" + hex(theColor[1]) + hex(theColor[2]) + hex(theColor[3]);
        return hexColor;
      }
    }
    catch(ex) { // Bug 26387
      debugger;
      console.error("getSystemColor(" + sColorString + ") failed", ex);
      return "#000000";
    }

  }

  
}