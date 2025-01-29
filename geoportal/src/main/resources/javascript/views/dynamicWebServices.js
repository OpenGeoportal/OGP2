if (typeof OpenGeoportal === 'undefined') {
	OpenGeoportal = {};
} else if (typeof OpenGeoportal !== "object") {
	throw new Error("OpenGeoportal already exists and is not an object");
}

if (typeof OpenGeoportal.Views === 'undefined') {
	OpenGeoportal.Views = {};
} else if (typeof OpenGeoportal.Views !== "object") {
	throw new Error("OpenGeoportal.Views already exists and is not an object");
}

/**
 * A Backbone View of the Cart Collection. The WebServices view handles the web services dialog and constructs
 * urls that point to web service endpoints. If the user requests a WMC, it forms the request and passes it to the
 * request queue. It extends CartActionView.
 *
 * @extends OpenGeoportal.Views.CartActionView
 */
OpenGeoportal.Views.WebServices = OpenGeoportal.Views.CartActionView
		.extend({
			cartFilter : function(model) {
				var wsAvailable = false;
				var attr = "dynamicWebService";
				if (model.has(attr) && model.get("isChecked")) {
					if (model.get(attr).length > 0) {
						wsAvailable = true;
					}
				}
				return wsAvailable;
			},

			initView: function(){
				//assign attributes;  filter relies on attributes set, so do this first

				var that = this;
				this.collection.each( function(model){
					that.setDynamicWebServiceAttributes(model);
				});
			},

			cartAction : function() {

				
				var arrModels = this.getApplicableLayers();
				var dialogContent = "";

				if (_.isEmpty(arrModels)) {
					dialogContent = 'No layers have been selected.';
				} else {
					dialogContent = this.generateContent(arrModels);
				}

				this.createDialog(dialogContent);
				
			},

			webserviceKeys : [ "wms", "wfs", "wcs" ],

			setDynamicWebServiceAttributes : function(model) {
				// public with wms, wfs, or wcs endpoints
				if (model.isPublic()) {
					var arrTypes = [];
					var arrProtocols = this.webserviceKeys;
					for ( var i in arrProtocols) {
						var ogcProtocol = arrProtocols[i];
						if (model.hasOGCEndpoint(ogcProtocol)) {
							arrTypes.push(ogcProtocol);
						}
					}
					var attr = {};

					attr = {
						dynamicWebService : arrTypes
					};
					model.set(attr);
				}

			},
			
			getWfsUrl: function(arrIds){
				var path = top.location.href.substring(0, top.location.href.lastIndexOf("/"));
				path += "/dynamic/wfs?ogpids=" + arrIds.join() + "&request=GetCapabilities";
				return path;
			},
		
			getWmsUrl: function(arrIds){
				var path = top.location.href.substring(0, top.location.href.lastIndexOf("/"));
				path += "/dynamic/wms?ogpids=" + arrIds.join() + "&request=GetCapabilities";
				return path;
			},
			
			generateWmc: function(arrIds, protocolPref, bbox){
				var wmcSource = "wmc?ogpids=" + arrIds.join();
				wmcSource += "&type=" + protocolPref;
				wmcSource += "&minx=" + bbox.left + "&miny=" + bbox.bottom + "&maxx=" + bbox.right + "&maxy=" + bbox.top;
				OpenGeoportal.ogp.widgets.iframeDownload("wmcDownloadIframe", wmcSource);
			},
			
			generateContent : function(arrModels) {

				var wmsMap = {};
				var wfsMap = {};
				var wcsMap = {};

				_.each(arrModels, function(model) {
					_.each(model.get("dynamicWebService"), function(ogctype){
						var layerId = model.get("LayerId");
						var location = model.get("Location");
						if (ogctype === "wms"){
							var wmsurl = OpenGeoportal.Utility.getLocationValue(location, ['wms']);
							if (_.has(wmsMap, wmsurl)){
								wmsMap[wmsurl].push(layerId);
							} else {
								wmsMap[wmsurl] = [layerId];
							}

						} else if (ogctype === "wfs"){
							var wfsurl = OpenGeoportal.Utility.getLocationValue(location, ['wfs']);
							if (_.has(wfsMap, wfsurl)){
								wfsMap[wfsurl].push(layerId);
							} else {
								wfsMap[wfsurl] = [layerId];
							}
						} else if (ogctype === "wcs"){
							var wcsurl = OpenGeoportal.Utility.getLocationValue(location, ['wcs']);
							if (_.has(wcsMap, wcsurl)){
								wcsMap[wcsurl].push(layerId);
							} else {
								wcsMap[wcsurl] = [layerId];
							}
						}
					});

				});

				var arrWfsUrls = [];
				var arrWmsUrls = [];
				var arrWcsUrls = [];

				_.each(Object.keys(wmsMap), function(key){
					arrWmsUrls.push({"url": key + "?SERVICE=WMS&VERSION=1.1.1&REQUEST=GetCapabilities", 'layerIds': wmsMap[key].join(', ')});
				});

				_.each(Object.keys(wfsMap), function(key){
					arrWfsUrls.push({"url": key + "?SERVICE=WFS&REQUEST=GetCapabilities", 'layerIds': wfsMap[key].join(', ')});
				});

				
				var serviceTypes = {webservices:[]};
				
				var wmcButtonId = "wmcGenerateButton";
				var wmcPreferenceId = "wmcPreferredType";
				var wmcService = {
	            	 title : "Web Map Context (WMC):",
	            	 caption : "OGC standard for sharing web services. Press the button to generate a WMC file.",
	            	 preferenceText: "Choose how the web service will be used: ",
                    preference: [{label: "Display", value: "display"}, {label: "Analysis", value: "data"}],
	            	 preferenceElId: wmcPreferenceId,
	            	 generateButtonId: wmcButtonId
	             };

				var that = this;
				//remove existing click handlers for the button
				jQuery(document).off("click", "#" + wmcButtonId);
					
				jQuery(document).on("click", "#" + wmcButtonId, function(){
					//generate and return the wmc
					//var bbox = jQuery("#" + bboxId).val();
					var bbox = new OpenLayers.Bounds(-180,-90,180,90);
					var pref = jQuery("#" + wmcPreferenceId).val();
					//use wms ids; server side will pick the appropriate service based on preference and availability
					var ids = Object.values(wmsMap).flat();
					that.generateWmc(ids, pref, bbox);
				});

                var ws = {dynamic: []};
				if (arrWfsUrls.length > 0) {
					//var wfsUrls = this.getWfsUrl(arrWfsUrls);

					var wfsService =		
						             {
						            	 urls : arrWfsUrls,
						            	 title : "Web Feature Service (WFS):",
						            	 caption : "Suitable for analysis. Creates a vector web service. Only available for vector data. Paste the selected link into your desktop mapping software."
						             };

                    ws.dynamic.push(wfsService);
				}
				
				if (arrWmsUrls.length > 0){
					//var wmsUrls = this.getWmsUrl(arrWmsUrls);

					var wmsService = 
						             {
						            	 urls : arrWmsUrls,
						            	 title : "Web Mapping Service (WMS):",
						            	 caption : "Suitable for base maps. Creates a raster web service for all your data. Vector data will be converted to raster format. Paste the selected link into your desktop mapping software."
						             };

                    ws.dynamic.push(wmsService);

                }
                var dialogContent = "";

                if (ws.dynamic.length > 0) {
					console.log(ws);
                    var content = this.template.get('dynamicWSDialog')(ws);
                    content += this.template.get('wmcDialog')(wmcService);
                    dialogContent = this.template.get('webServicesDialog')({content: content});
				} else {
					dialogContent = "No Web Services are available for the selected layers.";
				}

				return dialogContent;
			},

			createDialog : function(content) {
				var dialogId = "shareServicesDialog";
				var dialog$ = jQuery("#" + dialogId);

				if (dialog$.length === 0) {
                    var wrapper = this.template.get('genericDialogShell')({elId: dialogId});

					jQuery('#dialogs').append(wrapper);
					dialog$ = jQuery("#" + dialogId);
					var that = this;
					dialog$.dialog(
									{
										zIndex : 3000,
										autoOpen : false,
										height : 'auto',
										title : 'Web Services',
										width : 495,
                                        dragStart: function (event, ui) {
                                            $(document).trigger('eventMaskOn');
                                        },
                                        dragStop: function (event, ui) {
                                            $(document).trigger('eventMaskOff');

                                        },
                                        resizeStart: function (event, ui) {
                                            $(document).trigger('eventMaskOn');
                                        },
                                        resizeStop: function (event, ui) {
                                            $(document).trigger('eventMaskOff');
                                        },
										close: function( event, ui ) {
											//resolve the deferred object on dialog close
											//that.deferred.resolve();
										},
										buttons : {
											Close : function() {
												jQuery(this).dialog('close');
												jQuery("#optionDetails").html(
														"");
												jQuery(
														".downloadSelection, .downloadUnselection")
														.removeClass(
																"downloadSelection downloadUnselection");
											}
										}
									});
				}
				// replace dialog text/controls & open the instance of 'dialog'
				// that
				// already exists
				dialog$.html(content);
				dialog$.find(".button").button(); 	//instantiate any jquery ui buttons
				var that = this;
				jQuery(".shareServicesText").each(
						function() {
							jQuery(this).attr(
									"rows",
									OpenGeoportal.Utility
											.calculateTextAreaRows(jQuery(this)
													.text()));
						});

				dialog$.dialog('open');

				jQuery('.shareServicesText').bind("focus", function() {
					// Select input field contents
					this.select();
				});
				jQuery('.shareServicesText').first().focus();
			}

		});