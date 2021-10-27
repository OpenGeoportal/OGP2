// Repeat the creation and type-checking code for the next level
if (typeof OpenGeoportal === 'undefined') {
	OpenGeoportal = {};
} else if (typeof OpenGeoportal !== "object") {
	throw new Error("OpenGeoportal already exists and is not an object");
}

// "main" for the ungeoreferenced window
jQuery(document).ready(function() {
	// the values are being read from the parent window;
	// get the

	var attributes = OpenGeoportal.externalWindowAttr;
	if (typeof attributes === "undefined") {
		throw new Error("No attribute object was passed to the child window.");
	}

	// get the necessary vals from the model
	var helper = new OpenGeoportal.UnGeoreferencedHelper();
	try {
		helper.init(attributes);
	} catch (e) {
		console.log(e);
		// if an error is thrown, close the window
		window.close();
	}

	// click handler for the close button
	jQuery(".closeButton").on("click", function() {
		window.close();
	});
});

OpenGeoportal.UnGeoreferencedHelper = function() {

	// this code needs to:
	// 1. get info from the passed object
	// 2. retrieve image bounds from the gss controller
	// 3. use OpenLayers to display the map using properties from the model

	this.mapDivId = "map";
	var WIDTH = 50;
	var HEIGHT = 50;

	this.init = function(attributes) {
		this.setWmsRequestAttributes(attributes);

		this.createCollectionLink(attributes.collectionURL);

		// required attributes to get bounds from gss controller
		// should validate

		var gssUrl = attributes.gssUrl;
		var path = attributes.path;
		if (typeof gssUrl === "undefined" || typeof path === "undefined") {
			throw new Error(
					"The URL to the GSS controller and the path are required attributes.  Check the object passed to this window.");
		}

		this.callGss(gssUrl, path, this.gssSuccess);

	};

	this.setWmsRequestAttributes = function(attributes) {
		// required attributes to make the wms request
		// should validate

		if (typeof attributes.baseURL === "undefined"
				|| typeof attributes.layers === "undefined"
				|| typeof attributes.CQL === "undefined") {
			throw new Error(
					"The baseURL, layers, and CQL are required attributes.  Check the object passed to this window.");
		}

		this.baseURL = attributes.baseURL;
		this.layers = attributes.layers;
		this.CQL = attributes.CQL;

	};

	this.callGss = function(gssUrl, path, callback) {
		/* Ajax call to gss for image size */
		var params = {
			url : gssUrl,
			data : {
				file_path : path
			},
			done : callback,
			// this needs to be jsonp, so other institutions can get this info
			datatype : "jsonp"
		};

		return jQuery.ajax(params);
	};

	this.gssSuccess = function(data, status, jqXHR) {

		var width = WIDTH; // default value
		var maxx = 0;
		if (data.hasOwnProperty("maxx")) {
			maxx = parseInt(data.maxx);
			width = maxx / 10;
		}

		var height = HEIGHT; // default value
		var miny = 0;
		if (data.hasOwnProperty("miny")) {
			miny = parseInt(data.miny);
			if (miny < 0) {
				miny = miny * -1;
			}
			height = miny / 10;
		}

		// size the map according to returned values
		this.sizeMapDiv(width, height);

		// initialize the map with returned values for bounds
		this.initOpenLayers(new OpenLayers.Bounds(0, miny, maxx, 0));
	};

	this.initOpenLayers = function(bounds) {

		OpenLayers.IMAGE_RELOAD_ATTEMPTS = 5;
		// make OL compute scale according to WMS spec
		OpenLayers.DOTS_PER_INCH = 25.4 / 0.28;

		var options = {
			controls : [],
			maxExtent : bounds,
			maxResolution : 32,
			numZoomLevels : 6,
			projection : "EPSG:404000",
			units : "m"
		};

		var map = new OpenLayers.Map(this.mapDivId, options);

		var layer = this.createImageLayer(bounds);
		map.addLayer(layer);

		map.addControl(new OpenLayers.Control.ModPanZoom());
		map.addControl(new OpenLayers.Control.Navigation({
			documentDrag : true
		}));

		map.zoomToMaxExtent({
			restricted : false
		});

		map.render(this.mapDivId);

	};

	this.createImageLayer = function(bounds) {
		var layer = new OpenLayers.Layer.WMS("Images - Tiled", this.baseURL, {
			CQL_FILTER : this.CQL,
			LAYERS : this.layers,
			STYLES : "",
			format : "image/jpeg",
			palette : "safe",
			tiled : true,
			tilesOrigin : bounds.left + ", " + bounds.bottom
		},
		// version: "1.1.1",
		// bbox: this.image_points.minx + ", " +
		// this.image_points.miny + ", " +
		// this.image_points.maxx + ", " + this.image_points.maxy,
		// width: this.image_points.maxx,
		// height: abs_miny,
		// srs: "EPSG:404000"},
		{
			buffer : 0,
			displayOutsideMaxExtent : true,
			isBaseLayer : true
		});

		return layer;
	};

	this.sizeMapDiv = function(width, height) {
		var mapDiv = jQuery("#" + this.mapDivId);
		mapDiv.width(width);
		mapDiv.height(height);
	};

	this.createCollectionLink = function(collectionurl) {
		if (collectionurl !== null) {
			jQuery("#collection").text(
					'To see this image in its collection, see');
			jQuery("#collURL").html(
					'<a href="' + collectionurl + '" target="_blank">'
							+ collectionurl + '</a>');
		}
	};
};

/*
 * 
 * http://gis.lib.berkeley.edu:8080/geoserver/wms?version=1.1.0&request=GetMap&layers=UCB:images&CQL_FILTER=PATH=%27furtwangler/17076013_03_028a.tif%27&bbox=0.0,-8566.0,6215.0,0.0&width=6215&height=8566&srs=EPSG:404000&format=image/jpeg
 * 
 * This works better.
 */

/*
 * 
 * http://linuxdev.lib.berkeley.edu:8080/geoserver/UCB/wms?service=WMS&version=1.1.0&request=GetMap&layers=UCB:images&CQL_FILTER=PATH=%27furtwangler_sid/17076013_01_001a_s.sid%27&styles=&bbox=0.0,-65536.0,65536.0,0.0&width=512&height=512&srs=EPSG:404000&format=application/openlayers
 * 
 * Here is what we get: fileName: 17076013_07_072a.tif location:
 * {"imageCollection": {"path": "furtwangler/17076013_07_072a.tif", "url":
 * "http://linuxdev.lib.berkeley.edu:8080/geoserver/UCB/wms", collectionurl:
 * "http://www.lib.berkeley.edu/EART/mapviewer/collections/histoposf/"}}
 * 
 * So:
 */

/*
 * 
 * if (availability.toLowerCase() == "offline"){ //try to preview bounds
 * //console.log(mapObj); org.OpenGeoPortal.map.addMapBBox(mapObj);
 * layerState.setState(layerID, {"preview": "on", "dataType": dataType,
 * "wmsName": layerName}); }
 * 
 * 
 */
