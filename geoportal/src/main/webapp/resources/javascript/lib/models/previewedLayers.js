if (typeof OpenGeoportal === 'undefined') {
	OpenGeoportal = {};
} else if (typeof OpenGeoportal !== "object") {
	throw new Error("OpenGeoportal already exists and is not an object");
}

if (typeof OpenGeoportal.Models === 'undefined') {
	OpenGeoportal.Models = {};
} else if (typeof OpenGeoportal.Models !== "object") {
	throw new Error("OpenGeoportal.Models already exists and is not an object");
}
/*
 * OpenGeoportal.LayerSettings object to hold display setting info, where it
 * exists (opacity, etc.)
 */

/*
 * 
 * 
 * Attributes: - resourceName: this is the layer name value needed to preview
 * the layer. Unfortunately, this may be different from the solr "Name" value,
 * which should be the layer name used to access ogc web services (ex: Harvard's
 * name value to access their tilecache does not include the database prefixes,
 * while ogc layer names (GeoServer) do.)
 * 
 * 
 */

OpenGeoportal.Models.PreviewLayer = OpenGeoportal.Models.ProtocolAware.extend({
	// preview controls are available according to what attributes this
	// model has
	// previewType determines what function is used to preview the layer
	defaults : {
		preview : "off",
		resourceName : "",
		previewType : "",
		showControls : false
	// panel is hidden by default
	},

	// preview types:
	// wms, arcgis, tilecache w/wms, tilecache w/out wms (essentially wmts,
	// right?), imageCollection,
	// browseGraphic, previewUrl
	supportedAttributesByType : [ {
		type : "wms",
		discriminator : "DataType",
		attributes : {
			raster : {
				getFeature : false,
				opacity : 100,
				sld : ""
			},

			"paper map" : {
				opacity : 100
			},
			// it's understood that point, line, polygon, are vector types
			point : {
				getFeature : false,
				opacity : 100,
				colorPickerOn : false,
				sld : "",
				color : "#ff0000",
				graphicWidth : 2
			},
			line : {
				getFeature : false,
				opacity : 100,
				colorPickerOn : false,
				sld : "",
				color : "#0000ff",
				graphicWidth : 1
			},
			polygon : {
				getFeature : false,
				opacity : 100,
				colorPickerOn : false,
				sld : "",
				opacity : 80,
				color : "#aaaaaa",
				graphicWidth : 1
			},
			"undefined" : {
				getFeature : false,
				opacity : 100,
				colorPickerOn : false,
				sld : "",
				color : "#aaaaaa",
				graphicWidth : 1
			}
		}
	}, {
		type : "tilecache",
		attributes : {
			opacity : 100
		}
	}, {
		type : "arcgisrest",
		attributes : {
			opacity : 100
		}
	} ],

	setPreviewType : function() {
		if (!this.has("Location")){
			return "noPreview";
		}
		var locationObj = this.get("Location");
		
		if (_.isEmpty(locationObj)){
			return "noPreview";
		}
		var previewType = "default";

		if (OpenGeoportal.Utility.hasLocationValueIgnoreCase(locationObj,
				[ "wms" ])) {
			previewType = "wms";
		} else if (OpenGeoportal.Utility.hasLocationValueIgnoreCase(
				locationObj, [ "arcgisrest" ])) {
			previewType = "arcgisrest";
		} else if (OpenGeoportal.Utility.hasLocationValueIgnoreCase(
				locationObj, [ "tilecache" ])) {
			// if we're here, the location field has a tilecache value, but no
			// wms value or arcgisrest value
			previewType = "tilecache";
		} else if (OpenGeoportal.Utility.hasLocationValueIgnoreCase(
				locationObj, [ "imagecollection" ])) {
			// {"imageCollection": {"path": "furtwangler/17076013_03_028a.tif",
			// "url": "http://gis.lib.berkeley.edu:8080/geoserver/wms",
			// "collectionurl":
			// "http://www.lib.berkeley.edu/EART/mapviewer/collections/histoposf"}}
			previewType = "imagecollection";
		} else if (OpenGeoportal.Utility.hasLocationValueIgnoreCase(
				locationObj, [ "arcgisrest" ])) {
			previewType = "arcgisrest";
		} else if (OpenGeoportal.Utility.hasLocationValueIgnoreCase(
				locationObj, [ "externalLink" ])) {
			previewType = "externalLink";
		}


		this.set({
			previewType : previewType
		});

		return previewType;
	},

	assignAttributes : function() {
		// do some categorization
		var previewType = this.setPreviewType();
		var attr = this.getAttributesByType(previewType);
		this.set(attr);
	}
});

OpenGeoportal.Models.Attribute = Backbone.Model.extend({});

OpenGeoportal.Attributes = Backbone.Collection.extend({
	model : OpenGeoportal.Models.Attribute
});


