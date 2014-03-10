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

OpenGeoportal.Models.DownloadRequest = OpenGeoportal.Models.QueueItem.extend({

	initialize : function() {
		this.set({
			type : "layer",
			bbox : {
				minx : -180,
				miny : -90,
				maxx : 180,
				maxy : 90
			}
		});
		this.listenTo(this, "invalid", function(model, error) {

			if (error === "email") {
				var errMessage = "You must provide a valid email address.";
				jQuery("#emailValidationError").html(errMessage);
			} else {
				console.log("validation error for property: " + error);
			}
		});
	},
	validate : function(attrs, options) {
		console.log("trying to validate" + attrs[0]);
		var emailAddressProperty = "email";
		var emailAddress = attrs[emailAddressProperty];

		if (emailAddress !== null
				&& !OpenGeoportal.Utility.checkAddress(emailAddress)) {
			return emailAddressProperty;
		}

	}
});

OpenGeoportal.Views.Download = OpenGeoportal.Views.CartActionView
		.extend({

			cartFilter : function(model) {
				return model.get("isChecked");
			},

			cartAction : function() {
				var sortedLayers = this.sortLayersByDownloadType();

				if (_.has(sortedLayers, "ogpServer")
						&& sortedLayers.ogpServer.length > 0) {
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

				} else if (_.has(sortedLayers, "ogpClient")
						&& sortedLayers.ogpClient.length > 0) {
					// handle the downloads from the client
					this.clientSideDownload(sortedLayers.ogpClient);

				} else {
					throw new Error("No valid layers in the cart collection!");
				}

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

			sortLayersByDownloadType : function() {
				// sort layers depending on whether the server or client will
				// handle the request
				var layers = this.getApplicableLayers();
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
								this.preferences.set({
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
					html += this.template.clipControl({
						id : "downloadClipControl",
						isClipped : this.preferences.get("isClipped")
					});

					// update the preferences model when the ui element changes

					jQuery(document).on("change", "#downloadClipControl",
							function() {
								this.preferences.set({
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
					console.log("dialogDonePromise is done");
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
						id : dialogId
					});
					jQuery('#dialogs').append(downloadDiv);
				}
				var dialog$ = jQuery("#" + dialogId);
				dialog$.html(dialogContent);

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
					var extent = OpenGeoportal.ogp.map.getGeodeticExtent();
					console.log(extent);
					this.downloadRequest.set({
						bbox : extent
					});
				}

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
				var bool = ((model.get("Institution").toLowerCase() === "harvard")
						&& model.isRaster() && (OpenGeoportal.Utility
						.arrayContainsIgnoreCase(formats, requestedFormat)));
				return bool;
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
					required = required
							|| that.requiresEmailAddress(model, format);
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
						id : dialogId
					});
					jQuery('#dialogs').append(downloadDiv);
				}

				var dialogContent = this.getFinalizeRequestDialogContent();
				var dialog$ = jQuery("#" + dialogId);
				dialog$.html(dialogContent);

				var that = this;
				var cancelFunction = function() {
					jQuery(this).dialog('close');
					jQuery("#optionDetails").html("");
					jQuery(".downloadSelection, .downloadUnselection")
							.removeClass(
									"downloadSelection downloadUnselection");
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
					to : "#requestTickerContainer",
					className : "ui-effects-transfer"
				};
				dialog$.parent().effect("transfer", options, 500, function() {
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

				OpenGeoportal.ogp.appState.get("requestQueue").addToQueue(
						this.downloadRequest);

				this.showTransferAnimation($dialog);
				// where should this go?
				// jQuery(".downloadSelection,
				// .downloadUnselection").removeClass("downloadSelection
				// downloadUnselection");

			}
		/*
		 * requestErrorMessage : function(errorMessageObj) {
		 * 
		 * var line = ""; var failedToDownload = null; for (failedToDownload in
		 * data.failed) { line += "<tr>"; // for (var infoElement in
		 * data.failed[failedToDownload]){ line += "<td>"; line += '<span
		 * class="ui-icon ui-icon-alert" style="float:left; margin:0 7px 20px
		 * 0;"></span>'; line += "</td>"; line += "<td>"; line +=
		 * data.failed[failedToDownload]["institution"]; line += "</td>"; line += "<td>";
		 * line += data.failed[failedToDownload]["title"]; line += "</td>";
		 * line += "<td>"; line += data.failed[failedToDownload]["layerId"];
		 * line += "</td>"; line += '<td><span class="warning">'; line +=
		 * data.failed[failedToDownload]["message"]; line += "</span></td>"; // }
		 * line += "</tr>"; } if (line.length > 0) { var message = '<table
		 * class="downloadStatus">'; message += line; message += "</table>";
		 * this.genericModalDialog(message, "Download Errors"); } },
		 */

		/*
		 * this.requestDownloadSuccess = function(data) { // this will simply be
		 * a request Id. add it to the request queue. //
		 * OpenGeoportal.org.downloadQueue.registerLayerRequest(data.requestId); //
		 * will also have status info for requested layers in this returned //
		 * object
		 * 
		 * var line = ""; for (var failedToDownload in data.failed){ line += "<tr>";
		 * //for (var infoElement in data.failed[failedToDownload]){ line += "<td>";
		 * line += '<span class="ui-icon ui-icon-alert" style="float:left;
		 * margin:0 7px 20px 0;"></span>'; line += "</td>"; line += "<td>";
		 * line += data.failed[failedToDownload]["institution"]; line += "</td>";
		 * line += "<td>"; line += data.failed[failedToDownload]["title"];
		 * line += "</td>"; line += "<td>"; line +=
		 * data.failed[failedToDownload]["layerId"]; line += "</td>"; line += '<td><span
		 * class="warning">'; line += data.failed[failedToDownload]["message"];
		 * line += "</span></td>"; //} line += "</tr>"; } if (line.length >
		 * 0){ var message = '<table class="downloadStatus">'; message += line;
		 * message += "</table>"; this.genericModalDialog(message, "DOWNLOAD
		 * ERRORS"); } if (data.succeeded.length > 0){ //check packageLink if
		 * (typeof data.packageLink != 'undefined'){ jQuery("body").append('<iframe
		 * style="display:none" src="' + data.packageLink + '"></iframe>'); }
		 * var line = ""; for (var successful in data.succeeded){ if
		 * (data.succeeded[successful].disposition == "LINK_EMAILED"){ line += "<tr>";
		 * line += "<td>"; line += data.succeeded[successful]["institution"];
		 * line += "</td>"; line += "<td>"; line +=
		 * data.succeeded[successful]["title"]; line += "</td>"; //line += "<td>";
		 * //line += data.succeeded[successful]["layerId"]; //line += "</td>";
		 * //line += "<td>"; //line += data.succeeded[successful]["message"];
		 * //line += "</td>"; line += "</tr>"; } }
		 * 
		 * if (line.length > 0){ var message = "<p>A link for the following
		 * layers was emailed to '" + requestObj.email + "'. "; message += '<span
		 * class="notice">It may take up to 10 minutes to receive the email.</span></p>';
		 * message += '<table class="downloadStatus">'; message += line;
		 * message += "</table>"; this.genericModalDialog(message, "LAYERS
		 * EMAILED"); } } };
		 */

		});