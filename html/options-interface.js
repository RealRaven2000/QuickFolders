"use strict";
/* BEGIN LICENSE BLOCK

QuickFolders is released under the Creative Commons (CC BY-ND 4.0)
Attribution-NoDerivatives 4.0 International (CC BY-ND 4.0) 
For details, please refer to license.txt in the root folder of this extension

END LICENSE BLOCK */

// interface functions specific top options.html
// keeping the old namespace so I know which funcitons I can retire when we convert to HTML

QuickFolders.Interface = {  
  getPreviewButtonId: function getPreviewButtonId(previewId) {
		switch(previewId) {
			case "standard":
        return "inactivetabs-label";
			case "active":
        return "activetabs-label";
			case "hovered":
        return "hoveredtabs-label";
			case "dragOver":
        return "dragovertabs-label";
			default:
				QuickFolders.Util.logDebug("QuickFolders.Interface.getPreviewButtonId - Invalid previewId: " + previewId);
        return null;
		}
  } ,  

	setTabColorFromMenu: async function setTabColorFromMenu(menuitem, col) {
		// get parent button of color sub(sub)(sub)menu
		let parent = menuitem,
        prefs = QuickFolders.Preferences,
				QI = QuickFolders.Interface,
				util = QuickFolders.Util,
		    ssPalettes;
		while (!parent.folder && parent.parentNode) {
			parent=parent.parentNode;
			switch(parent.id) {
				case "QuickFolders-Options-PalettePopup":
          var options = QuickFolders.Options; // should only work when called from the options menu!
					// options dialog case: parent is menupopup
					//   showPopup should have set this as "targetNode"
					let targetNode = parent,
              targetId = targetNode.getAttribute("targetId");
          
					// now paint the button
				  options.preparePreviewTab(null, null, targetId, col); // [Bug 25589]
				  //options.preparePreviewPastel(prefs.getBoolPref('pastelColors'));
					//   retrieve about config key to persist setting;
					let styleKey =  targetNode.getAttribute("stylePrefKey"),
				      stylePref = "style." + styleKey + ".",
              userStyleKey = (styleKey == "DragOver") ? "DragTab" : styleKey; // fix naming inconsistency
				  if (stylePref)
					  prefs.setIntPref(stylePref + "paletteEntry", col);

					// special rule: if this is the Active Tab Color, let's also determine the active BG (bottom pixel of gradient!)
					let paletteClass = await this.getPaletteClassCss(styleKey),
					    ruleName = ".quickfolders-flat " + paletteClass + ".col" + col,
					    disableColorChangeStriped = (styleKey=="InactiveTab" && prefs.ColoredTabStyle==prefs.TABS_STRIPED);
          
					ssPalettes = this.getStyleSheet("QuickFolderPalettes");
          
					let colPickId = "",
					    selectedFontColor = QuickFolders.Styles.getElementStyle(ssPalettes, ruleName, "color"),
					    previewTab;
					if (selectedFontColor !== null) {
						switch(styleKey) {
							case "DragOver":
							  previewTab = "dragovertabs-label";
								colPickId = "dragover-fontcolorpicker";
								break;
							case "InactiveTab":
							  previewTab = "inactivetabs-label";
								colPickId = "inactive-fontcolorpicker";
								break;
							case "ActiveTab":
							  previewTab = "activetabs-label";
								colPickId = "activetab-fontcolorpicker";
								break;
							case "HoveredTab":
							  previewTab = "hoveredtabs-label";
								colPickId = "hover-fontcolorpicker";
								break;
						}
						// transfer color to font color picker for non-palette mode.
						let cp = document.getElementById(colPickId);
						if (cp && !disableColorChangeStriped) {
							// cp.color = selectedFontColor;
							cp.value = util.getSystemColor(selectedFontColor); // convert to hex value
							prefs.setUserStyle(userStyleKey, "color", selectedFontColor);
							options.styleUpdate(userStyleKey, "color", selectedFontColor, previewTab);
						}
					}

					// find out the last (=main) gradient color and set as background color!
					let selectedGradient = QuickFolders.Styles.getElementStyle(ssPalettes, ruleName, "background-image"),
              resultBackgroundColor = "";
					if (selectedGradient !== null) {
						// get last gradient point (bottom) to determine background color
						// all gradients should be defined top down
						util.logDebugOptional("css.palette", "selectedGradient = " + selectedGradient);
						let f = selectedGradient.lastIndexOf("rgb");
						if (f>=0) {
							let rgb = selectedGradient.substr(f);
							f = rgb.indexOf(")");
							rgb = rgb.substr(0, f + 1); // this is our rule
							if (rgb) {
								switch(styleKey) {
									case "DragOver":
										colPickId = "dragover-colorpicker";
										break;
									case "InactiveTab":
										colPickId = "inactive-colorpicker";
										break;
									case "ActiveTab":
										colPickId = "activetab-colorpicker";
										break;
									case "HoveredTab":
										colPickId = "hover-colorpicker";
										break;
								}
								// transfer color to background color picker for non-palette mode.
								let cp = document.getElementById(colPickId);
								if (cp && !disableColorChangeStriped) {
                  // don't do it with inactive tab in striped mode!!
                  // cp.color = rgb;
									cp.value = util.getSystemColor(rgb);
                  prefs.setUserStyle(userStyleKey, "background-color", rgb);
								}
                resultBackgroundColor = rgb;
							}
						}
					}

					// if no color is selected in inactive tab, switch on transparent:
					if (styleKey == "InactiveTab" && col == 0) {
						let chkTransparent = window.document.getElementById("buttonTransparency");
						if (chkTransparent && !chkTransparent.checked) {
							chkTransparent.checked = true;
							options.toggleColorTranslucent(chkTransparent, "inactive-colorpicker", "inactivetabs-label", styleKey);
						}
						let cp = document.getElementById("inactive-colorpicker");
						if (cp) {
						  // cp.color = "rgb(255,255,255)";
							cp.value = "#FFFFFF";
						}
						prefs.setUserStyle(styleKey, "background-color", "rgb(255,255,255)");
            QuickFolders.Util.notifyTools.notifyBackground({ func: "updateMainWindow", minimal: false });
					}
          if (styleKey == "InactiveTab")
            this.applyTabStyle(document.getElementById("inactivetabs-label"), prefs.ColoredTabStyle);
          // immediate update of background color for bottom border
          if (styleKey == "ActiveTab" && resultBackgroundColor) {
            options.styleUpdate("ActiveTab","background-color", resultBackgroundColor, "activetabs-label");
          }
          if (disableColorChangeStriped) {
            // force update as it might have been missed!
            QuickFolders.Util.notifyTools.notifyBackground({ func: "updateMainWindow", minimal: true });
          }
					return; // early exit
			} // end switch
		}
	} ,
  
  
  applyTabStyle: function applyTabStyle(el, styleId) {
		if (!el) return;
    let prefs = QuickFolders.Preferences;
    if ((styleId != prefs.TABS_STRIPED))
      el.className = el.className.replace(/\s*striped/,"");
    if ((styleId == prefs.TABS_STRIPED) && (el.className.indexOf("striped")<0))
      el.className = el.className.replace(/(col[0-9]+)/,"$1striped");
  },
  
  // remove animated icons for pro version
  // at the moment this directly manipulates the style sheet, so we are going to do this via notification
  removeAnimations: async function(styleSheetName) {
   // needs to be done from the back end!!
  } ,  
  
  showPalette: function(parentNode) {
    // shows "QuickFolders-Options-PalettePopup"
    // container for palette entries
    // This was built originally in initBling during 
    // QI.buildPaletteMenu(0, menupopup, true, true); // added parameter to force oncommand attributes back
    let menupopup = document.getElementById("QuickFolders-Options-PalettePopup");
    menupopup.style.display = "block";
    // attach to top of parentNode:
    let parentRect = parentNode.getBoundingClientRect(),
        menuRect = menupopup.getBoundingClientRect(),
        labelTop = parseInt(parentRect.top),
        height = parseInt(menuRect.height),
        newTop = labelTop - height,
        viewPort = document.getElementsByTagName("body")[0].getBoundingClientRect();
    menupopup.style.top = (labelTop - height).toString()+"px"        
    if (parentRect.left + menuRect.width > viewPort.width) { // right-align menu
      menupopup.style.left = "";
      menupopup.style.right = "30px"
    }
    else {
      menupopup.style.left = parseInt(parentRect.left).toString() + "px";
      menupopup.style.right = ""
    }
  },
  
  hidePalette: function() {
    let menupopup = document.getElementById("QuickFolders-Options-PalettePopup");
    menupopup.style.display = "none";
  },
  
	// forceOnCommand use the "old" way of oncommand attribute for QF options dialog
	buildPaletteMenu: async function(currentColor, existingPopupMenu) {
		const Themes = QuickFolders.Themes.themes,
		      util = QuickFolders.Util,
					prefs = QuickFolders.Preferences,
					QI = QuickFolders.Interface;
    
    // each menuitem used a single click event to set the color from the menu item
    // QuickFolders.Interface.setTabColorFromMenu(this, '" + jCol + "')"    
          
		let logLevel = "interface",
        popupTitle = existingPopupMenu.id,
        gridContainer = existingPopupMenu.querySelector("#paletteGrid");
		util.logDebugOptional(logLevel, "buildPaletteMenu(" + currentColor + ", existingPopupMenu=" + popupTitle + ")");
    
		try {
			const colorText =  util.getBundleString("qfMenuColor");
			// only flat style + apple pills support palette color
      for (let jCol=0; jCol<=20;jCol++) {
        let menuitem = document.createElement("div"),
            id = "qfColor"+jCol,
            label;
        menuitem.setAttribute("tag", id);
        menuitem.setAttribute("selectedColor", jCol)
        gridContainer.appendChild(menuitem);
        
        if (jCol) {
          label = colorText + " "+ jCol;
          // if (currentColor == jCol)  menuitem.setAttribute("checked", true);
        }
        else {
          label = util.getBundleString("qfMenuTabColorNone");
        }
        menuitem.textContent = label;
        
        // this.setEventAttribute(menuitem, "oncommand","QuickFolders.Interface.setTabColorFromMenu(this, '" + jCol + "')");
        gridContainer.appendChild(menuitem);
      }

			// create color pick items
			util.logDebugOptional("popupmenus","Colors Menu created.\n-------------------------");
		}
		catch(ex) {
			util.logException("Exception in buildPaletteMenu ", ex);
		}

		return existingPopupMenu;
	},  
  
	getStyleSheet: function getStyleSheet(Title) {
    for (let sheet of document.styleSheets) {
      if (sheet.title && sheet.title === Title) {
        return sheet;
      }
    }    
    return null;
	} ,
  
	getPaletteClassCss: async function getPaletteClassCss(tabStateId) {
		let cl = await this.getPaletteClass(tabStateId);
		return cl.replace(" ", ".");
	} ,
  
	getPaletteClass: async function(tabStateId) {
	  let paletteType = await QuickFolders.Preferences.getIntPref("style." + tabStateId + ".paletteType");
		switch (paletteType) {
		  case -1:
			  if (tabStateId == "InactiveTab") {
					return "";  // error
				}
				else { // get from global tab style!
					return await this.getPaletteClass("InactiveTab");
				}
				break;
			default:
				return await this.getPaletteClassToken(paletteType);
		}
		return "";
	} ,

	getPaletteClassToken: async function(paletteType) {
		switch (parseInt(paletteType, 10)) {
		  case -1:
			  return await this.getPaletteClassToken(this.getPaletteClass("InactiveTab")); // default
			case 0:
			  return "";  // none
			case 1:
			  return " plastic";  // default
			case 2:
			  return " pastel";
      case 3:
        return " night";
		}
		return "";
	} ,
  
  
  // show License dialog from Options dialog:
  showLicenseDialog: function() {
    let optionSelected = "options_" + QuickFolders.Options.currentOptionsTab;
    messenger.runtime.sendMessage({ 
      command: "showLicenseDialog", 
      referrer: optionSelected
    });
    window.close();
  },
  
  
  
}