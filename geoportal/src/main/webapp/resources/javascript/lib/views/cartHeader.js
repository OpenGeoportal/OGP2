	
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

OpenGeoportal.Views.CartHeader = Backbone.View.extend({

	initialize: function(){
		this.template = OpenGeoportal.ogp.template;
		this.widgets = OpenGeoportal.ogp.widgets;
		this.render();
		this.createCartButtons();
	},
	render: function(){
		this.$el.html(this.template.cartHeader());
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

	getCheckedRows: function() {
		var checkedModels = this.collection.where({
			isChecked : true
		});
		
		return checkedModels;
	},
	
	removeRows: function() {

		this.collection.remove(this.getCheckedRows());
	},
	
	addCartHeaderButton: function(buttonId, buttonLabel, helpText,
			listLabel, clickHandler, hoverHandler) {
		var that = this;
		this.widgets.appendButton(this.$el, buttonId,
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

		var applyMarker = function(arrRows){
			that.collection.each(function(model){
				model.set({actionAvailable: "unset"});
			});
			that.collection.each(function(model){
				var isTrue = false;
				_.each(arrRows, function(appModel){
					if (model.get("LayerId") === appModel.get("LayerId")){
						model.set({actionAvailable: "yes"});
						isTrue = true;
					} 
				});
				if (!isTrue){
					model.set({actionAvailable: "no"});
				}
			});
			
		};
		
		var removeHover = function(){
			var arrRows = that.getCheckedRows();
			applyMarker(arrRows);
		};

		var viewClick = function(view){
			//fire cartAction
			var promise = view.cartAction();
			//could pass back messages via notify/progress as well
			//promise.done(function(){console.log("removing view");view.remove();});
		};
		
		var viewHover = function(view){
			var arrRows = view.getApplicableLayers();
			applyMarker(arrRows);

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

	}
});
	