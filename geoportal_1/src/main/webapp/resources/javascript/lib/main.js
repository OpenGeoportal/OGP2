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

if ( !Object.create ) {
    Object.create = function ( o ) {
        function F() {}
        F.prototype = o;
        return new F();
        };
}
	
jQuery(document).ready(function (){
	
	//ogp will hold instances
	OpenGeoportal.ogp = {};
	var ogp = OpenGeoportal.ogp;	//an alias
	
	ogp.appState = new OpenGeoportal.Models.OgpSettings();
	ogp.appState.set({controls: new OpenGeoportal.CommonControls()});

	ogp.ui = new OpenGeoportal.UserInterface();
	ogp.ui.init();
	
	ogp.map = new OpenGeoportal.MapController();
	ogp.map.createMap("map");	
	
	ogp.cartView = new OpenGeoportal.Views.Cart({collection: ogp.appState.get("cart"), el: $("#cart")});	


	
	jQuery(document).on("mapReady",	function(){
		//console.log("mapready");
			//wait to do this until the google map is ready
			//createMap could instead return a promise that is fullfilled when the map is loaded
				//these loads could/should be deferred	
		//needs to wait for ogpConfig fetch
		ogp.results = new OpenGeoportal.ResultCollection();
		ogp.resultsTableObj = new OpenGeoportal.SearchResultsTable();
		ogp.resultsTableObj.initTable("searchResults");
		var hasSharedLayers = ogp.cartView.cartTableObj.addSharedLayersToCart();
		ogp.ui.introFlow(hasSharedLayers);
		});
	
	/*downtime notice */
	//ogp.ui.showDowntimeNotice();
});


  