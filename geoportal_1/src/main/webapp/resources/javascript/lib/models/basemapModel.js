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

/**
 * Basemap model
 */
OpenGeoportal.Models.Basemap = Backbone.Model.extend({
	initialize : function() {
		this.listenTo(this, "change:selected", this.changeSelection);
	},

	changeSelection : function() {
		if (this.get("selected")) {
			this.showBasemap();
		} else {
			this.hideBasemap();
		}
	},
	
	showBasemap : function() {
		if (this.has("showOperations")) {
			this.get("showOperations").call(this);
		}
	},

	hideBasemap : function() {
		if (this.has("hideOperations")) {
			this.get("hideOperations").call(this);
		}
	},

	checkPrimaryZoomMap: function(mapZoom){

		if (this.has("isSecondaryTo")){
			var primary = this.collection.findWhere({
				name : this.get("isSecondaryTo")
			});
			
			if (mapZoom <= primary.get("zoomLevels") ){
				this.set({selected: false});
				this.unset("isSecondaryTo");
				primary.set({selected: true});
				return true;
			}
			

		}
		
		return false;
		
	},
	

	checkSecondaryZoomMap: function(mapZoom){
		if (mapZoom >= this.get("zoomLevels") + 1 ){
			if (this.has("secondaryZoomMap")){
				this.set({selected: false});
			
				var secondary = this.collection.findWhere({
					name : this.get("secondaryZoomMap")
				}).set({selected: true, isSecondaryTo: this.get("name")});
				return true;
			}
		}
		return false;
	}
		
	
});

/**
 * collection of Basemap models
 */
OpenGeoportal.BasemapCollection = Backbone.Collection.extend({
	model : OpenGeoportal.Models.Basemap,
	

	checkZoom: function(mapZoom){
		var selected = this.findWhere({
			selected : true
		});
		
		var changed = selected.checkPrimaryZoomMap(mapZoom);
		if (!changed){
			changed = selected.checkSecondaryZoomMap(mapZoom);
		}
		return changed;
	}



});
