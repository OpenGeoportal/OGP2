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


OpenGeoportal.Models.Basemap = Backbone.Model.extend({
});

OpenGeoportal.BasemapCollection = Backbone.Collection.extend({
	model: OpenGeoportal.Models.Basemap,
	initialize: function(){
		this.listenTo(this, "change:selected", this.changeSelection);
	},
	

	changeSelection: function(model){
		if (model.get("selected")){
			this.showBasemap(model);
		} else {
			this.hideBasemap(model);
		}
	},

		showBasemap: function(model){
			if (model.has("showOperations")){
				model.get("showOperations").call(this, model);
			}
		},
		
		hideBasemap: function(model){
			if (model.has("hideOperations")){
				model.get("hideOperations").call(this, model);
			}
		}
});
