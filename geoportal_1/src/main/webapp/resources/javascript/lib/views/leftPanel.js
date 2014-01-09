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
		    "click .arrow_left"	   : "goLeft"
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
			 //beyond extent arrows "#nwCorner" and "#swCorner" also have class "slideHorizontal"			
		 },
		 
		 showPanel: function(){
			 this.setAlsoMoves();
			 var mode = this.model.get("mode");
			if (mode == "open"){
				if (this.model.previous("mode") === "closed"){
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
				if (jQuery(".slideHorizontal").is(":hidden")){
					//extent arrows need to move, but shouldn't be made visible when the the panel opens
					jQuery(".slideHorizontal").not(".corner").show();
				}

				if (jQuery("#roll_right").is(":visible")){
					jQuery("#roll_right").hide();
				}
				
			var panelWidth = this.model.get("openWidth");
			var panelOffset = panelWidth - jQuery("#roll_right").width();

			this.$el.show().width(panelWidth).css({"margin-left": -1 * panelOffset, visibility: "visible"});
			var that = this;
			this.$el.add(".slideHorizontal").animate({'margin-left':'+=' + panelOffset}, { queue: false, duration: 500, complete: function(){
				
				jQuery(this).trigger("adjustContents");
				that.resizablePanel();
				jQuery(document).trigger("panelOpen");
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
			jQuery(this).trigger("adjustContents");
			that.resizablePanel();
		}});
		
		},

	showPanelClosed: function(){
		//display full width map
		if (jQuery(".slideHorizontal").is(":hidden")){
			jQuery(".slideHorizontal").not(".corner").show();
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
		jQuery(".slideHorizontal").not(".corner").fadeOut();
		
		this.$el.animate({'width': jQuery('#container').width() -2}, { queue: false, duration: 500, complete: function(){
			jQuery(this).trigger("adjustContents");
		}});  
	},
	
	resizablePanel: function(){
		this.setAlsoMoves();
		var that = this;
		this.$el.resizable({
			handles: 'se', //for some reason "e" handle doesn't work correctly
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
				jQuery(this).trigger("adjustContents");
			}
		});
	}

});