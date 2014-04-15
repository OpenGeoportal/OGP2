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
		this.controls = OpenGeoportal.ogp.controls;
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
	
	displayOptionText: function(event, optionText, listLabel) {
		var button$ = jQuery(event.target);

		if (!button$.hasClass(".button")) {
			button$ = button$.closest(".button");
		}

		var optionContainer$ = jQuery("#optionDetails");
		optionContainer$.html('<div>' + optionText + '</div>');

		if (optionContainer$.css("display") === "none") {
			optionContainer$.show();
			jQuery(".arrow_buttons").hide();
		}
		button$.parent().find(".button").removeClass("detailsBottom");
		button$.addClass("detailsBottom");

	},


	
	addCartHeaderButton: function(buttonId, buttonLabel, helpText,
			listLabel, clickHandler, hoverHandler) {
		var that = this;
		this.controls.appendButton(jQuery("#cartHeader"), buttonId,
				buttonLabel, clickHandler).on("mouseover", function(event) {
			that.displayOptionText(event, helpText, listLabel);
			hoverHandler.call(that);
		});
		
		
	},
	


		
	createCartButtons: function() {

		var that = this;
		var mapItHtml = "Open highlighted layers in GeoCommons to create maps.";
		var shareHtml = "Create a link to share this Cart.";
		var webServiceHtml = "Stream highlighted layers into an application.";
		var downloadHtml = "Download highlighted layers to your computer.";
		var removeHtml = "Remove selected layers from Cart.";

		var removeClick = function() {
			that.removeRows();
		};

		var removeHover = function(){
			var arrRows = that.getCheckedRows();
			jQuery(document).trigger({type: "highlightCartRows", layers: arrRows});
		};

		var viewClick = function(view){
			//fire cartAction
			var promise = view.cartAction();
			//could pass back messages via notify/progress as well
			//promise.done(function(){console.log("removing view");view.remove();});
		};
		
		var viewHover = function(view){
			var arrRows = view.getApplicableLayers();
			jQuery(document).trigger({type: "highlightCartRows", layers: arrRows});
			view.remove();
		};
		
		var downloadClick = function() {
			//create a view instance
			var view = new OpenGeoportal.Views.Download({collection: that.collection});
			viewClick(view);
		};
		var downloadHover = function(){
			var view = new OpenGeoportal.Views.Download({collection: that.collection});
			viewHover(view);
		};
		
		var webServicesClick = function() {
			//create a view instance
			var view = new OpenGeoportal.Views.WebServices({collection: that.collection});
			viewClick(view);

		};
		var webServicesHover = function(){
			var view = new OpenGeoportal.Views.WebServices({collection: that.collection});
			viewHover(view);

		};
		
		var shareCartClick = function() {
			//create a view instance
			var view = new OpenGeoportal.Views.ShareCart({collection: that.collection});
			viewClick(view);

		};
		var shareCartHover = function(){
			var view = new OpenGeoportal.Views.ShareCart({collection: that.collection});
			viewHover(view);
		};
		
		var mapItClick = function(model) {
			//create a view instance
			var view = new OpenGeoportal.Views.MapIt({collection: that.collection});
			viewClick(view);

		};
		var mapItHover = function(){
			var view = new OpenGeoportal.Views.MapIt({collection: that.collection});
			viewHover(view);

		};
		
		this.addCartHeaderButton("removeFromCartButton", "Remove", removeHtml,
				"removeFromCart", removeClick, removeHover);
		this.addCartHeaderButton("downloadButton", "Download", downloadHtml,
				"download", downloadClick, downloadHover);
		this.addCartHeaderButton("webServiceButton", "Web Service",
				webServiceHtml, "webService", webServicesClick,
				webServicesHover);
		this.addCartHeaderButton("shareButton", "Share", shareHtml,
				"shareLink", shareCartClick, shareCartHover);
		this.addCartHeaderButton("mapItButton", "MapIt", mapItHtml, "mapIt",
				mapItClick, mapItHover);

		// Hover handler
		var hideDetails = function() {
			jQuery(".arrow_buttons").show();
			jQuery("#optionDetails").hide();
			jQuery(".button").removeClass("detailsBottom");
			jQuery(".cartSelected, .cartAction").removeClass(
					"cartSelected cartAction");
		};
		// hide on the header, rather than the buttons, so the ui doesn't flash
		jQuery("#cartHeader.tableHeader").on("mouseleave", hideDetails);
		// hide here, or it's annoying to get to tabs
		jQuery("#optionDetails").on("mouseenter", hideDetails);

	},
	
	getCheckedRows: function() {
		var checkedModels = this.collection.where({
			isChecked : true
		});
		
		return checkedModels;
	},
	
	removeRows: function() {

		this.collection.remove(this.getCheckedRows());
	},
	
	initRender : function() {
		this.cartTableObj = new OpenGeoportal.CartTable();
		this.cartTableObj.backingData = this.collection;
		this.cartTableObj.initTable("cart");
		this.createCartButtons();
		return this;
	}
});
