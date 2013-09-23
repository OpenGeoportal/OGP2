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
} else if (typeof OpenGeoportal.InstitutionInfo != "object"){
    throw new Error("OpenGeoportal.Models already exists and is not an object");
}
/*
OpenGeoportal.Models.AppConfig = Backbone.Model.extend({
	defaults: {
		sName: "expandControls", 
		sTitle: "", 
		bVisible: true, 
		aTargets: [ 1 ], 
		sClass: "colExpand", 
		sWidth: "10px", 
		bSortable: false,
		bUseRendered: false,
		fnRender: function(oObj){return thisObj.getExpandControl(oObj);}
	}
});
*/

//tackle this later....I want to revamp parts of how this works anyway
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
	var config = OpenGeoportal.InstitutionInfo.Config;

	for (var i in config){
		return;
	}

	var params = {
		url: "resources/ogpConfig.json",
		async: false,
		contentType: "text/json",
		dataType: "json",
		success: function(data){

			var config = data["config"];
			OpenGeoportal.InstitutionInfo.Search = config["search"];
			OpenGeoportal.InstitutionInfo.institutionSpecificCss = config["institutionSpecificCss"];
			OpenGeoportal.InstitutionInfo.institutionSpecificJavaScript = config["institutionSpecificJavaScript"];
			OpenGeoportal.InstitutionInfo.institutionSpecificGoogleAnalyticsId = config["googleAnalyticsId"];
			OpenGeoportal.InstitutionInfo.Config = config["institutions"];
			OpenGeoportal.InstitutionInfo.homeInstitution = config["homeInstitution"];
		},
		error: function(jqXHR, textStatus, errorThrown){
			alert(textStatus);
			alert(errorThrown);
			alert(jqXHR);
		}
	  };

	jQuery.ajax(params);
	
};


OpenGeoportal.InstitutionInfo.RepositoryCollection = Backbone.Collection.extend({
	idAttribute: "id",
	url: "resources/repositoryConfig.json"
});

//"value" should be the value in solr; uiClass determines what icon shows via css
OpenGeoportal.InstitutionInfo.Repositories = new OpenGeoportal.InstitutionInfo.RepositoryCollection();
OpenGeoportal.InstitutionInfo.Repositories.fetch();


OpenGeoportal.InstitutionInfo.DataTypeCollection = Backbone.Collection.extend({
});

//"value" should be the value in solr; uiClass determines what icon shows via css
OpenGeoportal.InstitutionInfo.DataTypes = new OpenGeoportal.InstitutionInfo.DataTypeCollection(
		[
		 {
			 value: "Point",
			 displayName: "Point",
			 uiClass: "pointIcon",
			 selected: true
		 },
		 {
			 value: "Line",
			 displayName: "Line",
			 uiClass: "lineIcon",
			 selected: true
		 },
		 {
			 value: "Polygon",
			 displayName: "Polygon",
			 uiClass: "polygonIcon",
			 selected: true
		 },
		 {
			 value: "Raster",
			 displayName: "Raster",
			 uiClass: "rasterIcon",
			 selected: true
		 },
		 {
			 value: "Paper+Map",
			 displayName: "Scanned Map",
			 uiClass: "mapIcon",
			 selected: true
		 }
		 ]
);
