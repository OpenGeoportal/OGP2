//not currently being used, since we are using the google geocoder
org.OpenGeoPortal.UserInterface.prototype.geoSearch = function() {
	if (true == true) return;
	jQuery("#geosearch").autocomplete({
		source: function(request, response) {
			jQuery.ajax({
				url: "http://ws.geonames.org/searchJSON",
				dataType: "jsonp",
				data: {
					style: "long",
					maxRows: 12,
					name: request.term
				},
				success: function(data) {
					response(jQuery.map(data.geonames, function(item) {
						var mercatorCoords = map.WGS84ToMercator(item.lng, item.lat);
						return {
							label: item.name + (item.adminName1 ? ", " + item.adminName1 : "") + ", " + item.countryName,
							value: item.name,
							lat: mercatorCoords.lat,
							lon: mercatorCoords.lon
						};
					}));
				}
			});
		},
		minLength: 2,
		delay: 750,
		select: function(event, ui) {
			map.setCenter(new OpenLayers.LonLat(ui.item.lon, ui.item.lat));
			//fire off another ajax request calling google geocoder
		},
		open: function() {
			jQuery(this).removeClass("ui-corner-all").addClass("ui-corner-top");
		},
		close: function() {
			jQuery(this).removeClass("ui-corner-top").addClass("ui-corner-all");
		}
	});
};


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

//used?
org.OpenGeoPortal.UserInterface.prototype.createQueryString = function(){
	var searchType = this.whichSearch().type;
	if (searchType == 'basicSearch'){
		var searchString = 'searchTerm=' + jQuery('#basicSearchTextField').val();
	    searchString += '&topic=' + jQuery('#selectTopic').val();
	} else if (searchType =='advancedSearch'){
		var searchString = 'keyword=' + jQuery('#advancedKeywordText').val();
		searchString += '&topic=' + jQuery('#advancedSelectTopic').val();
		//searchString += '&collection=' + jQuery('#advancedCollectionText').val();
		searchString += '&publisher=' + jQuery('#advancedPublisherText').val();
		searchString += '&dateFrom=' + jQuery('#advancedDateFromText').val();	
		searchString += '&dateTo=' + jQuery('#advancedDateToText').val();
		searchString += '&typeRaster=' + this.getCheckboxValue('dataTypeCheckRaster');
		searchString += '&typeVector=' + this.getCheckboxValue('dataTypeCheckVector');
		searchString += '&typeMap=' + this.getCheckboxValue('dataTypeCheckMap');
		searchString += '&sourceHarvard=' + this.getCheckboxValue('sourceCheckHarvard');
		searchString += '&sourceMit=' + this.getCheckboxValue('sourceCheckMit');
		searchString += '&sourceMassGis=' + this.getCheckboxValue('sourceCheckMassGis');
		searchString += '&sourcePrinceton=' + this.getCheckboxValue('sourceCheckPrinceton');
		searchString += '&sourceTufts=' + this.getCheckboxValue('sourceCheckTufts');
	}	
	if (this.filterState()){
		// pass along the extents of the map
		var extent = map.returnExtent();
		searchString += "&minX=" + extent.minX + "&maxX=" + extent.maxX + "&minY=" + extent.minY + "&maxY=" + extent.maxY; 
	}
	
	return searchString;
};

//must exclude header cell for the following click handlers

