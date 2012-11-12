if (typeof org == 'undefined'){ 
	org = {};
} else if (typeof org != "object"){
	throw new Error("org already exists and is not an object");
}

// Repeat the creation and type-checking code for the next level
if (typeof org.OpenGeoPortal == 'undefined'){
	org.OpenGeoPortal = {};
} else if (typeof org.OpenGeoPortal != "object"){
    throw new Error("org.OpenGeoPortal already exists and is not an object");
}
/*org.OpenGeoPortal.LayerSettings
*	object to hold display setting info, where it exists (opacity, etc.)
*/
org.OpenGeoPortal.LayerSettings = function(){
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
	
	this.layerStateDefined = function(layerID){
		if (typeof settings[layerID] == 'undefined'){
			return false;
		} else {
			return true;
		}
	};
	
	this.addNewLayer = function(layerID, params){
		var dataType = params.dataType;

		if ((typeof dataType == 'undefined')||(dataType == '')){
			throw new Error("dataType (Point, Line, Polygon, or Raster) must be specified to create a new layer.");
		}
		if (this.layerStateDefined(layerID)){
			throw new Error("org.OpenGeoPortal.LayerState.addNewLayer: This layer already exists.");
		}
		settings[layerID] = this.getGenericDefaults();
		settings[layerID].dataType = dataType;
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
			settings[layerID][key] = typeSpecificDefaults[key];
		}
		for (var key in params){
			settings[layerID][key] = params[key];
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
	
	this.getState = function(layerID, key){
		//this checks to see if a layer has a particular value for a particular parameter, returns true or false
		//if state info exists for the layer, key & value are matched against that value
		//otherwise, it is matched against defaults...
		for (var layer in settings){
			if (layer == layerID){
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
			throw new Error("org.OpenGeoPortal.LayerSettings.getState(): Requested Parameter\"" + key +"\":State information for the layer has not been set and the default cannot be determined without a Data Type (Point, Line, Polygon, Raster, Paper Map)");
		} else {
			return this.getGenericDefaults()[key];
		}
		
	};
	
	this.setState = function(layerID, updateObj){
		var sync = false;
		//if the layer has no state info, try to add it (dataType must be in updateObj to succeed)
		if (typeof settings[layerID] == 'undefined'){
			this.addNewLayer(layerID, updateObj);
		}
		for (var key in updateObj){
			var currentValue = settings[layerID][key];
			if (updateObj[key] != currentValue){
				//state has changed
				settings[layerID][key] = updateObj[key];
				sync = true;
			};
		}
		updateObj.layerID = layerID;
		//if state has changed, propogate the change
		if (sync){
			syncUi(updateObj);
		}
	};
	
	this.getImage = function(imageName){
		return org.OpenGeoPortal.Utility.ImageLocation + imageName;
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
	
	var syncUi = function (updateObj){
		//console.log('syncUi');
		//return true;
		for (var key in updateObj){
			switch(key){
			case "preview":
			//this needs to check or uncheck a checkbox in another table
			//the checkbox itself will hold state in the current table
				jQuery('.colPreview').each(function(){
					if (this.tagName == 'TD'){
						var tableObj = jQuery(this).closest('table.display');
						var dataTableObj = tableObj.dataTable();
						var aData = dataTableObj.fnGetData(this.parentNode);
						var layerID = aData[org.OpenGeoPortal.resultsTableObj.tableHeadingsObj.getColumnIndex("LayerId")];
						if (layerID == updateObj.layerID){
							if (updateObj.preview == 'on'){
								jQuery(this).find("input").attr("checked", true);
							} else if (updateObj.preview == 'off'){
								jQuery(this).find("input").attr("checked", false);
							}
							//clauses for login and external needed
						}
					}
				}); 
				break;
				case "opacity":
					var stateVal = that.getState(updateObj.layerID, "opacity");
		    		var escapedLayerID = org.OpenGeoPortal.Utility.idEscape(updateObj.layerID);

					jQuery('#opacitysearchResults' + escapedLayerID).slider("value", stateVal);
					jQuery('#opacitysavedLayers' + escapedLayerID).slider("value", stateVal);
					break;
				case "color":
					break;
					//since we are wiping state when we click getFeature, I think
					//we only need to sync icons for expanded rows. register events?
				case "getFeature":
				    if (org.OpenGeoPortal.map.currentAttributeRequest){
				    	org.OpenGeoPortal.map.currentAttributeRequest.abort();
				    }
					var stateVal = that.getState(updateObj.layerID, "getFeature");
					var layer = org.OpenGeoPortal.map.getLayersByName(updateObj.layerID)[0];
		    		var escapedLayerID = org.OpenGeoPortal.Utility.idEscape(updateObj.layerID);
					if (stateVal === true){
						var mapLayers = org.OpenGeoPortal.map.layers;
						for (var i in mapLayers){
							var currentLayer = mapLayers[i];
							if ((currentLayer.CLASS_NAME != 'OpenLayers.Layer.Google')&&
									(currentLayer.name != 'OpenStreetMap')&&
									(currentLayer.CLASS_NAME != 'OpenLayers.Layer.Vector')&&
									(currentLayer.name != updateObj.layerID)){
								that.setState(currentLayer.name, {"getFeature": false});
							} else {
								continue;
							}
						}
						jQuery('.attributeInfoControl').filter('[id$="' + escapedLayerID + '"]').attr("src", that.getImage("preview_down.gif"));
						org.OpenGeoPortal.map.events.register("click", layer, org.OpenGeoPortal.map.wmsGetFeature);
						//console.log(["register layer:", layer]);
						org.OpenGeoPortal.map.getControlsByClass("OpenLayers.Control.ZoomBox")[0].deactivate();
						org.OpenGeoPortal.map.getControlsByClass("OpenLayers.Control.Navigation")[0].activate();
					  jQuery('.olMap').css('cursor', "crosshair");
					} else {
						jQuery('.attributeInfoControl').filter('[id$="' + escapedLayerID + '"]').attr("src", that.getImage("preview.gif"));
						org.OpenGeoPortal.map.events.unregister("click", layer, org.OpenGeoPortal.map.wmsGetFeature);
						org.OpenGeoPortal.map.getControlsByClass("OpenLayers.Control.ZoomBox")[0].deactivate();
						org.OpenGeoPortal.map.getControlsByClass("OpenLayers.Control.Navigation")[0].activate();
						jQuery('.olMap').css('cursor', "-moz-grab");
						/*var mapLayers = org.OpenGeoPortal.map.layers;
						for (var i in mapLayers){
							var currentLayer = mapLayers[i];
							if ((currentLayer.CLASS_NAME != 'OpenLayers.Layer.Google')&&
									(currentLayer.name != updateObj.layerID)){
									that.setState(currentLayer.name, {"getFeature": false});
									//jQuery('.attributeInfoControl').filter('[id$="' + updateObj.layerID + '"]').attr('src', "media/icon_crosshair_off.png");
							} else {
								continue;
							}
						}*/
				  }
				  break;
			  default:
				  break;				  
			  }
		}
	};
};
