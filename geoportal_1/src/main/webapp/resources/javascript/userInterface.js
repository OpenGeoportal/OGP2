/** 
 * This javascript module includes functions for dealing with the user interface.
 * 
 * @author Chris Barnett
 * 
 */

/**
 * create the namespace objects if they don't already exist
 */
if (typeof org == 'undefined'){ 
	org = {};
} else if (typeof org != "object"){
	throw new Error("org already exists and is not an object");
}

// Repeat the creation and type-checking code for the next level
if (typeof org.OpenGeoPortal == 'undefined'){
	org.OpenGeoPortal = {};
} else if (typeof org.OpenGeoPortal != "object"){
    throw new Error("org.OpenGeoPortal already exists and is not an object");
}

org.OpenGeoPortal.UserInterface = function(){
	//default text for the geocoder input box
	this.geocodeText = "Find Place (Example: Boston, MA)";
	//default text for the search input box
	this.searchText = "Search for data layers...";
	
	this.mapObject = org.OpenGeoPortal.map;
	this.resultsTableObject = org.OpenGeoPortal.resultsTableObj;
	this.cartTableObject = org.OpenGeoPortal.cartTableObj;
	this.layerStateObject = org.OpenGeoPortal.layerState;
	this.utility = org.OpenGeoPortal.Utility;
	this.config = org.OpenGeoPortal.InstitutionInfo;
	this.jspfDir = org.OpenGeoPortal.Utility.JspfLocation;
	this.login = new org.OpenGeoPortal.LogIn(this.config.getHomeInstitution());
	this.login.checkLoginStatus();
	var that = this;

	/**
	 * init function
	 */
	this.init = function(){
		jQuery("#tabs").tabs({selected: 1});
		this.togglePanels();
		jQuery('.searchBox').keypress(function(event){
			if (event.keyCode == '13') {
				that.searchSubmit();
			} 
		});
		jQuery("#geosearch").keypress(function(event){
			if (event.keyCode == '13') {
				that.geocodeLocation();
			} else if (jQuery(this).val().trim() == that.geocodeText){
				that.clearInput('geosearchDiv');
			}
		});

		jQuery(document).bind('tabsshow', function(event, ui) {
			var tabObj = that.utility.whichTab();
			switch(tabObj.name){
			case 'search':
				that.filterResults();
				break;
			case 'saved':
				jQuery('#savedLayers').dataTable().fnDraw();
				break;
			}
		});
		//info dialogs
		
		//temporary notice
		var mapitDiv = '<div id="mapitNotice" class="dialog infoDialog"><p>Map It functionality to export your maps directly into GeoCommons is coming soon.</p></div>';
		jQuery("body").append(mapitDiv);
		jQuery('#mapitNotice').dialog({
    		zIndex: 2999,
    		title: "COMING SOON",
    		resizable: false,
    		minWidth: 415,
    		autoOpen: false		
		});
		
		jQuery('#highlights').dialog({
    		zIndex: 2999,
    		title: "HIGHLIGHTS",
    		resizable: true,
    		minWidth: 415,
    		autoOpen: false		
		});
		jQuery("#highlightsLink").click(function(){
			jQuery('#highlights').dialog("open");
		});
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
		});
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
					jQuery("body").append(data);
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
		});
		//buttons
		this.createBasemapMenu();
		this.createDataTypesMenu();
		this.createInstitutionsMenu();
		this.createTopicsMenu();
		this.createSortMenu();
		this.createColumnsMenu();

		jQuery("#basicSearchTextField").val(this.searchText).focus();
		jQuery("#basicSearchTextField").focusin(function(){
			var current = jQuery(this);
		    if (current.val().indexOf(that.searchText) != -1){
				current.val("");
		    }
		});
		jQuery("#basicSearchTextField").click(function(){
			var current = jQuery(this);
		    if (current.val().indexOf(that.searchText) != -1){
				current.val("");
		    }
		});
		jQuery("#basicSearchTextField").keypress(function(){
			var current = jQuery(this);
		    if (current.val().indexOf(that.searchText) != -1){
				current.val("");
		    }
		});
	    //needs to check if the input has focus 
		jQuery("input#geosearch").val(this.geocodeText);
	    jQuery("input#geosearch").hover(function(){
	    				jQuery(this).css("opacity", "1"); 
	    				jQuery(this).data("mouseOverInput", true); 
	    			}, 
	    			function(){
	    				jQuery(this).data("mouseOverInput", false); 
	    				if(!jQuery(this).is(":focus")){
	    					jQuery(this).css("opacity", ".5");
	    				} 
	    			});
	    jQuery("input#geosearch").focusin(function(){
	    	jQuery(this).css("opacity", "1");});
	    jQuery("input#geosearch").focusout(function(){
	    	if(jQuery(this).data("mouseOverInput") !== true){
	    		jQuery(this).css("opacity", ".5");
	    	}});
	    jQuery("input#geosearch").click(function(){that.clearInput("geosearchDiv");});
	    jQuery("#goButton").click(function(){that.geocodeLocation();});
	    this.cartOptionText();
	    //set mouse cursor behavior
		this.mouseCursor();
		this.resizePanels();
		var loadIndicator = "#mapLoadIndicator";
		jQuery(document).on("ajaxSend",loadIndicator, function(e){
			that.utility.showLoadIndicator(jQuery(this).attr("id"), e);
		 });
		
		jQuery(document).on("ajaxComplete", loadIndicator, function(e){
				that.utility.hideLoadIndicator(jQuery(this).attr("id"), e);
			 });

		//'hover' for graphics that are not background graphics
		var zoomPlusSelector = '.olControlModPanZoomBar img[id*="zoomin"]';
		jQuery(document).on("mouseenter", zoomPlusSelector, function(){
			jQuery(this).attr("src", that.utility.getImage("slider_plus_hover.png"));
			//jQuery(this).css("cursor", "pointer");
		});
		
		jQuery(document).on("mouseleave", zoomPlusSelector, function(){
			jQuery(this).attr("src", that.utility.getImage("zoom-plus-mini.png"));
		});
		
		jQuery(document).on("click", zoomPlusSelector, function(){
			that.mapObject.zoomIn();
		});
		
		var zoomMinusSelector = '.olControlModPanZoomBar img[id*="zoomout"]';
		jQuery(document).on("mouseenter", zoomMinusSelector, function(){
			jQuery(this).attr("src", that.utility.getImage("slider_minus_hover.png"));
			//jQuery(this).css("cursor", "pointer");
		});
		
		jQuery(document).on("mouseleave", zoomMinusSelector, function(){
			jQuery(this).attr("src", that.utility.getImage("zoom-minus-mini.png"));
		});
		
		jQuery(document).on("click", zoomMinusSelector, function(){
			that.mapObject.zoomOut();
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
		var containerHeight = jQuery(window).height() - jQuery("#header").height() - jQuery("#footer").height() - 2;
		containerHeight = Math.max(containerHeight, 680);
		var containerWidth = jQuery(window).width();//Math.max((Math.floor(jQuery(window).width() * .9)), 1002);
		jQuery('#main').width(containerWidth);
		jQuery('#container').height(containerHeight);
		jQuery('#left_tabs').height(containerHeight);
		jQuery("#left_col").width(this.getSearchPanelWidth());
		jQuery('#map').width(jQuery("#container").width() - this.getSearchPanelWidth() - 1);
		if (parseInt(jQuery("#map").width()) > 1200) {
			//org.OpenGeoPortal.map.zoomTo(org.OpenGeoPortal.map.getZoom() + 1);
			if (this.mapObject.zoom == 1){
			this.mapObject.zoomTo(2);
			}
		}
		jQuery('#container').resize(function() {
			//org.OpenGeoPortal.map.events.triggerEvent('zoomend');
			that.mapObject.events.triggerEvent('zoomend');
		});
		jQuery(window).resize(function(){
			var containerHeight = Math.max((jQuery(window).height() - jQuery("#header").height() - jQuery("#footer").height() - 2), 680);
			jQuery('#container').height(containerHeight);
			jQuery('#left_tabs').height(containerHeight);
			//map height and search results table height don't get properly changed here
			//org.OpenGeoPortal.Utility.whichTab().tableObject().getTableObj().fnDraw();
			var containerWidth = jQuery(window).width();//Math.max((Math.floor(jQuery(window).width() * .9)), 1002);
			jQuery('#main').width(containerWidth);
			if (jQuery("#left_col").css("display") == "none"){
				jQuery('#map').width(jQuery("#container").width() - 18);
			} else if (jQuery("#map").css("display") != "none"){
				//jQuery("#left_col").width(org.OpenGeoPortal.ui.searchPanelWidth);
				var mapWidth = jQuery("#container").width() - jQuery("#left_col").width() - 1;
				if (mapWidth >= 415){
					jQuery('#map').width(mapWidth);
				} else {
					 jQuery("#left_col").width(jQuery("#container").width() - 415 - 1);
					jQuery('#map').width(415);
					that.setSearchPanelWidth(jQuery("#left_col").width());
				}
				
			} else {
				jQuery("#left_col").width(jQuery("#container").width() - 1);
				that.setSearchPanelWidth(jQuery("#left_col").width());
			}

		});
		//need to test if user has done anything before binding this event
		jQuery(document).bind("eventMoveEnd", function(){
			if (that.utility.whichTab().name == 'search'){
				that.filterResults();
			}
		});
		
		jQuery(document).on('click', '#downloadHeaderCheck', that.toggleChecksSaved);
		jQuery("#headerLogin").click(function(event){that.promptLogin(event);});

		jQuery(document).bind("loginSucceeded", function(){
			that.applyLoginActions();
		});
		/*jQuery(document).ajaxError(function(event, jqXHR, ajaxSettings, thrownError){
			console.log(ajaxSettings);

			if (jqXHR.status == 401){
				//if (ajaxSettings.url.indexOf("authenticate") > -1){
					that.promptLogin();
					jQuery(document).unbind("loginSucceeded.retry");
					jQuery(document).bind("loginSucceeded.retry", function(){
						jQuery.ajax(ajaxSettings);
					});
				//}
			}
			/*console.log(event);
			console.log(jqXHR);
			console.log(ajaxSettings);
			console.log(thrownError);*/
		//});
		//this.checkUserInput();			
		/*jQuery("body").delegate(".ui-dialog-titlebar", "dblclick", function(){
			var id = jQuery(this).parent().children(".dialog").attr("id");
			if (that.isDialogMinimized(id)){
				that.maximizeDialog(id);
			} else {
				that.minimizeDialog(id);
			}
		});*/
	};
	this.init();
};

/**
 * creates the basemap menu from the backgroundMaps object in org.OpenGeoPortal.MapController
 */
org.OpenGeoPortal.UserInterface.prototype.createBasemapMenu = function() {
	//var backgroundMapsConfig = org.OpenGeoPortal.map.backgroundMaps("all");
	var backgroundMapsConfig = this.mapObject.backgroundMaps("all");
	var radioHtml = "";
	for (var mapType in backgroundMapsConfig){
		var isDefault = "";
		//if (mapType == org.OpenGeoPortal.map.getCurrentBackgroundMap()){
		if (mapType == this.mapObject.getCurrentBackgroundMap()){
			isDefault = ' checked="checked"';
		} 
		radioHtml += '<input type="radio" id="basemapRadio' + mapType + '" name="basemapRadio" value="' + mapType + '"' + isDefault + ' onchange="org.OpenGeoPortal.ui.baseMapChanged()" />';
		radioHtml += '<label for="basemapRadio' + mapType + '">' + backgroundMapsConfig[mapType].name + '</label>';
	}
	jQuery("#basemapMenu").html(radioHtml);
	jQuery("[name=basemapRadio]").attr("checked", false);
	//jQuery("[name=basemapRadio]").filter("[value=" + org.OpenGeoPortal.map.getCurrentBackgroundMap() + "]").attr("checked", "checked");
	jQuery("[name=basemapRadio]").filter("[value=" + this.mapObject.getCurrentBackgroundMap() + "]").attr("checked", "checked");
	jQuery("#basemapSelect").button();
	jQuery("#basemapMenu").buttonset();
	jQuery("#basemapDropdown").hover(function(){jQuery("#basemapMenu").show();}, function(){jQuery("#basemapMenu").hide();});
};

