if (typeof OpenGeoportal == 'undefined'){
	OpenGeoportal = {};
} else if (typeof OpenGeoportal != "object"){
    throw new Error("OpenGeoportal already exists and is not an object");
}

if (typeof OpenGeoportal.Views == 'undefined'){
	OpenGeoportal.Views = {};
} else if (typeof OpenGeoportal.Views != "object"){
    throw new Error("OpenGeoportal.Views already exists and is not an object");
}

OpenGeoportal.Views.Cart = Backbone.View.extend({	
	assign : function (view, selector) {
	    view.setElement(this.$(selector)).render();
	},
	initialize: function() {

		this.listenTo(this.collection, "add", this.addedToCart);
		this.listenTo(this.collection, "remove", this.removedFromCart);
		
		this.initRender();
		console.log("finished initializing cart view");
	},		   
	addedToCart:function(model){
		    	var layerId = model.get("LayerId");
		    	model.set({isChecked: true});
		    	//update search results table
		    	jQuery(document).trigger("view.showInCart", {layerId: layerId});
		    	//add data to cart table
		    	var data = this.processTableRow(model);
		    	console.log(data);
				var savedTable = this.cartTableObj.getTableObj();
				var currentData = savedTable.fnGetData();
				currentData.unshift(data);
				savedTable.fnClearTable();
				savedTable.fnAddData(currentData);
				this.updateSavedLayersNumber();
		    },
	removedFromCart:function(model){
		    	var layerId = model.get("LayerId");
		    	//update search results table
		    	jQuery(document).trigger("view.showNotInCart", {layerId: layerId});
		    	//remove data from cart table
				var savedTable = this.cartTableObj.getTableObj();
				var currentData = savedTable.fnGetData();
				for (var i in currentData){

					if (currentData[i].LayerId == layerId){
						savedTable.fnDeleteRow(i);
					}
				}
				this.updateSavedLayersNumber();
		    },
	updateSavedLayersNumber: function(){
		var number$ = jQuery('.savedLayersNumber');
		
		number$.text('(' + this.collection.length + ')');
		var numColor = number$.css("color");
		number$.parent()
			.animate({color: "#0755AC"},125)
		    .animate({color: numColor},125)
		    .animate({color: "#0755AC"},125)
		    .animate({color: numColor},125);
			},
	processTableRow: function(model){
		var tableHeadings = this.cartTableObj.tableHeadingsObj;
				var rowObj = {};
				tableHeadings.each(function(currentModel){
					var headingName = currentModel.get("columnName");
					if (currentModel.get("solr")) {
						//if the tableheading can't be found in the solr object put in an empty string as a placeholder
						if (typeof model.attributes[headingName] == 'undefined'){
							rowObj[headingName] = "";
						} else {
							if (model.attributes[headingName].constructor !== Array){
								rowObj[headingName] = model.attributes[headingName];
							} else {
								rowObj[headingName] = model.attributes[headingName].join();//in case the value is an array
							}
						}
					} else {
						//columns w/ ajax == false are placeholders and are populated by javascript
						rowObj[headingName] = "";
					}
				});

			return rowObj;
	},
	initRender: function(){
		this.cartTableObj = new OpenGeoportal.CartTable();
		this.cartTableObj.backingData = this.collection;
		this.cartTableObj.initTable("cart");
		return this;
	}
});

/*
this.expandHandler = function(){
	jQuery("#" + that.getTableId() + " tbody").on("click.expand", "div.expandControl", function(event){
		//console.log("layer saved");
		that.expandRow(this);
	});
};

this.expandViewHandler = function(){
	var that = this;
	jQuery("#" + that.getTableId()).on("view.expandRow", function(event, data){
		var control$ = that.findExpandControl(data.layerId);
		that.openPreviewTools(control$);
	});
	jQuery("#" + that.getTableId()).on("view.closeRow", function(event, data){
		var control$ = that.findExpandControl(data.layerId);
		that.closePreviewTools(control$);
	});
};*/

OpenGeoportal.Views.TableRowSettings = Backbone.View.extend({

	initialize: function(){
		//if the value is equal to the default value, maybe we should just remove the model from the collection
	    this.listenTo(this.collection, "add", this.openRow);
	    this.listenTo(this.collection, "remove", this.closeRow);
	    this.listenTo(this.collection, "syncUI.openRow", this.syncRow);

	},
	closeRow: function( model, val, options){
		this.$el.trigger("view.closeRow", {LayerId: model.id});
		},
	openRow: function( model, val, options){
		this.$el.trigger("view.openRow", {LayerId: model.id});//tie in to the preview tools model below

		},
	syncRow: function(data){
		//TODO: review this
		this.$el.trigger("view.openRow", {LayerId: data.LayerId});
	}
	
});

