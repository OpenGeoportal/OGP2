if (typeof OpenGeoportal === 'undefined') {
	OpenGeoportal = {};
} else if (typeof OpenGeoportal !== "object") {
	throw new Error("OpenGeoportal already exists and is not an object");
}

if (typeof OpenGeoportal.Views === 'undefined') {
	OpenGeoportal.Views = {};
} else if (typeof OpenGeoportal.Views !== "object") {
	throw new Error("OpenGeoportal.Views already exists and is not an object");
}

OpenGeoportal.Views.SearchResultsRow = OpenGeoportal.Views.LayerRow.extend({

	events : {
		"click .viewMetadataControl" : "viewMetadata",
		"click .previewControl" : "togglePreview",
		"click .colExpand" : "toggleExpand",
		"click .colTitle" : "toggleExpand",
		"mouseover" : "doMouseoverOn",
		"mouseout" : "doMouseoverOff",
		"click .saveControl" : "toggleSave",
		"istop" : "broadcastModel"
	},

	subClassInit: function(){
		//since the results collection is by nature transient, we have to store some state externally
		//listen for saved items (in cart collection)
		this.cart = OpenGeoportal.ogp.appState.get("cart");
		
		this.expandState = OpenGeoportal.ogp.appState.get("layerState");
		var layerState = this.expandState.findWhere({LayerId: this.model.get("LayerId")});
		if (typeof layerState !== "undefined"){
			this.model.set({showControls: layerState.get("expanded")});
		}

		var that = this;
		jQuery(document).on("previewLayerOn previewLayerOff cartUpdated", this.$el, function(){that.updateView.apply(that, arguments);});
	},
	
	cleanUp: function(){
		console.log("row view destroyed");
		jQuery(document).off("previewLayerOn previewLayerOff", this.$el);

	},
	
	
	toggleExpand : function() {
		// console.log("toggleExpand");
		var controls = this.model.get("showControls");
		this.model.set({
			showControls : !controls
		});
		
		this.expandState.setExpandState(this.model.get("LayerId"), !controls);
	},

	broadcastModel: function(){
		this.$el.closest(".rowContainer").trigger("topmodel", [this.model]);
	},
	
	toggleSave: function(){
		//if not in cart, add it.  if in cart, remove it.
		this.cart.toggleCartState(this.model);
	}
});
