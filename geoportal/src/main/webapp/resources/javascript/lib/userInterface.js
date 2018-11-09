/*
 * create the namespace objects if they don't already exist
 */
if (typeof OpenGeoportal == 'undefined') {
	OpenGeoportal = {};
} else if (typeof OpenGeoportal != "object") {
	throw new Error("OpenGeoportal already exists and is not an object");
}

/**
 * Structure contains logic for handling initial page load behavior (welcome and instruction bubbles, etc.), basic page
 * behavior for window resize, search form resizing, click handlers for links, initialization of tabs, instantiation of
 * LeftPanel model and view.
 *
 */
OpenGeoportal.Structure = function (params) {
    var validateParams = function (params) {
        var valid = true;
        var required = ["template", "panelModel"];
        _.each(required, function (prop) {
            valid = valid && _.has(params, prop);
        });

        if (!valid) {
            throw new Error("Structure is missing parameters!");
        }
    };

    // dependencies
    validateParams(params);

    this.template = params.template;
    this.panelModel = params.panelModel;


	this.template = OpenGeoportal.Template;
	var analytics = new OpenGeoportal.Analytics();

    this.panelView = new OpenGeoportal.Views.LeftPanel({
        model: this.panelModel,
        el: "div#left_col"
    });

	/**
	 * init function
	 */

	this.init = function() {
		this.WelcomeBubbleAttr = "welcomeBubble";
		this.DirectionsBubble1Attr = "directionsBubble";
		
		this.infoBubbleAttrs = [this.WelcomeBubbleAttr, this.DirectionsBubble1Attr];
		
		this.resizeWindowHandler();


		this.resetHandler();
		
		// dialogs
		this.aboutHandler();
		this.contactHandler();
		this.userHelpHandler();

	};

	this.resetHandler = function() {
		var that = this;
		$(".reset").on("click", function() {
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
	};
	
	this.doShowInfo = function(key){
		return OpenGeoportal.Utility.LocalStorage.getBool(key, true);
	};


	/**
	 * should register event handlers that should interrupt the flow and initiate a search. If one of them is triggered, they should all be unregistered
	 */
	this.hideBubbleHandler = function () {
        // introFlow bubble should stay up until user interacts with the map, submits the search form,
		var initSearchEvents = [
			{
				selector: document,
				event: "panelOpen"
			},
			{
				selector: "#moreSearchOptions",
				event: "click"
			},
			{
				selector: document,
				event: "firstQueryFired"
			}
		];


		var deregisterAll = function () {
			_.each(initSearchEvents, function (item) {
				$(item.selector).off(item.event + ".initial");
			});
		};

		_.each(initSearchEvents, function (item) {
			$(item.selector).on(item.event + ".initial", function (e) {
				// trigger map.userinteraction so that the map starts firing queries on extent changes.
                $(document).trigger("map.userinteraction");
                $(document).trigger("hideBubble");
				deregisterAll();
			});
		});


	};

    this.introFlow = function (initObj) {
		var bubble1 = "welcomeBubble";

        var doIntro = !(initObj.sharedLayers || initObj.userState);

        if (this.doShowInfo(bubble1) && doIntro) {
			var $bubble1 = this.showInfoBubble(bubble1);

			this.hideBubbleHandler();

			var that = this;
			$(document).one("hideBubble", function(event) {

                $bubble1.hide({
					effect : "drop",
					duration : 250,
					//queue : false,
					complete : function() {
						that.panelView.model.set({
							mode : "open"
						});

                        $(document).one("panelOpen", function() {
                            var bubble2 = "directionsBubble";
							if (that.doShowInfo(bubble2)){
								var $bubbleDir = that.showDirectionsBubble_1(bubble2);
								$(document).one("click focus", function() {
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

            if (initObj.sharedLayers) {
				// set tab to the "cart" tab if there are shared layers
				$("#tabs").tabs({
					active : 1
				});

			} else {
				//fire a search
				$(document).trigger("newSearch");
			}

		}
	};

	this.aboutHandler = function() {
		$('#about').dialog({
			zIndex : 2999,
			title : "About",
			resizable : false,
			minHeight : 382,
			minWidth : 473,
			autoOpen : false
		});
		$("#aboutLink").click(function() {
			$('#about').dialog("open");
			analytics.track("Help", "Show About");
		});
	};

	this.contactHandler = function() {
		$('#contact').dialog({
			zIndex : 2999,
			title : "Contact Information",
			resizable : false,
			minHeight : 222,
			minWidth : 405,
			autoOpen : false
		});
		$("#contactLink").click(function() {
			$('#contact').dialog("open");
		});
	};

	this.userHelpHandler = function() {
		$('#userGuide').dialog({
			zIndex : 2999,
			title : "User Guide",
			resizable : true,
			height : 425,
			width : 745,
			autoOpen : false
		});
		$("#userGuideLink").click(function() {
			if ($("#userGuide").length == 0) {
				jQuery.get("userguide", function (data) {
					$("#dialogs").append(data);
					$("#userGuide").dialog({
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
					$('#userGuide').dialog("open");
				});
			} else {
				$('#userGuide').dialog("open");
			}
			analytics.track("Help", "Show User Guide");
		});
	};



	this.resizeWindowHandler = function() {
		var $container = $("#container");
		var minHeight = parseInt($container.css("min-height"));
		var minWidth = parseInt($container.css("min-width"));
		
		var resizeElements = function() {

			var headerHeight = $("#header").height();
			var footerHeight = $("#footer").height();
			var fixedHeights = headerHeight + footerHeight + 3;


			var oldContainerWidth = $container.width();
			var newContainerWidth = Math.max($(window).width(), minWidth);

			var oldContainerHeight = $container.height();
			var newContainerHeight = Math.max($(window).height()
					- fixedHeights, minHeight);
			
			//resize the container if there is a change.
			if ((newContainerWidth !== oldContainerWidth)||(newContainerHeight !== oldContainerHeight)){
				$container.height(newContainerHeight).width(newContainerWidth);
				$(document).trigger("container.resize", {
					ht: newContainerHeight,
					wd: newContainerWidth,
					minHt: minHeight,
					minWd: minWidth
				});
			}
			
		};
		resizeElements();
		$(window).resize(resizeElements);
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
			"left": this.openWidth + 40,
			"arrow" : "left"
		};
		return this.infoBubble(elId, this.template.get('directionsText')(), params);
	};

	this.showDowntimeNotice = function() {
		/* downtime notice */
		var downtimeText = "Layers will be unavailable temporarily while we perform server maintenance. We apologize for the inconvenience.";
		var downtimeDiv = '<div id="downtimeNotice" class="dialog infoDialog"><p>'
				+ downtimeText + '</p></div>';
		$("#dialogs").append(downtimeDiv);
		$('#downtimeNotice').dialog({
			zIndex : 2999,
			title : "Downtime",
			resizable : false,
			minWidth : 415,
			autoOpen : false
		});
		$("#downtimeNotice").dialog("open");

	};
	
	this.infoBubble = function(bubbleId, infoHtml, optionsObj) {

		var arrowDirection = "";// default value is no arrow
		if (optionsObj.arrow == 'top') {
			arrowDirection = "top-arrow";
		} else if (optionsObj.arrow == "left") {
			arrowDirection = "left-arrow";
		}


		var infoBubbleMain = this.template.get('infoBubble')({
			elId: bubbleId,
			arrowDirection: arrowDirection,
			content: infoHtml,
			isChecked: false
		});
		$("#infoBubbles").append(infoBubbleMain);
		var $bubble = $("#" + bubbleId);

		var hght = $bubble.height();
		var wdth = $bubble.width();
		var left = $bubble.css("left");

		//check the map size to see if we need to adjust sizes, since we don't want to cover the results.
		var panelModel = this.panelView.model;
		var xoffset = 0;
		if (panelModel.get("mode") !== "closed") {
			xoffset = panelModel.get("openWidth");
		}
		var fullwidth = $("#container").width();
		var marginright = 20;
		var marginleft = 33;
		var margins = marginright + marginleft;
		var padding = parseInt($bubble.css("padding-left")) + parseInt($bubble.css("padding-right"));


		if (wdth + margins + padding > fullwidth - xoffset) {
			wdth = fullwidth - xoffset - margins - padding;
			$bubble.width(wdth);
		}

		if (arrowDirection == "left-arrow") {
			left = xoffset + marginleft;
		} else {
			//center
			left = (fullwidth + xoffset - wdth) / 2;
		}

		$bubble.css("left", left);

		var $inset = $bubble.find(".infoBubbleText");
		$inset.height(hght - 4).width(wdth - 4);

		$bubble.on("click", ".closeBubble", function () {
			$bubble.fadeOut("slow");
		}).fadeIn("slow");

		$bubble.on("click", ".doNotShow > input", function () {
			var show = true;
			if ($(this).is(":checked")) {
				show = false;
			}
			OpenGeoportal.Utility.LocalStorage.setBool(bubbleId, show);
		});
		return $bubble;
	};

};
