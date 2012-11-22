/**

 * This javascript module includes functions for dealing with the map Div
 * defined under the object MapController.  MapController inherits from
 * the OpenLayers.Map object
 * 
 * @author Chris Barnett
 */

if (typeof org == 'undefined'){ 
	org = {};
} else if (typeof org != "object"){
	throw new Error("org already exists and is not an object");
}

// Repeat the creation and type-checking code for the next level
if (typeof org.OpenGeoPortal == 'undefined'){
	org.OpenGeoPortal = {};
} else if (typeof org.OpenGeoPortal != "object"){
    throw new Error("org.OpenGeoPortal already exists and is not an object");
}

//some code to test presence of OpenLayers, check version?

//MapDiv Constructor
org.OpenGeoPortal.MapController = function(userDiv, userOptions) {	
	//set default for the name of the map div
	if ((typeof userDiv == 'undefined')||(userDiv.length == 0)){
		userDiv = 'geoportalMap';
	}
	
	this.userDiv = userDiv;
	this.layerStateObject = org.OpenGeoPortal.layerState;
	this.config = org.OpenGeoPortal.InstitutionInfo;
	this.userMapAction = false;
	
	//set default OpenLayers map options
	var nav = new OpenLayers.Control.NavigationHistory({nextOptions: {title: "Zoom to next geographic extent"}, previousOptions:{title: "Zoom to previous geographic extent"}});
    var zoomBox = new OpenLayers.Control.ZoomBox(
            {title:"Click or draw rectangle on map to zoom in"});
    var panHand = new OpenLayers.Control.Navigation(
            {title:"Pan by dragging the map"});
    var globalExtent = new OpenLayers.Control.ZoomToMaxExtent({title:"Zoom to global extent"});
    var panel = new OpenLayers.Control.Panel({defaultControl: panHand});
    var that = this;
    var clearMap = new OpenLayers.Control.Button({
        displayClass: "mapClearButton", trigger: function(){that.clearMap();},
        type: OpenLayers.Control.TYPE_BUTTON,
        title: "Clear the map", active: true
    });
    
    panel.addControls([
                       globalExtent,
                       nav.previous,
                       nav.next,
                       zoomBox,
                       panHand,
                       clearMap
        ]);
    //display mouse coords in lon-lat
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
                       nav,
                       panel]
    	};

	//merge default options and user specified options into 'options'--not recursive
	jQuery.extend(userOptions, options);
	//div defaults to 0 height for certain doc-types
	jQuery('#' + userDiv).height("100%");
	//jQuery("#map").height(512);
	//call OpenLayers.Map with function arguments

    // attempt to reload tile if load fails
    OpenLayers.IMAGE_RELOAD_ATTEMPTS = 3;
    OpenLayers.ImgPath = "/resources/media/"
    // make OL compute scale according to WMS spec
    //OpenLayers.DOTS_PER_INCH = 90.71428571428572;
    OpenLayers.Util.onImageLoadErrorColor = 'transparent';
    var that = this;
	OpenLayers.Map.call(this, "ogpMap", options);
	//default background map
	this.setBackgroundMap();

    var center = this.WGS84ToMercator(0, 0);
	//set map position
	this.setCenter(center);

	//register events
	jQuery('#' + userDiv).resize(function () {that.updateSize();});

	/*this.events.registerPriority('click', this, function(){
		console.log("click");
		that.userMapAction = true;
	});*/
	
	/*this.events.registerPriority('dblclick', this, function(){
		console.log("dblclick");
		that.userMapAction = true;
	});
	this.events.registerPriority('drag', this, function(){
		console.log("drag");
		that.userMapAction = true;
	});
	
	this.events.registerPriority('dragstart', this, function(){
		console.log("drag");
		that.userMapAction = true;
	});
	
	this.events.registerPriority('dragend', this, function(){
		console.log("drag");
		that.userMapAction = true;
	});*/
	
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
		var containerHeight = jQuery('#container').height();
		if (mapHeight > containerHeight){
			mapHeight = containerHeight;
		}

		if (jQuery("#map").height() != mapHeight){
			jQuery("#map").height(mapHeight);//calculate min and max sizes
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

	this.currentAttributeRequest = false;
	this.prevExtent = this.getExtent();
	//console.log("rendered");
};

