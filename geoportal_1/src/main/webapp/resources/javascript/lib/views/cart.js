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
 * A Backbone View of the Cart Collection
 * 
 * @constructor
 */

OpenGeoportal.Views.Cart = Backbone.View.extend({
	assign : function(view, selector) {
		view.setElement(this.$(selector)).render();
	},
	initialize : function() {

		this.listenTo(this.collection, "add", this.addedToCart);
		this.listenTo(this.collection, "remove", this.removedFromCart);

		this.initRender();
		// console.log("finished initializing cart view");
	},
	addedToCart : function(model) {
		var layerId = model.get("LayerId");
		model.set({
			isChecked : true
		});
		// update search results table
		jQuery(document).trigger("view.showInCart", {
			layerId : layerId
		});
		// add data to cart table
		var data = this.processTableRow(model);
		// console.log(data);
		var savedTable = this.cartTableObj.getTableObj();
		var currentData = savedTable.fnGetData();
		currentData.unshift(data);
		savedTable.fnClearTable();
		savedTable.fnAddData(currentData);
		this.updateSavedLayersNumber();
	},
	removedFromCart : function(model) {
		var layerId = model.get("LayerId");
		// update search results table
		jQuery(document).trigger("view.showNotInCart", {
			layerId : layerId
		});
		// remove data from cart table
		var savedTable = this.cartTableObj.getTableObj();
		var currentData = savedTable.fnGetData();
		var i = null;
		for (i in currentData) {

			if (currentData[i].LayerId == layerId) {
				savedTable.fnDeleteRow(i);
			}
		}
		this.updateSavedLayersNumber();
	},
	updateSavedLayersNumber : function() {
		var number$ = jQuery('.savedLayersNumber');

		number$.text('(' + this.collection.length + ')');

		OpenGeoportal.Utility.elementFlash(number$.parent());

	},
	processTableRow : function(model) {
		var tableHeadings = this.cartTableObj.tableHeadingsObj;
		var rowObj = {};
		tableHeadings.each(function(currentModel) {
			var headingName = currentModel.get("columnName");
			if (currentModel.get("solr")) {
				// if the tableheading can't be found in the solr object put in
				// an empty string as a placeholder
				if (typeof model.attributes[headingName] === 'undefined') {
					rowObj[headingName] = "";
				} else {
					if (model.attributes[headingName].constructor !== Array) {
						rowObj[headingName] = model.attributes[headingName];
					} else {
						rowObj[headingName] = model.attributes[headingName]
								.join();// in case the value is an array
					}
				}
			} else {
				// columns w/ ajax == false are placeholders and are populated
				// by javascript
				rowObj[headingName] = "";
			}
		});

		return rowObj;
	},
	initRender : function() {
		this.cartTableObj = new OpenGeoportal.CartTable();
		this.cartTableObj.backingData = this.collection;
		this.cartTableObj.initTable("cart");
		return this;
	}
});
