/**
 * 
 * This javascript module includes functions for dealing with the map defined
 * under the object MapController. MapController inherits from the
 * OpenLayers.Map object
 * 
 * @author Chris Barnett
 */

if (typeof OpenGeoportal === 'undefined') {
	OpenGeoportal = {};
} else if (typeof OpenGeoportal !== "object") {
	throw new Error("OpenGeoportal already exists and is not an object");
}

// some code to test presence of OpenLayers, check version?

/**
 * MapController constructor
 * 
 * @constructor
 * @requires OpenLayers
 * @requires OpenGeoportal.PreviewedLayers
 * @requires OpenGeoportal.Template
 * @requires OpenGeoportal.Analytics
 * 
 */
OpenGeoportal.MapController = function(offset) {
	// dependencies

	this.previewed = OpenGeoportal.ogp.appState.get("previewed");
	this.requestQueue = OpenGeoportal.ogp.appState.get("requestQueue");

	this.template = OpenGeoportal.Template;
	var analytics = new OpenGeoportal.Analytics();

	/**
	 * initialization function for the map
	 * 
	 * @param {string}
	 *            containerDiv - the id of the div element that the map should
	 *            be rendered to
	 * @param {object}
	 *            userOptions - object can be used to pass OpenLayers options to
	 *            the created OpenLayers map
	 * 
	 */
	this.initMap = function(containerDiv, userOptions) {
		// would passing a jQuery object be preferable to the string id?
		if ((typeof containerDiv === 'undefined')
				|| (containerDiv.length === 0)) {
			throw new Error("The id of the map div must be specified.");
		}
		this.containerDiv = containerDiv;

		this.createMapHtml(containerDiv);

		try {
			this.createOLMap(userOptions);
		} catch (e) {
			console.log("problem creating ol map");
			console.log(e);
		}

		this.initBasemaps();
		this.addMapToolbarElements();

		//we want to predict center based on where the left panel will open to

		// set map position
		//this.ol.setCenter(this.WGS84ToMercator(0,0));
		this.ol.setCenter(this.WGS84ToMercator(this.getSearchCenter(offset).lon,
				0));
		

		try {
			this.registerMapEvents();
		} catch (e) {
			console.log("problem registering map events");
			console.log(e);
		}
		
	};

	/**
	 * Create the internal HTML for the map
	 * 
	 * @param {string}
	 *            div - the id for the div the map should be rendered to
	 */
	this.createMapHtml = function(div) {
		// test for uniqueness
		var div$ = jQuery("#" + div);
		if (div$.length === 0) {
			throw new Error("The DIV [" + div + "] does not exist!");
		}
		var renderCorner = this.template.get('genericDiv');
		var resultsHTML = this.template.get('map')({
			mapId : div,
			renderCorner: renderCorner
		});
		div$.html(resultsHTML);
	};

	this.createModControls = function(){
		var that = this;
	
		OpenLayers.Control.ModZoomBox = OpenLayers.Class(OpenLayers.Control.ZoomBox, {

		    /**
		     * Method: zoomBox
		     *
		     * Parameters:
		     * position - {<OpenLayers.Bounds>} or {<OpenLayers.Pixel>}
		     */
		    zoomBox: function (position) {
		        if (position instanceof OpenLayers.Bounds) {
		        	var px1 = new OpenLayers.Pixel(position.left, position.bottom);
		        	var px2 = new OpenLayers.Pixel(position.right, position.top);
		        	var coord1 = this.map.getLonLatFromPixel(px1);
		        	var coord2 = this.map.getLonLatFromPixel(px2);
		        	var bounds = new OpenLayers.Bounds();
		        	bounds.extend(coord1);
		        	bounds.extend(coord2);
		    		var sphericalMercator = new OpenLayers.Projection('EPSG:3857');
		    		var geodetic = new OpenLayers.Projection('EPSG:4326');
		    		bounds = bounds.transform(sphericalMercator, geodetic);
		            that.zoomToLayerExtent(bounds.toBBOX());

		        } else {
		        	this.map.setCenter(this.map.getLonLatFromPixel(position),
	                        this.map.getZoom() + 1);
		        }
		        

		    },

		    CLASS_NAME: "OpenLayers.Control.ZoomBox"
		});
		
		OpenLayers.Control.ModNavigation = OpenLayers.Class(OpenLayers.Control.Navigation, {
		    /**
		     * Method: draw
		     */
		    draw: function() {
		        // disable right mouse context menu for support of right click events
		        if (this.handleRightClicks) {
		            this.map.viewPortDiv.oncontextmenu = OpenLayers.Function.False;
		        }

		        var clickCallbacks = { 
		            'click': this.defaultClick,
		            'dblclick': this.defaultDblClick, 
		            'dblrightclick': this.defaultDblRightClick 
		        };
		        var clickOptions = {
		            'double': true, 
		            'stopDouble': true
		        };
		        this.handlers.click = new OpenLayers.Handler.Click(
		            this, clickCallbacks, clickOptions
		        );
		        this.dragPan = new OpenLayers.Control.DragPan(
		            OpenLayers.Util.extend({
		                map: this.map,
		                documentDrag: this.documentDrag
		            }, this.dragPanOptions)
		        );
		        this.zoomBox = new OpenLayers.Control.ModZoomBox(
		                    {map: this.map, keyMask: this.zoomBoxKeyMask});
		        this.dragPan.draw();
		        this.zoomBox.draw();
		        this.handlers.wheel = new OpenLayers.Handler.MouseWheel(
		                                    this, {"up"  : this.wheelUp,
		                                           "down": this.wheelDown},
		                                    this.mouseWheelOptions );
		        if (OpenLayers.Control.PinchZoom) {
		            this.pinchZoom = new OpenLayers.Control.PinchZoom(
		                OpenLayers.Util.extend(
		                    {map: this.map}, this.pinchZoomOptions));
		        }
		    },
		    
		    mouseWheelOptions: {interval: 100},

		    /**
		     * Method: wheelChange  
		     *
		     * Parameters:
		     * evt - {Event}
		     * deltaZ - {Integer}
		     */
		    wheelChange: function(evt, deltaZ) {
		        var currentZoom = this.map.getZoom();
		        var newZoom = this.map.getZoom() + Math.round(deltaZ);
		        newZoom = Math.max(newZoom, 1);
		        newZoom = Math.min(newZoom, this.map.getNumZoomLevels());
		        if (newZoom === currentZoom) {
		            return;
		        }
		        var zoomPoint = this.map.getLonLatFromPixel(evt.xy);
		        
		        var size    = this.map.getSize();
		        var deltaX  = size.w/2 - evt.xy.x;
		        var deltaY  = evt.xy.y - size.h/2;
		        var newRes  = this.map.baseLayer.getResolutionForZoom(newZoom);
		        
		        var newCenter = new OpenLayers.LonLat(
		                            zoomPoint.lon + deltaX * newRes,
		                            zoomPoint.lat + deltaY * newRes );
		        this.map.setCenter(newCenter, newZoom);
		    },
		    
		    /**
		     * Method: defaultDblClick 
		     * 
		     * Parameters:
		     * evt - {Event} 
		     */
		    defaultDblClick: function (evt) {
		        var newCenter = this.map.getLonLatFromViewPortPx( evt.xy );
		        that.setAdjustedCenter(newCenter, this.map.zoom + 1);
		    },

		    /**
		     * Method: defaultDblRightClick 
		     * 
		     * Parameters:
		     * evt - {Event} 
		     */
		    defaultDblRightClick: function (evt) {
		        var newCenter = this.map.getLonLatFromViewPortPx( evt.xy );
		        that.setAdjustedCenter(newCenter, this.map.zoom - 1);
		    }
		});
		

		
		OpenLayers.Control.ModZoomToMaxExtent = OpenLayers.Class(OpenLayers.Control.ZoomToMaxExtent, {

		    /*
		     * Method: trigger
		     * Do the zoom.
		     */
		    trigger: function() {
		    	that.zoomToLayerExtent('-180,-90,180,90');   
		    }
		});
		
	};
	/**
	 * Create the controls for the OL map. Depends on "previewed" object.
	 * 
	 * @requires OpenGeoportal.PreviewedLayers
	 * @returns {Array<OpenLayers.Control.*>} - array of controls to pass to
	 *          OpenLayers map
	 */
	this.createOLControls = function() {
		var that = this;
	    
		var nav = new OpenLayers.Control.NavigationHistory({
			nextOptions : {
				title : "Zoom to next geographic extent"
			},
			previousOptions : {
				title : "Zoom to previous geographic extent"
			}
		});
		
		this.createModControls();
		var zoomBox = new OpenLayers.Control.ModZoomBox({
			title : "Click or draw rectangle on map to zoom in"
		});

		// we could fire an event instead if we wanted to remove previewed as a
		// dependency
		var zoomBoxListener = function() {
			jQuery('.olMap').css('cursor', "-moz-zoom-in");
			that.previewed.clearGetFeature();
		};
		zoomBox.events.register("activate", this, zoomBoxListener);
		var panListener = function() {
			jQuery('.olMap').css('cursor', "-moz-grab");
			that.previewed.clearGetFeature();
		};
		var panHand = new OpenLayers.Control.ModNavigation({
			title : "Pan by dragging the map"
		});
		
		panHand.events.register("activate", this, panListener);
		var globalExtent = new OpenLayers.Control.ModZoomToMaxExtent({
			title : "Zoom to global extent"
		});
		var panel = new OpenLayers.Control.Panel({
			defaultControl : panHand
		});

		var displayCoords = new OpenLayers.Control.MousePosition({
			displayProjection : new OpenLayers.Projection("EPSG:4326")
		});

		panel.addControls([ globalExtent, nav.previous, nav.next, zoomBox,
				panHand ]);

		var zoomBar = new OpenLayers.Control.ModPanZoomBar();
		var scaleLine = new OpenLayers.Control.ScaleLine();

		var attribution = new OpenLayers.Control.Attribution();
		
		var controls = [zoomBar, scaleLine, displayCoords, nav, panel, attribution ];
		return controls;
	};

	/**
	 * Calculate the initial zoom level for the map based on window size
	 * 
	 * @returns {Number} - initial zoom level
	 */
	this.getInitialZoomLevel = function() {
		var initialZoom = 1;

		if (jQuery('#' + this.containerDiv).parent().height() > 810) {
			initialZoom = 2;
			// TODO: this should be more sophisticated. width is also important
			// initialZoom = Math.ceil(Math.sqrt(Math.ceil(jQuery('#' +
			// this.containerDiv).parent().height() / 256)));
		}
		return initialZoom;
	};

	/**
	 * Instantiate the actual OpenLayers map object, set parameters
	 * 
	 * @param {object}
	 *            userOptions - options to pass through to the OpenLayers Map
	 *            object
	 */
	this.createOLMap = function(userOptions) {
		// set default OpenLayers map options
		this.mapDiv = this.containerDiv + "OLMap";

		var mapBounds = new OpenLayers.Bounds(-20037508.34, -20037508.34,
				20037508.34, 20037508.34);
		var controls = this.createOLControls();
		var initialZoom = this.getInitialZoomLevel();
		var options = {
			allOverlays : true,
			projection : new OpenLayers.Projection("EPSG:3857"),
			maxResolution : 2.8125,
			maxExtent : mapBounds,
			numZoomLevels: 19,
			units : "m",
			zoom : initialZoom,
			controls : controls
		};

		// merge default options and user specified options into 'options'--not
		// recursive
		jQuery.extend(userOptions, options);

		// div defaults to 0 height for certain doc-types; we want the map to
		// fill the parent container
		var initialHeight;
		if (initialZoom === 1){
			initialHeight = 512;
		} else {
			initialHeight = jQuery("#" + this.containerDiv).parent().height();
		}
		jQuery('#' + this.mapDiv).height(initialHeight).width(jQuery("#" + this.containerDiv).parent().width());
		
		// attempt to reload tile if load fails
		OpenLayers.IMAGE_RELOAD_ATTEMPTS = 3;
		OpenLayers.ImgPath = "resources/media/";
		// make OL compute scale according to WMS spec
		OpenLayers.DOTS_PER_INCH = 91;//0.71428571428572;
		OpenLayers.Util.onImageLoadErrorColor = 'transparent';

		// call OpenLayers.Map with function arguments
		this.ol = new OpenLayers.Map("ogpMap", options);
	};

	/**
	 * Initialize the Basemaps collection, set the initial basemap
	 * 
	 * @default - the default basemap is "googlePhysical"
	 */
	this.initBasemaps = function() {
		// populate the basemaps collection
		this.basemaps = this.createBaseMaps();

		// set default background map; should get this value from config instead
		var defaultBasemapModel = this.basemaps.findWhere({
			name : "googlePhysical"
		});
		defaultBasemapModel.set({
			selected : true
		});
		defaultBasemapModel.get("initialRenderCallback").apply(this,
				[ defaultBasemapModel.get("type") ]);

	};

	/**
	 * Populates the map toolbar with controls.
	 * 
	 * @requires OpenGeoportal.Utility
	 */
	this.addMapToolbarElements = function() {

		this.addMapToolbarButton({
			displayClass : "saveImageButton",
			title : "Save map image",
			buttonText : "Save Image"
		}, this.saveImage);

		this.addMapToolbarButton({
			displayClass : "printButton",
			title : "Print map",
			buttonText : "Print"
		}, OpenGeoportal.Utility.doPrint);

		// add the HTML for the basemap menu to the toolbar
		var elId = "basemapMenu";
		this.addToMapToolbar(this.template.get('genericDiv')({
			elId: elId,
			elClass: ""
		}));

		// the menu itself is implemented as a view of the Basemap collection
		this.basemapMenu = new OpenGeoportal.Views.CollectionSelect({
			collection : this.basemaps,
			el : "div#" + elId,
			valueAttribute : "name",
			displayAttribute : "displayName",
			buttonLabel : "Basemap",
			itemClass : "baseMapMenuItem"
		});

	};


	/**
	 * register event handlers for the map
	 */
	
	this.moveEventId = null;
	
	this.registerMapEvents = function() {
		var that = this;
		// register events
		
		jQuery(document).on("container.resize", function(e, data) {

			//update the size of the map if the container size actually changed.
			var map$ = jQuery(".olMap");

			var newHeight = Math.max(data.ht, data.minHt);
			var oldHeight = map$.height();
			
			var newWidth = Math.max(data.wd, data.minWd);
			var oldWidth = map$.width();
			
			if (newHeight !== oldHeight || newWidth !== oldWidth){
				map$.height(newHeight).width(newWidth);
				that.ol.updateSize();
			}
			
		});
		

		// OpenLayers event
	
		this.ol.events.register('zoomend', this, function() {
			var zoomLevel = that.ol.getZoom();		
			
			that.basemaps.checkZoom(zoomLevel);

			var mapHeight = Math.pow((zoomLevel + 1), 2) / 2 * 256;
			var containerHeight = jQuery("#" + that.mapDiv).parent().parent()
					.height();
			if (mapHeight > containerHeight) {
				mapHeight = containerHeight;
			}

			if (jQuery("#" + that.mapDiv).height() != mapHeight) {
				jQuery("#" + that.mapDiv).height(mapHeight);// calculate min and
				// max sizes
				that.ol.updateSize();
				//console.log("update map size");
			}
			if (zoomLevel == 1) {
				that.ol.setCenter(that.WGS84ToMercator(0, 0));
				//that.ol.setCenter(that.WGS84ToMercator(that.getSearchCenter().lon, 0));
			}
			
			
		});
		
		// OpenLayers event
		this.ol.events.register('moveend', this, function() {
			//var d = new Date();
			//console.log("moveend: " + d.getTime());
			var newExtent = that.getSearchExtent();
			var newCenter = that.getSearchCenter();

			/*
			 * Translate the OpenLayers event to a jQuery event used by the
			 * application. This is the event used to trigger a search on map
			 * move. cluster moveend events so that we don't fire too often
			 * 
			 * @fires "map.extentChanged"
			 */
			
			clearTimeout(this.moveEventId);
			
			var trigger = function(){
				//console.log("extentChanged triggered");
				jQuery(document).trigger('map.extentChanged', {
					mapExtent : newExtent,
					mapCenter : newCenter
				});
			};
			
			this.moveEventId = setTimeout(trigger, 100);


		});

		this.bboxHandler();
		this.styleChangeHandler();
		this.opacityHandler();
		this.zIndexHandler();
		this.zoomToLayerExtentHandler();
		this.previewLayerHandler();
		this.getFeatureInfoHandler();
		this.clearLayersHandler();
		this.mouseCursorHandler();
		this.loadIndicatorHandler();
		
	};

	/**
	 * Appends HTML to the map tool bar.
	 */
	this.addToMapToolbar = function(markup) {
		// this has a hidden dependency on the map toolbar template. Should be a
		// better way to do this, but its hard not to have some sort of
		// dependency on the template. Maybe it's better to just pass everything
		// in to the template on construction, rather than adding after the
		// fact.

		jQuery("#ogpMapButtons").append(markup);
	};

	/**
	 * Parameter object for MapButton template
	 * 
	 * @typedef {Object} MapButtonParams
	 * @property {string} displayClass - new button has this css class
	 * @property {string} title - button title (tooltip)
	 * @property {string} buttonText - text for the button
	 */

	/**
	 * Appends a button to the map toolbar.
	 * 
	 * @param {MapButtonParams}
	 * @param {function}
	 *            clickCallback - Function called when the button is clicked.
	 */
	this.addMapToolbarButton = function(displayParams, clickCallback) {

		this.addToMapToolbar(this.template.get('mapButton')(displayParams));
		var that = this;
		jQuery("." + displayParams.displayClass).button().on("click",
				function() {
					clickCallback.call(that);
				});
	};

	/***************************************************************************
	 * basemap handling
	 **************************************************************************/
	this.googleMapsRenderCallback = function(type) {
		var bgMap = this.ol.getLayersBy("basemapType", type)[0];
		var that = this;
		this.ol.render(this.mapDiv);
		google.maps.event.addListener(bgMap.mapObject, "tilesloaded",
				function() {
					// let the application know that the map is ready
					jQuery(document).trigger("mapReady");
					// should only fire the first time (or should
					// only listen the first time)
					google.maps.event.clearListeners(bgMap.mapObject,
							"tilesloaded");

					// Make sure Google logos, etc are displayed
					jQuery("div.olLayerGooglePoweredBy").children()
						.css("display", "block");
					// find the google logo and add class ".googleLogo",
					// so we can make sure it always shows
					jQuery("[id$=GMapContainer]").find('[title*="Click to see this area"]').parent()
							.addClass("googleLogo");

					// display the map once the google tiles are loaded
					jQuery("#" + that.containerDiv).fadeTo("slow", 1);

				});
	};

	this.initialRenderCallback = function(type) {
		// console.log("osm initial render callback");
		var that = this;
		this.ol.render(this.mapDiv);

		var bgMap = this.ol.getLayersBy("basemapType", type)[0];
		bgMap.events.register(bgMap.mapObject, "loadend", function() {
			// console.log("Tiles loaded");
			// let the application know that the map is ready
			jQuery(document).trigger("mapReady");
			// really should only fire the first time
			bgMap.events.unregister(bgMap.mapObject, "loadend");
			jQuery("#" + that.containerDiv).fadeTo("slow", 1);
		});
	};

	/**
	 * @this - the base map model
	 * @returns {OpenLayers.Layer.Google}
	 */
	this.googleMapsLayerDefinition = function() {
		var bgMap = new OpenLayers.Layer.Google(this.get("displayName"), {
			type : this.get("subType"),
			basemapType : this.get("type"),
			layerRole : "basemap"
		}, {
			animationEnabled : true
		});
		return bgMap;
	};

	/**
	 * @this - the base map model
	 * @returns {OpenLayers.Layer.Bing}
	 */
	this.bingMapsLayerDefinition = function() {

		var bgMap = new OpenLayers.Layer.Bing({
			name : this.get("displayName"),
			type : this.get("subType"),
			// get this from config
			key : "getYourOwnKeyFromMicrosoft"
		});
		bgMap.basemapType = this.get("type");
		bgMap.layerRole = "basemap";
		bgMap.wrapDateLine = true;
		return bgMap;
	};

	this.googleMapsShow = function(model) {
		// see if there is a basemap layer of the specified type
		if (this.ol.getLayersBy("basemapType", model.get("type")).length === 0) {
			// add the appropriate basemap layer
			this.ol.addLayer(model.get("getLayerDefinition").call(model));
		} else {
			var layer = this.ol.getLayersBy("basemapType", model.get("type"))[0];
			layer.mapObject.setMapTypeId(model.get("subType"));
			layer.type = model.get("subType");
			layer.setVisibility(true);
		}
		jQuery("div.olLayerGooglePoweredBy").children().css("display", "block");
		
		if (model.has("secondaryZoomMap")){
			model.collection.checkZoom(this.ol.getZoom());
		}
	};

	this.bingMapsShow = function(model) {
		// see if there is a basemap layer of the specified type
		if (this.ol.getLayersBy("basemapType", model.get("type")).length === 0) {
			// add the appropriate basemap layer
			this.ol.addLayer(model.get("getLayerDefinition").call(model));
		} else {
			var layer = this.ol.getLayersBy("basemapType", model.get("type"))[0];
			layer.setVisibility(true);
		}

	};

	this.baseMapHide = function(model) {
		var layer = this.ol.getLayersBy("basemapType", model.get("type"))[0];
		layer.setVisibility(false);
	};

	/**
	 * @requires OpenGeoportal.BasemapCollection
	 * 
	 * @returns {OpenGeoportal.BasemapCollection}
	 */
	this.createBaseMaps = function() {
		var that = this;
		var googlePhysical = {
			displayName : "Google Physical",
			name : "googlePhysical",
			selected : false,
			subType : google.maps.MapTypeId.TERRAIN,
			type : "Google",
			zoomLevels : 15,
			secondaryZoomMap: "googleStreets",
			getLayerDefinition : that.googleMapsLayerDefinition,
			showOperations : function() {
				that.googleMapsShow(this);
			},
			hideOperations : function() {
				that.baseMapHide(this);
				jQuery("div.olLayerGooglePoweredBy").children().css("display",
						"none");
			},
			initialRenderCallback : that.googleMapsRenderCallback
		};

		var googleHybrid = {
			displayName : "Google Hybrid",
			name : "googleHybrid",
			selected : false,
			subType : google.maps.MapTypeId.HYBRID,
			type : "Google",
			zoomLevels : 21,
			getLayerDefinition : that.googleMapsLayerDefinition,
			showOperations : function() {
				that.googleMapsShow(this);
			},
			hideOperations : function() {
				that.baseMapHide(this);
				jQuery("div.olLayerGooglePoweredBy").children().css("display",
						"none");
			},
			initialRenderCallback : that.googleMapsRenderCallback
		};

		var googleSat = {
			displayName : "Google Satellite",
			name : "googleSatellite",
			selected : false,
			subType : google.maps.MapTypeId.SATELLITE,
			type : "Google",
			zoomLevels : 21,
			getLayerDefinition : that.googleMapsLayerDefinition,
			showOperations : function() {
				that.googleMapsShow(this);
			},
			hideOperations : function() {
				that.baseMapHide(this);
				jQuery("div.olLayerGooglePoweredBy").children().css("display",
						"none");
			},
			initialRenderCallback : that.googleMapsRenderCallback
		};

		var googleStreets = {
			displayName : "Google Streets",
			name : "googleStreets",
			selected : false,
			subType : google.maps.MapTypeId.ROADMAP,
			type : "Google",
			zoomLevels : 21,
			getLayerDefinition : that.googleMapsLayerDefinition,
			showOperations : function() {
				that.googleMapsShow(this);
			},
			hideOperations : function() {
				that.baseMapHide(this);

				jQuery("div.olLayerGooglePoweredBy").children().css("display",
						"none");
			},
			initialRenderCallback : that.googleMapsRenderCallback
		};

		var osm = {
			displayName : "OpenStreetMap",
			name : "osm",
			selected : false,
			type : "osm",
			subType : "osm",
			zoomLevels : 19,
			getLayerDefinition : function() {
				var attribution = "Tiles &copy; <a href='http://openstreetmap.org/'>OpenStreetMap</a> contributors, CC BY-SA &nbsp;";
				attribution += "Data &copy; <a href='http://openstreetmap.org/'>OpenStreetMap</a> contributors, ODbL";
				
				var bgMap = new OpenLayers.Layer.OSM(this.get("displayName"),
						null, {
							attribution: attribution,
							basemapType : this.get("type"),
							layerRole : "basemap"
						});

				
				return bgMap;
			},

			showOperations : function() {
				// see if there is a basemap layer of the specified type
				if (that.ol.getLayersBy("basemapType", this.get("type")).length === 0) {
					// add the appropriate basemap layer
					var newLayer = this.get("getLayerDefinition").call(this);
					var displayLayers = that.ol.layers; // getLayerIndex
					var highestBasemap = 0;
					for ( var i in displayLayers) {
						if (displayLayers[i].layerRole != "basemap") {
							var indx = that.ol.getLayerIndex(displayLayers[i]);
							that.ol.setLayerIndex(displayLayers[i], indx + 1);
						} else {
							highestBasemap = Math.max(highestBasemap, that
									.ol.getLayerIndex(displayLayers[i]));
						}
					}
					that.ol.addLayer(newLayer);
					that.ol.setLayerIndex(newLayer, highestBasemap + 1);
				} else {
					var layer = that.ol.getLayersBy("basemapType", this
							.get("type"))[0];
					layer.setVisibility(true);
				}

			},
			hideOperations : function() {
				that.baseMapHide(this);
			},
			initialRenderCallback : that.initialRenderCallback
		};

		/*
		 * Bing Map Types: 1. Aerial - Aerial imagery. 2. AerialWithLabels -
		 * Aerial imagery with a road overlay. 3. Birdseye - Bird’s eye
		 * (oblique-angle) imagery 4. BirdseyeWithLabels - Bird’s eye imagery
		 * with a road overlay. 5. Road - Roads without additional imagery.
		 */
		var bingAerial = {
			displayName : "Bing Aerial",
			name : "bingAerial",
			selected : false,
			type : "bingAerial",
			subType : "Aerial",
			zoomLevels : 17,
			getLayerDefinition : that.bingMapsLayerDefinition,
			showOperations : function(model) {
				that.bingMapsShow(model);
			},
			hideOperations : function(model) {
				that.baseMapHide(model);
			},
			initialRenderCallback : that.initialRenderCallback
		};

		var bingHybrid = {
			displayName : "Bing Hybrid",
			name : "bingAerialWithLabels",
			selected : false,
			type : "bingHybrid",
			subType : "AerialWithLabels",
			zoomLevels : 17,
			getLayerDefinition : that.bingMapsLayerDefinition,

			showOperations : function(model) {
				that.bingMapsShow(model);
			},
			hideOperations : function(model) {
				that.baseMapHide(model);
			},
			initialRenderCallback : that.initialRenderCallback
		};

		var bingRoad = {
			displayName : "Bing Road",
			name : "bingRoad",
			selected : false,
			type : "bingRoad",
			subType : "Road",
			zoomLevels : 17,
			getLayerDefinition : that.bingMapsLayerDefinition,

			showOperations : function(model) {
				that.bingMapsShow(model);
			},
			hideOperations : function(model) {
				that.baseMapHide(model);
			},
			initialRenderCallback : that.initialRenderCallback
		};

		// Bing maps implementation isn't quite ready for prime time
		var models = [ googlePhysical, googleHybrid, googleStreets, googleSat, osm ];

		// create an instance of the basemap collection
		var collection = new OpenGeoportal.BasemapCollection(models);
		return collection;

	};

	/***************************************************************************
	 * map event handlers
	 **************************************************************************/
	this.opacityHandler = function() {
		var that = this;
		jQuery(document)
				.on(
						"map.opacityChange",
						function(event, data) {
							// console.log(data);
							for ( var i in that.ol.getLayersBy("ogpLayerId",
									data.LayerId)) {
								that.ol.getLayersBy("ogpLayerId", data.LayerId)[0]
										.setOpacity(data.opacity * .01);
							}
						});
	};
	
	this.zIndexHandler = function() {
		var that = this;
		jQuery(document)
				.on(
						"map.zIndexChange",
						function(event, data) {
							// console.log(data);
							for ( var i in that.ol.getLayersBy("ogpLayerId",
									data.LayerId)) {
								that.ol.getLayersBy("ogpLayerId", data.LayerId)[0]
										.setZIndex(data.zIndex);
							}
						});
	};

	this.previewLayerHandler = function() {
		var that = this;
		jQuery(document).on("previewLayerOn", function(event, data) {
			that.previewLayerOn(data.LayerId);
		});

		jQuery(document).on("previewLayerOff", function(event, data) {
			that.previewLayerOff(data.LayerId);
		});
	};

	this.styleChangeHandler = function() {
		var that = this;
		jQuery(document).on("map.styleChange", function(event, data) {
			that.changeStyle(data.LayerId);
		});
	};

	this.bboxHandler = function() {
		var that = this;
		jQuery(document).on("map.showBBox", function(event, bbox) {
			that.showLayerBBox(bbox);
		});
		jQuery(document).on("map.hideBBox", function(event) {
			that.hideLayerBBox();
		});
	};

	this.getFeatureInfoHandler = function() {
		var that = this;
		jQuery(document)
				.on(
						"map.getFeatureInfoOn",
						function(){that.getFeatureAttributesOn.apply(that, arguments)});

		jQuery(document).on(
				"map.getFeatureInfoOff",
				function(){that.getFeatureAttributesOff.apply(that, arguments)});
		
		jQuery(document).tooltip({
			show: 100, 
			hide: false, 
			items: "td.attributeName",
			position: {
				my: "right top",
				at: "left-5 top-7"
				}
			});

	};

	this.zoomToLayerExtentHandler = function() {
		var that = this;
		jQuery(document).on("map.zoomToLayerExtent", function(event, data) {

			that.zoomToLayerExtent(data.bbox);
		});
	};

	/**
	 * event handler to determine cursor behavior and button state behavior for
	 * pan-zoom controls
	 */
	this.mouseCursorHandler = function() {
		var that = this;
		jQuery(document)
				.on(
						"map.attributeInfoOn",
						function() {
							jQuery(".olMap").css('cursor', "crosshair");
							// also deactivate regular map controls
							var zoomControl = that
									.ol.getControlsByClass("OpenLayers.Control.ZoomBox")[0];
							if (zoomControl.active) {
								zoomControl.deactivate();
							}
							var panControl = that
									.ol.getControlsByClass("OpenLayers.Control.Navigation")[0];
							if (panControl.active) {
								panControl.deactivate();
							}
						});
		jQuery(document)
		.on(
				"map.attributeInfoOff",
				function() {
					var zoomControl = that
							.ol.getControlsByClass("OpenLayers.Control.ZoomBox")[0];
					var panControl = that
							.ol.getControlsByClass("OpenLayers.Control.Navigation")[0];
					if (!panControl.active && !zoomControl.active) {
						panControl.activate();
					}
				});
		
		
	};

	/**
	 * event handler to clear map on map clear button click.
	 */
	this.clearLayersHandler = function() {
		var that = this;
		// TODO: this should be in the previewed layers view. clearing the map
		// should update the previewed layers collection, which triggers
		// removal from the map.
		var mapClear$ = jQuery("#mapClearButton");
		mapClear$.button();
		mapClear$.on("click", function(event) {
			that.clearMap();
		});
	};

	this.loadIndicatorHandler = function(){
		this.indicatorCollection = new OpenGeoportal.LoadIndicatorCollection();
		this.indicatorView = new OpenGeoportal.Views.MapLoadIndicatorView({collection: this.indicatorCollection, template: this.template});
	
		var getCriteria = function(e){
			var actionObj = {};

			if (typeof e.loadType === "undefined"){
				actionObj.actionType = "generic";
			} else {
				actionObj.actionType = e.loadType;
			}
			
			if (typeof e.layerId === "undefined"){
				actionObj.actionId = "unspecified";
			} else {
				actionObj.actionId = e.layerId;
			}
			
			return actionObj;
		};
		var that = this;
		jQuery(document).on("showLoadIndicator", function(e){

			that.indicatorCollection.add([getCriteria(e)]);
		});
		
		jQuery(document).on("hideLoadIndicator", function(e){

			var model = that.indicatorCollection.findWhere(getCriteria(e));
			if (typeof model !== "undefined"){
				that.indicatorCollection.remove(model);
			}
		});
	};
	
	
	/***************************************************************************
	 * map utility functions
	 **************************************************************************/
	this.WGS84ToMercator = function(lon, lat) {
		// returns -infinity for -90.0 lat; a bug?
		lat = parseFloat(lat);
		lon = parseFloat(lon);
		if (lat >= 90) {
			lat = 89.99;
		}
		if (lat <= -90) {
			lat = -89.99;
		}
		if (lon >= 180) {
			lon = 179.99;
		}
		if (lon <= -180) {
			lon = -179.99;
		}
		// console.log([lon, "tomercator"])
		return OpenLayers.Layer.SphericalMercator.forwardMercator(lon, lat);
	};

	this.MercatorToWGS84 = function(lon, lat) {
		lat = parseFloat(lat);
		lon = parseFloat(lon);
		var transformedValue = OpenLayers.Layer.SphericalMercator
				.inverseMercator(lon, lat);
		var newLat = transformedValue.lat;
		var newLon = transformedValue.lon;
		if (newLat > 90) {
			newLat = 90;
		}
		if (newLat < -90) {
			newLat = -90;
		}
		if (newLon > 180) {
			newLon = 180;
		}
		if (newLon < -180) {
			newLon = -180;
		}
		return new OpenLayers.LonLat(newLon, newLat);
	};

	/**
	 * Helper function to get the aspect ratio of an OpenLayers.Bounds object
	 * 
	 * @param {Object.
	 *            <OpenLayers.Bounds>} extent
	 * @returns {Number} the aspect ratio of the bounds passed
	 */
	this.getAspectRatio = function(extent) {
		return (extent.getWidth() / extent.getHeight());
	};

	this.hasMultipleWorlds = function() {
		var exp = this.ol.getZoom() + 8;
		var globalWidth = Math.pow(2, exp);

		var viewPortWidth = this.ol.getSize().w - this.getMapOffset().x;

		if (viewPortWidth > globalWidth) {
			// console.log("has multiple worlds");
			return true;
		} else {
			return false;
		}
	};

	this.getMapOffset = function() {
		var offset = OpenGeoportal.Utility.getMapOffset();

		return new OpenLayers.Pixel(offset.x, offset.y);
	};

	this.getVisibleExtent = function() {
		var topLeft = this.ol.getLonLatFromViewPortPx(this.getMapOffset());
		var fullExtent = this.ol.getExtent();
		fullExtent.top = topLeft.lat;
		if (fullExtent.getWidth() >= 40075015.68) {
			fullExtent.left = -20037508.34;
			fullExtent.right = 20037508.34;
		} else {
			fullExtent.left = topLeft.lon;
		}
		return fullExtent;
	};

		//the extent zoomed to will not fit the viewport perfectly. we need to take the
		//difference into consideration as well as the offset from the covered part of the map
		//if this is not possible, we can give a best guess, but it should be possible by
		//reverse engineering the openlayers code for zoom to extent
		
	    /**
	     * APIMethod: zoomToExtent
	     * Zoom to the passed in bounds, recenter
	     * 
	     * Parameters:
	     * bounds - {<OpenLayers.Bounds>}
	     * closest - {Boolean} Find the zoom level that most closely fits the 
	     *     specified bounds. Note that this may result in a zoom that does 
	     *     not exactly contain the entire extent.
	     *     Default is false.
	     * 
	     */
	   
/*		zoomToExtent: function(bounds, closest) {
	        var center = bounds.getCenterLonLat();
	        if (this.baseLayer.wrapDateLine) {
	            var maxExtent = this.getMaxExtent();

	            //fix straddling bounds (in the case of a bbox that straddles the 
	            // dateline, it's left and right boundaries will appear backwards. 
	            // we fix this by allowing a right value that is greater than the
	            // max value at the dateline -- this allows us to pass a valid 
	            // bounds to calculate zoom)
	            //
	            bounds = bounds.clone();
	            while (bounds.right < bounds.left) {
	                bounds.right += maxExtent.getWidth();
	            }
	            //if the bounds was straddling (see above), then the center point 
	            // we got from it was wrong. So we take our new bounds and ask it
	            // for the center. Because our new bounds is at least partially 
	            // outside the bounds of maxExtent, the new calculated center 
	            // might also be. We don't want to pass a bad center value to 
	            // setCenter, so we have it wrap itself across the date line.
	            //
	            center = bounds.getCenterLonLat().wrapDateLine(maxExtent);
	        }
	        this.setCenter(center, this.getZoomForExtent(bounds, closest));
	    },
	    */


	this.getCombinedBounds = function(arrBounds) {

		var newExtent = new OpenLayers.Bounds();
		for ( var currentIndex in arrBounds) {
			var currentBounds = arrBounds[currentIndex];
			newExtent.extend(currentBounds);
		}
		return newExtent;
	};

	this.getMaxLayerExtent = function getMaxLayerExtent(layerId) {
		var bbox = this.previewed.get(layerId).get("bbox");
		var arrBbox = bbox.split(",");
		var newExtent = new OpenLayers.Bounds();

		newExtent.left = arrBbox[0];
		newExtent.right = arrBbox[2];
		newExtent.top = arrBbox[3];
		newExtent.bottom = arrBbox[1];
		return newExtent;
	};

	this.boundsToOLObject = function(model) {
		var newExtent = new OpenLayers.Bounds();
		newExtent.left = model.get("MinX");
		newExtent.right = model.get("MaxX");
		newExtent.top = model.get("MaxY");
		newExtent.bottom = model.get("MinY");

		return newExtent;
	};

	this.getSpecifiedExtent = function getSpecifiedExtent(extentType, layerObj) {
		// this code should be in mapDiv.js, since it has access to the
		// openlayers object
		var extentArr = [];
		var maxExtentForLayers = null;
		if (extentType === "maxForLayers") {
			for ( var indx in layerObj) {

				var arrBbox = this.ol.boundsToOLObject(layerObj[indx]);
				extentArr.push(arrBbox);
			}
			if (extentArr.length > 1) {
				maxExtentForLayers = this.getCombinedBounds(extentArr).toBBOX();
			} else {
				maxExtentForLayers = extentArr[0].toBBOX();
			}
		}
		var extentMap = {
			"global" : "-180,-85,180,85",
			"current" : this.getGeodeticExtent().toBBOX(),
			"maxForLayers" : maxExtentForLayers
		};

		if (typeof extentMap[extentType] !== "undefined") {
			return extentMap[extentType];
		} else {
			throw new Error('Extent type "' + extentType + '" is undefined.');
		}
	};

	this.getBboxFromCoords = function(minx, miny, maxx, maxy) {
		var bbox = [];
		bbox.push(minx);
		bbox.push(miny);
		bbox.push(maxx);
		bbox.push(maxy);
		bbox = bbox.join(",");
		return bbox;
	};

	this.getGeodeticExtent = function() {
		var mercatorExtent = this.getVisibleExtent();
		var sphericalMercator = new OpenLayers.Projection('EPSG:3857');
		var geodetic = new OpenLayers.Projection('EPSG:4326');
		return mercatorExtent.transform(sphericalMercator, geodetic);
	};

	this.getSearchExtent = function() {
		this.ol.updateSize();
		var rawExtent = this.getGeodeticExtent();
		return rawExtent;
	};

	/*this.getSearchCenter = function(pixelOffset) {
		var topLeft = this.getMapOffset();

		if (typeof pixelOffset !== "undefined"){
			topLeft.x = pixelOffset.x;
			topLeft.y = pixelOffset.y;
		} 

		var width = jQuery(".olMap").width();
		var height = jQuery(".olMap").height();
		
		topLeft.x = topLeft.x + width / 2;
		topLeft.y =	topLeft.y - height / 2;
		
		var center = this.ol.getLonLatFromViewPortPx(topLeft);
		if (center == null){
			var res = this.ol.getResolution();
			center = new OpenLayers.LonLat(res * pixelOffset.x, res * pixelOffset.y);
		}
		var sphericalMercator = new OpenLayers.Projection('EPSG:3857');
		var geodetic = new OpenLayers.Projection('EPSG:4326');
		return center.transform(sphericalMercator, geodetic);
	};*/

	this.clipToWorld = function(bounds) {
		return this.clipExtent(bounds,
				new OpenLayers.Bounds(-180, -90, 180, 90));
	};

	this.clipExtent = function(bounds, clipBounds) {
		if (bounds.intersectsBounds(clipBounds)) {
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

	this.getPreviewUrlArray = function(layerModel, useTilecache) {
		// is layer public or private? is this a request that can be handled by
		// a tilecache?
		var isTilecache = false;
		var isProxy = false;
		
		var urlArraySize = 1; // this seems to be a good size for OpenLayers performance
		var urlArray = [];
		var populateUrlArray = function(addressArray) {
			if (addressArray.length == 1) {
				for (var i = 0; i < urlArraySize; i++) {
					urlArray[i] = addressArray[0];
				}
			} else {
				urlArray = addressArray;
			}

		};

		// check for a proxy here
		var proxy = OpenGeoportal.Config.getWMSProxy(layerModel
				.get("Institution"), layerModel.get("Access"));
		if (proxy) {
			layerModel.set({
				wmsProxy : proxy
			});
		}

		if (layerModel.has("wmsProxy")) {
			populateUrlArray([ layerModel.get("wmsProxy") ]);
			isProxy = true;
		} else if ((typeof layerModel.get("Location").tilecache !== "undefined")
				&& useTilecache) {
			populateUrlArray(layerModel.get("Location").tilecache);
			isTilecache = true;
		} else {
			populateUrlArray(layerModel.get("Location").wms);
		}

		// console.log(urlArray);
		var response = {
				urls: urlArray,
				isTilecache: isTilecache,
				isProxy: isProxy
		};
		return response;
	};

	/***************************************************************************
	 * map actions and requests
	 **************************************************************************/
	this.clearMap = function() {
		this.previewed.each(function(model) {
			model.set({
				preview : "off"
			});
		});
	};

	this.zoomToLayerExtent = function(extent) {
		
		var layerExtent = OpenLayers.Bounds.fromString(extent);
		var lowerLeft = this.WGS84ToMercator(layerExtent.left,
				layerExtent.bottom);
		var upperRight = this.WGS84ToMercator(layerExtent.right,
				layerExtent.top);

		var newExtent = new OpenLayers.Bounds();
		newExtent.extend(new OpenLayers.LonLat(lowerLeft.lon, lowerLeft.lat));
		newExtent.extend(new OpenLayers.LonLat(upperRight.lon, upperRight.lat));

		//this.addMapBBox(newExtent.toArray());

		var newZoom = this.ol.getZoomForExtent(newExtent);

		this.setAdjustedCenter(newExtent.getCenterLonLat(), newZoom)
	};
	
	this.setAdjustedCenter = function(lonlat, zoom){
		//if the results panel is closed we need to anticipate the width of the results panel

		var res = this.ol.getResolution();//ForZoom(zoom);	
		var adj = this.getMapOffset();	
		lonlat.lon = lonlat.lon - adj.x / 2 * res;
		lonlat.lat = lonlat.lat - adj.y * res;
		
		this.ol.setCenter(lonlat, Math.max(1, zoom));
	};
	
	this.getAdjustedCenter = function(){
		var center;
		if (typeof this.ol.map == "undefined"){
			return new OpenLayers.LonLat(0,0);
		} else {
			center = this.ol.map.getExtent().getCenterPixel();
		}

		var offset = this.getMapOffset();
		center.x = center.x - offset.x;
		center.y = center.y - offset.y;
		return this.ol.getLonLatFromViewPortPx(center);
	};
	
	this.getCenterPixel = function(){
		return new OpenLayers.Pixel(jQuery(".olMap").width()/2, jQuery(".olMap").height()/2);
	};
	
	this.getSearchCenter = function(pixelOffset) {
		/*var topLeft = this.getMapOffset();

		if (typeof pixelOffset !== "undefined"){
			topLeft.x = pixelOffset.x;
			topLeft.y = pixelOffset.y;
		} 

		var width = ;
		var height = jQuery(".olMap").height();
		
		topLeft.x = topLeft.x + width / 2;
		topLeft.y =	topLeft.y - height / 2;
		
		var center = this.ol.getLonLatFromViewPortPx(topLeft);
		if (center == null){
			var res = this.ol.getResolution();
			center = new OpenLayers.LonLat(res * pixelOffset.x, res * pixelOffset.y);
		}*/
		var center = this.getAdjustedCenter();
		console.log(center);
		var sphericalMercator = new OpenLayers.Projection('EPSG:3857');
		var geodetic = new OpenLayers.Projection('EPSG:4326');
		return center.transform(sphericalMercator, geodetic);
	};

	// add layers to OL map
	this.hideLayerBBox = function() {
		if (this.ol.getLayersByName("layerBBox").length > 0) {
			var featureLayer = this.ol.getLayersByName("layerBBox")[0];
			featureLayer.removeAllFeatures();
		}
		jQuery(".corner").hide();
	};

	this.createBBoxLayer = function(name) {
		var style_blue = OpenLayers.Util.extend({},
				OpenLayers.Feature.Vector.style['default']);
		/*
		 * 4px border, border color: #1D6EEF, background color: #DAEDFF, box
		 * opacity: 25%
		 */
		style_blue.strokeColor = "#1D6EEF";
		style_blue.fillColor = "#DAEDFF";
		style_blue.fillOpacity = .25;
		style_blue.pointRadius = 10;
		style_blue.strokeWidth = 4;
		style_blue.strokeLinecap = "butt";
		style_blue.zIndex = 999;

		return new OpenLayers.Layer.Vector(name, {
			style : style_blue,
			displayOutsideMaxExtent : true
		});
	};

	this.generateBounds = function(bbox, displayCentroid){
		var arrFeatures = [];
		if (bbox[0] > bbox[2]) {
			var dateline = this.WGS84ToMercator(180, 0).lon;
			var geom1 = new OpenLayers.Bounds(
					bbox[0], bbox[1], dateline, bbox[3])
					.toGeometry();
			var geom2 = new OpenLayers.Bounds(
					bbox[2], bbox[3], -1 * dateline, bbox[1])
					.toGeometry();
			arrFeatures.push(new OpenLayers.Feature.Vector(geom1));
			arrFeatures.push(new OpenLayers.Feature.Vector(geom2));

			if (displayCentroid){
				arrFeatures.push(new OpenLayers.Feature.Vector(geom1.getCentroid()));
			}
			
		} else {
			var geom = new OpenLayers.Bounds(
					bbox[0], bbox[1], bbox[2], bbox[3]).toGeometry();
			
			var box = new OpenLayers.Feature.Vector(geom);
			
			arrFeatures.push(box);
			
			if (displayCentroid){
				arrFeatures.push(new OpenLayers.Feature.Vector(geom.getCentroid()));
			}
		}
		return arrFeatures;
	};
	
	this.showLayerBBox = function(mapObj) {
		// add or modify a layer with a vector representing the selected feature
		var featureLayer = this.ol.getLayersByName("layerBBox");
		if (featureLayer.length > 0) {
			featureLayer = featureLayer[0];
			this.hideLayerBBox();
		} else {
			featureLayer = this.createBBoxLayer("layerBBox");
			this.ol.addLayer(featureLayer);
		}
		var bottomLeft = this.WGS84ToMercator(mapObj.west, mapObj.south);
		var topRight = this.WGS84ToMercator(mapObj.east, mapObj.north);

		//if pixel distance b/w topRight and bottomLeft falls below a certain threshold, 
		//add a marker(fixed pixel size) in the center, so the user can see where the layer is
		var blPixel = this.ol.getPixelFromLonLat(bottomLeft);
		var trPixel = this.ol.getPixelFromLonLat(topRight);
		var pixelDistance = blPixel.distanceTo(trPixel);
		var threshold = 10;
		var displayMarker = false;
		
		if (pixelDistance <= threshold){
			displayMarker = true;
		}

		
		featureLayer.addFeatures(this.generateBounds([bottomLeft.lon, bottomLeft.lat, topRight.lon, topRight.lat], displayMarker));
		this.ol.setLayerIndex(featureLayer, (this.ol.layers.length - 1));

		// do a comparison with current map extent
		var extent = this.getVisibleExtent();
		var geodeticExtent = this.getGeodeticExtent();
		var mapTop = extent.top;
		if (geodeticExtent.top > 83) {
			mapTop = 238107694;
		}
		var mapBottom = extent.bottom;
		if (geodeticExtent.bottom < -83) {
			mapBottom = -238107694;
		}
		var mapLeft = extent.left;
		if (geodeticExtent.left < -179) {
			mapLeft = -20037510;
		}
		var mapRight = extent.right;
		if (geodeticExtent.right > 180) {
			mapRight = 20037510;
		}

		var layerTop = topRight.lat;
		var layerBottom = bottomLeft.lat;
		var layerLeft = bottomLeft.lon;
		var layerRight = topRight.lon;


		
		var showEWArrows = true;
		// don't show arrows for east and west offscreen if multiple "worlds"
		// are on screen
		if (this.hasMultipleWorlds()) {
			showEWArrows = false;
			mapLeft = -20037510;
			mapRight = 20037510;
			extent.left = mapLeft;
			extent.Right = mapRight;
		}

		if (layerLeft < mapLeft || layerRight > mapRight || layerTop > mapTop
				|| layerBottom < mapBottom) {
			// console.log("should show arrow");

			if (layerTop < mapTop && layerBottom > mapBottom) {
				if (showEWArrows) {
					if (layerRight > mapRight) {
						// console.log("ne + se");
						this.showCorners([ "ne", "se" ]);
					}

					if (layerLeft < mapLeft) {
						// console.log("sw + nw");
						this.showCorners([ "sw", "nw" ]);
					}
				}
			} else if (layerRight < mapRight && layerLeft > mapLeft) {
				if (layerTop > mapTop) {
					// console.log("ne + nw");
					this.showCorners([ "ne", "nw" ]);
				}

				if (layerBottom < mapBottom) {
					this.showCorners([ "se", "sw" ]);
				}

			} else {
				// corners only
				if (layerTop > mapTop && layerRight > mapRight) {
					this.showCorners([ "ne" ]);
				}

				if (layerBottom < mapBottom && layerRight > mapRight) {
					this.showCorners([ "se" ]);
				}

				if (layerTop > mapTop && layerLeft < mapLeft) {
					this.showCorners([ "nw" ]);
				}

				if (layerBottom < mapBottom && layerLeft < mapLeft) {
					this.showCorners([ "sw" ]);
				}

			}

		}

	};

	this.showCorners = function(corners) {
		var cornerIds = {
			ne : "neCorner",
			nw : "nwCorner",
			sw : "swCorner",
			se : "seCorner"
		};

		for ( var i in corners) {
			jQuery("#" + cornerIds[corners[i]]).show();
		}
	};

	/**
	 * Forms a request to save map layers as a composite image, respecting
	 * z-order and SLDs applied. Basemap is not included for legal and technical
	 * reasons. The request is passed to the request queue, where the actual
	 * call to the server is made. Note that the params are not currently
	 * respected.
	 * 
	 * @requires OpenGeoportal.RequestQueue - request queue
	 * @param {string}
	 *            imageFormat
	 * @param {number}
	 *            resolution
	 */
	this.saveImage = function() {
		// TODO: add html5 canvas stuff...may have to wait for OL3?
		var request = this.createImageRequest();
		this.requestQueue.add(request);
	};
	
	this.createImageRequest = function(){

		var requestObj = {};
		requestObj.layers = [];

		for ( var layer in this.ol.layers) {
			var currentLayer = this.ol.layers[layer];
			if (!(currentLayer.CLASS_NAME === "OpenLayers.Layer.WMS" || currentLayer.CLASS_NAME === "OpenLayers.Layer.ArcGIS93Rest")) {
				continue;
			}
			if (currentLayer.visibility === false) {
				continue;
			}
			var layerModel = this.previewed.findWhere({
				LayerId : currentLayer.ogpLayerId
			});
			if (typeof layerModel == "undefined") {
				throw new Error(
						"Layer ['"
								+ currentLayer.ogpLayerId
								+ "'] could not be found in the PreviewedLayers collection.");
			}
			var sld = "";
			if (layerModel.has("sld")) {
				sld = layerModel.get("sld");
			}
			
			var opacity = layerModel.get("opacity");
			if (opacity == 0) {
				continue;
			}
			// insert this opacity value into the sld to pass to the wms server
			var layerObj = {};
			var storedName = layerModel.get("qualifiedName");
			if (storedName == '') {
				layerObj.name = currentLayer.params.LAYERS;
			} else {
				layerObj.name = storedName;
			}
			layerObj.opacity = opacity;
			layerObj.zIndex = this.ol.getLayerIndex(currentLayer);
			if ((typeof sld != 'undefined') && (sld !== null) && (sld != "")) {
				var sldParams = [ {
					wmsName : layerObj.name,
					layerStyle : sld
				} ];
				layerObj.sld = this.createSLDFromParams(sldParams);
			}
			layerObj.layerId = layerModel.get("LayerId");
			requestObj.layers.push(layerObj);
		}

		var extent = this.getVisibleExtent();
		var bbox = extent.toBBOX();

		requestObj.bbox = bbox;
		requestObj.srs = 'EPSG:3857';
		var offset = this.getMapOffset();
		var ar = this.getAspectRatio(extent);

		var currSize = this.ol.getCurrentSize();
		requestObj.width = currSize.w - offset.x;
		requestObj.height = parseInt(requestObj.width / ar);
		// add the request to the queue
		return new OpenGeoportal.Models.ImageRequest(requestObj);
	};


	

	
	this.getFeatureAttributesOn = function(e, data) {
		// generate the query params
		var layerId = data.LayerId;
		
		var layerModels = this.previewed.where({
			LayerId : layerId
		});
		
		
		var ollayers = this.ol.getLayersBy("ogpLayerId", layerId);
		if (ollayers.length == 0) {
			// layer is not in OpenLayers...
			throw new Error(
					"This layer has not yet been previewed.  Please preview it first.");
		} else {
			this.ol.events.register("click", ollayers[0],
					this.getFeatureAttributes);
		}
	};
	
	this.getFeatureAttributesOff = function(e, data){
		// generate the query params
		var layerId = data.LayerId;
		
		var layerModels = this.previewed.where({
			LayerId : layerId
		});
		
		
		var ollayers = this.ol.getLayersBy("ogpLayerId", layerId);
		if (ollayers.length == 0) {
			// layer is not in OpenLayers...
			throw new Error(
					"This layer has not yet been previewed.  Please preview it first.");
		} else {
			this.ol.events.unregister("click", ollayers[0],
					this.getFeatureAttributes);
		}	
	};
	
	
	/**
	 * convert the click on layer event into a param object to request feature info
	 */
	this.getFeatureAttributes = function(e){
			//var layerModel = layerModels[0];
			//var institution = layerModel.get("Institution");
			
			
			var mapExtent = this.map.getExtent();
			var pixel = e.xy;
			
			// geoserver doesn't like fractional pixel values
			var latLon = this.map.getLonLatFromPixel(pixel);
			var layerId = this.ogpLayerId;
			var params = {
					ogpid: layerId,
					coord: latLon.lon + "," + latLon.lat,
					bbox: mapExtent.toBBOX(),
					srs: "EPSG:3857",
					pixel: Math.round(pixel.x) + "," + Math.round(pixel.y),
					size: this.map.size.w + "," + this.map.size.h
			};
				
			//destroy any existing attribute views & collections, abort ongoing requests if possible
			var attributes = new OpenGeoportal.LayerAttributeCollection();
			var attributeView = new OpenGeoportal.Views.LayerAttributeView({collection: attributes});
			
			if (typeof this.map.currentAttributeRequests == "undefined"){
				this.map.currentAttributeRequests = [];
			}

			var that = this;

			attributes.fetch({
				data: params, 
				reset: true,
				beforeSend: function(){
					jQuery(document).trigger({type: "showLoadIndicator", loadType: "getFeature", layerId: layerId});
					//close any open attribute dialogs
					while (that.map.currentAttributeRequests.length > 0){
						that.map.currentAttributeRequests.pop().close();
					}

					that.map.currentAttributeRequests.push(attributeView);

				},
				complete: function(){
					jQuery(document).trigger({type: "hideLoadIndicator", loadType: "getFeature", layerId: layerId});
				}});
			

				//analytics.track("Layer Attributes Viewed", institution, layerId);

		};


	this.startService = function(layerModel) {
		// if layer has a startService value in the location field, try to start
		// the service via the provided url
		var requestObj = {};
		requestObj.AddLayer = [ layerModel.get("qualifiedName") ];
		requestObj.ValidationKey = "OPENGEOPORTALROCKS";
		var params = {
			url : layerModel.get("Location").serviceStart,
			dataType : "jsonp",
			data : requestObj,
			type : "GET",
			traditional : true,
			complete : function() {
				jQuery(document).trigger({type: "hideLoadIndicator", loadType: "serviceStart", layerId: layerModel.get("LayerId")});

			},
			statusCode : {
				200 : function() {
					jQuery(document).trigger(
							layerModel.get("LayerId") + 'Exists');
				},
				500 : function() {
					throw new Error("layer could not be added");
				}
			}
		};

		jQuery(document).trigger({type:"showLoadIndicator", loadType: "serviceStart", layerId: layerModel.get("LayerId")});

		jQuery.ajax(params);
	};

	this.setWmsLayerInfo = function(model) {
		var queryData = {
			ogpid : model.get("LayerId")
		};
		var ajaxParams = {
			type : "GET",
			url : 'info/wmsInfo', // don't throw a 500 error for layers with
									// service start. otherwise, throw the
									// error, or note in 200 response
			data : queryData,
			dataType : 'json',
			success : function(data) {
				// {"owsProtocol":"WMS","infoMap":{"owsUrl":"http://geoserver01.uit.tufts.edu/wfs/WfsDispatcher?","owsType":"WFS","qualifiedName":"sde:GISPORTAL.GISOWNER01.WORLDBOUNDARIES95"},"owsDescribeInfo":null}
				// jQuery("body").trigger(model.get("qualifiedName") +
				// 'Exists');
				model.set({
					qualifiedName : data.infoMap.qualifiedName
				});
				// should we also set a wfs or wcs if found?...if the dataType
				// is unknown, it should be updated to vector or raster
			},
			error : function() {

				// let the user know the layer is not previewable
				// remove the layer from preview panel
				// throw new Error("layer could not be added");
				//console.log("got an error trying to get layer info");
			},
			complete : function() {
				//jQuery("body").trigger(model.get("LayerId") + 'Exists');

				jQuery(document).trigger({type: "hideLoadIndicator", loadType: "getWmsInfo", layerId: model.get("LayerId")});
			}
		};
		jQuery.ajax(ajaxParams);
		//for now, don't wait for wmsinfo response to start loading the layer; perhaps only call if there is an error
		jQuery(document).trigger(model.get("LayerId") + 'Exists');

		jQuery(document).trigger({type: "showLoadIndicator", loadType: "getWmsInfo", layerId: model.get("LayerId")});

	};

	this.layerExists = function(layerModel) {
		// otherwise, do a wms describe layer to make sure the layer is there
		// before
		// attempting to add it to the map (must be proxied). handling wms
		// errors is non-trivial, since,
		// by design, OpenLayers requires an error of type 'image' from the wms
		// server
		// (OpenLayers is merely dynamically setting the src attribute of img
		// tags)
		// console.log(mapObj);
		if (typeof layerModel.get("Location").wms !== "undefined") {
			this.setWmsLayerInfo(layerModel);
		} else {
			// assume it exists
			jQuery(document).trigger(layerModel.get("LayerId") + 'Exists');
		}
	};

	/***************************************************************************
	 * style (SLD) handling
	 **************************************************************************/

	this.changeStyle = function(layerId) {
		var layer = this.ol.getLayersBy("ogpLayerId", layerId)[0];
		if (typeof layer === 'undefined') {
			console.log("layer with id=['" + layerId + "'] not found on map.");
			// should we try to add it then?
			return;
		}

		var layerModel = this.previewed.findWhere({
			LayerId : layerId
		});
		if (typeof layerModel === "undefined") {
			throw new Error(
					"This layer can't be found in the PreviewedLayers collection.");
		}

		// don't use a tilecache
		layer.url = this.getPreviewUrlArray(layerModel, false).urls;
		//if the url array is still from a tilecache, we should throw an error or notify the user.
		
		var style = {};
		var typ = layerModel.get("previewType")
		if (typ === "wms"){
			style = this.styleWMS(layerModel);
		} else if (typ === "arcgisrest"){
			style = this.styleArcGISRest(layerModel);
		}
		
		layer.mergeNewParams(style);

	};

	this.styleWMS = function(layerModel){
		// console.log(layerModel);
		var dataType = layerModel.get("DataType").toLowerCase();
		var userSLD = {};
		// we need this for now, since the tilecache name and geoserver name for
		// layers is different for Harvard layers
		var wmsName = layerModel.get("qualifiedName");

		var userColor = layerModel.get("color");
		var userWidth = layerModel.get("graphicWidth");
		switch (dataType) {
		case "polygon":
			// for polygons
			userSLD.symbolizer = {};
			userSLD.symbolizer.Polygon = {};
			userSLD.symbolizer.Polygon.fill = true;
			userSLD.symbolizer.Polygon.fillColor = userColor;
			if (userWidth > 0) {
				userSLD.symbolizer.Polygon.stroke = true;
				userSLD.symbolizer.Polygon.strokeWidth = userWidth;
				userSLD.symbolizer.Polygon.strokeColor = this
						.getBorderColor(userColor);
			}
			break;
		case "point":
			// for points
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
			// for lines
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
		var arrSLD = [ {
			wmsName : wmsName,
			layerStyle : layerUniqueInfo
		} ];
		var newSLD = {
			layers : wmsName,
			sld_body : this.createSLDFromParams(arrSLD)
		};

		layerModel.set({
			sld : layerUniqueInfo
		});
		
		return newSLD;
	};
	
	this.styleArcGISRest = function(layerModel){
		var dataType = layerModel.get("DataType").toLowerCase();

		var layerIds = layerModel.get("Name");
		var userColor = layerModel.get("color"); //convert to rgba
		var userWidth = layerModel.get("graphicWidth");
		
		var style = {};

		switch (dataType) {
		case "polygon":
			// for polygons
			style = {
			  "type": "esriSFS",
			  "style": "esriSFSSolid",
			  "color": this.hexToRgba(userColor),
			    "outline": {
			     "type": "esriSLS",
			     "style": "esriSLSSolid",
			     "color": this.hexToRgba(this.getBorderColor(userColor, true)),
			     "width": userWidth
				 }
			};

			break;
		case "point":
			// for points
			style = {
				"type": "esriSMS",
				"style": "esriSMSCircle",
				"color": this.hexToRgba(userColor),
				"size": userWidth
			};

			break;
		case "line":
			// for lines
			style = {
				"type": "esriSLS",
				"style": "esriSLSSolid",
				"color": this.hexToRgba(userColor),
				"width": userWidth
				};

			break;
		default:
			return;
		}
		//do you have to submit a separate dynamic layer for each layer Id?
		var arrLayerIds = [0];
		if (layerIds.length > 0){
			arrLayerIds = layerIds.split(",");
		}
		
		var dynamicLayers = [];

		for (var i = 0; i < arrLayerIds.length; i++){
			var info = {
				"id":arrLayerIds[i],
				"source":{"type":"mapLayer","mapLayerId":arrLayerIds[i]},
				"drawingInfo":{"renderer":{"type": "simple", "symbol": style, "transparency":0,"labelingInfo" : null}}
			};
			dynamicLayers.push(info);
		}
		
		layerModel.set({
			drawingInfo : dynamicLayers
		});
		
		return {"dynamicLayers": JSON.stringify(dynamicLayers)};
	};
	
	this.hexToRgba = function(hexColor){
		hexColor = hexColor.substring(1,7);
		var hexTo = function(h,from,to) {return parseInt(h.substring(from,to),16);};
		return [hexTo(hexColor, 0, 2), hexTo(hexColor, 2, 4), hexTo(hexColor, 4, 6), 255];

	};
	
	this.getBorderColor = function(fillColor, asRGB) {
		// calculate an appropriate border color
		var borderColor = {};
		borderColor.red = fillColor.slice(1, 3);
		borderColor.green = fillColor.slice(3, 5);
		borderColor.blue = fillColor.slice(5);
		
		for ( var color in borderColor) {
			// make the border color darker than the fill
			var tempColor = parseInt(borderColor[color], 16) - parseInt(0x50);
			if (tempColor < 0) {
				// so we don't get any negative values for color
				tempColor = 0;
			}
			
			color = tempColor;
		}
		
		if (typeof asRGB !== "undefined" && asRGB){
			return [borderColor.red, borderColor.green, borderColor.blue, 255];
		} else {
			// convert to hex
			for ( var color in borderColor) {
				tempColor = color.toString(16);
			    // check length; the string should be 2 characters
			    if (tempColor.length == 2) {
			    	borderColor[color] = tempColor;
			    } else if (tempColor.length == 1) {
			    	borderColor[color] = '0' + tempColor;
			    } else {
			    	borderColor[color] = '00';
			    }
			}
		// reassemble the color string

			return "#" + borderColor.red + borderColor.green + borderColor.blue;
		}
	};

	this.createSLDFromParams = function(arrUserParams) {
		var userSLD = {
			namedLayers : []
		};
		for ( var i in arrUserParams) {
			var currentRule = new OpenLayers.Rule(arrUserParams[i].layerStyle);
			var currentStyle = new OpenLayers.Style("", {
				rules : [ currentRule ]
			});
			currentStyle = {
				name : arrUserParams[i].wmsName,
				userStyles : [ currentStyle ]
			};
			userSLD.namedLayers.push(currentStyle);
		}
		var newSLD = new OpenLayers.Format.SLD().write(userSLD);
		return newSLD;
	};

	/***************************************************************************
	 * map preview functions
	 **************************************************************************/

	this.hideLayer = function(layerId) {
		var layers = this.ol.getLayersBy("ogpLayerId", layerId);

		for ( var i in layers) {
			layers[i].setVisibility(false);
		}

	};

	this.showLayer = function(layerId) {
		var layers = this.ol.getLayersBy("ogpLayerId", layerId);
		for ( var i in layers) {
			layers[i].setVisibility(true);
		}
	};

	this.addMapBBox = function(bbox) {
		
		var featureLayer = this.createBBoxLayer("zoomExtent");
		this.ol.addLayer(featureLayer);
		featureLayer.addFeatures(this.generateBounds(bbox, false));
		this.ol.setLayerIndex(featureLayer, (this.ol.layers.length - 1));
		console.log("should have added bounding box");
		console.log(bbox);
	};


	
	this.getLayerName = function(layerModel, url) {
		var layerName = layerModel.get("Name");
		var wmsNamespace = "";
		if (layerModel.has("WorkspaceName")){
			wmsNamespace = layerModel.get("WorkspaceName");
		}
		//if there is a workspace name listed and the layername doesn't already contain one, prepend it
		var qualifiedName = layerName;
		if ((wmsNamespace.length > 0) && (layerName.indexOf(":") == -1)) {
			qualifiedName = wmsNamespace + ":" + layerName;
		}

		layerModel.set({
			qualifiedName : qualifiedName
		});

		// tilecache and GeoServer names are different for Harvard layers
		if (layerModel.get("Institution") === "Harvard") {
			var tilecacheName = layerName.substr(layerName.indexOf(".") + 1);
			tilecacheName = tilecacheName.substr(layerName.indexOf(":") + 1);
			
			layerModel.set({
				tilecacheName : tilecacheName
			});
			
			//see if used url matches the tilecache url
			if (layerModel.get("Location").tilecache[0] === url){
				layerName = layerModel.get("tilecacheName")
			} else {
				layerName = qualifiedName;
			}
		} else {
			layerName = qualifiedName;
		}

		return layerName;
	};
	
	this.getMaxZ = function(){
		var arrZ = [];
		_.each(this.ol.layers, function(layer){
				arrZ.push(layer.getZIndex());
			});
		return _.max(arrZ);
	},
	
	this.getNextZ = function(){
		return this.getMaxZ() + 5;
	},
	
	this.handleExisting = function(layerModel){
		var layerId = layerModel.get("LayerId");
		var opacity = layerModel.get("opacity");
		var matchingLayers = this.ol.getLayersBy("ogpLayerId", layerId);
		var that = this;

		if (matchingLayers.length > 1) {
			throw new Error("ERROR: There should never be more than one copy of the layer on the map");
		} else if (matchingLayers.length === 1){
		
			_.each(matchingLayers, function(layer){
				var nextZ = that.getNextZ();
				layerModel.set({zIndex: nextZ});
			
				that.showLayer(layerId);
				layer.setOpacity(opacity * .01);
			
			});
			return;
		}
		
	};
	
	this.addWMSLayer = function(layerModel) {
		this.handleExisting(layerModel);

		var layerId = layerModel.get("LayerId");
		// check to see if layer is on openlayers map, if so, show layer
		var opacitySetting = layerModel.get("opacity");
		var that = this;
		

		// use a tilecache if we are aware of it
		var previewObj = this.getPreviewUrlArray(layerModel, true);
	
		var wmsArray = previewObj.urls;
		var isTilecache = previewObj.isTilecache;
		// won't actually do anything, since noMagic is true and transparent is
		// true
		var format;
		if (layerModel.isVector) {
			format = "image/png";
		} else {
			format = "image/jpeg";
		}

		
		// we do a check to see if the layer exists before we add it
		jQuery(document).bind(layerModel.get("LayerId") + 'Exists',
				function() {
					// if this is a raster layer, we should use jpeg format, png for vector
					// (per geoserver docs)
					var layerName = that.getLayerName(layerModel, wmsArray[0]);
					var version = "1.3.0";
					if (isTilecache){
						//geowebcache doesn't support wms 1.3.0 
						version = "1.1.1";
					}
					
					var newLayer = new OpenLayers.Layer.WMS(
							layerModel.get("LayerDisplayName"), 
							wmsArray, 
						{
							layers : layerName, 
							format : format,
							tiled : true,
							exceptions : "application/vnd.ogc.se_xml",
							transparent : true,
							version : version
						}, {
							transitionEffect : 'resize',
							opacity : opacitySetting * .01,
							ogpLayerId : layerModel.get("LayerId"),
							ogpLayerRole : "LayerPreview"
					});
			
					newLayer.events.register('loadstart', newLayer, function() {
						//console.log("Load start");
						jQuery(document).trigger({type: "showLoadIndicator", loadType: "layerLoad", layerId: layerModel.get("LayerId")});
					});

					newLayer.events.register('loadend', newLayer, function() {
						//console.log("Load end");
						jQuery(document).trigger({type: "hideLoadIndicator", loadType: "layerLoad", layerId: layerModel.get("LayerId")});
					});
					
					that.ol.addLayer(newLayer);
					try {
						layerModel.set({zIndex: newLayer.getZIndex()}, {silent: true});
					} catch (e){
						console.log(e);
						console.log(newLayer.getZIndex());
					}
				});
		this.layerExists(layerModel);

	};

	/**
	 * @author Allen Lin, U of MN
	 * 
	 */ 
	this.addArcGISRestLayer = function(layerModel) {
		this.handleExisting(layerModel);

		var layerId = layerModel.get("LayerId");
		// check to see if layer is on openlayers map, if so, show layer
		var opacitySetting = layerModel.get("opacity");
		

		//throws an error if the location key is not found, but should never get here
		//since the key is used to pick this preview method
		var url = OpenGeoportal.Utility.getLocationValueIgnoreCase(layerModel.get("Location"), "ArcGISRest");
		url = this.filterAGSLink(url);

		var layername = layerModel.get("Name");
		layers = "";
		if (layername.length > 0 && !isNaN(parseFloat(layername[0])) && isFinite(layername[0])){
			layers = "show:" + layername;
		} else {
			layers = "hide:99"; //this assumes that we want to show ALL layers (and that there are less than 100)
		}
		var agsParams = 				{
				transparent : true,
				dpi: 91	//match what we set OpenLayers DPI to be
			};
		
		if (layers.length > 0){
			agsParams.layers = layers;
		}
		
		var newLayer = new OpenLayers.Layer.ArcGIS93Rest(
				layerModel.get("LayerDisplayName"),
				url, 
				agsParams,
				{
					transitionEffect : 'resize',
					opacity : opacitySetting * .01,
					ogpLayerId : layerModel.get("LayerId"),
					ogpLayerRole : "LayerPreview"
				});
		
		newLayer.projection = new OpenLayers.Projection("EPSG:3857");

		// how should this change? trigger custom events with jQuery
		newLayer.events.register('loadstart', newLayer, function() {
			jQuery(document).trigger({type: "showLoadIndicator", loadType: "layerLoad", layerId: layerId});
		});
		newLayer.events.register('loadend', newLayer, function() {
			jQuery(document).trigger({type: "hideLoadIndicator", loadType: "layerLoad", layerId: layerId});
		});
		var that = this;
		// we do a cursory check to see if the layer exists before we add it

		jQuery(document).bind(newLayer.ogpLayerId + 'Exists', function() {
			that.ol.addLayer(newLayer);
			try {
				layerModel.set({zIndex: newLayer.getZIndex()}, {silent: true});
			} catch (e){
				console.log(e);
				console.log(newLayer.getZIndex());
			}
		});
		this.layerExists(layerModel);
	};

	this.filterAGSLink = function(link){
		if (link.indexOf("export") === -1){
			var msIdx = link.indexOf("MapServer");
			link = link.substr(0, msIdx - 1);
			link += "/MapServer/export";
		}
		
		return link;
	};
	
	this.previewBrowseGraphic = function(layerModel) {
		var dialogHtml = '<img src="'
				+ layerModel.get("Location").browseGraphic + '"/>';
		if (typeof jQuery('#browseGraphic')[0] == 'undefined') {
			var infoDiv = '<div id="browseGraphic" class="dialog">'
					+ dialogHtml + '</div>';
			jQuery("body").append(infoDiv);
			jQuery("#browseGraphic").dialog({
				zIndex : 2999,
				title : "Thumbnail Preview",
				width : 'auto',
				height : "auto",
				resizable : false,
				autoOpen : false
			});
			jQuery("#browseGraphic").dialog('open');
		} else {
			jQuery("#browseGraphic").html(dialogHtml);
			jQuery("#browseGraphic").dialog('open');
		}
	};

	this.closeBrowseGraphic = function(layerId) {
		jQuery("#browseGraphic").dialog('close');
		jQuery("#browseGraphic").html("");
	};

	// a place to store references to external windows and associated data
	this.externalPreviewWindows = new OpenGeoportal.ExternalPreviewWindows();

	this.openImageCollectionUnGeoReferenced = function(model) {
		// this model has attributes to facilitate preview of ImageCollection
		// UnGeoreferenced layers
		var newModel = new OpenGeoportal.Models.ImageCollectionUnGeoreferenced(
				model.attributes);
		// adding the model opens the external window
		this.externalPreviewWindows.add(newModel);
	};

	this.closeImageCollectionUnGeoReferenced = function(layerId) {
		var model = this.externalPreviewWindows.findWhere({
			LayerId : layerId
		});
		this.externalPreviewWindows.remove(model);
	};

	/**
	 * 
	 * @param {string}
	 *            previewType a key that should match up with a "type" property
	 * @param {string}
	 *            functionType either "onHandler" for the function that turns on
	 *            a layer preview or "offHandler" for the function that turns
	 *            off a layer preview
	 * @returns {Function} a function that turns on or off a layer depending on
	 *          passed type
	 */
	this.getPreviewMethod = function(previewType, functionType) {
		var previewMethods = [ {
			type : "imagecollection",
			onHandler : this.openImageCollectionUnGeoReferenced,
			offHandler : this.closeImageCollectionUnGeoReferenced
		}, {
			type : "tilecache",
			onHandler : this.addWMSLayer,
			offHandler : this.hideLayer
		}, {
			type : "wms",
			onHandler : this.addWMSLayer,
			offHandler : this.hideLayer
		}, {
			type : "arcgisrest",
			onHandler : this.addArcGISRestLayer,
			offHandler : this.hideLayer
		}, {
			type : "browsegraphic",
			onHandler : this.previewBrowseGraphic,
			offHandler : this.closeBrowseGraphic
		}, {
			type : "default",
			onHandler : this.addMapBBox,
			offHandler : this.hideLayer
		} ];

		var method = null;
		for ( var i in previewMethods) {
			method = previewMethods[i][functionType];

			if (previewMethods[i].type === previewType) {
				break;
			}
			
		}

		return method;
	};

	this.previewLayerOn = function(layerId) {
		// find preview method

		var currModel = this.previewed.findWhere({
			LayerId : layerId
		});
		if (typeof currModel === "undefined") {
			throw new Error("Layer['" + layerId
					+ "'] not found in PreviewedLayers collection.");
		}

		try {
			var type = currModel.get("previewType");
			var previewOnFunction = this.getPreviewMethod(type, "onHandler");

			try {
				previewOnFunction.call(this, currModel);
			} catch (e) {
				console.log(e);
				throw new Error("error in preview on handler.");
			}

			analytics.track("Layer Previewed", currModel.get("Institution"),
					layerId);
		} catch (err) {
			// if there's a problem, set preview to off, give the user a notice
			console.log("error in layer on");
			console.log(err);
			currModel.set({
				preview : "off"
			});
			throw new Error(
					'Unable to Preview layer "'
							+ currModel.get("LayerDisplayName") + '"');
		}

	};

	this.previewLayerOff = function(layerId) {
		// find preview off method
		var previewModel = this.previewed.findWhere({
			LayerId : layerId
		});
		var type = previewModel.get("previewType");
		var previewOffFunction = this.getPreviewMethod(type, "offHandler");

		try {
			// previewHandler = this.previewOffDispatcher(previewType);
			previewOffFunction.call(this, layerId);

		} catch (err) {
			console.log("error in layer off");
			throw new OpenGeoportal.ErrorObject(err,
					'Unable to remove Previewed layer "'
							+ previewModel.get("LayerDisplayName") + '"');
		}

		// analytics.track("Layer Unpreviewed", dataObj["Institution"],
		// layerId);

	};

};// object end


