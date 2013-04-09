if (typeof OpenGeoportal == 'undefined'){
	OpenGeoportal = {};
} else if (typeof OpenGeoportal != "object"){
    throw new Error("OpenGeoportal already exists and is not an object");
}
/*OpenGeoportal.LayerSettings
*	object to hold display setting info, where it exists (opacity, etc.)
*/
OpenGeoportal.LayerSettings = function LayerSettings(){

	this.previewedLayers = new OpenGeoportal.PreviewedLayers();
	var settings = {};
	var that = this;
	this.getGenericDefaults = function(){
		return {"preview": "off", "inCart": false, "dataType": "", "wmsName": ""};
	};
	this.getPointDefaults = function(){
		return {"getFeature": false, "color": "#ff0000", "opacity": 100, "graphicWidth": 2, "sld": ""};
	};
	this.getLineDefaults = function(){
		return {"getFeature": false, "color": "#0000ff", "opacity": 100, "graphicWidth": 1, "sld": ""};
	};
	this.getPolygonDefaults = function(){
		return {"getFeature": false, "color": "#aaaaaa", "opacity": 80, "graphicWidth": 1, "sld": ""};
	};
	this.getRasterDefaults = function(){
		return {"opacity": 100};
	};
	
	this.layerStateDefined = function(layerId){
		if (typeof settings[layerId] == 'undefined'){
			return false;
		} else {
			return true;
		}
	};
	
	this.addNewLayer = function(layerId, params){
		var dataType = params.dataType;

		if ((typeof dataType == 'undefined')||(dataType == '')){
			throw new Error("dataType (Point, Line, Polygon, or Raster) must be specified to create a new layer.");
		}
		if (this.layerStateDefined(layerId)){
			throw new Error("OpenGeoportal.LayerState.addNewLayer: This layer already exists.");
		}
		settings[layerId] = this.getGenericDefaults();
		settings[layerId].dataType = dataType;
		var typeSpecificDefaults = {};
		switch(dataType){
		case "Point":
			typeSpecificDefaults = this.getPointDefaults();
			break;
		case "Line":
			typeSpecificDefaults = this.getLineDefaults();
			break;
		case "Polygon":
			typeSpecificDefaults = this.getPolygonDefaults();
			break;
		case "Raster":
		case "Paper Map":
		case "LibraryRecord":
			typeSpecificDefaults = this.getRasterDefaults();
			break;
		};
		for (var key in typeSpecificDefaults){
			settings[layerId][key] = typeSpecificDefaults[key];
		}
		for (var key in params){
			settings[layerId][key] = params[key];
		}
	};
	
	this.allLayersByParam = function(key, value){
		var layers = new Array();
		for (var layer in settings){
			if (settings[layer][key] == value){
				layers.push(layer);
			}
		}
		return layers;
	};
	
	this.getState = function(layerId, key){
		//this checks to see if a layer has a particular value for a particular parameter, returns true or false
		//if state info exists for the layer, key & value are matched against that value
		//otherwise, it is matched against defaults...
		for (var layer in settings){
			if (layer == layerId){
				if (typeof settings[layer][key] == 'undefined'){
					return null;
					//throw new Error("The given parameter\"" + key + "\" is not valid for the layer \"" + layer + "\".");
				} else {
					return settings[layer][key];
				}
			}
		}
		//no layer info set....check defaults
		if (typeof this.getGenericDefaults()[key] == 'undefined'){
			//what can we do in this case, w/out dataType info?
			throw new Error("OpenGeoportal.LayerSettings.getState(): Requested Parameter\"" + key +"\":State information for the layer has not been set and the default cannot be determined without a Data Type (Point, Line, Polygon, Raster, Paper Map)");
		} else {
			return this.getGenericDefaults()[key];
		}
		
	};
	
	this.setState = function(layerId, updateObj){
		var sync = false;
		//if the layer has no state info, try to add it (dataType must be in updateObj to succeed)
		if (typeof settings[layerId] == 'undefined'){
			this.addNewLayer(layerId, updateObj);
		}
		for (var key in updateObj){
			var currentValue = settings[layerId][key];
			if (updateObj[key] != currentValue){
				//state has changed
				settings[layerId][key] = updateObj[key];
				sync = true;
			};
		}
		updateObj.layerId = layerId;
		//if state has changed, propogate the change
		if (sync){
			this.syncUi(updateObj);
		}
	};
	
	this.getImage = function(imageName){
		return OpenGeoportal.Utility.ImageLocation + imageName;
	};
	
	this.resetState = function(columnName){
		if (columnName == 'all'){
			settings = {};
		} else {
			for (var layer in settings){
				if (typeof this.getGenericDefaults()[columnName] != 'undefined'){
					settings[layer][columnName] = this.getGenericDefaults()[columnName];
				} else {
					var dataType = settings[layer]["dataType"];
					switch(dataType){
					case "Point":
						settings[layer][columnName] = this.getPointDefaults()[columnName];
						break;
					case "Line":
						settings[layer][columnName] = this.getLineDefaults()[columnName];
						break;
					case "Polygon":
						settings[layer][columnName] = this.getPolygonDefaults()[columnName];
						break;
					case "Raster":
					case "Paper Map":
					case "LibraryRecords":
						settings[layer][columnName] = this.getRasterDefaults()[columnName];
						break;
					};
				}
			}
		}
	};
	
	this.fireEvent = function(customEvent, layerId){
		console.log(customEvent + " triggered for layerId: " + layerId);
		jQuery(document).trigger(customEvent, {"layerId": layerId});
	};
	
	this.syncUi = function(updateObj){
		var layerId = updateObj.layerId;
		for (var key in updateObj){
			switch(key){
			case "preview":
				
				if (updateObj.preview == 'on'){
					this.fireEvent("view.previewOn", layerId);
				} else if (updateObj.preview == 'off'){
					this.fireEvent("view.previewOff", layerId);
				}
				
				break;
			case "inCart":
				
				if (updateObj.inCart){
					this.fireEvent("view.showInCart", layerId);
				} else {
					this.fireEvent("view.showNotInCart", layerId);
				}
				
				break;	
			case "opacity":
				this.fireEvent("map.opacityChange", layerId);
				break;
			case "color":
			case "graphicWidth":
				//both handled by sld change
				this.fireEvent("map.styleChange", layerId);
				break;
			//since we are wiping state when we click getFeature, I think
			//we only need to sync icons for expanded rows. register events?
			case "getFeature":
				
				if (updateObj.getFeature){
					this.fireEvent("map.getFeatureInfoOn", layerId);
				} else {
					this.fireEvent("map.getFeatureInfoOff", layerId);
				}
				/*
				    if (OpenGeoportal.map.currentAttributeRequest){
				    	OpenGeoportal.map.currentAttributeRequest.abort();
				    }
					var stateVal = that.getState(updateObj.layerId, "getFeature");
					var layer = OpenGeoportal.map.getLayersByName(updateObj.layerId)[0];
		    		var escapedLayerId = OpenGeoportal.Utility.idEscape(updateObj.layerId);
					if (stateVal === true){
						var mapLayers = OpenGeoportal.map.layers;
						for (var i in mapLayers){
							var currentLayer = mapLayers[i];
							if ((currentLayer.CLASS_NAME != 'OpenLayers.Layer.Google')&&
									(currentLayer.name != 'OpenStreetMap')&&
									(currentLayer.CLASS_NAME != 'OpenLayers.Layer.Vector')&&
									(currentLayer.name != updateObj.layerId)){
								that.setState(currentLayer.name, {"getFeature": false});
							} else {
								continue;
							}
						}
						jQuery('.attributeInfoControl').filter('[id$="' + escapedLayerId + '"]').attr("src", that.getImage("preview_down.gif"));
						OpenGeoportal.map.events.register("click", layer, OpenGeoportal.map.wmsGetFeature);
						jQuery(document).trigger("getFeatureActivated");
						//console.log(["register layer:", layer]);
						OpenGeoportal.map.getControlsByClass("OpenLayers.Control.ZoomBox")[0].deactivate();
						OpenGeoportal.map.getControlsByClass("OpenLayers.Control.Navigation")[0].deactivate();
					  jQuery('.olMap').css('cursor', "crosshair");
					} else {
						jQuery('.attributeInfoControl').filter('[id$="' + escapedLayerId + '"]').attr("src", that.getImage("preview.gif"));
						OpenGeoportal.map.events.unregister("click", layer, OpenGeoportal.map.wmsGetFeature);

				  }*/
				  break;
			  default:
				  break;				  
			  }
		}
	};
};
