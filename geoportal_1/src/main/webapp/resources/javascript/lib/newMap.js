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
OpenGeoportal.MapController = function() {
	// dependencies
	this.previewed = OpenGeoportal.ogp.appState.get("previewed");
	this.requestQueue = OpenGeoportal.ogp.appState.get("requestQueue");

	this.template = OpenGeoportal.ogp.template;
	var analytics = new OpenGeoportal.Analytics();
	var mapController = this;

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

		this.addMapToolbarElements();


		var that = this;
		jQuery(document).on("mapReady", function(){
			var controls = that.createOLControls();
			_.each(controls, function(control){
				that.map.addControl(control);
			});
			var interact = that.createPanZoom();
			_.each(interact, function(action){
				that.map.addInteraction(action);
			});
			that.registerMapEvents();
		});

		
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
		var resultsHTML = this.template.map({
			mapId : div
		});
		div$.html(resultsHTML);
	};

	
	this.selectPanZoom = function(interaction){
		var a = this.zoomBox;
		var b = this.panHand;
		
		if (interaction === "zoom"){
			b = this.zoomBox;
			a = this.panHand;
		}
		
		this.map.removeInteraction(a);
		this.map.addInteraction(b);
	};
	
	this.createPanZoom = function(){

		var onCond = ol.events.condition.always;
		
		this.addMapControl({controlClass: "olControlZoomBoxItemInactive"}, function(){
			that.selectPanZoom("zoom");
		});
		this.zoomBox = new ol.interaction.DragZoom({
			  condition: onCond
		});

		this.addMapControl({controlClass: "olControlNavigationItemActive"}, function(){
			that.selectPanZoom("pan");
		});
		this.panHand = new ol.interaction.DragPan({
			kinetic: false
			});
		
		//pan hand is default
		return [this.panHand];
	};
	/**
	 * Create the controls for the OL map. Depends on "previewed" object.
	 * 
	 * @requires OpenGeoportal.PreviewedLayers
	 * @returns {Array<OpenLayers.Control.*>} - array of controls to pass to
	 *          OpenLayers map
	 */
	this.createOLControls = function() {
		jQuery(".ol-viewport").prepend(this.template.mapControlBar());
		//target & classname
		var extentControl = this.addMapControl({controlClass: "olControlZoomToMaxExtentItemInactive"});
		var globalExtent = new ol.control.ZoomToExtent({
			tipLabel: "Zoom to global extent",
			element: extentControl[0]
		});
		
		var navPrevControl = this.addMapControl({controlClass: "olControlNavigationHistoryPreviousItemActive"});
		var navBack = new ol.control.ZoomToExtent({
			tipLabel: "Zoom to previous geographic extent",
			extent: function(){/*get previous extent*/},
			element: navPrevControl[0]
		});

		var navNextControl = this.addMapControl({controlClass: "olControlNavigationHistoryNextItemActive"});
		var navForward = new ol.control.ZoomToExtent({
			tipLabel: "Zoom to next geographic extent",
			extent: function(){/*get next extent*/},
			element: navNextControl[0]
		});
		
		
		var displayCoords = new ol.control.MousePosition({
			  coordinateFormat: ol.coordinate.createStringXY(4),
			  projection: 'EPSG:4326',
			  // comment the following two lines to have the mouse position
			  // be placed within the map.
			  //className: 'custom-mouse-position',
			  //target: document.getElementById('mouse-position'),
			  undefinedHTML: '&nbsp;'
			});

		var scaleLineControl = new ol.control.ScaleLine();
		
		var zoom = new ol.control.Zoom();

		var zoomslider = new ol.control.ZoomSlider();
		
		var controls = [ displayCoords, scaleLineControl, zoomslider, zoom, globalExtent, navBack, navForward];
		return controls;
	};

	/**
	 * Calculate the initial zoom level for the map based on window size
	 * 
	 * @returns {Number} - initial zoom level
	 */
	this.getInitialZoomLevel = function() {
		var initialZoom = 1;

		if (jQuery('#' + this.containerDiv).parent().height() > 600) {
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

		/*jQuery("#" + this.containerDiv).prepend('<div id="gmap"></div>');
		
		var gmap = new google.maps.Map(document.getElementById('gmap'), {
			  disableDefaultUI: true,
			  keyboardShortcuts: false,
			  draggable: false,
			  disableDoubleClickZoom: true,
			  scrollwheel: false,
			  streetViewControl: false
			});

			view.on('change:center', function() {
			  var center = ol.proj.transform(view.getCenter(), 'EPSG:3857', 'EPSG:4326');
			  gmap.setCenter(new google.maps.LatLng(center[1], center[0]));
			});
			view.on('change:resolution', function() {
			  gmap.setZoom(view.getZoom());
			});
		
	*/
		

		// div defaults to 0 height for certain doc-types; we want the map to
		// fill the parent container
		jQuery('#' + this.mapDiv).height(jQuery("#" + this.containerDiv).parent().height());
		
		var view = new ol.View2D();

			var controls = this.createOLControls();
			var interactions = this.createPanZoom();
			var initialZoom = this.getInitialZoomLevel();
			var basemap = this.initBasemaps();
			
			var olMapDiv = document.getElementById(this.mapDiv);
			this.map = new ol.Map({
				layers: [ basemap ],
			  interactions: ol.interaction.defaults({
			    altShiftDragRotate: false,
			    dragPan: false,
			    rotate: false
			  }),
			  target: olMapDiv,
			  view: view
			});
			view.setCenter([0, 0]);
			view.setZoom(initialZoom);

			//olMapDiv.parentNode.removeChild(olMapDiv);
			//gmap.controls[google.maps.ControlPosition.TOP_LEFT].push(olMapDiv);

		this.map.once("postrender", function(){
			jQuery(document).trigger("mapReady");
		});


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
			selected : true
		});
		
		return defaultBasemapModel.get("createLayer").call(this.basemaps, defaultBasemapModel);
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
		this.addToMapToolbar(this.template.basemapMenu());

		// the menu itself is implemented as a view of the Basemap collection
		this.basemapMenu = new OpenGeoportal.Views.CollectionSelect({
			collection : this.basemaps,
			el : "div#basemapMenu",
			valueAttribute : "name",
			displayAttribute : "displayName",
			buttonLabel : "Basemap",
			itemClass : "baseMapMenuItem"
		});

	};

	/**
	 * register event handlers for the map
	 */
	this.registerMapEvents = function() {
		var that = this;
		// register events
		jQuery("#" + that.mapDiv).resize(function(){
			that.map.updateSize();
		});
		
		this.map.on("change:size", function() {
			
			if (parseInt(jQuery("#" + that.mapDiv).width()) >= 1024) {
				if (that.map.zoom == 1) {
					that.map.zoomTo(2);
				}
			}
			
		});

		// OpenLayers event
	/*	this.map.events.register('zoomend', this, function() {
			var zoomLevel = that.map.getZoom();*/
			// console.log(zoomLevel);
			/*var maxZoom = that.basemaps.findWhere({
				selected : true
			}).get("zoomLevels");
*/
			// need to add logic to go back to original basemap type when user
			// zooms back out
	/*		if (zoomLevel >= (maxZoom - 1)) {
				that.basemaps.findWhere({
					name : "googleHybrid"
				}).set({
					selected : true
				});
				that.zoomTo(that.getZoom());*/
		//	} else {
				/*
				 * if (that.getBackgroundType() !==
				 * that.getCurrentBackgroundMap()){
				 * that.changeBackgroundMap(that.getCurrentBackgroundMap()); }
				 */
		//	}
		/*	var mapHeight = Math.pow((zoomLevel + 1), 2) / 2 * 256;
			var containerHeight = jQuery("#" + that.mapDiv).parent().parent()
					.height();
			if (mapHeight > containerHeight) {
				mapHeight = containerHeight;
			}

			if (jQuery("#" + that.mapDiv).height() != mapHeight) {
				jQuery("#" + that.mapDiv).height(mapHeight);// calculate min and
				// max sizes
				that.map.updateSize();
			}
			if (zoomLevel == 0) {
				that.map.view.setCenter(that.WGS84ToMercator(that.getSearchCenter().lon,
						0));
			}*/
			/*
			 * Translate the OpenLayers event to a jQuery event used by the
			 * application
			 * 
			 * @fires "eventZoomEnd"
			 */
/*
			jQuery(document).trigger('eventZoomEnd');
		});
*/
		
		this.zoomLevel = this.map.getView().getZoom();
		
		this.map.on('moveend', function(){
			var zoomLevel = that.map.getView().getZoom();
			if (that.zoomLevel === zoomLevel){
				return;
			}
			var newMapHeight = Math.pow((zoomLevel + 1), 2) / 2 * 256;
			var containerHeight = jQuery("#" + that.mapDiv).parent().parent()
					.height();
			if (newMapHeight > containerHeight) {
				newMapHeight = containerHeight;
			}

			if (jQuery("#" + that.mapDiv).height() != newMapHeight) {
				jQuery("#" + that.mapDiv).height(newMapHeight);// calculate min and
				// max sizes
				//that.map.updateSize();
			}
			if (zoomLevel == 0) {
				that.map.getView().setCenter(that.WGS84ToMercator(that.getSearchCenter()[0],
						0));
			}
			
			that.zoomLevel = zoomLevel;
		});
		// OpenLayers event
		this.map.on('moveend', function() {
			var newExtent = that.getWGS84Extent();
			var newCenter = that.getSearchCenter();

			/*
			 * Translate the OpenLayers event to a jQuery event used by the
			 * application. This is the event used to trigger a search on map
			 * move.
			 * 
			 * @fires "map.extentChanged"
			 */
			jQuery(document).trigger('map.extentChanged', {
				mapExtent : newExtent,
				mapCenter : newCenter
			});
		});

		this.bboxHandler();
		this.styleChangeHandler();
		this.opacityHandler();
		this.zoomToLayerExtentHandler();
		this.previewLayerHandler();
		this.getFeatureInfoHandler();
		this.clearLayersHandler();
		this.attributeDescriptionHandler();
		this.mouseCursorHandler();
		this.loadIndicatorHandler();
	};

	this.addMapControl = function(displayParams, clickCallback){
		
		var control = jQuery(this.template.mapControl(displayParams)).appendTo("#ogpMapControls");
		var that = this;
		if (typeof clickCallback !== "undefined"){
			jQuery("." + displayParams.displayClass).button().on("click",
					function() {
						clickCallback.call(that);
					});
		}
		
		return control;
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

		this.addToMapToolbar(this.template.mapButton(displayParams));
		var that = this;
		jQuery("." + displayParams.displayClass).button().on("click",
				function() {
					clickCallback.call(that);
				});
	};

	/***************************************************************************
	 * basemap handling
	 **************************************************************************/


	this.initialRenderCallback = function(type) {
		// console.log("osm initial render callback");
		/*var that = this;
		var bgMap = this.getLayersBy("basemapType", type)[0];
		bgMap.events.register(bgMap.mapObject, "loadend", function() {
			// console.log("Tiles loaded");
			that.render(that.mapDiv);
			// really should only fire the first time
			bgMap.events.unregister(bgMap.mapObject, "loadend");
			jQuery("#geoportalMap").fadeTo("slow", 1);
		});*/
	};


	/**
	 * @this - the base map model
	 * @returns {OpenLayers.Layer.Bing}
	 */
	this.getBingMapsLayer = function(bingType, basemapId) {

		var basemap = new ol.layer.Tile({
						ogpLayerId: basemapId,
		                preload: Infinity,
		                source: new ol.source.BingMaps({
		                  key: 'Ak-dzM4wZjSqTlzveKz5u0d4IQ4bRzVI309GxmkgSVr1ewS6iPSrOvOKhA-CJlm3',
		                  imagerySet: bingType
		                })
		});

		return basemap;

	};



	this.baseMapHide = function(model) {
		// see if there is a basemap layer of the specified type
		var basemapId = model.get("basemapId");
		var basemapLayer = this.getLayerFromLayerId(basemapId);
		if (basemapLayer !== null){
				basemapLayer.setVisible(false);
		}
	};

	/**
	 * @requires OpenGeoportal.BasemapCollection
	 * 
	 * @returns {OpenGeoportal.BasemapCollection}
	 */
	this.createBaseMaps = function() {
		var that = this;


		var osm = {
			displayName : "OpenStreetMap",
			name : "osm",
			selected : true,
			basemapId : "osmbasemap",
			createLayer : function(model) {
				var attribution = "Tiles &copy; <a href='http://openstreetmap.org/'>OpenStreetMap</a> contributors, CC BY-SA &nbsp;";
				attribution += "Data &copy; <a href='http://openstreetmap.org/'>OpenStreetMap</a> contributors, ODbL";
				
		        var basemap = new ol.layer.Tile({
		          	 	ogpLayerId: model.get("basemapId"),
		          	 	source: new ol.source.OSM()
		             });
				
				return basemap;
			},

			showOperations : function(model) {
				// see if there is a basemap layer of the specified type
				var basemapId = model.get("basemapId");
				var basemapLayer = that.getLayerFromLayerId(basemapId);
				if (basemapLayer !== null){
					basemapLayer.setVisible(true);
						return;
				}
				
				basemapLayer = model.get("createLayer").call(this, model);
				that.map.addLayer(basemapLayer);
				basemapLayer.setVisible(true);
				
			},


			
			hideOperations : function(model) {
				that.baseMapHide(model);
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
			basemapId : "bingAerial",
			subType : "Aerial",
			zoomLevels : 17,
			createLayer: function(model){
				return that.getBingMapsLayer(model.get("subType"), model.get("basemapId"));
			},
			showOperations : function(model) {
				// see if there is a basemap layer of the specified type
				var basemapId = model.get("basemapId");
				var basemapLayer = that.getLayerFromLayerId(basemapId);
				if (basemapLayer !== null){
					basemapLayer.setVisible(true);
						return;
				}
				
				basemapLayer = model.get("createLayer").call(this, model);
				that.map.addLayer(basemapLayer);
				basemapLayer.setVisible(true);
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
			basemapId : "bingHybrid",
			subType : "AerialWithLabels",
			zoomLevels : 17,
			createLayer: function(model){
				return that.getBingMapsLayer(model.get("subType"), model.get("basemapId"));
			},
			showOperations : function(model) {
				// see if there is a basemap layer of the specified type
				var basemapId = model.get("basemapId");
				var basemapLayer = that.getLayerFromLayerId(basemapId);
				if (basemapLayer !== null){
					basemapLayer.setVisible(true);
						return;
				}
				
				basemapLayer = model.get("createLayer").call(this, model);
				that.map.addLayer(basemapLayer);
				basemapLayer.setVisible(true);
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
			basemapId : "bingRoad",
			subType : "Road",
			zoomLevels : 17,
			createLayer: function(model){
				return that.getBingMapsLayer(model.get("subType"), model.get("basemapId"));
			},
			showOperations : function(model) {
				// see if there is a basemap layer of the specified type
				var basemapId = model.get("basemapId");
				var basemapLayer = that.getLayerFromLayerId(basemapId);
				if (basemapLayer !== null){
						basemapLayer.setVisible(true);
						return;
				}
				
				basemapLayer = model.get("createLayer").call(this, model);
				that.map.addLayer(basemapLayer);
				basemapLayer.setVisible(true);
			},
			hideOperations : function(model) {
				that.baseMapHide(model);
			},
			initialRenderCallback : that.initialRenderCallback
		};

		var models = [ bingRoad, bingHybrid, bingAerial, osm ];

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
							var layer = that.getLayerFromLayerId(data.LayerId);
							if (layer !== null){
								layer.setOpacity(data.opacity * .01);
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
						function(event, data) {
							// console.log("map.getFeatureInfoOn");
							var layerId = data.LayerId;
							// console.log(layerId);
							var layer = that.getLayerFromLayerId(layerId);
							if (layer === null) {
								// layer is not in OpenLayers...
								throw new Error(
										"This layer has not yet been previewed.  Please preview it first.");
							} else {
								that.map.on("click",
										that.getFeatureAttributes, layer);
							}
						});
		jQuery(document).on(
				"map.getFeatureInfoOff",
				function(event, data) {
					var layerId = data.LayerId;
					var layer = that.getLayerFromLayerId(layerId)
					if (layer === null) {
						// layer is not in OpenLayers...add it?
					} else {
						that.map.un("click", 
								that.getFeatureAttributes, layer);
					}
				});
	};

	this.zoomToLayerExtentHandler = function() {
		var that = this;
		jQuery(document).on("map.zoomToLayerExtent", function(event, data) {
			// console.log(data);
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
						"attributeInfoOn",
						".olMap",
						function() {
							jQuery(this).css('cursor', "crosshair");
							// also deactivate regular map controls
							var zoomControl = that
									.getControlsByClass("OpenLayers.Control.ZoomBox")[0];
							if (zoomControl.active) {
								zoomControl.deactivate();
							}
							var panControl = that
									.getControlsByClass("OpenLayers.Control.Navigation")[0];
							if (panControl.active) {
								panControl.deactivate();
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
		// returns -infinity for -90.0 lat;
		lat = parseFloat(lat);
		lon = parseFloat(lon);
		if (lat >= 90) {
			lat = 85.05;
		}
		if (lat <= -90) {
			lat = -85.05;
		}
		if (lon >= 180) {
			lon = 179.99;
		}
		if (lon <= -180) {
			lon = -179.99;
		}
		// console.log([lon, "tomercator"])
		return ol.proj.transform([lon,lat], "EPSG:4326", "EPSG:3857");
	};

	this.MercatorToWGS84 = function(lon, lat) {
		lat = parseFloat(lat);
		lon = parseFloat(lon);
		var transformedValue = ol.proj.transform([lon,lat], "EPSG:3857", "EPSG:4326");
		var newLat = transformedValue[1];
		var newLon = transformedValue[0];
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
		return [newLon, newLat];
	};

	/**
	 * Helper function to get the aspect ratio of an OpenLayers.Bounds object
	 * 
	 * @param {Object.
	 *            <OpenLayers.Bounds>} extent
	 * @returns {Number} the aspect ratio of the bounds passed
	 */
	this.getAspectRatio = function(extent) {
		//used for save image
		return (extent.getWidth() / extent.getHeight());
	};

	this.hasMultipleWorlds = function() {
		//used to position beyond extent arrows
		var exp = this.map.getView().getZoom() + 8;
		var globalWidth = Math.pow(2, exp);

		var viewPortWidth = this.map.getSize()[0];// - this.getMapOffset()[0];

		if (viewPortWidth > globalWidth) {
			// console.log("has multiple worlds");
			return true;
		} else {
			return false;
		}
	};

	this.getMapOffset = function() {
		var mapOffset = jQuery("#" + this.containerDiv).offset();
		var xOffset = 0;
		var leftCol$ = jQuery("#left_col");
		var leftColOffset = leftCol$.offset();
		if (leftCol$.is(":visible")) {
			xOffset = leftCol$.width() + leftColOffset.left - mapOffset.left;
		}
		var yOffset = jQuery("#tabs").offset().top - mapOffset.top;

		return [xOffset, yOffset];
	};

	this.getVisibleExtent = function() {
		
		var topLeft = this.map.getCoordinateFromPixel(this.getMapOffset());
		var fullExtent = this.map.getView().calculateExtent(this.map.getSize());
		//xyXY
		fullExtent[3] = topLeft[1];
		if (this.hasMultipleWorlds()) {
			fullExtent[0] = -20037508.34;
			fullExtent[2] = 20037508.34;
		} else {
			fullExtent[0] = topLeft[0];
		}
		return fullExtent;
	};
	
	this.getWGS84Extent = function() {
		var merc = this.map.getView().calculateExtent(this.map.getSize());

		return this.MercatorToWGS84(merc[0], merc[1]).concat(this.MercatorToWGS84(merc[2], merc[3]));
	};

	this.getSearchCenter = function() {

		var offsetPix = this.getMapOffset();
		var mapSize = this.map.getSize();
		
		var centerPix = [(offsetPix[0] + mapSize[0]) / 2, (mapSize[1] - offsetPix[1]) / 2];

		var center = this.map.getCoordinateFromPixel(centerPix);
		return this.MercatorToWGS84(centerPix[0], centerPix[1]);
	};
	

	this.getCombinedBounds = function(arrBounds) {
		//used for geocommons export
		//todo: fix
		var newExtent = new OpenLayers.Bounds();
		for ( var currentIndex in arrBounds) {
			var currentBounds = arrBounds[currentIndex];
			newExtent.extend(currentBounds);
		}
		return newExtent;
	};

	this.getMaxLayerExtent = function getMaxLayerExtent(layerId) {
		//used for geocommons export
		//todo: fix
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
		//used for geocommons export
		//todo: fix
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
			"current" : this.getGeodeticExtent().toBBOX(),
			"maxForLayers" : maxExtentForLayers
		};

		if (typeof extentMap[extentType] !== "undefined") {
			return extentMap[extentType];
		} else {
			throw new Error('Extent type "' + extentType + '" is undefined.');
		}
	};

	
	/*this.getBboxFromCoords = function(minx, miny, maxx, maxy) {
		var bbox = [];
		bbox.push(minx);
		bbox.push(miny);
		bbox.push(maxx);
		bbox.push(maxy);
		bbox = bbox.join(",");
		return bbox;
	};*/


/*
	this.clipToWorld = function(bounds) {
		return this.clipExtent(bounds,
				[-180, -90, 180, 90]);
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
*/
	this.getPreviewUrlArray = function(layerModel, useTilecache) {
		// is layer public or private? is this a request that can be handled by
		// a tilecache?

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
		} else if ((typeof layerModel.get("Location").tilecache !== "undefined")
				&& useTilecache) {
			populateUrlArray(layerModel.get("Location").tilecache);
		} else {
			populateUrlArray(layerModel.get("Location").wms);
		}

		// console.log(urlArray);
		return urlArray;
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
		extent = extent.split(",");		
		
		var lowerLeft = this.WGS84ToMercator(extent[0],
				extent[1]);
		var upperRight = this.WGS84ToMercator(extent[2],
				extent[3]);
		
		this.map.getView().fitExtent(lowerLeft.concat(upperRight), this.map.getSize());

	};

	// add layers to OL map
	this.hideLayerBBox = function() {
		if (this.getLayerFromLayerId("layerBBox") !== null) {
			var featureLayer = this.getLayerFromLayerId("layerBBox");
			this.map.removeLayer(featureLayer);
		}
		jQuery(".corner").hide();
	};

	this.createBBoxLayer = function(arrFeatures) {
		/*
		 * 4px border, border color: #1D6EEF, background color: #DAEDFF, box
		 * opacity: 25%
		 */
		
		var styleBlue = new ol.style.Style({
			fill: new ol.style.Fill({
				color: 'rgba(218,237,255,.25)'
			}),
			stroke: new ol.style.Stroke({
				color: 'rgba(29,110,239,1)',
				width: 4
			})
		});
		
		return new ol.layer.Vector({
			ogpLayerId: "layerBBox",
			style : styleBlue,
			source: new ol.source.GeoJSON({
			      object: {
			          'type': 'FeatureCollection',
			          'crs': {
			            'type': 'name',
			            'properties': {
			              'name': 'EPSG:3857'
			            	}
			          	},
			          "features" : arrFeatures
			     }
			})
		});
	};

	this.getDistance = function(pix1, pix2){
		var a = pix1[0] - pix2[0];
		var b = pix1[1] - pix2[1];
		return Math.sqrt(a^2 + b^2);
	};
	
	this.showLayerBBox = function(mapObj) {
		// add or modify a layer with a vector representing the selected feature
		var featureLayer = this.getLayerFromLayerId("layerBBox");
		if (featureLayer !== null) {
			this.map.removeLayer(featureLayer);
			jQuery(".corner").hide();
		}
		
		
		
		var bottomLeft = this.WGS84ToMercator(mapObj.west, mapObj.south);
		var topRight = this.WGS84ToMercator(mapObj.east, mapObj.north);

		//if pixel distance b/w topRight and bottomLeft falls below a certain threshold, 
		//add a marker(fixed pixel size) in the center, so the user can see where the layer is
		var blPixel = this.map.getPixelFromCoordinate(bottomLeft);
		var trPixel = this.map.getPixelFromCoordinate(topRight);
		
		var pixelDistance = this.getDistance(blPixel, trPixel);
		var threshold = 10;
		var displayMarker = false;
		
		if (pixelDistance <= threshold){
			displayMarker = true;
		}

		try{
		var arrFeatures = [];
		if (bottomLeft.lon > topRight.lon) {
			var dateline = this.WGS84ToMercator(180, 0)[0];
			var geom1 = new ol.geom.Polygon([
					[bottomLeft.lon, bottomLeft.lat], [bottomLeft.lon, topRight.lat],
					[dateline, topRight.lat], [dateline, bottomLeft.lat],
					[bottomLeft.lon, bottomLeft.lat]]);
					
			var geom2 = new ol.geom.Polygon([
					[topRight.lon, topRight.lat], [topRight.lon, bottomLeft.lat],
					[-1 * dateline, bottomLeft.lat], [-1 * dateline, topRight.lat],
					[topRight.lon, topRight.lat]]);
					
			arrFeatures.push(new ol.Feature(geom1));
			arrFeatures.push(new ol.Feature(geom2));

			if (displayMarker){
				//arrFeatures.push(new OpenLayers.Feature.Vector(geom1.getCentroid()));
			}
			
		} else {
			var geom;
			try{

				geom =  [[[bottomLeft[0], bottomLeft[1]], [bottomLeft[0], topRight[1]],
				         [topRight[0], topRight[1]], [topRight[0], bottomLeft[1]]]];
			} catch (e){
				console.log(e);
			}
			
			var box;
			try {
		         box = {
		              'type': 'Feature',
		              'geometry': {
		                'type': 'Polygon',
		                'coordinates': geom
		              }};
				//box = new ol.Feature(geom);
			} catch (e){
				console.log(e);
			}
			arrFeatures.push(box);
			
			if (displayMarker){
				//arrFeatures.push(new OpenLayers.Feature.Vector(geom.getCentroid()));
			}
		}
		
		try {
			featureLayer = this.createBBoxLayer(arrFeatures);
		} catch(e){
			console.log(e);
		}
		
		this.map.addLayer(featureLayer);

		} catch (e){
			
			console.log(e);
		}
		//this.setLayerIndex(featureLayer, (this.layers.length - 1));

		// do a comparison with current map extent
	/*	var extent = this.getVisibleExtent();
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

		}*/

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
	this.saveImage = function(imageFormat, resolution) {
		// TODO: add html5 canvas stuff...may have to wait for OL3?
		imageFormat = 'png';
		var format;
		switch (imageFormat) {
		case 'jpeg':
			format = "image/jpeg";
			break;
		case 'png':
			format = "image/png";
			break;
		case 'bmp':
			format = "image/bmp";
			break;
		default:
			throw new Error("This image format (" + imageFormat
					+ ") is unavailable.");
		}

		var requestObj = {
			requestType : "image"
		};
		requestObj.layers = [];

		for ( var layer in this.layers) {
			var currentLayer = this.layers[layer];
			if (currentLayer.CLASS_NAME != "OpenLayers.Layer.WMS") {
				continue;
			}
			if (currentLayer.visibility == false) {
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
			var sld = layerModel.get("sld");
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
			layerObj.zIndex = this.getLayerIndex(currentLayer);
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


		var bbox = this.map.getView().calculateExtent(this.map.getSize());


		requestObj.format = format;
		requestObj.bbox = bbox;
		requestObj.srs = 'EPSG:900913';
		var offset = this.getMapOffset();
		var ar = this.getAspectRatio(extent);
		// NOTE: this doesn't really work... should get appropriate width and
		// height based on bbox NB (CB 2/1/2014): not sure what this note
		// means...
		var currSize = this.getCurrentSize();
		requestObj.width = currSize.w - offset.x;
		requestObj.height = parseInt(requestObj.width / ar);
		// add the request to the queue
		this.requestQueue.createRequest(requestObj);
	};

	this.processMetadataSolrResponse = function(data) {
		var solrResponse = data.response;
		var totalResults = solrResponse.numFound;
		if (totalResults != 1) {
			throw new Error("Request for Metadata returned " + totalResults
					+ ".  Exactly 1 was expected.");
			return;
		}
		var doc = solrResponse.docs[0]; // get the first layer object
		return doc;
	};

	this.getAttributeDescriptionJsonpSuccess = function(data) {
		jQuery(".attributeName").css("cursor", "default");

		var that = this;

		var solrdoc = this.processMetadataSolrResponse(data);
		var xmlDoc = jQuery.parseXML(solrdoc.FgdcText); // text was escaped on
		// ingest into Solr

		var layerId = jQuery("td.attributeName").first().closest("table").find(
				"caption").attr("title");
		var layerAttrs = this.previewed.findWhere({
			LayerId : layerId
		}).get("layerAttributes");

		jQuery(xmlDoc)
				.find("attrlabl")
				.each(
						function() {
							var currentXmlAttribute$ = jQuery(this);
							jQuery("td.attributeName")
									.each(
											function() {
												var attributeName = jQuery(this)
														.text().trim();
												if (currentXmlAttribute$.text()
														.trim().toLowerCase() == attributeName
														.toLowerCase()) {
													var attributeDescription = currentXmlAttribute$
															.siblings("attrdef")
															.first();
													attributeDescription = OpenGeoportal.Utility
															.stripExtraSpaces(attributeDescription
																	.text()
																	.trim());
													if (attributeDescription.length === 0) {
														attributeDescription = "No description available";
													}
													jQuery(this)
															.attr('title',
																	attributeDescription);
													layerAttrs
															.findWhere(
																	{
																		attributeName : attributeName
																	})
															.set(
																	{
																		description : attributeDescription
																	});
													return;
												}
											});
						});
	};

	this.getAttributeDescriptionJsonpError = function() {
		jQuery(".attributeName").css("cursor", "default");
		throw new Error("The attribute description could not be retrieved.");
	};

	this.attributeDescriptionHandler = function() {
		// mouseover to display attribute descriptions
		var that = this;
		jQuery(document)
				.on(
						'mouseenter',
						"td.attributeName",
						function() {
							var layerId = jQuery(this).closest("table").find(
									"caption").attr("title");
							var layerAttrs = that.previewed.findWhere({
								LayerId : layerId
							}).get("layerAttributes");

							var attrModel = layerAttrs.findWhere({
								attributeName : jQuery(this).text().trim()
							});

							if (typeof attrModel !== "undefined"
									&& attrModel.has("description")) {
								jQuery(this).attr('title',
										attrModel.get("description"));
								// short circuit if attributes have already been
								// looked up
							} else {
								var solr = new OpenGeoportal.Solr();
								var query = solr.getServerName()
										+ "?"
										+ jQuery.param(solr
												.getMetadataParams(layerId));
								jQuery(".attributeName").css("cursor", "wait");
								solr
										.sendToSolr(
												query,
												that.getAttributeDescriptionJsonpSuccess,
												that.getAttributeDescriptionJsonpError,
												that);
							}
						});
	};

	this.getFeatureAttributes = function(e) {
		// console.log("getFeatureAttributes");

		//if (typeof this.map !== "undefined") {
			var mapObject = e.map;// since this is an event handler, the
			// context isn't the MapController
			// Object, it's the map layer.

			// generate the query string
			var layerId = this.get("ogpLayerId");

			var mapExtent = mapObject.getView().calculateExtent(mapObject.getSize());

			var pixel = e.pixel;
			// geoserver doesn't like fractional pixel values

			var params = {
					ogpid: layerId,
					bbox: mapExtent.join(),
					x: Math.round(pixel[0]),
					y: Math.round(pixel[1]),
					height: mapObject.getSize()[1],
					width: mapObject.getSize()[0]
			};
			
			var layerModel = mapController.previewed.findWhere({
				LayerId : layerId
			});
			var dialogTitle = layerModel.get("LayerDisplayName");
			var institution = layerModel.get("Institution");

			var ajaxParams = {
				type : "GET",
				url : 'featureInfo',
				data : params,
				dataType : 'html',
				beforeSend : function() {
					if (mapController.currentAttributeRequests.length > 0) {
						// abort any outstanding requests before submitting a
						// new one
						for ( var i in mapController.currentAttributeRequests) {
							var request = mapController.currentAttributeRequests.splice(i, 1)[0];
							request.featureRequest.abort();
						}
					}

					jQuery(document).trigger({type: "showLoadIndicator", loadType: "getFeature", layerId: layerId});
				},
				success : function(data, textStatus, XMLHttpRequest) {

					mapController.getFeatureAttributesSuccessCallback(layerId,
							dialogTitle, data);
				},
				error : function(jqXHR, textStatus, errorThrown) {
					if ((jqXHR.status != 401) && (textStatus != 'abort')) {
						throw new Error("Error retrieving Feature Information.");
							
					}
				},
				complete : function(jqXHR) {
					for ( var i in mapController.currentAttributeRequests) {
						if (mapController.currentAttributeRequests[i].featureRequest === jqXHR) {
							mapController.currentAttributeRequests.splice(i, 1);

						}
					}
					jQuery(document).trigger({type: "hideLoadIndicator", loadType: "getFeature", layerId: layerId});
				}
			};

			mapController.currentAttributeRequests.push({layerId: layerId, featureRequest: jQuery.ajax(ajaxParams)});
			analytics.track("Layer Attributes Viewed", institution, layerId);

	};

	this.currentAttributeRequests = [];

	this.registerAttributes = function(layerId, attrNames) {
		var layerModel = this.previewed.findWhere({
			LayerId : layerId
		});
		if (!layerModel.has("layerAttributes")) {
			var attributes = new OpenGeoportal.Attributes();
			for ( var i in attrNames) {
				if (attrNames.hasOwnProperty(i)){
					var attrModel = new OpenGeoportal.Models.Attribute({
						attributeName : attrNames[i]
					});
					attributes.add(attrModel);
				}
			}
			layerModel.set({
				layerAttributes : attributes
			});
		}
	};

	this.getFeatureAttributesSuccessCallback = function(layerId, dialogTitle,
			data) {
		// grab the html table from the response
		var responseTable$ = jQuery(data).filter(function() {
			return jQuery(this).is('table');
		});

		var template = this.template;
		var tableText = "";

		if ((responseTable$.length === 0)
				|| (jQuery(data).find("tr").length === 0)) {
			// what should happen here? returned content is empty or otherwise
			// unexpected
			tableText = '<p>There is no data for "' + dialogTitle
					+ '" at this point.</p>';
		} else {
			responseTable$ = responseTable$.first();
			// process the html table returned from wms getfeature request
			var rows = this.processAttributeTable(responseTable$);

			tableText = template.attributeTable({
				layerId : layerId,
				title : dialogTitle,
				tableContent : rows
			});

			var attrNames = [];
			for ( var i in rows) {
				attrNames.push(rows[i].header);
			}
			this.registerAttributes(layerId, attrNames);

		}

		// create a new dialog instance, or just open the dialog if it already
		// exists

		if (typeof jQuery('#featureInfo')[0] === 'undefined') {
			var infoDiv = template.genericDialogShell({
				elId : "featureInfo"
			});
			jQuery("#dialogs").append(infoDiv);
			jQuery("#featureInfo").dialog({
				zIndex : 2999,
				title : "Feature Attributes",
				width : 'auto',
				autoOpen : false
			});

		}
		jQuery("#featureInfo").fadeOut(200, function() {
			jQuery("#featureInfo").html(tableText);
			// limit the height of the dialog. some layers will have hundreds of
			// attributes
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
			// horizontal table returned
			responseTable$.find("tr").each(
					function() {

						if (jQuery(this).find("th").length > 0) {
							// this is the header row
							var cells$ = jQuery(this).find("th");

						} else {
							var cells$ = jQuery(this).find("td");
						}
						var rowArr = [];
						cells$.each(function() {
							var cellText = jQuery(this).text().trim();
							if (cellText.indexOf('http') === 0) {
								cellText = '<a href="' + cellText + '">'
										+ cellText + '</a>';
							}
							rowArr.push(cellText);
						});
						tableArr.push(rowArr);
					});

		} else {
			// vertical table returned
			// TODO: handle vertical table case
		}

		// iterate over headers
		var rows = [];
		if (tableArr.length > 0) {

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
					jQuery("body").trigger(
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
		jQuery("body").trigger(model.get("LayerId") + 'Exists');

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
			jQuery("body").trigger(layerModel.get("LayerId") + 'Exists');
		}
	};

	/***************************************************************************
	 * style (SLD) handling
	 **************************************************************************/

	this.changeStyle = function(layerId) {
		var layer = this.getLayerFromLayerId(layerId);
		if (layer === null) {
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
		// console.log(layerModel);
		var dataType = layerModel.get("DataType").toLowerCase();
		var userSLD = {};
		// we need this for now, since the tilecache name and geoserver name for
		// layers is different for Harvard layers
		var wmsName = layerModel.get("qualifiedName");
		// don't use a tilecache
		layer.url = this.getPreviewUrlArray(layerModel, false);
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
		layer.mergeNewParams(newSLD);
		layerModel.set({
			sld : layerUniqueInfo
		});
	};

	this.getBorderColor = function(fillColor) {
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
				tempColor = "00";
			} else {
				// convert to hex
				tempColor = tempColor.toString(16);
			}
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
		var layer = this.getLayerFromLayerId(layerId);
		if (layer !== null){
			layer.setVisible(false);
		}


	};

	this.showLayer = function(layerId) {
		var layer = this.getLayerFromLayerId(layerId);
		if (layer !== null){
			layer.setVisible(true);
		}
	};

	this.addMapBBox = function(mapObj) {
		// mapObj requires west, east, north, south
		// add or modify a layer with a vector representing the selected feature
		var featureLayer;

		var style_green = OpenLayers.Util.extend({},
				OpenLayers.Feature.Vector.style['default']);
		style_green.strokeColor = "green";
		style_green.fillColor = "green";
		style_green.fillOpacity = .05;
		// style_green.pointRadius = 10;
		style_green.strokeWidth = 2;
		style_green.strokeLinecap = "butt";
		style_green.zIndex = 999;

		featureLayer = new OpenLayers.Layer.Vector(mapObj.title, {
		// style: style_green
		});
		this.addLayer(featureLayer);
		var bbox = mapObj.bbox.split(",");
		var bottomLeft = this.WGS84ToMercator(bbox[0], bbox[1]);
		var topRight = this.WGS84ToMercator(bbox[2], bbox[3]);

		if (bottomLeft.lon > topRight.lon) {
			var dateline = this.WGS84ToMercator(180, 0).lon;
			var box1 = new OpenLayers.Feature.Vector(new OpenLayers.Bounds(
					bottomLeft.lon, bottomLeft.lat, dateline, topRight.lat)
					.toGeometry());
			var box2 = new OpenLayers.Feature.Vector(new OpenLayers.Bounds(
					topRight.lon, topRight.lat, -1 * dateline, bottomLeft.lat)
					.toGeometry());
			featureLayer.addFeatures([ box1, box2 ]);
		} else {
			var box = new OpenLayers.Feature.Vector(new OpenLayers.Bounds(
					bottomLeft.lon, bottomLeft.lat, topRight.lon, topRight.lat)
					.toGeometry());
			featureLayer.addFeatures([ box ]);
		}
		this.setLayerIndex(featureLayer, (this.layers.length - 1));
	};


	
	this.getLayerName = function(layerModel, url) {
		var layerName = layerModel.get("Name");
		var wmsNamespace = layerModel.get("WorkspaceName");
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
	
	this.getLayerFromLayerId = function(layerId){
		var layers = this.map.getLayers();
		var found = null;
		layers.forEach(function(layer){
			if (layer === null){
				return;
			}
			if (layer.get("ogpLayerId") === layerId){
				found = layer;
			}
		});
		
		return found;

	};
	
	this.addWMSLayer = function(layerModel) {
		// mapObj requires institution, layerName, title, datatype, access
		/*
		 * var bottomLeft = this.WGS84ToMercator(mapObj.west, mapObj.south); var
		 * topRight = this.WGS84ToMercator(mapObj.east, mapObj.north); var
		 * bounds = new OpenLayers.Bounds(); bounds.extend(new
		 * OpenLayers.LonLat(bottomLeft.lon, bottomLeft.lat)); bounds.extend(new
		 * OpenLayers.LonLat(topRight.lon, topRight.lat)); console.log(bounds);
		 * var box = new OpenLayers.Feature.Vector(bounds.toGeometry()); var
		 * featureLayer = new OpenLayers.Layer.Vector("BBoxTest");
		 * featureLayer.addFeatures([box]); this.addLayer(featureLayer);
		 */

		var layerId = layerModel.get("LayerId");
		// check to see if layer is on openlayers map, if so, show layer
		var opacitySetting = layerModel.get("opacity");

		var matchingLayer = this.getLayerFromLayerId(layerId);
		if (matchingLayer !== null) {
			matchingLayer.setVisible(true);
			matchingLayer.setOpacity(opacitySetting * .01);
			return;
		}


		// use a tilecache if we are aware of it

		var wmsArray = this.getPreviewUrlArray(layerModel, true);
	

		// won't actually do anything, since noMagic is true and transparent is
		// true
		/*var format;
		var dataType = layerModel.get("DataType");
		if ((dataType == "Raster") || (dataType == "Paper Map")) {
			format = "image/jpeg";
		} else {
			format = "image/png";
		}*/


		var that = this;
		var layerName = that.getLayerName(layerModel, wmsArray[0]);
		var newLayer = new ol.layer.Tile({ 
			ogpLayerId : layerModel.get("LayerId"),
			source: new ol.source.TileWMS(
		
				{
					params: {
						LAYERS: layerName
					},
					url: wmsArray[0]
				}
		
			) });
		that.map.addLayer(newLayer);
		// we do a check to see if the layer exists before we add it
	/*	jQuery("body").bind(layerModel.get("LayerId") + 'Exists',
				function() {
					// if this is a raster layer, we should use jpeg format, png for vector
					// (per geoserver docs)
					var layerName = that.getLayerName(layerModel, wmsArray[0]);*/
						/*
						 * attributions 	Array.<ol.Attribution> | undefined 	

Attributions.
params 	Object.<string, *> 	

WMS request parameters. At least a LAYERS param is required. STYLES is ` by default.VERSIONis1.3.0by default.WIDTH,HEIGHT,BBOXandCRS(SRS` for WMS version < 1.3.0) will be set dynamically.
crossOrigin 	null | string | undefined 	

crossOrigin setting for image requests.
extent 	ol.Extent | undefined 	

Extent.
gutter 	number | undefined 	

The size in pixels of the gutter around image tiles to ignore. By setting this property to a non-zero value, images will be requested that are wider and taller than the tile size by a value of 2 x gutter. Defaults to zero. Using a non-zero value allows artifacts of rendering at tile edges to be ignored. If you control the WMS service it is recommended to address "artifacts at tile edges" issues by properly configuring the WMS service. For example, MapServer has a tile_map_edge_buffer configuration parameter for this. See http://mapserver.org/output/tile_mode.html.
hidpi 	boolean | undefined 	

Use the ol.Map#pixelRatio value when requesting the image from the remote server. Default is true.
logo 	string | undefined 	

Logo.
tileGrid 	ol.tilegrid.TileGrid | undefined 	

Tile grid.
maxZoom 	number | undefined 	

Maximum zoom.
projection 	ol.proj.ProjectionLike 	

Projection.
serverType 	ol.source.wms.ServerType | string | undefined 	

The type of the remote WMS server: mapserver, geoserver or qgis. Only needed if hidpi is true. Default is undefined.
tileLoadFunction 	ol.TileLoadFunctionType | undefined 	

Optional function to load a tile given a URL.
url 	string | undefined 	

WMS service URL.
urls 	Array.<string> | undefined 	

WMS service urls. Use this instead of url when the WMS supports multiple urls for GetMap requests.
						 */

			/*
			 * 							layerModel.get("LayerDisplayName"), 
							wmsArray, 
						{
							layers : layerName, 
							format : format,
							tiled : true,
							exceptions : "application/vnd.ogc.se_xml",
							transparent : true,
							version : "1.3.0"
						}, {
							transitionEffect : 'resize',
							opacity : opacitySetting * .01,
							ogpLayerId : layerModel.get("LayerId"),
							ogpLayerRole : "LayerPreview"
					}
			 */
				/*	newLayer.events.register('loadstart', newLayer, function() {
						//console.log("Load start");
						jQuery(document).trigger({type: "showLoadIndicator", loadType: "layerLoad", layerId: layerModel.get("LayerId")});
					});

					newLayer.events.register('loadend', newLayer, function() {
						//console.log("Load end");
						jQuery(document).trigger({type: "hideLoadIndicator", loadType: "layerLoad", layerId: layerModel.get("LayerId")});
					});
					*/
					//console.log("wms layer");
					//console.log(layerModel);
					//console.log("openlayers layer");
					//console.log(newLayer);
			/*		
					that.map.addLayer(newLayer);
				});
		this.layerExists(layerModel);*/

	};

	// thanks to Allen Lin, U of MN
	this.addArcGISRestLayer = function(layerModel) {
		// won't actually do anything, since noMagic is true and transparent is
		// true
		var format;
		if (layerModel.isVector) {
			format = "image/png";
		} else {
			format = "image/jpeg";
		}

		// if this is a raster layer, we should use jpeg format, png for vector
		// (per geoserver docs)
		var newLayer = new OpenLayers.Layer.ArcGIS93Rest(
				layerModel.get("LayerDisplayName"),
				layerModel.get("Location").ArcGISRest, 
				{
					layers : "show:" + layerModel.get("Name"),
					transparent : true
				}, {
					buffer : 0,
					transitionEffect : 'resize',
					opacity : layerModel.get("opacity"),
					ogpLayerId : layerModel.get("LayerId")
				});
		newLayer.projection = new OpenLayers.Projection("EPSG:3857");
		// how should this change? trigger custom events with jQuery
		newLayer.events.register('loadstart', newLayer, function() {
			jQuery(document).trigger({type: "showLoadIndicator", loadType: "layerLoad", layerId: layerModel.get("LayerId")});
		});
		newLayer.events.register('loadend', newLayer, function() {
			jQuery(document).trigger({type: "hideLoadIndicator", loadType: "layerLoad", layerId: layerModel.get("LayerId")});
		});
		var that = this;
		// we do a cursory check to see if the layer exists before we add it
		jQuery("body").bind(newLayer.ogpLayerId + 'Exists', function() {
			that.addLayer(newLayer);
		});
		this.layerExists(layerModel);
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

		for ( var i in previewMethods) {
			if (previewMethods[i].type === previewType) {
				return previewMethods[i][functionType];
			}
		}
		return previewMethods["default"][functionType];
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

			// var previewObj = this.previewOnDispatcher(location);
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
			throw new Error([err,
					'Unable to remove Previewed layer "'
							+ previewModel.get("LayerDisplayName") + '"']);
		}
		// if no errors, set state for the layer

		// previewModel.set({preview: "off"});
		// this.addToPreviewedLayers(rowData.node);//this should happen in the
		// datatable
		// analytics.track("Layer Unpreviewed", dataObj["Institution"],
		// layerId);

	};

};// object end

