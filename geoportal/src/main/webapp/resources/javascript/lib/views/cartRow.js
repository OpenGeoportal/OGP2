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

/**
 * CartRow handles rendering and logic for rows in the Cart table. Extends LayerRow by handling checkbox behavior and
 * highlighting for available cart actions.
 * @type {any}
 */
OpenGeoportal.Views.CartRow = OpenGeoportal.Views.LayerRow.extend({

    role: 'cartItem',

    subClassEvents : {
        "change .cartCheckBox > input": "syncCheck"
	},

	subClassInit: function(){
        this.checkedView();
		this.listenTo(this.model, "change:isChecked", this.checkedView);
		this.listenTo(this.model, "change:actionAvailable", this.showActionAvailable);
		var that = this;
        $(document).on("previewLayerOn previewLayerOff", this.$el, function () {
            that.updateView.apply(that, arguments);
        });

        $(document).on("updateRow", this.$el, function () {
            that.updateView.apply(that, arguments);
        });

	},

	cleanUp: function(){
		console.log("row view destroyed");
        $(document).off("previewLayerOn previewLayerOff", this.$el);

	},


    syncCheck: function (e) {
        //'silent', so we don't trigger the change:isChecked listener and loop
        this.model.set({isChecked: $(e.target).is(":checked")}, {silent: true});
	},
	
	checkedView: function(){
		var isChecked = this.model.get("isChecked");

        this.$el.find("div.cartCheckBox > input").prop("checked", isChecked);
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
