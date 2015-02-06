/** 
 * This javascript module includes functions for dealing with the user interface.
 * 
 * @author Chris Barnett
 * 
 */

/**
 * create the namespace objects if they don't already exist
 */
if (typeof OpenGeoportal == 'undefined') {
	OpenGeoportal = {};
} else if (typeof OpenGeoportal != "object") {
	throw new Error("OpenGeoportal already exists and is not an object");
}

OpenGeoportal.Structure = function() {
	this.template = OpenGeoportal.Template;
	var analytics = new OpenGeoportal.Analytics();

	/**
	 * init function
	 */

	this.init = function() {
		this.WelcomeBubbleAttr = "welcomeBubble";
		this.DirectionsBubble1Attr = "directionsBubble";
		
		this.infoBubbleAttrs = [this.WelcomeBubbleAttr, this.DirectionsBubble1Attr];
		
		this.resizeWindowHandler();

		var model = new OpenGeoportal.Models.LeftPanel();
		this.panelView = new OpenGeoportal.Views.LeftPanel({
			model : model,
			el : "div#left_col"
		});

		this.initializeTabs();

		this.resetHandler();
		
		// dialogs
		this.aboutHandler();
		this.contactHandler();
		this.userHelpHandler();

	};

	this.resetHandler = function() {
		var that = this;
		jQuery(".reset").on("click", function() {
			analytics.track("Interface", "Reset Page");
			
			var cartAuthWarningArr = ["showAuthenticationWarningExternal", "showAuthenticationWarningLocal"];
			OpenGeoportal.Utility.LocalStorage.resetItems(cartAuthWarningArr);
			that.resetShowInfo();
			
			
			window.location = window.location;
		});

	};

	//clear info bubble prefs from local storage
	this.resetShowInfo = function(){
		OpenGeoportal.Utility.LocalStorage.resetItems(this.infoBubbleAttrs);
	},
	
	this.doShowInfo = function(key){
		return OpenGeoportal.Utility.LocalStorage.getBool(key, true);
	},
	
	/**
	 * should register event handlers that should interrupt the flow and initiate a search. If one of them is triggered, they should all be unregistered
	 */


	this.triggerInitialSearch = function(){
		//trigger a search if a user clicks on the expand button, etc.
		var initSearchEvents = [
			             			{selector: ".arrow_right",
			            				event: "click"},
			            			{selector: "#moreSearchOptions",
			            					event: "click"},
					            	{selector: ".olControlPanel > div",
				            				event: "click"}
			            		];
		
		
		
		var deregisterAll = function(){
			_.each(initSearchEvents, function(item){
				$(item.selector).off(item.event + ".initial");
			});	
		};
		
		_.each(initSearchEvents, function(item){
			$(item.selector).on(item.event + ".initial", function(){
				jQuery(document).trigger("fireSearch");
				deregisterAll();
			});	
		});

		
	};
	
	
	this.introFlow = function(hasSharedLayers) {
		var bubble1 = "welcomeBubble";

		if (this.doShowInfo(bubble1) && !hasSharedLayers) {
			var $bubble1 = this.showInfoBubble(bubble1);

			this.triggerInitialSearch();
			
			var that = this;
			jQuery(document).one("fireSearch", function(event) {
				$bubble1.hide({
					effect : "drop",
					duration : 250,
					//queue : false,
					complete : function() {
						that.panelView.model.set({
							mode : "open"
						});
						jQuery(document).one("panelOpen", function() {
							var bubble2 = "directionsBubble";
							if (that.doShowInfo(bubble2)){
								
								var $bubbleDir = that.showDirectionsBubble_1(bubble2);
								jQuery(document).one("click focus", function() {
									$bubbleDir.hide("drop");
								});
							}
						});
					}
				});

			});

		} else {
			// if there are shared layers or user has selected "do not show again", don't show the infobubble intro
			// open the left column panel
			this.panelView.model.set({
				mode : "open"
			});
			
			if (hasSharedLayers){
				// set tab to the "cart" tab if there are shared layers
				jQuery("#tabs").tabs({
					active : 1
				});
			} else {
				//fire a search
				jQuery(document).trigger("fireSearch");
			}

		}
	};

	this.initializeTabs = function() {
		jQuery("#tabs").tabs(
				{
					active : 0,

					activate : function(event, ui) {

						jQuery("#left_col").trigger("adjustContents");
						var label, idx = ui.index;

						label = (idx == 1) && "Cart Tab" || (idx == 0)
								&& "Search Tab" || "Getting Started Tab";
						analytics.track("Interface", "Change Tab", label);
					}

				});

	};

	this.aboutHandler = function() {
		jQuery('#about').dialog({
			zIndex : 2999,
			title : "About",
			resizable : false,
			minHeight : 382,
			minWidth : 473,
			autoOpen : false
		});
		jQuery("#aboutLink").click(function() {
			jQuery('#about').dialog("open");
			analytics.track("Help", "Show About");
		});
	};

	this.contactHandler = function() {
		jQuery('#contact').dialog({
			zIndex : 2999,
			title : "Contact Information",
			resizable : false,
			minHeight : 222,
			minWidth : 405,
			autoOpen : false
		});
		jQuery("#contactLink").click(function() {
			jQuery('#contact').dialog("open");
		});
	};

	this.userHelpHandler = function() {
		jQuery('#userGuide').dialog({
			zIndex : 2999,
			title : "User Guide",
			resizable : true,
			height : 425,
			width : 745,
			autoOpen : false
		});
		jQuery("#userGuideLink").click(function() {
			if (jQuery("#userGuide").length == 0) {
				jQuery.get(OpenGeoportal.Utility.JspfLocation + "userGuide.jspf", function(data) {
					jQuery("#dialogs").append(data);
					jQuery("#userGuide").dialog({
						zIndex : 2999,
						title : "USER GUIDE",
						resizable : true,
						height : 425,
						width : 745,
						autoOpen : false
					});
					OpenGeoportal.Utility.anchorsToNiceScroll("userGuide", {
						top : -10,
						left : -30
					});
					jQuery('#userGuide').dialog("open");
				});
			} else {
				jQuery('#userGuide').dialog("open");
			}
			analytics.track("Help", "Show User Guide");
		});
	};



	this.resizeWindowHandler = function() {

		var minHeight = parseInt(jQuery("#container").css("min-height"));
		var minWidth = parseInt(jQuery("#container").css("min-width"));
		
		var resizeElements = function() {
			
			var headerHeight = jQuery("#header").height();
			var footerHeight = jQuery("#footer").height();
			var fixedHeights = headerHeight + footerHeight + 3;
			var container$ = jQuery("#container");
			
			var oldContainerWidth = container$.width();
			var newContainerWidth = Math.max(jQuery(window).width(), minWidth);

			var oldContainerHeight = container$.height();
			var newContainerHeight = Math.max(jQuery(window).height()
					- fixedHeights, minHeight);
			
			//resize the container if there is a change.
			if ((newContainerWidth !== oldContainerWidth)||(newContainerHeight !== oldContainerHeight)){
				container$.height(newContainerHeight).width(newContainerWidth);
				jQuery(document).trigger("container.resize", {ht: newContainerHeight, wd: newContainerWidth, minHt: minHeight, minWd: minWidth});
			}
			
		};
		resizeElements();
		jQuery(window).resize(resizeElements);
	};



	this.showInfoBubble = function(elId) {
		var params = {
			"arrow" : "top"
		};
		return this.infoBubble(elId, this.template.get('welcomeText')(), params);
	};

	this.showDirectionsBubble_1 = function(elId) {
		//need to get the width of the left panel. based on this, reset 'width', 'left' of the element
		
		var params = {
			"arrow" : "left"
		};
		return this.infoBubble(elId, this.template.get('directionsText')(), params);
	};

	this.showDowntimeNotice = function() {
		/* downtime notice */
		var downtimeText = "Layers will be unavailable until later this afternoon while we perform server maintenance. We apologize for the inconvenience.";
		var downtimeDiv = '<div id="downtimeNotice" class="dialog infoDialog"><p>'
				+ downtimeText + '</p></div>';
		jQuery("#dialogs").append(downtimeDiv);
		jQuery('#downtimeNotice').dialog({
			zIndex : 2999,
			title : "Downtime",
			resizable : false,
			minWidth : 415,
			autoOpen : false
		});
		jQuery("#downtimeNotice").dialog("open");

	};
	
	this.infoBubble = function(bubbleId, infoHtml, optionsObj) {

		var arrowDirection = "";// default value is no arrow
		if (optionsObj.arrow == 'top') {
			arrowDirection = "top-arrow";
		} else if (optionsObj.arrow == "left") {
			arrowDirection = "left-arrow";
		}

		
		var infoBubbleMain = this.template.get('infoBubble')({elId: bubbleId, arrowDirection: arrowDirection, content: infoHtml});
		jQuery("#infoBubbles").append(infoBubbleMain);
		var $bubble = jQuery("#" + bubbleId);
		
		var hght = $bubble.height();
		var wdth = $bubble.width();
		var left = $bubble.css("left");
		
		//check the map size to see if we need to adjust sizes, since we don't want to cover the results.
		var offset = OpenGeoportal.Utility.getMapOffset();
		var fullwidth = jQuery("#container").width();
		var marginright = 20;
		var marginleft = 33;
		var margins = marginright + marginleft
		var padding = parseInt($bubble.css("padding-left")) + parseInt($bubble.css("padding-right"));
		
		
		if (wdth + margins + padding > fullwidth - offset.x){
			wdth = fullwidth - offset.x - margins - padding;
			$bubble.width(wdth);
		}
		
		if (arrowDirection == "left-arrow"){
			 left = offset.x + marginleft;
		} else {
			//center
			left = (fullwidth + offset.x - wdth)/2;
		}
		
		$bubble.css("left", left);
		
		var $inset = $bubble.find(".infoBubbleText");
		$inset.height(hght - 4).width(wdth - 4);

		$bubble.on("click", ".closeBubble", function() {
			$bubble.fadeOut("slow");
		}).fadeIn("slow");

		$bubble.on("click", ".doNotShow", function(){
			var show = true;
			if (jQuery(this).is("input:checked")){
				show = false;
			}
			OpenGeoportal.Utility.LocalStorage.setBool(bubbleId, show);
		});
		return $bubble;
	};

};