// this is a test function
// it tests jQuery creating a script tag 
/*
ajaxTest = function(thisObj){
    		var ajaxParams = {
  	    		type: "GET",
  	    		url: "http://geoportal-dev.atech.tufts.edu:8480/temp.jsp",
  	            dataType: 'jsonp',
  	            success: function(data){
    					var solrResponse = data["response"];
    					var totalResults = solrResponse["numFound"];
    					alert("in ajaxTest with " + totalResults + ", and " + data);
    					foo = data;
  	            },
  	            error: function() {throw new Error("The attempt to retrieve FGDC layer information failed.");}
  	    };
  	    jQuery.ajax(ajaxParams);
};
*/
/*this has been replaced with a jsonp version
//click-handler for showing metadata pane
showMetadata = function(thisObj){
	  	var tableElement = jQuery(thisObj).parents('tr').last();
      var tableObj = tableElement.parent().parent().dataTable();	
	  //Get the position of the current data from the node 
    		var aPos = tableObj.fnGetPosition( tableElement[0] );
    		//Get the data array for this row
    		var aData = tableObj.fnGetData(aPos);
    		//make an ajax call to retrieve metadata
    		var layerId = aData[that.tableHeadingsObj.getColumnIndex("LayerId")];
    		var ajaxParams = {
  	    		type: "GET",
  	            url: "getFgdcTextHandler.jsp",
  	            data: "layerId=" + layerId,
  	            dataType: 'json',
  	            success: function(data){
    					var solrResponse = data["response"];
    					var totalResults = solrResponse["numFound"];
    					if (totalResults != 1)
    					{
    						alert("Request for FGDC returned " + totalResults +".  Exactly 1 was expected.");
    						return;
    					}
    					var doc = solrResponse["docs"][0];  // get the first layer object
    					var fgdcRawText = doc["FgdcText"];
    					var fgdcText = unescape(fgdcRawText);  // text was escaped on ingest into Solr
    					var parser = new DOMParser();
    				    var fgdcDocument = parser.parseFromString(fgdcText,"text/xml");
    					var xsl = loadXMLDoc("FGDC_Classic_for_Web_body.xsl");
    					var xsltProcessor = new XSLTProcessor();
    					xsltProcessor.importStylesheet(xsl);
    					resultDocument = xsltProcessor.transformToFragment(fgdcDocument, document);
    					document.getElementById("dialogDiv").innerHTML = "";  // delete previously displayed metadata
    					document.getElementById("dialogDiv").appendChild(resultDocument);
    					jQuery('#dialogDiv').width("550");
    					jQuery("#dialogDiv").dialog({ zIndex: 9999, width: 560, height: 400 });
  	            },
  	            error: function() {throw new Error("The attempt to retrieve FGDC layer information failed.");}
  	    };
  	    jQuery.ajax(ajaxParams);
};
*/


this.minimizeDialog = function(dialogId) {
	// 1. collect current state of dialog before minimizing.
	// 2. attach that info to the dialog element (jQuery.data)
	// 3. also attach a flag that indicates minimized or not
	// 4. minimize the dialog. (header bar only)
	// 5. change position to lower right corner (fixed to bottom of window)
	// 6. animate the movement
	// can I just toggle a class?
	// 7. animated message in toolbar that describes what's being done
	if (!this.isDialogMinimized(dialogId)) {
		jQuery("#" + dialogId).data({
			"minimized" : true
		});
		var position = jQuery("#" + dialogId).dialog("option", "position");
		jQuery("#" + dialogId).data({
			"maxPosition" : position
		});
		jQuery("#" + dialogId).parent().children().each(function() {
			if (!jQuery(this).hasClass("ui-dialog-titlebar")) {
				jQuery(this).hide();
			}
		});
		jQuery("#" + dialogId).dialog("option", "position",
				[ "right", "bottom" ]);
		jQuery("#" + dialogId).parent().css("position", "fixed");
	}
};

this.isDialogMinimized = function(dialogId) {
	var result;
	if (jQuery("#" + dialogId).data().minimized) {
		result = true;
	} else {
		result = false;
	}
	return result;
};

this.maximizeDialog = function(dialogId) {
	// 1. check minimized flag
	// 2. read stored state values
	// 3. apply stored state values
	// 4. animate the movement
	// 5. turn off animated message (?)
	if (this.isDialogMinimized(dialogId)) {
		jQuery("#" + dialogId).parent().children().each(function() {
			if (!jQuery(this).hasClass("ui-dialog-titlebar")) {
				jQuery(this).show();
			}
		});
		jQuery("#" + dialogId).data({
			"minimized" : false
		});
		var position = jQuery("#" + dialogId).data().maxPosition;
		jQuery("#" + dialogId).dialog("option", "position", position);
		jQuery("#" + dialogId).parent().css("position", "absolute");
	}
};
