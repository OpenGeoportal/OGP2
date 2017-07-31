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
 * A Backbone View of the Cart Collection
 * 
 * @constructor
 */

/**
 * a backing model for setting download preferences
 */
OpenGeoportal.Models.DownloadPreferences = Backbone.Model.extend({
	defaults : {
		availableFormats : {
			vectorFormats : [ {
				formatType : "shp",
				formatDisplay : "ShapeFile (or native)"
			}, {
				formatType : "kmz",
				formatDisplay : "KMZ (KML)"
			} ],

			rasterFormats : [ {
				formatType : "geotiff",
				formatDisplay : "GeoTIFF (or native)"
			}, {
				formatType : "kmz",
				formatDisplay : "KMZ (KML)"
			} ]
		},
		vectorChoice : "",
		rasterChoice : "",
		isClipped : true
	}
});


OpenGeoportal.Views.Download = OpenGeoportal.Views.CartActionView
		.extend({


			downloadKeys : [ "wfs", "wcs", "wms", "filedownload", "download" ],

			isDownloadAvailable : function(model) {
				var isAvailable = model.isPublic();

				// check permissions
				if (!isAvailable) {
					isAvailable = OpenGeoportal.ogp.appState.get("login").model
							.hasAccess(model);
				}

				// short-circuit for no permission
				if (isAvailable) {

					// check that an appropriate url is available
					isAvailable = OpenGeoportal.Utility.hasLocationValueIgnoreCase(model
							.get("Location"), this.downloadKeys);
				}
				return isAvailable;

			},
			cartFilter : function(model) {
				// what values do we need to attempt a download?
				return this.isDownloadAvailable(model) && model.get("isChecked");
			},
			
			cartAction : function() {
				
				var sortedLayers = this.sortLayersByDownloadType();

				var hasServerLayers = _.has(sortedLayers, "ogpServer") && sortedLayers.ogpServer.length > 0;

				if (hasServerLayers) {
					// get user input and form a request to send to the ogp
					// server
					this.downloadRequest = new OpenGeoportal.Models.DownloadRequest();
					this.downloadRequest.set({
						layers : sortedLayers.ogpServer
					});
					this.preferences = new OpenGeoportal.Models.DownloadPreferences();
					var that = this;
					this.setPreferences().then(this.finalizeRequest,
							this.failHandler1).then(this.sendDownloadRequest,
							this.failHandler2);

				} 
			
				var hasClientLayers = _.has(sortedLayers, "ogpClient") && sortedLayers.ogpClient.length > 0;
				if (hasClientLayers) {
					// handle the downloads from the client
					this.clientSideDownload(sortedLayers.ogpClient);

				} 
				
				if (!hasServerLayers && !hasClientLayers)  {
					if (this.collection.length === 0){
					} else {
						throw new Error("No valid layers in the cart collection!");
					}
				} 

				//return this.deferred.promise();
			},

			
			failHandler1 : function() {
				alert("finalize request failed");
			},
			failHandler2 : function() {
				alert("sendDownloadRequest failed");
			},
			clientSideDownload : function(arrModels) {
				throw new Error("clientSideDownload needs to be implemented.");
				// you'll also have to specify which location elements indicate
				// a layer that should use client side download in
				// OpenGeoportal.Models.CartLayer:setDownloadAttributes
			},
			
			setDownloadAttributes : function(model) {
				// either a download type that can be handled by OGP backend or
				// something else, like an external link (fileDownload). Alternatively,
				// no download is available for the resource. Ultimately, to determine
				// if the download can be handled by the backend, a request should be
				// made to the backend.

				var locationObj = model.get("Location");
				var locationKey = "";
				var availableFormats = [];
				var downloadType = "ogpServer";

				/*
				 * if (OpenGeoportal.Utility.hasLocationValueIgnoreCase(locationObj, [
				 * "externalUrl" ])) { downloadType = "ogpClient"; } else {
				 */
				if (OpenGeoportal.Utility.hasLocationValueIgnoreCase(locationObj,
						[ "wfs" ])) {
					availableFormats.push("shapefile");
				}

				if (OpenGeoportal.Utility.hasLocationValueIgnoreCase(locationObj,
						[ "wms" ])) {
					availableFormats.push("kmz");
				}

				if (OpenGeoportal.Utility.hasLocationValueIgnoreCase(locationObj,
						[ "wcs" ])) {
					availableFormats.push("geotiff");
				}
				/* } */

				model.set({
					downloadType : downloadType,
					downloadFormats : availableFormats
				});

			},
			sortLayersByDownloadType : function() {
				// sort layers depending on whether the server or client will
				// handle the request
				var layers = this.getApplicableLayers();
				//assign attributes
				var that = this;
				_.each(layers, function(model){
					that.setDownloadAttributes(model);
				});
				
				var sortedLayers = {};
				_.each(layers, function(model) {
					var dlType = model.get("downloadType");
					if (!_.has(sortedLayers, dlType)) {
						sortedLayers[dlType] = [];
					}
					sortedLayers[dlType].push(model);

				});
				return sortedLayers;
			},

			/**
			 * set download preferences -- step 1
			 */
			getPreferencesSelectionContent : function() {
				var arrModels = this.downloadRequest.get("layers");
				var formats = this.preferences.get("availableFormats");
				var that = this;

				if (_.isEmpty(arrModels)) {
					return 'No layers have been selected.';
				}
				// this needs to be improved, but there's a few things to decide
				// first. For now, just do what we've been doing
				var showVectorControl = false;
				var showRasterControl = false;

				_.each(arrModels, function(model) {
					showVectorControl = showVectorControl || model.isVector();
					showRasterControl = showRasterControl || model.isRaster();
				});

				var html = "<span>Select format for:</span><br />";
				var vectorControlId = "vectorControl";
				var rasterControlId = "rasterControl";

				if (showVectorControl) {
					html += this.template.formatSelectionControl({
						controlId : vectorControlId,
						controlClass : "downloadSelect",
						controlLabel : "Vector files",
						formats : formats.vectorFormats
					});

					// set a default
					var defaultFormat = formats.vectorFormats[0].formatType;
					this.preferences.set({
						vectorChoice : defaultFormat
					});

					// update the preferences model when the ui element changes
					jQuery(document).on("change", "#" + vectorControlId,
							function() {
								var uiValue = jQuery(this).val();
								that.preferences.set({
									vectorChoice : uiValue
								});

							});
				}

				if (showRasterControl) {
					html += this.template.formatSelectionControl({
						controlId : rasterControlId,
						controlClass : "downloadSelect",
						controlLabel : "Raster files",
						formats : formats.rasterFormats
					});

					// set a default
					var defaultFormat = formats.rasterFormats[0].formatType;
					this.preferences.set({
						rasterChoice : defaultFormat
					});
					// update the preferences model when the ui element changes
					jQuery(document).on("change", "#" + rasterControlId,
							function() {
								var uiValue = jQuery(this).val();
								that.preferences.set({
									rasterChoice : uiValue
								});

							});
				}

				if (html.length === 0) {
					// there are models that register as being downloadable, but
					// are neither vector nor raster
					html = "The selected layers have an invalid data type and can not be downloaded.";

				} else {
					// create the clip control
					var clipControlId = "downloadClipControl";
					html += this.template.clipControl({
						elId : clipControlId,
						isClipped : this.preferences.get("isClipped")
					});

					// update the preferences model when the ui element changes

					jQuery(document).on("change", "#" + clipControlId,
							function() {
								that.preferences.set({
									isClipped : jQuery(this).is(":checked")
								});
							});
				}

				return html;
			},

			setPreferences : function() {
				var setPreferencesDeferred = jQuery.Deferred();
				var dialogContent = this.getPreferencesSelectionContent();

				var dialogDonePromise = this
						.openPreferencesDialog(dialogContent);

				var that = this;
				// clicking the continue button resolves the dialogPromise
				dialogDonePromise.done(function() {
					// now that we're done with this dialog, update the model
					// with user specified preferences and resolve the
					// setPreferences deferred obj
					try {
						that.updateModelsWithPreferences();
						setPreferencesDeferred.resolveWith(that);
					} catch (e) {
						setPreferencesDeferred.rejectWith(that);
					}
				});

				return setPreferencesDeferred.promise();

			},

			openPreferencesDialog : function(dialogContent) {
				var deferred = jQuery.Deferred();
				var params = {
					zIndex : 3000,
					autoOpen : false,
					minHeight : '30px',
					width : 300,
					title : "Download Settings",
					resizable : false,
					modal : true,
					show : "fade",
					hide : "fade"
				};

				var dialogId = "downloadSettingsDialog";
				if (jQuery('#' + dialogId).length === 0) {
					var downloadDiv = this.template.genericDialogShell({
						elId : dialogId
					});
					jQuery('#dialogs').append(downloadDiv);
				}
				var dialog$ = jQuery("#" + dialogId);
				dialog$.html(dialogContent);
				dialog$.addClass("downloadDialog");
				dialog$.dialog(params);
				dialog$.dialog("option", "disabled", false);

				var buttons;
				var cancelFunction = function() {
					jQuery(this).dialog('close');
					jQuery("#optionDetails").html("");
					jQuery(".downloadSelection, .downloadUnselection")
							.removeClass(
									"downloadSelection downloadUnselection");
					deferred.reject();
				};

				if (this.downloadRequest.get("layers").length === 0) {
					buttons = {
						Cancel : cancelFunction
					};
				} else {
					buttons = {
						Cancel : cancelFunction,
						Continue : function() {
							// update the models with the selected formats,
							// then resolve the promise returned by this dialog
							// function
							jQuery(this).dialog('close');
							deferred.resolve();
						}

					};
				}

				dialog$.dialog("option", "buttons", buttons);
				dialog$.dialog('open');

				return deferred.promise();
			},

			updateModelsWithPreferences : function() {
				var vectorChoice = "";
				if (this.preferences.has("vectorChoice")) {
					vectorChoice = this.preferences.get("vectorChoice");
				}

				var rasterChoice = "";
				if (this.preferences.has("rasterChoice")) {
					rasterChoice = this.preferences.get("rasterChoice");
				}

				var arrLayers = this.downloadRequest.get("layers");
				_.each(arrLayers, function(model) {
					if (model.isVector()) {
						// set the request format for the layer to the vector
						// value
						model.set({
							requestedFormat : vectorChoice
						});
					} else if (model.isRaster()) {
						// set the request format for the layer to the raster
						// value
						model.set({
							requestedFormat : rasterChoice
						});
					}
				});

				// set the bounds on the request object if "clipped" is checked
				if (this.preferences.get("isClipped")) {
					// set bounds in the downloadRequest model
					var extent = OpenGeoportal.ogp.map.getBounds();
					this.downloadRequest.set({
						bbox : extent
					});
				}
				//console.log("models updated with preferences");
			},

			/**
			 * Continue download -- step 2
			 */

			finalizeRequest : function() {
				var finalizeRequestDeferred = jQuery.Deferred();
				var dialogDonePromise = this.openFinalizeRequestDialog();

				var that = this;
				// clicking the continue button resolves the dialogPromise
				dialogDonePromise.done(function() {
					// now that we're done with this dialog, update the model
					// with user specified preferences and resolve the
					// setPreferences deferred obj
					try {
						that.updateRequestFromFinalize();
						finalizeRequestDeferred.resolveWith(that, arguments);
					} catch (e) {
						finalizeRequestDeferred.rejectWith(that, arguments);
					}

				});

				return finalizeRequestDeferred.promise();
			},

			shouldUseHGLOpenDelivery : function(model, format) {
				var bool1 = model.get("Institution").toLowerCase() === "harvard";
				var bool2 = model.isRaster();
				var bool3 = OpenGeoportal.Utility.arrayContainsIgnoreCase(["geotiff"], model.get("requestedFormat"));
				return bool1 && bool2 && bool3;
			},
			/* emailKeys : [ "emailUrl" ], */
			requiresEmailAddress : function(model, format) {
				/*
				 * var useEmail = OpenGeoportal.Utility
				 * .hasLocationValueIgnoreCase( model.get("Location"),
				 * this.emailKeys);
				 */
				// there should be a more generalized way to do this, rather
				// than specifying "Harvard"
				// "download": "http://hgl.harvard.edu:8080/HGL/HGLOpenDelivery"
				// unfortunately, Harvard records don't always specify
				// HGLOpenDelivery. until we can fix this, this will have to be
				// a one-off
				return this.shouldUseHGLOpenDelivery(model, format);
			},

			getEmailAddressElement : function() {
				var arrModels = this.downloadRequest.get("layers");

				var template = "";
				var that = this;
				var required = false;
				_.each(arrModels, function(model) {
					var format = model.get("requestedFormat");
					var currentRequired = that.requiresEmailAddress(model, format);
					required = required || currentRequired;
					model.set({requiresEmail: currentRequired});
				});

				if (required) {

					template = this.template.requireEmailAddress();
				}

				return template;
			},

			getLayerDownloadNotice : function() {
				var arrModels = this.downloadRequest.get("layers");

				var template = "";

				var downloadCount = 0;
				var emailCount = 0;
				var that = this;
				_.each(arrModels, function(model) {
					var format = model.get("requestedFormat");
					if (that.requiresEmailAddress(model, format)) {
						emailCount++;
					} else {
						downloadCount++;
					}
				});

				var total = emailCount + downloadCount;
				var plural = (total > 1);

				template = this.template.layerDownloadNotice({
					emailCount : emailCount,
					downloadCount : downloadCount,
					total : total,
					plural : plural
				});

				return template;
			},

			openFinalizeRequestDialog : function() {
				var deferred = jQuery.Deferred();

				var dialogId = "downloadFinalizeDialog";
				if (jQuery('#' + dialogId).length === 0) {
					var downloadDiv = this.template.genericDialogShell({
						elId : dialogId
					});
					jQuery('#dialogs').append(downloadDiv);
				}

				var dialogContent = this.getFinalizeRequestDialogContent();
				var dialog$ = jQuery("#" + dialogId);
				dialog$.html(dialogContent);
				dialog$.addClass("downloadDialog");
				
				var that = this;
				var cancelFunction = function() {
					jQuery(this).dialog('close');
					jQuery("#optionDetails").html("");
					jQuery(".downloadSelection, .downloadUnselection")
							.removeClass("downloadSelection downloadUnselection");
					deferred.rejectWith(that);
				};

				var buttons = {
					Cancel : cancelFunction,
					Download : function() {
						// update the models with the selected formats,
						// then resolve the promise returned by this dialog
						// function
						deferred.resolveWith(that, [ dialog$ ]);	
					}
				};

				var params = {
					title : "Download",
					width : 350,
					show : "fade",
					hide : "fade",
					modal : true,
					buttons : buttons
				};

				dialog$.dialog(params);

				dialog$.dialog('open');

				// set the focus
				var email$ = jQuery("#emailAddress");
				if (email$.length > 0) {
					email$.focus();
				} else {
					dialog$.siblings(".ui-dialog-buttonpane").find(
							".ui-dialog-buttonset > button").last().focus();
				}

				// make sure this dialog closes if there is an error
				deferred.fail(function() {

					dialog$.dialog("close");
				});

				return deferred.promise();
			},

			showTransferAnimation : function(dialog$) {
				// when the download button is pushed, run an animation, close
				// the dialog
				var options = {
					to : "#requestTickerContainer"
				};
				dialog$.parent().delay().effect("transfer", options, 500, function() {
					dialog$.dialog('close');
				});

			},
			getFinalizeRequestDialogContent : function() {
				var downloadContinue = this.getLayerDownloadNotice();
				downloadContinue += this.getEmailAddressElement();

				return downloadContinue;
			},
			
			updateRequestFromFinalize : function() {
				// validate the email address
				var email$ = jQuery("#emailAddress");
				if (email$.length > 0) {
					var emailAddress = email$.val().trim();
					this.downloadRequest.set({
						email : emailAddress
					}, {
						validate : true
					});
				}
			},

			sendDownloadRequest : function($dialog) {
				//split into 2 requests if there are email requests
				var layers = this.downloadRequest.get("layers");
				var emailLayers = [];
				var dlLayers = [];
				var requestQ = OpenGeoportal.ogp.appState.get("requestQueue");
				
				_.each(layers, function(model){
					if (model.has("requiresEmail") && model.get("requiresEmail")){
						emailLayers.push(model);
					} else {
						dlLayers.push(model);
					}
				});
				
				var that = this;
				jQuery(document).one("requestTickerRendered",
						function(){that.showTransferAnimation($dialog);});		
				
				if (emailLayers.length > 0){
					
					var emailRequest = this.downloadRequest.clone();
					emailRequest.set({layers: emailLayers});

					requestQ.add(emailRequest);
					
					if (dlLayers.length > 0){
						this.downloadRequest.set({layers: dlLayers});
						//console.log(this.downloadRequest);
						requestQ.add(this.downloadRequest.clone());

					}
				} else {
					requestQ.add(this.downloadRequest.clone());
				}
				//this.deferred.resolve();
			}

		});
