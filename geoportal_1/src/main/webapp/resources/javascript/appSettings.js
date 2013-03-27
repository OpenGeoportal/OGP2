if (typeof OpenGeoportal == 'undefined'){
	OpenGeoportal = {};
} else if (typeof OpenGeoportal != "object"){
    throw new Error("OpenGeoportal already exists and is not an object");
}
/*OpenGeoportal.Ogpsettings
*	object to hold display setting info for the application
*/

OpenGeoportal.OgpSettings = function(){
	
	this.layerState = new OpenGeoportal.LayerSettings();

	var settings = {"loggedIn": false,
			"previousExtent": ""
	};
	var that = this;

	this.getState = function(key){
		//this checks to see if a layer has a particular value for a particular parameter, returns true or false
		//if state info exists for the layer, key & value are matched against that value
		//otherwise, it is matched against defaults...
		var value = settings[key];
		if (typeof value == 'undefined'){
			//do we try to get some sort of default value?
			throw new Error("Value for [" + key + "] is undefined.");
		} else {
			return value;
		}		
	};
	
	this.setState = function(updateObj){
		var sync = false;
		//if no state info, try to add it 
		for (var key in updateObj){
			var currentValue = settings[key];
			if ((typeof currentValue == 'undefined')||(updateObj[key] != currentValue)){
				//if state has changed, propogate the change
				settings[key] = updateObj[key];
				syncUi(key, updateObj[key]);
			} 
		}
	};
	
	var syncUi = function (key, value){
		//console.log('syncUi');
		//should mostly fire events
			switch(key){
			case "preview":
				break;
			case "inCart":
				break;	
			case "opacity":
					break;
			  default:
				  break;				  
			  }
		
	};

};
