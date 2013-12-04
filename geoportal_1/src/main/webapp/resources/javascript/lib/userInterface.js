/** 
 * This javascript module includes functions for dealing with the user interface.
 * 
 * @author Chris Barnett
 * 
 */

/**
 * create the namespace objects if they don't already exist
 */
if (typeof OpenGeoportal == 'undefined'){
	OpenGeoportal = {};
} else if (typeof OpenGeoportal != "object"){
	throw new Error("OpenGeoportal already exists and is not an object");
}

OpenGeoportal.UserInterface = function(){
	this.appState = OpenGeoportal.ogp.appState;
	this.template = this.appState.get("template");
	this.controls = this.appState.get("controls");
	
	this.utility = OpenGeoportal.Utility;
	
	this.jspfDir = OpenGeoportal.Utility.JspfLocation;
			 
	var analytics = new OpenGeoportal.Analytics();
	var that = this;

	/**
	 * init function
	 */
	

	this.init = function(){
		this.resizeWindowHandler();
		
		this.searchToggleHandler();
		
		var model = new OpenGeoportal.Models.LeftPanel();
		this.panelView = new OpenGeoportal.Views.LeftPanel({model: model, el: "div#left_col"});

		this.initializeTabs();

		this.loadIndicatorHandler();
		this.requestIndicatorHandler();
		
		jQuery("body").fadeTo('fast', 1);
		
		//dialogs
		this.aboutHandler();
		this.contactHandler();
		this.userHelpHandler();
		
		jQuery("#top_menu > a").on("click", function() {
			analytics.track("Interface", "Reset Page");
		});
		

	};

	this.introFlow = function(hasSharedLayers){
		if (!hasSharedLayers){
			this.showInfoBubble();
		
			var that = this;
			jQuery(".searchBox").on("click", ".searchButton", function(event){
				jQuery("#welcomeBubble").hide("drop");
				that.panelView.model.set({mode: "open"});
				//TODO: either delay or make this a callback
				that.showDirectionsBubble();
				jQuery(this).off( event );
			});

		} else {
			//if there are shared layers, don't show the infobubble intro
			//open the left column panel
			this.panelView.model.set({mode: "open"});
			//set tab to the "cart" tab
			jQuery("#tabs").tabs({active: 1});

		}
	};
	
	this.initializeTabs = function(){
		var that = this;
		jQuery("#tabs").tabs({
			active: 0,
			activate: function( event, ui ) {
				that.appState.set({"currentTab": ui.newTab});
				var label,
				idx = ui.index;

				label = (idx == 1) && "Cart Tab" ||
				(idx == 0) && "Search Tab" ||
				"Getting Started Tab";
				analytics.track("Interface", "Change Tab", label);
			}	

		});
		
		jQuery('#tabs a').bind("mousedown", function(){
			//console.log(jQuery(this));
			var tabImage = jQuery(this).find("img");
			if (tabImage.length > 0){
				tabImage.attr("src", that.utility.getImage("shoppingcart_on.png"));
			} else {
				jQuery('#tabs a img').attr("src", that.utility.getImage("shoppingcart.png"));
			};
		});
	};



	this.aboutHandler = function(){
		jQuery('#about').dialog({
			zIndex: 2999,
			title: "ABOUT",
			resizable: false,
			minHeight: 382,
			minWidth: 473,
			autoOpen: false		
		});
		jQuery("#aboutLink").click(function(){
			jQuery('#about').dialog("open");
			analytics.track("Help", "Show About");
		});
	};

	this.contactHandler = function(){
		jQuery('#contact').dialog({
			zIndex: 2999,
			title: "CONTACT INFORMATION",
			resizable: false,
			minHeight: 222,
			minWidth: 405,
			autoOpen: false		
		});
		jQuery("#contactLink").click(function(){
			jQuery('#contact').dialog("open");
		});
	};

	this.userHelpHandler = function(){
		jQuery('#userGuide').dialog({
			zIndex: 2999,
			title: "USER GUIDE",
			resizable: true,
			height: 425,
			width: 745,
			autoOpen: false		
		});
		jQuery("#userGuideLink").click(function(){
			if (jQuery("#userGuide").length == 0){
				jQuery.get(that.jspfDir + "userGuide.jspf", function(data){
					jQuery("#dialogs").append(data);
					jQuery("#userGuide").dialog({
						zIndex: 2999,
						title: "USER GUIDE",
						resizable: true,
						height: 425,
						width: 745,
						autoOpen: false	
					});
					that.anchorsToNiceScroll("userGuide", {top: -10, left: -30});
					jQuery('#userGuide').dialog("open");
				});
			} else {
				jQuery('#userGuide').dialog("open");
			}
			analytics.track("Help", "Show User Guide");
		});
	};


	this.loadIndicatorHandler = function(){
		var loadIndicator = "#mapLoadIndicator";
		jQuery(document).bind("showLoadIndicator",function(e){
			that.utility.showLoadIndicator(loadIndicator);
		});

		jQuery(document).bind("hideLoadIndicator", function(e){
			that.utility.hideLoadIndicator(loadIndicator);
		});
	};
		
		
	this.requestIndicatorHandler = function(){
		var loadIndicator = "#processingIndicator";
		var that = this;
		jQuery(document).bind("showRequestSpinner",function(e, data){
			var tickerText = "Sending Request...";
			if (typeof data != "undefined" && typeof data.layers != "undefined"){
				tickerText = "Processing " + data.layers;
				if (data.layers > 1){
					tickerText += " layers...";
				} else {
					tickerText += " layer...";
				}
			}
			that.showRequestTicker(tickerText);
			that.utility.showLoadIndicator(loadIndicator, {color: "#000000"});
		});

		jQuery(document).bind("hideRequestSpinner", function(e){
			jQuery("#requestTickerContainer").fadeOut();
			that.utility.hideLoadIndicator(loadIndicator);
		});
	};
	
	this.showRequestTicker = function(tickerText){
		if (jQuery("#requestTickerContainer").length == 0){
			jQuery("body").append('<div id="requestTickerContainer" class="raised"><div id="processingIndicator"></div><div id="requestTicker"></div></div></div>');
		}
		jQuery("#requestTicker").html(tickerText);
		jQuery("#requestTickerContainer").fadeIn();
		
	};
	
	
	this.resizeWindowHandler = function(){
		var rollRightWidth = jQuery("#roll_right").width() + 1;//border
		var headerHeight = jQuery("#header").height();
		var footerHeight = jQuery("#footer").height();
		var fixedHeights = headerHeight + footerHeight + 4;
	
		var minHeight = parseInt(jQuery("#container").css("min-height"));
		var resizeElements = function(){			
			jQuery("#map").width(jQuery("#container").width() - rollRightWidth);//if left_col is visible.  else other siblings width
			//update map size...
			var newContainerHeight = Math.max(jQuery(window).height() - fixedHeights, minHeight);
			jQuery("#container").height(newContainerHeight);
			if (jQuery(".dataTables_scrollBody").length > 0){
				console.log("setting datatables height");
				jQuery(".dataTables_scrollBody").height(newContainerHeight - jQuery(".dataTables_scrollBody").position().top);
			}
		};
		resizeElements();
		jQuery(window).resize(resizeElements);
	};
	

	
	/*this.oldResizeWindowHandler = function(){
		var containerHeight = jQuery(window).height() - jQuery("#header").height() - jQuery("#footer").height() - 2;
		containerHeight = Math.max(containerHeight, 680);
		var containerWidth = jQuery(window).width();//Math.max((Math.floor(jQuery(window).width() * .9)), 1002);
		jQuery('#main').width(containerWidth);
		jQuery('#container').height(containerHeight);
		jQuery('#left_tabs').height(containerHeight);
		jQuery("#left_col").outerWidth(this.getSearchPanelWidth());
		jQuery('#map').width(jQuery("#container").width() - this.getSearchPanelWidth());

		jQuery('#container').resize(function() {
			//OpenGeoportal.map.events.triggerEvent('zoomend');
			jQuery(document).trigger("containerResize");
			//that.mapObject.events.triggerEvent('zoomend');
		});

		jQuery(window).resize(function(){
			var containerHeight = Math.max((jQuery(window).height() - jQuery("#header").outerHeight() - jQuery("#footer").outerHeight()), 680);
			jQuery('#container').height(containerHeight);
			jQuery('#left_tabs').height(containerHeight);
			var containerWidth = jQuery(window).width();
			jQuery('#main').width(containerWidth);
			if (jQuery("#left_col").css("display") == "none"){
				jQuery('#map').outerWidth(jQuery("#container").width() - jQuery("#roll_right").outerWidth());
			} else if (jQuery("#map").css("display") != "none"){
				//jQuery("#left_col").width(OpenGeoportal.ui.searchPanelWidth);
				var mapWidth = jQuery("#container").width() - jQuery("#left_col").outerWidth();
				//var mapZoom = that.mapObject.getZoom();
				var minMapWidth;
				//if (mapZoom == 0){
					minMapWidth = 512;
				//} else {
				//	minMapWidth = 1024;
				//}
				var containerWidth = jQuery("#container").width();
				//console.log("spw: " + that.getSearchPanelWidth());
				var searchPanelWidth = that.getSearchPanelWidth() || (containerWidth - minMapWidth);
				if ((containerWidth - searchPanelWidth) < minMapWidth){
					searchPanelWidth = containerWidth - minMapWidth;
				}

				jQuery("#left_col").outerWidth(searchPanelWidth);
				jQuery('#map').width(containerWidth - searchPanelWidth);
				that.setSearchPanelWidth(searchPanelWidth);


			} else {
				jQuery("#left_col").outerWidth(jQuery("#container").width());
			}

		});
	};*/




	

	

	/*OpenGeoportal.UserInterface.prototype.checkUserInput = function(){
	var that = this;
	var setUserInputFlag = function(){that.mapObject.userMapAction = true;alert("userInputflag set");};
	//jQuery("#map").one("dblclick", setUserInputFlag);
	//jQuery(document).mousedown(setUserInputFlag);

	jQuery("#map").one("mousedown", setUserInputFlag);

};*/




	this.searchToggleHandler = function(){
		var that = this;
		jQuery(".searchToggle").on("click", function(){that.toggleSearch(this);});
	};

	this.toggleSearch = function(thisObj){
		var thisId = jQuery(thisObj).attr('id');
		var hght = jQuery(".searchFormRow").height();
		jQuery(".olControlModPanZoomBar, .olControlPanel, #mapToolBar, #roll_right > .arrow_right").addClass("slideVertical");
		if (thisId == 'moreSearchOptions'){
			jQuery(document).trigger("search.setAdvanced");

			jQuery("#searchForm .basicSearch").hide();
			jQuery("#geosearchDiv").removeClass("basicSearch").addClass("advancedSearch");
			jQuery("#searchForm .advancedSearch.searchRow1").show();

			jQuery('#searchBox').animate(
					{height: "+=" + hght},
					{queue: false, duration: 100, easing: "linear", complete: function(){
						jQuery("#searchForm .advancedSearch.searchRow2").show();
						jQuery('#searchBox').animate(
								{height: "+=" + hght},
								{queue: false, duration: 100, easing: "linear", complete: function(){
									jQuery("#searchForm .advancedSearch.searchRow3").show();
									jQuery('#searchBox').animate(
											{height: "+=" + hght},
											{queue: false, duration: 100, easing: "linear", complete: function(){
												jQuery("#searchForm .advancedSearch.searchRow4").show();
											}
											});
								}});
					}});

			jQuery(".slideVertical").animate({"margin-top": "+=" + hght * 3, duration: 300, easing: "linear"});


		} else if (thisId == 'lessSearchOptions'){
			jQuery(document).trigger("search.setBasic");
			jQuery(".slideVertical").animate({"margin-top": "-=" + hght * 3, queue: false, duration: 300, easing: "linear"});

			jQuery("#searchForm .advancedSearch.searchRow4").hide();
			jQuery('#searchBox').animate(
					{height: "-=" + hght},
					{queue: false, duration: 100, easing: "linear", complete: function(){
						//jQuery(".slideVertical").animate({"margin-top": "-=" + hght, queue: false, duration: 100, easing: "linear"});
						jQuery("#searchForm .advancedSearch.searchRow3").hide();
						jQuery('#searchBox').animate(
								{height: "-=" + hght},
								{queue: false, duration: 100, easing: "linear", complete: function(){
									jQuery("#searchForm .advancedSearch.searchRow2").hide();
									jQuery('#searchBox').animate(
											{height: "-=" + hght},
											{queue: false, duration: 100, easing: "linear", complete: function(){
												//jQuery(".slideVertical").animate({"margin-top": "-=" + hght, queue: false, duration: 100, easing: "linear"});
												jQuery("#geosearchDiv").removeClass("advancedSearch").addClass("basicSearch");
												jQuery("#searchForm .advancedSearch.searchRow1").hide();
												jQuery("#searchForm .basicSearch").show();		
											}
											});
								}});
					}});

		}
	};



	this.mouseCursorHandler = function(){
		var that = this;
		
		jQuery(document).bind('zoomBoxActivated', function(){
			/*
			var mapLayers = that.mapObject.layers;
			for (var i in mapLayers){
				var currentLayer = mapLayers[i];
				if (layerStateObject.layerStateDefined(currentLayer.name)){
					if (layerStateObject.getState(currentLayer.name, "getFeature")){
						//that.mapObject.events.unregister("click", currentLayer, that.mapObject.wmsGetFeature);
						layerStateObject.setState(currentLayer.name, {"getFeature": false});
					}
				} else {
					continue;
				}
			}*/
			
			//jQuery('.attributeInfoControl').attr('src', that.utility.getImage('preview.gif'));
		});
		
		jQuery(document).bind('panActivated', function(){
			jQuery('.olMap').css('cursor', "-moz-grab");
			//jQuery('.attributeInfoControl').attr('src', that.utility.getImage('preview.gif'));
		});
	};

	this.doPrint = function(){
		window.print();
		//jQuery('head > link[href="css/print.css"]').remove();
	};

	this.printImage = function(){
		//just not fast enough to be reliable
		//jQuery('head').append('<link rel="stylesheet" type="text/css" media="print" href="css/print.css" />');
		//setTimeout("OpenGeoportal.ui.doPrint()", 100);	
		window.print();
	};

	this.getImage = function(imageName){
		return this.utility.getImage(imageName);
	};




	this.anchorsToNiceScroll = function(affectedDiv, offsetHash){
		jQuery("#" + affectedDiv + " a.niceScroll").click(function(event){
			event.preventDefault();
			//parse the hrefs for the anchors in this DOM element into toId
			var toId = jQuery(this).attr("href");
			jQuery("#" + affectedDiv).scrollTo(jQuery(toId), {offset: offsetHash });
		});
	};

	
	this.showInfoBubble = function(){
		var welcome = '<div id="welcomeText" class="welcomeText">'
			+ '<h1>Welcome</h1>'
			+ '<p>'
			+ 'There are two ways to begin your search:'
			+	'</p>' 
			+ '<ol>'
			+ '<li>'
			+ 'Enter information using one or both search fields.'
			+ '</li>'
			+ '<li>'
			+ 'Zoom in on a location using the map.'
			+ '</li>'
			+ '</ol>'
			+ '</div>';
		var params = {"height": 335,
					"width": 700,
					"top": 259,
					"left": 269,
					"arrow": "top"};
		this.controls.infoBubble("welcomeBubble", welcome, params);
	};
	

	
	this.showDirectionsBubble = function(){
		var welcome = '<div id="directionsText" class="directionsText">'
			+ '<p>'
			+ "You can preview layers by clicking on the 'View' button."
			+	'</p>' 
			+ '<p>'
			+ "Layers can be added to the 'Cart' by clicking on the + button."
			+ '</p>'
			+ '</div>';
		var params = {"height": 250,
					"width": 600,
					"top": 259,
					"left": 520,
					"arrow": "left"};
		this.controls.infoBubble("directionsBubble", welcome, params);
	};
	
	this.showDowntimeNotice = function(){
		/*downtime notice */
		var downtimeText = "Layers will be unavailable until later this afternoon while we perform server maintenance. We apologize for the inconvenience.";
		var downtimeDiv = '<div id="downtimeNotice" class="dialog infoDialog"><p>' + downtimeText + '</p></div>';
		jQuery("#dialogs").append(downtimeDiv);
		jQuery('#downtimeNotice').dialog({
			zIndex: 2999,
			title: "Downtime",
			resizable: false,
			minWidth: 415,
			autoOpen: false		
		});
		jQuery("#downtimeNotice").dialog("open");
		
	};

};

