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

OpenGeoportal.Views.LoadIndicatorView = Backbone.View.extend({
	constructor: function (options) {
		//allow options to be passed in the constructor argument as in previous Backbone versions.
		    this.options = options;
		    Backbone.View.apply(this, arguments);
	},
		  
	initialize: function(){
		this.listenTo(this.collection, "add", this.showSpinner);
		this.listenTo(this.collection, "remove", this.hideSpinner);
	},
		
	showSpinner : function(){
		//is loader element visible? is spinner spinning?

		if (jQuery("#" + this.id).length === 0){
			this.render();
		}

		this.startSpinner();
		this.refreshText();

		if (!this.$el.is(":visible")){
			//if you try to fadeIn/fadeOut, you can end up with a race condition
				this.$el.show();
		}

	},
	
	refreshText: function(text){
		if (this.$el.find(".loadInfo").length > 0){
			var tickerText;
			if (typeof text !== "undefined"){
				tickerText = text;
			} else {
				tickerText = this.getDefaultText();
			}
			
			this.$el.find(".loadInfo").html(tickerText);
		}
	},
	
	getDefaultText: function(){
		//nop
		return "";
	},
	
	hideSpinner : function(){

		//is loader element visible? is spinner spinning?		
		//only hide the spinner if the collection is empty
		if (this.collection.length === 0 ){
			if (this.$el.is(":visible")){
				this.$el.hide();
				this.stopSpinner();				 
			}	
		}

	},	

	startSpinner : function(){
		var loadIndicator = $(".leaflet-control-loading");
		
		loadIndicator.addClass("is-loading");
	},
	
	stopSpinner : function(){
		var loadIndicator = $(".leaflet-control-loading");

		loadIndicator.removeClass("is-loading");
	}
});

OpenGeoportal.Views.MapLoadIndicatorView = OpenGeoportal.Views.LoadIndicatorView.extend({
	id: "mapLoadIndicator",
	
	render : function(){
		var html = this.options.template.loadIndicator();
		this.$el.html(html).appendTo(".olControlPanel");		
		return this;
	},
	
	spinnerParams : {
		radius: 5,
		height : 5,
		width : 5,
		dashes : 8,
		color : '#4E4E4F'
	}
});

OpenGeoportal.Views.RequestQueueLoadIndicatorView = OpenGeoportal.Views.LoadIndicatorView.extend({
	id: "requestTickerContainer",
	
	initialize: function(){
		this.listenTo(this.collection, "add", this.showSpinner);
		this.listenTo(this.collection, "change:status", this.hideSpinner);
	},
	
	render : function(){
		var html = this.options.template.requestIndicator();
		this.$el.html(html).appendTo("body");
		return this;
	},
	
	spinnerParams : {
		radius: 5,
		height : 5,
		width : 5,
		dashes : 8,
		color : "#000000"
	},
	
	hideSpinner : function(){
		//is loader element visible? is spinner spinning?

		//only hide the spinner if the collection is empty
		if (this.collection.where({status: "PROCESSING"}).length !== 0){
			this.refreshText();
			return;
			
		}
		
		
		if (this.collection.length === 0 || this.collection.where({status: "PROCESSING"}).length === 0){
			if (this.$el.is(":visible")){
				this.$el.fadeOut(400, this.stopSpinner);
			}	
		}

	},
	
	getDefaultText: function(){
		var tickerText = "Sending Request...";
		var processing = this.collection.getLayerCount();
		if (processing > 0){
			tickerText = "Processing " + processing
			if (processing > 1) {
				tickerText += " layers...";
			} else {
				tickerText += " layer...";
			}
		}
		jQuery(document).trigger("requestTickerRendered");

		return tickerText;
	}
});


