// parts from the old options interface that are specific for the options dialog UI
// keeping the old namespace so I know which funcitons I can retire when we convert to HTML

QuickFolders.Options = {

 /*********************
   * preparePreviewTab() 
   * paints a preview tab on the options window
   * collapses or shows the background color picker accordingly
   * @colorPickerId: [optional] color picker for plain coloring - this is hidden when palette is used
   * @preference: [optional] pull palette entry from this preference, ignored when paletteColor is passed
   * @previewId: id of target element (preview tab)
   * @paletteType: -1 {as standard tab} 0 none 1 plastic 2 pastel ...
   * @paletteColor: [optional] palette index; 0=no styling
   */
  preparePreviewTab: async function preparePreviewTab(colorPickerId, preference, previewId, paletteColor, paletteType) {
    const prefs = QuickFolders.Preferences;
    let wd = window.document,
        previewTab = wd.getElementById(previewId),
        colorPicker = colorPickerId ? wd.getElementById(colorPickerId) : null;
    
    // Address [Bug 25589] - when color is set from a drop down, the preference wasn't transmitted leading to wrong palette (always 1)
    if (!preference) {  
      switch(previewId) {
        case 'inactivetabs-label':
          preference = 'style.InactiveTab.';
          break;
        case 'activetabs-label':
          preference = 'style.ActiveTab.';
          break;
        case 'hoveredtabs-label':
          preference = 'style.HoveredTab.';
          break;
        case 'dragovertabs-label':
          preference = 'style.DragOver.';
          break;
      }
    }
    let paletteKey = (typeof paletteType === 'undefined') ? prefs.getIntPref(preference + 'paletteType') : paletteType,
        paletteClass = await QuickFolders.Interface.getPaletteClassToken(paletteKey);
    
    
    if (paletteKey) { // use a palette
      let paletteIndex = (typeof paletteColor === 'undefined' || paletteColor === null) 
                         ? prefs.getIntPref(preference + 'paletteEntry') :
                         paletteColor;
                         
      // hide the color picker when not striped
      if (colorPicker) {
        if (colorPickerId=='inactive-colorpicker') {
          if (prefs.ColoredTabStyle==prefs.TABS_STRIPED)
            paletteIndex = '' + paletteIndex + 'striped';
        }
        else {
          // do not hide background color for active tab so we can adjust  
          // the bottom border color of the toolbar
          if (colorPickerId!='activetab-colorpicker')
            colorPicker.collapsed = true;
        }
      }
      
      previewTab.className = 'qfTabPreview col' + paletteIndex + paletteClass;
    }
    else {
      previewTab.className = 'qfTabPreview';
      if (colorPicker) {
        colorPicker.collapsed = false; // paletteKey = 0  ->  no palette
        let transcol =
          (previewId=='inactivetabs-label') 
            ? this.getTransparent(colorPicker.value, prefs.getBoolPref("transparentButtons"))
            : colorPicker.value;
        previewTab.style.backgroundColor = transcol;
      }
      
    }
  } ,

  initPreviewTabStyles: function initPreviewTabStyles() {
    let getElement = document.getElementById.bind(document),
        inactiveTab = getElement('inactivetabs-label'),
        activeTab = getElement('activetabs-label'),
        hoverTab = getElement('hoveredtabs-label'),
        dragTab = getElement('dragovertabs-label'),
        menupopup = getElement("QuickFolders-Options-PalettePopup");
    
    this.preparePreviewTab('inactive-colorpicker', 'style.InactiveTab.', 'inactivetabs-label');
    this.preparePreviewTab('activetab-colorpicker', 'style.ActiveTab.', 'activetabs-label');
    this.preparePreviewTab('hover-colorpicker', 'style.HoveredTab.', 'hoveredtabs-label');
    this.preparePreviewTab('dragover-colorpicker', 'style.DragOver.', 'dragovertabs-label');
  } ,
  
  stripedSupport : function(paletteType) {
    switch(parseInt(paletteType)) {
      case 1: // Standard Palette
        return true;
      case 2: // Pastel Palette
        return true;
      default: // 2 colors or  night vision do not support "striped" style
        return false;
    }
  }
  
  
}