/**
 * creates html and behaviours for a css styled dropdown 
 * 
 * @param divId the id of the div element to turn into a styled dropdown
 * @param paramObj .text is the displayed text, .menuHtml is the Html for the dropdown menu
 */
org.OpenGeoPortal.UserInterface.prototype.styledSelect = function(divId, paramObj) {
	var selectElement = jQuery('#' + divId);
	selectElement.addClass("styledDropdown");
	
	var selectHtml = '<button id="' + divId + 'Select" class="styledButton styledSelect" title="' + paramObj.text + '">';
	selectHtml += '<span class="styledSelectText">' + paramObj.text;
	selectHtml += '</span><img class="styledSelectArrow" src="' + this.getImage('arrow_down.png') + '">';
	selectHtml += '</button>';
    selectHtml += '<div id="' + divId + 'Menu" class="styledSelectMenu">';
    selectHtml += paramObj.menuHtml;
    selectHtml += '</div>';
    
    selectElement.html(selectHtml);
    
	jQuery("#" + divId + "Select").button();
	jQuery("#" + divId + "Select .styledSelectText").width(jQuery("#" + divId).width() - jQuery("#" + divId + "Select .styledSelectArrow").width() - 39);
	jQuery("#" + divId + "Menu").buttonset().addClass("raised").hide();
	//jQuery("#sourceCheckMenu").hide();
	selectElement.mouseleave(function(){
		jQuery("#" + divId + "Menu").hide();
		});
	selectElement.click(function(){
		var menu = jQuery("#" + divId + "Menu");
		if (menu.css("display") == "none"){
			menu.show();
		} else {
			menu.hide();
		}
	});
};

/**
 * uses styledSelect to create the menu that allows a user to sort the results table by column name; dynamically created from the table object
 */
org.OpenGeoPortal.UserInterface.prototype.createSortMenu = function() {
	var tableObj = this.utility.whichTab().tableObject();
	var fields = tableObj.tableHeadingsObj.getTableHeadings();
	var defaultField = "Relevancy";
	var menuHtml = "";
	for (var sortIndex in fields){
		if (fields[sortIndex].organize){
			var currentField = fields[sortIndex];
			menuHtml += '<label for="sortDropdownRadio' + currentField.columnConfig.sName + '">';
			menuHtml += currentField.displayName;
			menuHtml += '</label>';
			var checked = "";
			if (currentField.displayName.toLowerCase().trim() == defaultField.toLowerCase()){
				checked += " checked=true";
			}
			menuHtml += '<input type="radio" class="sortDropdownRadio" name="sortDropdownRadio" id="sortDropdownRadio' + currentField.columnConfig.sName + '" value="' + currentField.columnConfig.sName + '"' + checked + ' />';
		}
	}
	var params = {
			"menuHtml": menuHtml,
			"text": defaultField
	};
	this.styledSelect("sortDropdown", params);
	jQuery('.sortDropdownRadio').hide();
	
	var buttonHtml = defaultField; 
	jQuery(".sortDropdownSelect > span > span").html(buttonHtml);
	var that = this;
	jQuery("#sortDropdownMenu span.ui-button-text").bind("click", function(){
		var selectedField = jQuery(this).closest("label").next().val();
		var buttonHtml = fields[selectedField].displayName;
		jQuery("#sortDropdownSelect > span > span").html(buttonHtml);
		that.chooseSort(selectedField);
	});
	jQuery("#sortDropdownSelect").addClass("subHeaderDropdownSelect");
};

/**
 * uses styledSelect to create the menu in advanced search that allows a user to select which institutions to search; dynamically created
 * from info in org.OpenGeoPortal.InstitutionInfo
 */
org.OpenGeoPortal.UserInterface.prototype.createInstitutionsMenu = function() {
	var institutionConfig = org.OpenGeoPortal.InstitutionInfo.getInstitutionInfo();
	var menuHtml = "";
	for (var institution in institutionConfig){
		menuHtml += '<div>';
		menuHtml += '<label for="sourceCheck' + institution + '">';
		var institutionIcon = institutionConfig[institution]["graphics"]["sourceIcon"];
		menuHtml += '<img src="' + institutionIcon["resourceLocation"] + '" alt="' + institutionIcon["altDisplay"]; 
		menuHtml += ' title="' + institutionIcon["tooltipText"] + '"/>';
		menuHtml += institution + '</label>';
		menuHtml += '<input type="checkbox" class="sourceCheck" id="sourceCheck' + institution + '" value="' + institution + '" checked=true />';
		menuHtml += '</div>';
	}
	var params = {
			"menuHtml": menuHtml,
			"text": "Select repositories"
	};
	this.styledSelect("sourceDropdown", params);
	//jQuery("#sourceDropdown .styledSelectMenu").addClass("formCheckbox");
};

/**
 * uses styledSelect to create the menu in advanced search that allows a user to select which data types to search; dynamically created
 * from info in org.OpenGeoPortal.InstitutionInfo
 */
org.OpenGeoPortal.UserInterface.prototype.createDataTypesMenu = function() {
	var dataTypes = org.OpenGeoPortal.InstitutionInfo.icons.dataTypes;
	var menuHtml = "";
	for (var dataTypeIndex in dataTypes){
		menuHtml += '<div>';
		menuHtml += '<label for="dataTypeCheck' + dataTypeIndex + '">';
		menuHtml += '<img src="' + dataTypes[dataTypeIndex]["source"] + '" alt="' + dataTypes[dataTypeIndex]["displayName"]; 
		menuHtml += ' title="' + dataTypes[dataTypeIndex]["displayName"] + '"/>';
		menuHtml += dataTypes[dataTypeIndex]["displayName"] + '</label>';
		menuHtml += '<input type="checkbox" class="dataTypeCheck" id="dataTypeCheck' + dataTypeIndex + '" value="' + dataTypeIndex + '" checked=true/>';
		menuHtml += '</div>';
	}
	var params = {
			"menuHtml": menuHtml,
			"text": "Select data types"
	};
	this.styledSelect("dataTypeDropdown", params);
	//jQuery("#dataTypeDropdown .styledSelectMenu").addClass("formCheckbox");

};

/**
 * uses styledSelect to create the menu in advanced search that allows a user to select an ISO topic to search
 */
org.OpenGeoPortal.UserInterface.prototype.createTopicsMenu = function() {
	var topicCategories = [{"topic":"", "label":"None"},
	                       {"topic":"farming", "label":"Agriculture and Farming"},
	                       {"topic":"biota", "label":"Biology and Ecology"},
	                       {"topic":"boundaries", "label":"Administrative and Political Boundaries"},
	                       {"topic":"climatologyMeteorologyAtmosphere", "label":"Atmospheric and Climatic"},
	                       {"topic":"economy", "label":"Business and Economic"},
	                       {"topic":"elevation", "label":"Elevation and Derived Products"},
	                       {"topic":"environment", "label":"Environment and Conservation"},
	                       {"topic":"geoscientificinformation", "label":"Geological and Geophysical"},
	                       {"topic":"health", "label":"Human Health and Disease"},
	                       {"topic":"imageryBaseMapsEarthCover", "label":"Imagery and Base Maps"},
	                       {"topic":"intelligenceMilitary", "label":"Military"},
	                       {"topic":"inlandWaters", "label":"Inland Water Resources"},
	                       {"topic":"location", "label":"Locations and Geodetic Networks"},
	                       {"topic":"oceans", "label":"Oceans and Estuaries"},
	                       {"topic":"planningCadastre", "label":"Cadastral"},
	                       {"topic":"society", "label":"Cultural, Society, and Demographics"},
	                       {"topic":"structure", "label":"Facilities and Structure"},
	                       {"topic":"transportation", "label":"Transportation Networks"},
	                       {"topic":"utilitiesCommunications", "label":"Utilities and Communication"}
	                       ];
	var menuHtml = "";
	for (var topicIndex in topicCategories){
		var currentTopic = topicCategories[topicIndex];
		menuHtml += '<div>';
		menuHtml += '<label for="topicRadio' + currentTopic.topic + '">';
		menuHtml += currentTopic.label;
		menuHtml += '</label>';
		menuHtml += '<input type="radio" class="topicRadio" name="topicRadio" id="topicRadio' + currentTopic.topic + '" value="' + currentTopic.topic + '"/>';
		menuHtml += '</div>';
	}
	var params = {
			"menuHtml": menuHtml,
			"text": "Select a topic"
	};
	this.styledSelect("topicDropdown", params);
	jQuery('.topicRadio').hide();
	jQuery("#topicDropdownSelect > span > span");
	jQuery("#topicDropdownMenu input[type=radio]").first().attr("checked", true);
	jQuery("#topicDropdownMenu span.ui-button-text").bind("click", function(){
		var selectedField = jQuery(this).closest("label").find("span").text();
		jQuery('.topicRadio').attr("checked", false);
		jQuery(this).closest("label").next().attr("checked", true);
		if (selectedField == "None"){
			selectedField = "Select a topic";
		}
		
		jQuery("#topicDropdownSelect > span > span").html(selectedField);
	});
};

/**
 * uses styledSelect to create the menu above the results table that allows the user to select which columns to display; dynamically created
 * from the table object
 */
org.OpenGeoPortal.UserInterface.prototype.createColumnsMenu = function() {
	var menuHtml = "";
	var tableObj = this.utility.whichTab().tableObject();
	var fields = tableObj.tableHeadingsObj.getTableHeadings();			
	for (var i in fields){
		if (fields[i].organize){
			if(i == "score"){
				continue;
			}
			menuHtml += '<div>';
			menuHtml += '<label for="columnCheck' + i + '">';
			menuHtml += fields[i].displayName + '</label>';
			var checked = "";
			if (fields[i].columnConfig.bVisible){
				checked = ' checked="checked"';
			}
			menuHtml += '<input type="checkbox" class="columnCheck columnVisibility" id="columnCheck' + i + '" value="' + i + '"' + checked + ' />';
			menuHtml += '</div>';
		}
	}
	var params = {
			"menuHtml": menuHtml,
			"text": "Columns"
	};
	this.styledSelect("columnDropdown", params);
	var that = this;
	jQuery("#columnDropdownMenu input.columnCheck").bind("change", function(){
		//alert("changed");
		that.toggleColumn(this);
	});
	/*jQuery("#columnDropdownMenu").bind("mousedown", function(event){
		//IE workaround
		//make the checked attribute match the highlight state
		//if (typeof event.target == 'undefined'){
			var highlightedLabel = jQuery(event.srcElement).parent();
			//var labelId = highlightedLabel.length;
			//jQuery(event.srcElement);
			var thisCheckBox = highlightedLabel.next();
			alert("before:  " + thisCheckBox.attr("checked"));
			//if (highlightedLabel.hasClass("ui-state-active")){
				if (typeof thisCheckBox.attr("checked") != "undefined"){
					thisCheckBox.filter("input").attr("checked", false);
					alert(thisCheckBox.filter("input").attr("checked"));
				//} else {}
			} else {
				//if (typeof thisCheckBox.attr("checked") == "undefined"){
					thisCheckBox.attr("checked", "checked");
				}
				//thisCheckBox.trigger("change");

			//}
		//}
	});*/
	//this.updateOrganize();
	jQuery("#columnDropdownSelect").addClass("subHeaderDropdownSelect");
};

/**
 * function that removes the welcome message from the search tab and shows the search results table
 */
org.OpenGeoPortal.UserInterface.prototype.showSearchResults = function(){
	jQuery("div#welcomeTextSearchTab").remove();	
	jQuery("#resultsSubHeader > span").css("display", "inline");
	jQuery("#resultsSubHeader > div").css("display", "inline-block");

	jQuery("#resultsTable").css("display", "block");
	jQuery("#searchResultsNavigation").css("display", "block");
};

/**
 * checks the state of the map filter
 * 
 * @returns a boolean that is true if the map filter is on
 */
org.OpenGeoPortal.UserInterface.prototype.filterState = function(){
	return jQuery('#basicSearchMapFilter').is(":checked");
};

/**
 * submits a search if the map extent has changed
 */
//also call when switching tabs to a search tab, onchange of mapfilter select boxes
org.OpenGeoPortal.UserInterface.prototype.filterResults = function(){
		//check if extent has changed
	if (this.mapObject.userMapAction){
		if (this.mapObject.extentChanged()){
			if ((this.filterState())&&(jQuery("#map").css("display") != "none")&&(jQuery("#left_col").css("display") != "none")){
				this.searchSubmit();
			}
		}
	}
};

