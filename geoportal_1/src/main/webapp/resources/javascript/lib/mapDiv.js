/**

 * This javascript module includes functions for dealing with the map Div
 * defined under the object MapController.  MapController inherits from
 * the OpenLayers.Map object
 * 
 * @author Chris Barnett
 */

if (typeof OpenGeoportal == 'undefined'){
	OpenGeoportal = {};
} else if (typeof OpenGeoportal != "object"){
	throw new Error("OpenGeoportal already exists and is not an object");
}

//some code to test presence of OpenLayers, check version?

//MapDiv Constructor
OpenGeoportal.MapController = function(stateObj) {	

	//we only want one copy of this;  we can make this a singleton or call it from main.
	this.appState = stateObj;

	//really, we're just checking to make sure something was passed in
	if (typeof this.appState === "undefined"){
		throw new Error("An appropriate state object must be passed to the constructor of MapController.");
	}
	
	this.layerState = this.appState.layerState;
	this.template = this.appState.template;
	
	this.config = OpenGeoportal.InstitutionInfo;
	
	this.userMapAction = false;
	var analytics = new OpenGeoportal.Analytics();
		
	this.currentAttributeRequest = false;
	this.prevExtent = "";

	this.createMap = function(containerDiv, userOptions){
		//set default for the name of the map div
		if ((typeof containerDiv == 'undefined')||(containerDiv.length == 0)){
			throw new Error("The id of the map div must be specified.");
		}
		this.containerDiv = containerDiv;
		this.createMapHtml(containerDiv);
		this.createOLMap(userOptions);
		this.initMap();
		this.registerMapEvents();
	};

	this.createMapHtml = function(div){
		//test for uniqueness
		var div$ = jQuery("#" + div);
		if (div$.length == 0){
			throw new Error("The DIV [" + div + "] does not exist!");
		}
		var resultsHTML = this.template.map({mapId: div});
		div$.html(resultsHTML);
	};
	
	this.createDefaultOLPanel = function(){
		var nav = new OpenLayers.Control.NavigationHistory({nextOptions: {title: "Zoom to next geographic extent"}, 
			previousOptions:{title: "Zoom to previous geographic extent"}});
		var zoomBox = new OpenLayers.Control.ZoomBox(
				{title:"Click or draw rectangle on map to zoom in"});
		var zoomBoxListener = function(){jQuery(document).trigger("zoomBoxActivated")};
		zoomBox.events.register("activate", this, zoomBoxListener);
		var panListener = function(){jQuery(document).trigger("panActivated")};
		var panHand = new OpenLayers.Control.Navigation(
				{title:"Pan by dragging the map"});
		panHand.events.register("activate", this, panListener);
		var globalExtent = new OpenLayers.Control.ZoomToMaxExtent({title:"Zoom to global extent"});
		var panel = new OpenLayers.Control.Panel({defaultControl: panHand});

		panel.addControls([
		                   globalExtent,
		                   nav.previous,
		                   nav.next,
		                   zoomBox,
		                   panHand
		                   ]);
		//display mouse coords in lon-lat
		
		return panel;
	};
	
	this.createOLMap = function(userOptions){
		//set default OpenLayers map options
		this.mapDiv = this.containerDiv + "OLMap";

		var displayCoords = new OpenLayers.Control.MousePosition({displayProjection: new OpenLayers.Projection("EPSG:4326")});

		var mapBounds = new OpenLayers.Bounds(-20037508.34,-20037508.34,20037508.34,20037508.34);

		var options = {
				allOverlays: true,
				projection: new OpenLayers.Projection("EPSG:900913"),
				maxResolution: 2.8125,
				maxExtent: mapBounds,
				units: "m",
				minZoomLevel: 1,
				controls: [new OpenLayers.Control.ModPanZoomBar(),
				           new OpenLayers.Control.ScaleLine(),
				           displayCoords,
				           //nav,
				           this.createDefaultOLPanel()]
		};

		//merge default options and user specified options into 'options'--not recursive
		jQuery.extend(userOptions, options);
		//div defaults to 0 height for certain doc-types; we want the map to fill the parent container
		jQuery('#' + this.mapDiv).height(jQuery('#' + this.mapDiv).parent().parent().height());

		//call OpenLayers.Map with function arguments

		// attempt to reload tile if load fails
		OpenLayers.IMAGE_RELOAD_ATTEMPTS = 3;
		OpenLayers.ImgPath = "resources/media/"
			// make OL compute scale according to WMS spec
			//OpenLayers.DOTS_PER_INCH = 90.71428571428572;
		OpenLayers.Util.onImageLoadErrorColor = 'transparent';
		
		OpenLayers.Map.call(this, "ogpMap", options);	
	};

	this.initMap = function (){
		//default background map
		this.setBackgroundMap();

		var center = this.WGS84ToMercator(0, 0);
		//set map position
		this.setCenter(center);	
		this.prevExtent = this.getExtent();
		
		this.addMapToolbarButton({displayClass: "saveImageButton", title: "Save map image", buttonText: "Save Image"}, this.saveImage);
		this.addMapToolbarButton({displayClass: "printButton", title: "Print map", buttonText: "Print Map"}, OpenGeoportal.Utility.doPrint);

		this.createBasemapMenu();
	};

	this.registerMapEvents = function(){
		var that = this;
		//register events
		jQuery('#' + this.mapDiv).resize(function () {
			that.updateSize();
			if (parseInt(jQuery("#" + that.mapDiv).width()) >= 1024) {
				if (that.zoom == 0){
					that.zoomTo(1);
				}
			}
		});
		this.events.register('zoomend', this, function(){
			var zoomLevel = that.getZoom();
			//console.log(zoomLevel);
			if (zoomLevel >= (that.backgroundMaps(that.getCurrentBackgroundMap()).zoomLevels - 1)){
				that.changeBackgroundMap("googleHybrid");
				that.zoomTo(that.getZoom());
			} else {
				if (that.getBackgroundType() !== that.getCurrentBackgroundMap()){
					that.changeBackgroundMap(that.getCurrentBackgroundMap());
				}
			}
			var mapHeight = Math.pow((zoomLevel + 2), 2) / 2 * 256;
			var containerHeight = jQuery("#" + that.mapDiv).parent().parent().height();
			if (mapHeight > containerHeight){
				mapHeight = containerHeight;
			}

			if (jQuery("#" + that.mapDiv).height() != mapHeight){
				jQuery("#" + that.mapDiv).height(mapHeight);//calculate min and max sizes
			}
			if (zoomLevel == 0){
				that.setCenter(that.WGS84ToMercator(that.getCenter().lon, 0));
			} 
			//console.log('zoomend');
			jQuery(document).trigger('eventZoomEnd');
		});

		this.events.register('moveend', this, function(){
			jQuery(document).trigger('eventMoveEnd');
		});

		this.bboxHandler();
		this.styleChangeHandler();
		this.opacityHandler();
		this.zoomToLayerExtentHandler();
		this.previewLayerHandler();
		this.getFeatureInfoHandler();

	};

	this.mapControlUIHandler = function(){
		//'hover' for graphics that are not background graphics
		var zoomPlusSelector = '.olControlModPanZoomBar img[id*="zoomin"]';
		jQuery(document).on("mouseenter", zoomPlusSelector, function(){
			jQuery(this).attr("src", that.utility.getImage("slider_plus_hover.png"));
			//jQuery(this).css("cursor", "pointer");
		});

		jQuery(document).on("mouseleave", zoomPlusSelector, function(){
			jQuery(this).attr("src", that.utility.getImage("zoom-plus-mini.png"));
		});

		jQuery(document).on("click", zoomPlusSelector, function(){
			that.mapObject.zoomIn();
		});

		var zoomMinusSelector = '.olControlModPanZoomBar img[id*="zoomout"]';
		jQuery(document).on("mouseenter", zoomMinusSelector, function(){
			jQuery(this).attr("src", that.utility.getImage("slider_minus_hover.png"));
			//jQuery(this).css("cursor", "pointer");
		});

		jQuery(document).on("mouseleave", zoomMinusSelector, function(){
			jQuery(this).attr("src", that.utility.getImage("zoom-minus-mini.png"));
		});

		jQuery(document).on("click", zoomMinusSelector, function(){
			that.mapObject.zoomOut();
		});	

	};
	
	this.addMapToolbarButton = function(displayParams, callbackHandler){
		jQuery("#ogpMapButtons").append(this.template.mapButton(displayParams));
		var that = this;
		jQuery("." + displayParams.displayClass).on("click", function(){callbackHandler.call(that);});
	};
	
	//default text for the geocoder input box
	this.geocodeText = "Find Place (Example: Boston, MA)";
	/**
	 * geocodes the value typed into the geocoder text input using the Google maps geocoder,
	 * then zooms to the returned extent.  also animates the response
	 */
	this.geocodeLocation = function(){
		var value = jQuery("#geosearch").val();
		geocoder = new google.maps.Geocoder();
		var that = this;
		geocoder.geocode( { 'address': value}, function(results, status) {
			if (status != 'OK'){
				jQuery("#geosearch").val("Place name not found");
			} else {
				jQuery("#geosearch").val(results[0].formatted_address);
				var	maxY = results[0].geometry.viewport.getNorthEast().lat();
				var	maxX = results[0].geometry.viewport.getNorthEast().lng();
				var	minY = results[0].geometry.viewport.getSouthWest().lat();
				var	minX = results[0].geometry.viewport.getSouthWest().lng();
				var extent = minX + "," + minY + "," + maxX + "," + maxY;
				//zooms to actual extent, rather than a latitude delta
				that.zoomToLayerExtent(extent);

			}
			var currentFontSize = jQuery("#geosearch").css("font-size");
			var currentOpacity = jQuery("#geosearch").css("opacity");
			jQuery("#geosearch").animate({"opacity": 1, "font-size": parseInt(currentFontSize) + 2}, 500).delay(1500)
			.animate({ "font-size": 0 }, 300, function(){jQuery("#geosearch").val(that.geocodeText).css({"font-size": currentFontSize, "opacity": currentOpacity});} );
		});
	};
	
	this.saveImage = function(imageFormat, resolution){
		imageFormat = 'png';
		var format;
		switch (imageFormat){
		case 'jpeg':
			format = "image/jpeg";
			break;
		case 'png':
			format = "image/png";
			break;
		case 'bmp':
			format = "image/bmp";
			break;
		default: throw new Error("This image format (" + imageFormat + ") is unavailable.");
		}

		var requestObj = {};
		requestObj.layers = [];

		for (var layer in this.layers){
			var currentLayer = this.layers[layer];
			if (currentLayer.CLASS_NAME != "OpenLayers.Layer.WMS"){
				continue;
			}
			if (currentLayer.visibility == false){
				continue;
			}

			var sld = this.layerState.getState(currentLayer.name, "sld");
			var opacity = this.layerState.getState(currentLayer.name, "opacity");
			if (opacity == 0){
				continue;
			}
			//insert this opacity value into the sld to pass to the wms server
			var layerObj = {};
			var storedName = this.layerState.getState(currentLayer.name, "wmsName");
			if (storedName == ''){
				layerObj.name = currentLayer.params.LAYERS;
			} else {
				layerObj.name = storedName;
			}
			layerObj.opacity = opacity;
			layerObj.zIndex = this.getLayerIndex(currentLayer);
			if ((typeof sld != 'undefined')&&(sld !== null)&&(sld != "")){
				var sldParams = [{wmsName: layerObj.name, layerStyle: sld}];
				layerObj.sld = this.createSLDFromParams(sldParams);
			}
			layerObj.layerId = currentLayer.name;
			requestObj.layers.push(layerObj);
		}
		console.log(this);
		var bbox = this.getExtent().toBBOX();
		
		requestObj.format = format;
		requestObj.bbox = bbox;
		requestObj.srs = 'EPSG:900913';
		requestObj.width = jQuery('#' + this.mapDiv).width();
		requestObj.height = jQuery('#' + this.mapDiv).height();
		//return a url from the servlet
		var params = {
				url: "requestImage",
				data: JSON.stringify(requestObj),
				dataType: "json",
				type: "POST",
				context: this,
				complete: function(){
				},
				success: function(data){
					OpenGeoportal.ogp.downloadQueue.registerImageRequest(data.requestId, requestObj);
					//TODO:
					//should parse errors
					//will also have status info for requested layers in this returned object

				}
		};

		jQuery.ajax(params);
		//this.toProcessingAnimation(jQuery("#map_tabs > span").first());
	};
	
	//TODO:  create a generic widget for this to put in the widgets file, add necessary config.
	/**
	 * creates the basemap menu from the backgroundMaps object in OpenGeoportal.MapController
	 */
	this.createBasemapMenu = function() {
		var basemapHtml = '<div id="basemapDropdown">'
			+ '<button id="basemapSelect" class="mapStyledButton" title="Select base map">'
			+	'<span>Basemap<img src="resources/media/arrow_down.png" alt="Select base map" /></span>'
			+ '</button>'
			+ '<div id="basemapMenu">'
			+ '</div>'
			+ '</div>';
		jQuery("#ogpMapButtons").append(basemapHtml);

		var backgroundMapsConfig = this.backgroundMaps("all");
		var radioHtml = "";
		for (var mapType in backgroundMapsConfig){
			var isDefault = "";
			if (mapType == this.getCurrentBackgroundMap()){
				isDefault = ' checked="checked"';
			} 
			radioHtml += '<input type="radio" id="basemapRadio' + mapType + '" name="basemapRadio" value="' + mapType + '"' + isDefault + ' />';
			radioHtml += '<label for="basemapRadio' + mapType + '">' + backgroundMapsConfig[mapType].name + '</label>';
		}
		var that = this;
		jQuery("#basemapMenu").html(radioHtml);
		jQuery("[name=basemapRadio]").attr("checked", false);
		jQuery("[name=basemapRadio]").filter("[value=" + that.getCurrentBackgroundMap() + "]").attr("checked", "checked");
		jQuery("#basemapSelect").button();
		jQuery("#basemapMenu").buttonset();
		jQuery("#basemapDropdown").hover(function(){jQuery("#basemapMenu").show();}, function(){jQuery("#basemapMenu").hide();});		
		jQuery("[name=basemapRadio]").on("change", function(){that.changeBasemap.call(that);});
	};
	
	/**
	 * sets the background map to the value in the background map dropdown menu.  called by change for the basemap radio button set
	 */
	this.changeBasemap = function(){
		var value = jQuery('input:radio[name=basemapRadio]:checked').val();
		this.setBackgroundMap(value);
	};
	
//	method to set background map
	this.getOsmTileUrl = function getOsmTileUrl(bounds) {
		var res = this.map.getResolution();
		var x = Math.round((bounds.left - this.getMaxExtent().left) / (res * this.tileSize.w));
		var y = Math.round((this.getMaxExtent().top - bounds.top) / (res * this.tileSize.h));
		var z = this.map.getZoom() + 1;
		var limit = Math.pow(2, z);

		if (y < 0 || y >= limit) {
			//console.log["ol 404"];
			return OpenGeoportal.Utility.getImage("404.png");
		} else {
			x = ((x % limit) + limit) % limit;
			//console.log([this.url, this.type]);
			return this.url + z + "/" + x + "/" + y + "." + this.type;
		}
	};

	this.getBackgroundType = function() {
		var layers = this.layers;
		for (var i in layers){
			if ((layers[i].CLASS_NAME == "OpenLayers.Layer.Google")&&(layers[i].visibility == true)
					&&layers[i].opacity == 1){
				return layers[i].type;
			} else {
				return "osm";
			}
		}
	};

	this.backgroundMaps = function(mapType){
		if (typeof google != "undefined"){
			var bgMaps = {
					googleHybrid: {mapClass: "Google", zoomLevels: 22, name: "Google Hybrid", params: {type: google.maps.MapTypeId.HYBRID}},
					googleSatellite: {mapClass: "Google", zoomLevels: 22, name: "Google Satellite", params: {type: google.maps.MapTypeId.SATELLITE}},
					googleStreets: {mapClass: "Google", zoomLevels: 20, name: "Google Streets", params: {type: google.maps.MapTypeId.ROADMAP}}, 
					googlePhysical: {mapClass: "Google", zoomLevels: 15, name: "Google Physical", params: {type: google.maps.MapTypeId.TERRAIN}},
					osm: {mapClass: "TMS", zoomLevels: 17, name: "OpenStreetMap", params: {type: 'png', getURL: this.getOsmTileUrl,
						displayOutsideMaxExtent: true}, url: "http://tile.openstreetmap.org/"}
			};
			if (mapType == "all"){
				return bgMaps;
			} else {
				return bgMaps[mapType];
			}
		} else{
			bgMaps = {osm: {mapClass: "TMS", zoomLevels: 17, name: "OpenStreetMap", params: {type: 'png', getURL: this.getOsmTileUrl,
				displayOutsideMaxExtent: true}, url: "http://tile.openstreetmap.org/"}};
			if (mapType == "all"){
				return bgMaps;
			} else {
				return bgMaps["osm"];
			}
		}
	};

	this.getCurrentBackgroundMap = function(){
		if (typeof google != "undefined"){
			return this.currentBackgroundMap;
		} else{
			return "osm";
		}
	};

	this.currentBackgroundMap = "googlePhysical"; //default background map

	this.setCurrentBackgroundMap = function(bgType){
		try {
			this.backgroundMaps(bgType);
			this.currentBackgroundMap = bgType;
		} catch (e) {
			throw new Error("This background type does not exist: "+ bgType);
		}
	};

	this.setBackgroundMap = function(bgType) {
		//default 
		bgType = bgType || this.getCurrentBackgroundMap();
		this.setCurrentBackgroundMap(bgType);
		var zoomLevel = this.getZoom();
		if (zoomLevel >= (this.backgroundMaps(bgType).zoomLevels - 1)){
			this.changeBackgroundMap("googleHybrid");
		} else {
			this.changeBackgroundMap(bgType);
		}
	};

	this.changeBackgroundMap = function(bgType){
		//minimize the number of Google layers by changing map types in the Google Maps API
		var that = this;
		var backgroundMaps = this.backgroundMaps(bgType);
		if (backgroundMaps.mapClass == "Google"){
			if (this.getLayersByClass('OpenLayers.Layer.Google').length > 0){
				var googleLayer = this.getLayersByClass('OpenLayers.Layer.Google')[0];
				googleLayer.mapObject.setMapTypeId(backgroundMaps["params"]["type"]);
				googleLayer.type = backgroundMaps["params"]["type"];
				googleLayer.setOpacity(1);
				jQuery("div.olLayerGooglePoweredBy").children().css("display", "block");

			} else {
				backgroundMaps.params.sphericalMercator = true;
				backgroundMaps.params.maxExtent = new OpenLayers.Bounds(-20037508.34,-20037508.34,20037508.34,20037508.34);
				var bgMap = new OpenLayers.Layer.Google(backgroundMaps.name,
						backgroundMaps.params);

				this.addLayer(bgMap);
				google.maps.event.addListener(bgMap.mapObject, "tilesloaded", function() {
					//console.log("Tiles loaded");
					that.render(that.mapDiv);
					jQuery(".mapClearButtonItemInactive").text("clear previews");
					that.userMapAction = true;
					jQuery(document).trigger("mapReady");
					//really should only fire the first time
					google.maps.event.clearListeners(bgMap.mapObject, "tilesloaded");
					jQuery("#geoportalMap").fadeTo("slow", 1);

				});

			}
			if (this.getLayersByName('OpenStreetMap').length > 0){
				this.getLayersByName('OpenStreetMap')[0].setVisibility(false);
			}
		} else if (backgroundMaps.mapClass == "TMS"){
			if (this.getLayersByName('OpenStreetMap').length > 0){
				var osmLayer = this.getLayersByName('OpenStreetMap')[0];
				osmLayer.setVisibility(true);
			} else {
				var bgMap = new OpenLayers.Layer.TMS(
						backgroundMaps.name,
						backgroundMaps.url,
						backgroundMaps.params
				);
				this.addLayer(bgMap);
				this.setLayerIndex(this.getLayersByName('OpenStreetMap')[0], 1);
				bgMap.events.register(bgMap.mapObject, "loadend", function() {
					//console.log("Tiles loaded");
					that.render(that.mapDiv);
					jQuery(".mapClearButtonItemInactive").text("clear previews");
					that.userMapAction = true;
					//really should only fire the first time
					bgMap.events.unregister(bgMap.mapObject, "loadend");
					jQuery("#geoportalMap").fadeTo("slow", 1);
				});
			}
			if (this.getLayersByClass('OpenLayers.Layer.Google').length > 0){
				var googleLayer = this.getLayersByClass('OpenLayers.Layer.Google')[0];
				googleLayer.mapObject.setMapTypeId(this.backgroundMaps("googleHybrid")["params"]["type"]);
				googleLayer.type = this.backgroundMaps("googleHybrid")["params"]["type"];
				googleLayer.setOpacity(0);
				jQuery("div.olLayerGooglePoweredBy").children().css("display", "none");
			}
		}
	};

//	utility functions
	this.WGS84ToMercator = function (lon, lat){
		//returns -infinity for -90.0 lat; a bug?
		lat = parseFloat(lat);
		lon = parseFloat(lon);
		if (lat >= 90){
			lat = 89.99;
		}
		if (lat <= -90){
			lat = -89.99;
		}
		if (lon >= 180){
			lon = 179.99;
		}
		if (lon <= -180){
			lon = -179.99;
		}
		//console.log([lon, "tomercator"])
		return OpenLayers.Layer.SphericalMercator.forwardMercator(lon, lat);
	};

	this.MercatorToWGS84 = function (lon, lat) {
		lat = parseFloat(lat);
		lon = parseFloat(lon);
		var transformedValue = OpenLayers.Layer.SphericalMercator.inverseMercator(lon, lat);
		var newLat = transformedValue.lat;
		var newLon = transformedValue.lon;
		if (newLat > 90){
			newLat = 90;
		}
		if (newLat < -90){
			newLat = -90;
		}
		if (newLon > 180){
			newLon = 180;
		}
		if (newLon < -180){
			newLon = -180;
		}
		return new OpenLayers.LonLat(newLon, newLat);
	};

	this.returnExtent = function(){
		// pass along the extents of the map
		var extents = this.getExtent().toArray();
		var left = extents[0];
		var bottom = extents[1];
		var right = extents[2];
		var top = extents[3];
		var bottomLeftLonLat = this.MercatorToWGS84(left, bottom);
		var topRightLonLat = this.MercatorToWGS84(right, top);
		var bbox = {};
		bbox.left = parseFloat(bottomLeftLonLat.lon);
		bbox.bottom = parseFloat(bottomLeftLonLat.lat); 
		bbox.right = parseFloat(topRightLonLat.lon);
		bbox.top = parseFloat(topRightLonLat.lat);
		//console.log(new OpenLayers.Bounds(bbox));why doesn't this return a nice openlayers bounds object?
		return bbox;
	};

//	method to clear the map while keeping the base layer
	this.clearMap = function (){
		var mapLayers = this.layers;
		if (mapLayers.length > 0){
			OpenGeoportal.PreviewedLayers.clearLayers();
			for (var i in mapLayers){
				var currentLayer = mapLayers[i];
				if ((currentLayer.CLASS_NAME != 'OpenLayers.Layer.Google')&&
						(currentLayer.name != 'OpenStreetMap')&&
						(currentLayer.name != 'layerBBox')){
					//remove the layer from the map
					currentLayer.setVisibility(false);
					//we'll also need to update the state of buttons and the layer state object
					this.layerState.setState(currentLayer.name, {"preview": "off", "getFeature": false});
				} else {
					continue;
				}
			}
		}
	};

	this.getAttributeDescription = function (thisObj, layerId) {
		//no need to make the call if the title attribute has already been set
		if (!jQuery(thisObj).attr('title')){
			var solr = new OpenGeoportal.Solr();
			var query = solr.getMetadataQuery(layerId);
			jQuery(".attributeName").css("cursor", "wait");
			solr.sendToSolr(query, this.getAttributeDescriptionJsonpSuccess, this.getAttributeDescriptionJsonpError, thisObj);
		}
	};

	this.getAttributeDescriptionJsonpSuccess = function(data, thisObj) {
		var that = thisObj;
		jQuery(".attributeName").css("cursor", "default");
		var solrResponse = data["response"];
		var totalResults = solrResponse["numFound"];
		if (totalResults != 1)
		{
			throw new Error("Request for FGDC returned " + totalResults +".  Exactly 1 was expected.");
			return;
		}
		var doc = solrResponse["docs"][0];  // get the first layer object
		var fgdcRawText = doc["FgdcText"];
		var fgdcText = fgdcRawText;  // text was escaped on ingest into Solr
		//var parser = new DOMParser();
		//var fgdcDocument = parser.parseFromString(fgdcText,"text/xml");
		jQuery(jQuery.parseXML(fgdcText)).find("attrlabl").each(function(){
			var currentXmlAttribute = jQuery(this);
			jQuery(that).closest("tbody").find(".attributeName").each(function(){
				if (currentXmlAttribute.text() == jQuery(this).text()){
					var attributeDescription = currentXmlAttribute.siblings("attrdef").first();
					attributeDescription = OpenGeoportal.Utility.stripExtraSpaces(attributeDescription.text().trim());
					if (attributeDescription.length == 0){
						attributeDescription = "No description available";
					}
					jQuery(this).attr('title', attributeDescription);
					return;
				}
			});
		});
	};

	this.getAttributeDescriptionJsonpError = function () {
		jQuery(".attributeName").css("cursor", "default");
		throw new Error("The attribute description could not be retrieved.");
	};

	this.wmsGetFeature = function(e){
		//since this is an event handler, the context isn't the MapController Object
		console.log("wmsGetFeature");
		if (typeof this.map != "undefined"){
			var mapObject = this.map;
			var layerStateObject = mapObject.layerState;
			var that = this;
			var PIXELS = 10;//#pixel(s) on each side
			var pixelSize = mapObject.getGeodesicPixelSize();//pixel size in kilometers
			//console.log(pixelSize);
			var xbboxSize = pixelSize.w * PIXELS * 1000;//in meters
			var ybboxSize = pixelSize.h * PIXELS * 1000;
			var point = mapObject.getLonLatFromViewPortPx(e.xy);
			var pixel = e.xy;
			//console.log(point);
			//var srcProj = new OpenLayers.Projection("EPSG:4326");
			//var destProj = new OpenLayers.Projection("EPSG:900913");
			var projPoint = point;//.transform(srcProj, destProj);
			//console.log(projPoint);
			var xMin = projPoint.lon - xbboxSize/2;
			var yMin = projPoint.lat - ybboxSize/2;
			var xMax = projPoint.lon + xbboxSize/2;
			var yMax = projPoint.lat + ybboxSize/2;
			var layerId = this.name;
			var searchString = "OGPID=" + layerId;
			searchString += "&bbox=" + this.map.getExtent().toBBOX();//+ xMin + "," + yMin + "," + xMax + "," + yMax;
			//+ this.map.getExtent().toBBOX(); 
			//geoserver doesn't like fractional pixel values
			searchString += "&x=" + Math.round(pixel.x) + "&y=" + Math.round(pixel.y);
			searchString += "&height=" + this.map.size.h + "&width=" + this.map.size.w;

			var ajaxParams = {
					type: "GET",
					context: this,
					url: 'featureInfo',
					data: searchString,
					dataType: 'text',
					success: function(data, textStatus, XMLHttpRequest){
						//create a new dialog instance, or just open the dialog if it already exists
						var dialogTitle = '<span class="getFeatureTitle">' + layerStateObject.getFeatureTitle + "</span>";
						var tableText = '<table class="attributeInfo">';
						var response = jQuery.parseXML(jQuery.trim(data));
						var attributes = response.getElementsByTagName("gml:featureMember");
						if (attributes.length == 0){
							attributes = response.getElementsByTagName("featureMember");
						}
						var rawFeatures = response;//.getElementsByTagName("wfs:FeatureCollection");
						var innerText = '';
						/*var featureLayer;
            	//add or modify a layer with a vector representing the selected feature
            	if (this.map.getLayersByName("featureSelection").length > 0){
            		featureLayer = this.map.getLayersByName("featureSelection")[0];
            	} else {
                    var style_blue = OpenLayers.Util.extend({}, OpenLayers.Feature.Vector.style['default']);
                    style_blue.strokeColor = "blue";
                    style_blue.fillColor = "blue";
                    style_blue.fillOpacity = 1;
                    style_blue.pointRadius = 2;
                    style_blue.strokeWidth = 2;
                    style_blue.strokeLinecap = "butt";
                    style_blue.zIndex = 999999;
            		featureLayer = new OpenLayers.Layer.Vector("featureSelection");//, {
                   //     style: style_blue
                    //});

            		this.map.addLayer(featureLayer);
            	}
            	var options = {
                        'featureType': "GISPORTAL.GISOWNER01.BOSTONINFRASTRUCTURE12",
                        'featureNS': "http://geoserver.sf.net",
                        'internalProjection': new OpenLayers.Projection("EPSG:900913"),
                        'externalProjection': new OpenLayers.Projection("EPSG:2249")
            	};
                var format = new OpenLayers.Format.GML.v3(options);
            	var features = format.read(rawFeatures);
            	//console.log(features);
                var vector = new OpenLayers.Feature.Vector(features.geometry);
                //vector.bounds = this.map.getExtent();
                this.map.testVector = vector;
                featureLayer.removeAllFeatures();
                featureLayer.addFeatures([vector]);
                featureLayer.redraw();
            	this.map.setLayerIndex(featureLayer, (this.map.layers.length -1));
						 */
						var linecount = 0;
						//supports only one feature as is
						jQuery(attributes).children().first().children().each(function(){
							if (typeof jQuery(this).children()[0] == 'undefined'){
								var attributeName = this.nodeName;
								attributeName = attributeName.substr(attributeName.indexOf(":") + 1);
								var attributeValue = jQuery(this).text();
								linecount++;
								innerText += '<tr><td class="attributeName">';
								innerText += attributeName;
								innerText += "</td><td>";
								innerText += attributeValue;
								innerText += "</td></tr>";
							}
						});

						tableText += innerText + "</table>";
						if (innerText.length == 0){
							//return;
							tableText = '<p>There is no data for this layer at this point.</p>';
						}
						var containerHeight = jQuery("#container").height();
						var dataHeight =  linecount * 20;
						if (dataHeight > containerHeight){
							dataHeight = containerHeight;
						} else {
							dataHeight = "auto";
						}
						if (typeof jQuery('#featureInfo')[0] == 'undefined'){
							var infoDiv = '<div id="featureInfo" class="dialog">' + dialogTitle + tableText + '</div>';
							jQuery("body").append(infoDiv);
							jQuery("#featureInfo").dialog({
								zIndex: 2999,
								title: "FEATURE ATTRIBUTES",
								width: 'auto',
								height: dataHeight,
								autoOpen: false
							});    	  
							jQuery("#featureInfo").dialog('open');
						} else {
							jQuery("#featureInfo").html(dialogTitle + tableText);
							jQuery("#featureInfo").dialog("option", "height", dataHeight);
							jQuery("#featureInfo").dialog('open');
						}
						var that = this;
						jQuery("td.attributeName").mouseenter(function(){that.map.getAttributeDescription(this, that.name);});
					},
					error: function(jqXHR, textStatus, errorThrown) {if ((jqXHR.status != 401)&&(textStatus != 'abort')){new OpenGeoportal.ErrorObject(new Error(), "Error retrieving Feature Information.");}},
					complete: function(){that.map.currentAttributeRequest = false;            	
					jQuery(document).trigger("hideLoadIndicator");}
			};

			if (typeof this.map.currentAttributeRequest == 'object'){
				this.map.currentAttributeRequest.abort();
			} 
			this.map.currentAttributeRequest = jQuery.ajax(ajaxParams);
			jQuery(document).trigger("showLoadIndicator");
			var institution = (layerId.indexOf(".") > -1) ? layerId.split(".")[0] : "";
			analytics.track("Layer Attributes Viewed", institution, layerId);
		} else {
			new OpenGeoportal.ErrorObject(new Error(), "This layer has not been previewed. <br/>You must preview it before getting attribute information.");
		}
	};


//	methods to add layers

	this.bboxHandler = function(){
		var that = this;
		jQuery(document).on("map.showBBox", function(event, bbox){
			that.showLayerBBox(bbox);
		});
		jQuery(document).on("map.hideBBox", function(event){
			that.hideLayerBBox();
		});
	};

	this.hideLayerBBox = function () {
		if (this.getLayersByName("layerBBox").length > 0){
			var featureLayer = this.getLayersByName("layerBBox")[0];
			featureLayer.removeAllFeatures();
		}
		if (this.getLayersByName("layerBBoxOutsideExtent").length > 0){
			var featureLayer = this.getLayersByName("layerBBoxOutsideExtent")[0];
			featureLayer.removeAllFeatures();
		}
	};

	this.showLayerBBox = function (mapObj) {
		//mapObj requires west, east, north, south
		//add or modify a layer with a vector representing the selected feature
		var featureLayer;
		if (this.getLayersByName("layerBBox").length > 0){
			featureLayer = this.getLayersByName("layerBBox")[0];
			featureLayer.removeAllFeatures();
		} else {
			var style_blue = OpenLayers.Util.extend({}, OpenLayers.Feature.Vector.style['default']);
			/*
			 * 4px border,
border color: #1D6EEF, background color: #DAEDFF, box opacity: 25%
			 */
			style_blue.strokeColor = "#1D6EEF";//'#003366';
			style_blue.fillColor = "#DAEDFF";//'#003366';
			style_blue.fillOpacity = .25;
			style_blue.pointRadius = 10;
			style_blue.strokeWidth = 4;
			style_blue.strokeLinecap = "butt";
			style_blue.zIndex = 999;

			featureLayer = new OpenLayers.Layer.Vector("layerBBox", {
				style: style_blue
			});
			this.addLayer(featureLayer);
		}
		var bottomLeft = this.WGS84ToMercator(mapObj.west, mapObj.south);
		var topRight = this.WGS84ToMercator(mapObj.east, mapObj.north);

		if (bottomLeft.lon > topRight.lon) {
			var dateline = this.WGS84ToMercator(180,0).lon;
			var box1 = new OpenLayers.Feature.Vector(new OpenLayers.Bounds(bottomLeft.lon,bottomLeft.lat,dateline,topRight.lat).toGeometry());
			var box2 = new OpenLayers.Feature.Vector(new OpenLayers.Bounds(topRight.lon,topRight.lat,-1*dateline, bottomLeft.lat).toGeometry());
			featureLayer.addFeatures([box1, box2]);
		} 
		else {
			var box = new OpenLayers.Feature.Vector(new OpenLayers.Bounds(bottomLeft.lon,bottomLeft.lat,topRight.lon,topRight.lat).toGeometry());
			featureLayer.addFeatures([box]);
		}
		this.setLayerIndex(featureLayer, (this.layers.length -1));

		//do a comparison with current map extent
		var extent = this.getExtent(); //h=
		//25px
		var geodeticExtent = this.getGeodeticExtent();
		var compareTop = extent.top;
		if (geodeticExtent.top > 83){
			compareTop = 238107694;
		}
		var compareBottom = extent.bottom;
		if (geodeticExtent.bottom < -83){
			compareBottom = -238107694;
		}
		var compareLeft = extent.left;
		if (geodeticExtent.left < -179){
			compareLeft = -20037510;
		}
		var compareRight = extent.right;
		if (geodeticExtent.right > 180){
			compareRight = 20037510;
		}

		if (compareLeft > bottomLeft.lon || compareRight < topRight.lon || compareTop < topRight.lat || compareBottom > bottomLeft.lat){
			var extentFeatureLayer;
			if (this.getLayersByName("layerBBoxOutsideExtent").length > 0){
				extentFeatureLayer = this.getLayersByName("layerBBoxOutsideExtent")[0];
				extentFeatureLayer.removeAllFeatures();
			} else {
				var style_blue = OpenLayers.Util.extend({}, OpenLayers.Feature.Vector.style['default']);
				style_blue.strokeColor = "#1D6EEF";//'#003366';
				style_blue.fillColor = "#1D6EEF";//'#003366';
				style_blue.fillOpacity = 1;
				style_blue.pointRadius = 1;
				style_blue.strokeWidth = 1;
				style_blue.strokeLinecap = "butt";
				style_blue.zIndex = 999;

				extentFeatureLayer = new OpenLayers.Layer.Vector("layerBBoxOutsideExtent", {
					style: style_blue
				});
				this.addLayer(extentFeatureLayer);
			}
			var mapSize = this.getCurrentSize(); //h=512
			var size = 	(Math.abs(extent.top - extent.bottom))/mapSize.h * 25;
			var offset = size / 2;
			var pointList = [];
			var newPoint = new OpenLayers.Geometry.Point(extent.right - offset,extent.top - offset);
			pointList.push(newPoint);
			var newPoint = new OpenLayers.Geometry.Point(extent.right - offset,extent.top - size - offset);
			pointList.push(newPoint);
			var newPoint = new OpenLayers.Geometry.Point(extent.right - size - offset,extent.top - offset);
			pointList.push(newPoint);
			pointList.push(pointList[0]);
			var linearRing = new OpenLayers.Geometry.LinearRing(pointList);
			var polygonFeature1 = new OpenLayers.Feature.Vector(
					new OpenLayers.Geometry.Polygon([linearRing]));

			var pointList = [];
			var newPoint = new OpenLayers.Geometry.Point(extent.right - offset,extent.bottom + offset);
			pointList.push(newPoint);
			var newPoint = new OpenLayers.Geometry.Point(extent.right - offset,extent.bottom + size + offset);
			pointList.push(newPoint);
			var newPoint = new OpenLayers.Geometry.Point(extent.right - size - offset,extent.bottom + offset);
			pointList.push(newPoint);
			pointList.push(pointList[0]);
			var linearRing = new OpenLayers.Geometry.LinearRing(pointList);
			var polygonFeature2 = new OpenLayers.Feature.Vector(
					new OpenLayers.Geometry.Polygon([linearRing]));

			var pointList = [];
			var newPoint = new OpenLayers.Geometry.Point(extent.left + offset,extent.top - offset);
			pointList.push(newPoint);
			var newPoint = new OpenLayers.Geometry.Point(extent.left + offset,extent.top - size - offset);
			pointList.push(newPoint);
			var newPoint = new OpenLayers.Geometry.Point(extent.left + size + offset,extent.top - offset);
			pointList.push(newPoint);
			pointList.push(pointList[0]);
			var linearRing = new OpenLayers.Geometry.LinearRing(pointList);
			var polygonFeature3 = new OpenLayers.Feature.Vector(
					new OpenLayers.Geometry.Polygon([linearRing]));

			var pointList = [];
			var newPoint = new OpenLayers.Geometry.Point(extent.left + offset,extent.bottom + offset);
			pointList.push(newPoint);
			var newPoint = new OpenLayers.Geometry.Point(extent.left + offset,extent.bottom + size + offset);
			pointList.push(newPoint);
			var newPoint = new OpenLayers.Geometry.Point(extent.left + size + offset,extent.bottom + offset);
			pointList.push(newPoint);
			pointList.push(pointList[0]);
			var linearRing = new OpenLayers.Geometry.LinearRing(pointList);
			var polygonFeature4 = new OpenLayers.Feature.Vector(
					new OpenLayers.Geometry.Polygon([linearRing]));
			extentFeatureLayer.addFeatures([polygonFeature1, polygonFeature2, polygonFeature3, polygonFeature4]);
			this.setLayerIndex(extentFeatureLayer, (this.layers.length -1));
		}

	};

	this.addMapBBox = function (mapObj) {
		//mapObj requires west, east, north, south
		//add or modify a layer with a vector representing the selected feature
		var featureLayer;

		var style_green = OpenLayers.Util.extend({}, OpenLayers.Feature.Vector.style['default']);
		style_green.strokeColor = "green";
		style_green.fillColor = "green";
		style_green.fillOpacity = .05;
		//style_green.pointRadius = 10;
		style_green.strokeWidth = 2;
		style_green.strokeLinecap = "butt";
		style_green.zIndex = 999;

		featureLayer = new OpenLayers.Layer.Vector(mapObj.title, {
			//style: style_green
		});
		this.addLayer(featureLayer);
		var bbox = mapObj.bbox.split(",");
		var bottomLeft = this.WGS84ToMercator(bbox[0], bbox[1]);
		var topRight = this.WGS84ToMercator(bbox[2], bbox[3]);

		if (bottomLeft.lon > topRight.lon) {
			var dateline = this.WGS84ToMercator(180,0).lon;
			var box1 = new OpenLayers.Feature.Vector(new OpenLayers.Bounds(bottomLeft.lon,bottomLeft.lat,dateline,topRight.lat).toGeometry());
			var box2 = new OpenLayers.Feature.Vector(new OpenLayers.Bounds(topRight.lon,topRight.lat,-1*dateline, bottomLeft.lat).toGeometry());
			featureLayer.addFeatures([box1, box2]);
		} else {
			var box = new OpenLayers.Feature.Vector(new OpenLayers.Bounds(bottomLeft.lon,bottomLeft.lat,topRight.lon,topRight.lat).toGeometry());
			featureLayer.addFeatures([box]);
		}
		this.setLayerIndex(featureLayer, (this.layers.length -1));
	};

	this.layerExists = function (mapObj) {
		//if layer is a Harvard one, send an ajax request to 
		//http://dixon.hul.harvard.edu:8080/HGL/RemoteServiceStarter?AddLayer=[layer name]&ValidationKey=OPENGEOPORTALROCKS
		//otherwise, do a wms describe layer to make sure the layer is there before
		//attempting to add it to the map (must be proxied).  handling wms errors is non-trivial, since,
		//by design, OpenLayers requires an error of type 'image' from the wms server
		//(OpenLayers is merely dynamically setting the src attribute of img tags)
		//console.log(mapObj);
		if (typeof mapObj.location.serviceStart != 'undefined'){
			var requestObj = {};
			requestObj.AddLayer = [mapObj.layerName];
			requestObj.ValidationKey = "OPENGEOPORTALROCKS";
			var params = {
					url: mapObj.location.serviceStart,
					dataType: "jsonp",
					data: requestObj,
					type: "GET",
					traditional: true,
					complete: function(){
						jQuery("body").trigger(mapObj.layerName + 'Exists');
					},
					statusCode: {
						200: function(){
							jQuery("body").trigger(mapObj.layerName + 'Exists');
						},
						500: function(){
							throw new Error("layer could not be added");
						}
					}
			};
			jQuery.ajax(params);
		} else {
			jQuery("body").trigger(mapObj.layerName + 'Exists');
		}
	};

	this.getPreviewUrlArray = function (location, useTilecache) {
		//is layer public or private? is this a request that can be handled by a tilecache?
		//is this a wms request? something to think about.  for now, we only support wms previews

		var urlArraySize = 3; //this seems to be a good size for OpenLayers performance
		var urlArray = [];
		var populateUrlArray = function(addressArray){
			if (addressArray.length == 1){
				for (var i=0; i < urlArraySize; i++){
					urlArray[i] = addressArray[0];
				}
			} else {
				urlArray = addressArray;
			}

		};

		if ((typeof location.wmsProxy != "undefined")||(location.wmsProxy != null)){
			populateUrlArray([location.wmsProxy]);
		} else if (((typeof location.tilecache == "undefined")||(location.tilecache == null))||(!useTilecache)){
			populateUrlArray(location.wms);
		} else {
			populateUrlArray(location.tilecache);
		}


		return urlArray;
	};

	this.addWMSLayer = function (mapObj) {
//		mapObj requires institution, layerName, title, datatype, access
		/*var bottomLeft = this.WGS84ToMercator(mapObj.west, mapObj.south);
	var topRight = this.WGS84ToMercator(mapObj.east, mapObj.north);
	var bounds = new OpenLayers.Bounds();
	bounds.extend(new OpenLayers.LonLat(bottomLeft.lon, bottomLeft.lat));
    bounds.extend(new OpenLayers.LonLat(topRight.lon, topRight.lat));
    console.log(bounds);
	 var box = new OpenLayers.Feature.Vector(bounds.toGeometry());
	 var featureLayer = new OpenLayers.Layer.Vector("BBoxTest");
	 featureLayer.addFeatures([box]);
	 this.addLayer(featureLayer);*/
		//use a tilecache if we are aware of it

		var wmsArray = this.getPreviewUrlArray(mapObj.location, true);

		//tilecache and GeoServer names are different for Harvard layers
		if (mapObj.institution == "Harvard"){
			mapObj.layerName = mapObj.layerName.substr(mapObj.layerName.indexOf(".") + 1);
			mapObj.layerName = mapObj.layerName.substr(mapObj.layerName.indexOf(":") + 1);
		}
		//won't actually do anything, since noMagic is true and transparent is true
		var format;
		if ((mapObj.dataType == "Raster")||(mapObj.dataType == "Paper Map")){
			format = "image/jpeg";
		} else {
			format = "image/png";
		}

//		if this is a raster layer, we should use jpeg format, png for vector (per geoserver docs)
		var newLayer = new OpenLayers.Layer.WMS( mapObj.title,
				wmsArray,
				{layers: mapObj.layerName,
			format: format, 
			tiled: true,
			exceptions: "application/vnd.ogc.se_inxml",
			transparent: true//,
			//version: "1.1.1"
				},
				{
					//buffer: 0,
					//gutter: 4,
					transitionEffect: 'resize',
					opacity: mapObj.opacity//,
					//displayOutsideMaxExtent: false//,
					//wrapDateLine: true
				});
		//how should this change? trigger custom events with jQuery
		newLayer.events.register('loadstart', newLayer, function() {OpenGeoportal.Utility.showLoadIndicator("mapLoadIndicator", newLayer.name);});
		newLayer.events.register('loadend', newLayer, function() {OpenGeoportal.Utility.hideLoadIndicator("mapLoadIndicator", newLayer.name);});
		var that = this;
		//we do a check to see if the layer exists before we add it
		jQuery("body").bind(mapObj.layerName + 'Exists', function(){that.addLayer(newLayer);});
		this.layerExists(mapObj);
	};

//	thanks to Allen Lin, MN
	this.addArcGISRestLayer = function (mapObj) {
		//won't actually do anything, since noMagic is true and transparent is true
		var format;
		if ((mapObj.dataType == "Raster")||(mapObj.dataType == "Paper Map")){
			format = "image/jpeg";
		} else {
			format = "image/png";
		}

//		if this is a raster layer, we should use jpeg format, png for vector (per geoserver docs)
		var newLayer = new OpenLayers.Layer.ArcGIS93Rest( mapObj.title,
				mapObj.location.ArcGISRest,
				{
			layers: "show:" + mapObj.layerName,
			transparent: true
				},
				{
					buffer: 0,
					transitionEffect: 'resize',
					opacity: mapObj.opacity
				});
		newLayer.projection = new OpenLayers.Projection("EPSG:3857");
		//how should this change? trigger custom events with jQuery
		newLayer.events.register('loadstart', newLayer, function() {OpenGeoportal.Utility.showLoadIndicator("mapLoadIndicator", newLayer.name);});
		newLayer.events.register('loadend', newLayer, function() {OpenGeoportal.Utility.hideLoadIndicator("mapLoadIndicator", newLayer.name);});
		var that = this;
		//we do a cursory check to see if the layer exists before we add it
		jQuery("body").bind(mapObj.layerName + 'Exists', function(){that.addLayer(newLayer);});
		this.layerExists(mapObj);
	};

	this.addOverview = function() {
		//add overview  options?
		//google maps api v3 seems to have broken this
		var overviewLayer = new OpenLayers.Layer.Google('Google Satellite',
				{type: google.maps.MapTypeId.SATELLITE});

		var overviewSize = new OpenLayers.Size();
		overviewSize.h = 100;
		overviewSize.w = 150;

		var overviewBounds = new OpenLayers.Bounds();
		overviewBounds.extend(new OpenLayers.LonLat(-2.003750834E7,-2.003750834E7));
		overviewBounds.extend(new OpenLayers.LonLat(2.003750834E7,2.003750834E7));
		var overviewOptions = {
				autoActivate: true,
				title: 'Overview window',
				//autoPan: true,
				mapOptions: { resolutions: [156543.03390625, 78271.516953125, 39135.7584765625, 19567.87923828125, 
				                            9783.939619140625, 4891.9698095703125, 2445.9849047851562, 1222.9924523925781, 
				                            611.4962261962891, 305.74811309814453, 152.87405654907226, 76.43702827453613, 
				                            38.218514137268066, 19.109257068634033, 9.554628534317017, 4.777314267158508, 
				                            2.388657133579254, 1.194328566789627, 0.5971642833948135, 0.29858214169740677, 
				                            0.14929107084870338, 0.07464553542435169],
				                            projection: new OpenLayers.Projection('EPSG:900913'),
				                            maxExtent: overviewBounds,
				                            units: "m"
				},
				layers: [overviewLayer],
				size: overviewSize
		};

		var overview = new OpenLayers.Control.OverviewMap(overviewOptions);
		return overview;
		//this.addControl(overview);

	};

	this.opacityHandler = function(){
		var that = this;
		jQuery(document).on("map.opacityChange", function(event, data){
			for (var i in that.getLayersByName(data.layerId)){
				that.getLayersByName(data.layerId)[0].setOpacity(data.opacity * .01);
			}
		});
	};

	this.previewLayerHandler = function(){
		var that = this;
		jQuery(document).on("previewLayerOn", function(event, data){
			that.previewLayerOn(data.layerObj);
		});
		
		jQuery(document).on("previewLayerOff", function(event, data){
			that.previewLayerOff(data.layerObj);
		});
	};
	
	this.styleChangeHandler = function(){
		var that = this;
		jQuery(document).on("map.styleChange", function(){
			that.changeStyle(layerId);
		});
	};

	this.changeStyle = function(layerId){
		var layer = this.getLayersByName(layerId)[0];
		if (typeof layer == 'undefined'){
			return;
		}

		var layerStateObject = this.layerState;
		var dataType = layerStateObject.getState(layerId, "dataType");
		var userSLD = {};
		//we need this for now, since the tilecache name and geoserver name for layers is different for Harvard layers
		var wmsName = layerStateObject.getState(layerId, "wmsName");
		var location = layerStateObject.getState(layerId, "location");
		//don't use a tilecache
		layer.url = this.getPreviewUrlArray(location, false);
		var userColor = layerStateObject.getState(layerId, "color");
		var userWidth = layerStateObject.getState(layerId, "graphicWidth");
		switch (dataType){
		case "Polygon":
			//for polygons
			userSLD.symbolizer = {};
			userSLD.symbolizer.Polygon = {};
			userSLD.symbolizer.Polygon.fill = true;
			userSLD.symbolizer.Polygon.fillColor = userColor;
			if (userWidth > 0){
				userSLD.symbolizer.Polygon.stroke = true;
				userSLD.symbolizer.Polygon.strokeWidth = userWidth;
				userSLD.symbolizer.Polygon.strokeColor = this.getBorderColor(userColor);
			}
			break;
		case "Point":
			//for points
			userSLD.symbolizer = {};
			userSLD.symbolizer.Point = {};
			userSLD.symbolizer.Point.fill = true;
			userSLD.symbolizer.Point.fillColor = userColor;
			userSLD.symbolizer.Point.graphicName = 'circle';
			userSLD.symbolizer.Point.pointRadius = userWidth;
			userSLD.symbolizer.Point.strokeWidth = 0;
			userSLD.symbolizer.Point.strokeColor = userColor;
			break;
		case "Line":
			//for lines	
			userSLD.symbolizer = {};
			userSLD.symbolizer.Line = {};
			userSLD.symbolizer.Line.stroke = true;
			userSLD.symbolizer.Line.strokeWidth = userWidth;
			userSLD.symbolizer.Line.strokeColor = userColor;
			break;
		default:
			return;
		}
		var layerUniqueInfo = userSLD;
		var arrSLD = [{wmsName: wmsName, layerStyle: layerUniqueInfo}];
		var newSLD = { layers: wmsName, sld_body: this.createSLDFromParams(arrSLD)};
		layer.mergeNewParams(newSLD);
		layerStateObject.setState(layerId, {"sld": layerUniqueInfo}); 
	};

	this.getBorderColor = function(fillColor){
		//calculate an appropriate border color
		var borderColor = {}; 
		borderColor.red = fillColor.slice(1,3);
		borderColor.green = fillColor.slice(3,5);
		borderColor.blue = fillColor.slice(5);
		for (var color in borderColor){
			//make the border color darker than the fill
			var tempColor = parseInt(borderColor[color], 16) - parseInt(0x50);
			if (tempColor < 0){
				//so we don't get any negative values for color
				tempColor = "00";
			} else {
				//convert to hex
				tempColor = tempColor.toString(16);
			}
			//check length;  the string should be 2 characters
			if (tempColor.length == 2){
				borderColor[color] = tempColor;
			} else if (tempColor.length == 1){
				borderColor[color] = '0' + tempColor;
			} else {
				borderColor[color] = '00';
			}
		}
		//reassemble the color string
		return "#" + borderColor.red + borderColor.green + borderColor.blue;
	};

	this.createSLDFromParams = function(arrUserParams){
		var userSLD = { namedLayers: []};
		for (var i in arrUserParams){
			var currentRule = new OpenLayers.Rule(arrUserParams[i].layerStyle);
			var currentStyle = new OpenLayers.Style("", {rules: [currentRule]});
			currentStyle = {
					name: arrUserParams[i].wmsName,
					userStyles: [currentStyle]
			};
			userSLD.namedLayers.push(currentStyle);
		}
		var newSLD = new OpenLayers.Format.SLD().write(userSLD);
		return newSLD;
	};

	this.hideLayer = function(layerId){
		var layer = this.getLayersByName(layerId)[0];
		layer.setVisibility(false);
	};

	this.showLayer = function(layerId){
		var layer = this.getLayersByName(layerId)[0];
		layer.setVisibility(true);
	};

	/**
	 * a property that stores the previous map extent, so that we can test to see if the extent has changed
	 */

	this.prevExtent = null;

	this.extentChanged = function(){
		var currentExtent = this.getExtent();
		var previous;
		if (typeof this.prevExtent == "object"){
			previous = this.prevExtent;
		} else {
			previous = new OpenLayers.Bounds(0,0,0,0);
		}
		//console.log("currentExtent:" + currentExtent);
		//console.log("previousExtent:" + previous);

		if ((previous.left != currentExtent.left)||
				(previous.right != currentExtent.right)||
				(previous.bottom != currentExtent.bottom)||
				(previous.top != currentExtent.top)){
			this.prevExtent = currentExtent;
			return true;
		} else {
			return false;
		}
	};

	this.getGeodeticExtent = function(){
		var mercatorExtent = this.getExtent();
		var sphericalMercator = new OpenLayers.Projection('EPSG:900913');
		var geodetic = new OpenLayers.Projection('EPSG:4326');
		return mercatorExtent.transform(sphericalMercator, geodetic);
	};

	
	this.getFeatureInfoHandler = function(){
		var that = this;
		jQuery(document).on("map.getFeatureInfoOn", function(event, data){
			console.log("map.getFeatureInfoOn");
			var layerId = data.layerId;
			console.log(layerId);
			var layers = that.getLayersByName(layerId);
			if (layers.length == 0){
				//layer is not in OpenLayers...
				throw new Error("This layer has not yet been previewed.  Please preview it first.");
			} else {
				that.events.register("click", layers[0], that.wmsGetFeature);
			}
		});
		jQuery(document).on("map.getFeatureInfoOff", function(event, data){
			var layerId = data.layerId;
			var layers = that.getLayersByName(layerId);
			if (layers.length == 0){
				//layer is not in OpenLayers...add it
			} else {
				that.events.unregister("click", layers[0], that.wmsGetFeature);
			}
		});
	};
	
	this.zoomToLayerExtentHandler = function(){
		var that = this;
		jQuery(document).on("map.zoomToLayerExtent", function(event, data){
			that.zoomToLayerExtent(data.bbox);
		});
	};
	
	this.zoomToLayerExtent = function(extent){
		var layerExtent = OpenLayers.Bounds.fromString(extent);
		var lowerLeft = this.WGS84ToMercator(layerExtent.left, layerExtent.bottom);
		var upperRight = this.WGS84ToMercator(layerExtent.right, layerExtent.top);

		var newExtent = new OpenLayers.Bounds();
		newExtent.extend(new OpenLayers.LonLat(lowerLeft.lon, lowerLeft.lat));
		newExtent.extend(new OpenLayers.LonLat(upperRight.lon, upperRight.lat));
		this.zoomToExtent(newExtent);

	};

	this.getCombinedBounds = function(arrBounds){
		function sortNumber(a, b){
			return a - b;
		}

		function inverseSortNumber(a, b){
			return b - a;
		}

		var arrLeft = [];
		var arrRight = [];

		var arrTop = [];
		var arrBottom = [];

		for (var currentIndex in arrBounds){
			var currentBounds = arrBounds[currentIndex];
			arrLeft.push(currentBounds.left);
			arrRight.push(currentBounds.right);
			arrTop.push(currentBounds.top);
			arrBottom.push(currentBounds.bottom);
		}
		var newExtent = new OpenLayers.Bounds();

		newExtent.left = arrLeft.sort(sortNumber)[0];
		newExtent.right = arrRight.sort(inverseSortNumber)[0];
		newExtent.top = arrTop.sort(inverseSortNumber)[0];
		newExtent.bottom = arrBottom.sort(sortNumber)[0];

		return newExtent;
	};

	this.getMaxLayerExtent = function getMaxLayerExtent(layerId){
		var layerStateObject = this.layerState;
		var bbox = layerStateObject.getState(layerId, "bbox");
		var arrBbox = bbox.split(",");
		var newExtent = new OpenLayers.Bounds();

		newExtent.left = arrBbox[0];
		newExtent.right = arrBbox[2];
		newExtent.top = arrBbox[3];
		newExtent.bottom = arrBbox[1];
		return newExtent;
	};

	this.boundsArrayToOLObject = function (arrBbox){
		var newExtent = new OpenLayers.Bounds();
		newExtent.left = arrBbox[0];
		newExtent.right = arrBbox[2];
		newExtent.top = arrBbox[3];
		newExtent.bottom = arrBbox[1];

		return newExtent;
	};

	this.getSpecifiedExtent = function getSpecifiedExtent(extentType, layerObj){
		//this code should be in mapDiv.js, since it has access to the openlayers object
		var extentArr = [];
		var maxExtentForLayers;
		if (extentType == "maxForLayers"){
			for (var layerId in layerObj){
				var arrBbox = layerObj[layerId].bounds;
				extentArr.push(this.boundsArrayToOLObject(arrBbox));
			}
			if (extentArr.length > 1){
				maxExtentForLayers = this.getCombinedBounds(extentArr).toBBOX();
			} else {
				maxExtentForLayers = extentArr[0].toBBOX();
			}
		}
		var extentMap = {"global": "-180,-85,180,85", "current": this.getGeodeticExtent().toBBOX(), 
				"maxForLayers": maxExtentForLayers};

		if(extentMap[extentType] != "undefined"){
			return extentMap[extentType];
		} else {
			throw new Exception('Extent type "' + extentType + '" is undefined.');
		}
	};
	
	
	/*****
	 * main preview functions
	 */
	
	  this.previewLayerOn = function(dataObj){
		  //TODO: if there's a problem, set preview to off, give hte user a notice
      	var location = null;
        	try {
        		location = jQuery.parseJSON(dataObj["Location"]);
        	} catch (err){
        		 new OpenGeoportal.ErrorObject(err,'Preview parameters are invalid.  Unable to Preview layer "' + dataObj["LayerDisplayName"] +'"');
        	}
        	
        	
        var layerId = dataObj["LayerId"]; 

	          //check the state obj to see if we need to do anything to the layer
	          //Get the data array for this row
	          //our layer id is being used as the openlayers layer name
  	    	var dataType = dataObj["DataType"];
  	    	var access = dataObj["Access"];
  	    	var institution = dataObj["Institution"];
  	    	var minLatitude = dataObj["MinY"];
  	    	var maxLatitude = dataObj["MaxY"];
  	    	var minLongitude = dataObj["MinX"];
  	    	var maxLongitude = dataObj["MaxX"];
  	    	var bbox = [];
  	    	bbox.push(minLongitude);
  	    	bbox.push(minLatitude);
  	    	bbox.push(maxLongitude);
  	    	bbox.push(maxLatitude);
  	    	bbox = bbox.join(",");

        	var georeferenced = dataObj["GeoReferenced"];

        	//check for a proxy here
        	var proxy = OpenGeoportal.InstitutionInfo.getWMSProxy(institution, access);
        	if (proxy){
        		location.wmsProxy = proxy;
        	}

	    	this.layerState.setState(layerId, {"location": location});
	    	this.layerState.setState(layerId, {"bbox": bbox});
	      	    
	      	    

	        //check to see if layer is on openlayers map, if so, show layer
	        var opacitySetting = this.layerState.getState(layerId, "opacity");
	        
	        if (this.getLayersByName(layerId)[0]){
	            	this.showLayer(layerId);
	            	this.getLayersByName(layerId)[0].setOpacity(opacitySetting * .01);
	        } else{
	            	//use switching logic here to allow other types of layer preview besides wms

	            	var layerName = dataObj["Name"];
	            	var wmsNamespace = dataObj["WorkspaceName"];
	            	var availability = dataObj["Availability"];
	            	/*if (!georeferenced){
	            		//code to handle ungeoreferenced layers
	            	}*/
	            	var mapObj = {"institution": institution, "layerName": layerName, "title": layerId, 
	            			"bbox": bbox, "dataType": dataType, "opacity": opacitySetting *.01, "access": access, "location": location};
	            	//should have some sort of method to determine preview type based on location field
	            	if (availability.toLowerCase() == "online"){
	            		if (typeof location.wms != "undefined"){
	            			if ((wmsNamespace.length > 0)
	            				&&(layerName.indexOf(":") == -1)){
	            				layerName = wmsNamespace + ":" + layerName;
	            			}
	            			mapObj.layerName = layerName;
	            			this.addWMSLayer(mapObj);
	            			//this should be triggered when layer load is complete
	            			//jQuery(thisObj).attr('title', hideLayerText);
	            			this.layerState.setState(layerId, {"dataType": dataType, "wmsName": layerName});
	            		} else if (typeof location.ArcGISRest != "undefined"){
							this.addArcGISRestLayer({"institution": institution, "layerName": layerName, "title": layerId, 
		            			"west": minLongitude, "south": minLatitude, "east": maxLongitude, "north": maxLatitude, 
		            			"dataType": dataType, "opacity": opacitySetting *.01, "access": access, "location": location});
		            		//this should be triggered when layer load is complete
		            		//jQuery(thisObj).attr('title', hideLayerText);
		            		this.layerState.setState(layerId, {"dataType": dataType, "wmsName": layerName});
						} else {
	            			throw new Error("This layer is currently not previewable.");
	            		}
	            	} else if (availability.toLowerCase() == "offline"){
	            		//try to preview bounds
	            		//console.log(mapObj);
	            		this.addMapBBox(mapObj);
	            		this.layerState.setState(layerId, {"dataType": dataType, "wmsName": layerName});
	            	}
	            }
	           // this.addToPreviewedLayers(rowData.node);
	            //analytics.track("Layer Previewed", institution, layerId);
	            //console.log(this);
	  };
	  
	  this.previewLayerOff = function(dataObj){
	        	try {
	        		//layer id is being used as the openlayers layer name
	        		this.hideLayer(dataObj.LayerId);

	        		//does it make sense to institute a timer here?....if layer is not used w/in x min, 
	        		//remove from the map.
	        		//this.previewedLayers.removeLayer(layerId, index);

	        	} catch (err) {
	        		new OpenGeoportal.ErrorObject(err, "Error turning off preview.");
	        	}
	  };

};
//set inheritance for MapController
OpenGeoportal.MapController.prototype = Object.create(OpenLayers.Map.prototype);
