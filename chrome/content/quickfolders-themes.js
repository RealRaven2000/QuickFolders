"use strict";
/* BEGIN LICENSE BLOCK

	QuickFolders is released under the Creative Commons (CC BY-ND 4.0)
	Attribution-NoDerivatives 4.0 International (CC BY-ND 4.0) 
	For details, please refer to license.txt in the root folder of this extension

  END LICENSE BLOCK */

QuickFolders.Themes = {
  // note: for localization, the theme descriptions reside in Babelzilla, naming convention:
  themes: {
    Flat: {
      name: "Flat Style",
      Id: "flatTabs",
      author: "Axel Grude",
      cssToolbarClassName: "quickfolders-flat",
      supportsFeatures: {
        stateColors: true,
        individualColors: true,
        standardTabColor: true,
        pastelColors: true,
        specialIcons: true,
        buttonShadows: true,
        buttonInnerShadows: false,
        supportsFontSelection: false,
        supportsFontSize: true,
        supportsHeightTweaks: true,
        toolbarBorder: true,
        cornerRadius: true,
        borderToggle: false,
        tabTransparency: true,
      },
    },

    ApplePills: {
      name: "Apple Pills",
      Id: "applePills",
      author: "Christopher White",
      cssToolbarClassName: "quickfolders-pills",
      supportsFeatures: {
        stateColors: false,
        individualColors: true,
        standardTabColor: false,
        pastelColors: true,
        specialIcons: true,
        buttonShadows: false,
        buttonInnerShadows: true,
        supportsFontSelection: false,
        supportsFontSize: true,
        supportsHeightTweaks: false,
        toolbarBorder: false,
        cornerRadius: false,
        borderToggle: false,
        tabTransparency: false,
      },
    },

    NativeTabs: {
      name: "Native Tabs",
      Id: "nativeTabs",
      author: "Your OS ;)",
      cssToolbarClassName: "quickfolders-realTabs",
      supportsFeatures: {
        stateColors: false,
        individualColors: false,
        standardTabColor: false,
        pastelColors: false,
        specialIcons: true,
        buttonShadows: false,
        buttonInnerShadows: false,
        supportsFontSelection: false,
        supportsFontSize: true,
        supportsHeightTweaks: false,
        toolbarBorder: false,
        cornerRadius: false,
        borderToggle: false,
        tabTransparency: false,
      },
    },

    Buttons: {
      name: "Toolbar Buttons",
      Id: "flatButtons",
      author: "Alexander Malfait",
      cssToolbarClassName: "quickfolders-toolbarbuttons",
      supportsFeatures: {
        stateColors: false,
        individualColors: false,
        standardTabColor: true,
        pastelColors: false,
        specialIcons: true,
        buttonShadows: true,
        buttonInnerShadows: false,
        supportsFontSelection: false,
        supportsFontSize: true,
        supportsHeightTweaks: false,
        toolbarBorder: false,
        cornerRadius: false,
        borderToggle: false,
        tabTransparency: true,
      },
    },

    RealButtons: {
      name: "Buttons",
      Id: "realButtons",
      author: "Axel Grude",
      cssToolbarClassName: "quickfolders-realbuttons",
      supportsFeatures: {
        stateColors: false,
        individualColors: false,
        standardTabColor: true,
        pastelColors: false,
        specialIcons: true,
        buttonShadows: true,
        buttonInnerShadows: false,
        supportsFontSelection: false,
        supportsFontSize: true,
        supportsHeightTweaks: false,
        toolbarBorder: false,
        cornerRadius: false,
        borderToggle: false,
        tabTransparency: true,
      },
    },

    /* Experimental, see [issue 643] */
    TB140: {
      name: "Thunderbird 140+ Tabs (Windows)",
      Id: "Tb140",
      author: "Axel Grude",
      cssToolbarClassName: "quickfolders-tb140",
      supportsFeatures: {
        stateColors: true,
        individualColors: true,
        standardTabColor: false,
        pastelColors: false,
        specialIcons: true,
        buttonShadows: false,
        buttonInnerShadows: false,
        supportsFontSelection: false,
        supportsFontSize: true,
        supportsHeightTweaks: true,
        toolbarBorder: false,
        cornerRadius: true,
        borderToggle: false,
        tabTransparency: true,
      },
    },

    /* end of themes list */
  },

  Theme: function (id) {
    return Object.values(this.themes).find((obj) => obj.Id === id) || this.themes["Flat"];
  },
};