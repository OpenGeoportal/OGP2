/**
 * this should come from a config file
 * Ideally we could have an object with all needed variables of an institution parameterized;
 * wms server, tilecaching server, download server, source graphic...what else? resolutions array for tile caching?
 */

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

if (typeof org.OpenGeoPortal.InstitutionInfo == 'undefined'){
	org.OpenGeoPortal.InstitutionInfo = {};
} else if (typeof org.OpenGeoPortal.InstitutionInfo !== "object"){
    throw new Error("org.OpenGeoPortal.InstitutionInfo already exists and is not an object");
}

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
		if (jQuery.inArray(accessLevel.toLowerCase(), configObj.proxy.accessLevel)){
			return configObj.proxy.wms;
		}
	} 
		
	return false;
	
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
		url: "ogpConfig.json",
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

/*org.OpenGeoPortal.InstitutionInfo.getPreviewUrlArray = function(layerObj){
	//is layer public or private? is this a request that can be handled by a tilecache?
	//is this a wms request? something to think about.  for now, we only support wms previews
	validateLayerObj = function(){
		var paramArray = ["access", "institution", "tilecache"];
		for (var paramIndex in paramArray){
			var param = paramArray[paramIndex];
			if (typeof layerObj[param] == "undefined"){
				throw new Error("org.OpenGeoPortal.InstitutionInfo.getPreviewUrlArray: The parameter " + param + " is required.");
			}
		}
	};
	validateLayerObj();
	var urlArraySize = 3; //this seems to be a good size for OpenLayers performance
	var urlArray = [];
	populateUrlArray = function(url){
		for (var i=0; i < urlArraySize; i++){
			urlArray[i] = url;
		}	
	};
	var wmsProxyUrl = this.localRestrictedWMS;
	if (wmsProxyUrl.length == 0){
		throw new Error("No server for restricted data has been configured.");
	}
	if (layerObj.access.toLowerCase() != "public"){
		if (layerObj.institution.toLowerCase() != this.getHomeInstitution().toLowerCase()) {
			throw new Error("You don't have access to preview this layer");
		} else {
			populateUrlArray(wmsProxyUrl);
		}
	} else {
		var institutionInfo = this.getInstitutionInfo();
		var addressArray;
		if ((typeof institutionInfo[layerObj.institution].preview.tileCache == "undefined") ||
				(layerObj.tilecache == false)){
			addressArray = institutionInfo[layerObj.institution].preview.WMS.serviceAddress;
			if (addressArray.length == 1){
				populateUrlArray(addressArray[0]);
			} else {
				urlArray = addressArray;
			}
		} else {
			addressArray = institutionInfo[layerObj.institution].preview.tileCache.serviceAddress;
			if (addressArray.length == 1){
				populateUrlArray(addressArray[0]);
			} else {
				urlArray = addressArray;
			}
		}
	}
	
	return urlArray;
};

org.OpenGeoPortal.InstitutionInfo.tilecacheToWMS =  function(tilingUrl){
	var wmsArray = false;
	var tilingArray = new Array();
	if (jQuery.isArray(tilingUrl)){
		tilingArray = tilingUrl;
		tilingUrl = tilingUrl[0];
		wmsArray = true;
	}

	if (tilingUrl.indexOf(this.localRestrictedWMS) > -1){
		return tilingUrl;
	}
	var institutionInfo = org.OpenGeoPortal.InstitutionInfo.getInstitutionInfo();
	for (var institution in institutionInfo){
		var currentInstitution = institutionInfo[institution].preview;
		for (var serviceType in currentInstitution){
			if (tilingUrl == currentInstitution[serviceType].serviceAddress[0]){
				if (wmsArray){
					for (var i in tilingArray){
						tilingArray[i] = currentInstitution.WMS.serviceAddress[0];
					}
					return tilingArray;
				} else {
					return currentInstitution.WMS.serviceAddress[0];
				}
			}
		}
	}
};
*/

org.OpenGeoPortal.InstitutionInfo.icons = {
		"dataTypes": {
				  "Point": {"source": "media/type_dot.png", "displayName":"Point"},
				  "Line": {"source": "media/type_arc.png", "displayName":"Line"},
				  "Polygon": {"source": "media/type_polygon.png", "displayName":"Polygon"},
				  "Raster": {"source": "media/type_raster.png", "displayName":"Raster"},
				  "PaperMap": {"source": "media/type_map.png", "displayName":"Scanned Map"}
	}
};

org.OpenGeoPortal.InstitutionInfo.dataTypes = {	dataTypeArray : [{"DisplayName":"Point", "value": "point"}, 
                                               	                 {"DisplayName":"Line", "value": "line"},
                                            	                 {"DisplayName":"Polygon", "value": "polygon"}, 
                                            	                 {"DisplayName":"Raster", "value": "raster"},
                                            	                 {"DisplayName":"Scanned Map", "value": "paper map"}]};