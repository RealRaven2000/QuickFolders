"use strict";
/* BEGIN LICENSE BLOCK

QuickFolders is released under the Creative Commons (CC BY-ND 4.0)
Attribution-NoDerivatives 4.0 International (CC BY-ND 4.0) 
For details, please refer to license.txt in the root folder of this extension

END LICENSE BLOCK */


QuickFolders.Themes = {
	// note: for localization, the theme descriptions reside in Babelzilla, naming convention:
	//
	themes : {
		Flat: {
			 name:"Flat Style"
			,Id:"flatTabs"
			,author:"Axel Grude"
			,cssToolbarClassName: 'quickfolders-flat'
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
				,supportsHeightTweaks: true
        ,toolbarBorder: true
				,cornerRadius: true
				,borderToggle: false
				,tabTransparency: true
			}
		},

		ApplePills: {
			 name:"Apple Pills"
			,Id:"applePills"
			,author:"Christopher White"
			,cssToolbarClassName: 'quickfolders-pills'
			,supportsFeatures: {
				 stateColors: false
				,individualColors: true
				,standardTabColor: false
				,pastelColors: true
				,specialIcons: true
				,buttonShadows: false
				,buttonInnerShadows: true
				,supportsFontSelection: false
				,supportsFontSize: false
				,supportsHeightTweaks: false
        ,toolbarBorder: false
				,cornerRadius: false
				,borderToggle: false
				,tabTransparency: false
			}
		},

		NativeTabs: {
			 name:"Native Tabs"
			,Id:"nativeTabs"
			,author:"Your OS ;)"
			,cssToolbarClassName: 'quickfolders-realTabs'
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
				,supportsHeightTweaks: false
        ,toolbarBorder: false
				,cornerRadius: false
				,borderToggle: false
				,tabTransparency: false
			}
		},

		Buttons: {
			 name:"Toolbar Buttons"
			,Id:"flatButtons"
			,author:"Alexander Malfait"
			,cssToolbarClassName: 'quickfolders-toolbarbuttons'
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
				,supportsHeightTweaks: false
        ,toolbarBorder: false
				,cornerRadius: false
				,borderToggle: false
				,tabTransparency: true
			}
		} ,
		
		RealButtons: {
			 name:"Buttons"
			,Id:"realButtons"
			,author:"Axel Grude"
			,cssToolbarClassName: 'quickfolders-realbuttons'
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
				,supportsHeightTweaks: false
        ,toolbarBorder: false
				,cornerRadius: false
				,borderToggle: false
				,tabTransparency: true
			}
		}
/* end of themes list */	
	} ,

	Theme : function(id) {
		for (let key in this.themes) {
			let obj = this.themes[key];
			if (id == obj.Id)
				return obj;
		}
		// if no theme is found, let's default to flatTabs
		return this.themes['Flat'];

	}

}