/**
 * pulls info from ogpConfig.json for the client to use
 * 
 * */

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
				  "Point": {"source": org.OpenGeoPortal.InstitutionInfo.imagePath + "type_dot.png", "displayName":"point"},
				  "Line": {"source": org.OpenGeoPortal.InstitutionInfo.imagePath + "type_arc.png", "displayName":"line"},
				  "Polygon": {"source": org.OpenGeoPortal.InstitutionInfo.imagePath + "type_polygon.png", "displayName":"polygon"},
				  "Raster": {"source":  org.OpenGeoPortal.InstitutionInfo.imagePath + "type_raster.png", "displayName":"raster"},
				  "PaperMap": {"source": org.OpenGeoPortal.InstitutionInfo.imagePath + "type_map.png", "displayName":"scanned map"}/*,
				  "LibraryRecord": {"source": org.OpenGeoPortal.InstitutionInfo.imagePath + "type_library.png", "displayName":"library record"}*/
	}
};


org.OpenGeoPortal.InstitutionInfo.dataTypes = {	dataTypeArray : [{"DisplayName":"Point", "value": "point"}, 
                                               	                 {"DisplayName":"Line", "value": "line"},
                                            	                 {"DisplayName":"Polygon", "value": "polygon"}, 
                                            	                 {"DisplayName":"Raster", "value": "raster"},
                                            	                 {"DisplayName":"Scanned Map", "value": "paper map"}]};