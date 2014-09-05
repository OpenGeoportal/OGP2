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

/* client side metadata transform*/
/*
this.viewMetadata = function(model) {
	var location = model.get("Location");
	var layerId = model.get("LayerId");
	// should store this somewhere else; some sort of
	// config
	var values = [ "metadataLink", "purl", "libRecord" ];
	if (OpenGeoportal.Utility.hasLocationValue(location, values)) {
		// display external metadata in an iframe
		var url = OpenGeoportal.Utility.getLocationValue(location, values);
		this.viewExternalMetadata(layerId, url);
	} else {
		this.viewMetadataFromSolr(layerId);
	}
};
// obtain layer's metadata via jsonp call
this.viewMetadataFromSolr = function(layerId) {
	// make an ajax call to retrieve metadata
	var solr = new OpenGeoportal.Solr();
	var url = solr.getServerName() + "?"
			+ jQuery.param(solr.getMetadataParams(layerId));
	var query = solr.sendToSolr(url, this.viewMetadataJsonpSuccess,
			this.viewMetadataJsonpError, this);

	// this.analytics.track("Metadata", "Display Metadata", layerId);
};

this.viewExternalMetadata = function(layerId, url) {
	var document = this.template.genericIframe({
		iframeSrc : url,
		iframeClass : "metadataIframe"
	});
	var dialog$ = this.renderMetadataDialog(layerId, document);
	dialog$.dialog("open");
};

this.processMetadataSolrResponse = function(data) {
	var solrResponse = data.response;
	var totalResults = solrResponse.numFound;
	if (totalResults != 1) {
		throw new Error("Request for Metadata returned " + totalResults
				+ ".  Exactly 1 was expected.");
		return;
	}
	var doc = solrResponse.docs[0]; // get the first layer object
	return doc;
};
// handles jsonp response from request for metadata call
this.viewMetadataJsonpSuccess = function(data) {
	try {
		var doc = this.processMetadataSolrResponse(data);
		var metadataRawText = doc.FgdcText;
		var layerId = doc.LayerId;

		var xmlDocument = null;
		try {
			xmlDocument = jQuery.parseXML(metadataRawText);
		} catch (e) {
			throw new Error(
					"Error parsing returned XML: the document may be invalid.");
		}
		var document = null;
		try {
			document = this.renderXmlMetadata(xmlDocument);
		} catch (e) {
			throw new Error(
					"Error transforming XML document: the document may be of the wrong type.");
		}
		var dialog$ = this.renderMetadataDialog(layerId, document);
		this.addMetadataDownloadButton(dialog$, layerId);
		this.addScrollMetadataToTop();

		dialog$.dialog("open");
	} catch (e) {
		console.log(e);
		throw new Error("Error opening the metadata dialog.");
	}

};

this.renderMetadataDialog = function(layerId, document) {
	var dialogId = "metadataDialog";
	if (typeof jQuery('#' + dialogId)[0] == 'undefined') {
		jQuery('#dialogs').append(this.template.genericDialogShell({
			elId : dialogId
		}));
	}

	var metadataDialog$ = jQuery("#" + dialogId);
	// should remove any handlers w/in #metadataDialog
	// can't pass the document directly into the template; it just evaluates
	// as a string
	metadataDialog$.html(this.template.metadataContent({
		layerId : layerId
	})).find("#metadataContent").append(document);
	try {
		metadataDialog$.dialog("destroy");
	} catch (e) {
	}

	var dialogHeight = 400;
	metadataDialog$.dialog({
		zIndex : 9999,
		width : 630,
		height : dialogHeight,
		title : "Metadata",
		autoOpen : false
	});

	return metadataDialog$;
};

this.addScrollMetadataToTop = function() {
	var content$ = jQuery("#metadataContent");
	content$.prepend(this.template.toMetadataTop());
	content$[0].scrollTop = 0;

	// event handlers
	content$.find("a").click(function(event) {
		var toId = jQuery(this).attr("href");
		if (toId.indexOf("#") == 0) {
			event.preventDefault();
			// parse the hrefs for the anchors in this DOM element into toId
			// current xsl uses names instead of ids; yuck
			toId = toId.substring(1);
			content$.scrollTo(jQuery('[name="' + toId + '"]'));
		}
	});

	jQuery("#toMetadataTop").on("click", function() {
		jQuery("#metadataContent")[0].scrollTop = 0;
	});
};

this.addMetadataDownloadButton = function(metadataDialog$, layerId) {
	var buttonId = "metadataDownloadButton";
	if (jQuery("#" + buttonId).length == 0) {
		var params = {};
		params.displayClass = "ui-titlebar-button";
		params.buttonId = buttonId;
		params.buttonLabel = "Download Metadata (XML)";
		metadataDialog$.parent().find(".ui-dialog-titlebar").first()
				.prepend(this.template.dialogHeaderButton(params));
		jQuery("#" + buttonId).button();
	}

	jQuery("#" + buttonId).off();
	var that = this;
	jQuery("#" + buttonId).on("click", function() {
		that.downloadMetadata(layerId);
	});
};

this.renderXmlMetadata = function(xmlMetadataDocument) {
	var url = this.chooseStyleSheet(xmlMetadataDocument);
	var xslDocument = this.retrieveStyleSheet(url);
	return this.transformXml(xmlMetadataDocument, xslDocument);
};

this.chooseStyleSheet = function(metadataDocument) {
	var stylesheetPath = "resources/xml/";
	var ISO_19139_styleSheet = "isoBasic.xsl";
	var FGDC_styleSheet = "FGDC_V2_a.xsl";
	var xslUrl = null;

	if (metadataDocument.firstChild.localName == "MD_Metadata") {
		// ISO 19139 stylesheet
		xslUrl = ISO_19139_styleSheet;
	} else {
		// FGDC stylesheet
		xslUrl = FGDC_styleSheet;
	}
	xslUrl = stylesheetPath + xslUrl;

	return xslUrl;
};

this.retrieveStyleSheet = function(url) {
	var styleSheet = null;

	var params = {
		url : url,
		async : false,
		dataType : 'xml',
		success : function(data) {
			styleSheet = data;
		}
	};
	jQuery.ajax(params);
	return styleSheet;
};

this.transformXml = function(xmlDocument, styleSheet) {
	var resultDocument = null;
	if (styleSheet !== null) {
		if (window.ActiveXObject) {
			// IE
			resultDocument = xmlDocument.transformNode(styleSheet);
		} else {
			var xsltProcessor = new XSLTProcessor();
			xsltProcessor.importStylesheet(styleSheet);
			resultDocument = xsltProcessor.transformToFragment(xmlDocument,
					window.document);
		}
	}
	return resultDocument;
};

this.downloadMetadata = function downloadMetadata(layerId) {
	var iframeSource = "getMetadata/download?id=" + layerId;
	OpenGeoportal.ogp.widgets.iframeDownload("metadataDownloadIframe", iframeSource);

	// this.analytics.track("Metadata", "Download Metadata", layerId);
};

// handles jsonp response from request for metadata call
this.viewMetadataJsonpError = function() {
	throw new Error(
			"The attempt to retrieve metadata for this layer failed.");
};
*/
