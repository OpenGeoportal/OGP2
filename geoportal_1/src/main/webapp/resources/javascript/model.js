
				if (OpenGeoportal.ogp.ui.login.isLoggedIn()){
					if (OpenGeoportal.ogp.ui.filterState()){
						OpenGeoportal.ogp.ui.previousExtent = "";

						



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

org.OpenGeoPortal.MapController.prototype.prevExtent = null;

var style_blue = OpenLayers.Util.extend({}, OpenLayers.Feature.Vector.style['default']);
/*
 * 4px border,
border color: #1D6EEF, background color: #DAEDFF, box opacity: 25%
 */
style_blue.strokeColor = "#1D6EEF";//'#003366';
style_blue.fillColor = "#DAEDFF";//'#003366';
style_blue.fillOpacity = .25;
style_blue.pointRadius = 10;
style_blue.strokeWidth = 4;
style_blue.strokeLinecap = "butt";
style_blue.zIndex = 999;

this.userMapAction = false;
org.OpenGeoPortal.MapController.prototype.getBackgroundType = function() {
	var layers = this.layers;
	for (var i in layers){
		if ((layers[i].CLASS_NAME == "OpenLayers.Layer.Google")&&(layers[i].visibility == true)
				&&layers[i].opacity == 1){
			return layers[i].type;
		} else {
			return "osm";
		}
	}
};

org.OpenGeoPortal.MapController.prototype.backgroundMaps = function(mapType){
	if (typeof google != "undefined"){
		var bgMaps = {
			googleHybrid: {mapClass: "Google", zoomLevels: 22, name: "Google Hybrid", params: {type: google.maps.MapTypeId.HYBRID}},
			googleSatellite: {mapClass: "Google", zoomLevels: 22, name: "Google Satellite", params: {type: google.maps.MapTypeId.SATELLITE}},
			googleStreets: {mapClass: "Google", zoomLevels: 20, name: "Google Streets", params: {type: google.maps.MapTypeId.ROADMAP}}, 
			googlePhysical: {mapClass: "Google", zoomLevels: 15, name: "Google Physical", params: {type: google.maps.MapTypeId.TERRAIN}},
			osm: {mapClass: "TMS", zoomLevels: 17, name: "OpenStreetMap", params: {type: 'png', getURL: this.getOsmTileUrl,
				displayOutsideMaxExtent: true}, url: "http://tile.openstreetmap.org/"}
		};
		if (mapType == "all"){
			return bgMaps;
		} else {
			return bgMaps[mapType];
		}
	} else{
		bgMaps = {osm: {mapClass: "TMS", zoomLevels: 17, name: "OpenStreetMap", params: {type: 'png', getURL: this.getOsmTileUrl,
		displayOutsideMaxExtent: true}, url: "http://tile.openstreetmap.org/"}};
		if (mapType == "all"){
			return bgMaps;
		} else {
			return bgMaps["osm"];
		}
	}
};

org.OpenGeoPortal.MapController.prototype.getCurrentBackgroundMap = function(){
	if (typeof google != "undefined"){
		return this.currentBackgroundMap;
	} else{
		return "osm";
	}
};

org.OpenGeoPortal.MapController.prototype.currentBackgroundMap = "googlePhysical"; //default background map

org.OpenGeoPortal.MapController.prototype.setCurrentBackgroundMap = function(bgType){
	try {
		this.backgroundMaps(bgType);
		this.currentBackgroundMap = bgType;
	} catch (e) {
		throw new Error("This background type does not exist: "+ bgType);
	}
};

org.OpenGeoPortal.MapController.prototype.setBackgroundMap = function(bgType) {
	//default 
	bgType = bgType || this.getCurrentBackgroundMap();
	this.setCurrentBackgroundMap(bgType);
	var zoomLevel = this.getZoom();
	if (zoomLevel >= (this.backgroundMaps(bgType).zoomLevels - 1)){
		this.changeBackgroundMap("googleHybrid");
	} else {
		this.changeBackgroundMap(bgType);
	}
};


org.OpenGeoPortal.layerState = new org.OpenGeoPortal.LayerSettings();
org.OpenGeoPortal.map = new org.OpenGeoPortal.MapController();
org.OpenGeoPortal.resultsTableObj = new org.OpenGeoPortal.LayerTable();
org.OpenGeoPortal.cartTableObj = new org.OpenGeoPortal.LayerTable("savedLayersTable", "savedLayers");
org.OpenGeoPortal.ui = new org.OpenGeoPortal.UserInterface();

org.OpenGeoPortal.cartTableObj.hideCol("Save");
org.OpenGeoPortal.cartTableObj.showCol("checkBox");
org.OpenGeoPortal.ui.addSharedLayersToCart();

org.OpenGeoPortal.downloadQueue = new org.OpenGeoPortal.Downloader();

org.OpenGeoPortal.InstitutionInfo.Config = {};
org.OpenGeoPortal.InstitutionInfo.Search = {};
org.OpenGeoPortal.InstitutionInfo.homeInstitution = "";
org.OpenGeoPortal.InstitutionInfo.institutionSpecificCss = "";
org.OpenGeoPortal.InstitutionInfo.institutionSpecificJavaScript = "";
org.OpenGeoPortal.InstitutionInfo.institutionSpecificGoogleAnalyticsId = "";

org.OpenGeoPortal.InstitutionInfo.getHomeInstitution = function(){	
	var institution = org.OpenGeoPortal.InstitutionInfo.homeInstitution;
	//return homeInstitution if it is not empty
	if (institution.length > 0){
		return institution;
	} else {
		org.OpenGeoPortal.InstitutionInfo.requestInfo();
		return org.OpenGeoPortal.InstitutionInfo.homeInstitution;
	}
};


org.OpenGeoPortal.InstitutionInfo.getCustomCss = function(){	
	var institution = org.OpenGeoPortal.InstitutionInfo.institutionSpecificCss;
	//return institutionSpecificCss if it is not empty
	if (institution.length > 0){
		return institution;
	} else {
		org.OpenGeoPortal.InstitutionInfo.requestInfo();
		return org.OpenGeoPortal.InstitutionInfo.institutionSpecificCss;
	}
};

org.OpenGeoPortal.InstitutionInfo.getCustomJavaScript = function(){	
	var javaScriptFileName = org.OpenGeoPortal.InstitutionInfo.institutionSpecificJavaScript;
	return javaScriptFileName;
};

org.OpenGeoPortal.InstitutionInfo.getGoogleAnalyticsId = function(){	
	var googleAnalyticsId = org.OpenGeoPortal.InstitutionInfo.institutionSpecificGoogleAnalyticsId;
	return googleAnalyticsId;
};

org.OpenGeoPortal.InstitutionInfo.getWMSProxy = function(institution, accessLevel) {
	var configObj = org.OpenGeoPortal.InstitutionInfo.Config[institution];
	if (typeof configObj.proxy != "undefined"){
		if (jQuery.inArray(accessLevel.toLowerCase(), configObj.proxy.accessLevel) > -1){
			return configObj.proxy.wms;
		}
	} 
		
	return false;
	
};

org.OpenGeoPortal.InstitutionInfo.getLoginType = function(institution){
	var info = org.OpenGeoPortal.InstitutionInfo.getInstitutionInfo();
	return info[institution]["login"]["loginType"];
};

org.OpenGeoPortal.InstitutionInfo.getAuthenticationPage = function(institution){
	var info = org.OpenGeoPortal.InstitutionInfo.getInstitutionInfo();
	return info[institution]["login"]["authenticationPage"];
};

org.OpenGeoPortal.InstitutionInfo.getSearch = function(){	
	var search = org.OpenGeoPortal.InstitutionInfo.Search;
	//return Search if it is not empty
	for (var i in search){
		return search;
	}

	org.OpenGeoPortal.InstitutionInfo.requestInfo();
	return org.OpenGeoPortal.InstitutionInfo.Search;
	
};

org.OpenGeoPortal.InstitutionInfo.getInstitutionInfo = function(){
	var configObj = org.OpenGeoPortal.InstitutionInfo.Config;
	//return the configObj if it is not empty
	for (var i in configObj){
		return configObj;
	}
	//otherwise, get set the configObj from the xml config file
	org.OpenGeoPortal.InstitutionInfo.requestInfo();
	return org.OpenGeoPortal.InstitutionInfo.Config;
};

org.OpenGeoPortal.InstitutionInfo.requestInfo = function(){
	var params = {
		url: "resources/ogpConfig.json",
		async: false,
		contentType: "text/json",
		dataType: 'json',
		success: function(data){
			var institutions = data["config"]["institutions"];
			org.OpenGeoPortal.InstitutionInfo.Search = data["config"]["search"];
			org.OpenGeoPortal.InstitutionInfo.institutionSpecificCss = data["config"]["institutionSpecificCss"];
			org.OpenGeoPortal.InstitutionInfo.institutionSpecificJavaScript = data["config"]["institutionSpecificJavaScript"];
			org.OpenGeoPortal.InstitutionInfo.institutionSpecificGoogleAnalyticsId = data["config"]["googleAnalyticsId"];
			org.OpenGeoPortal.InstitutionInfo.Config = institutions;
			org.OpenGeoPortal.InstitutionInfo.homeInstitution = data["config"]["homeInstitution"];
		},
		error: function(jqXHR, textStatus, errorThrown){
			alert(textStatus);
			alert(errorThrown);
			alert(jqXHR);
		}
	  };
	jQuery.ajax(params);
};

org.OpenGeoPortal.InstitutionInfo.imagePath = org.OpenGeoPortal.Utility.ImageLocation;

org.OpenGeoPortal.InstitutionInfo.icons = {
		"dataTypes": {
				  "Point": {"source": org.OpenGeoPortal.InstitutionInfo.imagePath + "type_dot.png", "uiClass": "pointIcon", "displayName":"point"},
				  "Line": {"source": org.OpenGeoPortal.InstitutionInfo.imagePath + "type_arc.png", "uiClass": "lineIcon", "displayName":"line"},
				  "Polygon": {"source": org.OpenGeoPortal.InstitutionInfo.imagePath + "type_polygon.png", "uiClass": "polygonIcon", "displayName":"polygon"},
				  "Raster": {"source":  org.OpenGeoPortal.InstitutionInfo.imagePath + "type_raster.png", "uiClass": "rasterIcon", "displayName":"raster"},
				  "PaperMap": {"source": org.OpenGeoPortal.InstitutionInfo.imagePath + "type_map.png", "uiClass": "mapIcon", "displayName":"scanned map"}/*,
				  "LibraryRecord": {"source": org.OpenGeoPortal.InstitutionInfo.imagePath + "type_library.png", "displayName":"library record"}*/
	}
};


org.OpenGeoPortal.InstitutionInfo.dataTypes = {	dataTypeArray : [{"DisplayName":"Point", "value": "point"}, 
                                               	                 {"DisplayName":"Line", "value": "line"},
                                            	                 {"DisplayName":"Polygon", "value": "polygon"}, 
                                            	                 {"DisplayName":"Raster", "value": "raster"},
                                            	                 {"DisplayName":"Scanned Map", "value": "paper map"}]};

org.OpenGeoPortal.UserInterface.prototype.IgnoreAuthenticationWarning = {"home": false, "external": false};

/**
 * checks the state of the map filter
 * 
 * @returns a boolean that is true if the map filter is on
 */
org.OpenGeoPortal.UserInterface.prototype.filterState = function(){
	//return jQuery('#basicSearchMapFilter').is(":checked");
	return true;
};


org.OpenGeoPortal.UserInterface.prototype.userInputFlag = false;


org.OpenGeoPortal.UserInterface.prototype.searchPanelWidth = 450;

org.OpenGeoPortal.UserInterface.prototype.getSearchPanelWidth = function(){
	return this.searchPanelWidth;
};

org.OpenGeoPortal.UserInterface.prototype.setSearchPanelWidth = function(newValue){
	this.searchPanelWidth = newValue;
};


//maintains state for layers, where the state can differ with table instances
//******Table Specific
org.OpenGeoPortal.LayerTable.TableLayerState = function(){
	//{layerID: {key: value}}; currently "expanded" is the only key, value is boolean
	var layersExpandedState = {};
	var tableDefaults = {"expanded": false};
	this.getFeatureTitle = "";
	this.setState = function(layerID, updateObj){

		if (typeof layersExpandedState[layerID] == 'undefined'){
			layersExpandedState[layerID] = {};
			for (var key in tableDefaults){
				layersExpandedState[layerID][key] = tableDefaults[key];
			}
		}
		for (var key in updateObj){ 
			if (typeof tableDefaults[key] == 'undefined'){
				throw new Error('The parameter "' + key + '" cannot be set for tableLayerState.');
			} else {
				layersExpandedState[layerID][key] = updateObj[key];
			}
		}
	};
	
	this.getState = function(layerID, key){
		if (typeof layersExpandedState[layerID] == 'undefined'){
			if (typeof tableDefaults[key] == 'undefined'){
				throw new Error('The parameter "' + key + '" is not applicable to tableLayerState.');
			} else {
				var stateValue = tableDefaults[key];
				return stateValue;
			}
		} else {
			var stateValue = layersExpandedState[layerID][key];
			return stateValue;
		}
	};
};

//object defines the columns and their display properties, holds state information
//write a getter and a setter for this object?
//******Table Specific
org.OpenGeoPortal.LayerTable.TableHeadings = function(thisObj){
	var defaultHeadings = {
			"LayerId": {"ajax": true, "resizable": false, "organize": false, "columnConfig": 
				{"sName": "LayerId", "sTitle": "LayerId", "bVisible": false, "aTargets": [ 0 ], "bSortable": false}},
			"checkBox": {"ajax": false, "resizable": false, "organize": false, "columnConfig": 
		            	{"sName": "checkBox", "sTitle": "<input type=\"checkbox\" id=\"downloadHeaderCheck\" checked />", "bVisible": false, "aTargets": [ 1 ], "sClass": "colChkBoxes", "sWidth": "21px", "bSortable": false,
							"fnRender": function(oObj){return thisObj.getDownloadControl(oObj);}}},
			"expandControls": {"ajax": false, "resizable": false, "organize": false, "columnConfig": 
			            {"sName": "expandControls", "sTitle": "", "bVisible": true, "aTargets": [ 2 ], "sClass": "colExpand", "sWidth": "8px", "bSortable": false,
							"fnRender": function(oObj){return thisObj.getExpandIcon(oObj);}}},  
			"Save": {"ajax": false, "resizable": false, "organize": false, "columnConfig": 
		                {"sName": "Save", "sTitle": "<div class=\"cartIconTable\" title=\"Add layers to your cart for download.\" ></div>", "bVisible": true, "aTargets": [ 3 ], "sClass": "colSave", "sWidth": "19px", "bSortable": false,
		              		"fnRender": function(oObj){return thisObj.getSaveControl(oObj);}}},
		    "score": {"ajax": true, "resizable": true, "minWidth": 27, "currentWidth": 27, "organize": true, "displayName": "Relevancy", "columnConfig": 
		                    {"sName": "score", "sTitle": "Relevancy", "bVisible": false, "aTargets": [ 4 ], "sClass": "colScore", "sWidth": "27px", "bSortable": false }},
		     "DataType": {"ajax": true, "resizable": false, "organize": "group", "displayName": "Data Type", "columnConfig": 
		            	{"sName": "DataType", "sTitle": "Type", "bVisible": true, "aTargets": [ 5 ], "sClass": "colType", "sWidth": "24px", "bSortable": false, "bUseRendered": false, 
		            		"fnRender": function(oObj){return thisObj.getTypeIcon(oObj);}}},
		     "Name": {"ajax": true, "resizable": false, "organize": false, "columnConfig": 
		            	{"sName": "Name", "sTitle": "LayerName", "bVisible": false, "aTargets": [ 6 ], "bSortable": false}},
		     "LayerDisplayName": {"ajax": true, "resizable": true, "minWidth": 28, "currentWidth": 215, "organize": "alpha", "displayName": "Name", "columnConfig": 
		            	{"sName": "LayerDisplayName", "sTitle": "Name", "bVisible": true, "aTargets": [ 7 ], "sClass": "colTitle", "bSortable": false}}, 
		     "Originator": {"ajax": true, "resizable": true, "minWidth": 47, "currentWidth": 81, "organize": "group", "displayName": "Originator", "columnConfig": 
		            	{"sName": "Originator", "sTitle": "Originator", "bVisible": true, "aTargets": [ 8 ], "sClass": "colOriginator", "bSortable": false}},            	
		     "Publisher": {"ajax": true, "resizable": true, "minWidth": 47, "currentWidth": 80, "organize": "group", "displayName": "Publisher", "columnConfig": 
		            	{"sName": "Publisher", "sTitle": "Publisher", "bVisible": false, "aTargets": [ 9 ], "sClass": "colPublisher", "bSortable": false}},
		     "ContentDate": {"ajax": true, "resizable": false, "organize": "numeric", "displayName": "Date", "columnConfig": 
		            	{"sName": "ContentDate", "sTitle": "Date", "bVisible": false, "aTargets": [ 10 ], "sClass": "colDate", "sWidth": "25px", "bSortable": false, "bUseRendered": true,
		            		"fnRender": function(oObj){return thisObj.renderDate(oObj);/*return oObj.aData[oObj.iDataColumn].substr(0, 4);*/}}},
		     "Institution": {"ajax": true, "resizable": false, "organize": "alpha", "displayName": "Repository", "columnConfig": 
		            	{"sName": "Institution", "sTitle": "Rep", "bVisible": true, "aTargets": [ 11 ], "sClass": "colSource", "sWidth": "19px", "bSortable": false, "bUseRendered": false, 
		            		"fnRender": function(oObj){return thisObj.getSourceIcon(oObj);}}},  
		     "Metadata": {"ajax": false, "resizable": false, "organize": false, "columnConfig": 
		                {"sName": "Metadata", "sTitle": "Meta", "bVisible": true, "aTargets": [ 12 ], "sClass": "colMetadata", "sWidth": "17px", "bSortable": false, "bUseRendered": false, 
		                 	"fnRender": function(oObj){return thisObj.getMetadataIcon(oObj);}}},       		
		     "Access": {"ajax": true, "resizable": false, "organize": "alpha", "displayName": "Access", "columnConfig": 
		                 {"sName": "Access", "sTitle": "Access", "bVisible": false, "aTargets": [ 13 ], "sClass": "colAccess", "sWidth": "53px", "bSortable": false}},
		     "View": {"ajax": false, "resizable": false, "organize": false, "columnConfig": 
		            	{"sName": "View", "sTitle": "View", "bVisible": true, "aTargets": [ 14 ], "sClass": "colPreview", "sWidth": "39px", "bSortable": false,
		            			"fnRender": function(oObj){return thisObj.getPreviewControl(oObj);}}},
		     "Location": {"ajax": true, "resizable": false, "organize": false, "columnConfig": 
		            	{"sName": "Location", "sTitle": "WmsURL", "bVisible": false, "aTargets": [ 15 ], "bSortable": false}},
		     "MinY": {"ajax": true, "resizable": false, "organize": false, "columnConfig": 
		            	{"sName": "MinY", "sTitle": "MinLatitude", "bVisible": false, "aTargets": [ 16 ], "bSortable": false}},
		     "MaxY": {"ajax": true, "resizable": false, "organize": false, "columnConfig": 
		            	{"sName": "MaxY", "sTitle": "MaxLatitude", "bVisible": false, "aTargets": [ 17 ], "bSortable": false}},
		     "MinX": {"ajax": true, "resizable": false, "organize": false, "columnConfig": 
		            	{"sName": "MinX", "sTitle": "MinLongitude", "bVisible": false, "aTargets": [ 18 ], "bSortable": false}},
		     "MaxX": {"ajax": true, "resizable": false, "organize": false, "columnConfig": 
		            	{"sName": "MaxX", "sTitle": "MaxLongitude", "bVisible": false, "aTargets": [ 19 ], "bSortable": false}},
		     "WorkspaceName": {"ajax": true, "resizable": false, "organize": false, "columnConfig": 
		            	{"sName": "WorkspaceName", "sTitle": "Workspace Name", "bVisible": false, "aTargets": [ 20 ], "bSortable": false}},
		     "GeoReferenced": {"ajax": true, "resizable": false, "organize": false, "columnConfig": 
		            	{"sName": "GeoReferenced", "sTitle": "Georeferenced", "bVisible": false, "aTargets": [ 21 ], "bSortable": false}},
		   	 "Availability": {"ajax": true, "resizable": false, "organize": false, "columnConfig": 
		            	{"sName": "Availability", "sTitle": "Availability", "bVisible": false, "aTargets": [ 22 ], "bSortable": false}}
			};
	//this should be a function, so some params can be set on init
	//fnRender functions and targets should be generated on init
	//also currentwidth? or sometime after init
	var headings = defaultHeadings;

	this.getTableHeadings = function(){
		return headings;
	};
	
	this.getValue = function(headingKey, headingParameter){
		if (typeof headings[headingKey] == 'undefined'){
			throw new Error('The specified parameter "' + headingParameter + '" does not exist for the column heading "' + headingKey + '"');
		}
		if (typeof headings[headingKey][headingParameter] != 'undefined'){
			return headings[headingKey][headingParameter];
		} else if (typeof headings[headingKey]["columnConfig"][headingParameter] != 'undefined'){
			return headings[headingKey]["columnConfig"][headingParameter];
		} else {
			throw new Error('The specified parameter "' + headingParameter + '" does not exist for the column heading "' + headingKey + '"');
		}
	};
	
	//convenience function for getting the width of a column
	this.getWidth = function(headingKey){
		if (headings[headingKey]["resizable"]){
			return this.getValue(headingKey, "currentWidth");
		} else {
			//this may not be helpful, since sWidth is not really enforceable
			return this.getValue(headingKey, "sWidth");
		}
	};
	
	//only certain parameters should be changeable
	this.setWidth = function(headingKey, newWidth){
		if (typeof headings[headingKey] == 'undefined'){
			throw new Error('The heading key: "' + headingKey + '" is not applicable to the function setWidth');
		}
		var currentHeadingObj = headings[headingKey];
		if (currentHeadingObj["resizable"]){
			//should validate newWidth to make sure that it is an appropriate integer
			if (newWidth >= currentHeadingObj["minWidth"]){
				currentHeadingObj["currentWidth"] = newWidth;
			} else {
				currentHeadingObj["currentWidth"] = currentHeadingObj["minWidth"];
			}
			return currentHeadingObj["currentWidth"];
		} else {
			return currentHeadingObj["columnConfig"]["sWidth"];
			//throw new Error('The column "' + headingKey + '" cannot be resized.');
		}
	};
	
	//convenience function
	this.getColumnIndex = function(headingKey){
		return this.getValue(headingKey, "aTargets")[0];
	};
};



org.OpenGeoPortal.PreviewedLayers = {
		layers: [],
		getLayers: function(){
			return this.layers;
		},
		addLayer: function(layer){
			this.layers.unshift(layer);
			return this.layers;
		},
		removeLayer: function(columnValue, columnIndex){
			for (var layerIndex in this.layers){
				if (this.layers[layerIndex][columnIndex] == columnValue){
					this.layers.splice(layerIndex, 1);
	            }
			}
		},
		clearLayers: function(){
			this.layers = [];
		}
};         

//maintains state for how the table is sorted
//*******Search Results only
this.tableOrganize = {
    //set some defaults
	settings: {"organizeBy": "score", "organizeType": "numeric", "organizeDirection": "desc"},
	//we only need organizetype if there is more than one possibility per column
	//get the current sort state
	getState: function(){
		return this.settings;
	},
	
	//set the state
	setState: function(updateObj){//can't directly set organizeType; this will be looked up in tableHeading
		//test to see if the state is changed; if so, fire new solr search
		var innerThat = this;
		compareState = function(key){
			if (updateObj[key] == innerThat.settings[key]){
				return true;
			} else {
				return false;
			}
		};
		setSortColumn = function(){
			//test for rank first
			var newColumn = updateObj.organizeBy;

			analytics.track("Change Results Sort Order", newColumn);

			if (newColumn == 'score'){
				innerThat.settings.organizeBy = newColumn;
				innerThat.settings.organizeType = "numeric";
			} else {
				for (var columnName in tableHeadings){
					if (newColumn == columnName){
						var newOrganize = columnName.organize;
						if (newOrganize){
							throw new Error("This column cannot be organized."); //you can't organize this column
						} else {
							innerThat.settings.organizeBy = newColumn;
							innerThat.settings.organizeType = newOrganize;
							return;
						}
					}
				}
				throw new Error("The specified column name does not exist."); //if it gets here, this means that there was no matching column name in tableHeadings
			}
		};
		
		setSortDirection = function(){
			if (typeof updateObj.organizeDirection == 'undefined'){
				updateObj.organizeDirection = innerThat.settings.organizeDirection;
			}
			if ((updateObj.organizeDirection == 'asc')||(updateObj.organizeDirection == 'desc')){
				innerThat.settings.organizeDirection = updateObj.organizeDirection;
			} else {
				throw new Error("The specified sort direction is invalid for this column."); //invalid organize direction type
			}
		};
		
		if (typeof updateObj.organizeBy == 'undefined'){
			if (typeof updateObj.organizeDirection == 'undefined'){
				//these values can't both be unspecified
				throw new Error("Must specify a column and/or direction.");
			} else {
				//set organizeBy to current value, continue processing
				updateObj.organizeBy = innerThat.settings.organizeBy;
				setSortColumn();
				setSortDirection();
				that.searchRequest(0);
				org.OpenGeoPortal.ui.updateSortMenu();
			}
		} else if (compareState('organizeBy')){
			if (compareState('organizeDirection')){
				//don't do anything...the object hasn't changed exit function
				return;
			} else {
				setSortDirection();
				that.searchRequest(0);
				org.OpenGeoPortal.ui.updateSortMenu();
			}
		} else {
			setSortColumn();
			setSortDirection();
			that.searchRequest(0);
			org.OpenGeoPortal.ui.updateSortMenu();
		}
	}
};
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
	
	//don't put logic in syncUi.  instead, fire custom events that are bound to code that handles UI updates
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
						jQuery(document).trigger("getFeatureActivated");
						//console.log(["register layer:", layer]);
						org.OpenGeoPortal.map.getControlsByClass("OpenLayers.Control.ZoomBox")[0].deactivate();
						org.OpenGeoPortal.map.getControlsByClass("OpenLayers.Control.Navigation")[0].deactivate();
					  jQuery('.olMap').css('cursor', "crosshair");
					} else {
						jQuery('.attributeInfoControl').filter('[id$="' + escapedLayerID + '"]').attr("src", that.getImage("preview.gif"));
						org.OpenGeoPortal.map.events.unregister("click", layer, org.OpenGeoPortal.map.wmsGetFeature);

				  }
				  break;
			  default:
				  break;				  
			  }
		}
	};
};