org.OpenGeoPortal.UserInterface.prototype.userInputFlag = false;

/*org.OpenGeoPortal.UserInterface.prototype.checkUserInput = function(){
	var that = this;
	var setUserInputFlag = function(){that.mapObject.userMapAction = true;alert("userInputflag set");};
	//jQuery("#map").one("dblclick", setUserInputFlag);
	//jQuery(document).mousedown(setUserInputFlag);

	jQuery("#map").one("mousedown", setUserInputFlag);

};*/

/**
 * sets the background map to the value in the background map dropdown menu.  called by onchange for the basemap radio button set
 */
org.OpenGeoPortal.UserInterface.prototype.baseMapChanged = function()
{
    var value = jQuery('input:radio[name=basemapRadio]:checked').val();
    //org.OpenGeoPortal.map.setBackgroundMap(value);
    this.mapObject.setBackgroundMap(value);
};

/**
 * geocodes the value typed into the geocoder text input using the Google maps geocoder,
 * then zooms to the returned extent.  also animates the response
 */
org.OpenGeoPortal.UserInterface.prototype.geocodeLocation = function()
{
	var value = jQuery("#geosearch").val();
	geocoder = new google.maps.Geocoder();
	var that = this;
	geocoder.geocode( { 'address': value}, function(results, status) {
		if (status != 'OK'){
			jQuery("#geosearch").val("Place name not found");
		} else {
			jQuery("#geosearch").val(results[0].formatted_address);
			var	maxY = results[0].geometry.viewport.getNorthEast().lat();
			var	maxX = results[0].geometry.viewport.getNorthEast().lng();
			var	minY = results[0].geometry.viewport.getSouthWest().lat();
			var	minX = results[0].geometry.viewport.getSouthWest().lng();
			var extent = minX + "," + minY + "," + maxX + "," + maxY;
			//zooms to actual extent, rather than a latitude delta
			that.mapObject.zoomToLayerExtent(extent);

		}
		var currentFontSize = jQuery("#geosearch").css("font-size");
		var currentOpacity = jQuery("#geosearch").css("opacity");
		jQuery("#geosearch").animate({"opacity": 1, "font-size": parseInt(currentFontSize) + 2}, 500).delay(1500)
			.animate({ "font-size": 0 }, 300, function(){jQuery("#geosearch").val(that.geocodeText).css({"font-size": currentFontSize, "opacity": currentOpacity});} );
        });
};

org.OpenGeoPortal.UserInterface.prototype.clearInput = function(divName){
		jQuery('#' + divName + ' :input').each(function(){
			var type = this.type;
			var tag = this.tagName.toLowerCase();
			if (type == 'text' || type == 'password' || tag == 'textarea'){
				this.value = '';
			} else if (type == 'checkbox' || type == 'radio'){
				this.checked = false;
			} else if (tag == 'select'){
				this.selectedIndex = 0;
			}
		});
};

org.OpenGeoPortal.UserInterface.prototype.clearDefault = function(inputFieldName)
{
    var searchTextElement = document.getElementById(inputFieldName);
    if (searchTextElement == null)
	return;
    var currentValue = searchTextElement.value;
    if (currentValue.indexOf("Search") == 0)
        searchTextElement.value = "";
};

org.OpenGeoPortal.UserInterface.prototype.searchSubmit = function(){
	//console.log("searchSubmit");
	this.resultsTableObject.searchRequest(0);
	this.userInputFlag = true;
};

org.OpenGeoPortal.UserInterface.prototype.getCheckboxValue = function(id){
	var query = "#" + id + ":checked";
	var value = jQuery(query).val();
	if (value)
		value = "on";
	else
		value = "off";
	return value;
};

//really, this should probably go elsewhere
org.OpenGeoPortal.UserInterface.prototype.adjustTableLength = function(tableID){
	var tableID = 'searchResults';
    if (tableID == 'searchResults'){
    	this.resultsTableObject.setTableLength();
    } else {
  	  throw new Error("The specified table is not applicable.");
    }
};

org.OpenGeoPortal.UserInterface.prototype.toggleSearch = function(thisObj){
	var thisID = jQuery(thisObj).attr('id');
	if (thisID == 'moreSearchOptions'){
		  jQuery('#basicSearchBox').animate(
    			  {height: 'hide'},
    			  {queue: false, duration: 0}
    		  );
    		  jQuery('#advancedSearchBox').animate(
    			  {height: 'show'},
    			  {queue: false, duration: 0}
    		  );
	} else if (thisID == 'lessSearchOptions'){
		  jQuery('#basicSearchBox').animate(
    			  {height: 'show'},
    			  {queue: false, duration: 0}
    		  );
    		  jQuery('#advancedSearchBox').animate(
    			  {height: 'hide'},
    			  {queue: false, duration: 0}
    		  );	
	}
	this.resultsTableObject.setTableLength();
};

org.OpenGeoPortal.UserInterface.prototype.searchPanelWidth = 450;

org.OpenGeoPortal.UserInterface.prototype.getSearchPanelWidth = function(){
	return this.searchPanelWidth;
};

org.OpenGeoPortal.UserInterface.prototype.setSearchPanelWidth = function(newValue){
	this.searchPanelWidth = newValue;
};


org.OpenGeoPortal.UserInterface.prototype.togglePanels = function(){
	var that = this;
    	jQuery('.arrow_buttons > img').click( function () {
          var rollUp = that.getImage("button_arrow_up.png");
          var rollDown = that.getImage("button_arrow_down.png");
          var rollLeft = that.getImage("button_arrow_left.png");
          var rollRight = that.getImage("button_arrow_right.png");
          var tabDiv = jQuery(this).parents('.ui-tabs-panel').last();
          var userDiv = tabDiv.find('.searchBox')[0];
          switch (jQuery(this).attr('src')){
          case rollUp: 
        	  jQuery(userDiv).toggle("blind",{},250, function(){that.resultsTableObject.setTableLength();});
        	  jQuery(this).attr('src', rollDown);
          break;
          case rollDown:
				var searchHeight = jQuery(userDiv).height() + parseFloat(jQuery(userDiv).css("padding-top")) + parseFloat(jQuery(userDiv).css("padding-bottom"));
				var searchRowHeight = tabDiv.find('table.display > tbody > tr').first().height() || 23;
				var adjRows = Math.floor(searchHeight/searchRowHeight) * -1;
        	  that.resultsTableObject.adjustTableLength(adjRows);
  			  jQuery(userDiv).toggle("blind",{},250, function(){that.resultsTableObject.setTableLength();});
  			  jQuery(this).attr('src', rollUp);
          break;	
          case rollLeft:
          	//logic to expand map to full size
        	  var panelSelector = jQuery("#left_col");
        	  var mapSelector = jQuery("#map");
        	  if (panelSelector.css("display") == "none"){
        		  //don't do anything; map is already full width
        	  } else if (mapSelector.css("display") == "none"){
        		  //go back to previous left column width; search panels are full width
        		  panelSelector.width(that.getSearchPanelWidth());
        		  panelSelector.css("display", "block");
            	  that.resultsTableObject.hideCol('ContentDate');
        		  mapSelector.width(jQuery('#container').width() - panelSelector.width() - 1);
        		  mapSelector.add("#menu").css("display", "inline-block");
        		  //org.OpenGeoPortal.map.updateSize();
        		  //that.mapObject.updateSize();
        	  } else {
        		  //display full width map
        		  panelSelector.css("display", "none");
        		  jQuery("#roll_right").css("display", "block");
        		  jQuery(".ui-resizable-handle").css("display", "none");
        		  mapSelector.width(jQuery('#container').width() - 18);
        		  //org.OpenGeoPortal.map.updateSize();
        		  //that.mapObject.updateSize();
        	  }
          	break;
          case rollRight:
        	  var panelSelector = jQuery("#left_col");
        	  var mapSelector = jQuery("#map");
        	  if (panelSelector.css("display") == "none"){
        		  //map is full width; go back to combo display
        		  jQuery("#roll_right").css('display', 'none');
        		  jQuery(".ui-resizable-handle").css("display", "block");
        		  panelSelector.width(that.getSearchPanelWidth());
        		  mapSelector.width(jQuery('#container').width() - panelSelector.width() - 1);
            	  //org.OpenGeoPortal.map.updateSize();
        		  //that.mapObject.updateSize();
                  panelSelector.css('display', 'block');
                  that.filterResults();
        	  } else if (mapSelector.css("display") == "none"){
        		  //don't do anything; search panel is already full width
        	  } else {
        		  //go to full width search panel
        		  mapSelector.add("#menu").css("display", "none");
        		  panelSelector.width(jQuery('#container').width() - 1);
            	  that.resultsTableObject.showCol('ContentDate');
        	  }
          	break;
          default:
          	alert('searchBoxResize fall-through.');
          }
    	});
};

org.OpenGeoPortal.UserInterface.prototype.mapFilterStatus = function(eventObj){
	if (jQuery(eventObj).is(":checked")){
		jQuery(".mapFilterFlag").attr("checked", "checked");
	} else {
		jQuery(".mapFilterFlag").removeAttr("checked");
	}

	this.searchSubmit();
};

org.OpenGeoPortal.UserInterface.prototype.chooseSort = function(columnName){
	this.utility.whichTab().tableObject().sortColumns(columnName, false);
};

org.OpenGeoPortal.UserInterface.prototype.toggleColumn = function(thisObj){
	if (jQuery(thisObj).is(':checked')) {
		this.utility.whichTab().tableObject().showCol(jQuery(thisObj).val());
	} else {
		this.utility.whichTab().tableObject().hideCol(jQuery(thisObj).val());
	}
};

org.OpenGeoPortal.UserInterface.prototype.updateSortMenu = function(){
	//these pieces should be also called when updated elsewhere
	var tableObj = this.utility.whichTab().tableObject();

	var organize = tableObj.tableOrganize.getState();

	var fields = tableObj.tableHeadingsObj.getTableHeadings();
	var buttonHtml = fields[organize.organizeBy].displayName;
	jQuery("#sortDropdownSelect > span > span").html(buttonHtml);
	jQuery("#sortDropdownMenu").find("input:radio").each(function(){
		if (jQuery(this).val() == organize.organizeBy){
			jQuery(this).attr("checked", true);
		}
	});

};

//should add to cartTable code
org.OpenGeoPortal.UserInterface.prototype.initSortable = function(){
	var that = this;
	jQuery( "#savedLayers > tbody" ).sortable({helper: "original", opacity: .5, containment: "parent", 
		items: "tr", tolerance: "pointer", cursor: "move",
		start: function(event, ui){
				//this code is ugly...optimize
				jQuery("#savedLayers .resultsControls").each(function(){
					var rowObj = jQuery(this).parent()[0];
					//console.log(rowObj);
					var tableObj = jQuery("#savedLayers").dataTable();
					tableObj.fnClose(rowObj);
					//why doesn't this close the row?
					tableObj.fnDraw(false);
				});
			},
		stop: function(event, ui){
		 		var dataArr = [];
		 		var tableObj = jQuery("#savedLayers").dataTable();
		 		dataArr = tableObj.fnGetData();
		 		var newArr = [];
		 		var openCount = 0;
				jQuery("#savedLayers > tbody > tr").each(function(index, Element){
					var dataTableIndex = tableObj.fnGetPosition(Element);
					if (typeof dataTableIndex == 'number'){
						newArr[index - openCount] = dataArr[dataTableIndex];
					} else {
						openCount += 1;
					}
				});
				tableObj.fnClearTable(false);
				tableObj.fnAddData(newArr);
				var tableLength = newArr.length;
				for (var i in newArr){

					if (typeof that.mapObject.getLayersByName(newArr[i][0])[0] != 'undefined'){
						var layer = that.mapObject.getLayersByName(newArr[i][0])[0];
						that.mapObject.setLayerIndex(layer, tableLength - (i+1));
					}
				}
				
				that.cartTableObject.callbackExpand();
			
			}
	});
};


org.OpenGeoPortal.UserInterface.prototype.openControl = function(thisObj){
	var control = jQuery(thisObj).find("div.controlContainer");
	if (control.css("display") == "none"){
		var offsetRight = control.prev().position().left - (control.width() - control.prev().width()) - 12;
		control.css("left", offsetRight);
		control.css("display", "block");
	}
};

