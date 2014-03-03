if (typeof OpenGeoportal === 'undefined') {
	OpenGeoportal = {};
} else if (typeof OpenGeoportal !== "object") {
	throw new Error("OpenGeoportal already exists and is not an object");
}

if (typeof OpenGeoportal.Models === 'undefined') {
	OpenGeoportal.Models = {};
} else if (typeof OpenGeoportal.Models !== "object") {
	throw new Error("OpenGeoportal.Models already exists and is not an object");
}

OpenGeoportal.Models.CartLayer = OpenGeoportal.Models.ProtocolAware.extend({

	defaults : {},
	downloadKeys : [ "wfs", "wcs", "wms", "filedownload", "download" ],
	webserviceKeys : [ "wms", "wfs", "wcs" ],

	isMapItAvailable : function(model) {
		// public vector wms layers only. we can increase the complexity
		// if other web mapping sites have different criteria
		var isAvailable = false;
		if (this.isPublic() && this.isVector() && this.hasOGCEndpoint("wms")) {
			isAvailable = true;
		}

		return isAvailable;
	},

	setMapItAttributes : function() {
		var attr = {};
		if (this.isMapItAvailable()) {
			attr = {
				mapit : [ "GeoCommons" ]
			};
		}
		this.set(attr);
	},

	isDownloadAvailable : function() {
		var isAvailable = this.isPublic();

		// check permissions
		if (!isAvailable) {
			isAvailable = OpenGeoportal.ogp.appState.get("login").model
					.hasAccess(this);
		}

		// short-circuit for no permission
		if (isAvailable) {

			// check that an appropriate url is available
			isAvailable = OpenGeoportal.Utility.hasLocationValueIgnoreCase(this
					.get("parsedLocation"), this.downloadKeys);
		}

		return isAvailable;

	},

	setDownloadAttributes : function() {
		// either a download type that can be handled by OGP backend or
		// something else, like an external link (fileDownload). Alternatively,
		// no download is available for the resource. Ultimately, to determine
		// if the download can be handled by the backend, a request should be
		// made to the backend.

		var locationObj = this.get("parsedLocation");
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

		this.set({
			downloadType : downloadType,
			downloadFormats : availableFormats
		});

	},

	setDynamicWebServiceAttributes : function() {
		// public with wms, wfs, or wcs endpoints
		if (this.isPublic()) {
			var arrTypes = [];
			var arrProtocols = this.webserviceKeys;
			for ( var i in arrProtocols) {
				var ogcProtocol = arrProtocols[i];
				if (this.hasOGCEndpoint(ogcProtocol)) {
					arrTypes.push(ogcProtocol);
				}
			}
			var attr = {};

			attr = {
				dynamicWebService : arrTypes
			};
			this.set(attr);
		}

	},

	intersectsBounds : function(bounds) {

		var minX = this.get("MinX");
		var minY = this.get("MinY");
		var maxX = this.get("MaxX");
		var maxY = this.get("MaxY");
		// would prefer for bounds to be an object, rather than an array
		var isIntx = function(min1, max1, min2, max2) {
			return (Math.min(max1, max2) - Math.max(min1, min2)) > 0;
		};

		if (!isIntx(bounds[1], bounds[3], minY, maxY)) {
			return false;
		}

		var dateLine = false;
		if (minX > maxX) {
			// wraps across international date line.
			dateLine = true;
		}
		if (!dateLine) {
			var xIntx = isIntx(bounds[0], bounds[2], minX, maxX);
			return xIntx;
		}

		// split the model's bounds into 2 boxes
		var xIntx1 = isIntx(bounds[0], bounds[2], -180.0, maxX);
		var xIntx2 = isIntx(bounds[0], bounds[2], minX, 180.0);
		return xIntx1 || xIntx2;
	},

	assignAttributes : function() {

		this.setMapItAttributes();

		this.setDownloadAttributes();

		this.setDynamicWebServiceAttributes();

	}
});

/*
 * 
 * setDownloadType : function() { // either a download type that can be handled
 * by OGP backend or // something else, like an external link (fileDownload) //
 * alternatively, no download is available for the resource // ultimately, to
 * determine if the download can be handled by // the // backend, a request
 * should be made to the backend.
 * 
 * var locationObj = this.get("parsedLocation"); var locationKey = ""; var
 * downloadType = "default";
 * 
 * if (OpenGeoportal.Utility.hasLocationValueIgnoreCase( locationObj, [ "wfs"
 * ])) { downloadType = "wfs"; } else if
 * (OpenGeoportal.Utility.hasLocationValueIgnoreCase( locationObj, [ "wcs" ])) {
 * downloadType = "wcs"; } else if
 * (OpenGeoportal.Utility.hasLocationValueIgnoreCase( locationObj, [
 * "arcgisrest" ])) { downloadType = "arcgisrest"; } else if
 * (OpenGeoportal.Utility.hasLocationValueIgnoreCase( locationObj, [ "wms" ])) {
 * downloadType = "wms"; // until we have a good mechanism // for // querying
 * the server, we'll assume // GeoServer, which means we can get kml // this way }
 * 
 * this.set({ downloadType : downloadType });
 * 
 * return downloadType; },
 * 
 * 
 */