//set inheritance for MapController
org.OpenGeoPortal.MapController.prototype = new OpenLayers.Map();

//method to set background map
org.OpenGeoPortal.MapController.prototype.getOsmTileUrl = function getOsmTileUrl(bounds) {
    var res = this.map.getResolution();
    var x = Math.round((bounds.left - this.getMaxExtent().left) / (res * this.tileSize.w));
    var y = Math.round((this.getMaxExtent().top - bounds.top) / (res * this.tileSize.h));
    var z = this.map.getZoom() + 1;
    var limit = Math.pow(2, z);

    if (y < 0 || y >= limit) {
    	//console.log["ol 404"];
        return org.OpenGeoPortal.Utility.getImage("404.png");
    } else {
        x = ((x % limit) + limit) % limit;
        //console.log([this.url, this.type]);
        return this.url + z + "/" + x + "/" + y + "." + this.type;
    }
};

org.OpenGeoPortal.MapController.prototype.getBackgroundType = function() {
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

org.OpenGeoPortal.MapController.prototype.backgroundMaps = function(mapType){
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

org.OpenGeoPortal.MapController.prototype.getCurrentBackgroundMap = function(){
	if (typeof google != "undefined"){
		return this.currentBackgroundMap;
	} else{
		return "osm";
	}
};

org.OpenGeoPortal.MapController.prototype.currentBackgroundMap = "googlePhysical"; //default background map

org.OpenGeoPortal.MapController.prototype.setCurrentBackgroundMap = function(bgType){
	try {
		this.backgroundMaps(bgType);
		this.currentBackgroundMap = bgType;
	} catch (e) {
		throw new Error("This background type does not exist: "+ bgType);
	}
};

org.OpenGeoPortal.MapController.prototype.setBackgroundMap = function(bgType) {
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

org.OpenGeoPortal.MapController.prototype.changeBackgroundMap = function(bgType){
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
				  that.render(that.userDiv);
					jQuery(".mapClearButtonItemInactive").text("clear previews");
					that.userMapAction = true;
					//really should only fire the first time
					google.maps.event.clearListeners(bgMap.mapObject, "tilesloaded");
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
				  that.render(that.userDiv);
					jQuery(".mapClearButtonItemInactive").text("clear previews");
					that.userMapAction = true;
					//really should only fire the first time
					bgMap.events.unregister(bgMap.mapObject, "loadend");
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

//utility functions
org.OpenGeoPortal.MapController.prototype.WGS84ToMercator = function (lon, lat){
	//returns -infinity for -90.0 lat; a bug?
	lat = parseFloat(lat);
	lon = parseFloat(lon);
	if (lat > 90){
		lat = 90;
	}
	if (lat < -90){
		lat = -90;
	}
	if (lon > 180){
		lon = 180;
	}
	if (lon < -180){
		lon = -180;
	}
	//console.log([lon, "tomercator"])
	return OpenLayers.Layer.SphericalMercator.forwardMercator(lon, lat);
};

org.OpenGeoPortal.MapController.prototype.MercatorToWGS84 = function (lon, lat) {
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

org.OpenGeoPortal.MapController.prototype.returnExtent = function(){
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
	
//method to clear the map while keeping the base layer
org.OpenGeoPortal.MapController.prototype.clearMap = function (){
	org.OpenGeoPortal.PreviewedLayers.clearLayers();
	var mapLayers = this.layers;
	for (var i in mapLayers){
		var currentLayer = mapLayers[i];
		if ((currentLayer.CLASS_NAME != 'OpenLayers.Layer.Google')&&
				(currentLayer.name != 'OpenStreetMap')&&
				(currentLayer.name != 'layerBBox')){
			//remove the layer from the map
			currentLayer.setVisibility(false);
			//we'll also need to update the state of buttons and the layer state object
			this.layerStateObject.setState(currentLayer.name, {"preview": "off", "getFeature": false});
		} else {
			continue;
		}
	}
};

org.OpenGeoPortal.MapController.prototype.getAttributeDescription = function (thisObj, layerId) {
	//no need to make the call if the title attribute has already been set
	if (!jQuery(thisObj).attr('title')){
		var solr = new org.OpenGeoPortal.Solr();
		var query = solr.getMetadataQuery(layerId);
		jQuery(".attributeName").css("cursor", "wait");
		solr.sendToSolr(query, this.getAttributeDescriptionJsonpSuccess, this.getAttributeDescriptionJsonpError, thisObj);
	}
};

org.OpenGeoPortal.MapController.prototype.getAttributeDescriptionJsonpSuccess = function(data, thisObj) {
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
				  attributeDescription = org.OpenGeoPortal.Utility.stripExtraSpaces(attributeDescription.text().trim());
				  if (attributeDescription.length == 0){
					  attributeDescription = "No description available";
				  }
				  jQuery(this).attr('title', attributeDescription);
				  return;
			  }
		  });
	  });
};

org.OpenGeoPortal.MapController.prototype.getAttributeDescriptionJsonpError = function () {
	jQuery(".attributeName").css("cursor", "default");
	throw new Error("The attribute description could not be retrieved.");
};

org.OpenGeoPortal.MapController.prototype.wmsGetFeature = function(e){
	//since this is an event handler, the context isn't the MapController Object
	if (typeof this.map != "undefined"){
	var mapObject = this.map;
	var layerStateObject = mapObject.layerStateObject;
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
	var layerID = this.name;
	var searchString = "OGPID=" + layerID;
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
            	var featureLayer;
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
            error: function(jqXHR, textStatus, errorThrown) {if ((jqXHR.status != 401)&&(textStatus != 'abort')){new org.OpenGeoPortal.ErrorObject(new Error(), "Error retrieving Feature Information.");}},
            complete: function(){that.map.currentAttributeRequest = false;            	
            	jQuery(document).trigger("hideLoadIndicator");}
    };
    
    if (typeof this.map.currentAttributeRequest == 'object'){
    	this.map.currentAttributeRequest.abort();
    } 
    this.map.currentAttributeRequest = jQuery.ajax(ajaxParams);
    jQuery(document).trigger("showLoadIndicator");
	} else {
		new org.OpenGeoPortal.ErrorObject(new Error(), "This layer has not been previewed. <br/>You must preview it before getting attribute information.");
	}
};