org.OpenGeoPortal.UserInterface.prototype.closeControl = function(thisObj){
	var control = jQuery(thisObj).find("div.controlContainer");
	control.css("display", "none");
};

org.OpenGeoPortal.UserInterface.prototype.toggleChecksSaved = function(eventObj){
		var target = eventObj.target;
		if (jQuery(target).is(':checked')){
			jQuery(target).attr('title', "Unselect All");
			jQuery(".cartCheckBox").each(function(){
				jQuery(this).attr('checked', true);
			});
		} else {
			jQuery(target).attr('title', "Select All");
			jQuery(".cartCheckBox").each(function(){
				jQuery(this).attr('checked', false);	
			});
		}
};

org.OpenGeoPortal.UserInterface.prototype.updateSavedLayersNumber = function(){
	jQuery('.savedLayersNumber').text('(' + this.cartTableObject.numberOfResults() + ')');
};

org.OpenGeoPortal.UserInterface.prototype.isRaster = function(dataType){
	//console.log(dataType);
	dataType = dataType.toLowerCase();
	//console.log(dataType);
	if ((dataType == "raster")||(dataType == "paper map")){
		return true;
	} else {
		return false;
	}
};

org.OpenGeoPortal.UserInterface.prototype.isVector = function(dataType){
	//console.log(dataType);
	dataType = dataType.toLowerCase();
	//console.log(dataType);
	if ((dataType == "line")||(dataType == "point")||(dataType == "polygon")){
		return true;
	} else {
		return false;
	}
};

org.OpenGeoPortal.UserInterface.prototype.downloadDialog = function(){
	//first, check to see if anything is in savedLayers & checked
	var layerList = this.getLayerList("download");

	var dialogContent = "";
	var counter = 0;
	for (var i in layerList){
		counter++;
	}
    if (counter == 0){
    	dialogContent = 'No layers have been selected.';
    } else {
    	//this should probably call a dialog instance for error messages/notifications

    	//generate a list of appropriate choices for the chosen layers
    	//for now a best guess;  at some point, we might be able to do something clever
    	//by looking at the download config file.
    	var showVectorControl = false;
    	var showRasterControl = false;
    	for (var layerId in layerList){
    		if (this.requiresEmailAddress(layerList[layerId])){
    			needEmailInput = true;
    		}
    		var dataType = layerList[layerId].dataType;
    		if (this.isVector(dataType)){
    			showVectorControl = true;
    			continue;
    		}
    		if (this.isRaster(dataType)){
    			showRasterControl = true;
    			continue;
    		}
    	}
    	var vectorControl = "<label for=\"vectorDownloadType\" class=\"downloadSelect\">Vector files</label>";
    	vectorControl += "<select id=\"vectorDownloadType\" class=\"downloadSelect\"> \n";
    	vectorControl += "<option value=\"shp\">shapefile</option> \n";
    	vectorControl += "<option value=\"kmz\">KMZ</option> \n";
    	vectorControl += "</select><br/> \n";
    	var rasterControl = "<label for=\"rasterDownloadType\" class=\"downloadSelect\">Raster files</label>";
    	rasterControl += "<select id=\"rasterDownloadType\" class=\"downloadSelect\"> \n";
    	rasterControl += "<option value=\"GeoTIFF\">GeoTiff</option> \n";
    	rasterControl += '<option value="kmz">KMZ</option> \n';
    	rasterControl += "</select><br/> \n";
    	var clipControl = '<input id="checkClip" type="checkbox" checked="checked" /><label for="checkClip" id="checkClipLabel">Clip data to map extent</label><br/> \n';
    	//var emailInput = '<label for="emailAddress">Enter your email address:</label><input id="emailAddress" type="text" /> </br>\n';
    	var formatLabel = "<span>Select format for:</span><br />\n";
    	if (showVectorControl || showRasterControl){
    		dialogContent += formatLabel;
        	if (showVectorControl){
        		dialogContent += vectorControl;
        	}
        	if (showRasterControl){
        		dialogContent += rasterControl;
        	}
    		dialogContent += clipControl;

    	} else {
    		dialogContent += "The selected layers have an invalid data type and can not be downloaded.";
    	}
    }
    
    var that = this;
    var params = {
    		zIndex: 3000,
    		autoOpen: false,
    		minHeight: '30px',
    		width: 300,
    		title: "DOWNLOAD SETTINGS",
    		resizable: false,
    		modal: true
		};
    if (typeof jQuery('#downloadDialog')[0] == 'undefined'){
    	var downloadDiv = '<div id="downloadDialog" class="dialog downloadSettingsDialog"> \n';
        downloadDiv += dialogContent;
        downloadDiv += '</div> \n';
    	jQuery('body').append(downloadDiv);
    } else {
    	//replace dialog text/controls & open the instance of 'dialog' that already exists
		  jQuery("#downloadDialog").html(dialogContent);
			jQuery("#downloadDialog").dialog( "option", "disabled", false );
	}
	jQuery("#downloadDialog").dialog(params);
	var buttons;
	if (counter == 0){
		buttons = {
			Cancel: function() {
				jQuery(this).dialog('close');
				jQuery("#optionDetails").html("");
				jQuery(".downloadSelection, .downloadUnselection").removeClass("downloadSelection downloadUnselection");
			}
		};
	} else {
		buttons = {
			Continue: function() {
				that.downloadContinue();
			},
			Cancel: function() {
				jQuery(this).dialog('close');
				jQuery("#optionDetails").html("");
				jQuery(".downloadSelection, .downloadUnselection").removeClass("downloadSelection downloadUnselection");
			}
		};
	}
	jQuery("#downloadDialog").dialog("option", "buttons", buttons);
	jQuery("#downloadDialog").dialog('open');
};

org.OpenGeoPortal.UserInterface.prototype.downloadContinue = function(){
	var clipped = this.isClipped();
	var vectorFormat = jQuery("#vectorDownloadType").val();
	var rasterFormat = jQuery("#rasterDownloadType").val();
	var arrBbox = [];
	var layerObj;
	if (clipped){
		//if this is true, we should also make sure that part or all of the requested layer is in the extent
		//if not, it should be excluded
		//arrBbox = org.OpenGeoPortal.map.getGeodeticExtent().toArray();
		arrBbox = this.mapObject.getGeodeticExtent().toArray();
		layerObj = this.getLayerList("download", {clipped: arrBbox});
	} else {
		arrBbox = [-180,-90,180,90];
		layerObj = this.getLayerList("download");
	}
	var layerIds = [];
	var needEmailInput = 0;
	var layerNumber = 0;
	for (var layer in layerObj){
		layerNumber++;
		if ((this.requiresEmailAddress(layerObj[layer]))&&(rasterFormat.toLowerCase() != "kmz")){
			needEmailInput++;
		}
		if (this.isVector(layerObj[layer].dataType)){
			layerIds.push(layer + "=" + vectorFormat);
		} else if (this.isRaster(layerObj[layer].dataType)){
			layerIds.push(layer + "=" + rasterFormat);
		}
	}
	var requestObj = {};
	if (arrBbox.length > 0){
		requestObj.bbox = arrBbox.join();
	}
	//requestObj.format = fileFormat;
	requestObj.layers = layerIds;
	
	//first, check to see if anything is in savedLayers & checked
	var that = this;
	pluralSuffix = function(totalNumber){
		var plural;
		if (totalNumber > 1){
			plural = "s";
		} else {
			plural = "";
		}
		return plural;
	};
	var downloadContinue = '<div>You have selected ' + layerNumber + ' layer' + pluralSuffix(layerNumber) + ' for download.</div>\n';
	var addEmail = "";
	if (needEmailInput > 0){
		addEmail += '<div><label for="emailAddress">You have selected Harvard raster data. Please enter your email to receive a download link:</label><br />\n';
    	addEmail += '<input id="emailAddress" type="text" /></div>\n';
    	addEmail += '<span id="emailValidationError" class="warning"></span>';

	}
    if ((layerNumber - needEmailInput) > 0){
    	downloadContinue += '<div>A zip file will be generated. \n';
    	downloadContinue += 'It may take up to 10 minutes to process your file.<br /> \n';
    	downloadContinue += '<span class="notice">Do not close the GeoData website.</span></div>\n';
    }
    downloadContinue += addEmail;
	  jQuery("#downloadDialog").html(downloadContinue);
	  jQuery("#downloadDialog").dialog({title: "DOWNLOAD",
		  	width: 350,
			buttons: {
				Download: function() {
		  			requestObj.layerNumber = layerNumber;
		  			var emailAddress = "";
					if (needEmailInput > 0){
						emailAddress = jQuery("#emailAddress").val();
						if (!that.checkAddress(emailAddress)){
							var warningText = 'You must enter a valid email address.';
							jQuery("#emailValidationError").html(warningText);
							return;
						}
					}
					requestObj.email = emailAddress;
	    			that.toProcessingAnimation(jQuery(this).parent().find("button").first());
	    			that.requestDownload(requestObj);
				},
				Cancel: function() {
					jQuery(this).dialog('close');
					jQuery("#optionDetails").html("");
					jQuery(".downloadSelection, .downloadUnselection").removeClass("downloadSelection downloadUnselection");
				}
			}});
	  jQuery("#emailAddress").focus();
};

org.OpenGeoPortal.UserInterface.prototype.checkAddress = function(emailAddress){
	var stringArray = emailAddress.split("@");
	if (stringArray.length < 2) {
		return false;
	} else {
		var domainArray = stringArray[1].split(".");
		var userString = stringArray[0];
		if (domainArray.length < 2) {
			return false;
		} else if ((domainArray[0].length + domainArray[1].length + userString.length) < 3){
			return false;
		} 
	}
	return true;
	
};

org.OpenGeoPortal.UserInterface.prototype.isClipped = function(){
	if (jQuery('#checkClip').is(':checked')){
		return true;
	} else {
		return false;
	}
};

org.OpenGeoPortal.UserInterface.prototype.requestDownloadSuccess = function(data){
	//this will simply be a request ID.  add it to the  request queue.
	org.OpenGeoPortal.downloadQueue.registerLayerRequest(data.requestId);
	
	//will also have status info for requested layers in this returned object
	/*var line = "";
	for (var failedToDownload in data.failed){
		line += "<tr>";
		//for (var infoElement in data.failed[failedToDownload]){
			line += "<td>";
			line += '<span class="ui-icon ui-icon-alert" style="float:left; margin:0 7px 20px 0;"></span>';
			line += "</td>";
			line += "<td>";
			line += data.failed[failedToDownload]["institution"];
			line += "</td>";						
			line += "<td>";
			line += data.failed[failedToDownload]["title"];
			line += "</td>";						
			line += "<td>";
			line += data.failed[failedToDownload]["layerId"];
			line += "</td>";
			line += '<td><span class="warning">';
			line += data.failed[failedToDownload]["message"];
			line += "</span></td>";
		//}
		line += "</tr>";
	}
	if (line.length > 0){
		var message = '<table class="downloadStatus">';
		message += line;
		message += "</table>";
		this.genericModalDialog(message, "DOWNLOAD ERRORS");
	}
	if (data.succeeded.length > 0){
		//check packageLink
		if (typeof data.packageLink != 'undefined'){
			jQuery("body").append('<iframe style="display:none" src="' + data.packageLink + '"></iframe>');
		}
		var line = "";
		for (var successful in data.succeeded){
			if (data.succeeded[successful].disposition == "LINK_EMAILED"){
				line += "<tr>";
				line += "<td>";
				line += data.succeeded[successful]["institution"];
				line += "</td>";						
				line += "<td>";
				line += data.succeeded[successful]["title"];
				line += "</td>";						
				//line += "<td>";
				//line += data.succeeded[successful]["layerId"];
				//line += "</td>";
				//line += "<td>";
				//line += data.succeeded[successful]["message"];
				//line += "</td>";
				line += "</tr>";
			}
		}
		
		if (line.length > 0){
			var message = "<p>A link for the following layers was emailed to '" + requestObj.email + "'.  ";
			message += '<span class="notice">It may take up to 10 minutes to receive the email.</span></p>'; 
			message += '<table class="downloadStatus">';
			message += line;
			message += "</table>";
			this.genericModalDialog(message, "LAYERS EMAILED");
		}
	}*/

};

