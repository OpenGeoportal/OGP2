/**
 * 
 * @author Chris Barnett
 * 
 */

if (typeof OpenGeoportal == 'undefined'){
	OpenGeoportal = {};
} else if (typeof OpenGeoportal != "object"){
	throw new Error("OpenGeoportal already exists and is not an object");
}

/**
 * CommonControls constructor
 * this object determines how to render controls common across the application
 * 
 * @param object OpenGeoportal.OgpSettings
 */
OpenGeoportal.CommonControls = function CommonControls(){
	//dependencies;  revamp with require.js
	var template = OpenGeoportal.ogp.appState.get("template");
	this.cart = OpenGeoportal.ogp.appState.get("cart");
	this.previewed = OpenGeoportal.ogp.appState.get("previewed");
	
	/*********
	 *  
	 *  Render table columns
	 *********/

	//maps returned data type to appropriate image
	this.renderTypeIcon = function (dataType){
		var typeIcon = OpenGeoportal.InstitutionInfo.DataTypes;
		var params = {};
		params.controlClass = "typeIcon";

		if ((typeof dataType == "undefined")||(dataType === null)){
			params.displayClass = "undefinedType";
			params.tooltip = "Unspecified";
			params.text = "?";
		} else {
			//dataType = dataType.toLowerCase();
			if (dataType == "Paper Map"){
				dataType = "Paper+Map";
			}
			var iconModel = typeIcon.findWhere({value: dataType});
			if (typeof iconModel == 'undefined'){
				params.displayClass = "undefinedType";
				params.tooltip = "Unspecified";
				params.text = "?";
			} else {
				params.displayClass = iconModel.get("uiClass");
				params.tooltip = iconModel.get("displayName");
				params.text = "";
			}
		}
		var icon = template.genericIcon(params);
		
		return icon;
	};

	this.renderExpandControl = function (layerExpanded){
		var params ={};
		params.text = "";
		params.controlClass = "expandControl";
		if (layerExpanded){
			params.displayClass = "expanded";
			params.tooltip = "Hide preview controls";
		} else {
			params.displayClass = "notExpanded";
			params.tooltip = "Show preview controls";
		}
		return template.genericControl(params);
	};
	
	  //the layer table should handle creating the control;  the preview obj should handle the logic to determine which
	  this.renderPreviewControl = function(layerId, access, institution, previewState){		 
	  		access = access.toLowerCase(); 
		  if (access == "public"){
			  return this.renderActivePreviewControl(layerId, previewState);
		  } else {
			  //check user object
			  if (OpenGeoportal.InstitutionInfo.getHomeInstitution().toLowerCase() === institution.toLowerCase() && OpenGeoportal.ogp.appState.get("login").model.get("authenticated")){
			  	return this.renderActivePreviewControl(layerId, previewState);
			  } else {
			  	return this.renderLoginPreviewControl(layerId, institution);
			  }
		  }
	  };
		//TODO: fix this
	/*	this.getExternalPreviewControl = function(rowObj){
			//what defines external?
			var imgSource = this.getImage("view_external.png");
			var layerSource = this.getColumnData(rowObj.aData, "Institution");
			var imgText = "Click to go to " + layerSource;
			// previewControl = '<img class="button" onclick="' + context + '.previewLayer(this)" src="' + imgSource + '" title="' + imgText + '" />';
			var previewControl = '<img class="button goExternalButton" src="' + imgSource + '" title="' + imgText + '" ';//open sharecart link in new tab
			//temporary...
			var path = "";
			if (layerSource == "Harvard"){
				path = "http://calvert.hul.harvard.edu:8080/opengeoportal";
				var shareLink = path + "/openGeoPortalHome.jsp";
				var layerId = this.getLayerIdFromRow(rowObj);
				var geodeticBbox = OpenGeoportal.ogp.map.getGeodeticExtent();
				var queryString = '?' + jQuery.param({ layer: layerId, minX: geodeticBbox.left, minY: geodeticBbox.bottom, maxX: geodeticBbox.right, maxY: geodeticBbox.top });
				shareLink += queryString;
				previewControl += 'onclick="window.open(\'' + shareLink + '\');return false;"';
			} else if (layerSource == "MIT"){
				path = "http://arrowsmith.mit.edu/mitogp";
				var shareLink = path + "/openGeoPortalHome.jsp";
				var layerId = this.getLayerIdFromRow(rowObj);
				var geodeticBbox = OpenGeoportal.ogp.map.getGeodeticExtent();
				var queryString = '?' + jQuery.param({ layer: layerId, minX: geodeticBbox.left, minY: geodeticBbox.bottom, maxX: geodeticBbox.right, maxY: geodeticBbox.top });
				shareLink += queryString;
				previewControl += 'onclick="window.open(\'' + shareLink + '\');return false;"';
			}
			previewControl += '/>';
			return previewControl;
		};
*/
	  this.renderLoginPreviewControl = function(layerId){
			var tooltipText = "Login to access this layer";
			var previewControl = '<div class="button loginButton login" title="' + tooltipText + '" ></div>';
			return previewControl;
		};

		this.renderActivePreviewControl = function(layerId, previewState){
			var stateVal = null;
			if (typeof previewState != "undefined"){
				stateValue = previewState;
			} else {
				var currModel = this.previewed.get(layerId);
				stateVal = "off";
				if (typeof currModel != "undefined"){
					stateVal = currModel.get("preview");
					if (typeof stateVal == "undefined"){
						stateVal = "off";
					}
				}
			}
			var params = {};
			params.controlClass = "previewControl";
			params.text = "";
			switch (stateVal){
			case "off":
				params.tooltip = "Preview layer on the map";
				params.displayClass = "checkOff"; 
				break;
			case "on":
				params.tooltip = "Turn off layer preview on the map";
				params.displayClass = "checkOn";
				break;
			default:
				break;
			}

			return template.genericControl(params);
		};

	this.renderDate = function(date){
		if (typeof date == "undefined"){
			return "";
		}
		if (date.length > 4){
			date = date.substr(0, 4);
		}
		if (date == "0001"){
			date = "?";
		}
		return date;
	};

	//maps returned source type to appropriate image
	this.renderRepositoryIcon = function(repository){

		if ((typeof repository == "undefined")||(repository === null)){
			return "";
		}
		if (repository.length == 0){
			return "";
		}
		repository = repository.toLowerCase();
		var params = {};
		params.tooltip = "";
		params.displayClass = "undefinedInstitution";
		params.controlClass = "repositoryIcon";
		params.text = "?";
		var repositoryModel = OpenGeoportal.InstitutionInfo.Repositories.get(repository);
		if (typeof repositoryModel == 'undefined'){
			//
		} else {
			params.tooltip = repositoryModel.get("fullName");
			params.displayClass = repositoryModel.get("sourceIconClass");
			params.text = "";			
		}
		return template.genericIcon(params);
	};

	this.renderSaveControl = function (layerId){
		var stateVal = false;
		var selModel = this.cart.get(layerId);
		if (typeof selModel != 'undefined'){
			stateVal = true;
		}
		var params = {};
		params.controlClass = "saveControl";			
		params.text = "";

		if (stateVal == true){
			params.tooltip = "Remove this layer from your cart.";
			params.displayClass = "inCart";
		} else {
			params.tooltip = "Add this layer to your cart for download.";
			params.displayClass = "notInCart";
		}  
		return template.genericControl(params);
	};
	
	this.renderMetadataControl = function(dataType){
		if ((typeof dataType == "undefined")||(dataType === null)){
			return "";
		}
		var params = {};
		params.controlClass = "infoControl";
		params.text = "";
		if (dataType.toLowerCase() == "libraryrecord"){
			params.displayClass = "viewLibraryRecordControl";
			params.tooltip =  "Show record.";
		} else {
			params.displayClass = "viewMetadataControl";
			params.tooltip = "Show metadata.";
		}
		return template.genericControl(params);
	};
	
	this.renderDownloadControl = function (){
		return template.defaultDownloadCheckbox();
	};
	
	/*
	 * Metadata control
	 * 
	 */
	
	// obtain layer's metadata via jsonp call
	this.viewMetadata = function(layerId){
		//make an ajax call to retrieve metadata
		var solr = new OpenGeoportal.Solr();
		var url = solr.getServerName() + "?" + jQuery.param(solr.getMetadataParams(layerId));
		var query = solr.sendToSolr(url, this.viewMetadataJsonpSuccess, this.viewMetadataJsonpError, this);

		//this.analytics.track("Metadata", "Display Metadata", layerId);
	};	
	
	this.processMetadataSolrResponse = function(data){
		var solrResponse = data.response;
		var totalResults = solrResponse.numFound;
		if (totalResults != 1){
			throw new Error("Request for Metadata returned " + totalResults +".  Exactly 1 was expected.");
			return;
		}
		var doc = solrResponse.docs[0];  // get the first layer object
		return doc;
	};
	// handles jsonp response from request for metadata call
	this.viewMetadataJsonpSuccess = function(data){
		try{
			var doc = this.processMetadataSolrResponse(data);
			var metadataRawText = doc.FgdcText;
			var layerId = doc.LayerId;
		
			var xmlDocument = null;
			try {
				xmlDocument = jQuery.parseXML(metadataRawText);
			} catch (e){
				throw new Error("Error parsing returned XML: the document may be invalid.");
			}
			var document = null;
			try {
				document = this.renderMetadata(xmlDocument);
			} catch (e){
				throw new Error("Error transforming XML document: the document may be of the wrong type.");
			}
			var dialog$ = this.renderMetadataDialog(layerId, document);
			dialog$.dialog("open");
		} catch(e){
			console.log(e);
			throw new Error("Error opening the metadata dialog.");
		}

	};
	
	this.renderMetadataDialog = function(layerId, document){
		var dialogId = "metadataDialog";
		if (typeof jQuery('#' + dialogId)[0] == 'undefined'){
			jQuery('#dialogs').append(template.genericDialogShell({id: dialogId}));
		}
		
		var metadataDialog$ = jQuery("#" + dialogId);
		//should remove any handlers w/in #metadataDialog
		//can't pass the document directly into the template;  it just evaluates as a string
		metadataDialog$.html(template.metadataContent({layerId: layerId})).find("#metadataContent").append(document);
		try{
			metadataDialog$.dialog("destroy");
		} catch (e) {}
		
		var dialogHeight = 400;
		metadataDialog$.dialog({ zIndex: 9999, width: 630, height: dialogHeight, title: "Metadata", autoOpen: false });  

		var content$ = jQuery("#metadataContent");
		content$[0].scrollTop = 0;
		
		var buttonId = "metadataDownloadButton";
		if (jQuery("#" + buttonId).length == 0){
			var params = {};
			params.displayClass = "ui-titlebar-button";
			params.buttonId = buttonId;
			params.buttonLabel = "Download Metadata (XML)";
			metadataDialog$.parent().find(".ui-dialog-titlebar").first().prepend(template.dialogHeaderButton(params));
			jQuery("#" + buttonId).button();
		}


		//event handlers
		content$.find("a").click(function(event){
			var toId = jQuery(this).attr("href");
			if (toId.indexOf("#") == 0){
				event.preventDefault();
				//parse the hrefs for the anchors in this DOM element into toId
				//current xsl uses names instead of ids; yuck
				toId = toId.substring(1);
				content$.scrollTo(jQuery('[name="' + toId + '"]'));
			}
		});
		jQuery("#" + buttonId).off();
		var that = this;
		jQuery("#" + buttonId).on("click", function(){that.downloadMetadata(layerId);});
		jQuery("#toMetadataTop").on("click", function(){jQuery("#metadataContent")[0].scrollTop = 0;});
		
		return metadataDialog$;
	};
	
	this.renderMetadata = function(xmlMetadataDocument){
		var url = this.chooseStyleSheet(xmlMetadataDocument);
		var xslDocument = this.retrieveStyleSheet(url);
		return this.transformXml(xmlMetadataDocument, xslDocument);
	};
	
	this.chooseStyleSheet = function(metadataDocument){
		var stylesheetPath = "resources/xml/";
		var ISO_19139_styleSheet = "isoBasic.xsl";
		var FGDC_styleSheet = "FGDC_V2_a.xsl";
		var xslUrl = null;

		if (metadataDocument.firstChild.localName == "MD_Metadata"){
			//ISO 19139 stylesheet
			xslUrl = ISO_19139_styleSheet;
		} else {
			//FGDC stylesheet
			xslUrl = FGDC_styleSheet;
		}
		xslUrl = stylesheetPath + xslUrl;
		
		return xslUrl;
	};
	
	this.retrieveStyleSheet = function(url){
		var styleSheet = null;
		
		var params = {
				url: url,
				async: false,
				dataType: 'xml',
				success: function(data){styleSheet = data;}
		};
		jQuery.ajax(params);
		return styleSheet;
	};
	
	this.transformXml = function(xmlDocument, styleSheet){
		var resultDocument = null;
		if (styleSheet !== null){
			if (window.ActiveXObject){
				//IE
				resultDocument = xmlDocument.transformNode(styleSheet);
			} else {
				var xsltProcessor = new XSLTProcessor();
				xsltProcessor.importStylesheet(styleSheet);
				resultDocument = xsltProcessor.transformToFragment(xmlDocument, window.document);
			}
		}
		return resultDocument;
	};

	this.downloadMetadata = function downloadMetadata(layerId){
		var iframeSource = "getMetadata/download?id=" + layerId;
		this.iframeDownload("metadataDownloadIframe", iframeSource);

		//this.analytics.track("Metadata", "Download Metadata", layerId);
	};
	
	this.iframeDownload = function(iframeClass, iframeSrc){
		var newIframe = template.iframeDownload({iframeClass: iframeClass, iframeSrc: iframeSrc});
		var iframe$ = jQuery(newIframe).appendTo('#iframes');
		var timeout = 1 * 60 * 1000;//allow 1 minute for download before iframe is removed
		jQuery(document).on("iframeload", iframe$, function(){setTimeout(function(){iframe$.remove();}, timeout);});
	};

	// handles jsonp response from request for metadata call
	this.viewMetadataJsonpError = function(){
		throw new Error("The attempt to retrieve metadata for this layer failed.");
	};



	this.showLibraryRecord = function(layerId){

		var location = this.backingData.get(layerId).get("location");
		//open info in location
		var that = this;
		for (var urlType in location){
			if (urlType.toLowerCase() == "maprecord"){
				var params = {
						url: location[urlType],
						dataType: 'jsonp',
						success: that.openMapRecordSuccess
				};
				jQuery.ajax(params);
			} else if (urlType.toLowerCase() == "librecord"){
				window.open(location[urlType]);
			}
		}
	};	

	//how do we generalize this?
	this.openMapRecordSuccess = function(data){
		if (data.sys_id.length > 0){
			window.open("http://library.mit.edu/item/" + data.sys_id);
			return;
		} 

		if (data.row_id.length > 0) {
			var lookupHTML = "<div><span>Title: </span>";
			if (data.title.length > 0){
				lookupHTML += data.title;
			} else {
				lookupHTML += 'Unknown';
			}
			lookupHTML += '</div>';

			lookupHTML += '<div><span>Publisher: </span>';
			if (data.publisher.length > 0){
				lookupHTML += data.publisher;}
			else {
				lookupHTML += 'Unknown';}
			lookupHTML += '</div>';

			if (data.cartographer.length > 0){
				lookupHTML += '<div><span>Cartographer: </span>';
				lookupHTML += data.cartographer;
				lookupHTML += '</div>';
			}
			lookupHTML += '<div><span>Geographic Area: </span>' + data.geoarea + '</div>';
			var arrYears = [];
			if (data.cont_year.length > 0){
				arrYears.push({"label": "Content Date", "value": data.cont_year});
			}
			if (data.pub_year.length > 0){
				arrYears.push({"label": "Publication Date", "value": data.pub_year});
			}
			if (data.mit_year.length > 0){
				arrYears.push({"label": "Date Acquired", "value": data.mit_year});
			}
			if (data.est_year.length > 0){
				arrYears.push({"label": "Estimated Content Date", "value": data.est_year});
			}
			if (arrYears.length > 0){
				var yearObj = arrYears.shift();
				lookupHTML += '<div><span>' + yearObj.label + ': </span>' + yearObj.value + '</div>' ;
			}
			if (arrYears.length > 0){
				var yearObj = arrYears.shift();
				lookupHTML += '<div<span>>' + yearObj.label + ': </span>' + yearObj.value + '</div>' ;
			}
			if (data.notes.length > 0){
				lookupHTML += '<div><span>Notes: </span>' + data.notes + '</div>';
			}

			if (data.library == 'Rotch'){
				lookupHTML += '<div><span>Location: </span>Rotch Library - Map Room, Building 7-238</div>';}
			else{
				lookupHTML += '<div><span>Location: </span>' + data.library + '</div>';}

			lookupHTML += '<div><span>Drawer: </span>' + data.drawer + '</div>';
			lookupHTML += '<div><span>Folder: </span>' + data.folder + '</div>';

		} else {
			lookupHTML = 'Error: Please contact GIS Help.';;
		}

		if (typeof jQuery('#mapRecordDialog')[0] == 'undefined'){
			var dialogDiv = '<div id="mapRecordDialog" class="dialog"> \n';
			dialogDiv += '</div> \n';
			jQuery('body').append(dialogDiv);
		}
		var libRecordDialog = jQuery("#mapRecordDialog");
		libRecordDialog.dialog({ zIndex: 9999, width: 572, height: 266, title: "<div>MAP RECORD</div>" });  
		libRecordDialog[0].scrollTop = 0;
		jQuery("#mapRecordDialog").html(lookupHTML);
		libRecordDialog.dialog("open");
	};
	
	this.solrAutocomplete = function(textField$, solrField){
		textField$.autocomplete({
			source: function( request, response ) {
				var solr = new OpenGeoportal.Solr();
				var facetSuccess = function(data){
					var labelArr = [];
					var dataArr = data.terms[solrField];
					for (var i in dataArr){
						if (i%2 != 0){
							continue;
						}
						var temp = {"label": dataArr[i], "value": '"' + dataArr[i] + '"'};
						labelArr.push(temp);
						i++;
						i++;
					}
					response(labelArr);
				};
				var facetError = function(){};
				solr.termQuery(solrField, request.term, facetSuccess, facetError, this);

			},
			minLength: 2,
			select: function( event, ui ) {

			},
			open: function() {
				jQuery( this ).removeClass( "ui-corner-all" ).addClass( "ui-corner-top" );
			},
			close: function() {
				jQuery( this ).removeClass( "ui-corner-top" ).addClass( "ui-corner-all" );
			}
		});
	};
	
	this.addButton = function(parent$, buttonId, buttonLabel, clickHandler){
		var that = this;
		var html = template.genericButton({buttonId: buttonId, buttonLabel: buttonLabel});
		jQuery(html).appendTo(parent$).hide();
		var button$ = jQuery("#" + buttonId);
		button$.button({
			create: function( event, ui ) {jQuery(this).show();}
		}).on("click", clickHandler);
		return button$;
	};
	
	this.genericModalDialog = function(customMessage, dialogTitle){

		var divId = "genericModalDialog" + jQuery('.genericModalDialog').size();
		var div = '<div id="' + divId + '" class="dialog genericModalDialog">';
		div += customMessage;
		div += '</div>';
		jQuery('#dialogs').append(div);

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
	
	this.dialogTemplate = function dialogTemplate(dialogDivId, dialogContent, dialogTitle, buttonsObj) {
		if (typeof jQuery('#' + dialogDivId)[0] == 'undefined'){
			var dialogDiv = '<div id="' + dialogDivId + '" class="dialog"> \n';
			dialogDiv += dialogContent;
			dialogDiv += '</div> \n';
			jQuery('#dialogs').append(dialogDiv);
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

	this.minimizeDialog = function(dialogId){
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

	this.isDialogMinimized = function(dialogId){
		var result;
		if (jQuery("#" + dialogId).data().minimized) {
			result = true;
		} else {
			result = false;
		}
		return result;
	};

	this.maximizeDialog = function(dialogId){
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
	};



	this.infoBubble = function(bubbleId, infoHtml, optionsObj){

		var arrowDirection = "top-arrow";//default value
		if (optionsObj.arrow == 'top'){
			arrowDirection = "top-arrow";
		} else if (optionsObj.arrow == "left"){
			arrowDirection = "left-arrow";
		}
		var closeBubble = '<div class="closeBubble button"></div>';
		var doNotShow = '<label><input type="checkbox"/>Do not show this screen again</label>';
		var infoBubble = '<div class="infoBubbleText triangle-isosceles ' + arrowDirection + '">' + closeBubble + infoHtml + doNotShow + '</div>';
		var infoBubbleMain = '<div id="' + bubbleId + '" class="infoBubbleBackground triangle-isoscelesBackground ' + arrowDirection + 'Background">' + infoBubble + '</div>';

		jQuery("#infoBubbles").append(infoBubbleMain);
		jQuery("#" + bubbleId).height(optionsObj.height + 4).width(optionsObj.width + 4).css("top", optionsObj.top - 2).css("left", optionsObj.left -2);
		jQuery("#" + bubbleId + " > .infoBubbleText").height(optionsObj.height).width(optionsObj.width);
		var infoBubble$ = jQuery("#" + bubbleId);
		infoBubble$.on("click", ".closeBubble", function(){infoBubble$.fadeOut();}).fadeIn();

		return infoBubble$;
	};
	
	
};