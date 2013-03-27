if (typeof OpenGeoportal == 'undefined'){
	OpenGeoportal = {};
} else if (typeof OpenGeoportal != "object"){
    throw new Error("OpenGeoportal already exists and is not an object");
}

OpenGeoportal.LayerActionController = function() {
	//first, determine the preview method, based on the location field, access(?), institution(?) //
	//should also determine preview control based on the location field, access(?), institution(?) //getPreviewControl
	//same for download
	  this.previewLayer = function(thisObj){
	      var rowData = this.getRowData(thisObj);
          var aData = rowData.data;
        	var location = null;
          	try {
          		location = jQuery.parseJSON(this.getColumnData(aData, "Location"));
          	} catch (err){
          		 new org.OpenGeoPortal.ErrorObject(err,'Preview parameters are invalid.  Unable to Preview layer "' + this.getColumnData(aData,"LayerDisplayName") +'"');
          	}
          	
          	
          var layerID = this.getColumnData(aData, "LayerId"); 
	        //var showLayerText = "Preview layer on the map";
	        //var hideLayerText = "Turn off layer preview on the map";
	        var layerState = org.OpenGeoPortal.layerState;
	        if (layerState.getState(layerID,"preview") == "off"){
	            //check the state obj to see if we need to do anything to the layer
	            //Get the data array for this row
	            //our layer id is being used as the openlayers layer name
	            var layerID = this.getColumnData(aData, "LayerId");
    	    	var dataType = this.getColumnData(aData, "DataType");
          	var access = this.getColumnData(aData, "Access");
          	var institution = this.getColumnData(aData, "Institution");
          	var minLatitude = this.getColumnData(aData, "MinY");
          	var maxLatitude = this.getColumnData(aData, "MaxY");
          	var minLongitude = this.getColumnData(aData, "MinX");
          	var maxLongitude = this.getColumnData(aData, "MaxX");
          	var bbox = [];
          	bbox.push(minLongitude);
          	bbox.push(minLatitude);
          	bbox.push(maxLongitude);
          	bbox.push(maxLatitude);
          	bbox = bbox.join(",");
          	var location = null;
          	try {
          		location = jQuery.parseJSON(this.getColumnData(aData, "Location"));
          	} catch (err){
          		 new org.OpenGeoPortal.ErrorObject(err,'Preview parameters are invalid.  Unable to Preview layer "' + this.getColumnData(aData,"LayerDisplayName") +'"');
          	}
          	var georeferenced = this.getColumnData(aData, "GeoReferenced");

          	//check for a proxy here
          	var proxy = org.OpenGeoPortal.InstitutionInfo.getWMSProxy(institution, access);
          	if (proxy){
          		location.wmsProxy = proxy;
          	}
	      	    if (!layerState.layerStateDefined(layerID)){
	    	        layerState.addNewLayer(layerID, {"dataType": dataType});
	      	    }
	    	    layerState.setState(layerID, {"location": location});
	    	    layerState.setState(layerID, {"bbox": bbox});
	      	    
	      	    

	            //check to see if layer is on openlayers map, if so, show layer
	            var opacitySetting = layerState.getState(layerID, "opacity");
	            if (org.OpenGeoPortal.map.getLayersByName(layerID)[0]){
	            	org.OpenGeoPortal.map.showLayer(layerID);
	            	org.OpenGeoPortal.map.getLayersByName(layerID)[0].setOpacity(opacitySetting * .01);
		            //jQuery(thisObj).attr('title', hideLayerText);
		            layerState.setState(layerID, {"preview": "on"});
	            } else{
	            	//use switching logic here to allow other types of layer preview besides wms

	            	var layerName = this.getColumnData(aData, "Name");
	            	var wmsNamespace = this.getColumnData(aData, "WorkspaceName");
	            	var availability = this.getColumnData(aData, "Availability");
	            	/*if (!georeferenced){
	            		//code to handle ungeoreferenced layers
	            	}*/
	            	var mapObj = {"institution": institution, "layerName": layerName, "title": layerID, 
	            			"bbox": bbox, "dataType": dataType, "opacity": opacitySetting *.01, "access": access, "location": location};
          		//should have some sort of method to determine preview type based on location field
	            	if (availability.toLowerCase() == "online"){
	            		if (typeof location.wms != "undefined"){
	            			if ((wmsNamespace.length > 0)
	            				&&(layerName.indexOf(":") == -1)){
	            				layerName = wmsNamespace + ":" + layerName;
	            			}
	            			mapObj.layerName = layerName;
	            			org.OpenGeoPortal.map.addWMSLayer(mapObj);
	            			//this should be triggered when layer load is complete
	            			//jQuery(thisObj).attr('title', hideLayerText);
	            			layerState.setState(layerID, {"preview": "on", "dataType": dataType, "wmsName": layerName});
	            		} else if (typeof location.ArcGISRest != "undefined"){
							org.OpenGeoPortal.map.addArcGISRestLayer({"institution": institution, "layerName": layerName, "title": layerID, 
		            			"west": minLongitude, "south": minLatitude, "east": maxLongitude, "north": maxLatitude, 
		            			"dataType": dataType, "opacity": opacitySetting *.01, "access": access, "location": location});
		            		//this should be triggered when layer load is complete
		            		//jQuery(thisObj).attr('title', hideLayerText);
		            		layerState.setState(layerID, {"preview": "on", "dataType": dataType, "wmsName": layerName});
						} else {
	            			throw new Error("This layer is currently not previewable.");
	            		}
	            	} else if (availability.toLowerCase() == "offline"){
	            		//try to preview bounds
	            		//console.log(mapObj);
          			org.OpenGeoPortal.map.addMapBBox(mapObj);
          			layerState.setState(layerID, {"preview": "on", "dataType": dataType, "wmsName": layerName});
	            	}
	            }
	            this.addToPreviewedLayers(rowData.node);
	            analytics.track("Layer Previewed", institution, layerID);
	            //console.log(this);
	        } else {
	        	try {
	        		//Get the data array for this row
	        		var index = this.tableHeadingsObj.getColumnIndex("LayerId");
	        		var layerID = aData[index];

	        		//layer id is being used as the openlayers layer name
	        		org.OpenGeoPortal.map.hideLayer(layerID);

	        		layerState.setState(layerID, {"preview": "off"});

	       		 	this.previewedLayers.removeLayer(layerID, index);

	        	} catch (err) {new org.OpenGeoPortal.ErrorObject(err, "Error turning off preview.");};

	        }
	  };
};