org.OpenGeoPortal.UserInterface.prototype.requestDownload = function(requestObj){
	var that = this;
	jQuery("#downloadDialog").dialog( "option", "disabled", true );
	if (typeof _gaq != "undefined")
		_gaq.push(["_trackEvent", "download", requestObj.layerNumber]);
	delete requestObj.layerNumber;
	var params = {
			url: "requestDownload",
			data: requestObj,
			dataType: "json",
			type: "POST",
			//traditional: true,
			context: this,
			complete: function(){
				var noSelectionHtml = "";
				jQuery("#optionDetails").html(noSelectionHtml);
				jQuery(".downloadSelection, .downloadUnselection").removeClass("downloadSelection downloadUnselection");
			},
			success: function(data){org.OpenGeoPortal.downloadQueue.registerLayerRequest(data.requestId, requestObj);}
	};
	//close the download box;
	jQuery("#downloadDialog").dialog("close");
	jQuery.ajax(params);
};

org.OpenGeoPortal.UserInterface.prototype.genericModalDialog = function(customMessage, dialogTitle){

	var divId = "genericModalDialog" + jQuery('.genericModalDialog').size();
		var div = '<div id="' + divId + '" class="dialog genericModalDialog">';
		div += customMessage;
		div += '</div>';
		jQuery('body').append(div);

		jQuery('#' + divId).dialog({
    		zIndex: 2999,
    		title: dialogTitle,
    		resizable: true,
    		modal: true,
    		minWidth: 415,
    		autoOpen: false		
		});
		
	jQuery('#' + divId).dialog('open');
	return divId;
};

org.OpenGeoPortal.UserInterface.prototype.requiresEmailAddress = function(layerObject){
	if ((layerObject.institution == "Harvard")&&(this.isRaster(layerObject.dataType))){
		return true;
	} else {
		return false;
	}
};

org.OpenGeoPortal.UserInterface.prototype.IgnoreAuthenticationWarning = {"home": false, "external": false};


org.OpenGeoPortal.UserInterface.prototype.authenticationWarning = function(checkboxObj, rowData, canLogin){

	var that = this;
	var institution = rowData[this.cartTableObject.tableHeadingsObj.getColumnIndex("Institution")];
	var ignoreWarningId = "ignoreAuthenticationWarning";
	var disposition;
	var warningMessage = '<span>This layer is restricted by licensing agreement to the ' + institution + ' community. </span>';
	if (canLogin){
		if (this.IgnoreAuthenticationWarning.home){
			this.cartTableObject.addToCart(checkboxObj, rowData);
			return;
		}
		warningMessage += '<span class="notice">Restricted layers can be added to the Cart, but you must login before you can preview or download restricted layers.</span>'; 
		ignoreWarningId += "Internal";
		disposition = "home";
	} else {
		if (this.IgnoreAuthenticationWarning.external){
			this.cartTableObject.addToCart(checkboxObj, rowData);
			return;
		}
		warningMessage += '<span class="notice">Restricted layers can be added to the Cart here, but you must use ' + institution;
		warningMessage += "'s site and login to preview or download restricted layers.</span>"; 
		ignoreWarningId += "External";
		disposition = "external";
	}

	warningMessage += "<br />";
	warningMessage += '<span class="ignoreWarning"><input id="ignoreAuthenticationWarning" type="checkbox" /><label for="ignoreAuthenticationWarning">Don\'t show this message again.</span>';

	var divId = this.genericModalDialog(warningMessage, "RESTRICTED LAYER");
	
	var addToCartFunction = function() {
 		that.IgnoreAuthenticationWarning[disposition] = jQuery("#" + ignoreWarningId).is(":checked");
		jQuery(this).dialog('close');
		that.cartTableObject.addToCart(checkboxObj, rowData);
	};
	
	var loginAndAddFunction = function(){
		that.IgnoreAuthenticationWarning[disposition] = jQuery("#" + ignoreWarningId).is(":checked");
		that.promptLogin();
	
		//pass some info to the loginDialog
		jQuery(this).dialog('disable');
		var dialogBox = jQuery(this);
		jQuery(document).bind("loginSuccess", function(){
			that.cartTableObject.addToCart(checkboxObj, rowData);
			dialogBox.dialog('close');
		});
		jQuery(document).bind("loginCancel", function(){
			dialogBox.dialog("enable");
		});
	};
	
	var cancelFunction = function(){
	 	that.IgnoreAuthenticationWarning[disposition] = jQuery("#" + ignoreWarningId).is(":checked");
	 	jQuery(this).dialog('close');
	 	//some code to deselect the layer check box;
	 	jQuery(checkboxObj).attr("checked", false);
 	};
 	
	var buttons = {};
	if (canLogin){
		buttons["Login & Add"] = loginAndAddFunction;
		buttons["Add Only"] = addToCartFunction;
		buttons["Cancel"] = cancelFunction;
	} else {
		buttons["Add"] = addToCartFunction;
		buttons["Cancel"] = cancelFunction;
	}
	
	jQuery('#' + divId).dialog(	
			{width: 535,
				buttons: buttons
			}
	);
	
	
};

org.OpenGeoPortal.UserInterface.prototype.availableLayerLogic = function(action, rowData){
	switch (action){
	case "mapIt":
		//public vector layers only.
		var institution = rowData[this.cartTableObject.tableHeadingsObj.getColumnIndex('Institution')].toLowerCase();
		var access = rowData[this.cartTableObject.tableHeadingsObj.getColumnIndex('Access')].toLowerCase();
		var dataType = rowData[this.cartTableObject.tableHeadingsObj.getColumnIndex('DataType')].toLowerCase();

		if (access != "public"){
			return false;
		} else {
			if (this.isVector(dataType)){
				return true;
			} else {
				return false;
			}
		}
		break;
	case "removeFromCart":
		return true;
		break;
	case "shareLink":
		return true;
		break;
	case "download":
		//no external restricted layers, no local restricted layers if not logged in. 
		var institution = rowData[this.cartTableObject.tableHeadingsObj.getColumnIndex('Institution')].toLowerCase();
		var access = rowData[this.cartTableObject.tableHeadingsObj.getColumnIndex('Access')].toLowerCase();
		var dataType = rowData[this.cartTableObject.tableHeadingsObj.getColumnIndex('DataType')].toLowerCase();
		if (dataType == "libraryrecord"){
			return false;
		}
		if (access == "public"){
			return true;
		} else if (institution != org.OpenGeoPortal.InstitutionInfo.getHomeInstitution().toLowerCase()){
			return false;
		} else if (this.login.isLoggedIn()){
			return true;
		} else {
			return false;
		}
		break;
	case "webService":
		//public layers only.  right now, only Tufts.
		var institution = rowData[this.cartTableObject.tableHeadingsObj.getColumnIndex('Institution')].toLowerCase();
		var access = rowData[this.cartTableObject.tableHeadingsObj.getColumnIndex('Access')].toLowerCase();
		var dataType = rowData[this.cartTableObject.tableHeadingsObj.getColumnIndex('DataType')].toLowerCase();
		if (dataType == "libraryrecord"){
			return false;
		}
		if ((institution != "mit")||(access != "public")){
			return false;
		} else {
			return true;
		}
		break;
	}
	return false;
};

org.OpenGeoPortal.UserInterface.prototype.getLayerList = function(downloadAction, params){
	if (arguments.length < 2){
		params = {};
		params.clipped = false;
	}
	jQuery(".downloadSelection").removeClass("downloadSelection");
	jQuery(".downloadSelection").removeClass("downloadUnselection");

	var layerInfo = {};
	var tableObj = jQuery("#savedLayers").dataTable();
	var checkedRows = jQuery(".cartCheckBox:checked");
	var that = this;
	checkedRows.each(function(){
		var rowNode = jQuery(this).closest('tr');
		var aPos = tableObj.fnGetPosition(rowNode[0]);
		var aData = tableObj.fnGetData(aPos);
		var headingsObj = that.cartTableObject.tableHeadingsObj;
		var minX = aData[headingsObj.getColumnIndex('MinX')];
		var minY = aData[headingsObj.getColumnIndex('MinY')];
		var maxX = aData[headingsObj.getColumnIndex('MaxX')];
		var maxY = aData[headingsObj.getColumnIndex('MinY')];
		var isValidLayer = that.availableLayerLogic(downloadAction, aData);
		if (params.clipped != false){
			//do a test to see if the layer's bbox is within the clip extent
			var layerBounds = new OpenLayers.Bounds();
			layerBounds.extend(new OpenLayers.LonLat(minX,minY));
			layerBounds.extend(new OpenLayers.LonLat(maxX,maxY));

			var clipBounds = new OpenLayers.Bounds();
			clipBounds.extend(new OpenLayers.LonLat(params.clipped[0],params.clipped[1]));
			clipBounds.extend(new OpenLayers.LonLat(params.clipped[2],params.clipped[3]));
			//this isn't working yet
			//isValidLayer = layerBounds.intersectsBounds(clipBounds);
		}
		if (isValidLayer){
			that.cartTableObject.downloadActionSelectRow(aPos, true);
			var layerID = aData[headingsObj.getColumnIndex('LayerId')];
			//console.log(layerID);
			layerInfo[layerID] = {};
			layerInfo[layerID].name = aData[headingsObj.getColumnIndex('Name')];
			layerInfo[layerID].institution = aData[headingsObj.getColumnIndex('Institution')];
			layerInfo[layerID].dataType = aData[headingsObj.getColumnIndex('DataType')];
			layerInfo[layerID].access = aData[headingsObj.getColumnIndex('Access')];
			layerInfo[layerID].bounds = [minX, minY, maxX, maxY];
		} else {
			that.cartTableObject.downloadActionSelectRow(aPos, false);
		}
	});
	return layerInfo;
};

//org.OpenGeoPortal.UserInterface.prototype.downloadFromMapServer = function(requestObj) {
	//modularize wms call so I can use the same code for 'save image'
	/*if (!jQuery("#attachment")[0]){
		jQuery("body").append('<div id="attachment" style="display:none;"></div>');
	}*/
	//var url = "WMSGetMapProxy.jsp?server=" + requestObj.server + '&format=' + requestObj.format + '&bbox=' + requestObj.bbox;
	/*var url = "getImage?server=" + requestObj.server + '&format=' + requestObj.format + '&bbox=' + requestObj.bbox;
	url += '&srs=' + requestObj.srs + '&layers=' + requestObj.layers;
	url += '&width=' + requestObj.width + '&height=' + requestObj.height + '&type=' + requestObj.type;
	if (typeof requestObj.sld != 'undefined'){
		url += '&sld=' + requestObj.sld;
	}
	jQuery("#downloadDialog").dialog("close");
	var downloadFrameId;
	do {
		downloadFrameId = "downloadFrame" + parseInt(Math.random() * 10000);
	} while (jQuery("#" + downloadFrameId).length > 0)
		var that = this;
	this.utility.showLoadIndicator("mapLoadIndicator", downloadFrameId);
	jQuery("body").append('<iframe id="' + downloadFrameId + '" style="display:none" src="' + url + '"></iframe>');
	jQuery("#" + downloadFrameId).bind("load", function(e){
		that.utility.hideLoadIndicator("mapLoadIndicator", downloadFrameId);
	});*/
//};

org.OpenGeoPortal.UserInterface.prototype.doPrint = function(){
	window.print();
	//jQuery('head > link[href="css/print.css"]').remove();
};

org.OpenGeoPortal.UserInterface.prototype.printImage = function(){
	//just not fast enough to be reliable
	//jQuery('head').append('<link rel="stylesheet" type="text/css" media="print" href="css/print.css" />');
	//setTimeout("org.OpenGeoPortal.ui.doPrint()", 100);	
	window.print();
};


org.OpenGeoPortal.UserInterface.prototype.toProcessingAnimation = function($fromObj){
	jQuery("#requestTickerContainer").show();
	var options = { to: "#requestTickerContainer", className: "ui-effects-transfer"};
	$fromObj.effect( "transfer", options, 500, function(){
		//org.OpenGeoPortal.ui.updateSavedLayersNumber();
	});
};

