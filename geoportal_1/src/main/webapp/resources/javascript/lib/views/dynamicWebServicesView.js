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

			cartAction : function() {
				//assign attributes;  filter relies on attributes set, so do this first
				var that = this;
				this.collection.each( function(model){
					that.setDynamicWebServiceAttributes(model);
				});
				
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
			generateContent : function(arrModels) {
				// TODO: translate to template; generate from

				var arrIds = [];
				_.each(arrModels, function(model) {
					arrIds.push(model.get("LayerId"));
				});

				var dialogContent = "";
				var serviceTypes = [
						{
							url : "dynamic/wfs",
							title : "Web Feature Service (WFS):",
							caption : "Creates a vector web service. Only available for vector data."
						},
						{
							url : "dynamic/wms",
							title : "Web Mapping Service (WMS):",
							caption : "Creates a raster web service for all your data. Vector data will be converted to raster format."
						} ];// WCS later?
				var path = top.location.href.substring(0, top.location.href
						.lastIndexOf("/"));
				dialogContent += '<p>Web Services are provided in two formats. Paste the selected link into your desktop mapping software.</p>';
				dialogContent += '<div id="owsServicesArea">\n';
				var i = null;
				for (i in serviceTypes) {
					dialogContent += '<span class="sub_headerTitle">'
							+ serviceTypes[i].title
							+ '</span><a href="#">?</a>';
					dialogContent += '<br/><span>' + serviceTypes[i].caption
							+ '</span>';
					dialogContent += '<div class="owsServicesLinkContainer">';
					var dynamicCapabilitiesRequest = path + "/"
							+ serviceTypes[i].url + "?ogpids=" + arrIds.join()
							+ "&request=GetCapabilities";
					dialogContent += '<textarea class="shareServicesText linkText" >'
							+ dynamicCapabilitiesRequest
							+ '</textarea> <br />\n';
					dialogContent += '</div><br/>';
				}

				dialogContent += '</div>';

				return dialogContent;
			},

			createDialog : function(content) {
				if (typeof jQuery('#shareDialog')[0] === 'undefined') {
					var shareDiv = '<div id="shareServicesDialog" class="dialog"> \n';
					shareDiv += '</div> \n';
					jQuery('#dialogs').append(shareDiv);
					jQuery("#shareServicesDialog")
							.dialog(
									{
										zIndex : 3000,
										autoOpen : false,
										height : 'auto',
										title : 'Web Services',
										width : 495,
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
				jQuery("#shareServicesDialog").html(content);
				var that = this;
				jQuery(".shareServicesText").each(
						function() {
							jQuery(this).attr(
									"rows",
									OpenGeoportal.Utility
											.calculateTextAreaRows(jQuery(this)
													.text()));
						});

				jQuery("#shareServicesDialog").dialog('open');

				jQuery('.shareServicesText').bind("focus", function() {
					// Select input field contents
					this.select();
				});
				jQuery('.shareServicesText').first().focus();
			}

		});