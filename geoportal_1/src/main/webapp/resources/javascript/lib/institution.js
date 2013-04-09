/**
 * pulls info from ogpConfig.json for the client to use
 * 
 * */

// Repeat the creation and type-checking code for the next level
if (typeof OpenGeoportal == 'undefined'){
	OpenGeoportal = {};
} else if (typeof OpenGeoportal != "object"){
    throw new Error("OpenGeoportal already exists and is not an object");
}

if (typeof OpenGeoportal.InstitutionInfo == 'undefined'){
	OpenGeoportal.InstitutionInfo = {};
} else if (typeof OpenGeoportal.InstitutionInfo !== "object"){
    throw new Error("OpenGeoportal.InstitutionInfo already exists and is not an object");
}

OpenGeoportal.InstitutionInfo.Config = {};
OpenGeoportal.InstitutionInfo.Search = {};
OpenGeoportal.InstitutionInfo.homeInstitution = "";
OpenGeoportal.InstitutionInfo.institutionSpecificCss = "";
OpenGeoportal.InstitutionInfo.institutionSpecificJavaScript = "";
OpenGeoportal.InstitutionInfo.institutionSpecificGoogleAnalyticsId = "";

OpenGeoportal.InstitutionInfo.getHomeInstitution = function(){	
	var institution = OpenGeoportal.InstitutionInfo.homeInstitution;
	//return homeInstitution if it is not empty
	if (institution.length > 0){
		return institution;
	} else {
		OpenGeoportal.InstitutionInfo.requestInfo();
		return OpenGeoportal.InstitutionInfo.homeInstitution;
	}
};


OpenGeoportal.InstitutionInfo.getCustomCss = function(){	
	var institution = OpenGeoportal.InstitutionInfo.institutionSpecificCss;
	//return institutionSpecificCss if it is not empty
	if (institution.length > 0){
		return institution;
	} else {
		OpenGeoportal.InstitutionInfo.requestInfo();
		return OpenGeoportal.InstitutionInfo.institutionSpecificCss;
	}
};

OpenGeoportal.InstitutionInfo.getCustomJavaScript = function(){	
	var javaScriptFileName = OpenGeoportal.InstitutionInfo.institutionSpecificJavaScript;
	return javaScriptFileName;
};

OpenGeoportal.InstitutionInfo.getGoogleAnalyticsId = function(){	
	var googleAnalyticsId = OpenGeoportal.InstitutionInfo.institutionSpecificGoogleAnalyticsId;
	return googleAnalyticsId;
};

OpenGeoportal.InstitutionInfo.getWMSProxy = function(institution, accessLevel) {
	var configObj = OpenGeoportal.InstitutionInfo.Config[institution];
	if (typeof configObj.proxy != "undefined"){
		if (jQuery.inArray(accessLevel.toLowerCase(), configObj.proxy.accessLevel) > -1){
			return configObj.proxy.wms;
		}
	} 
		
	return false;
	
};

OpenGeoportal.InstitutionInfo.getLoginType = function(institution){
	var info = OpenGeoportal.InstitutionInfo.getInstitutionInfo();
	return info[institution]["login"]["loginType"];
};

OpenGeoportal.InstitutionInfo.getAuthenticationPage = function(institution){
	var info = OpenGeoportal.InstitutionInfo.getInstitutionInfo();
	return info[institution]["login"]["authenticationPage"];
};

OpenGeoportal.InstitutionInfo.getSearch = function(){	
	var search = OpenGeoportal.InstitutionInfo.Search;
	//return Search if it is not empty
	for (var i in search){
		return search;
	}

	OpenGeoportal.InstitutionInfo.requestInfo();
	return OpenGeoportal.InstitutionInfo.Search;
	
};

OpenGeoportal.InstitutionInfo.getInstitutionInfo = function(){
	var configObj = OpenGeoportal.InstitutionInfo.Config;
	//return the configObj if it is not empty
	for (var i in configObj){
		return configObj;
	}
	//otherwise, get set the configObj from the xml config file
	OpenGeoportal.InstitutionInfo.requestInfo();
	return OpenGeoportal.InstitutionInfo.Config;
};

OpenGeoportal.InstitutionInfo.requestInfo = function(){
	var params = {
		url: "resources/ogpConfig.json",
		async: false,
		contentType: "text/json",
		dataType: 'json',
		success: function(data){
			var institutions = data["config"]["institutions"];
			OpenGeoportal.InstitutionInfo.Search = data["config"]["search"];
			OpenGeoportal.InstitutionInfo.institutionSpecificCss = data["config"]["institutionSpecificCss"];
			OpenGeoportal.InstitutionInfo.institutionSpecificJavaScript = data["config"]["institutionSpecificJavaScript"];
			OpenGeoportal.InstitutionInfo.institutionSpecificGoogleAnalyticsId = data["config"]["googleAnalyticsId"];
			OpenGeoportal.InstitutionInfo.Config = institutions;
			OpenGeoportal.InstitutionInfo.homeInstitution = data["config"]["homeInstitution"];
		},
		error: function(jqXHR, textStatus, errorThrown){
			alert(textStatus);
			alert(errorThrown);
			alert(jqXHR);
		}
	  };
	jQuery.ajax(params);
};

OpenGeoportal.InstitutionInfo.getIcons = function(){
	var dataTypes = {"dataTypes": {
			  "Point": {"uiClass": "pointIcon", "displayName":"point"},
			  "Line": {"uiClass": "lineIcon", "displayName":"line"},
			  "Polygon": {"uiClass": "polygonIcon", "displayName":"polygon"},
			  "Raster": {"uiClass": "rasterIcon", "displayName":"raster"},
			  "PaperMap": {"uiClass": "mapIcon", "displayName":"scanned map"}/*,
			  "LibraryRecord": {"source": OpenGeoportal.InstitutionInfo.imagePath + "type_library.png", "displayName":"library record"}*/
			}
	};
	return dataTypes;
};

OpenGeoportal.InstitutionInfo.dataTypes = {	dataTypeArray : [{"DisplayName":"Point", "value": "point"}, 
                                               	                 {"DisplayName":"Line", "value": "line"},
                                            	                 {"DisplayName":"Polygon", "value": "polygon"}, 
                                            	                 {"DisplayName":"Raster", "value": "raster"},
                                            	                 {"DisplayName":"Scanned Map", "value": "paper map"}]};