org.OpenGeoPortal.UserInterface.prototype.saveImage = function(imageFormat, resolution){
	imageFormat = 'png';
	var format;
	switch (imageFormat){
	case 'jpeg':
		format = "image/jpeg";
		break;
	case 'png':
		format = "image/png";
		break;
	case 'bmp':
		format = "image/bmp";
		break;
	default: throw new Error("This image format (" + imageFormat + ") is unavailable.");
	}
	
	var requestObj = {};
	requestObj.layers = [];

    for (var layer in this.mapObject.layers){
    	var currentLayer = this.mapObject.layers[layer];
    	if (currentLayer.CLASS_NAME != "OpenLayers.Layer.WMS"){
    		continue;
    	}
    	if (currentLayer.visibility == false){
    		continue;
    	}
    	
    	var sld = this.layerStateObject.getState(currentLayer.name, "sld");
		var opacity = this.layerStateObject.getState(currentLayer.name, "opacity");
    	if (opacity == 0){
    		continue;
    	}
		//insert this opacity value into the sld to pass to the wms server
    	var layerObj = {};
		var storedName = this.layerStateObject.getState(currentLayer.name, "wmsName");
		if (storedName == ''){
			layerObj.name = currentLayer.params.LAYERS;
		} else {
			layerObj.name = storedName;
		}
		layerObj.opacity = opacity;
		layerObj.zIndex = this.mapObject.getLayerIndex(currentLayer);
		if ((typeof sld != 'undefined')&&(sld !== null)&&(sld != "")){
			var sldParams = [{wmsName: layerObj.name, layerStyle: sld}];
			//layerObj.sld = escape(this.mapObject.createSLDFromParams(sldParams));
			layerObj.sld = this.mapObject.createSLDFromParams(sldParams);
		}
   		layerObj.layerId = currentLayer.name;
		requestObj.layers.push(layerObj);
    }
    
	var bbox;
	bbox = this.mapObject.getExtent().toBBOX();
	
	requestObj.format = format;
	requestObj.bbox = bbox;
	requestObj.srs = 'EPSG:900913';
	requestObj.width = jQuery('#map').width();
	requestObj.height = jQuery('#map').height();
	//return a url from the servlet
	var params = {
			url: "requestImage",
			data: JSON.stringify(requestObj),
			dataType: "json",
			type: "POST",
			context: this,
			complete: function(){
			},
			success: function(data){
				org.OpenGeoPortal.downloadQueue.registerImageRequest(data.requestId, requestObj);

				//should parse errors
				//will also have status info for requested layers in this returned object
				/*var line = "";
				for (var failedToDownload in data.errors){
					line += "<tr>";
					//for (var infoElement in data.failed[failedToDownload]){
						line += "<td>";
						line += '<span class="ui-icon ui-icon-alert" style="float:left; margin:0 7px 20px 0;"></span>';
						line += "</td>";
						line += "<td>";
						//line += data.failed[failedToDownload]["institution"];
						line += "</td>";						
						line += "<td>";
						//line += data.failed[failedToDownload]["title"];
						line += "</td>";						
						line += "<td>";
						//line += data.failed[failedToDownload]["layerId"];
						line += "</td>";
						line += '<td><span class="warning">';
						//line += data.failed[failedToDownload]["message"];
						line += "</span></td>";
					//}
					line += "</tr>";
				}
				if (line.length > 0){
					var message = '<table class="downloadStatus">';
					message += line;
					message += "</table>";
					this.genericModalDialog(message, "DOWNLOAD ERRORS");
				}*/
					//check packageLink
				/*if (typeof data.imageLink != 'undefined'){
						var downloadFrameId;
						do {
							downloadFrameId = "downloadFrame" + parseInt(Math.random() * 10000);
						} while (jQuery("#" + downloadFrameId).length > 0)
						var that = this;
						this.utility.showLoadIndicator("mapLoadIndicator", downloadFrameId);
						jQuery("body").append('<iframe id="' + downloadFrameId + '" style="display:none" src="' + data.imageLink + '"></iframe>');
						jQuery("#" + downloadFrameId).bind("load", function(e){
							that.utility.hideLoadIndicator("mapLoadIndicator", downloadFrameId);
						});
				}*/

				
			}
	};

	jQuery.ajax(params);
	this.toProcessingAnimation(jQuery("#map_tabs > span").first());


};

//based on Dave's code
org.OpenGeoPortal.UserInterface.prototype.getParamsFromUrl = function() {
	var params = {};
    var layers = [], hash;
    var hashes = window.location.href.slice(window.location.href.indexOf('?') + 1).split('&');
    for(var i = 0; i < hashes.length; i++) {
        hash = hashes[i].split('=');
        if ((hash[0] == "layer%5B%5D")||(hash[0] == "layer[]")){
        	layers.push(hash[1]);
        } else {
        	params[hash[0]] = hash[1];
        }
    }
    if (layers.length > 0){
    	params.layer = layers;
    }
    return params;
};

org.OpenGeoPortal.UserInterface.prototype.addSharedLayersToCart = function(){
	var params = this.getParamsFromUrl();

	if (typeof params.layer == 'undefined'){
		return;
	}
    var solr = new org.OpenGeoPortal.Solr();
	var query = solr.getInfoFromLayerIdQuery(params.layer);
	solr.sendToSolr(query, this.getLayerInfoJsonpSuccess, this.getLayerInfoJsonpError, this);
	var sharedExtent = params.minX + ',' + params.minY + ',' + params.maxX + ',' + params.maxY;
	this.mapObject.zoomToLayerExtent(sharedExtent);
	jQuery("#tabs").tabs({selected: 2});
	this.initSortable();
};

org.OpenGeoPortal.UserInterface.prototype.getLayerInfoJsonpSuccess = function(data, newContext){
	//wrong context? not sure
	newCartData = newContext.cartTableObject.processData(data);
	for(var i in newCartData){
		newContext.addLayerToCart(newCartData[i]);
	}
};

org.OpenGeoPortal.UserInterface.prototype.getLayerInfoJsonpError = function(){
	  throw new Error("The attempt to retrieve layer information from layerIDs failed.");
};
//solr query against layerIds
//process data functions, pass to this function
org.OpenGeoPortal.UserInterface.prototype.addLayerToCart = function(layerData){
	var savedTable = jQuery('#savedLayers').dataTable();
	var currentData = savedTable.fnGetData();
	layerData = [layerData];
	var newData = layerData.concat(currentData);
	savedTable.fnClearTable();
	savedTable.fnAddData(newData);
	this.updateSavedLayersNumber();
	//jQuery('#savedLayersNumber').text('(' + org.OpenGeoPortal.cartTableObject.numberOfResults() + ')');
	//console.log(layerData);
	var headingsObj = this.cartTableObject.tableHeadingsObj;
	var layerID = layerData[0][headingsObj.getColumnIndex('LayerId')];
	var dataType = layerData[0][headingsObj.getColumnIndex('DataType')];
    if (!this.layerStateObject.layerStateDefined(layerID)){
    	this.layerStateObject.addNewLayer(layerID, {"dataType": dataType, "inCart": true});
    } else {
    	this.layerStateObject.setState(layerID, {"inCart": true});
    }
};

org.OpenGeoPortal.UserInterface.prototype.shortenLink = function(longLink){
	var request = {"link": longLink};
	var url = "shortenLink";
	var that = this;
	var ajaxArgs = {url: url, 
			data: jQuery.param(request),
			type: "GET", 
			dataType: "json",
			success: function(data){
				var shortLink = data["shortLink"];
				jQuery("#shareText").attr("rows", that.calculateRows(shortLink));
				jQuery("#shareDialog").dialog('open');
				jQuery("#shareText").text(shortLink).focus();} 
		};
	
	jQuery.ajax(ajaxArgs);
};

org.OpenGeoPortal.UserInterface.prototype.calculateRows = function(theText){
	var numCharacters = theText.length;
	var rows = 1;
	if (numCharacters > 75){
		rows = Math.floor(numCharacters/40);
	}
	return rows;
};

org.OpenGeoPortal.UserInterface.prototype.shareLayers = function(){
	var layers = [];
	var layerObj = this.getLayerList("shareLink");
	for (var layer in layerObj){
		layers.push(layer);
	}
	var dialogContent = "";
    if (layers.length == 0){
    	dialogContent = 'No layers have been selected.';
    	//this should probably call a dialog instance for error messages/notifications
    } else {
    	var path = top.location.href.substring(0, top.location.href.lastIndexOf("/"));
    	var shareLink = path + "/openGeoPortalHome.jsp";
    	var geodeticBbox = this.mapObject.getGeodeticExtent();
    	var queryString = '?' + jQuery.param({ layer: layers, minX: geodeticBbox.left, minY: geodeticBbox.bottom, maxX: geodeticBbox.right, maxY: geodeticBbox.top });
    	shareLink += queryString;

    	dialogContent = '<textarea id="shareText" class="linkText" ></textarea> \n';
    	dialogContent += '<p>Use this link to share this Cart</p>';
    	this.shortenLink(shareLink);
    }
    
	this.createShareDialog(dialogContent);
};

org.OpenGeoPortal.UserInterface.prototype.createShareDialog = function(dialogContent){
    if (typeof jQuery('#shareDialog')[0] == 'undefined'){
    	var shareDiv = '<div id="shareDialog" class="dialog"> \n';
        shareDiv += dialogContent;
        shareDiv += '</div> \n';
    	jQuery('body').append(shareDiv);
    	jQuery("#shareDialog").dialog({
    		zIndex: 3000,
    		autoOpen: false,
    		width: 495,
    		height: 'auto',
    		title: 'SHARE CART',
    		resizable: false,
			buttons: {
				Close: function() {
					jQuery(this).dialog('close');
					jQuery("#optionDetails").html("");
					jQuery(".downloadSelection, .downloadUnselection").removeClass("downloadSelection downloadUnselection");
				}
    	}});
        } else {
        	//replace dialog text/controls & open the instance of 'dialog' that already exists
    		  jQuery("#shareDialog").html(dialogContent);
    	}
    jQuery('#shareText').focus(function(){
        // Select input field contents
        this.select();
    });
};

org.OpenGeoPortal.UserInterface.prototype.shareServices = function(){
	var layerList = this.getLayerList("webService");
	var dialogContent = "";
    var queryString = [];
    for (var layerId in layerList){
    	//console.log(layerId);
    	//console.log(layerList[layerId]);
    	if (layerList[layerId]["access"].toLowerCase() == "public"){
    			//console.log({LayerId: layerId});
	    		queryString.push(layerId);
    	}
    }
   	if (queryString.length == 0){
       	dialogContent = 'No layers have been selected.';
   	} else {
    	//console.log(queryString);
    	//console.log(jQuery.param(queryString, true));
   		var serviceTypes = [{"type": "WFS", "title": "Web Feature Service (WFS):", "caption": "Creates a vector web service. Only available for vector data."}, 
   		                    {"type":"WMS", "title": "Web Mapping Service (WMS):", "caption": "Creates a raster web service for all your data. Vector data will be converted to raster format."}];//WCS later?  		   		
   		var path = top.location.href.substring(0, top.location.href.lastIndexOf("/"));
   		dialogContent += '<p>Web Services are provided in two formats. Paste the selected link into your desktop mapping software.</p>';
		dialogContent += '<div id="owsServicesArea">\n';
		for (var i in serviceTypes){
			dialogContent += '<span class="sub_headerTitle">' + serviceTypes[i].title + '</span><a href="#">?</a>';
			dialogContent += '<br/><span>' + serviceTypes[i].caption + '</span>';
			dialogContent += '<div class="owsServicesLinkContainer">';
			var dynamicCapabilitiesRequest = path + "/ogp" + serviceTypes[i].type + ".jsp?OGPIDS=" + queryString.join();
			dialogContent += '<textarea class="shareServicesText linkText" >' + dynamicCapabilitiesRequest + '</textarea> <br />\n';
			dialogContent += '</div><br/>';
		}

		dialogContent += '</div>';

   	}
    
    
    if (typeof jQuery('#shareDialog')[0] == 'undefined'){
    	var shareDiv = '<div id="shareServicesDialog" class="dialog"> \n';
        shareDiv += '</div> \n';
    	jQuery('body').append(shareDiv);
    	jQuery("#shareServicesDialog").dialog({
    		zIndex: 3000,
    		autoOpen: false,
       		height: 'auto',
       		title: 'WEB SERVICES',
    		width: 495,
			buttons: {
				Close: function() {
					jQuery(this).dialog('close');
					jQuery("#optionDetails").html("");
					jQuery(".downloadSelection, .downloadUnselection").removeClass("downloadSelection downloadUnselection");
				}
    	}});
    } 
        	//replace dialog text/controls & open the instance of 'dialog' that already exists
    jQuery("#shareServicesDialog").html(dialogContent);
    var that = this;
	jQuery(".shareServicesText").each(function(){
		jQuery(this).attr("rows", that.calculateRows(jQuery(this).text()));
	});

	jQuery("#shareServicesDialog").dialog('open');
	
    jQuery('.shareServicesText').bind("focus", function(){
        // Select input field contents
        this.select();
    });
    jQuery('.shareServicesText').first().focus();

};

