/**
 * This javascript module creates all the global objects, namespaces them
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

                    //add support for csrf tokens in ajax requests via jQuery
                    var token = jQuery("meta[name='_csrf']").attr("content");
                    var header = jQuery("meta[name='_csrf_header']").attr("content");
                    jQuery(document).ajaxSend(function (e, xhr, options) {
                        xhr.setRequestHeader(header, token);
                    });

					// ogp will hold instances
					OpenGeoportal.ogp = {};
					var ogp = OpenGeoportal.ogp; // an alias

					ogp.widgets = new OpenGeoportal.Widgets();
					ogp.tableControls = new OpenGeoportal.TableItems();
					
					// holds and initializes app-wide settings
					ogp.appState = new OpenGeoportal.Models.OgpSettings({
						queryTerms : new OpenGeoportal.Models.QueryTerms(),
						previewed : new OpenGeoportal.PreviewedLayers(),
						cart : new OpenGeoportal.CartCollection(),
						layerState: new OpenGeoportal.TableRowSettings(),
						login : new OpenGeoportal.Views.Login({
							model : new OpenGeoportal.Models.User()
						}),		
						requestQueue: new OpenGeoportal.RequestQueue(),
						currentTab : 0
					});


                    ogp.indicator = new OpenGeoportal.Views.RequestQueueLoadIndicatorView({
                        collection: ogp.appState.get("requestQueue"),
                        template: OpenGeoportal.Template
                    });


					// handles behavior of "frame elements", like expansion of
					// advanced search area, left panel
					ogp.structure = new OpenGeoportal.Structure();
					ogp.structure.init();

                    try {
                        // create the map and handle map related functions
                        //the map needs a reference to the panel view for calculating extents, etc.
                        ogp.map = new OpenGeoportal.MapController(ogp.structure.panelView);
                        ogp.map.initMap("map");

                    } catch (e) {
                        console.log("problem creating the map...");
                        console.log(e);
                    }

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
										try{
											ogp.search = new OpenGeoportal.Views.Query({
												model : OpenGeoportal.ogp.appState.get("queryTerms"),
												el : "form#searchForm"
											});
											
											ogp.results = new OpenGeoportal.ResultsCollection();
										} catch (e){
											console.log(e);
										}

                                        $(".introMask").fadeOut('fast');

										// The search results table
										
										ogp.resultsTableObj = new OpenGeoportal.Views.SearchResultsTable(
												{
													collection: ogp.results,
													el: $("#searchResults")
													});
									

										// if the url is a share link, add the
										// shared layers to the cart
										var hasSharedLayers = ogp.cartView.addSharedLayers();

										// introFlow dictates behavior of info
										// bubbles, first search opens Search
										// Results, etc.
										ogp.structure.introFlow(hasSharedLayers);
									});

					/* downtime notice --does this still work? */
					// ogp.ui.showDowntimeNotice();
				});
