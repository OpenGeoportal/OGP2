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

OpenGeoportal.Views.CartRow = OpenGeoportal.Views.LayerRow.extend({

	subClassEvents : {
		"click .cartCheckBox" : "toggleCheck"
	},

	subClassInit: function(){
		this.listenTo(this.model, "change:isChecked", this.checkedView);
		this.listenTo(this.model, "change:actionAvailable", this.showActionAvailable);
		var that = this;
		jQuery(document).on("previewLayerOn previewLayerOff", this.$el, function(){that.updateView.apply(that, arguments);});

	},

	cleanUp: function(){
		console.log("row view destroyed");
		jQuery(document).off("previewLayerOn previewLayerOff", this.$el);

	},
	
	toggleCheck: function(){
		this.model.set({isChecked : !this.model.get("isChecked")});
	},
	
	checkedView: function(){
		var isChecked = this.model.get("isChecked");

		this.$el.find("input.cartCheckBox").prop("checked", isChecked);		
	},

	
	showActionAvailable: function(){

		this.$el.removeClass("cartAction cartSelected");

		if (this.model.has("actionAvailable")){
			if (this.model.get("actionAvailable") === "yes"){
				this.$el.addClass("cartAction cartSelected");
			} else if (this.model.get("actionAvailable") === "no"){
				this.$el.addClass("cartAction");
			}
		}
	}
});
