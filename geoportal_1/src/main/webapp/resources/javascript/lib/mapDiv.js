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
OpenGeoportal.MapController = function() {	

	this.previewed = OpenGeoportal.ogp.appState.get("previewed");
	this.template = OpenGeoportal.ogp.appState.get("template");
	
	this.config = OpenGeoportal.InstitutionInfo;
	
	var analytics = new OpenGeoportal.Analytics();
		

	this.createMap = function(containerDiv, userOptions){
		//set default for the name of the map div
		if ((typeof containerDiv == 'undefined')||(containerDiv.length == 0)){
			throw new Error("The id of the map div must be specified.");
		}
		this.containerDiv = containerDiv;
		this.createMapHtml(containerDiv);
		
		try {
			this.createOLMap(userOptions);
		} catch (e){
			console.log("problem creating ol map");
			console.log(e);
		}
		
		this.initMap();

		try {
		this.registerMapEvents();
		} catch (e){
			console.log("problem registering map events");
			console.log(e);
		}
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
		var that = this;
		var zoomBoxListener = function(){
				jQuery('.olMap').css('cursor', "-moz-zoom-in");
				that.previewed.clearGetFeature();
			};
		zoomBox.events.register("activate", this, zoomBoxListener);
		var panListener = function(){
				jQuery('.olMap').css('cursor', "-moz-grab");
				that.previewed.clearGetFeature();
			};
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
	
		var initialZoom = 1;
		
		if (jQuery('#' + this.containerDiv).parent().height() > 896){
			initialZoom = 2;
			//TODO: this should be more sophisticated.  width is also important
			//initialZoom = Math.ceil(Math.sqrt(Math.ceil(jQuery('#' + this.containerDiv).parent().height() / 256)));
		}
		var options = {
				allOverlays: true,
				projection: new OpenLayers.Projection("EPSG:900913"),
				maxResolution: 2.8125,
				maxExtent: mapBounds,
				units: "m",
				zoom: initialZoom,
				controls: [new OpenLayers.Control.ModPanZoomBar(),
				           new OpenLayers.Control.ScaleLine(),
				           displayCoords,
				           //nav,
				           this.createDefaultOLPanel()]
		};

		//merge default options and user specified options into 'options'--not recursive
		jQuery.extend(userOptions, options);
		//div defaults to 0 height for certain doc-types; we want the map to fill the parent container
		jQuery('#' + this.mapDiv).height("512px");

		//call OpenLayers.Map with function arguments

		// attempt to reload tile if load fails
		OpenLayers.IMAGE_RELOAD_ATTEMPTS = 3;
		OpenLayers.ImgPath = "resources/media/";
			// make OL compute scale according to WMS spec
			//OpenLayers.DOTS_PER_INCH = 90.71428571428572;
		OpenLayers.Util.onImageLoadErrorColor = 'transparent';
		
		OpenLayers.Map.call(this, "ogpMap", options);	
	};

	this.initMap = function (){
		//default background map
		this.basemaps = this.createBaseMaps();
		var defaultBasemapModel = this.basemaps.findWhere({name: "googlePhysical"});
		this.setBasemap(defaultBasemapModel);
		defaultBasemapModel.get("initialRenderCallback").apply(defaultBasemapModel, [this]);
		var that = this;
		this.basemaps.listenTo(this.basemaps, 'change:selected', function(model){that.setBasemap(model);});

		try{
		var center = this.WGS84ToMercator(0, 0);
		//set map position
		this.setCenter(center);	
		
		this.addMapToolbarButton({displayClass: "saveImageButton", title: "Save map image", buttonText: "Save Image"}, this.saveImage);
		this.addMapToolbarButton({displayClass: "printButton", title: "Print map", buttonText: "Print"}, OpenGeoportal.Utility.doPrint);
		this.addToMapToolbar(this.template.basemapMenu());
		this.basemapMenu = new OpenGeoportal.Views.CollectionSelect({
										collection: this.basemaps, 
										el: "div#basemapMenu",
										valueAttribute: "name",
										displayAttribute: "displayName",
										buttonLabel: "Basemap",
										itemClass: "baseMapMenuItem"
										});
		jQuery(".olMap").find("[id*=event]").addClass("shadowDown").addClass("shadowRight");
		} catch (e){
			console.log("problem creating basemap menu?");
			console.log(e);
		}
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
			var maxZoom = that.basemaps.findWhere({selected: true}).get("zoomLevels");
			if (zoomLevel >= (maxZoom - 1)){
				that.basemaps.findWhere({name: "googleHybrid"}).set({selected: true});
				that.zoomTo(that.getZoom());
			} else {
				/*if (that.getBackgroundType() !== that.getCurrentBackgroundMap()){
					that.changeBackgroundMap(that.getCurrentBackgroundMap());
				}*/
			}
			var mapHeight = Math.pow((zoomLevel + 1), 2) / 2 * 256;
			var containerHeight = jQuery("#" + that.mapDiv).parent().parent().height();
			if (mapHeight > containerHeight){
				mapHeight = containerHeight;
			}

			if (jQuery("#" + that.mapDiv).height() != mapHeight){
				jQuery("#" + that.mapDiv).height(mapHeight);//calculate min and max sizes
				that.updateSize();
			}
			if (zoomLevel == 0){
				that.setCenter(that.WGS84ToMercator(that.getCenter().lon, 0));
			} 
			//console.log('zoomend');
			jQuery(document).trigger('eventZoomEnd');
		});

		this.events.register('moveend', this, function(){
			console.log("moveend");
			var newExtent = that.getSearchExtent();
			console.log(newExtent);
			//TODO: move this to the map object, register the map object in app state
			//that.appState.set({mapExtent: newExtent});
			jQuery(document).trigger('map.extentChanged', {mapExtent: newExtent});
		});

		this.bboxHandler();
		this.styleChangeHandler();
		this.opacityHandler();
		this.zoomToLayerExtentHandler();
		this.previewLayerHandler();
		this.getFeatureInfoHandler();
		this.geocodeLocation();
		this.clearLayersHandler();
		this.attributeDescriptionHandler();
	};

	this.mouseCursorHandler = function(){
		var that = this;
		jQuery('.olMap').css('cursor', "-moz-grab");
		jQuery(document).bind('zoomBoxActivated', function(){
			/*
			var mapLayers = that.mapObject.layers;
			for (var i in mapLayers){
				var currentLayer = mapLayers[i];
				if (layerStateObject.layerStateDefined(currentLayer.name)){
					if (layerStateObject.getState(currentLayer.name, "getFeature")){
						//that.mapObject.events.unregister("click", currentLayer, that.mapObject.wmsGetFeature);
						layerStateObject.setState(currentLayer.name, {"getFeature": false});
					}
				} else {
					continue;
				}
			}*/
			
			//jQuery('.attributeInfoControl').attr('src', that.utility.getImage('preview.gif'));
		});
		
		jQuery(document).bind('panActivated', function(){

			//jQuery('.attributeInfoControl').attr('src', that.utility.getImage('preview.gif'));
		});
	};

	this.clearLayersHandler = function(){
		var that = this;
				//TODO: this should be in the previewed layers view.  clearing the map should update the previewed layers collection, which triggers
		//removal from the map.
		var mapClear$ = jQuery("#mapClearButton");
		mapClear$.button();
		mapClear$.on("click", function(event){
			//alert("button clicked");
			console.log(event);
			that.clearMap();}
		);
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
	
	this.addToMapToolbar = function(markup){
		jQuery("#ogpMapButtons").append(markup);
	};
	
	this.addMapToolbarButton = function(displayParams, callbackHandler){
		this.addToMapToolbar(this.template.mapButton(displayParams));
		var that = this;
		jQuery("." + displayParams.displayClass).button().on("click", function(){callbackHandler.call(that);});
	};
	

	//default text for the geocoder input box
	this.geocodeText = "Find Place (Example: Boston, MA)";
	/**
	 * geocodes the value typed into the geocoder text input using the Google maps geocoder,
	 * then zooms to the returned extent.  also animates the response
	 */
	this.geocodeLocation = function(){
		var geocodeField$ = jQuery("#geosearch");
		var geocoder = new google.maps.Geocoder();
		var that = this;
		var geocodeResponse = {};
		geocodeField$.autocomplete({
			source: function( request, response ) {
				geocoder.geocode( { 'address': request.term}, function(results, status) {
					/*
					 * 
    "OK" indicates that no errors occurred; the address was successfully parsed and at least one geocode was returned.
    "ZERO_RESULTS" indicates that the geocode was successful but returned no results. This may occur if the geocode was passed a non-existent address or a latlng in a remote location.
    "OVER_QUERY_LIMIT" indicates that you are over your quota.
    "REQUEST_DENIED" indicates that your request was denied, generally because of lack of a sensor parameter.
    "INVALID_REQUEST" generally indicates that the query (address or latlng) is missing.
    UNKNOWN_ERROR indicates that the request could not be processed due to a server error. The request may succeed if you try again.

					 */
					if (status !== "OK"){
						return;
					}
					//reset the response object
					geocodeResponse = {};
					var labelArr = [];
					for (var i in results){
						var viewPort = results[i].geometry.viewport;
						var extent = [];
						extent.push(viewPort.getSouthWest().lng());
						extent.push(viewPort.getSouthWest().lat());
						extent.push(viewPort.getNorthEast().lng());
						extent.push(viewPort.getNorthEast().lat());

						var bbox = extent.join();
						var currentAddress = results[i].formatted_address;
						geocodeResponse[currentAddress] = bbox;
						labelArr.push(currentAddress);

					}
					response(labelArr);
				});
			},
			minLength: 4,
			delay: 1000,
			select: function( event, ui ) {

				jQuery(document).trigger("map.zoomToLayerExtent", {"bbox": geocodeResponse[ui.item.value]});

				var currentFontSize = geocodeField$.css("font-size");
				var currentOpacity = geocodeField$.css("opacity");
				geocodeField$.animate({"opacity": 1, "font-size": parseInt(currentFontSize) + 2}, 500)
					.delay(1500)
					.animate({ "font-size": 0 }, 300, function(){geocodeField$.val(that.geocodeText).css({"font-size": currentFontSize, "opacity": currentOpacity});});
			},

			open: function() {
				jQuery( this ).removeClass( "ui-corner-all" ).addClass( "ui-corner-top" );
			},
			close: function() {
				jQuery( this ).removeClass( "ui-corner-top" ).addClass( "ui-corner-all" );
			}
		}
		);
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
			var layerModel = this.previewed.findWhere({LayerId: currentLayer.ogpLayerId});
			if (typeof layerModel == "undefined"){
				throw new Error("Layer ['" + currentLayer.ogpLayerId + "'] could not be found in the PreviewedLayers collection.");
			}
			var sld = layerModel.get("sld");
			var opacity = layerModel.get("opacity");
			if (opacity == 0){
				continue;
			}
			//insert this opacity value into the sld to pass to the wms server
			var layerObj = {};
			var storedName = layerModel.get("qualifiedName");
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
			layerObj.layerId = layerModel.get("LayerId");
			requestObj.layers.push(layerObj);
		}
		console.log(this);
		var bbox = this.getVisibleExtent().toBBOX();
		
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
				}
		};

		jQuery.ajax(params);
	};
	

	
	/**
	 * sets the background map to the value in the background map dropdown menu.  called by change for the basemap radio button set
	 */
	/*this.basemapHandler = function(){
		var that = this;
		jQuery("[name=basemapRadio]").on("change", function(){
			var value = jQuery('input:radio[name=basemapRadio]:checked').val();
			that.basemaps.findWhere({name: value}).set({selected: true});
		});
	};*/
	
