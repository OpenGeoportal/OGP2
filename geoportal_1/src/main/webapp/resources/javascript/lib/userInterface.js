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
	this.template = OpenGeoportal.ogp.template;
	var analytics = new OpenGeoportal.Analytics();

	/**
	 * init function
	 */

	this.init = function() {
		this.WelcomeBubbleAttr = "welcomeBubble";
		this.DirectionsBubble1Attr = "directionsBubble";
		
		this.infoBubbleAttrs = [this.WelcomeBubbleAttr, this.DirectionsBubble1Attr];
		
		this.resizeWindowHandler();

		this.searchToggleHandler();

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
	

	
	this.introFlow = function(hasSharedLayers) {
		var bubble1 = "welcomeBubble";

		if (this.doShowInfo(bubble1) && !hasSharedLayers) {
			var $bubble1 = this.showInfoBubble(bubble1);

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


	this.searchToggleHandler = function() {
		var that = this;
		jQuery(".searchToggle").on("click", function() {
			that.toggleSearch(this);
		});
	};
	
	//this should move to the search view
	this.toggleSearch = function(thisObj) {
		var stepTime = 50;
		var thisId = jQuery(thisObj).attr('id');
		var hght = jQuery(".searchFormRow").height();
		jQuery(".olControlModPanZoomBar, .olControlPanel, #mapToolBar, #neCorner, #nwCorner").addClass("slideVertical");
		
		if (thisId === 'moreSearchOptions') {

			jQuery("#searchForm .basicSearch").hide();
			jQuery("#geosearchDiv").removeClass("basicSearch").addClass(
					"advancedSearch");
			jQuery("#searchForm .advancedSearch.searchRow1").show();

			jQuery('#searchBox').animate(
							{
								height : "+=" + hght
							},
							{
								queue : false,
								duration : stepTime,
								easing : "linear",
								complete : function() {
									jQuery("#searchForm .advancedSearch.searchRow2").show();
									jQuery('#searchBox').animate(
													{
														height : "+=" + hght
													},
													{
														queue : false,
														duration : stepTime,
														easing : "linear",
														complete : function() {
															jQuery("#searchForm .advancedSearch.searchRow3").show();
															jQuery('#searchBox').animate(
																			{
																				height : "+=" + hght
																			},
																			{
																				queue : false,
																				duration : stepTime,
																				easing : "linear",
																				complete : function() {
																					jQuery("#searchForm .advancedSearch.searchRow4").show();
																					jQuery("#lessSearchOptions").focus();
																					jQuery(document).trigger("search.setAdvanced");

																				}
																			});
														}
													});
								}
							});

			jQuery(".slideVertical").animate(
					{
						"margin-top" : "+=" + hght * 3
					},
					{
						duration : stepTime * 3,
						easing : "linear",
						done : function() {
							jQuery(document).trigger("search.resize");
						}
			});

		} else if (thisId === 'lessSearchOptions') {
			jQuery(".slideVertical").animate(
					{
						"margin-top" : "-=" + hght * 3
					},
					{
						queue : false,
						duration : stepTime * 3,
						easing : "linear",
						done : function() {
							jQuery(document).trigger("search.resize");
						}
			});

			jQuery("#searchForm .advancedSearch.searchRow4").hide();
			jQuery('#searchBox')
					.animate(
							{
								height : "-=" + hght
							},
							{
								queue : false,
								duration : stepTime,
								easing : "linear",
								complete : function() {
									// jQuery(".slideVertical").animate({"margin-top":
									// "-=" + hght, queue: false, duration: 100,
									// easing: "linear"});
									jQuery("#searchForm .advancedSearch.searchRow3").hide();
									jQuery('#searchBox').animate(
													{
														height : "-=" + hght
													},
													{
														queue : false,
														duration : stepTime,
														easing : "linear",
														complete : function() {
															jQuery("#searchForm .advancedSearch.searchRow2").hide();
															jQuery('#searchBox').animate(
																			{
																				height : "-="
																						+ hght
																			},
																			{
																				queue : false,
																				duration : stepTime,
																				easing : "linear",
																				complete : function() {
																					// jQuery(".slideVertical").animate({"margin-top":
																					// "-="
																					// +
																					// hght,
																					// queue:
																					// false,
																					// duration:
																					// 100,
																					// easing:
																					// "linear"});
																					jQuery("#geosearchDiv").removeClass("advancedSearch")
																							.addClass("basicSearch");
																					jQuery("#searchForm .advancedSearch.searchRow1").hide();
																					jQuery("#searchForm .basicSearch").show();
																					jQuery("#moreSearchOptions").focus();
																					jQuery(document).trigger("search.setBasic");

																				}
																			});
														}
													});
								}
							});

		}
	};

	this.showInfoBubble = function(elId) {
		var params = {
			"height" : 335,
			"width" : 700,
			"top" : 259,
			"left" : 269,
			"arrow" : "top"
		};
		return this.infoBubble(elId, this.template.welcomeText(), params);
	};

	this.showDirectionsBubble_1 = function(elId) {

		var params = {
			"height" : 250,
			"width" : 600,
			"top" : 259,
			"left" : 520,
			"arrow" : "left"
		};
		return this.infoBubble(elId, this.template.directionsText(), params);
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

		var arrowDirection = "top-arrow";// default value
		if (optionsObj.arrow == 'top') {
			arrowDirection = "top-arrow";
		} else if (optionsObj.arrow == "left") {
			arrowDirection = "left-arrow";
		}

		var infoBubbleMain = this.template.infoBubble({elId: bubbleId, arrowDirection: arrowDirection, content: infoHtml});
		jQuery("#infoBubbles").append(infoBubbleMain);
		jQuery("#" + bubbleId).height(optionsObj.height + 4).width(
				optionsObj.width + 4).css("top", optionsObj.top - 2).css(
				"left", optionsObj.left - 2);
		jQuery("#" + bubbleId + " > .infoBubbleText").height(optionsObj.height)
				.width(optionsObj.width);
		var infoBubble$ = jQuery("#" + bubbleId);
		infoBubble$.on("click", ".closeBubble", function() {
			infoBubble$.fadeOut("slow");
		}).fadeIn("slow");

		infoBubble$.on("click", ".doNotShow", function(){
			var show = true;
			if (jQuery(this).is("input:checked")){
				show = false;
			}
			OpenGeoportal.Utility.LocalStorage.setBool(bubbleId, show);
		});
		return infoBubble$;
	};

};
