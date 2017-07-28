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

OpenGeoportal.Views.LeftPanel = Backbone.View
		.extend({
			initialize : function() {
				this.listenTo(this.model, "change:mode", this.showPanel);

				var setWidth = this.model.get("openWidth");
				var calcWidth = $("#container").width() * 0.35;
				var width = Math.max(setWidth, calcWidth);

				this.model.set({openWidth: width});
				var margin = width - jQuery("#roll_right").width();
				jQuery("#left_col").show().width(width).css({
					"margin-left" : "-" + margin  + "px"
				});
				var rollRightMarginTop = $("#roll_right").height() * 0.45 + "px";
				$("#showSearchResults").css({'margin-top': rollRightMarginTop});

			},
			events : {
				"click #expandRight" : "goRight",
				"click #roll_right"  : "goRight",
				"click .arrow_left"  : "goLeft"
			},
			// these are really controllers
			goRight : function() {
				// analytics.track("Interface", "Expand/Collapse Buttons",
				// "Collapse Right");
				var mode = this.model.get("mode");
				if (mode === "closed") {
					this.model.set({
						mode : "open"
					});
				} else if (mode === "open") {
					this.model.set({
						mode : "fullscreen"
					});
				}
			},
			goLeft : function() {
				// analytics.track("Interface", "Expand/Collapse Buttons",
				// "Collapse Left");
				var mode = this.model.get("mode");
				if (mode === "fullscreen") {
					this.model.set({
						mode : "open"
					});
				} else if (mode === "open") {
					this.model.set({
						mode : "closed"
					});
				}
			},

			setAlsoMoves : function() {
				if (!$(".leaflet-left").hasClass("slideHorizontal")) {
					$(".leaflet-left").addClass("slideHorizontal")	
				}
				if (!$(".leaflet-top").hasClass("slideVertical")) {
					$(".leaflet-top").addClass("slideVertical")
				}
			},

			showPanel : function() {
				this.setAlsoMoves();
				var mode = this.model.get("mode");
				if (mode === "open") {

					if (this.model.previous("mode") === "closed") {
						this.showPanelMidRight();
					} else {
						this.showPanelMidLeft();
					};
                               	} else if (mode === "closed") {
					this.showPanelClosed();
				} else if (mode === "fullscreen") {
					this.showPanelFullScreen();
				}
			},

			showPanelMidRight : function() {
				if (jQuery(".slideHorizontal").is(":hidden")) {
					// extent arrows need to move, but shouldn't be made visible
					// when the the panel opens
					jQuery(".slideHorizontal").not(".corner").show();
				}

				var panelWidth = this.model.get("openWidth");

				var panelOffset = panelWidth - jQuery("#roll_right").width();
				this.$el.show().width(panelWidth).css({
					"margin-left" : -1 * panelOffset
				});
				var that = this;
				var oldCenter = OpenGeoportal.ogp.map.getCenter();

				if (jQuery("#roll_right").is(":visible")) {
                                        jQuery("#showSearchResults").animate({
        	                                 marginTop: $(".arrow_left").css('marginTop')
                                        },{
						duration: 250,
                                        	complete: function(){
							$("#roll_right").hide();
							that.$el.add(".slideHorizontal").animate({
								'margin-left' : '+=' + panelOffset
							}, {
								queue: false,
								duration : 500,
								complete : function() {
									OpenGeoportal.ogp.map.panTo(oldCenter);
									jQuery(this).trigger("adjustContents");
									that.resizablePanel();
									jQuery(document).trigger("panelOpen");
								}
							})
						}
			        	})
                                };

				try {
					this.$el.resizable( "enable" );
				} catch (e){
					//console.log(e);
				}
			},

			showPanelMidLeft : function() {
				var panelWidth = this.model.get("openWidth");
				var panelOffset = panelWidth - jQuery("#roll_right").width();
				var that = this;
				
				this.$el.show().animate({
					width : panelWidth
					}, {
					queue : false,
					duration : 500,
					complete : function() {
						jQuery(".slideHorizontal").css({
							'margin-left' : panelOffset
						}).not(".corner").fadeIn();
						
						jQuery(this).trigger("adjustContents");
						that.resizablePanel();
					}
				});
			},

			showPanelClosed : function() {
				// display full width map
				if (jQuery(".slideHorizontal").is(":hidden")) {
					jQuery(".slideHorizontal").not(".corner").show();
				}
				var that = this;
				var panelWidth = this.model.get("openWidth");
				var panelOffset = panelWidth - jQuery("#roll_right").width();
				var oldCenter = OpenGeoportal.ogp.map.getCenter();	
				this.$el.add(".slideHorizontal").animate({
					'margin-left' : '-=' + panelOffset
				}, {
					queue : false,
					duration : 500,
					complete : function() {
						$("#roll_right").show();
						var newMargin = $("#roll_right").height() * 0.45 + "px";

						$(".viewport").width( $("#container").width() - $("#roll_right").width());

	                                        jQuery("#showSearchResults").animate({
	                                                marginTop: newMargin 
		                                },{
                	        	        	duration: 250,
							complete: function() {
								OpenGeoportal.ogp.map.panTo(oldCenter);	
                		                	}
						})
        	                	}
				})
				
				this.$el.resizable( "disable" );
			},

			showPanelFullScreen : function() {
				if (jQuery("#roll_right").is(":visible")) {
					jQuery("#roll_right").hide();
				}
				if (this.$el.is(":hidden")) {
					this.$el.show();
				}
				jQuery(".slideHorizontal").fadeOut();

				this.$el.animate({
					'width' : jQuery('#container').width()
				}, {
					queue : false,
					duration : 500,
					complete : function() {
						jQuery(this).trigger("adjustContents");
					}
				});
			},

			resizablePanel : function() {
				this.setAlsoMoves();
				var that = this;
				this.$el.resizable({
					handles : 'se', // for some reason "e" handle doesn't work
									// correctly
					start : function(event, ui) {
						var margin = parseInt(jQuery(".slideHorizontal").css(
								"margin-left"));

						that.model.set({
							alsoMovesMargin : margin
						});
						this.prevWidth = ui.originalSize.width;
						ui.element.resizable("option", "minWidth", that.model
								.get("panelMinWidth"));
						var maxWidth = jQuery("#container").width()
								- that.model.get("mapMinWidth");
						ui.element.resizable("option", "maxWidth", maxWidth);
						ui.element.resizable("option", "minHeight", jQuery(
								"#container").height());
						ui.element.resizable("option", "maxHeight", jQuery(
								"#container").height());

					},
					prevWidth: null,
					resize : function(event, ui) {

						var delta = ui.size.width - this.prevWidth;
						this.prevWidth = ui.size.width;
						//var newMargin = that.model.get("alsoMovesMargin") + delta;
						jQuery(".slideHorizontal").css({
							"margin-left" : "+=" + delta
						});
						jQuery(this).trigger("panelResizing");

					},
					
					stop : function(event, ui) {
						//console.log("resize stop");
						var newWidth = ui.size.width;
						that.model.set({
							openWidth : newWidth
						});
						jQuery(this).trigger("adjustContents");

					}
				});
			}

		});
