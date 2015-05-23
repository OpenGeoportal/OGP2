if (typeof OpenGeoportal == 'undefined') {
	OpenGeoportal = {};
} else if (typeof OpenGeoportal != "object") {
	throw new Error("OpenGeoportal already exists and is not an object");
}

if (typeof OpenGeoportal.Views == 'undefined') {
	OpenGeoportal.Views = {};
} else if (typeof OpenGeoportal.Views != "object") {
	throw new Error("OpenGeoportal.Views already exists and is not an object");
}

OpenGeoportal.Views.TableRowSettings = Backbone.View.extend({

	initialize : function() {
		// if the value is equal to the default value, maybe we should just
		// remove the model from the collection
		this.listenTo(this.collection, "add", this.openRow);
		this.listenTo(this.collection, "remove", this.closeRow);
		this.listenTo(this.collection, "syncUI.openRow", this.syncRow);

	},
	closeRow : function(model, val, options) {
		this.$el.trigger("view.closeRow", {
			LayerId : model.get("LayerId")
		});
	},
	openRow : function(model, val, options) {
		this.$el.trigger("view.openRow", {
			LayerId : model.get("LayerId")
		});

	},
	syncRow : function(data) {
		this.$el.trigger("view.openRow", {
			LayerId : data.LayerId
		});
	}

});
