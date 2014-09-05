/**
 * pulls info from config controller for the client to use
 * 
 * */

// Repeat the creation and type-checking code for the next level
if (typeof OpenGeoportal === 'undefined') {
	OpenGeoportal = {};
} else if (typeof OpenGeoportal !== "object") {
	throw new Error("OpenGeoportal already exists and is not an object");
}

if (typeof OpenGeoportal.Config === 'undefined') {
	OpenGeoportal.Config = {};
} else if (typeof OpenGeoportal.Config !== "object") {
	throw new Error("OpenGeoportal.Config already exists and is not an object");
}

if (typeof OpenGeoportal.Models === 'undefined') {
	OpenGeoportal.Models = {};
} else if (typeof OpenGeoportal.Models !== "object") {
	throw new Error("OpenGeoportal.Models already exists and is not an object");
}

//{"searchUrl":"http://geodata.tufts.edu/solr/select","analyticsId":"UA-19787732-1","loginConfig":{"repositoryId":"tufts","type":"form","url":"login","secureDomain":"https://localhost:8443"}}
OpenGeoportal.Models.OgpConfig = Backbone.Model.extend({
	url : "config/general"
});

OpenGeoportal.Config.General = new OpenGeoportal.Models.OgpConfig();
OpenGeoportal.Config.General.set({
	searchUrl : OpenGeoportal.Config.searchUrl,
	analyticsId : OpenGeoportal.Config.analyticsId,
	loginConfig : {
		repositoryId : OpenGeoportal.Config.loginRepository,
		type : OpenGeoportal.Config.loginType,
		url : OpenGeoportal.Config.loginUrl,
		secureDomain : OpenGeoportal.Config.sd
	}
});

OpenGeoportal.Config.ProxyCollection = Backbone.Collection.extend({
	idAttribute : "repositoryId",
	url : "config/proxy"
});

//[{"repositoryId":"tufts","accessLevels":["restricted"],"serverMapping":[{"type":"wms","externalUrl":"restricted/wms"},{"type":"wfs","externalUrl":"restricted/wfs"},{"type":"wcs","externalUrl":"restricted/wcs"}]}]
OpenGeoportal.Config.Proxies = new OpenGeoportal.Config.ProxyCollection();
OpenGeoportal.Config.Proxies.fetch();

OpenGeoportal.Config.getWMSProxy = function(institution, accessLevel) {
	var proxyConfig = OpenGeoportal.Config.Proxies.findWhere({
		repositoryId : institution.toLowerCase()
	});
	if (typeof proxyConfig !== "undefined") {

		if (jQuery.inArray(accessLevel.toLowerCase(), proxyConfig
				.get("accessLevels")) > -1) {
			var serverMapping = proxyConfig.get("serverMapping");
			for ( var i in serverMapping) {
				if (serverMapping[i].type === "wms") {
					return serverMapping[i].externalUrl;
				}
			}
		}
	}

	return false;

};

OpenGeoportal.Config.RepositoryCollection = Backbone.Collection.extend({
	url : "config/repositories"
});

//"value" should be the value in solr; iconClass determines what icon shows via css
OpenGeoportal.Config.Repositories = new OpenGeoportal.Config.RepositoryCollection();
OpenGeoportal.Config.Repositories.fetch();

OpenGeoportal.Config.DataTypeCollection = Backbone.Collection.extend({});

//"value" should be the value in solr; uiClass determines what icon shows via css
//should get this from the server as well?
OpenGeoportal.Config.DataTypes = new OpenGeoportal.Config.DataTypeCollection([
		{
			value : "Point",
			displayName : "Point",
			uiClass : "pointIcon",
			selected : true
		}, {
			value : "Line",
			displayName : "Line",
			uiClass : "lineIcon",
			selected : true
		}, {
			value : "Polygon",
			displayName : "Polygon",
			uiClass : "polygonIcon",
			selected : true
		}, {
			value : "Raster",
			displayName : "Raster",
			uiClass : "rasterIcon",
			selected : true
		}, {
			value : "ScannedMap",
			displayName : "Scanned Map",
			uiClass : "mapIcon",
			selected : true
		}/*,
		{
			value: "Tabular",
			displayName: "Tabular Data",
			uiClass : "tabularIcon",
			selected: true
		},
		{
			value: "Document",
			displayName: "Document",
			uiClass : "documentIcon",
			selected: true
		}*/]);

//Do I even need to extend this?
OpenGeoportal.Config.TopicCollection = Backbone.Collection.extend({});
OpenGeoportal.Config.IsoTopics = new OpenGeoportal.Config.TopicCollection([ 
                                                                           {
                                                                        	   topic : "",
                                                                        	   label : "None",
                                                                        	   selected : true
                                                                           }, {
                                                                        	   topic : "farming",
                                                                        	   label : "Agriculture and Farming"
                                                                           }, {
                                                                        	   topic : "biota",
                                                                        	   label : "Biology and Ecology"
                                                                           }, {
                                                                        	   topic : "boundaries",
                                                                        	   label : "Administrative and Political Boundaries"
                                                                           }, {
                                                                        	   topic : "climatologyMeteorologyAtmosphere",
                                                                        	   label : "Atmospheric and Climatic"
                                                                           }, {
                                                                        	   topic : "economy",
                                                                        	   label : "Business and Economic"
                                                                           }, {
                                                                        	   topic : "elevation",
                                                                        	   label : "Elevation and Derived Products"
                                                                           }, {
                                                                        	   topic : "environment",
                                                                        	   label : "Environment and Conservation"
                                                                           }, {
                                                                        	   topic : "geoscientificinformation",
                                                                        	   label : "Geological and Geophysical"
                                                                           }, {
                                                                        	   topic : "health",
                                                                        	   label : "Human Health and Disease"
                                                                           }, {
                                                                        	   topic : "imageryBaseMapsEarthCover",
                                                                        	   label : "Imagery and Base Maps"
                                                                           }, {
                                                                        	   topic : "intelligenceMilitary",
                                                                        	   label : "Military"
                                                                           }, {
                                                                        	   topic : "inlandWaters",
                                                                        	   label : "Inland Water Resources"
                                                                           }, {
                                                                        	   topic : "location",
                                                                        	   label : "Locations and Geodetic Networks"
                                                                           }, {
                                                                        	   topic : "oceans",
                                                                        	   label : "Oceans and Estuaries"
                                                                           }, {
                                                                        	   topic : "planningCadastre",
                                                                        	   label : "Cadastral"
                                                                           }, {
                                                                        	   topic : "society",
                                                                        	   label : "Cultural, Society, and Demographics"
                                                                           }, {
                                                                        	   topic : "structure",
                                                                        	   label : "Facilities and Structure"
                                                                           }, {
                                                                        	   topic : "transportation",
                                                                        	   label : "Transportation Networks"
                                                                           }, {
                                                                        	   topic : "utilitiesCommunication",
                                                                        	   label : "Utilities and Communication"
                                                                           } ]);