/*
 * // preview controls are available according to what attributes this // model
 * has // previewType determines what function is used to preview the layer //
 * preview types: // wms, arcgis, tilecache w/wms, tilecache w/out wms
 * (essentially // wmts, // right?), imageCollection, // browseGraphic,
 * previewUrl supportedAttributesByType : [ { type : "wms", discriminator :
 * "DataType", attributes : { raster : { getFeature : false, opacity : 100, sld : "" }, //
 * it's understood that point, line, polygon, are vector // types // types point : {
 * getFeature : false, opacity : 100, colorPickerOn : false, sld : "", color :
 * "#ff0000", graphicWidth : 2 }, line : { getFeature : false, opacity : 100,
 * colorPickerOn : false, sld : "", color : "#0000ff", graphicWidth : 1 },
 * polygon : { getFeature : false, opacity : 100, colorPickerOn : false, sld :
 * "", opacity : 80, color : "#aaaaaa", graphicWidth : 1 }, unknown : {
 * getFeature : false, opacity : 100, colorPickerOn : false, sld : "", color :
 * "#aaaaaa", graphicWidth : 1 } } }, { type : "tilecache", discriminator :
 * "none", attributes : { opacity : 100 } }, { type : "arcgisrest",
 * discriminator : "none", attributes : { opacity : 100 } } ],
 */
OpenGeoportal.CartCollection = Backbone.Collection
		.extend({
			model : OpenGeoportal.Models.CartLayer,
			initialize : function() {

				this.listenTo(this, "invalid", function(model, error) {
					console.log(error);
				});
			},

			addLayer : function(model, options) {

				// check the login object
				var hasAccess = OpenGeoportal.ogp.appState.get("login").model
						.hasAccess(model);

				if (!hasAccess) {
					this.addWithWarning(model);
					// alert("Must log in to preview or download this layer.");

				} else {
					this.add(model);
				}
			},

			toggleCartState : function(itemModel) {
				// console.log("toggleCartState");
				var layerId = itemModel.get("LayerId");
				var layerModel = this.findWhere({
					LayerId : layerId
				});

				if (typeof layerModel === "undefined") {
					var cartItem = itemModel.clone();// Do I need to clone,
					// since I am passing
					// just the attributes?
					this.addLayer(new OpenGeoportal.Models.CartLayer(
							cartItem.attributes));

				} else {
					this.remove(layerModel);
				}
			},

			ignoreAuthenticationWarning : {
				local : false,
				external : false
			},

			addWithWarning : function(layerModel) {
				var ignoreWarning = false;
				if (typeof options !== "undefined"
						&& typeof options.ignoreWarning != "undefined") {
					ignoreWarning = options.ignoreWarning;
				}
				var canLogin = OpenGeoportal.ogp.appState.get("login").model
						.canLogin(layerModel);

				var institution = layerModel.get("Institution");
				var ignoreWarningId = "ignoreAuthenticationWarning";
				var disposition;
				var warningMessage = '<span>This layer is restricted by licensing agreement to the '
						+ institution + ' community. </span>';
				var that = this;

				if (canLogin) {
					disposition = "local";

					warningMessage += '<span class="notice">Restricted layers can be added to the Cart, but you must login before you can preview or download restricted layers.</span>';

				} else {
					disposition = "external";

					warningMessage += '<span class="notice">Restricted layers can be added to the Cart here, but you must use '
							+ institution;
					warningMessage += "'s site and login to preview or download restricted layers.</span>";

				}

				warningMessage += "<br />";
				warningMessage += '<span class="ignoreWarning"><input id="'
						+ ignoreWarningId
						+ '" type="checkbox" /><label for="ignoreAuthenticationWarning">Don\'t show this message again.</span>';

				if (this.ignoreAuthenticationWarning[disposition]) {
					this.add(layerModel);
					return;
				}

				jQuery(document)
						.on(
								"change",
								"#" + ignoreWarningId,
								function() {
									that.ignoreAuthenticationWarning[disposition] = jQuery(
											this).is(":checked");
								});

				var divId = OpenGeoportal.ogp.appState.get("controls")
						.genericModalDialog(warningMessage, "Restricted Layer");

				var addToCartFunction = function() {
					that.add(layerModel);
					jQuery(this).dialog('close');

				};

				var loginAndAddFunction = function() {

					var loginView = OpenGeoportal.ogp.appState.get("login");
					loginView.promptLogin();

					// pass some info to the loginDialog
					jQuery(this).dialog('disable');
					var dialogBox = jQuery('#' + divId);
					// listenTo (Once) user object; test for hasAccess; then add
					// layerModel to collection

					var deferredAdd = function(model) {
						if (model.hasAccess(layerModel)) {
							that.add(layerModel);
						}

						dialogBox.dialog('close');

					};

					loginView.listenToOnce(loginView.model,
							"change:authenticated", deferredAdd);

					jQuery(document).on(
							"loginCancel",
							function() {
								dialogBox.dialog("enable");
								loginView.stopListening(loginView.model,
										"change:authenticated", deferredAdd);

							});
				};

				var cancelFunction = function() {
					// that.IgnoreAuthenticationWarning[disposition] =
					// jQuery("#" + ignoreWarningId).is(":checked");
					jQuery(this).dialog('close');
				};

				var buttons = {};
				if (canLogin) {
					buttons["Login & Add"] = loginAndAddFunction;
					buttons["Add Only"] = addToCartFunction;
					buttons["Cancel"] = cancelFunction;
				} else {
					buttons["Add"] = addToCartFunction;
					buttons["Cancel"] = cancelFunction;
				}

				var dialog$ = jQuery('#' + divId);
				dialog$.dialog({
					width : 535,
					buttons : buttons
				}).siblings(".ui-dialog-buttonpane").find(
						".ui-dialog-buttonset > button").first().focus();
			}
		});