//methods to add layers

org.OpenGeoPortal.MapController.prototype.hideLayerBBox = function () {
	if (this.getLayersByName("layerBBox").length > 0){
		var featureLayer = this.getLayersByName("layerBBox")[0];
		//featureLayer.destroy();
		featureLayer.removeAllFeatures();
	}
};

org.OpenGeoPortal.MapController.prototype.showLayerBBox = function (mapObj) {
	//mapObj requires west, east, north, south
	//add or modify a layer with a vector representing the selected feature
	var featureLayer;
	if (this.getLayersByName("layerBBox").length > 0){
		featureLayer = this.getLayersByName("layerBBox")[0];
		featureLayer.removeAllFeatures();
	} else {
        var style_blue = OpenLayers.Util.extend({}, OpenLayers.Feature.Vector.style['default']);
        style_blue.strokeColor = "blue";
        style_blue.fillColor = "blue";
        style_blue.fillOpacity = .05;
        style_blue.pointRadius = 10;
        style_blue.strokeWidth = 2;
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
};

org.OpenGeoPortal.MapController.prototype.addMapBBox = function (mapObj) {
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

org.OpenGeoPortal.MapController.prototype.layerExists = function (mapObj) {
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

org.OpenGeoPortal.MapController.prototype.getPreviewUrlArray = function (location, useTilecache) {
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

org.OpenGeoPortal.MapController.prototype.addWMSLayer = function (mapObj) {
//mapObj requires institution, layerName, title, datatype, access
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

//if this is a raster layer, we should use jpeg format, png for vector (per geoserver docs)
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
    newLayer.events.register('loadstart', newLayer, function() {org.OpenGeoPortal.Utility.showLoadIndicator("mapLoadIndicator", newLayer.name);});
    newLayer.events.register('loadend', newLayer, function() {org.OpenGeoPortal.Utility.hideLoadIndicator("mapLoadIndicator", newLayer.name);});
	var that = this;
	//we do a check to see if the layer exists before we add it
	jQuery("body").bind(mapObj.layerName + 'Exists', function(){that.addLayer(newLayer);});
	this.layerExists(mapObj);
};

org.OpenGeoPortal.MapController.prototype.addOverview = function() {
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

org.OpenGeoPortal.MapController.prototype.changeStyle = function(layerID, dataType){
	var layer = this.getLayersByName(layerID)[0];
	if (typeof layer == 'undefined'){
		return;
	}

	var userSLD = {};
	var layerStateObject = this.layerStateObject;
	//we need this for now, since the tilecache name and geoserver name for layers is different for Harvard layers
	var wmsName = layerStateObject.getState(layerID, "wmsName");
	var location = layerStateObject.getState(layerID, "location");
	//don't use a tilecache
	layer.url = this.getPreviewUrlArray(location, false);
	var userColor = layerStateObject.getState(layerID, "color");
	var userWidth = layerStateObject.getState(layerID, "graphicWidth");
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
    layerStateObject.setState(layerID, {"sld": layerUniqueInfo}); 
};

org.OpenGeoPortal.MapController.prototype.getBorderColor = function(fillColor){
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

org.OpenGeoPortal.MapController.prototype.createSLDFromParams = function(arrUserParams){
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

org.OpenGeoPortal.MapController.prototype.hideLayer = function(layerID){
	var layer = this.getLayersByName(layerID)[0];
	layer.setVisibility(false);
};

org.OpenGeoPortal.MapController.prototype.showLayer = function(layerID){
	var layer = this.getLayersByName(layerID)[0];
	layer.setVisibility(true);
};

/**
 * a property that stores the previous map extent, so that we can test to see if the extent has changed
 */

org.OpenGeoPortal.MapController.prototype.prevExtent = null;

org.OpenGeoPortal.MapController.prototype.extentChanged = function(){
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

org.OpenGeoPortal.MapController.prototype.getGeodeticExtent = function(){
	var mercatorExtent = this.getExtent();
	var sphericalMercator = new OpenLayers.Projection('EPSG:900913');
	var geodetic = new OpenLayers.Projection('EPSG:4326');
	return mercatorExtent.transform(sphericalMercator, geodetic);
};

org.OpenGeoPortal.MapController.prototype.zoomToLayerExtent = function(extent){
	var layerExtent = OpenLayers.Bounds.fromString(extent);
	var lowerLeft = this.WGS84ToMercator(layerExtent.left, layerExtent.bottom);
	var upperRight = this.WGS84ToMercator(layerExtent.right, layerExtent.top);

	var newExtent = new OpenLayers.Bounds();
	newExtent.extend(new OpenLayers.LonLat(lowerLeft.lon, lowerLeft.lat));
	newExtent.extend(new OpenLayers.LonLat(upperRight.lon, upperRight.lat));
	this.zoomToExtent(newExtent);

};

org.OpenGeoPortal.MapController.prototype.getCombinedBounds = function(arrBounds){
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

org.OpenGeoPortal.MapController.prototype.getMaxLayerExtent = function getMaxLayerExtent(layerID){
	var layerStateObject = this.layerStateObject;
	var bbox = layerStateObject.getState(layerID, "bbox");
	var arrBbox = bbox.split(",");
	var newExtent = new OpenLayers.Bounds();

	newExtent.left = arrBbox[0];
	newExtent.right = arrBbox[2];
	newExtent.top = arrBbox[3];
	newExtent.bottom = arrBbox[1];
	return newExtent;
};

org.OpenGeoPortal.MapController.prototype.boundsArrayToOLObject = function (arrBbox){
	var newExtent = new OpenLayers.Bounds();
	newExtent.left = arrBbox[0];
	newExtent.right = arrBbox[2];
	newExtent.top = arrBbox[3];
	newExtent.bottom = arrBbox[1];
	
	return newExtent;
};

org.OpenGeoPortal.MapController.prototype.getSpecifiedExtent = function getSpecifiedExtent(extentType, layerObj){
	//this code should be in mapDiv.js, since it has access to the openlayers object
	var extentArr = [];
	var maxExtentForLayers;
	if (extentType == "maxForLayers"){
		for (var layerID in layerObj){
			var arrBbox = layerObj[layerID].bounds;
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