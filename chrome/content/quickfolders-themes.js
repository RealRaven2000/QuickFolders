"use strict";

QuickFolders.Themes = {
	// note: for localization, the theme descriptions reside in Babelzilla, naming convention:
	//
	themes : {
		Flat: {
			 name:"Flat Style"
			,Id:"flatTabs"
			,author:"Axel Grude"
			,cssToolbarClassName: 'toolbar-flat'
			,supportsFeatures: {
				 stateColors: true
				,individualColors: true
				,standardTabColor: true
				,pastelColors: true
				,specialIcons: true
				,buttonShadows: true
				,buttonInnerShadows: false
				,supportsFontSelection: false
				,supportsFontSize: true
				,cornerRadius: true
				,borderToggle: false
				,tabTransparency: true
			}
		},

		ApplePills: {
			 name:"Apple Pills"
			,Id:"applePills"
			,author:"Christopher White"
			,cssToolbarClassName: 'pills'
			,supportsFeatures: {
				 stateColors: true
				,individualColors: true
				,standardTabColor: false
				,pastelColors: true
				,specialIcons: true
				,buttonShadows: false
				,buttonInnerShadows: true
				,supportsFontSelection: false
				,supportsFontSize: false
				,cornerRadius: false
				,borderToggle: false
				,tabTransparency: false
			}
		},

		NativeTabs: {
			 name:"Native Tabs"
			,Id:"nativeTabs"
			,author:"Your OS ;)"
			,cssToolbarClassName: 'toolbar-native'
			,supportsFeatures: {
				 stateColors: false
				,individualColors: false
				,standardTabColor: false
				,pastelColors: false
				,specialIcons: true
				,buttonShadows: false
				,buttonInnerShadows: false
				,supportsFontSelection: false
				,supportsFontSize: true
				,cornerRadius: false
				,borderToggle: false
				,tabTransparency: false
			}
		},

		Buttons: {
			 name:"Toolbar Buttons"
			,Id:"flatButtons"
			,author:"Alexander Malfait"
			,cssToolbarClassName: 'toolbar-buttons'
			,supportsFeatures: {
				 stateColors: false
				,individualColors: false
				,standardTabColor: true
				,pastelColors: false
				,specialIcons: true
				,buttonShadows: true
				,buttonInnerShadows: false
				,supportsFontSelection: false
				,supportsFontSize: true
				,cornerRadius: false
				,borderToggle: false
				,tabTransparency: true
			}
		}
	} ,

	Theme : function(id) {
		for (var key in this.themes) {
			var obj = this.themes[key];
			if (id == obj.Id)
				return obj;
		}
		return null;

	}


}