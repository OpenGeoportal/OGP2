/* This javascript module creates all the global objects, namespaces them
 * It is the main function of the OGP application
 * 
 * author: Chris Barnett
 * 
 */

if (typeof OpenGeoportal == 'undefined') {
	OpenGeoportal = {};
} else if (typeof OpenGeoportal != "object") {
	throw new Error("OpenGeoportal already exists and is not an object");
}

jQuery(document)
		.ready(
				function() {

					// ogp will hold instances
					OpenGeoportal.ogp = {};
					var ogp = OpenGeoportal.ogp; // an alias

					ogp.template = new OpenGeoportal.Template();
					ogp.controls = new OpenGeoportal.CommonControls();
					ogp.controls.setTemplate(ogp.template);
					
					// holds and initializes app-wide settings
					ogp.appState = new OpenGeoportal.Models.OgpSettings({
						queryTerms : new OpenGeoportal.Models.QueryTerms(),
						previewed : new OpenGeoportal.PreviewedLayers(),
						cart : new OpenGeoportal.CartCollection(),
						login : new OpenGeoportal.Views.Login({
							model : new OpenGeoportal.Models.User()
						}),		
						requestQueue: new OpenGeoportal.RequestQueue(),
						currentTab : 0
					});
					
				
					
					// handles behavior of "frame elements", like expansion of
					// advanced search area, left panel
					ogp.ui = new OpenGeoportal.UserInterface();
					ogp.ui.init();

					// create the map and handle map related functions
					ogp.map = new OpenGeoportal.MapController();
					ogp.map.initMap("map");

					// creating the cart
					new OpenGeoportal.Views.CartHeader({
						collection: ogp.appState.get("cart"),
						el: $("#cartHeader")
					});
					ogp.cartView = new OpenGeoportal.Views.CartTable({
						collection : ogp.appState.get("cart"),
						el : $("#cart")
					});

					jQuery(document)
							.on(
									"mapReady",
									function() {
										// wait to do this until the base map is
										// ready
										// (createMap could instead return a
										// promise that is fullfilled when the
										// map is loaded)

										// The collection that holds search
										// results
										ogp.results = new OpenGeoportal.ResultCollection();

										// The search results table
										ogp.resultsTableObj = new OpenGeoportal.SearchResultsTable();
										ogp.resultsTableObj
												.initTable("searchResults");

										// if the url is a share link, add the
										// shared layers to the cart
										var hasSharedLayers = ogp.cartView.addSharedLayers();

										// introFlow dictates behavior of info
										// bubbles, first search opens Search
										// Results, etc.
										ogp.ui.introFlow(hasSharedLayers);
									});

					/* downtime notice --does this still work? */
					// ogp.ui.showDowntimeNotice();
				});
