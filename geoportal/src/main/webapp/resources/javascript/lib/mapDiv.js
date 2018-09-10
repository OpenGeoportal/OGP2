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
OpenGeoportal.MapController = function(params) {
    var self = this;

    var validateParams = function (params) {
        var valid = true;
        var required = ["previewed", "requestQueue", "template", "config", "panel"];
        _.each(required, function (prop) {
            valid = valid && _.has(params, prop);
        });

        if (!valid) {
            throw new Error("MapController is missing parameters!");
        }
    };

    // dependencies
    validateParams(params);
    this.previewed = params.previewed;
    this.requestQueue = params.requestQueue;
    this.template = params.template;
    this.config = params.config;
    this.panel = params.panel;


    var mapready = $.Deferred();
    this.ready = mapready.promise();

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
        $(document).on("container.resize", function (e, data) {
        	console.log("called before events registered?");
        	console.log(data);
		});

		this.wrapper =  new OpenGeoportal.LeafletWrapper();
		this.wrapper.init(this.mapDiv, this.getInitialZoomLevel());
		console.log("about to register events");
		try {
			this.registerMapEvents();
			console.log("after events registered");
		} catch (e) {
			console.log("problem registering map events");
			console.log(e);
		}
		
		this.addMapToolbarElements();

        mapready.resolve();

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

        this.mapDiv = div;
        var initialZoom = this.getInitialZoomLevel();

		var initialHeight;
        if (initialZoom === 1){
            initialHeight = 512;
        } else {
            initialHeight = jQuery("#" + this.containerDiv).parent().height();
        }

        jQuery('#' + this.mapDiv).height(initialHeight).width(jQuery("#" + this.containerDiv).parent().width());
    };

	this.getInitialZoomLevel = function() {
		var initialZoom = 2;

		if ($('#' + this.containerDiv).parent().height() > 810) {
			initialZoom = 2;
			// TODO: this should be more sophisticated. width is also important
			// initialZoom = Math.ceil(Math.sqrt(Math.ceil(jQuery('#' +
			// this.containerDiv).parent().height() / 256)));
		}
		return initialZoom;
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
        this.addToMapToolbar(this.template.get('basemapMenu')());

        this.basemaps = OpenGeoportal.Config.BasemapsBootstrap;

        $(document).on('map.selectBasemap', function(e, data){
        	self.wrapper.setBasemap(data);
        });
        var collection = new OpenGeoportal.BasemapCollection(this.basemaps);

        var selected = collection.where({'default': true });
        if (selected.length > 0){
            selected[0].set({"selected": true});
        }
        // the menu itself is implemented as a view of the Basemap collection
        this.basemapMenu = new OpenGeoportal.Views.CollectionSelect({
            collection : collection,
            el : "div#basemapMenu",
            valueAttribute : "displayName",
            displayAttribute : "displayName",
            buttonLabel : "Basemap",
            itemClass : "baseMapMenuItem"
        });

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

        $(document).on("container.resize", function (e, data) {

            //update the size of the map if the container size actually changed.
            var $map = $("#map");

            var newHeight = Math.max(data.ht, data.minHt);
            var oldHeight = $map.height();

            var newWidth = Math.max(data.wd, data.minWd);
            var oldWidth = $map.width();

            if (newHeight !== oldHeight || newWidth !== oldWidth){
                $map.height(newHeight).width(newWidth);
                console.log('map redraw');
                that.wrapper.redrawMap();
            }

        });


		this.wrapper.mapMoveEnd(function() {
			var newExtent = that.wrapper.getSearchBounds();
			var c = that.wrapper.getCenter();
			var newCenter = {
				"centerX": c.lng,
				"centerY": c.lat
			};

			/*
			 * Translate the Leaflet event to a jQuery event used by the
			 * application. This is the event used to trigger a search on map
			 * move. cluster moveend events so that we don't fire too often
			 * 
			 * @fires "map.extentChanged"
			 *
			*/
			if (that.moveEventId !== null) {
                clearTimeout(that.moveEventId);
            }
	
			var trigger = function(){
				/*
				mapExtent: {minX: -180, maxX: 180, minY: -90, maxY: 90},
				mapCenter: {centerX: 0, centerY: 0},
				 */
				$(document).trigger('map.extentChanged', {
					mapExtent : newExtent,
					mapCenter : newCenter
				});
			};

			that.moveEventId = setTimeout(trigger, 500);
			
		});


		var zoomBoxListener = function() {
			that.previewed.clearGetFeature();
		};

		// TODO: look at this. if needed, refactor.
		$('leaflet-zoom-box-control').click(zoomBoxListener);


		this.bboxHandler();
		this.styleChangeHandler();
		this.opacityHandler();
		this.zIndexHandler();
		this.previewLayerHandler();
		this.getFeatureInfoHandler();
		this.clearLayersHandler();
		this.mouseCursorHandler();
        this.zoomToExtentHandler();
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
		$("." + displayParams.displayClass).button().on("click",
				function() {
					clickCallback.call(that);
				});
	};

	this.mapLoaded = function() {
		jQuery("#map").fadeTo("slow", 1);
	};


	/***************************************************************************
	 * map event handlers
	 **************************************************************************/
    /**
	 * listen for zoom to layer extent event, and have the map zoom to the passed extent.
     */
	this.zoomToExtentHandler = function (){
		var that = this;
        $(document).on("map.zoomToLayerExtent", function(event, data) {
            var bbox = data.bbox;
            that.wrapper.zoomToExtent(bbox);
        });
	};

	this.getLayerModelByOGPId = function(layerId){
        var previewModel = this.previewed.findWhere({
            LayerId : layerId
        });

        if (typeof previewModel === "undefined"){
        	throw new Error("Layer not in previewed collection!");
		}

        return previewModel;
	};


	this.opacityHandler = function() {
		var that = this;
		$(document).on("map.opacityChange", function(event, data) {
			that.wrapper.setOpacity(data.LayerId, data.opacity);
		});
	};
	
	this.zIndexHandler = function() {
		var that = this;
		$(document).on("map.zIndexChange",	function(event, data) {
			that.wrapper.setZ(data.LayerId, data.zIndex);
		});	
	};

	this.previewLayerHandler = function() {
		var that = this;
		$(document).on("previewLayerOn", function(event, data) {
			console.log(that.getLayerModelByOGPId(data.LayerId));
            that.wrapper.previewLayerOn(that.getLayerModelByOGPId(data.LayerId));
		});

		$(document).on("previewLayerOff", function(event, data) {
			that.wrapper.previewLayerOff(that.getLayerModelByOGPId(data.LayerId));
		});
	};



	this.styleChangeHandler = function() {
		var that = this;
		jQuery(document).on("map.styleChange", function(event, data) {
			that.wrapper.setStyle(that.getLayerModelByOGPId(data.LayerId));
		});
	};

    this.bboxHandler = function() {
        var that = this;
        $(document).on("map.showBBox", function (event, bbox) {
            that.wrapper.showLayerBBox(bbox);
        });

        $(document).on("map.hideBBox", function (event, bbox) {
            that.wrapper.hideLayerBBox(bbox);
        });
    };

    this.getFeatureInfoHandler = function() {
    	var fh = null;
        var that = this;

        var onclick;
        $(document).on(
            "map.getFeatureInfoOn",
            function (e, data) {
            	console.log('getfeatureinfoon handler');
            	// layerId to get feature info for
            	var layerId = data.LayerId;
            	// retrieve the layer model with that id
            	var model = that.getLayerModelByOGPId(layerId);
            	// create a new FeatureAttributeHandler with that model
                fh = new OpenGeoportal.FeatureAttributeHandler(model);

                console.log(fh);

                // register a click handler on the map to get the parameters for a feature attribute request
                onclick = that.wrapper.mapClick(function(ev){
                	console.log('feature info map click');
                    var params = that.wrapper.getLocationParamsFromClickEvent(ev);

/*                    bbox
                        :
                        "-87.20947265625001,28.01380137638074,-67.10449218750001,50.93073802371819"
                    coord
                        :
                        "43.389081939117496,-74.39941406250001"
                    ogpid
                        :
                        "Tufts.NYProtectedAreas0511"
                    pixel
                        :
                        "1607,506"
                    size
                        :
                        "915,1373"
                    srs
                        :
                        "EPSG:4326"*/
                    fh.getFeatureAttributes(params);
				});
            });

        $(document).on(
            "map.getFeatureInfoOff",
            function () {
            	console.log("get feature off");
            	that.wrapper.mapClickOff();
                fh.getFeatureAttributesOff.apply(that, arguments)
            });

    };

	this.mouseCursorHandler = function() {
		var that = this;
		jQuery(document).on("map.attributeInfoOn",
			function() {
				jQuery("#map").css('cursor', "crosshair");
				// also deactivate regular map controls
				that.wrapper.deactivateZoomBoxControl();
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
		var mapClear$ = $("#mapClearButton");
		mapClear$.button();
		mapClear$.on("click", function(event) {
			that.clearMap();
		});
	};
	
	/***************************************************************************
	 * map utility functions
	 **************************************************************************/

/*	this.hasMultipleWorlds = function() {
		var exp = this.getZoom() + 8;
		var globalWidth = Math.pow(2, exp);

		var viewPortWidth = this.getSize().w - this.getMapOffset().x;

		if (viewPortWidth > globalWidth) {
			return true;
		} else {
			return false;
		}
	};*/

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

/*	this.adjustExtent = function() {
		var offset = this.getMapOffset();
		var fullMapHeight = jQuery('#' + this.mapDiv).height();
		var fullMapWidth = jQuery('#' + this.mapDiv).width();
		var adjust = {};
		adjust.x = (fullMapWidth - offset.x) / fullMapWidth;
		adjust.y = (fullMapHeight - offset.y) / fullMapHeight;
		return adjust;
	};*/

	//Is only needed for MapIt Functions. Not currently being used by UA
	this.getCombinedBounds = function(arrBounds) {

		return this.wrapper.combineBounds(arrBounds);
	};

/*	//Is only needed for MapIt Functions. Not currently being used by UA
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
	};*/

/*	this.getBboxFromCoords = function(minx, miny, maxx, maxy) {
		var bbox = [];
		bbox.push(minx);
		bbox.push(miny);
		bbox.push(maxx);
		bbox.push(maxy);
		bbox = bbox.join(",");
		return bbox;
	};*/


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
        var requestObj = this.wrapper.generateImageRequestParams(this.previewed);
        console.log(requestObj);
        console.log(new OpenGeoportal.Models.ImageRequest(requestObj));
		this.requestQueue.add(new OpenGeoportal.Models.ImageRequest(requestObj));
	};


	/***************************************************************************
	 * map preview functions
	 **************************************************************************/


	
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

		layerName = qualifiedName;


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
				if (zIndex.length === 0) { zIndex = 400 }
			}
			arrZ.push(zIndex);
		});

		return _.max(arrZ);
	};
	
	this.getNextZ = function(){
		var maxZ = this.getMaxZ();
		if (isFinite(maxZ)) { maxZ += 1 } else { maxZ = 100 }
		return maxZ
	};


};