/*
 * 
 * login code
 * 
 */



org.OpenGeoPortal.UserInterface.prototype.logoutResponse = function(data, textStatus, jqXHR) {
	var that = this;
	jQuery("#headerLogin").text("Login").unbind("click");
	jQuery("#headerLogin").click(function(event){that.promptLogin(event);});

	this.login.userId = null;
	this.changeControlsToLoginButtons(this.config.getHomeInstitution());//get local inst.
	//
	//will also need to turn on login labels for layers in search results and cart, remove 
	//restricted layers from preview?
	//should we logout on page load to prevent weird states? or just check the state at page load?
};

org.OpenGeoPortal.UserInterface.prototype.promptLogin = function(event){
	//console.log("promptLogin");
	this.login.loginDialog();
};


org.OpenGeoPortal.UserInterface.prototype.changeLoginButtonsToControls = function(){
	//change login button to checkbox for institution logged in
	var that = this;
	jQuery(".colPreview img").each(function(){
		if (jQuery(this).attr("src") == that.getImage("view_login.png")){
			var node = jQuery(this).closest("tr");
			var tableObject = node.closest("table");
			var tableName = tableObject.attr("id");
			tableObject = tableObject.dataTable();
			var pos = tableObject.fnGetPosition(node[0]);
			var row = tableObject.fnGetData(pos);
			var rowObj = {};
			rowObj.aData = row;
			if (tableName == "searchResults"){
				jQuery(this).parent().html(that.resultsTableObject.getActivePreviewControl(rowObj));
			} else if (tableName == "savedLayers"){
				jQuery(this).parent().html(that.cartTableObject.getActivePreviewControl(rowObj));	
			}
		}
	});
};

org.OpenGeoPortal.UserInterface.prototype.changeControlsToLoginButtons = function(logoutInstitution){
	//change checkbox to login button for institution logged out
	var that = this;
	jQuery(".colPreview input").each(function(){
			var node = jQuery(this).closest("tr");
			var tableObject = node.closest("table");
			var tableName = tableObject.attr("id");
			tableObject = tableObject.dataTable();
			var pos = tableObject.fnGetPosition(node[0]);
			var row = tableObject.fnGetData(pos);
			var rowObj = {};
			rowObj.aData = row;
			if (tableName == "searchResults"){
				jQuery(this).parent().html(that.resultsTableObject.getPreviewControl(rowObj));
			} else if (tableName == "savedLayers"){
				jQuery(this).parent().html(that.cartTableObject.getPreviewControl(rowObj));	
			}
		
	});
};

org.OpenGeoPortal.UserInterface.prototype.applyLoginActions = function(){
	// how do we update the UI so the user know login succeeded?
	this.changeLoginButtonsToControls();
	//change the login button in top right to logout
	var that = this;
	//console.log(this);
	jQuery("#headerLogin").text("Logout");
	jQuery("#headerLogin").unbind("click");
	jQuery("#headerLogin").click(function(event){event.preventDefault();
	//for logout capability
		var ajaxArgs = {url: "logout", 
			context: that,
			dataType: "json",
			success: that.logoutResponse
			};
		jQuery.ajax(ajaxArgs);
		});
	this.filterResults();
};
/*
// callback handler invoked when if an error occurs during ajax call to authenticate a user
org.OpenGeoPortal.UserInterface.prototype.loginResponseError = function(jqXHR, textStatus, errorThrown)
{
	alert("an error occured during log in: " + textStatus);
	this.userId = null;
};
*/

/*
 * ---------------------------------------------------------------
 */

//toggle the attribute info button & functionality
org.OpenGeoPortal.UserInterface.prototype.toggleFeatureInfo = function(thisObj, layerID, displayName){
	var layerStateObject = this.layerStateObject;
	if (!layerStateObject.getState(layerID, "getFeature")){
		  //update layer state
		  layerStateObject.setState(layerID, {"getFeature": true});
		  layerStateObject.getFeatureTitle = displayName;
	  } else {
		  //update layer state, turn off get feature 
		  layerStateObject.setState(layerID, {"getFeature": false});
	  }

};

//get the color from the layer state object to use for the shown swatch
org.OpenGeoPortal.UserInterface.prototype.setPaletteColor = function(layerID){
	  var paletteColor = this.layerStateObject.getState(layerID, "color");
	  var escapedLayerID = this.utility.idEscape(layerID);
	  jQuery(".colorPalette").each(function(){
		  //console.log(["iterate", paletteColor]);
		  if (jQuery(this).is('[id$=' + escapedLayerID + ']')){
			  //console.log("match");
			  jQuery(this).css("background-color", paletteColor);
		  }
	  });
};

//create the color picker dialog box
org.OpenGeoPortal.UserInterface.prototype.colorDialog = function(layerID, dataType){
	  //create a hidden div w/ the dialog info
	  //create a new dialog instance, or just open the dialog if it already exists
	  //if it already exists, function should reset color picker to match layer
	  //button to apply color, button to cancel
	  //apply color changes state object for the layer
	  //call map function to apply style from the state object
	var allColors = {};
	allColors.grey = ["#828282", "#9c9c9c", "#b2b2b2", "#cccccc", "#e1e1e1", "#ffffff"];
	allColors.red = ["#730000", "#a80000", "#e80000", "#ff0000", "#ff7f7f", "#ffbebe"];
	allColors.darkOrange = ["#732600", "#a83800", "#e64c00", "#ff5500", "#ffa77f", "#ffebbe"];
	allColors.orange = ["#734c00", "#a87000", "#e69800", "#ffaa00", "#ffd37f", "#ffebaf"];
	allColors.yellow = ["#737300", "#a8a800", "#e6e600", "#ffff00", "#ffff73", "#ffffbe"];
	allColors.grassGreen = ["#426e00", "#6da800", "#98e600", "#aaff00", "#d1ff73", "#e9ffbe"];
	allColors.green = ["#267300", "#38a800", "#4ce600", "#55ff00", "#a3ff73", "#d3ffbe"];
	allColors.cyan = ["#00734c", "#00a884", "#00e6a9", "#00ffc5", "#73ffdf", "#beffe8"];
	allColors.blue = ["#004c73", "#0084a8", "#00a9e6", "#00c5ff", "#73dfff", "#bee8ff"];
	allColors.indigo = ["#002673", "#0049a9", "#005ce6", "#0070ff", "#73b2ff", "#bed2ff"];
	allColors.violet = ["#4c0073", "#8400a8", "#a900e6", "#c500ff", "#df73ff", "#e8beff"];
	allColors.pink = ["#780f52", "#a80084", "#e00fa7", "#ff00c5", "#ff73df", "#ffbee8"];
	var currentColorSelection = this.layerStateObject.getState(layerID, "color");
	  if (typeof jQuery('#colorDialog')[0] == 'undefined'){
		  var dialogDiv = '<div id="colorDialog" class="dialog"> \n';
		  dialogDiv += '</div> \n';
		  jQuery('body').append(dialogDiv);
	  }

	  var colorDiv = '<table><tbody>';
	  for (var row in allColors){
		  colorDiv += '<tr>';
		  for (var cell in allColors[row]){
			  colorDiv += '<td class="colorCellParent">';
			  var currentColorValue = allColors[row][cell];
			  var selectionClass;
			  if (currentColorValue == currentColorSelection){
				  selectionClass = " colorCellSelected";
			  } else {
				  selectionClass = "";
			  }
			  colorDiv += '<div class="colorCell' + selectionClass + '" onclick="org.OpenGeoPortal.ui.selectColorCell(this, \'';
			  colorDiv += layerID + '\', \'' + dataType + '\');" style="background-color:' + allColors[row][cell] + '"></div>';
			  colorDiv += '</td>';
		  }
		  colorDiv += '</tr>';
	  	}
	  colorDiv += '</tbody></table>';
	  jQuery('#colorDialog').html(colorDiv);
	  jQuery("#colorDialog").dialog({
		zIndex: 2999,
		autoOpen: false,
		width: 'auto',
		height: 'auto',
		title: '<img src="' + this.getImage('header_colors.png') + '" />',
		resizable: false
	  });    	  
	  jQuery("#colorDialog").dialog('open');
};

org.OpenGeoPortal.UserInterface.prototype.selectColorCell = function(thisObj, layerID, dataType){
	jQuery('.colorCell').removeClass('colorCellSelected');
	jQuery(thisObj).addClass('colorCellSelected');
	//for IE
	var selectedColor = jQuery('div.colorCellSelected').css("background-color");
	if (selectedColor.indexOf("rgb") > -1){
		selectedColor = this.utility.rgb2hex(selectedColor);
	}
	this.layerStateObject.setState(layerID, {color: selectedColor});
	this.setPaletteColor(layerID);
	//org.OpenGeoPortal.map.changeStyle(layerID, dataType);
	this.mapObject.changeStyle(layerID, dataType);
};

//toggle whether the applied style has an outline
org.OpenGeoPortal.UserInterface.prototype.toggleOutline = function(thisObj, layerID, dataType){
	 //sets state object to match checkbox value, calls map function to apply the style to the layer
	var layerStateObject = this.layerStateObject;
	 if (jQuery(thisObj).is(':checked') == true){
		 layerStateObject.setState(layerID, {"graphicWidth": 1});
	 } else {
		 layerStateObject.setState(layerID, {"graphicWidth": 0}); 
	 }
	 //org.OpenGeoPortal.map.changeStyle(layerID, dataType); 
	 this.mapObject.changeStyle(layerID, dataType);  
};

org.OpenGeoPortal.UserInterface.prototype.mouseCursor = function(){
	var that = this;
	var layerStateObject = this.layerStateObject;
	jQuery('.olMap').css('cursor', "-moz-grab");
	jQuery(document).on('click', 'div.olControlZoomBoxItemInactive', function(){
		jQuery('.olMap').css('cursor', "-moz-zoom-in");
		var mapLayers = that.mapObject.layers;
		for (var i in mapLayers){
			var currentLayer = mapLayers[i];
			if (layerStateObject.layerStateDefined(currentLayer.name)){
				if (layerStateObject.getState(currentLayer.name, "getFeature")){
					that.mapObject.events.unregister("click", currentLayer, that.mapObject.wmsGetFeature);
				}
			} else {
				continue;
			}
		}
		layerStateObject.resetState('getFeature');
		jQuery('.attributeInfoControl').attr('src', that.utility.getImage('preview.gif'));
	});
	jQuery(document).on('click', '.olControlNavigationItemActive', function(){
		jQuery('.olMap').css('cursor', "-moz-grab");
		//var mapLayers = org.OpenGeoPortal.map.layers;
		var mapLayers = that.mapObject.layers;
		for (var i in mapLayers){
			var currentLayer = mapLayers[i];
			if (layerStateObject.layerStateDefined(currentLayer.name)){
				if (layerStateObject.getState(currentLayer.name, "getFeature")){
					that.mapObject.events.unregister("click", currentLayer, that.mapObject.wmsGetFeature);
				}
			} else {
				continue;
			}
		}
		layerStateObject.resetState('getFeature');
		jQuery('.attributeInfoControl').attr('src', that.utility.getImage('preview.gif'));
	});
};

org.OpenGeoPortal.UserInterface.prototype.getImage = function(imageName){
	return this.utility.getImage(imageName);
}

