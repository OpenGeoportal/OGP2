 if (typeof OpenGeoportal == 'undefined'){
	OpenGeoportal = {};
} else if (typeof OpenGeoportal != "object"){
    throw new Error("OpenGeoportal already exists and is not an object");
}

if (typeof OpenGeoportal.Models == 'undefined'){
	OpenGeoportal.Models = {};
} else if (typeof OpenGeoportal.Models != "object"){
    throw new Error("OpenGeoportal.Models already exists and is not an object");
}
/*OpenGeoportal.LayerSettings
*	object to hold display setting info, where it exists (opacity, etc.)
*/


OpenGeoportal.Models.GenericLayer = OpenGeoportal.Models.ResultItem.extend({
	defaults: {
		preview: "off", 
		resourceName: "",
		previewType: ""
		}
});

OpenGeoportal.Models.VectorLayer = OpenGeoportal.Models.GenericLayer.extend({
	
	defaults: {
		isVector: true,
		preview: "off", 
		resourceName: "",
		previewType: "",
		getFeature: false, 
		opacity: 100, 
		sld: ""
	}
});

OpenGeoportal.Models.PointLayer = OpenGeoportal.Models.VectorLayer.extend({
	defaults: {
		isVector: true,
		preview: "off", 
		resourceName: "",
		previewType: "",
		getFeature: false, 
		opacity: 100, 
		sld: "",
		color: "#ff0000", 
		colorPickerOn: false,
		graphicWidth: 2 
	}
});

OpenGeoportal.Models.LineLayer = OpenGeoportal.Models.VectorLayer.extend({
	defaults: {
		isVector: true,
		preview: "off", 
		resourceName: "",
		previewType: "",
		getFeature: false, 
		opacity: 100, 
		sld: "",
		color: "#0000ff", 
		colorPickerOn: false,
		graphicWidth: 1 
	}
});

OpenGeoportal.Models.PolygonLayer = OpenGeoportal.Models.VectorLayer.extend({
	defaults: {
		isVector: true,
		preview: "off", 
		resourceName: "",
		previewType: "",
		getFeature: false, 
		opacity: 80, 
		sld: "",
		color: "#aaaaaa", 
		colorPickerOn: false,
		graphicWidth: 1 
	}
});

OpenGeoportal.Models.RasterLayer = OpenGeoportal.Models.GenericLayer.extend({
	defaults: {
		isVector: false,
		preview: "off", 
		resourceName: "",
		previewType: "",
		getFeature: false, 
		opacity: 100, 
		sld: ""
	}
});

OpenGeoportal.Models.Attribute = Backbone.Model.extend({});

OpenGeoportal.Attributes = Backbone.Collection.extend({
	model: OpenGeoportal.Models.Attribute
});

OpenGeoportal.PreviewedLayers = Backbone.Collection.extend({
	/*
	 * 			//the collection should handle setting the title
			this.previewed.getFeatureTitle = displayName;
	 */
	initialize: function(){
		this.listenTo(this, "change:preview", this.changePreview);  
		this.listenTo(this, "change:graphicWidth change:color", this.changeLayerStyle);  
		this.listenTo(this, "change:opacity", this.changeLayerOpacity);
		this.listenTo(this, "change:getFeature", this.changeGetFeatureState);

	},
	changeLayerStyle: function( model, val, options){
		var layerId = model.get("LayerId");
		//tell map to change the linewidth/pointsize/borderwidth for this layer
		//this event should be attached to the model, so it only fires once;
		//better yet, have a map view that listens for this change event
		jQuery(document).trigger("map.styleChange", {LayerId: layerId});
	},
	changeLayerOpacity: function(model, val, options){
		var value = model.get("opacity");
		var layerId = model.get("LayerId");
		//tell map to change the opacity for this layer
		jQuery(document).trigger("map.opacityChange", {LayerId: layerId, opacity: value});
	},
	changeGetFeatureState: function(model, val, options){
		var value = model.get("getFeature");
		var layerId = model.get("LayerId");
		//tell map to change the getFeature status for this layer
		var mapEvent = null;
		if (value){
			mapEvent = "map.getFeatureInfoOn";
		} else {
			mapEvent = "map.getFeatureInfoOff";
		}
		jQuery(document).trigger(mapEvent, {LayerId: layerId});
	},
	
	changePreview:function( model, val, options){
		var preview = model.get("preview");
		var layerId = model.get("LayerId");
		if (preview == "on"){
			jQuery(document).trigger("view.previewOn", {LayerId: layerId});//show correct state in table control
			jQuery(document).trigger("previewLayerOn", {LayerId: layerId});//show layer on map
		} else {
			jQuery(document).trigger("view.previewOff", {LayerId: layerId});
			jQuery(document).trigger("previewLayerOff", {LayerId: layerId});
			//also set getFeature state to off.
			if (model.has("getFeature")){
				model.set({getFeature: "off"});
			}
		}
		console.log( model.get("LayerId") + " changed preview to " + preview);
	},
	model: function(attrs, options) {

		//really, this should take into account location field....what url types does the layer have;
		//preview controls are available according to what attributes this model has
		var dataType = attrs.DataType.toLowerCase();
		console.log(dataType);
		switch(dataType){
		case "point":
			return new OpenGeoportal.Models.PointLayer(attrs, options);
			break;
		case "line":
			return new OpenGeoportal.Models.LineLayer(attrs, options);
			break;
		case "polygon":
			return new OpenGeoportal.Models.PolygonLayer(attrs, options);
			break;
		case "raster":
		case "paper map":
			return new OpenGeoportal.Models.RasterLayer(attrs, options);
			break;
		default:
			return new OpenGeoportal.Models.GenericLayer(attrs, options);
		break;
		};

	},
	isPreviewed: function(layerId){
		var currModel = this.get(layerId);
		var stateVal = false;
		if (typeof currModel != "undefined"){
			var previewVal = currModel.get("preview");
			if (previewVal == "on"){
				stateVal = true;
			}
		}
		return stateVal;
	},
	getLayerModel: function(resultModel){
		this.add(resultModel.attributes);
		var layerModel = this.get(resultModel.get("LayerId"));
		return layerModel;
	},
	resetState: function(attributeName){
		this.each(function(currModel){
			var defaultValue = currModel.defaults[attributeName];
			console.log(defaultValue);
			if (typeof defaultValue != "undefined"){
				currModel.set(attributeName, defaultValue);
			}
		});
	}

});
