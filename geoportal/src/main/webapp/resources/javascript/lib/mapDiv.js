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
OpenGeoportal.MapController = function (panelView) {
	// dependencies
	this.previewed = OpenGeoportal.ogp.appState.get("previewed");
	this.requestQueue = OpenGeoportal.ogp.appState.get("requestQueue");

	this.template = OpenGeoportal.Template;
	var analytics = new OpenGeoportal.Analytics();

	this.panelView = panelView;

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

		try {
			this.initBasemaps();
			this.addMapToolbarElements();

			//we want to predict center based on where the left panel will open to
			// set map position
			this.firstZoomToAdjustedLayerExtent('-180,-90,180,90');

		} catch (e) {
			console.log("problem setting basemap?");
			console.log(e);
		}

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
			mapId: div,
			renderCorner: renderCorner
		});
		div$.html(resultsHTML);
	};

	/**
	 * modify OpenLayers Controls for OGP
	 */
	this.createModControls = function () {
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
					that.zoomToAdjustedLayerExtent(bounds.toBBOX());

				} else {
					this.map.setCenter(this.map.getLonLatFromPixel(position),
						this.map.getZoom() + 1);
				}


			}
		});

		OpenLayers.Control.ModNavigation = OpenLayers.Class(OpenLayers.Control.Navigation, {
			/**
			 * Method: draw
			 */
			draw: function () {
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
					this, {
						"up": this.wheelUp,
						"down": this.wheelDown
					},
					this.mouseWheelOptions);
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
			wheelChange: function (evt, deltaZ) {
				var currentZoom = this.map.getZoom();
				var newZoom = this.map.getZoom() + Math.round(deltaZ);
				newZoom = Math.max(newZoom, 1);
				newZoom = Math.min(newZoom, this.map.getNumZoomLevels());
				if (newZoom === currentZoom) {
					return;
				}
				var zoomPoint = this.map.getLonLatFromPixel(evt.xy);

				var size = this.map.getSize();
				var deltaX = size.w / 2 - evt.xy.x;
				var deltaY = evt.xy.y - size.h / 2;
				var newRes = this.map.baseLayer.getResolutionForZoom(newZoom);

				var newCenter = new OpenLayers.LonLat(
					zoomPoint.lon + deltaX * newRes,
					zoomPoint.lat + deltaY * newRes);
				this.map.setCenter(newCenter, newZoom);
			},

			/**
			 * Method: defaultDblClick
			 *
			 * Parameters:
			 * evt - {Event}
			 */
			defaultDblClick: function (evt) {
				that.setAdjustedCenter(evt.xy, this.map.zoom + 1);
			},

			/**
			 * Method: defaultDblRightClick
			 *
			 * Parameters:
			 * evt - {Event}
			 */
			defaultDblRightClick: function (evt) {
				that.setAdjustedCenter(evt.xy, this.map.zoom - 1);
			}
		});


		OpenLayers.Control.ModZoomToMaxExtent = OpenLayers.Class(OpenLayers.Control.ZoomToMaxExtent, {

			/*
			 * Method: trigger
			 * Do the zoom.
			 */
			trigger: function () {
				that.zoomToAdjustedLayerExtent('-180,-90,180,90');
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
		var that = this;
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
		
		var controls = [ zoomBar, scaleLine, displayCoords, nav, panel, attribution ];
		return controls;
	};

	this.pointControl = null;

	this.addPointControl = function () {
		var pointLayer = new OpenLayers.Layer.Vector("Feature Identify");
		this.ol.addLayer(pointLayer);

		this.pointControl = new OpenLayers.Control.DrawFeature(pointLayer,
			OpenLayers.Handler.Point);

		this.ol.addControl(this.pointControl);
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
		this.$mapDiv = $("#" + this.mapDiv);
		var $container = $("#" + this.containerDiv).parent();

		var mapBounds = new OpenLayers.Bounds(-20037508.34, -20037508.34,
				20037508.34, 20037508.34);

		var controls = this.createOLControls();
		//var initialZoom = this.getInitialZoomLevel();
		var options = {
			allOverlays : true,
			projection: new OpenLayers.Projection("EPSG:3857"),
			maxResolution : 2.8125,
			maxExtent : mapBounds,
			numZoomLevels: 19,
			units : "m",
			//zoom : initialZoom,
			controls : controls
		};

		// merge default options and user specified options into 'options'--not
		// recursive
		$.extend(userOptions, options);

		// div defaults to 0 height for certain doc-types; we want the map to
		// fill the parent container
		/*		var initialHeight;
		if (initialZoom === 1){
			initialHeight = 512;
		} else {
		 initialHeight = $container.height();
		 }*/

		this.$mapDiv.height($container.height()).width($container.width());
		
		// attempt to reload tile if load fails
		OpenLayers.IMAGE_RELOAD_ATTEMPTS = 3;
		OpenLayers.ImgPath = "resources/media/";
		// make OL compute scale according to WMS spec
		OpenLayers.DOTS_PER_INCH = 91;//0.71428571428572;
		OpenLayers.Util.onImageLoadErrorColor = 'transparent';

		//OpenLayers 2.12+ changes zoom handling in a way not usable for us. Override with this function
		var adjustZoom = function (zoom) {
			if (this.baseLayer && this.baseLayer.wrapDateLine) {
				var resolution, resolutions = this.baseLayer.resolutions,
					//add a multiplier for maxResolution
					maxResolution = this.getMaxExtent().getWidth() * 1.5 / this.size.w;

				if (this.getResolutionForZoom(zoom) > maxResolution) {
					if (this.fractionalZoom) {
						zoom = this.getZoomForResolution(maxResolution) - 1;
					} else {
						for (var i = zoom | 0, ii = resolutions.length; i < ii; ++i) {
							if (resolutions[i] <= maxResolution) {
								zoom = i - 1;
								break;
							}
						}
					}
				}
			}
			return zoom;

		};

		//customized setGMapVisibility function that listens for google maps "idle" instead of "tilesloaded"
		var setGMapVisibility = function (visible) {
			var cache = OpenLayers.Layer.Google.cache[this.map.id];
			var map = this.map;
			if (cache) {
				var type = this.type;
				var layers = map.layers;
				var layer;
				for (var i = layers.length - 1; i >= 0; --i) {
					layer = layers[i];
					if (layer instanceof OpenLayers.Layer.Google &&
						layer.visibility === true && layer.inRange === true) {
						type = layer.type;
						visible = true;
						break;
					}
				}
				var container = this.mapObject.getDiv();
				if (visible === true) {
					if (container.parentNode !== map.div) {
						if (!cache.rendered) {
							var me = this;
							google.maps.event.addListenerOnce(this.mapObject, 'idle', function () {
								cache.rendered = true;
								me.setGMapVisibility(me.getVisibility());
								me.moveTo(me.map.getCenter());
							});
						} else {
							map.div.appendChild(container);
							cache.googleControl.appendChild(map.viewPortDiv);
							google.maps.event.trigger(this.mapObject, 'resize');
							this.moveTo(this.map.getCenter());

						}
					}
					this.mapObject.setMapTypeId(type);
				} else if (cache.googleControl.hasChildNodes()) {
					map.div.appendChild(map.viewPortDiv);
					map.div.removeChild(container);
				}
			}
		};


		var calculateFeatureDx = function (bounds, worldBounds) {
			this.featureDx = 0;
			if (worldBounds) {
				var worldWidth = worldBounds.getWidth();

				var xoffset = $("#left_col").width();
				var mapsize = this.map.size.w;
				var worlds = this.map.resolution * (mapsize - xoffset) / worldWidth;
				//wa is worlds away from the rightmost copy of the world
				var wa = 0;
				if (worlds < 2 && worlds > .5) {
					//dateline location
					var dl = new OpenLayers.LonLat(20037508.34, 0);
					var dlPixel = this.map.getViewPortPxFromLonLat(dl).x;


					//width in pixels of 1 world
					var pixelWidth = worldWidth * this.map.resolution;

					//we always want the rightmost dateline
					while (dlPixel + pixelWidth <= mapsize) {
						dlPixel += pixelWidth;
					}

					//if dlPixel is greater than the half way point wa = 1
					var halfway = (mapsize - xoffset) / 2 + xoffset;

					if (dlPixel > halfway) {
						wa = 1;
					}

				} else {
					wa = Math.floor(worlds);
				}

				this.featureDx = wa * worldWidth;

			}
		};

		OpenLayers.Renderer.prototype.calculateFeatureDx = calculateFeatureDx;

		OpenLayers.Layer.Google.v3.setGMapVisibility = setGMapVisibility;

		OpenLayers.Map.prototype.adjustZoom = adjustZoom;
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
			el: "div#" + elId,
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
	this.zoomendId = null;

	this.registerMapEvents = function() {
		var that = this;
		// register events

		$(document).on("container.resize", function (e, data) {

			//update the size of the map if the container size actually changed.
			var $map = $(".olMap");

			var newHeight = Math.max(data.ht, data.minHt);
			var oldHeight = $map.height();
			
			var newWidth = Math.max(data.wd, data.minWd);
			var oldWidth = $map.width();
			
			if (newHeight !== oldHeight || newWidth !== oldWidth){
				$map.height(newHeight).width(newWidth);
				that.ol.updateSize();
			}
			
		});
		

		// OpenLayers event

		this.ol.events.register('zoomend', this, function () {
			//console.log("zoomend");
			//clear previous update function. we only want to run the last one
			clearTimeout(this.zoomendId);

			var zoomLevel = that.ol.getZoom();

			that.basemaps.checkZoom(zoomLevel);

			var tilesHeight = Math.pow((zoomLevel + 1), 2) / 2 * 256;
			var containerHeight = that.$mapDiv.parent().parent().height();

			tilesHeight = Math.min(tilesHeight, containerHeight);

			if (that.$mapDiv.height() != tilesHeight) {

				that.$mapDiv.height(tilesHeight);// calculate min and
				// max sizes
				var zoomingToExtent = that.isZoomingToExtent;

				var update = function () {
					that.ol.updateSize();
					//only trigger our event if we are zooming.
					if (zoomingToExtent) {
						that.$mapDiv.trigger('updatedSizeOnZoom');
					}
				};

				//collate update functions
				this.zoomendId = setTimeout(update, 100);
				return;
			}

			if (zoomLevel == 1) {
				that.ol.setCenter(that.getAdjustedCenter().lon, 0);
			}

			that.isZoomingToExtent = false;
		});
		
		// OpenLayers event
		this.ol.events.register('moveend', this, function () {

			/*
			 * Translate the OpenLayers event to a jQuery event used by the
			 * application. This is the event used to trigger a search on map
			 * move. cluster moveend events so that we don't fire too often
			 * 
			 * @fires "map.extentChanged"
			 */
			
			clearTimeout(this.moveEventId);
			
			var trigger = function(){

				var newExtent = that.getWGS84VisibleExtent();
				var newCenter = that.getWGS84AdjustedCenter();

				$(document).trigger('map.extentChanged', {
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
		this.eventMaskHandler();

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

		$("#ogpMapButtons").append(markup);
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

		$("." + displayParams.displayClass).button().on("click",
				function() {
					clickCallback.call(that);
				});
	};

	/***************************************************************************
	 * basemap handling
	 **************************************************************************/
	this.googleMapsRenderCallback = function(type) {
		this.ol.render(this.mapDiv);

		var bgMap = this.ol.getLayersBy("basemapType", type)[0];

		google.maps.event.addListenerOnce(bgMap.mapObject, "tilesloaded",
				function() {
					// let the application know that the map is ready
					$(document).trigger("mapReady");

					// find the google logo and add class ".googleLogo",
					// so we can make sure it always shows
					$(".olForeignContainer").find('[title*="Click to see this area"]').parent()
							.addClass("googleLogo");

				});
	};

	this.initialRenderCallback = function(type) {
		// console.log("osm initial render callback");
		this.ol.render(this.mapDiv);

		var bgMap = this.ol.getLayersBy("basemapType", type)[0];
		bgMap.events.register(bgMap, "loadend", function () {
			// console.log("Tiles loaded");
			// let the application know that the map is ready
			$(document).trigger("mapReady");
			// really should only fire the first time
			bgMap.events.unregister(bgMap, "loadend");

		});
	};

	/**
	 * @this - the base map model
	 * @returns {OpenLayers.Layer.Google}
	 */
	this.googleMapsLayerDefinition = function() {
		var bgMap = new OpenLayers.Layer.Google(this.get("displayName"), {
			type: this.get("subType")
		});

		bgMap.basemapType = this.get("type");
		bgMap.layerRole = "basemap";

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

	this.eventMaskHandler = function () {
		$(document).on("eventMaskOn", function () {
			if ($(".olMap").find(".eventMask").length === 0) {
				$(".olMap").append('<div class="eventMask"></div>');
			}
		});

		$(document).on("eventMaskOff", function () {
			$(".eventMask").remove();
		});
	};

	this.opacityHandler = function() {
		var that = this;
		$(document).on(
			"map.opacityChange",
			function (event, data) {
				var olLayer = that.getOLLayer(data.LayerId);
				if (olLayer !== null) {
					olLayer.setOpacity(data.opacity * .01);
				}
			});
	};
	
	this.zIndexHandler = function() {
		var that = this;
		$(document).on(
			"map.zIndexChange",
			function (event, data) {
				var olLayer = that.getOLLayer(data.LayerId);
				if (olLayer !== null) {
					olLayer.setZIndex(data.zIndex);
				}
			});
	};

	this.previewLayerHandler = function() {
		var that = this;
		$(document).on("previewLayerOn", function (event, data) {
			that.previewLayerOn(data.LayerId);
		});

		$(document).on("previewLayerOff", function (event, data) {
			that.previewLayerOff(data.LayerId);
		});
	};

	this.styleChangeHandler = function() {
		var that = this;
		$(document).on("map.styleChange", function (event, data) {
			that.changeStyle(data.LayerId);
		});
	};

	this.bboxHandler = function() {
		var that = this;
		$(document).on("map.showBBox", function (event, bbox) {
			that.showLayerBBox(bbox);
		});

		$(document).on("map.hideBBox", function (event, bbox) {
			that.hideLayerBBox(bbox);
		});
	};

	this.getFeatureInfoHandler = function() {
		var that = this;
		$(document).on(
			"map.getFeatureInfoOn",
			function () {
				that.getFeatureAttributesOn.apply(that, arguments)
			});

		$(document).on(
			"map.getFeatureInfoOff",
			function () {
				that.getFeatureAttributesOff.apply(that, arguments)
			});

	};

	this.zoomToLayerExtentHandler = function() {
		var that = this;
		$(document).on("map.zoomToLayerExtent", function (event, data) {
			that.zoomToAdjustedLayerExtent(data.bbox);
		});
	};

	/**
	 * event handler to determine cursor behavior and button state behavior for
	 * pan-zoom controls
	 */
	this.mouseCursorHandler = function() {
		var that = this;
		$(document).on(
						"map.attributeInfoOn",
						function() {
							$(".olMap").css('cursor', "crosshair");
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
		$(document).on(
				"map.attributeInfoOff",
				function() {
					$(".olMap").css('cursor', "initial");

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
		// should update the previewed layers collection, which triggers
		// removal from the map.
		var $mapClear = $("#mapClearButton");
		$mapClear.button();
		$mapClear.on("click", function (event) {
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

	//bounded transforms
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

	this.WGS84ToWebMercatorBounds = function (bounds) {
		var lowerLeft = this.WGS84ToMercator(bounds.left,
			bounds.bottom);
		var upperRight = this.WGS84ToMercator(bounds.right,
			bounds.top);

		return this.boundsFromCorners(lowerLeft, upperRight);
	};

	this.WebMercatorToWGS84Bounds = function (bounds) {
		var lowerLeft = this.MercatorToWGS84(bounds.left,
			bounds.bottom);
		var upperRight = this.MercatorToWGS84(bounds.right,
			bounds.top);

		return this.boundsFromCorners(lowerLeft, upperRight);
	};

	/******************
	 * conversion from one type of bounds object to another
	 **********************/

	this.boundsFromCorners = function (lowerLeft, upperRight) {
		var newExtent = new OpenLayers.Bounds();
		newExtent.extend(new OpenLayers.LonLat(lowerLeft.lon, lowerLeft.lat));
		newExtent.extend(new OpenLayers.LonLat(upperRight.lon, upperRight.lat));
		return newExtent;
	};


	this.ogpExtentToOLBounds = function (extent) {
		return this.WGS84ToWebMercatorBounds(OpenLayers.Bounds.fromString(extent));
	};

	this.boundsToOLObject = function (model) {
		var newExtent = new OpenLayers.Bounds();
		newExtent.left = model.get("MinX");
		newExtent.right = model.get("MaxX");
		newExtent.top = model.get("MaxY");
		newExtent.bottom = model.get("MinY");

		return newExtent;
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


	this.getCssOffset = function () {
		var mapOffset = jQuery("#container").offset();
		var xOffset = 0;
		var leftCol$ = jQuery("#left_col");
		var leftColOffset = leftCol$.offset();
		if (leftCol$.is(":visible")) {
			xOffset = leftCol$.width() + leftColOffset.left - mapOffset.left;
		}
		var yOffset = jQuery("#tabs").offset().top - mapOffset.top;

		return {
			x: xOffset,
			y: yOffset
		};
	};

	this.getMapOffset = function() {
		var offset = this.getCssOffset();

		return new OpenLayers.Pixel(offset.x, offset.y);
	};

	//Future extent values predict that the left panel will open, so the extents need to be adjusted to account for this

	this.getFutureMapOffset = function () {
		var offset = this.getCssOffset();
		if (this.panelView !== null) {
			offset.x = this.panelView.model.get("openWidth");
		}
		return new OpenLayers.Pixel(offset.x, offset.y);
	};


	this.getVisibleExtent = function () {
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

	this.getWGS84VisibleExtent = function () {
		return this.WebMercatorToWGS84Bounds(this.getVisibleExtent());
	};

	/**
	 * returns zoom level appropriate for the given extent. takes into account the passed in offset to account for
	 * left panel width, etc.
	 *
	 * @param extent
	 * @param offset
	 * @returns {*}
	 */
	this.getAdjustedZoom = function (extent, offset) {

		//ideal resolution for extent
		var viewSize = this.ol.getSize();
		viewSize.w = viewSize.w - offset.x;
		viewSize.h = viewSize.h - offset.y;

		//the long side has to fit in the extent (max)
		var idealResolution = Math.max(extent.getWidth() / viewSize.w,
			extent.getHeight() / viewSize.h);

		return this.ol.getZoomForResolution(idealResolution);

	};


	this.getAdjustedCenter = function () {

		var center;
		if (typeof this.ol == "undefined" || this.ol.getExtent() === null) {
			return new OpenLayers.LonLat(0, 0);
		} else {
			center = this.ol.getExtent().getCenterPixel();
		}

		var offset = this.getFutureMapOffset();

		center.x = center.x - offset.x;
		center.y = center.y - offset.y;

		return this.ol.getLonLatFromViewPortPx(center);
	};

	this.getWGS84AdjustedCenter = function (pixelOffset) {
		var center = this.getAdjustedCenter();
		return this.MercatorToWGS84(center);

	};


	/**
	 * these are used by the export to GeoCommons
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


	this.getSpecifiedExtent = function getSpecifiedExtent(extentType, layerObj) {
		// this code should be in mapDiv.js, since it has access to the
		// openlayers object
		var extentArr = [];
		var maxExtentForLayers = null;
		if (extentType === "maxForLayers") {
			for ( var indx in layerObj) {

				var arrBbox = this.boundsToOLObject(layerObj[indx]);
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
			"current": this.getWGS84VisibleExtent().toBBOX(),
			"maxForLayers" : maxExtentForLayers
		};

		if (typeof extentMap[extentType] !== "undefined") {
			return extentMap[extentType];
		} else {
			throw new Error('Extent type "' + extentType + '" is undefined.');
		}
	};




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

	this.isZoomingToExtent = false;

	this.getCenter = function (layerExtent, zoom, offset) {

		var resAtZoom = this.ol.getResolutionForZoom(zoom);

		var lonlat = layerExtent.getCenterLonLat();
		lonlat.lon = lonlat.lon - offset.x / 2 * resAtZoom;
		lonlat.lat = lonlat.lat - offset.y * resAtZoom;

		return lonlat;
	};

	this.getZoomForAdjustedLayerExtent = function (extent, offset, doCallback) {
		if (typeof doCallback == "undefined") {
			doCallback = true;
		}

		if (typeof offset == "undefined") {
			offset = this.getFutureMapOffset();
			//offset = {x: 500, y: 0};
		}

		var layerExtent = this.ogpExtentToOLBounds(extent);
		var newZoom = this.getAdjustedZoom(layerExtent, offset);

		var lonlat = this.getCenter(layerExtent, newZoom, offset);

		var that = this;

		//we have to do the zoom in 2 steps if map container changes size, since OL can't calculate the end zoom level
		//correctly for a different sized map
		if (doCallback) {
			that.$mapDiv.one('updatedSizeOnZoom', function () {
				//TODO: how to handle the case where the size is not updated? this listener will still be registered
				that.zoomToAdjustedLayerExtent(extent, offset, false);

			});
		}

		//we really only have to worry about this if the zoom level is actually changing
		if (newZoom !== this.ol.getZoom()) {
			this.isZoomingToExtent = true;
		}

		return {zoom: Math.max(1, newZoom), lonlat: lonlat};
	};

	this.zoomToAdjustedLayerExtent = function (extent, offset, doCallback) {
		var params = this.getZoomForAdjustedLayerExtent(extent, offset, doCallback);
		this.ol.setCenter(params.lonlat, params.zoom);


	};

	/**
	 * on the first "zoom" we may need to adjust the map size since zoomend is not triggered.
	 * @param extent
	 * @param offset
	 */
	this.firstZoomToAdjustedLayerExtent = function (extent, offset) {

		var params = this.getZoomForAdjustedLayerExtent(extent, offset, false);
		if (this.ol.getResolution() < 15000) {
			var $map = $(".olMap");
			if ($map.height() !== 512) {
				$map.height(512);
				//this.ol.updateSize();
			}
		}
		this.ol.setCenter(params.lonlat, params.zoom);

	};


	/**
	 *
	 * dblclick to zoom replacement function
	 * @param px
	 * @param zoom
	 */
	this.setAdjustedCenter = function (px, zoom) {
		var res = this.ol.getResolutionForZoom(zoom);
		//res = units/pixel

		var clickedLonLat = this.ol.getLonLatFromViewPortPx(px);

		var offset = this.getFutureMapOffset();

		clickedLonLat.lon = clickedLonLat.lon - res * offset.x / 2;
		clickedLonLat.lat = clickedLonLat.lat - res * offset.y / 2;


		this.ol.setCenter(clickedLonLat, zoom);
	};


	/**
	 * code for previewing bounds (currently on hover event)
	 */

	this.matchesActiveBounds = function (bbox) {
		return (this.activeBounds !== null &&
		bbox.east == this.activeBounds.east &&
		bbox.west == this.activeBounds.west &&
		bbox.south == this.activeBounds.south &&
		bbox.north == this.activeBounds.north);
	};

	this.hideLayerBBox = function (bbox) {
		if (typeof bbox !== "undefined") {
			if (!this.matchesActiveBounds(bbox)) {
				return;
			}
		}
		if (this.ol.getLayersByName("layerBBox").length > 0) {
			var featureLayer = this.ol.getLayersByName("layerBBox")[0];
			featureLayer.removeAllFeatures();
		}
		jQuery(".corner").hide();
	};

	this.getBboxStyle = function (fillColor, borderColor) {

		var style_bbox = OpenLayers.Util.extend({},
			OpenLayers.Feature.Vector.style['default']);
		/*
		 * 4px border, border color: #1D6EEF, background color: #DAEDFF, box
		 * opacity: 25%
		 */
		style_bbox.strokeColor = borderColor;
		style_bbox.fillColor = fillColor;
		style_bbox.fillOpacity = .25;
		style_bbox.pointRadius = 10;
		style_bbox.strokeWidth = 4;
		style_bbox.strokeLinecap = "butt";
		style_bbox.zIndex = 999;

		return style_bbox;
	};


	this.createBBoxLayer = function (name, color) {
		var fillColor;
		var borderColor;
		if (typeof color == "undefined") {
			fillColor = "#DAEDFF";
			borderColor = "#1D6EEF";

		} else {
			fillColor = color;
			borderColor = this.getBorderColor(color);
		}

		var style_bbox = this.getBboxStyle(fillColor, borderColor);


		return new OpenLayers.Layer.Vector(name, {
			style: style_bbox,
			displayOutsideMaxExtent: true,
			wrapDateline: true
		});
	};

	this.generateBounds = function (bbox, displayCentroid) {
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

			if (displayCentroid) {
				arrFeatures.push(new OpenLayers.Feature.Vector(geom1.getCentroid()));
			}
			
		} else {
			var geom = new OpenLayers.Bounds(
				bbox[0], bbox[1], bbox[2], bbox[3]).toGeometry();
			
			var box = new OpenLayers.Feature.Vector(geom);
			
			arrFeatures.push(box);

			if (displayCentroid) {
				arrFeatures.push(new OpenLayers.Feature.Vector(geom.getCentroid()));
			}
		}
		return arrFeatures;
	};

	this.activeBounds = null;

	this.showLayerBBox = function (bbox) {
		this.activeBounds = bbox;
		// add or modify a layer with a vector representing the selected feature
		var featureLayer = this.ol.getLayersByName("layerBBox");
		if (featureLayer.length > 0) {
			featureLayer = featureLayer[0];
			this.hideLayerBBox();
		} else {
			featureLayer = this.createBBoxLayer("layerBBox");
			this.ol.addLayer(featureLayer);
		}
		var bottomLeft = this.WGS84ToMercator(bbox.west, bbox.south);
		var topRight = this.WGS84ToMercator(bbox.east, bbox.north);

		//if pixel distance b/w topRight and bottomLeft falls below a certain threshold,
		//add a marker(fixed pixel size) in the center, so the user can see where the layer is
		var blPixel = this.ol.getPixelFromLonLat(bottomLeft);
		var trPixel = this.ol.getPixelFromLonLat(topRight);
		var pixelDistance = blPixel.distanceTo(trPixel);
		var threshold = 10;
		var displayMarker = false;

		if (pixelDistance <= threshold) {
			displayMarker = true;
		}


		featureLayer.addFeatures(this.generateBounds([bottomLeft.lon, bottomLeft.lat, topRight.lon, topRight.lat], displayMarker));
		this.ol.setLayerIndex(featureLayer, (this.ol.layers.length - 1));

		// do a comparison with current map extent
		var extent = this.getVisibleExtent();
		var geodeticExtent = this.getWGS84VisibleExtent();
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

		for (var layer in this.ol.layers) {
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


	/*****************************************
	 * WMS GetFeature handling
	 **************************************/

	/**
	 * turns on the getFeatureAttribute function by registering the click handler for a layer
	 * @param e
	 * @param data
	 */
	this.getFeatureAttributesOn = function (e, data) {
		// generate the query params
		var layerId = data.LayerId;

		var olLayer = this.getOLLayer(layerId);
		if (olLayer === null) {
			// layer is not in OpenLayers...
			throw new Error("This layer has not yet been previewed.  Please preview it first.");

		} else {
			/**
			 * convert the click on layer event into a param object to request feature info
			 *
			 * @param e
			 */
			var that = this;

			var attrDictionaryPromise = this.getAttributeDictionaryPromise(layerId);

			this.getFeatureAttributes = function (e) {
				//context ('this') is the OpenLayers Layer object
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

				var view = that.createFeatureAttributeView();

				that.queueAttrRequests(view);
				view.setDictionaryPromise(attrDictionaryPromise);
				view.fetchAttributes(params);
				//TODO: add feature to geojson code
				/*                view.fetchAttributes(params)
				 .then(function(){ return view.fetchGeometry(params); })
				 .done(function(data){ that.highlightFeature(data);});*/

			};


			this.ol.events.register("click", olLayer,
				this.getFeatureAttributes);
		}
	};

	this.highlightFeature = function (features) {
		var highlightLayer = this.ol.getLayerByName("Highlight Feature");
		highlightLayer.destroyFeatures();
		highlightLayer.addFeatures(features);
		highlightLayer.redraw();
	};

	this.unhighlightFeature = function () {
		var highlightLayer = this.ol.getLayerByName("Highlight Feature");
		highlightLayer.destroyFeatures();
		highlightLayer.redraw();
	};

	this.getAttributeDictionaryPromise = function (layerId) {
		var def = $.Deferred();
		var model = this.getLayerModel(layerId);
		if (model.has("dictionary")) {
			def.resolve(model.get("dictionary"));
		} else {
			var url = "layer/" + layerId + "/attributes";
			$.get(url, function (data) {
				var dictionary = data.attributeTable;
				model.set({dictionary: dictionary});
				def.resolve(dictionary);
			});

		}

		return def.promise();
	};

	this.currentAttributeRequests = [];
	/**
	 * Keep track of LayerAttributeView's
	 * @param view
	 */
	this.queueAttrRequests = function (view) {
		//close any open attribute dialogs
		while (this.currentAttributeRequests.length > 0) {
			this.currentAttributeRequests.pop().close();
		}

		this.currentAttributeRequests.push(view);
	};

	/**
	 * Create the feature attribute view (dialog)
	 * @returns {OpenGeoportal.LayerAttributeView}
	 */
	this.createFeatureAttributeView = function () {

		return new OpenGeoportal.Views.LayerAttributeView(
			{
				collection: new OpenGeoportal.LayerAttributeCollection()
			});

		//analytics.track("Layer Attributes Viewed", institution, layerId);
	};


	/**
	 * turns off the getFeatureAttribute function by unregistering the click handler for a layer
	 * @param e
	 * @param data
	 */
	this.getFeatureAttributesOff = function (e, data) {
		// generate the query params
		var layerId = data.LayerId;
		var olLayer = this.getOLLayer(layerId);
		if (olLayer === null) {
			// layer is not in OpenLayers...
			throw new Error(
				"This layer has not yet been previewed.  Please preview it first.");
		} else {

			this.ol.events.unregister("click", olLayer,
				this.getFeatureAttributes);
		}
	};


	/**
	 * Process url for preview (WMS, tilecache)
	 * @param layerModel
	 * @param useTilecache
	 * @returns {{urls: Array, isTilecache: boolean, isProxy: boolean}}
	 */
	this.getPreviewUrlArray = function (layerModel, useTilecache) {
		// is layer public or private? is this a request that can be handled by
		// a tilecache?
		var isTilecache = false;
		var isProxy = false;

		var urlArraySize = 1;
		var urlArray = [];
		var populateUrlArray = function (addressArray) {
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
				wmsProxy: proxy
			});
		}

		if (layerModel.has("wmsProxy")) {
			populateUrlArray([layerModel.get("wmsProxy")]);
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

	/**
	 * for Harvard Service Start.
	 * @param layerModel
	 */
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


	/**
	 * retrieves additional info about a WMS layer from the server
	 *
	 * @param model
	 */
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

	/**
	 * Get the OpenLayers Layer object for a given layer Id
	 * @param layerId
	 * @returns {OpenLayers.Layer}
	 */
	this.getOLLayer = function (layerId) {
		var layer = this.ol.getLayersBy("ogpLayerId", layerId)[0];
		if (typeof layer === 'undefined') {
			console.log("Layer with id=['" + layerId + "'] not found on map.");
			return null;
		}
		return layer;
	};

	/**
	 * Get the Backbone model for the previewed layer given a layer Id
	 *
	 * @param layerId
	 * @returns {OpenGeoportal.Models.PreviewLayer}
	 */
	this.getLayerModel = function (layerId) {
		var layerModel = this.previewed.findWhere({
			LayerId: layerId
		});
		if (typeof layerModel === "undefined") {
			throw new Error("This layer can't be found in the PreviewedLayers collection.");
		}
		return layerModel;
	};

	this.changeStyle = function(layerId) {

		var olLayer = this.getOLLayer(layerId);
		if (olLayer === null) {
			return;
		}

		var layerModel = this.getLayerModel(layerId);

		// don't use a tilecache
		olLayer.url = this.getPreviewUrlArray(layerModel, false).urls;
		//if the url array is still from a tilecache, we should throw an error or notify the user.

		var style = {};
		var typ = layerModel.get("previewType");
		if (typ === "wms") {
			style = this.styleWMS(layerModel);
		} else if (typ === "arcgisrest") {
			style = this.styleArcGISRest(layerModel);
		}

		olLayer.mergeNewParams(style);

	};

	this.removeStyle = function (layerId) {
		var olLayer = this.getOLLayer(layerId);
		if (olLayer === null) {
			return;
		}

		var layerModel = this.getLayerModel(layerId);

		// don't use a tilecache
		olLayer.url = this.getPreviewUrlArray(layerModel, true).urls;

		var params = {};
		var typ = layerModel.get("previewType");
		if (typ === "wms") {

			delete olLayer.sld_body;
			params.tiled = true;
		} else if (typ === "arcgisrest") {

			delete olLayer.dynamicLayers;

		}

		olLayer.mergeNewParams(params);

	};

	this.styleWMS = function (layerModel) {
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
			sld_body: this.createSLDFromParams(arrSLD),
			tiled: false
		};

		layerModel.set({
			sld : layerUniqueInfo
		});

		return newSLD;
	};

	this.styleArcGISRest = function (layerModel) {
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
		if (layerIds.length > 0) {
			arrLayerIds = layerIds.split(",");
		}

		var dynamicLayers = [];

		for (var i = 0; i < arrLayerIds.length; i++) {
			var info = {
				"id": arrLayerIds[i],
				"source": {"type": "mapLayer", "mapLayerId": arrLayerIds[i]},
				"drawingInfo": {
					"renderer": {
						"type": "simple",
						"symbol": style,
						"transparency": 0,
						"labelingInfo": null
					}
				}
			};
			dynamicLayers.push(info);
		}

		layerModel.set({
			drawingInfo: dynamicLayers
		});

		return {"dynamicLayers": JSON.stringify(dynamicLayers)};
	};

	this.hexToRgba = function (hexColor) {
		hexColor = hexColor.substring(1, 7);
		var hexTo = function (h, from, to) {
			return parseInt(h.substring(from, to), 16);
		};
		return [hexTo(hexColor, 0, 2), hexTo(hexColor, 2, 4), hexTo(hexColor, 4, 6), 255];

	};

	this.getBorderColor = function (fillColor, asRGB) {
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

		if (typeof asRGB !== "undefined" && asRGB) {
			return [borderColor.red, borderColor.green, borderColor.blue, 255];
		} else {
			// convert to hex
			for (var color in borderColor) {
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
		var layer = this.getOLLayer(layerId);
		if (layer === null) {
			return;
		}
		layer.setVisibility(false);
	};

	this.showLayer = function(layerId) {
		var layer = this.getOLLayer(layerId);
		if (layer === null) {
			return;
		}
		layer.setVisibility(true);
	};

	this.addMapBBox = function (bbox) {

		var featureLayer = this.createBBoxLayer("zoomExtent", "#991111");
		this.ol.addLayer(featureLayer);
		featureLayer.addFeatures(this.generateBounds(bbox, false));
		this.ol.setLayerIndex(featureLayer, (this.ol.layers.length - 1));

	};


	
	this.getLayerName = function(layerModel, url) {
		var layerName = layerModel.get("Name");
		var wmsNamespace = "";
		if (layerModel.has("WorkspaceName")) {
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
		_.each(this.ol.layers, function (layer) {
				arrZ.push(layer.getZIndex());
			});
		return _.max(arrZ);
	},
	
	this.getNextZ = function(){
		return this.getMaxZ() + 5;
	},

		this.handleExisting = function (layerModel) {
			var layerId = layerModel.get("LayerId");
			var opacity = layerModel.get("opacity");
			var layer = this.getOLLayer(layerId);

			if (layer === null) {

			} else {
				var nextZ = this.getNextZ();
				layerModel.set({zIndex: nextZ});

				this.showLayer(layerId);
				layer.setOpacity(opacity * .01);

			}

		};

	this.addWMSLayer = function (layerModel, nocheck) {
		if (typeof nocheck === "undefined") {
			nocheck = false;
		}
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
		$(document).bind(layerModel.get("LayerId") + 'Exists',
			function () {
				// if this is a raster layer, we should use jpeg format, png for vector
				// (per geoserver docs)
				var layerName = that.getLayerName(layerModel, wmsArray[0]);
				var version = "1.3.0";
				if (isTilecache) {
					//geowebcache doesn't support wms 1.3.0
					version = "1.1.0";
				}

				var newLayer = new OpenLayers.Layer.WMS(
					layerModel.get("LayerDisplayName"),
					wmsArray,
					{
						layers: layerName,
						format: format,
						tiled: true,
						exceptions: "application/vnd.ogc.se_xml",
						transparent: true,
						version: version
					}, {
						transitionEffect: 'resize',
						opacity: opacitySetting * .01,
						ogpLayerId: layerModel.get("LayerId"),
						ogpLayerRole: "LayerPreview",
						wrapDateLine: true
					});

				newLayer.events.register('loadstart', newLayer, function () {
					//console.log("Load start");
					jQuery(document).trigger({
						type: "showLoadIndicator",
						loadType: "layerLoad",
						layerId: layerModel.get("LayerId")
					});
				});

				newLayer.events.register('loadend', newLayer, function () {
					//console.log("Load end");
					jQuery(document).trigger({
						type: "hideLoadIndicator",
						loadType: "layerLoad",
						layerId: layerModel.get("LayerId")
					});
				});

				that.ol.addLayer(newLayer);
				try {
					layerModel.set({zIndex: newLayer.getZIndex()}, {silent: true});
				} catch (e) {
					console.log(e);
					console.log(newLayer.getZIndex());
				}
			});
		if (nocheck) {
			$(document).trigger(layerModel.get("LayerId") + 'Exists');
			console.log("triggered exist");
		} else {
			this.layerExists(layerModel);
		}

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
		if (layername.length > 0 && !isNaN(parseFloat(layername[0])) && isFinite(layername[0])) {
			layers = "show:" + layername;
		} else {
			layers = "hide:99"; //this assumes that we want to show ALL layers (and that there are less than 100)
		}
		var agsParams = {
			transparent: true,
			dpi: 91	//match what we set OpenLayers DPI to be
		};

		if (layers.length > 0) {
			agsParams.layers = layers;
		}

		var newLayer = new OpenLayers.Layer.ArcGIS93Rest(
				layerModel.get("LayerDisplayName"),
			url,
			agsParams,
				{
					transitionEffect : 'resize',
					opacity: opacitySetting * .01,
					ogpLayerId: layerModel.get("LayerId"),
					ogpLayerRole: "LayerPreview",
					wrapDateLine: true

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

		jQuery(document).bind(newLayer.ogpLayerId + 'Exists', function () {
			that.ol.addLayer(newLayer);
			try {
				layerModel.set({zIndex: newLayer.getZIndex()}, {silent: true});
			} catch (e) {
				console.log(e);
				console.log(newLayer.getZIndex());
			}
		});
		this.layerExists(layerModel);
	};

	this.filterAGSLink = function (link) {
		if (link.indexOf("export") === -1) {
			var msIdx = link.indexOf("MapServer");
			link = link.substr(0, msIdx - 1);
			link += "/MapServer/export";
		}

		return link;
	};

	this.previewBrowseGraphic = function(layerModel) {
		var dialogHtml = '<img src="'
				+ layerModel.get("Location").browseGraphic + '"/>';

		var $browse = jQuery('#browseGraphic');
		if ($browse.length === 0) {
			var infoDiv = '<div id="browseGraphic" class="dialog">'
					+ dialogHtml + '</div>';
			$browse = $(infoDiv).appendTo("body");
			$browse.dialog({
				zIndex : 2999,
				title : "Thumbnail Preview",
				width : 'auto',
				height : "auto",
				resizable : false,
				autoOpen : false
			});
			$browse.dialog('open');
		} else {
			$browse.html(dialogHtml);
			$browse.dialog('open');
		}
	};

	this.closeBrowseGraphic = function(layerId) {
		var $browse = jQuery('#browseGraphic');
		$browse.dialog('close');
		$browse.html("");
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

		var currModel = this.getLayerModel(layerId);

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
		var previewModel = this.getLayerModel(layerId);
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


