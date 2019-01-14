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
        var required = ["previewed", "requestQueue", "template", "config", "mapState"];
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
    this.mapState = params.mapState;

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

		// load the basemaps collection, set the default as selected
        var basemaps = OpenGeoportal.Config.BasemapsBootstrap;	1
        this.basemapsCollection = new OpenGeoportal.BasemapCollection(basemaps);

        this.basemapsCollection.listenTo(this.basemapsCollection, "change:selected", function(model){
			self.mapState.set({"basemapId": model.get("basemapId")});
		});

        var selected = [];
        if (this.mapState.has('basemapId')){
        	selected = this.basemapsCollection.where({'basemapId': this.mapState.get("basemapId") });
		}
		if (selected.length === 0) {
            selected = this.basemapsCollection.where({'default': true});
        }
        if (selected.length > 0){
            selected[0].set({"selected": true}, {"silent": true});
        } else {
        	throw new Error('No default basemap set.');
		}

        var zoom = this.getInitialZoomLevel();
        if (this.mapState.has('zoom')){
            zoom = this.mapState.get('zoom');
        } else {
        	this.mapState.set({'zoom': zoom});
		}

        this.createMapHtml(containerDiv, zoom);


		this.wrapper =  new OpenGeoportal.LeafletWrapper();
		var leafletPromise = this.wrapper.init(this.mapDiv, selected[0], this.mapState);

		// console.log("about to register events");
		try {
			this.registerMapEvents();
			// console.log("after events registered");
		} catch (e) {
			console.log("problem registering map events");
			console.log(e);
		}
		
		this.addMapToolbarElements();

		$.when(leafletPromise).then(function(){
			// console.log('mapready resolved');
			mapready.resolve();
			var reverseOrder = [];
            self.previewed.each(function(model){
            	reverseOrder.unshift(model);

			});
            _.each(reverseOrder, function(model){
                if (model.get("preview") === "on"){
                    self.wrapper.previewLayerOn(model);
                    if (model.get("getFeature")){
                        self.previewed.changeGetFeatureState(model);
                    }
                }
			});
		})
    };

    /**
     * Create the internal HTML for the map
     *
     * @param {string}
     *            div - the id for the div the map should be rendered to
     */
    this.createMapHtml = function(div, zoom) {
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

		var initialHeight;
        if (zoom === 1){
            initialHeight = 512;
        } else {
            initialHeight = $("#" + this.containerDiv).parent().height();
        }

        $('#' + this.mapDiv).height(initialHeight).width($("#" + this.containerDiv).parent().width());
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

        $(document).on('map.selectBasemap', function(e, data){
        	self.wrapper.setBasemap(data);
        });

        // the menu itself is implemented as a view of the Basemap collection
        this.basemapMenu = new OpenGeoportal.Views.CollectionSelect({
            collection : this.basemapsCollection,
            el : "div#basemapMenu",
            valueAttribute : "displayName",
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
                self.wrapper.redrawMap();
            }

        });


		this.bboxHandler();
		this.styleChangeHandler();
		this.opacityHandler();
		this.zIndexHandler();
		this.previewLayerHandler();
		this.getFeatureInfoHandler();
		this.clearLayersHandler();
		this.mouseCursorHandler();
        this.zoomToExtentHandler();
        this.updateSearchExtentHandler();
        this.mapInteractionHandler();
	};

    /**
	 * Attaches a handler that updates the search extent on map moveend, once a user interaction event has been triggered
     */
	this.mapInteractionHandler = function(){
		// don't start searching on extent change until ready
        $(document).one("map.userinteraction", function(e){
        	self.wrapper.clearNavBarHistory();
            self.wrapper.mapMoveEnd(self.updateSearchExtent);
        });

		this.wrapper.onUserInteraction(function(){
			$(document).trigger("map.userinteraction");
		});
	};
    /**
	 * set the search extent and broadcast it
     */
	this.updateSearchExtent = function(){
		var searchExtent = self.getSearchExtent();

        $(document).trigger('map.extentChanged', searchExtent);

        self.mapState.set({
			"center": self.wrapper.getCenter(),
			"zoom": self.wrapper.getZoom(),
			"searchExtent": searchExtent
		});

	};


    /**
	 * Gets the search extent from the map.
     * @returns {{mapExtent: {minX, maxX, minY, maxY}, mapCenter: {centerX: *, centerY: *}}}
     */
	this.getSearchExtent = function(){

        var newExtent = this.wrapper.getSearchBounds();
        var c = this.wrapper.getCenter();
        var newCenter = {
            "centerX": c.lng,
            "centerY": c.lat
        };

        return {
            mapExtent : newExtent,
            mapCenter : newCenter
        }
	};

    /**
	 * listens for event that requests a search extent update.
     */
	this.updateSearchExtentHandler = function(){
		$(document).on('map.updateSearchExtent', this.updateSearchExtent);
	};

	/**
	 * Appends HTML to the map tool bar.
	 */
	this.addToMapToolbar = function(markup) {
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
				function(e) {
					e.stopPropagation();
					clickCallback.call(that);
				});
	};

	this.mapLoaded = function() {
		$("#map").fadeTo("slow", 1);
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

        $(document).on("map.sortLayers",	function(event, data) {
            that.wrapper.reorderLayers(data.sortOrder);
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
		$(document).on("map.styleChange", function(event, data) {
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
                    fh.getFeatureAttributes(params);
				});
            });

        $(document).on(
            "map.getFeatureInfoOff",
            function () {
            	// console.log("get feature off");
            	that.wrapper.mapClickOff();
                fh.getFeatureAttributesOff.apply(that, arguments);

            });

        // when the zoomBox control is activated, clear any getFeatureInfo controls in layer previews.
        $(document).on("map.zoomBoxOn", function(){
        	that.previewed.clearGetFeature();
		});

    };

	this.mouseCursorHandler = function() {
		var that = this;
		$(document).on("map.attributeInfoOn",
			function() {
				$("#map").css('cursor', "crosshair");
				// also deactivate regular map controls
				that.wrapper.deactivateZoomBoxControl();
			}
		);
		$(document).on("map.attributeInfoOff",
			function() {
				$("#map").css('cursor','');
			}
		);
	};

	/**
	 * event handler to clear map on map clear button click.
	 */
	this.clearLayersHandler = function() {
		var that = this;

		var mapClear$ = $("#mapClearButton");
		mapClear$.button();
		mapClear$.on("click", function(event) {
			that.clearMap();
		});
	};
	
	/***************************************************************************
	 * map utility functions
	 **************************************************************************/


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


	//Is only needed for MapIt Functions. Not currently being used by UA
	this.getCombinedBounds = function(arrBounds) {

		return this.wrapper.combineBounds(arrBounds);
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

