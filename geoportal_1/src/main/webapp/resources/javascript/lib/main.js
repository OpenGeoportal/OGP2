/* This javascript module creates all the global objects, namespaces them
 * 
 * author: Chris Barnett
 * 
 */



	

if (typeof OpenGeoportal == 'undefined'){
	OpenGeoportal = {};
} else if (typeof OpenGeoportal != "object"){
    throw new Error("OpenGeoportal already exists and is not an object");
}

OpenGeoportal.init = function(){
	//OpenGeoportal.Config.getInstitutionInfo();

	//TODO: this should move to server side "include"
	//document.title = "GeoData@" + OpenGeoportal.InstitutionInfo.getHomeInstitution();

	//we do this here so that we can try to get the css before the document is ready (should we do this in the jsp instead?)
	//var url = OpenGeoportal.InstitutionInfo.getCustomCss();

	/*if (document.createStyleSheet){
		document.createStyleSheet(url);
	} else {
		jQuery('<link rel="stylesheet" type="text/css" href="' + url + '" />').appendTo('head'); 
	}*/
};
//OpenGeoportal.init();

jQuery(document).ready(function (){
	if ( !Object.create ) {
	    Object.create = function ( o ) {
	        function F() {}
	        F.prototype = o;
	        return new F();
	    };
	}
	
	//TODO: this should move to server side "include"
	/*var javaScriptFileName = OpenGeoportal.InstitutionInfo.getCustomJavaScript();
	if (javaScriptFileName.length > 0){
		jQuery.getScript(javaScriptFileName);
	}*/
	
	//ogp will hold instances
	OpenGeoportal.ogp = {};
	var ogp = OpenGeoportal.ogp;	//an alias
	
	ogp.appState = new OpenGeoportal.Models.OgpSettings();
	ogp.appState.set({controls: new OpenGeoportal.CommonControls()});

	ogp.ui = new OpenGeoportal.UserInterface();
	ogp.ui.init();
	
	ogp.map = new OpenGeoportal.MapController();
	ogp.map.createMap("map");	//create map could return a promise that is fullfilled when the map is loaded
	
	ogp.cartView = new OpenGeoportal.Views.Cart({collection: ogp.appState.get("cart"), el: $("#cart")});	

	//these loads could/should be deferred	
	//needs to wait for ogpConfig fetch
	ogp.results = new OpenGeoportal.ResultCollection();
	ogp.resultsTableObj = new OpenGeoportal.SearchResultsTable();
	
	ogp.resultsTableObj.initTable("searchResults");
	
	//wait to do this until the google map is ready
	var hasSharedLayers = ogp.cartView.cartTableObj.addSharedLayersToCart();
	
	ogp.ui.introFlow(hasSharedLayers);
	
	/*downtime notice */
	//ogp.ui.showDowntimeNotice();
});


  