/*	this.getBackgroundType = function() {
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
*/
	this.createBaseMaps = function(){
		var that = this;
		var models = [];
		models.push({
			displayName: "Google Physical",
			name: "googlePhysical",
			selected: true,
			subType: google.maps.MapTypeId.TERRAIN,
			type: "Google",
			zoomLevels: 15,
			getLayerDefinition: function(){
				console.log("layer definition arguments");
				console.log(arguments);
				var bgMap = new OpenLayers.Layer.Google(
					this.get("displayName"),
					{
						type: this.get("subType")
					},
					{
						layerRole: "basemap",
						animationEnabled: true,
						basemapType: this.get("subType") 
					}
					);
				return bgMap;
				},
			showOperations: function(layer){
				layer.mapObject.setMapTypeId(this.get("subType"));
				layer.type = this.get("subType");
				layer.setVisibility(true);
				jQuery("div.olLayerGooglePoweredBy").children().css("display", "block");	
			},
			hideOperations: function(layer){
				layer.setVisibility(false);
				jQuery("div.olLayerGooglePoweredBy").children().css("display", "none");	
			},
			initialRenderCallback: function(mapController){
				console.log("mapcontroller");
				console.log(mapController);
				console.log(this.get("subType"));
				var bgMap = mapController.getLayersBy("type", this.get("subType"))[0];
				console.log(bgMap);
				google.maps.event.addListener(bgMap.mapObject, "tilesloaded", function() {
					//console.log("Tiles loaded");
					mapController.render(mapController.mapDiv);
					jQuery(document).trigger("mapReady");
					//really should only fire the first time
					google.maps.event.clearListeners(bgMap.mapObject, "tilesloaded");
					jQuery("#geoportalMap").fadeTo("slow", 1);

				});
			}
		});
		
		models.push({
			displayName: "Google Hybrid",
			name: "googleHybrid",
			selected: false,
			subType: google.maps.MapTypeId.HYBRID,
			type: "Google",
			zoomLevels: 22,
			getLayerDefinition: function(){
				var bgMap = new OpenLayers.Layer.Google(
					this.get("displayName"),
					{
						basemapType: this.get("subType"),
						layerRole: "basemap",
						animationEnabled: true
					}
					);
				return bgMap;
				},
			showOperations: function(layer){
				layer.mapObject.setMapTypeId(this.get("subType"));
				layer.type = this.get("subType");
				layer.setVisibility(true);
				jQuery("div.olLayerGooglePoweredBy").children().css("display", "block");	
			},
			hideOperations: function(layer){
				layer.setVisibility(false);
				jQuery("div.olLayerGooglePoweredBy").children().css("display", "none");	
			},
			initialRenderCallback: function(mapController){
				var bgMap = mapController.getLayersByName(this.get("name"))[0];
				google.maps.event.addListener(bgMap.mapObject, "tilesloaded", function() {
					//console.log("Tiles loaded");
					mapController.render(mapController.mapDiv);
					jQuery(document).trigger("mapReady");
					//really should only fire the first time
					google.maps.event.clearListeners(bgMap.mapObject, "tilesloaded");
					jQuery("#geoportalMap").fadeTo("slow", 1);

				});
			}
		});
		
		models.push({
			displayName: "Google Satellite",
			name: "googleSatellite",
			selected: false,
			subType: google.maps.MapTypeId.SATELLITE,
			type: "Google",
			zoomLevels: 22,
			getLayerDefinition: function(){
				var bgMap = new OpenLayers.Layer.Google(
					this.get("displayName"),
					{
						basemapType: this.get("subType"),
						layerRole: "basemap",
						animationEnabled: true
					}
					);
				return bgMap;
				},
			showOperations: function(layer){
				layer.mapObject.setMapTypeId(this.get("subType"));
				layer.type = this.get("subType");
				layer.setVisibility(true);
				jQuery("div.olLayerGooglePoweredBy").children().css("display", "block");	
			},
			hideOperations: function(layer){
				layer.setVisibility(false);
				jQuery("div.olLayerGooglePoweredBy").children().css("display", "none");	
			},
			initialRenderCallback: function(mapController){
				var bgMap = mapController.getLayersByName(this.get("name"))[0];
				google.maps.event.addListener(bgMap.mapObject, "tilesloaded", function() {
					//console.log("Tiles loaded");
					mapController.render(mapController.mapDiv);
					jQuery(document).trigger("mapReady");
					//really should only fire the first time
					google.maps.event.clearListeners(bgMap.mapObject, "tilesloaded");
					jQuery("#geoportalMap").fadeTo("slow", 1);

				});
			}
		});
		
		models.push({
			displayName: "Google Streets",
			name: "googleStreets",
			selected: false,
			subType: google.maps.MapTypeId.ROADMAP,
			type: "Google",
			zoomLevels: 20,
			getLayerDefinition: function(){
				var bgMap = new OpenLayers.Layer.Google(
					this.get("displayName"),
					{
						basemapType: this.get("subType"),
						layerRole: "basemap",
						animationEnabled: true
					}
					);
				return bgMap;
				},
			showOperations: function(layer){
				layer.mapObject.setMapTypeId(this.get("subType"));
				layer.type = this.get("subType");
				layer.setVisibility(true);
				jQuery("div.olLayerGooglePoweredBy").children().css("display", "block");	
			},
			hideOperations: function(layer){
				layer.setVisibility(false);
				jQuery("div.olLayerGooglePoweredBy").children().css("display", "none");	
			},
			initialRenderCallback: function(mapController){
				var bgMap = mapController.getLayersByName(this.get("name"))[0];
				google.maps.event.addListener(bgMap.mapObject, "tilesloaded", function() {
					//console.log("Tiles loaded");
					mapController.render(mapController.mapDiv);
					jQuery(document).trigger("mapReady");
					//really should only fire the first time
					google.maps.event.clearListeners(bgMap.mapObject, "tilesloaded");
					jQuery("#geoportalMap").fadeTo("slow", 1);

				});
			}
		});
		
		models.push({
			displayName: "OpenStreetMap",
			name: "osm",
			selected: false,
			type: "TMS",
			url: "http://tile.openstreetmap.org/",
			tileFunction: function(bounds){
				console.log(arguments);
				var res = that.map.getResolution();
				var x = Math.round((bounds.left - that.getMaxExtent().left) / (res * that.tileSize.w));
				var y = Math.round((that.getMaxExtent().top - bounds.top) / (res * that.tileSize.h));
				var z = that.map.getZoom() + 1;
				var limit = Math.pow(2, z);

				if (y < 0 || y >= limit) {
					//console.log["ol 404"];
					return OpenGeoportal.Utility.getImage("404.png");
				} else {
					x = ((x % limit) + limit) % limit;
					//console.log([this.url, this.type]);
					return this.get("url") + z + "/" + x + "/" + y + ".png";
				}
			},
			zoomLevels: 17,
			getLayerDefinition: function(){
				var bgMap = new OpenLayers.Layer.OSM(
						this.get("name")
				);
				return bgMap;
				},
			showOperations: function(layer){
				layer.setVisibility(true);
			},
			hideOperations: function(layer){
				console.log("hide operations");
				console.log(layer);
				layer.setVisibility(false);
			},
			initialRenderCallback: function(mapController){
				var bgMap = mapController.getLayersByName(this.get("name"))[0];
				bgMap.events.register(bgMap.mapObject, "loadend", function() {
					//console.log("Tiles loaded");
					mapController.render(mapController.mapDiv);
					//really should only fire the first time
					bgMap.events.unregister(bgMap.mapObject, "loadend");
					jQuery("#geoportalMap").fadeTo("slow", 1);
				});
			}
		});
		//create an instance of the basemap collection
		var collection = new OpenGeoportal.BasemapCollection(models);
		return collection;
		
	};
	/*this.backgroundMaps = function(mapType){
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
*/	

	this.showBasemap = function(model, layer){
		if (model.has("showOperations")){
			model.get("showOperations").apply(model, [layer]);
		}
	};
	this.hideBasemap = function(model, layer){
		if (model.has("hideOperations")){
			model.get("hideOperations").apply(model, [layer]);
		}
	};

	this.setBasemap = function(model){

		//see if there is a basemap layer of the specified type
		if (this.getLayersBy("basemapId", model.get("type")).length == 0){
			//add the appropriate basemap layer
			this.addLayer(model.get("getLayerDefinition").call(model));
		}
		
		//make sure selected basemap is in the foreground and others are hidden
		var basemapLayers = this.getLayersBy("layerRole", "basemap");
		
		//iterate over this array, set visibility false, unless it is represented by the passed model
		for (var i = 0; i < basemapLayers.length; i++){
			var currLayer = basemapLayers[i];

			if (currLayer.basemapType == model.get("subType")){
				this.showBasemap(model, currLayer);
			} else {
				this.hideBasemap(model, currLayer);
			}
		}
	};
	

	

	/*this.changeBackgroundMap = function(bgType){
		//minimize the number of Google layers by changing map types in the Google Maps API
		var that = this;
		var backgroundMaps = this.backgroundMaps(bgType);
		if (backgroundMaps.mapClass == "Google"){
			if (this.getLayersByClass('OpenLayers.Layer.Google').length > 0){
				var googleLayer = this.getLayersByClass('OpenLayers.Layer.Google')[0];
				googleLayer.mapObject.setMapTypeId(backgroundMaps["params"]["type"]);
				googleLayer.type = backgroundMaps["params"]["type"];
				googleLayer.setVisibility(true);
				jQuery("div.olLayerGooglePoweredBy").children().css("display", "block");

			} else {
				//backgroundMaps.params.sphericalMercator = true;
				//backgroundMaps.params.maxExtent = new OpenLayers.Bounds(-20037508.34,-20037508.34,20037508.34,20037508.34);
				backgroundMaps.params.basemapType = model.get("type");
				var bgMap = new OpenLayers.Layer.Google(backgroundMaps.name,
						backgroundMaps.params);
				bgMap.animationEnabled = true;
				this.addLayer(bgMap);
				google.maps.event.addListener(bgMap.mapObject, "tilesloaded", function() {
					//console.log("Tiles loaded");
					that.render(that.mapDiv);
					//jQuery(".mapClearButtonItemInactive").text("clear previews");
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
					//jQuery(".mapClearButtonItemInactive").text("clear previews");
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
				googleLayer.setVisibility(false);
				jQuery("div.olLayerGooglePoweredBy").children().css("display", "none");
			}
		}
	};*/

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

	this.clearMap = function (){
		this.previewed.each(function(model){
			model.set({preview: "off"});
		});
	};

	this.processMetadataSolrResponse = function(data){
		var solrResponse = data.response;
		var totalResults = solrResponse.numFound;
		if (totalResults != 1){
			throw new Error("Request for Metadata returned " + totalResults +".  Exactly 1 was expected.");
			return;
		}
		var doc = solrResponse.docs[0];  // get the first layer object
		return doc;
	};
	
	this.getAttributeDescriptionJsonpSuccess = function(data) {
		jQuery(".attributeName").css("cursor", "default");
		
		var that = this; 
		
		var solrdoc = this.processMetadataSolrResponse(data);
		var xmlDoc = jQuery.parseXML(solrdoc.FgdcText);  // text was escaped on ingest into Solr

		var layerId = jQuery("td.attributeName").first().closest("table").find("caption").attr("title");
		var layerAttrs = this.previewed.get(layerId).get("layerAttributes");
		
		jQuery(xmlDoc).find("attrlabl").each(function(){
			var currentXmlAttribute$ = jQuery(this);
			jQuery("td.attributeName").each(function(){
				var attributeName = jQuery(this).text().trim();
				if (currentXmlAttribute$.text().trim().toLowerCase() == attributeName.toLowerCase()){
					var attributeDescription = currentXmlAttribute$.siblings("attrdef").first();
					attributeDescription = OpenGeoportal.Utility.stripExtraSpaces(attributeDescription.text().trim());
					if (attributeDescription.length === 0){
						attributeDescription = "No description available";
					}
					jQuery(this).attr('title', attributeDescription);
					layerAttrs.findWhere({attributeName: attributeName}).set({description: attributeDescription});
					return;
				}
			});
		});
	};

	this.getAttributeDescriptionJsonpError = function () {
		jQuery(".attributeName").css("cursor", "default");
		throw new Error("The attribute description could not be retrieved.");
	};
	
	
	this.attributeDescriptionHandler = function(){
		//mouseover to display attribute descriptions
		var that = this;
		jQuery(document).on('mouseenter', "td.attributeName", function() {
			var layerId = jQuery(this).closest("table").find("caption").attr("title");
			var layerAttrs = that.previewed.get(layerId).get("layerAttributes");

			var attrModel = layerAttrs.findWhere({attributeName: jQuery(this).text().trim()});

			if (attrModel.has("description")){
				jQuery(this).attr('title', attrModel.get("description"));
				//short circuit if attributes have already been looked up
			} else {
				var solr = new OpenGeoportal.Solr();
				var query = solr.getServerName() + "?" + jQuery.param(solr.getMetadataParams(layerId));
				jQuery(".attributeName").css("cursor", "wait");
				solr.sendToSolr(query, that.getAttributeDescriptionJsonpSuccess, that.getAttributeDescriptionJsonpError, that);
			}
		});
	};

	this.getFeatureAttributes = function(e){
		console.log("getFeatureAttributes");
		if (typeof this.map != "undefined"){
			var mapObject = this.map;//since this is an event handler, the context isn't the MapController Object, it's the map layer. Should it be?

			//generate the query string
			var layerId = this.ogpLayerId;
			var searchString = "OGPID=" + layerId;
			
			var mapExtent = mapObject.getExtent();
			searchString += "&bbox=" + mapExtent.toBBOX();			
			
			var pixel = e.xy;
			//geoserver doesn't like fractional pixel values
			searchString += "&x=" + Math.round(pixel.x) + "&y=" + Math.round(pixel.y);
			searchString += "&height=" + mapObject.size.h + "&width=" + mapObject.size.w;
			
			var layerModel = mapObject.previewed.findWhere({LayerId: layerId});			
			var dialogTitle =  layerModel.get("LayerDisplayName");
			var institution = layerModel.get("Institution");

			var ajaxParams = {
					type: "GET",
					url: 'featureInfo',
					data: searchString,
					dataType: 'html',
					beforeSend: function(){
						if (mapObject.currentAttributeRequests.length > 0){
							//abort any outstanding requests before submitting a new one
							for (var i in mapObject.currentAttributeRequests) {					
								mapObject.currentAttributeRequests.splice(i, 1)[0].abort();
							}
						}
						
						jQuery(document).trigger("showLoadIndicator");
					},
					success: function(data, textStatus, XMLHttpRequest){
						//create a new dialog instance, or just open the dialog if it already exists
						mapObject.getFeatureAttributesSuccessCallback(layerId, dialogTitle, data);
					},
					error: function(jqXHR, textStatus, errorThrown) {
						if ((jqXHR.status != 401)&&(textStatus != 'abort')){
							new OpenGeoportal.ErrorObject(new Error(), "Error retrieving Feature Information.");
						}
					},
					complete: function(jqXHR){
						for (var i in mapObject.currentAttributeRequests){
							if (mapObject.currentAttributeRequests[i] === jqXHR){
								var spliced = mapObject.currentAttributeRequests.splice(i, 1);						
         	
							}
						}

						jQuery(document).trigger("hideLoadIndicator");
					}
			};

 
			mapObject.currentAttributeRequests.push(jQuery.ajax(ajaxParams));
			
			
			analytics.track("Layer Attributes Viewed", institution, layerId);
		} else {
			new OpenGeoportal.ErrorObject(new Error(), "This layer has not been previewed. <br/>You must preview it before getting attribute information.");
		}
	};

	this.currentAttributeRequests = [];
	
	this.registerAttributes = function(layerId, attrNames){
		var layerModel = this.previewed.get(layerId);
		if (!layerModel.has("layerAttributes")){
			var attributes = new OpenGeoportal.Attributes();
			for (var i in attrNames){
				var attrModel = new OpenGeoportal.Models.Attribute({attributeName: attrNames[i]});
				attributes.add(attrModel);
			}
			layerModel.set({layerAttributes: attributes});
		}
	};
	
	this.getFeatureAttributesSuccessCallback = function(layerId, dialogTitle, data) {		
		//grab the html table from the response
		var responseTable$ = jQuery(data).filter(function() {
			return jQuery(this).is('table');
		});			
		
		var template = this.template;
		var tableText = "";
		
		if ((responseTable$.length === 0) || (jQuery(data).find("tr").length === 0)){
			//what should happen here?  returned content is empty or otherwise unexpected	
			tableText = '<p>There is no data for "' + dialogTitle + '" at this point.</p>';
		} else {
			responseTable$ = responseTable$.first();
			//process the html table returned from wms getfeature request
			var rows = this.processAttributeTable(responseTable$);

			tableText = template.attributeTable({
				layerId: layerId,
				title : dialogTitle,
				tableContent : rows
			});
			
			var attrNames = [];
			for (var i in rows){
				attrNames.push(rows[i].header);
			}
			this.registerAttributes(layerId, attrNames);

		}
		
		//create a new dialog instance, or just open the dialog if it already exists

		if ( typeof jQuery('#featureInfo')[0] == 'undefined') {
			var infoDiv = template.genericDialogShell({
				id : "featureInfo"
			});
			jQuery("#dialogs").append(infoDiv);
			jQuery("#featureInfo").dialog({
				zIndex : 2999,
				title : "Feature Attributes",
				width : 'auto',
				autoOpen : false
			});

		}
		jQuery("#featureInfo").fadeOut(200, function(){
			jQuery("#featureInfo").html(tableText);
			//limit the height of the dialog.  some layers will have hundreds of attributes
			var containerHeight = jQuery("#container").height();
			var linecount = jQuery("#featureInfo tr").length;
			var dataHeight = linecount * 20;
			if (dataHeight > containerHeight) {
				dataHeight = containerHeight;
			} else {
				dataHeight = "auto";
			}
			jQuery("#featureInfo").dialog("option", "height", dataHeight);
			
			jQuery("#featureInfo").dialog('open');
			jQuery("#featureInfo").fadeIn(200);
			});
		

		
		
	}; 

	
	this.processAttributeTable = function(responseTable$) {
		var tableArr = [];
		if (responseTable$.find("tr").length === 2) {
			//horizontal table returned
			responseTable$.find("tr").each(function() {

				if (jQuery(this).find("th").length > 0) {
					//this is the header row
					var cells$ = jQuery(this).find("th");

				} else {
					var cells$ = jQuery(this).find("td");
				}
				var rowArr = [];
				cells$.each(function() {
					rowArr.push(jQuery(this).text());
				});
				tableArr.push(rowArr);
			});

		} else {
			//vertical table returned
			//TODO: handle vertical table case
		}
	
		//iterate over headers
		var rows = [];
		if (tableArr.length > 0){
			
		for (var i = 0; i < tableArr[0].length; i++) {
			var newRowObj = {};
			newRowObj.values = [];
			for (var j = 0; j < tableArr.length; j++) {
				if (j === 0) {
					newRowObj.header = tableArr[j][i];
				} else {
					newRowObj.values.push(tableArr[j][i]);
				}

			}
			rows.push(newRowObj);
		}
		
		}
		
		return rows;
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
			style_blue.strokeColor = "#1D6EEF";
			style_blue.fillColor = "#DAEDFF";
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
		var extent = this.getVisibleExtent(); 
		var geodeticExtent = this.getGeodeticExtent();
		var mapTop = extent.top;
		if (geodeticExtent.top > 83){
			mapTop = 238107694;
		}
		var mapBottom = extent.bottom;
		if (geodeticExtent.bottom < -83){
			mapBottom = -238107694;
		}
		var mapLeft = extent.left;
		if (geodeticExtent.left < -179){
			mapLeft = -20037510;
		}
		var mapRight = extent.right;
		if (geodeticExtent.right > 180){
			mapRight = 20037510;
		}

		var layerTop = topRight.lat;
		var layerBottom = bottomLeft.lat;
		var layerLeft = bottomLeft.lon;
		var layerRight = topRight.lon;
		
		
		if (layerLeft < mapLeft || layerRight > mapRight || layerTop > mapTop || layerBottom < mapBottom) {
			//console.log("should show arrow");
			var extentFeatureLayer;
			if (this.getLayersByName("layerBBoxOutsideExtent").length > 0) {
				extentFeatureLayer = this.getLayersByName("layerBBoxOutsideExtent")[0];
				extentFeatureLayer.removeAllFeatures();
			} else {
				var style_blue = OpenLayers.Util.extend({}, OpenLayers.Feature.Vector.style['default']);
				style_blue.strokeColor = "#1D6EEF";
				//'#003366';
				style_blue.fillColor = "#1D6EEF";
				//'#003366';
				style_blue.fillOpacity = 1;
				style_blue.pointRadius = 1;
				style_blue.strokeWidth = 1;
				style_blue.strokeLinecap = "butt";
				style_blue.zIndex = 999;

				extentFeatureLayer = new OpenLayers.Layer.Vector("layerBBoxOutsideExtent", {
					style : style_blue
				});
				this.addLayer(extentFeatureLayer);
			}
			var mapSize = this.getCurrentSize();
			//h=512
			var size = (Math.abs(extent.top - extent.bottom)) / mapSize.h * 25;

			var polygonFeatures = [];

			if (layerTop < mapTop && layerBottom > mapBottom) {
				if (layerRight > mapRight) {
					//console.log("ne + se");
					polygonFeatures.push(this.getOutsideExtentGraphic(extent, "ne", size));
					polygonFeatures.push(this.getOutsideExtentGraphic(extent, "se", size));
				}

				if (layerLeft < mapLeft) {
					//console.log("sw + nw");
					polygonFeatures.push(this.getOutsideExtentGraphic(extent, "sw", size));
					polygonFeatures.push(this.getOutsideExtentGraphic(extent, "nw", size));
				}
			} else if (layerRight < mapRight && layerLeft > mapLeft) {
				if (layerTop > mapTop) {
					//console.log("ne + nw");
					polygonFeatures.push(this.getOutsideExtentGraphic(extent, "ne", size));
					polygonFeatures.push(this.getOutsideExtentGraphic(extent, "nw", size));
				}

				if (layerBottom < mapBottom) {
					//console.log("se + sw");
					polygonFeatures.push(this.getOutsideExtentGraphic(extent, "se", size));
					polygonFeatures.push(this.getOutsideExtentGraphic(extent, "sw", size));
				}

			} else {
				//corners only
				if (layerTop > mapTop && layerRight > mapRight) {
					//console.log("ne");
					polygonFeatures.push(this.getOutsideExtentGraphic(extent, "ne", size));
				}

				if (layerBottom < mapBottom && layerRight > mapRight) {
					//console.log("se");
					polygonFeatures.push(this.getOutsideExtentGraphic(extent, "se", size));
				}

				if (layerTop > mapTop && layerLeft < mapLeft) {
					//console.log("nw");
					polygonFeatures.push(this.getOutsideExtentGraphic(extent, "nw", size));
				}

				if (layerBottom < mapBottom && layerLeft < mapLeft) {
					//console.log("sw");
					polygonFeatures.push(this.getOutsideExtentGraphic(extent, "sw", size));
				}

			}

			extentFeatureLayer.addFeatures(polygonFeatures);
			this.setLayerIndex(extentFeatureLayer, (this.layers.length - 1));
		}

		};


	this.getOutsideExtentGraphic = function(mapExtent, direction, graphicSize){
		//direction = "ne", "nw", "sw", "se";
			var offset = graphicSize / 2;
			var yNorth = mapExtent.top - offset;
			var ySouth = mapExtent.bottom + offset;
			var xEast = mapExtent.right - offset;
			var xWest = mapExtent.left + offset;
			if (direction === "ne"){
				return this.createRightTriangle(xEast, yNorth, direction, graphicSize);
			} else if (direction === "nw"){
				return this.createRightTriangle(xWest, yNorth, direction, graphicSize);
			} else if (direction === "se"){
				return this.createRightTriangle(xEast, ySouth, direction, graphicSize);
			} else if (direction === "sw"){
				return this.createRightTriangle(xWest, ySouth, direction, graphicSize);
			}
			
	};
	
	this.createRightTriangle = function(xcoord, ycoord, direction, size){
		
		var pt1 = new OpenLayers.Geometry.Point(xcoord, ycoord);
		
		var directions = {
			ne: [new OpenLayers.Geometry.Point(xcoord - size, ycoord), new OpenLayers.Geometry.Point(xcoord, ycoord - size)],
			nw: [new OpenLayers.Geometry.Point(xcoord + size, ycoord), new OpenLayers.Geometry.Point(xcoord, ycoord - size)],
			se: [new OpenLayers.Geometry.Point(xcoord - size, ycoord), new OpenLayers.Geometry.Point(xcoord, ycoord + size)],
			sw: [new OpenLayers.Geometry.Point(xcoord + size, ycoord), new OpenLayers.Geometry.Point(xcoord, ycoord + size)]
		};

		
		var pointList = directions[direction];
		pointList.unshift(pt1);
		pointList.push(pt1);
		var linearRing = new OpenLayers.Geometry.LinearRing(pointList);
		var polygonFeature = new OpenLayers.Feature.Vector(
					new OpenLayers.Geometry.Polygon([linearRing]));
				
		return polygonFeature;
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

	this.startService = function(layerModel){
		//if layer has a startService value in the location field, try to start the service via the provided url
		var requestObj = {};
		requestObj.AddLayer = [layerModel.get("qualifiedName")];
		requestObj.ValidationKey = "OPENGEOPORTALROCKS";
		var params = {
				url: layerModel.get("parsedLocation").serviceStart,
				dataType: "jsonp",
				data: requestObj,
				type: "GET",
				traditional: true,
				complete: function(){
					//jQuery("body").trigger(layerModel.get("qualifiedName") + 'Exists');
				},
				statusCode: {
					200: function(){
						jQuery("body").trigger(layerModel.get("qualifiedName") + 'Exists');
					},
					500: function(){
						throw new Error("layer could not be added");
					}
				}
		};
		jQuery.ajax(params);
	};
	
	this.setWmsLayerInfo = function(model){
		var that = this; 
		var queryData = {OGPID: model.get("LayerId")};
    	var ajaxParams = {
    		type: "GET",
            url: 'info/wmsInfo',
            data: queryData,
            dataType: 'json',
			success: function(data){
					//{"owsProtocol":"WMS","infoMap":{"owsUrl":"http://geoserver01.uit.tufts.edu/wfs/WfsDispatcher?","owsType":"WFS","qualifiedName":"sde:GISPORTAL.GISOWNER01.WORLDBOUNDARIES95"},"owsDescribeInfo":null}
					jQuery("body").trigger(model.get("qualifiedName") + 'Exists');
					model.set({qualifiedName: data.infoMap.qualifiedName});
					//should we also set a wfs or wcs if found?...if the dataType is unknown, it should be updated to vector or raster
			},
			error: function(){
				if (model.get("parsedLocation").serviceStart != "undefined"){

					that.startService(model);
				} else {
					//let the user know the layer is not previewable
					throw new Error("layer could not be added");
				}
			}
    	};
    	jQuery.ajax(ajaxParams);
	};
	
	
	this.layerExists = function (layerModel) {
		//otherwise, do a wms describe layer to make sure the layer is there before
		//attempting to add it to the map (must be proxied).  handling wms errors is non-trivial, since,
		//by design, OpenLayers requires an error of type 'image' from the wms server
		//(OpenLayers is merely dynamically setting the src attribute of img tags)
		//console.log(mapObj);
		if (layerModel.get("parsedLocation").wms != "undefined"){
			this.setWmsLayerInfo(layerModel);
		} else {
			//assume it exists
			jQuery("body").trigger(layerModel.get("qualifiedName") + 'Exists');
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

	this.addWMSLayer = function (layerModel){
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

		var layerId = layerModel.get("LayerId");
        //check to see if layer is on openlayers map, if so, show layer
        var opacitySetting = layerModel.get("opacity");
        
  
        if (this.getLayersByName(layerId).length > 0){
            	this.showLayer(layerId);
            	this.getLayersByName(layerId)[0].setOpacity(opacitySetting * .01);
            	return;
        } 
		//use a tilecache if we are aware of it


    	//check for a proxy here
    	var proxy = OpenGeoportal.InstitutionInfo.getWMSProxy(layerModel.get("Institution"), layerModel.get("Access"));
    	if (proxy){
    		layerModel.set({wmsProxy: proxy});
    	}
    	

		var wmsArray = this.getPreviewUrlArray(layerModel.get("parsedLocation"), true);
		//add the namespace if it's not already in the name
		var wmsNamespace = layerModel.get("WorkspaceName");
		var layerName = layerModel.get("Name");
		if ((wmsNamespace.length > 0)&&(layerName.indexOf(":") == -1)){
				layerName = wmsNamespace + ":" + layerName;
		}
			
			
		//tilecache and GeoServer names are different for Harvard layers
		if (layerModel.get("Institution") == "Harvard"){
			layerName = layerName.substr(layerName.indexOf(".") + 1);
			layerName = layerName.substr(layerName.indexOf(":") + 1);
		}		
		
		layerModel.set({qualifiedName: layerName});

		//won't actually do anything, since noMagic is true and transparent is true
		var format;
		var dataType = layerModel.get("DataType");
		if ((dataType == "Raster")||(dataType == "Paper Map")){
			format = "image/jpeg";
		} else {
			format = "image/png";
		}
		
//		if this is a raster layer, we should use jpeg format, png for vector (per geoserver docs)
		var newLayer = new OpenLayers.Layer.WMS( 
				layerModel.get("LayerDisplayName"),
				wmsArray,
				{
					layers: layerModel.get("qualifiedName"),
					format: format, 
					tiled: true,
					exceptions: "application/vnd.ogc.se_xml",
					transparent: true,
					version: "1.3.0"
				},
				{
					transitionEffect: 'resize',
					opacity: opacitySetting * .01,
					ogpLayerId: layerModel.get("LayerId"),
					ogpLayerRole: "LayerPreview"
				});
		//how should this change? trigger custom events with jQuery
		//newLayer.events.register('loadstart', newLayer, function() {OpenGeoportal.Utility.showLoadIndicator("mapLoadIndicator", newLayer.name);});
		//newLayer.events.register('loadend', newLayer, function() {OpenGeoportal.Utility.hideLoadIndicator("mapLoadIndicator", newLayer.name);});
		var that = this;
		//we do a check to see if the layer exists before we add it
		jQuery("body").bind(layerModel.get("qualifiedName") + 'Exists', function(){that.addLayer(newLayer);});
		this.layerExists(layerModel);

	};

//	thanks to Allen Lin, MN
	this.addArcGISRestLayer = function (layerModel) {
		//won't actually do anything, since noMagic is true and transparent is true
		var format;
		if (layerModel.isVector){
			format = "image/png";
		} else {
			format = "image/jpeg";
		}

//		if this is a raster layer, we should use jpeg format, png for vector (per geoserver docs)
		var newLayer = new OpenLayers.Layer.ArcGIS93Rest( 
			layerModel.get("LayerDisplayName"),
			layerModel.get("parsedLocation").ArcGISRest,
				{
					layers: "show:" + layerModel.get("Name"),
					transparent: true
				},
				{
					buffer: 0,
					transitionEffect: 'resize',
					opacity: layerModel.get("opacity"),
					ogpLayerId: layerModel.get("LayerId")
				});
		newLayer.projection = new OpenLayers.Projection("EPSG:3857");
		//how should this change? trigger custom events with jQuery
		//newLayer.events.register('loadstart', newLayer, function() {OpenGeoportal.Utility.showLoadIndicator("mapLoadIndicator", newLayer.ogpLayerId);});
		//newLayer.events.register('loadend', newLayer, function() {OpenGeoportal.Utility.hideLoadIndicator("mapLoadIndicator", newLayer.ogpLayerId);});
		var that = this;
		//we do a cursory check to see if the layer exists before we add it
		jQuery("body").bind(newLayer.ogpLayerId + 'Exists', function(){that.addLayer(newLayer);});
		this.layerExists(layerModel);
	};

	this.opacityHandler = function(){
		var that = this;
		jQuery(document).on("map.opacityChange", function(event, data){
			console.log(data);
			for (var i in that.getLayersBy("ogpLayerId", data.LayerId)){
				that.getLayersBy("ogpLayerId", data.LayerId)[0].setOpacity(data.opacity * .01);
			}
		});
	};

	this.previewLayerHandler = function(){
		var that = this;
		jQuery(document).on("previewLayerOn", function(event, data){
			that.previewLayerOn(data.LayerId);
		});
		
		jQuery(document).on("previewLayerOff", function(event, data){
			that.previewLayerOff(data.LayerId);
		});
	};
	
	this.styleChangeHandler = function(){
		var that = this;
		jQuery(document).on("map.styleChange", function(event, data){
			that.changeStyle(data.LayerId);
		});
	};

	this.changeStyle = function(layerId){
		var layer = this.getLayersBy("ogpLayerId", layerId)[0];
		if (typeof layer == 'undefined'){
			console.log("layer with id=['" + layerId + "'] not found on map.");
			//should we try to add it then?
			return;
		}

		var layerModel = this.previewed.findWhere({LayerId: layerId});
		if (typeof layerModel == "undefined"){
			throw new Error("This layer can't be found in the PreviewedLayers collection.");
		}
		console.log(layerModel);
		var dataType = layerModel.get("DataType").toLowerCase();
		var userSLD = {};
		//we need this for now, since the tilecache name and geoserver name for layers is different for Harvard layers
		var wmsName = layerModel.get("qualifiedName");
		var location = layerModel.get("parsedLocation");
		//don't use a tilecache
		layer.url = this.getPreviewUrlArray(location, false);
		var userColor = layerModel.get("color");
		var userWidth = layerModel.get("graphicWidth");
		switch (dataType){
		case "polygon":
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
		case "point":
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
		case "line":
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
		layerModel.set({sld: layerUniqueInfo}); 
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
		var layers = this.getLayersBy("ogpLayerId", layerId);
		console.log(layers);
		if (layers.length == 0){
			//probably don't need to do anything;  the layer probably never made it to the map
		} else {
			layers[0].setVisibility(false);
		}
	};

	this.showLayer = function(layerId){
		var layer = this.getLayersBy("ogpLayerId", layerId)[0];
		layer.setVisibility(true);
	};

	this.getMapOffset = function(){
		var mapOffset = jQuery("#" + this.containerDiv).offset();
		var xOffset = 0;
		var leftCol$ = jQuery("#left_col");
		var leftColOffset = leftCol$.offset();
		if (leftCol$.is(":visible")){
			xOffset = leftCol$.width() + leftColOffset.left - mapOffset.left;
		}
		var yOffset = jQuery("#tabs").offset().top - mapOffset.top;

		return new OpenLayers.Pixel(xOffset, yOffset);
	};
	
	this.getVisibleExtent = function(){
		var topLeft =  this.getLonLatFromViewPortPx(this.getMapOffset());
		var fullExtent = this.getExtent();
		fullExtent.left = topLeft.lon;
		fullExtent.top = topLeft.lat;
		return fullExtent;
	};
	
	this.getGeodeticExtent = function(){
		var mercatorExtent = this.getVisibleExtent();
		var sphericalMercator = new OpenLayers.Projection('EPSG:900913');
		var geodetic = new OpenLayers.Projection('EPSG:4326');
		return mercatorExtent.transform(sphericalMercator, geodetic);
	};
	
	this.getSearchExtent = function(){
		this.updateSize();
		var rawExtent = this.getGeodeticExtent();
		return this.clipToWorld(rawExtent);
	};

	this.clipToWorld = function(bounds){
		return this.clipExtent(bounds, new OpenLayers.Bounds(-180, -90, 180, 90));
	};
	
	this.clipExtent = function(bounds, clipBounds){
		if (bounds.intersectsBounds(clipBounds)){
			var newExtent = new OpenLayers.Bounds();
			newExtent.left = Math.max(bounds.left, clipBounds.left);
			newExtent.top = Math.min(bounds.top, clipBounds.top);
			newExtent.right = Math.min(bounds.right, clipBounds.right);
			newExtent.bottom = Math.max(bounds.bottom, clipBounds.bottom);
			return newExtent;
		} else {
			throw new Error("The extents don't intersect");
		}
	};
	
	this.getFeatureInfoHandler = function(){
		var that = this;
		jQuery(document).on("map.getFeatureInfoOn", function(event, data){
			console.log("map.getFeatureInfoOn");
			var layerId = data.LayerId;
			console.log(layerId);
			var layers = that.getLayersBy("ogpLayerId", layerId);
			if (layers.length == 0){
				//layer is not in OpenLayers...
				throw new Error("This layer has not yet been previewed.  Please preview it first.");
			} else {
				that.events.register("click", layers[0], that.getFeatureAttributes);
			}
		});
		jQuery(document).on("map.getFeatureInfoOff", function(event, data){
			var layerId = data.LayerId;
			var layers = that.getLayersBy("ogpLayerId", layerId);
			if (layers.length == 0){
				//layer is not in OpenLayers...add it?
			} else {
				that.events.unregister("click", layers[0], that.getFeatureAttributes);
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

		var newExtent = new OpenLayers.Bounds();
		for (var currentIndex in arrBounds){
			var currentBounds = arrBounds[currentIndex];
			newExtent.extend(currentBounds);
		}
		return newExtent;
	};

	this.getMaxLayerExtent = function getMaxLayerExtent(layerId){
		var bbox = this.previewed.get(layerId).get("bbox");
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
	
	this.previewBrowseGraphic = function(layerModel){
		var dialogHtml = '<img src="' + layerModel.get("parsedLocation").browseGraphic + '"/>';
		if (typeof jQuery('#browseGraphic')[0] == 'undefined'){
			var infoDiv = '<div id="browseGraphic" class="dialog">' + dialogHtml + '</div>';
			jQuery("body").append(infoDiv);
			jQuery("#browseGraphic").dialog({
				zIndex: 2999,
				title: "BROWSE GRAPHIC",
				width: 'auto',
				height: "auto",
				resizable: false,
				autoOpen: false
			});    	  
			jQuery("#browseGraphic").dialog('open');
		} else {
			jQuery("#browseGraphic").html(dialogHtml);
			jQuery("#browseGraphic").dialog('open');
		}
	};
	/*****
	 * main preview functions
	 */
	
	this.closeBrowseGraphic = function(layerId){
		jQuery("#browseGraphic").dialog('close');
		jQuery("#browseGraphic").html("");
	};
	
	this.getPreviewMethods =  function(){
		//order matters; should there be an order property?
		var previewMethods = [
	                        {type: "tilecache", onHandler: this.addWMSLayer, offHandler: this.hideLayer},
	                        {type: "wms", onHandler: this.addWMSLayer, offHandler: this.hideLayer},
	                        {type: "ArcGISRest", onHandler: this.addArcGISRestLayer, offHandler: this.hideLayer},
	                        {type: "browseGraphic", onHandler: this.previewBrowseGraphic, offHandler: this.closeBrowseGraphic},
	                        {type: "default", onHandler: this.addMapBBox, offHandler: this.hideLayer}
	                        ];
		return previewMethods;
	};
	
	this.previewOnDispatcher = function(location){
		var previewObj = this.getPreviewMethods();

		var defaultObj = null;
   		for (var i=0; i < previewObj.length; i++){
   			var currentObj = previewObj[i];
   	   		if (typeof location[currentObj.type] != "undefined"){
   	   			return currentObj;
   	   		} else if (location[currentObj.type] == "default"){
   	   			defaultObj = currentObj;
   	   		}
   		}
   		
   		console.log("no preview type match");
		//there's no preview method identified, so just return a function that shows a static bounding box
		return defaultObj;
	};
	
	this.previewOffDispatcher = function(previewType){
		var previewObj = this.getPreviewMethods();

   		for (var i=0; i < previewObj.length; i++){
   			var currentObj = previewObj[i];
   	   		if (currentObj.type == previewType){
   	   			return currentObj.offHandler;
   	   		}	
   		}
   		
   		console.log("No preview type match for '" + previewType + "'");
		//there's no preview method identified, so just return a function that shows a static bounding box
		return this.hideLayer;
	};
	
	 
	this.getBboxFromCoords = function(minx, miny, maxx, maxy){
	    	var bbox = [];
  	    	bbox.push(minx);
  	    	bbox.push(miny);
  	    	bbox.push(maxx);
  	    	bbox.push(maxy);
  	    	bbox = bbox.join(",");
		return bbox;
	};
	
	this.previewLayerOn = function(layerId){
		//find preview method

		var currModel = this.previewed.get(layerId);
		if (typeof currModel == "undefined"){
			throw new Error("Layer['" + layerId + "'] not found in PreviewedLayers collection.");
		}
		
		var location = jQuery.parseJSON(currModel.get("Location"));
		currModel.set({parsedLocation: location}); //perhaps this should happen on model add
		var previewHandler = null;
		var previewType = null;
		try {
			var previewObj = this.previewOnDispatcher(location);
			try {
				previewObj.onHandler.call(this, currModel);
			} catch (e){
				console.log(e);
				throw new Error("error in preview on handler.");
			}		
			//if no errors, set state for the layer
			previewType = previewObj.type;
			currModel.set({previewType: previewType});
        	analytics.track("Layer Previewed", currModel.get("Institution"), layerId);
		} catch (err){
			//if there's a problem, set preview to off, give the user a notice
			console.log("error in layer on");
			console.log(err);
			currModel.set({preview: "off"});
			throw new OpenGeoportal.ErrorObject(err,'Unable to Preview layer "' + currModel.get("LayerDisplayName") +'"');
		}

	};

	  
	this.previewLayerOff = function(layerId){
		//find preview off method
		var previewModel = this.previewed.get(layerId);
		var previewType = previewModel.get("previewType");
		var previewHandler = null;
		try {
			previewHandler = this.previewOffDispatcher(previewType);
			previewHandler.call(this, layerId);

		} catch (err){
			console.log("error in layer off");
			throw new OpenGeoportal.ErrorObject(err,'Unable to remove Previewed layer "' + previewModel.get("LayerDisplayName") +'"');
		}
		//if no errors, set state for the layer

		//previewModel.set({preview: "off"});
		// this.addToPreviewedLayers(rowData.node);//this should happen in the datatable
		//analytics.track("Layer Unpreviewed", dataObj["Institution"], layerId);

	};
	
};//object end
//set inheritance for MapController
OpenGeoportal.MapController.prototype = Object.create(OpenLayers.Map.prototype);