OpenGeoportal.PreviewedLayers = Backbone.Collection.extend({
	model : OpenGeoportal.Models.PreviewLayer,
	initialize : function() {
		this.listenTo(this, "change:preview add", this.changePreview);
		this.listenTo(this, "change:graphicWidth change:color",
				this.changeLayerStyle);
		this.listenTo(this, "change:opacity", this.changeLayerOpacity);
		this.listenTo(this, "change:zIndex", this.changeZIndex);
		this.listenTo(this, "change:getFeature", this.changeGetFeatureState);

	},
	
	comparator: function(model1, model2){
		var getComparison = function(model){
			var comp = 0;
			if (model.has("zIndex")){
				comp = model.get("zIndex");
			}
			return comp;
		};
		
		var val1 = getComparison(model1);
		var val2 = getComparison(model2);
		if (val1 > val2){
			return -1;
		} else if (val2 > val1){
			return 1;
		} else {
			return 0;
		}	
	},
	
	changeLayerStyle : function(model, val, options) {
		var layerId = model.get("LayerId");
		// tell map to change the linewidth/pointsize/borderwidth for this layer
		// this event should be attached to the model, so it only fires once;
		// better yet, have a map view that listens for this change event
		jQuery(document).trigger("map.styleChange", {
			LayerId : layerId
		});
	},
	
	changeLayerOpacity : function(model, val, options) {
		var value = model.get("opacity");
		var layerId = model.get("LayerId");
		// tell map to change the opacity for this layer
		jQuery(document).trigger("map.opacityChange", {
			LayerId : layerId,
			opacity : value
		});
	},
	
	changeZIndex : function(model, val, options) {
		this.sort();

		var value = model.get("zIndex");
		var layerId = model.get("LayerId");
		// tell map to change the zIndex for this layer
		jQuery(document).trigger("map.zIndexChange", {
			LayerId : layerId,
			zIndex : value
		});
	},
	
	changeGetFeatureState : function(model, val, options) {
		var value = model.get("getFeature");
		var layerId = model.get("LayerId");
		// tell map to change the getFeature status for this layer
		var mapEvent = null;
		if (value) {
			mapEvent = "map.getFeatureInfoOn";
			this.clearGetFeature(model); // passing a model to
			// clearGetFeature clears all other
			// gf
		} else {
			mapEvent = "map.getFeatureInfoOff";
		}
		jQuery(document).trigger(mapEvent, {
			LayerId : layerId
		});
		
		this.checkGetFeatureState();
	},
	
	/**
	 * check to see if getFeature is turned on for any layers and fire
	 * appropriate event
	 */
	checkGetFeatureState : function(){
		var gfEvent = "map.attributeInfoOff";
		this.each(function(model){
			if (model.get("getFeature")){
				gfEvent = "map.attributeInfoOn";
				return;
			}
		});

		jQuery(document).trigger(gfEvent);


	},


	changePreview : function(model, val, options) {
		// console.log(arguments);
		var preview = model.get("preview");
		var layerId = model.get("LayerId");
		if (preview === "on") {
			jQuery(document).trigger("previewLayerOn", {
				LayerId : layerId
			});// show layer on map
		} else {

			jQuery(document).trigger("previewLayerOff", {
				LayerId : layerId
			});
			// also set getFeature state to off.
			if (model.has("getFeature")) {
				model.set({
					getFeature : false
				});
			}
		}
		// console.log(model.get("LayerId") + " changed preview to " + preview);
	},

	isPreviewed : function(layerId) {
		var currModel = this.findWhere({
			LayerId : layerId
		});
		var stateVal = false;
		if (typeof currModel !== "undefined") {
			var previewVal = currModel.get("preview");
			if (previewVal === "on") {
				stateVal = true;
			}
		}
		return stateVal;
	},

	getLayerModel : function(resultModel) {
		var layerId = resultModel.get("LayerId");
		var arrModel = this.where({LayerId: layerId});
		var layerModel;
		if (arrModel.length > 1){
			throw new Error("There are " + arrModel.length + " layers in the previewed layers collection.  This should never happen.");
		}
		if (arrModel.length > 0){
			layerModel = arrModel[0];
		} else {
			this.add(resultModel.attributes);
			layerModel = this.findWhere({
				LayerId : layerId
			});
		}
		return layerModel;
	},

	clearGetFeature : function(turnOnModel) {
		// console.log("clearGetFeature");
		var layerId = "dummy";
		if (typeof turnOnModel !== "undefined") {
			layerId = turnOnModel.get("LayerId");
		}
		this.each(function(model) {
			if (model.get("LayerId") === layerId) {
				return;
			}
			if (model.get("getFeature")) {
				model.set({
					getFeature : false
				});
			}
		});
	}

});