org.OpenGeoPortal.UserInterface.prototype.resizePanels = function(){
	var that = this;
	jQuery("#map").resizable({handles: 'w', ghost: true,
		minWidth: jQuery(".olControlPanel").width() + jQuery("#geosearchDiv").width() + jQuery("#mapLoadIndicator").width(),
		maxWidth: jQuery("#container").width() - jQuery("#basicSearchBox").width(),
		stop: function(event, ui) {
			//var widthDelta = ui.size.width - ui.originalSize.width;
			var newWidth = jQuery("#container").width() - jQuery("#map").width();
			jQuery("#map").css("left", 0);
			jQuery("#left_col").width(newWidth - 1);
			that.setSearchPanelWidth(jQuery("#left_col").width());

			that.utility.whichTab().tableObject().getTableObj().fnDraw();
			that.mapObject.updateSize();
		}
	});
};

org.OpenGeoPortal.UserInterface.prototype.createExportParams = function(){
	var exportParams = {};
	exportParams.layers = this.getLayerList("mapIt");
	exportParams.extent = {};
	exportParams.extent.global = this.mapObject.getSpecifiedExtent("global");
	exportParams.extent.current = this.mapObject.getSpecifiedExtent("current");
	exportParams.extent.maxForLayers = this.mapObject.getSpecifiedExtent("maxForLayers", exportParams.layers);
	return exportParams;
};

org.OpenGeoPortal.UserInterface.prototype.cartOptionText = function(){
	var noSelectionHtml = "";
	var mapItHtml = "Open highlighted layers in GeoCommons to create maps";
	var shareHtml = "Create a link to share this Cart";
	var webServiceHtml = "Stream highlighted layers into an application";
	var downloadHtml = "Download highlighted layers to your computer";
	var that = this;
	jQuery("#mapItButton").hover(function(){jQuery("#optionDetails").html(mapItHtml);that.getLayerList("mapIt");},
			function(){jQuery("#optionDetails").html(noSelectionHtml);jQuery(".downloadSelection, .downloadUnselection").removeClass("downloadSelection downloadUnselection");});
	jQuery("#mapItButton").click(function(){console.log(that.getLayerList("mapIt"));var geoCommonsExport = new org.OpenGeoPortal.Export.GeoCommons(that.createExportParams());
		geoCommonsExport.exportDialog(that);});
	//jQuery("#mapItButton").click(function(){jQuery("#mapitNotice").dialog("open")});
	jQuery("#shareButton").hover(function(){jQuery("#optionDetails").html(shareHtml);that.getLayerList("shareLink");},
			function(){if ((jQuery("#shareDialog").length == 0)||(!jQuery("#shareDialog").dialog("isOpen"))){jQuery("#optionDetails").html(noSelectionHtml);
			jQuery(".downloadSelection, .downloadUnselection").removeClass("downloadSelection downloadUnselection");}});
	jQuery("#shareButton").click(function(){that.shareLayers();});
	jQuery("#webServiceButton").hover(function(){jQuery("#optionDetails").html(webServiceHtml);that.getLayerList("webService");},
			function(){if ((jQuery("#shareServicesDialog").length == 0)||(!jQuery("#shareServicesDialog").dialog("isOpen"))){jQuery("#optionDetails").html(noSelectionHtml);	
			jQuery(".downloadSelection, .downloadUnselection").removeClass("downloadSelection downloadUnselection");}});
	jQuery("#webServiceButton").click(function(){that.shareServices();});
	jQuery("#downloadButton").hover(function(){jQuery("#optionDetails").html(downloadHtml);that.getLayerList("download");},
			function(){if ((jQuery("#downloadDialog").length == 0)||(!jQuery("#downloadDialog").dialog("isOpen"))){jQuery("#optionDetails").html(noSelectionHtml);
			jQuery(".downloadSelection, .downloadUnselection").removeClass("downloadSelection downloadUnselection");}});
	jQuery("#downloadButton").click(function(){that.downloadDialog();});
	jQuery("#removeFromCartButton").hover(function(){that.getLayerList("removeFromCart");},
			function(){jQuery(".downloadSelection, .downloadUnselection").removeClass("downloadSelection downloadUnselection");});
	jQuery("#removeFromCartButton").click(function(){that.cartTableObject.removeRows();}); 
};

org.OpenGeoPortal.UserInterface.prototype.anchorsToNiceScroll = function(affectedDiv, offsetHash){
	jQuery("#" + affectedDiv + " a.niceScroll").click(function(event){
		event.preventDefault();
		//parse the hrefs for the anchors in this DOM element into toID
		var toID = jQuery(this).attr("href");
		jQuery("#" + affectedDiv).scrollTo(jQuery(toID), {offset: offsetHash });
	});
};

org.OpenGeoPortal.UserInterface.prototype.dialogTemplate = function dialogTemplate(dialogDivId, dialogContent, dialogTitle, buttonsObj) {
	if (typeof jQuery('#' + dialogDivId)[0] == 'undefined'){
		var dialogDiv = '<div id="' + dialogDivId + '" class="dialog"> \n';
		dialogDiv += dialogContent;
		dialogDiv += '</div> \n';
		jQuery('body').append(dialogDiv);
		jQuery("#" + dialogDivId).dialog({
			zIndex: 3000,
			autoOpen: false,
			width: 'auto',
			title: dialogTitle.toUpperCase(),
			resizable: true,
			buttons: buttonsObj
		});
    } else {
    	//replace dialog text/controls & open the instance of 'dialog' that already exists
		jQuery("#" + dialogDivId).html(dialogContent);
		jQuery("#" + dialogDivId).dialog("option", "buttons", buttonsObj);

	}
	jQuery("#" + dialogDivId).dialog('open');
};

org.OpenGeoPortal.UserInterface.prototype.minimizeDialog = function(dialogId){
	//1. collect current state of dialog before minimizing.
	//2. attach that info to the dialog element (jQuery.data)
	//3. also attach a flag that indicates minimized or not
	//4. minimize the dialog. (header bar only)
	//5. change position to lower right corner (fixed to bottom of window)
	//6. animate the movement
	//can I just toggle a class?
	//7. animated message in toolbar that describes what's being done
	if (!this.isDialogMinimized(dialogId)) {
		jQuery("#" + dialogId).data({"minimized": true});
		var position = jQuery("#" + dialogId).dialog( "option", "position" );
		jQuery("#" + dialogId).data({"maxPosition": position});
		jQuery("#" + dialogId).parent().children().each(
			function(){
				if (!jQuery(this).hasClass("ui-dialog-titlebar")){
					jQuery(this).hide();
					}
				});
		jQuery("#" + dialogId).dialog("option","position", ["right","bottom"]);
		jQuery("#" + dialogId).parent().css("position", "fixed");
	}
};

org.OpenGeoPortal.UserInterface.prototype.isDialogMinimized = function(dialogId){
	var result;
	/*if (typeof jQuery("#" + dialogId).data() == "undefined"){
		jQuery("#" + dialogId).data({"minimized": false});
		result = false;
	} else if (jQuery("#" + dialogId).data() == null){
		jQuery("#" + dialogId).data({"minimized": false});
		result = false;
	} else*/ if (jQuery("#" + dialogId).data().minimized) {
		result = true;
	} else {
		result = false;
	}
	//console.log(jQuery("#" + dialogId).data().minimized);
	return result;
};

org.OpenGeoPortal.UserInterface.prototype.maximizeDialog = function(dialogId){
	//1. check minimized flag
	//2. read stored state values
	//3. apply stored state values
	//4. animate the movement
	//5. turn off animated message (?)
	if (this.isDialogMinimized(dialogId)) {
		jQuery("#" + dialogId).parent().children().each(
			function(){
				if (!jQuery(this).hasClass("ui-dialog-titlebar")){
					jQuery(this).show();
					}
				});
		jQuery("#" + dialogId).data({"minimized": false});
		var position = jQuery("#" + dialogId).data().maxPosition;
		jQuery("#" + dialogId).dialog("option", "position", position);
		jQuery("#" + dialogId).parent().css("position", "absolute");
	}
		//>>> jQuery("#geoCommonsExportDialog").dialog("option", "position", jQuery("#geoCommonsExportDialog").data("maxPosition"))
};

org.OpenGeoPortal.UserInterface.prototype.processingMessageOn = function(dialogId, processingMessage){
	this.dialogOverlayOn(dialogId);
	//create a div with the message and the processing graphic
	var $dialogId = jQuery('#' + dialogId).parent();
	
	if ($dialogId.children(".processingMessage").length == 0){
		$dialogId.append('<div class="processingMessage"></div>');
	} else {
		
	}
	var processorDivId = dialogId + "Processor"; 
	var messageDiv = '<div class="processingMessageContents" id="' +processorDivId + "Container";
	messageDiv += '"><div id="' + processorDivId + '"></div></div>';
	messageDiv += '<div class="processingMessageText processingMessageContents">' + processingMessage + '</div>';
	
	$dialogId.children(".processingMessage").first().html(messageDiv);
	$dialogId.children(".processingMessage").show();
	
	var offset = $dialogId.children(".ui-dialog-titlebar").first().height();
    var pos = jQuery.extend({
    		width:    $dialogId.outerWidth()/2,
    		height:   ($dialogId.outerHeight() - offset)/3,
    		top:	  $dialogId.outerHeight()/3 - offset,
    		left:	  $dialogId.outerWidth()/4
    	});

    /*
     * display: inline-block;
    height: inherit;
    line-height: 100px;
    vertical-align: middle;
     * 
     */
    
    $dialogId.children(".processingMessage").css({
	        position:         'absolute',
	        top:			  pos.top,
	        left:				pos.left,
	        width:            pos.width,
	        height:           pos.height,
	        backgroundColor:  '#CCC',
	        border: '1px solid #AAA',
	        opacity:          1,
	        "z-index":			  2501,
	        "font-size":	"15px"
	    });
    jQuery("#" + processorDivId).width("30px");
    jQuery("#" + processorDivId).height("25px");
    
    $dialogId.find(".processingMessageContents").css({
    	display:	"inline-block",
    	"vertical-align":	"middle"
    });
    
    $dialogId.find(".processingMessageText").first().css({
    	"line-height":	pos.height + "px"
    });
    


    org.OpenGeoPortal.Utility.showLoadIndicator(processorDivId);
};

org.OpenGeoPortal.UserInterface.prototype.processingMessageOff = function(dialogId, completionMessage, callback){
    org.OpenGeoPortal.Utility.hideLoadIndicator(dialogId + "Processor");
	this.maximizeDialog(dialogId);
	//replace processing message with completion message
	var $processingMessage = jQuery( "#" + dialogId ).siblings(".processingMessage");
	jQuery("#" + dialogId + "Processor").hide();
    org.OpenGeoPortal.Utility.hideLoadIndicator(dialogId + "Processor");
	$processingMessage.find(".processingMessageText").first().html(completionMessage);
	//flash message
	var that = this;
	var innerCallback = function(){
		jQuery( "#" + dialogId ).dialog("close");
		that.dialogOverlayOff(dialogId);
		callback;
	};
	var rate = 63;
	$processingMessage.delay(500).effect( "highlight", null, rate).delay(rate).effect( "highlight", null, rate).delay(rate)
		.effect( "highlight", null, rate).delay(500).effect("fade", null, 250, innerCallback);	
};

org.OpenGeoPortal.UserInterface.prototype.dialogOverlayOn = function(dialogId){
	jQuery(document).blur();
	var $dialogId = jQuery('#' + dialogId).parent();
	if ($dialogId.children(".dialogMask").length == 0){
		$dialogId.append('<div class="dialogMask"></div>');
	} else {
		$dialogId.children(".dialogMask").first().show();
	}
	var offset = $dialogId.children(".ui-dialog-titlebar").first().height();
    var pos = jQuery.extend({
    		width:    $dialogId.outerWidth(),
    		height:   $dialogId.outerHeight() - offset,
    		top:	  offset,
    		left:	  0
    	});

    $dialogId.children(".dialogMask").css({
	        position:         'absolute',
	        left:			  pos.left,
	        top:			  pos.top,
	        width:            pos.width,
	        height:           pos.height,
	        backgroundColor:  '#FFF',
	        opacity:          0,
	        "z-index":			  2500
	    }).animate({
	    opacity: 0.5,
	  }, 500, function() {
	    //alert("tried anyway");
	  });
};

org.OpenGeoPortal.UserInterface.prototype.dialogOverlayOff = function(dialogId){
	var $dialogId = jQuery('#' + dialogId).parent();
	$dialogId.children(".dialogMask").animate({
	    opacity: 0,
	  }, 500, function() {
		  jQuery(this).hide();
		  $dialogId.children(".processingMessage").hide();
	  });
};
