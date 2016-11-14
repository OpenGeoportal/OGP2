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

	subClassEvents : {
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
	
	onClose: function(){
		//console.log("row view destroyed");
		jQuery(document).off("previewLayerOn previewLayerOff cartUpdated", this.$el);

	},
	
	togglePreview : function(e) {
		var layerId = this.model.get("LayerId");
		var model = this.previewed.findWhere({
			LayerId : layerId
		});
		if (typeof model === "undefined") {
			var layerAttr = null;
			try {

				layerAttr = this.model.attributes;
				layerAttr.preview = "on";
				layerAttr.showControls = true;
			} catch (err) {
				console.log(err);
			}
			// add them to the previewed collection. Add them as attributes
			// since we
			// are using different models in the previewed collection, and we
			// want
			// "model" to be called
			var that = this;
			this.$el.css("opacity", ".5");
			var to$ = jQuery(".previewedLayers").find(".tableRow").first();
			if (to$.length === 0){
				to$ = jQuery(".previewedLayers");
			}
			jQuery(e.delegateTarget).effect("transfer", { to: to$, easing: "swing", className: "ui-effects-transfer" }, 400, function(){that.previewed.add(_.clone(layerAttr)); that.$el.css("opacity", "1"); that.model.set({hidden: true}); });

		} else {
			var update = {};
			if (model.get("preview") === "on") {
				update.preview = "off";		
				model.set(update);	

			} else {
				update.preview = "on";
				update.showControls = true;
				var that = this;
				this.$el.css("opacity", ".5");
				var to$ = jQuery(".previewedLayers").find(".tableRow").first();
				if (to$.length === 0){
					to$ = jQuery(".previewedLayers");
				}
				jQuery(e.delegateTarget).effect("transfer", { to: to$, easing: "swing", className: "ui-effects-transfer" }, 400, function(){model.set(update); that.$el.css("opacity", "1"); that.model.set({hidden: true});});
			}
		}
	
	},
	
	toggleExpand : function() {
		// console.log("toggleExpand");
		var controls = this.model.get("showControls");
		this.model.set({
			showControls : !controls
		});
		
		this.expandState.setExpandState(this.model.get("LayerId"), !controls);
	},
	
	/*
	 * functions to display the abstract from the metadata in the expanded row, rather than the preview controls 
	 */
	
	/*
	renderExpand: function(){
		var expand$ = "";
		if (this.model.get("showControls")) {
			var description = "";
			if (this.model.has("layerInfo")){
				description = this.model.get("layerInfo");
			} else {
				this.getLayerInfoFromSolr();
			}
			expand$ = '<div class="layerInfo">' + description + '</div>';
		}
		
		return expand$;
	},
		

	infoColumn: "Abstract",
	
	getLayerInfoFromSolr: function() {
		
		// make an ajax call to retrieve data from solr
		var solr = new OpenGeoportal.Solr();
		var url = solr.getServerName() + "?"
				+ jQuery.param(solr.getArbitraryParams(this.model.get("LayerId"), this.infoColumn));
		var query = solr.sendToSolr(url, this.getInfoSuccess,
				this.getInfoError, this);

	},
	
	getInfoSuccess: function(data){
		var description = data.response.docs[0][this.infoColumn];
		this.model.set({layerInfo: description});
		this.$el.find(".layerInfo").text(description);
	},
	
	getInfoError: function(){
		console.log("error getting info");
	},
	*/
	
	broadcastModel: function(){
		this.$el.closest(".rowContainer").trigger("topmodel", [this.model]);
	},
	
	skipLayer: function(){
		if (this.model.has("hidden") && this.model.get("hidden")){
			return true;
		}
		return false;
	},
	
	toggleSave: function(e){
		//if not in cart, add it.  if in cart, remove it.
		var match = this.cart.findWhere({LayerId: this.model.get("LayerId")});
		if (typeof match === "undefined"){
			var that = this;
			jQuery(e.currentTarget).effect("transfer", { to: ".shoppingCartIcon", easing: "swing", className: "ui-effects-transfer-to-cart inCart" }, 400, function(){that.cart.toggleCartState(that.model);});
		} else {
			this.cart.toggleCartState(this.model);
		}
		
	}
});
