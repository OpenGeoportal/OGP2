/**
 * 
 * This javascript module includes functions for dealing with the map defined
 * under the object MapController. MapController inherits from the
 * L.Map object
 * 
 * @authors Chris Barnett, Ben Hickson
 */

if (typeof OpenGeoportal === 'undefined') {
	OpenGeoportal = {};
} else if (typeof OpenGeoportal !== "object") {
	throw new Error("OpenGeoportal already exists and is not an object");
}

/**
 * MapController constructor
 * 
 * @constructor
 * @requires Leaflet
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

	/**
	 * initialization function for the map
	 * 
	 * @param {string}
	 *            containerDiv - the id of the div element that the map should
	 *            be rendered to
	 * @param {object}
	 *            userOptions - object can be used to pass Leaflet options to
	 *            the created Leaflet map
	 * 
	 */
	this.initMap = function(containerDiv) {
		// would passing a jQuery object be preferable to the string id?
		if ((typeof containerDiv === 'undefined')
				|| (containerDiv.length === 0)) {
			throw new Error("The id of the map div must be specified.");
		}
		this.containerDiv = containerDiv;
		
		this.createMapHtml(containerDiv);
		
		try {
			this.createLeafletMap();
		} catch (e) {
			console.log("problem creating leaflet map");
			console.log(e);
		}
		
		this.initBasemaps();

		try {
			this.registerMapEvents();
		} catch (e) {
			console.log("problem registering map events");
			console.log(e);
		}
		
		this.addMapToolbarElements();

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

	/**
	 * Create the controls for the map. Depends on "previewed" object.
	 * 
	 * @requires OpenGeoportal.PreviewedLayers
	 * @returns an array of controls to pass to the map
	 */

	this.createLeafletControls = function() {
		var extentHistory = L.control.historyControl({
			position: "topleft"
		});				

		var zoomBox = L.control.zoomBox({
			modal:false,
			position:"topleft"
		});

		var scaleBar = L.control.scale({
			position:"bottomright"
		});

		var mouseCoords = L.control.coordinates({
			position:"bottomright",
			decimals:4,
			enableUserInput:false,
			decimalSeparator:".",
			useLatLongOrder:false,
			labelTemplateLng:"Longitude: {x}",
			labelTemplateLat:"Latitude: {y}"
		});
		
		var loadingControl = L.Control.loading({
			separate: true
		})

		mapControls = [extentHistory, zoomBox, mouseCoords, scaleBar, loadingControl];

		return mapControls;
	};

	this.getInitialZoomLevel = function() {
		var initialZoom = 2;

		if (jQuery('#' + this.containerDiv).parent().height() > 810) {
			initialZoom = 2;
			// TODO: this should be more sophisticated. width is also important
			// initialZoom = Math.ceil(Math.sqrt(Math.ceil(jQuery('#' +
			// this.containerDiv).parent().height() / 256)));
		}
		return initialZoom;
	};

	/**
	 * Instantiate the actual Leaflet map object, sets parameters, size,
	 * initial view and active area. Add controls
	 * 
	 * @param {object}
	 *            userOptions - options to pass through to the Leaflet Map
	 *            object
	 */
	this.createLeafletMap = function() {
		// set default Leaflet map options
		this.mapDiv = this.containerDiv;

	        this.controls = this.createLeafletControls();

		var initialZoom = this.getInitialZoomLevel();
		
		var options = {
			maxZoom: 18 
		};

		var initialHeight;
		if (initialZoom === 1){
			initialHeight = 512;
		} else {
			initialHeight = jQuery("#" + this.containerDiv).parent().height();
		}

		jQuery('#' + this.mapDiv).height(initialHeight).width(jQuery("#" + this.containerDiv).parent().width());

		L.Map.call(this, this.mapDiv, options);

		this.on('load', function() {
 			$(document).trigger("mapReady");
		} );

		this.setView(new L.LatLng(0,0), initialZoom);
	
		// set the visible area of the map to be the active area
		// creates a div with class viewport
		this.setActiveArea('viewport');

		for (i = 0; i < this.controls.length; i++) {
			this.controls[i].addTo(this);
		};

	};

	/**
	 * Initialize the Basemaps collection, set the initial basemap
	 */

	this.initBasemaps = function() {
		this.basemaps = this.createBasemaps();

		this.basemaps.addTo(this);
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

		$(".leaflet-zoom-box-control").appendTo("#navControls");
		$(".history-control").appendTo("#navControls");
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
			var map$ = $("#map");

			var newHeight = Math.max(data.ht, data.minHt);
			var oldHeight = map$.height();

			var newWidth = Math.max(data.wd, data.minWd);
			var oldWidth = map$.width();

			if (newHeight !== oldHeight || newWidth !== oldWidth){
				map$.height(newHeight).width(newWidth);
				that.invalidateSize();
			}
			
		});

		this.on('moveend', function() {
			var newExtent = that.getBounds();
			var newCenter = that.getCenter();

			/*
			 * Translate the Leaflet event to a jQuery event used by the
			 * application. This is the event used to trigger a search on map
			 * move. cluster moveend events so that we don't fire too often
			 * 
			 * @fires "map.extentChanged"
			 *
			*/
			clearTimeout(this.moveEventId);
	
			var trigger = function(){
				jQuery(document).trigger('map.extentChanged', {
					mapExtent : newExtent,
					mapCenter : newCenter
				});
			};

			this.moveEventId = setTimeout(trigger, 500);
			
		});

                var zoomBoxListener = function() {
                        that.previewed.clearGetFeature();
                };

                L.DomEvent.on(document.getElementsByClassName('leaflet-zoom-box-control')[0], 'click', zoomBoxListener);


		this.bboxHandler();
		this.styleChangeHandler();
		this.opacityHandler();
		this.zIndexHandler();
		this.previewLayerHandler();
		this.getFeatureInfoHandler();
		this.clearLayersHandler();
		this.attributeDescriptionHandler();
		this.mouseCursorHandler();
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

        this.mapLoaded = function() {
		jQuery("#map").fadeTo("slow", 1);
	}
        
	/***************************************************************************
	 * basemap handling
	 **************************************************************************/
	 
	this.createBasemaps = function() {
		var that = this;
	
		var mapBoxAttr = 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, ' + '<a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' + 'Imagery © <a href="http://mapbox.com">Mapbox</a>',
		mapBoxUrl = 'https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token=pk.eyJ1IjoiYmhpY2tzb24iLCJhIjoiY2lqb25jazdqMDB1OHRobTVwcWZlbGl0NyJ9.CPm_-v_36RGkZMV-5Un2sg';

		var mapBox_Light   = L.tileLayer(mapBoxUrl, {
			id: 'mapbox.light',
			attribution: mapBoxAttr
		}).on('load', this.mapLoaded);

		var mapBox_Streets  = L.tileLayer(mapBoxUrl, {
			id: 'mapbox.streets',   attribution: mapBoxAttr
		}).on('load', this.mapLoaded);

		var mapBox_Dark  = L.tileLayer(mapBoxUrl, {
			id: 'mapbox.dark',   attribution: mapBoxAttr
		}).on('load', this.mapLoaded);

		var mapBox_StreetsSatellite = L.tileLayer(mapBoxUrl, {
			id: 'mapbox.streets-satellite',   attribution: mapBoxAttr
		}).on('load', this.mapLoaded);

		var mapBox_Satellite = L.tileLayer(mapBoxUrl, {
			id: 'mapbox.satellite',   attribution: mapBoxAttr
		}).on('load', this.mapLoaded);

		var MapBox_Outdoors = L.tileLayer(mapBoxUrl, {
			id: 'mapbox.outdoors', attribution: mapBoxAttr
		}).on('load', this.mapLoaded);

		var esri_WorldImagery = L.tileLayer('http://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
			attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
		}).on('load', this.mapLoaded);


		var that = this;

		// Set Default Basemap	
		mapBox_Light.addTo(that).setZIndex(50);
		
		var baseMaps = {
			"Grayscale - MapBox": mapBox_Light,
			"Streets - MapBox": mapBox_Streets,
			"Dark - MapBox": mapBox_Dark,
			"Streets/Satellite - MapBox": mapBox_StreetsSatellite,
			"Outdoors - MapBox" : MapBox_Outdoors,
			"World Imagery - Esri": esri_WorldImagery
		};
		
		// create an instance of the basemap collection
		var collection = new L.control.layers(baseMaps)
		
		return collection;

	};

	/***************************************************************************
	 * map event handlers
	 **************************************************************************/

	this.getLayerByOGPId = function (group, layerId) {
		console.log("getLayerByOGPId FIRED");
		console.log("group",group,"layerId",layerId);
		var layerMatch;
		group.eachLayer(function (layer) {
			console.log("layer",layer);
			if (layer.options.id == layerId) {
				layerMatch = layer;
			} else {
				console.log("no layer matching id " + layerId + " found");
			}
		})
		return layerMatch;
	}

	this.opacityHandler = function() {
		var that = this;
		jQuery(document).on("map.opacityChange", function(event, data) {
								var layer = that.getLayerByOGPId(that.previewLayerGroup, data.LayerId)
								try {
									layer.setOpacity(data.opacity * 0.01);
								} catch (err) {
									// setOpacity won't work for Arc layers (json)
									var pane = that.getPane(layer.options.id);
									pane.style.opacity = data.opacity * 0.01;
								}
		});
	};
	
	this.zIndexHandler = function() {
		var that = this;
		jQuery(document).on("map.zIndexChange",	function(event, data) {
								var layer = that.getLayerByOGPId(that.previewLayerGroup, data.LayerId);
								try {
									layer.setZIndex(data.zIndex);
								} catch (err) {
									var pane = that.getPane(layer.options.id);
									pane.style.zIndex = data.zIndex;
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
		console.log("styleChangedHandler FIRED");
		var that = this;
		jQuery(document).on("map.styleChange", function(event, data) {
			console.log("data",data);
			that.setStyle(data.LayerId);
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
		jQuery(document).on("map.getFeatureInfoOn", function(event, data) {
			var layer = that.getLayerByOGPId(that.previewLayerGroup, data.LayerId);
			if (layer == null ) {
				// layer is not in previewLayerGroup...
				throw new Error("This layer has not yet been previewed.  Please preview it first.");
			} else {
				layer.options.identify = true;
				that.on('click', that.getFeatureAttributes, that);
			}
		});

		jQuery(document).on("map.getFeatureInfoOff", function(event, data) {
			var layer = that.getLayerByOGPId(that.previewLayerGroup, data.LayerId);
			layer.options.identify = false;
			if (layer != null) {
				that.off('click', that.getFeatureAttributes)
			}
		});
	};

	this.mouseCursorHandler = function() {
		var that = this;
		jQuery(document).on("map.attributeInfoOn",
			function() {
				jQuery("#map").css('cursor', "crosshair");
				// also deactivate regular map controls
				var zoomControl;
				for (i = 0; i < that.controls.length; i++) {
					if (that.controls[i].getContainer().classList.contains('leaflet-zoom-box-control')) {
						zoomControl = that.controls[i];
						break
					}
				};

				if (zoomControl._active) {
					zoomControl.deactivate();
				}
			}
		);
		jQuery(document).on("map.attributeInfoOff",
			function() {
				jQuery("#map").css('cursor','')
			}
		);
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
	
	/***************************************************************************
	 * map utility functions
	 **************************************************************************/

	this.hasMultipleWorlds = function() {
		var exp = this.getZoom() + 8;
		var globalWidth = Math.pow(2, exp);

		var viewPortWidth = this.getSize().w - this.getMapOffset().x;

		if (viewPortWidth > globalWidth) {
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

		var pixelOffset = {x:xOffset,y:yOffset};

		return pixelOffset;
	};

	this.adjustExtent = function() {
		var offset = this.getMapOffset();
		var fullMapHeight = jQuery('#' + this.mapDiv).height();
		var fullMapWidth = jQuery('#' + this.mapDiv).width();
		var adjust = {};
		adjust.x = (fullMapWidth - offset.x) / fullMapWidth;
		adjust.y = (fullMapHeight - offset.y) / fullMapHeight;
		return adjust;
	};

	//Is only needed for MapIt Functions. Not currently being used by UA
	this.getCombinedBounds = function(arrBounds) {

		var newExtent = new OpenLayers.Bounds();
		for ( var currentIndex in arrBounds) {
			var currentBounds = arrBounds[currentIndex];
			newExtent.extend(currentBounds);
		}
		return newExtent;
	};

	//Is only needed for MapIt Functions. Not currently being used by UA
	this.boundsToOLObject = function(model) {
		var newExtent = new OpenLayers.Bounds();
		newExtent.left = model.get("MinX");
		newExtent.right = model.get("MaxX");
		newExtent.top = model.get("MaxY");
		newExtent.bottom = model.get("MinY");

		return newExtent;
	};

	//Is only used by the mapIt functions.  Not currently being used UA
	this.getSpecifiedExtent = function getSpecifiedExtent(extentType, layerObj) {
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
			"current" : this.getBounds().toBBoxString(),
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

	this.getPreviewUrlArray = function(layerModel, useTilecache) {
		// is layer public or private? is this a request that can be handled by a tilecache?

		var urlArraySize = 1;
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

	// add layers to map
	this.hideLayerBBox = function(layers) {
		this.bBoxes.clearLayers();			
		//THIS MAY NOT BE NEEDED?..
		jQuery(".corner").hide();
	};

	this.showLayerBBox = function(mapObj) {
		// add a layer with a vector representing the selected feature bounding box

		if (this.bBoxes != undefined) {
			var layers = this.bBoxes.getLayers();
			this.hideLayerBBox(layers);
		} else {
			this.bBoxes = L.layerGroup();
			this.bBoxes.addTo(this);
		}

		bottomLeft = L.latLng([mapObj.south, mapObj.west]);
		topRight   = L.latLng([mapObj.north, mapObj.east]);
		
		/* if pixel distance b/w topRight and bottomLeft falls below a certain threshold, 
		* add a marker(fixed pixel size) in the center, so the user can see where the layer is*/
		var blPixel = this.latLngToContainerPoint(bottomLeft);
		var trPixel = this.latLngToContainerPoint(topRight);

		//Good old Pythagorus...
		var pixelDistance = Math.sqrt(Math.pow((trPixel.x-blPixel.x),2) + Math.pow((trPixel.y-blPixel.y),2));

		var threshold = 10;
		var displayMarker = false;
		
		if (pixelDistance <= threshold){i
			displayMarker = true;
		}

		var visExtent = this.getBounds();

		//LEAFLET HAS ISSUES HANDLING BOUNDING BOXES CROSSING THE DATELINE, HERE CREATE ONE THAT CROSSES DATELINE (e.g. coordinate at more than 180);
		if (bottomLeft.lng > topRight.lng) {
			var visLeft = visExtent.getSouthWest().lng;
			//CONVERT THE GIVEN LAYER COORDINATES TO THE ABSOLUTE MAP COORDINATES (LEAFLET MAY SEE Lng 170 as -190 for a particular area)		
			diff = 180 - bottomLeft.lng;
			calcLng = -180 - diff;
			bottomLeft.lng = calcLng;
			//CALCULATED MIDDLE OF GIVEN LAYER BBOX
			middleX = (topRight.lng + bottomLeft.lng) / 2
			//CHECK WHERE TO SHOW BBOX
			if (visLeft.lng > middleX) {
				bottomLeft.lng = bottomLeft.lng + 2*180;
				topRight.lng = topRight.lng + 2*180;
			}
		}

		var bounds = L.latLngBounds(bottomLeft, topRight);
		
		if (displayMarker){
			center = bounds.getCenter();
			var bBox = L.circleMarker(center, { weight: 4, color: "#103b56", fillOpacity:0.15, className: "bBox" });
			
		} else {
			var bBox = L.rectangle(bounds,{ weight: 4, color: "#103b56", fillOpacity:0.15, className: "bBox" });
			
		}

		var time = 500;
		bBox.on("add", function(event){
				$(".bBox").animate({opacity:1},time);
			});
		bBox.addTo(this.bBoxes);

		// do a comparison with current map extent
		var mapTop = visExtent.getNorthEast().lat;
		if (mapTop > 85.05) {
			mapTop = 85.05;
		}
		var mapBottom = visExtent.getSouthWest().lat;
		if (mapBottom < -85.05) {
			mapBottom = -85.05;
		}
		var mapLeft = visExtent.getSouthWest().lng;
		if (mapLeft < -180) {
			mapLeft = -180;
		}
		var mapRight = visExtent.getNorthEast().lng;
		if (mapRight >= 180) {
			mapRight = 179.9999;
		}

		var layerTop = topRight.lat;
		var layerBottom = bottomLeft.lat;
		var layerLeft = bottomLeft.lng;
		var layerRight = topRight.lng;


		
		var showEWArrows = true;

		if (layerLeft < mapLeft
		   || layerRight > mapRight
		   || layerTop > mapTop
		   || layerBottom < mapBottom) {

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
					//console.log("ne + nw");
					this.showCorners([ "ne", "nw" ]);
				}

				if (layerBottom < mapBottom) {
					//console.log("se + sw");
					this.showCorners([ "se", "sw" ]);
				}

			} else {
				//console.log("corners only");
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
		// TODO: add html5 canvas stuff
		var request = this.createImageRequest();
		this.requestQueue.add(request);
	};
	
	this.createImageRequest = function(){
		var that = this;
		var requestObj = {};
		requestObj.layers = [];

		this.previewLayerGroup.eachLayer( function(layer) {
			if (!layer.getContainer().classList.contains("tiles-loaded")) {
				return;
			};
			if (layer.getContainer().style.display == 'none') {
				return;
			};
			var layerModel = that.previewed.findWhere({
				LayerId : layer.options.id
			});
			if (typeof layerModel == "undefined") {
				throw new Error(
						"Layer ['"
								+ layer.ogpLayerId
								+ "'] could not be found in the PreviewedLayers collection.");
			};
			var sld = layerModel.get("sld");
			var opacity = layerModel.get("opacity");
			if (opacity == 0) {
				return;
			}
			// insert this opacity value into the sld to pass to the wms server
			var layerObj = {};
			var storedName = layerModel.get("qualifiedName");
			if (storedName == '') {
				layerObj.name = layer.options.id;
			} else {
				layerObj.name = storedName;
			}
			layerObj.opacity = opacity;
			layerObj.zIndex = layer.options.zIndex;
			if ((typeof sld != 'undefined') && (sld !== null) && (sld != "")) {
				var sldParams = [ {
					wmsName : layerObj.name,
					layerStyle : sld
				} ];
				layerObj.sld = that.createSLDFromParams(sldParams);
			}
			layerObj.layerId = layerModel.get("LayerId");
			requestObj.layers.push(layerObj);
		});

		if (requestObj.layers.length == 0) { return };

		var extent = this.getBounds();

		requestObj.bbox = extent.toBBoxString();
		requestObj.srs = 'EPSG:4326';
		var offset = this.getMapOffset();

		requestObj.width = this.getSize().x - offset.x;
		requestObj.height = this.getSize().y;

		return new OpenGeoportal.Models.ImageRequest(requestObj);
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
													var attr = layerAttrs.findWhere(
																	{
																		attributeName : attributeName
																	});
													if (typeof attr != "undefined"){
															attr.set(
																	{
																		description : attributeDescription
																	});
													}
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
								// short circuit if attributes have already been looked up
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
		var layers = this.previewLayerGroup.getLayers();
		for (i = 0; i < layers.length; i++ ) {
			if (layers[i].options.identify == true) {
				var layer = layers[i];
				break
			} 
		};

		var layerId = layer.wmsParams.layers;

		if (typeof this !== "undefined") {
			var mapObject = this;
			var layerModel = this.previewed.findWhere({
                                qualifiedName : layerId
                        });

			// generate the query string
			var layerId = layerModel.attributes.LayerId;
			var searchString = "ogpid=" + layerId;

			var mapExtent = mapObject.getBounds();
			searchString += "&bbox=" + mapExtent.toBBoxString();

			var topLeftPoint = this.latLngToContainerPoint(mapExtent.getNorthWest());
			var bottomRightPoint = this.latLngToContainerPoint(mapExtent.getSouthEast());
			var pixelBounds = new L.Bounds(topLeftPoint, bottomRightPoint);

			var pixelX = e.originalEvent.layerX;
			var pixelY = e.originalEvent.layerY;

			searchString += "&x=" + pixelX + "&y="	+ pixelY;
			searchString += "&height=" + pixelBounds.getSize().y + "&width="+ pixelBounds.getSize().x;

			var params = {
					ogpid: layerId,
					bbox: mapExtent.toBBoxString(),
					x: pixelX,
					y: pixelY,
					height: pixelBounds.getSize().y,
					width: pixelBounds.getSize().x
			};

			var dialogTitle = layerModel.get("LayerDisplayName");
			var institution = layerModel.get("Institution");
			var currentAttributeRequests = this.currentAttributeRequests;
			var that = this;
			var ajaxParams = {
				type : "GET",
				url : 'featureInfo',
				data : params,
				dataType : 'html',
				beforeSend : function() {
					if (that.currentAttributeRequests.length > 0) {
						// abort any outstanding requests before submitting a new one
						for ( var i in that.currentAttributeRequests) {
							var request = that.currentAttributeRequests.splice(i, 1)[0];
							request.featureRequest.abort();
						}
					}
				},
				success : function(data, textStatus, xhr) {
					//console.log("AJAX success");
					that.getFeatureAttributesSuccessCallback(layerId,
							dialogTitle, data);
				},
				error : function(jqXHR, textStatus, errorThrown) {
					//console.log("AJAX error");
					if ((jqXHR.status != 401) && (textStatus != 'abort')) {
						throw new Error("Error retrieving Feature Information.");
							
					}
				},
				complete : function(jqXHR) {
					for ( var i in that.currentAttributeRequests) {
						if (that.currentAttributeRequests[i].featureRequest === jqXHR) {
							that.currentAttributeRequests.splice(i, 1);

						}
					}
				}
			};

			this.currentAttributeRequests.push({layerId: layerId, featureRequest: jQuery.ajax(ajaxParams)});

			analytics.track("Layer Attributes Viewed", institution, layerId);
		} else {
			//new OpenGeoportal.ErrorObject(new Error(),"This layer has not been previewed. <br/>You must preview it before getting attribute information.");
		}
	}

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

	this.getFeatureAttributesSuccessCallback = function(layerId, dialogTitle, data) {
		// grab the html table from the response
		var responseTable$ = jQuery(data).filter(function() {
			return jQuery(this).is('table');
		});

		var template = this.template;
		var tableText = "";

		if ((responseTable$.length === 0)
				|| (jQuery(data).find("tr").length === 0)) {
			// what should happen here? returned content is empty or otherwise unexpected
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

		// create a new dialog instance, or just open the dialog if it already exists

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
			// limit the height of the dialog. some layers will have hundreds of attributes
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

				//jQuery(document).trigger({type: "hideLoadIndicator", loadType: "getWmsInfo", layerId: model.get("LayerId")});
			}
		};
		jQuery.ajax(ajaxParams);
		//for now, don't wait for wmsinfo response to start loading the layer; perhaps only call if there is an error
		jQuery("body").trigger(model.get("LayerId") + 'Exists');

		//jQuery(document).trigger({type: "showLoadIndicator", loadType: "getWmsInfo", layerId: model.get("LayerId")});

	};

	this.layerExists = function(layerModel) {
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

	this.setStyle = function(layerId) {
		console.log("SET STYLE FIRED",layerId)
		var layerModel = this.previewed.findWhere({
			LayerId : layerId
		});
		if (typeof layerModel === "undefined") {
			throw new Error(
					"This layer can't be found in the PreviewedLayers collection.");
		}

		var dataType = layerModel.get("DataType").toLowerCase();

		var userSLD = {};
		
		var wmsName = layerModel.get("qualifiedName");
		var userColor = layerModel.get("color");
		var userWidth = layerModel.get("graphicWidth");
		userSLD.layerName = wmsName;
		userSLD.layerType = dataType;
                userSLD.fillColor = userColor;
                userSLD.strokeWidth = userWidth;
	
		if (dataType == "polygon") {
			userSLD.strokeColor = this.getBorderColor(userColor);
			userSLD.strokeWidth -= 1
		} else if (dataType == "point") {
			userSLD.strokeColor = "#000";
		} else if (dataType == "line") {
			userSLD.strokeColor = userColor;	
		} else {
			console.log("Unknown Data Type");
		}
		var newSLD = {
			layers : wmsName,
			sld_body : this.createSLDFromParams(userSLD)
		};
		layerModel.set({
			sld: userSLD
		});
		
		try {
			var layer = this.getLayerByOGPId(this.previewLayerGroup, layerId);
			console.log("layer",layer);
			layer.setParams(newSLD);
                } catch (e) {
			console.log("not yet in previewLayerGroup");
			return newSLD;			
                }
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
		var sldBody  = OpenGeoportal.Utility.createSLD(arrUserParams);
		
		return sldBody;
	};

	/***************************************************************************
	 * map preview functions
	 **************************************************************************/

	this.hideLayer = function(layerId) {
		var layer = this.getLayerByOGPId(this.previewLayerGroup, layerId);
		try {
			var container = layer.getContainer();
		} catch (err) {
			var container  = this.getPane(layerId);
		}
		container.style.display ='none';
	};
	
	this.showLayer = function(layerId) {
		var layer = this.getLayerByOGPId(this.previewLayerGroup, layerId);
		try {
                        var container = layer.getContainer();
                } catch (err) {
		        var container  = this.getPane(layerId);
                }
		container.style.display = '';
	};

	this.addMapBBox = function(mapObj) {
		if (this.previewLayerGroup == null) {
			this.previewLayerGroup = L.layerGroup().addTo(this);
		}

                bottomLeft = L.latLng([mapObj.south, mapObj.west]);
                topRight   = L.latLng([mapObj.north, mapObj.east]);

                var visExtent = this.getBounds();//this.getVisibleExtent();

                //LEAFLET HAS ISSUES HANDLING BOXES CROSSING THE DATELINE, HERE CREATE ONE THAT CROSSES DATELINE (e.g. coordinate at more than 180);
                if (bottomLeft.lng > topRight.lng) {
                        var visLeft = visExtent.getSouthWest().lng;
                        //CONVERT THE GIVEN LAYER COORDINATES TO THE ABSOLUTE MAP COORDINATES (LEAFLET MAY SEE Lng 170 as -190 for a particular area)           
                        diff = 180 - bottomLeft.lng;
                        calcLng = -180 - diff;
                        bottomLeft.lng = calcLng;
                        //CALCULATED MIDDLE OF GIVEN LAYER BBOX
                        middleX = (topRight.lng + bottomLeft.lng) / 2
                        //CHECK WHERE TO SHOW BBOX
                        if (visLeft.lng > middleX) {
                                bottomLeft.lng = bottomLeft.lng + 2*180;
                                topRight.lng = topRight.lng + 2*180;
                        }
                }

                var bounds = L.latLngBounds(bottomLeft, topRight);

                var layerBox = L.rectangle(bounds, {
						weight: 2,
						color: "green",
						fillColor: "green",
						fillOpacity:0.05
			});

                layerBox.addTo(this.previewLayerGroup);
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

		layerName = qualifiedName


		return layerName;
	};
	
	this.getMaxZ = function(){
		var that = this;
		var arrZ = [];
		this.previewLayerGroup.eachLayer(function(layer) {
			var zIndex = layer.options.zIndex;
			if (isNaN(zIndex)) {
				var pane = that.getPane(layer.options.id);
				zIndex = pane.style.zIndex;
				if (zIndex.length == 0) { zIndex = 400 }
			}
			arrZ.push(zIndex);
		})

		return _.max(arrZ);
	},
	
	this.getNextZ = function(){
		var maxZ = this.getMaxZ();
		if (isFinite(maxZ)) { maxZ += 1 } else { maxZ = 100 };
		return maxZ
	},
	
	
	this.addWMSLayer = function(layerModel) {
		if (this.previewLayerGroup == null) {
			this.previewLayerGroup = L.layerGroup().addTo(this);
		}

		var layerId = layerModel.get("LayerId");

		var opacitySetting = layerModel.get("opacity");

		var matchingLayer = this.getLayerByOGPId(this.previewLayerGroup, layerId);
		
		if (matchingLayer == null) {
			var zIndex = this.getNextZ();
			//throw new Error("No matching layer found");
		} else {
			var zIndex = this.getNextZ();
			layerModel.set({zIndex: zIndex});
			this.showLayer(layerId);
			matchingLayer.opacity = opacitySetting * .01;
			return;
		}

		var wmsArray = this.getPreviewUrlArray(layerModel, true);

		var that = this;	
		// we do a check to see if the layer exists before we add it
		jQuery("body").bind(layerModel.get("LayerId") + 'Exists',
				function() {
					var layerName = that.getLayerName(layerModel, wmsArray[0]);
					var newLayer = L.tileLayer.wms(wmsArray[0], {
						layers: layerName,
						format: "image/png",
						version:'1.1.0',
						tiled:false,
						transparent:true,
						attribution:"",
						opacity:opacitySetting*0.01,
						id: layerId,
						zIndex: zIndex,
						identify: false
			                });
					
					newLayer.on('load', function() {
						if (!newLayer.getContainer().classList.contains('tiles-loaded')) {
							newLayer.getContainer().className += ' tiles-loaded';
						}
					});
					
					var defaultColor = layerModel.get("color");
					if (layerModel.isVector() && defaultColor != "#d58080") { //"#aaaaaa") {
						style = that.setStyle(layerId);
						newLayer.setParams(style);
					}
					
					newLayer.addTo(that.previewLayerGroup);

					//For some reason the loading indicator won't fire on initial layer load without this....
					that.fireEvent('dataloading', {layer: newLayer});

					try {
						layerModel.set({zIndex: zIndex});
					} catch (e){
						console.log("failed!");
						console.log(e);
					}
				});
		this.layerExists(layerModel);
	};
	
	this.addArcGISRestLayer = function(layerModel) {
		if (this.previewLayerGroup == undefined) {
                        this.previewLayerGroup = L.layerGroup().addTo(this);
                }

                var layerId = layerModel.get("LayerId");
                		
                var matchingLayer = this.getLayerByOGPId(this.previewLayerGroup, layerId);

                if (matchingLayer == null) {
                        //throw new Error("No matching layer found");
                } else {
                        var zIndex = this.getNextZ();
                        layerModel.set({zIndex: zIndex});
                        this.showLayer(layerId);
                        return;
                }
		this.createPane(layerId);	

		layerUrl = layerModel.get("Location").ArcGISRest + "/";
		layerUrl += layerModel.get("Location").layerId;

		dataType = layerModel.get("DataType");

		if (dataType == "Point" || dataType == "point" ) {
			var newLayer = new L.esri.featureLayer({
				url: layerUrl,
				id: layerId,
				pointToLayer: function (geojson, latlng) {
					return L.circleMarker(latlng, {
						pane: layerId,
						weight: 1,
						radius: 4,
						color: 'black',
					        fillColor: 'red',
						fillOpacity: 0.8,
						className: layerId 
					});
				}
			})
		} else if (dataType == "Line" || dataType == "line" ) {
			var newLayer = new L.esri.featureLayer({
				url: layerUrl,
                                id: layerId,
				pane: layerId,
				className: layerId,
                                style: function (feature) {
					return { color: 'blue', weight: 2 }
				}
			});
		} else if (dataType == "Polygon" || dataType == "polygon" ) {
                        var newLayer = new L.esri.featureLayer({
                                url: layerUrl,
                                id: layerId,
				pane: layerId,
				className: layerId,
				style: function (feature) {
					return { color:'white', weight: 2, fillOpacity: 0.8 }
				}
                        });
		} else {
			alert("Unknown data type. Unable to display layer");
			return;
		}

		$("."+layerId).css('z-index','400');

		var that = this;

		// we do a cursory check to see if the layer exists before we add it
		jQuery("body").bind(layerModel.get("LayerId") + 'Exists', function() {
			that.previewLayerGroup.addLayer(newLayer);
			//For some reason the loading indicator won't fire on initial layer load without this....
			that.fireEvent('dataloading', {layer: newLayer});
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
			previewOffFunction.call(this, layerId);

		} catch (err) {
			//console.log("error in layer off");
			//throw new OpenGeoportal.ErrorObject(err,'Unable to remove Previewed layer "'	+ previewModel.get("LayerDisplayName") + '"');
		}
	};

};
// set inheritance for MapController
OpenGeoportal.MapController.prototype = Object.create(L.Map.prototype);