OpenGeoportal.Views.LeftPanel = Backbone.View.extend({
	initialize: function(){		
		var that = this;
		jQuery("#roll_right .arrow_right").on("click", function(){that.goRight.apply(that, arguments);});
		this.listenTo(this.model, "change:mode", this.showPanel);
		
		var width = this.model.get("openWidth");
		jQuery("#left_col").show().width(width).css({visibility: "hidden", "margin-left": "-" + width + "px"});
		
	},
	  events: {
		    "click .arrow_right"   : "goRight",
		    "click .arrow_left"	   : "goLeft",
		 },
		 //these are really controllers
		 goRight: function(){
			 //analytics.track("Interface", "Expand/Collapse Buttons", "Collapse Right");
			var mode = this.model.get("mode"); 
			if (mode == "closed"){
				this.model.set({mode: "open"});
			} else if (mode == "open") {
				this.model.set({mode: "fullscreen"});
			}
		 },
		 goLeft: function(){
			 //analytics.track("Interface", "Expand/Collapse Buttons", "Collapse Left");
			 var mode = this.model.get("mode"); 
			if (mode == "fullscreen"){
				this.model.set({mode: "open"});
			} else if (mode == "open") {
				this.model.set({mode: "closed"});
			}
		 },
	
		 setAlsoMoves: function(){
			 if (!jQuery(".olControlPanel,.olControlScaleLine,.olControlModPanZoomBar").hasClass("slideHorizontal")){
				 jQuery(".olControlPanel,.olControlScaleLine,.olControlModPanZoomBar").addClass("slideHorizontal");
			 }
		 },
		 
		 showPanel: function(){
			 this.setAlsoMoves();
			 var mode = this.model.get("mode")
			if (mode == "open"){
				if (this.model.previous("mode") == "closed"){
					this.showPanelMidRight();
				} else {
					this.showPanelMidLeft();
				}
			} else if (mode == "closed"){
				this.showPanelClosed();
			} else if (mode == "fullscreen"){
				this.showPanelFullScreen();
			}
		 },
		 showPanelMidRight: function(){
			 console.log("showPanelMid");
				if (jQuery(".slideHorizontal").is(":hidden")){
					jQuery(".slideHorizontal").show();
				}

				if (jQuery("#roll_right").is(":visible")){
					jQuery("#roll_right").hide();
				}
				
			var panelWidth = this.model.get("openWidth");
			var panelOffset = panelWidth - jQuery("#roll_right").width();

			this.$el.show().width(panelWidth).css({"margin-left": -1 * panelOffset, visibility: "visible"});
			var that = this;
			this.$el.add(".slideHorizontal").animate({'margin-left':'+=' + panelOffset}, { queue: false, duration: 500, complete: function(){
				jQuery(this).trigger("adjustColumns");
				that.resizablePanel();
			} });

	},
	 showPanelMidLeft: function(){

			if (jQuery("#roll_right").is(":visible")){
				jQuery("#roll_right").hide();
			}
			
		var panelWidth = this.model.get("openWidth");
		var that = this;
		this.$el.show().animate({width: panelWidth},{ queue: false, duration: 500, complete: function(){
			jQuery(".slideHorizontal").hide().css({'margin-left': panelWidth}).fadeIn();
			jQuery(this).trigger("adjustColumns");
			that.resizablePanel();
		}});
		

		
	 },

	showPanelClosed: function(){
		//display full width map
		if (jQuery(".slideHorizontal").is(":hidden")){
			jQuery(".slideHorizontal").show();
		}
		var that = this;
		var panelOffset = this.model.get("openWidth") - jQuery("#roll_right").width();
		this.$el.add(".slideHorizontal").animate({'margin-left':'-=' + panelOffset}, { queue: false, duration: 500, complete: function(){    
				that.$el.css({visibility: "hidden"});
				jQuery("#roll_right").show();
		}});
	},
	
	showPanelFullScreen: function(){
		if (jQuery("#roll_right").is(":visible")){
			jQuery("#roll_right").hide();
		}
		if (this.$el.is(":hidden")){
			this.$el.show();
		}
		jQuery(".slideHorizontal").fadeOut();
		
		this.$el.animate({'width': jQuery('#container').width() -2}, { queue: false, duration: 500, complete: function(){
			jQuery(this).trigger("adjustColumns");
		}});  
	},
	
	resizablePanel: function(){
		this.setAlsoMoves();
		var that = this;
		this.$el.resizable({
			handles: 'se', //for some reason "e" handle doesn't work correctly
			//ghost: true,
			start: function(event, ui){
				var margin = parseInt(jQuery(".slideHorizontal").css("margin-left")); 
				that.model.set({alsoMovesMargin: margin});
				ui.element.resizable("option", "minWidth", that.model.get("panelMinWidth"));
				var maxWidth = jQuery("#container").width() - that.model.get("mapMinWidth");
				ui.element.resizable("option", "maxWidth", maxWidth);
				ui.element.resizable("option", "minHeight", jQuery("#container").height());
				ui.element.resizable("option", "maxHeight", jQuery("#container").height());
			},
			resize: function(event, ui){
				var delta = ui.size.width - ui.originalSize.width ;
				var newMargin = that.model.get("alsoMovesMargin") + delta;
				jQuery(".slideHorizontal").css({"margin-left": newMargin + "px"}); 
				
			},
			stop: function(event, ui) {
				console.log("resize stop");
				var newWidth = ui.size.width;
				that.model.set({openWidth: newWidth});
				jQuery(this).trigger("adjustColumns");
			}
		});
	}

});










