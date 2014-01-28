/**
 * This javascript module includes functions for dealing with the cart table,
 * which inherits from the object LayerTable. LayerTable uses the excellent
 * jQuery-based dataTables as the basis for the table.
 * 
 * @author Chris Barnett
 * 
 */

if (typeof OpenGeoportal === 'undefined') {
	OpenGeoportal = {};
} else if (typeof OpenGeoportal !== "object") {
	throw new Error("OpenGeoportal already exists and is not an object");
}

/**
 * CartTable constructor this object defines the behavior of the cart table,
 * inherits from the LayerTable
 * 
 */
OpenGeoportal.CartTable = function CartTable() {
	OpenGeoportal.LayerTable.call(this);

	var that = this;
	var columnObj = {
		order : 1,
		columnName : "checkBox",
		solr : false,
		resizable : false,
		organize : false,
		visible : true,
		hidable : false,
		header : "<input type=\"checkbox\" id=\"downloadHeaderCheck\" checked />",
		columnClass : "colChkBoxes",
		width : 21,
		dtRender : function(data, type, full) {
			return that.controls.renderDownloadControl();
		},
		modelRender : function(model) {
			return that.controls.renderDownloadControl();
		}
	};

	this.tableHeadingsObj.add(columnObj);

	// we must override initControlHandlers to add additional eventhandlers to
	// the table
	this.initControlHandlers = function() {
		this.initControlHandlersDefault();
		this.initCartHandlers();
	};

	this.initCartHandlers = function() {
		this.checkHandler();
		this.createCartButtons();
	};

	// **************Table Specific
	this.numberOfResults = function() {
		var number = this.getTableObj().fnSettings().fnRecordsTotal();
		return number;
	};

	this.removeRows = function() {

		var checkedModels = this.backingData.where({
			isChecked : true
		});
		this.backingData.remove(checkedModels);
	};

	this.getEmptyTableMessage = function getEmptyTableMessage() {
		return "No data layers have been added to the cart.";
	};

	this.checkHandler = function() {
		var that = this;
		jQuery("#cartTable")
				.on(
						'click',
						".cartCheckBox",
						function(event, data) {
							var rowObj = jQuery(this).parentsUntil('tr').last()
									.parent()[0];
							var layerId = that.getTableObj().fnGetData(rowObj)["LayerId"];
							// console.log(layerId);
							var checkVal = jQuery(this).is(":checked");
							that.backingData.get(layerId).set({
								isChecked : checkVal
							});
						});
	};

	// ?
	// jQuery(document).on('click', '#downloadHeaderCheck',
	// that.toggleChecksSaved);

	this.toggleChecksSaved = function(eventObj) {
		var target = eventObj.target;
		if (jQuery(target).is(':checked')) {
			jQuery(target).attr('title', "Unselect All");
			jQuery(".cartCheckBox").each(function() {
				jQuery(this).attr('checked', true);
			});
		} else {
			jQuery(target).attr('title', "Select All");
			jQuery(".cartCheckBox").each(function() {
				jQuery(this).attr('checked', false);
			});
		}
	};

	this.downloadDialog = function() {
		// first, check to see if anything is in savedLayers & checked
		// backingData is the CartCollection
		var layerList = this.getLayerList("download");
		var dialogContent = "";

		if (layerList.length === 0) {
			dialogContent = 'No layers have been selected.';
		} else {
			// this should probably call a dialog instance for error
			// messages/notifications

			// generate a list of appropriate choices for the chosen layers
			// for now a best guess; at some point, we might be able to do
			// something clever
			// by looking at the download config file.
			var showVectorControl = false;
			var showRasterControl = false;
			var i = null;
			for (i in layerList) {
				if (layerList[i].has("requiresEmailAddress")) {
					needEmailInput = layerList[i].get("requiresEmailAddress");
				}
				if (layerList[i].get("baseType") == "vector") {
					showVectorControl = true; // determining available formats
					// should be smarter than this.
					// ideally, a getCapabilities
					// document would be inspected
					// at
					// some point to tell us what types are available. since
					// this could be slow, we should cache these, or at least
					// the info we need from them.
					continue;
				}
				if (layerList[i].get("baseType") == "raster") {
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
			// var emailInput = '<label for="emailAddress">Enter your email
			// address:</label><input id="emailAddress" type="text" /> </br>\n';
			var formatLabel = "<span>Select format for:</span><br />\n";
			if (showVectorControl || showRasterControl) {
				dialogContent += formatLabel;
				if (showVectorControl) {
					dialogContent += vectorControl;
				}
				if (showRasterControl) {
					dialogContent += rasterControl;
				}
				dialogContent += clipControl;

			} else {
				dialogContent += "The selected layers have an invalid data type and can not be downloaded.";
				layerList = [];
			}
		}

		var that = this;
		var params = {
			zIndex : 3000,
			autoOpen : false,
			minHeight : '30px',
			width : 300,
			title : "Download Settings",
			resizable : false,
			modal : true
		};
		if (typeof jQuery('#downloadDialog')[0] == 'undefined') {
			var downloadDiv = '<div id="downloadDialog" class="dialog downloadSettingsDialog"> \n';
			downloadDiv += dialogContent;
			downloadDiv += '</div> \n';
			jQuery('#dialogs').append(downloadDiv);
		} else {
			// replace dialog text/controls & open the instance of 'dialog' that
			// already exists
			jQuery("#downloadDialog").html(dialogContent);
			jQuery("#downloadDialog").dialog("option", "disabled", false);
		}
		jQuery("#downloadDialog").dialog(params);
		var buttons;
		if (layerList.length === 0) {
			buttons = {
				Cancel : function() {
					jQuery(this).dialog('close');
					jQuery("#optionDetails").html("");
					jQuery(".downloadSelection, .downloadUnselection")
							.removeClass(
									"downloadSelection downloadUnselection");
				}
			};
		} else {
			buttons = {
				Cancel : function() {
					jQuery(this).dialog('close');
					jQuery("#optionDetails").html("");
					jQuery(".downloadSelection, .downloadUnselection")
							.removeClass(
									"downloadSelection downloadUnselection");
				},
				Continue : function() {
					that.downloadContinue(layerList);
				}

			};
		}
		jQuery("#downloadDialog").dialog("option", "buttons", buttons);
		jQuery("#downloadDialog").dialog('open');
	};

	this.downloadContinue = function(arrLayers) {

		var clipped = this.isClipped();
		var vectorFormat = jQuery("#vectorDownloadType").val();
		var rasterFormat = jQuery("#rasterDownloadType").val();
		var bounds;
		var nonIntxLayers = [];
		if (clipped) {
			// if this is true, we should also make sure that part or all of the
			// requested layer is in the extent
			// if not, it should be excluded & user warned

			bounds = OpenGeoportal.ogp.map.getGeodeticExtent().toArray();
			// console.log(bounds);
			// arrLayers = this.getLayerList("download");
			var intxLayers = [];
			var i = null;
			for (i in arrLayers) {
				if (this.backingData.intersectsBounds(arrLayers[i], bounds)) {
					// console.log("intersects");
					intxLayers.push(arrLayers[i]);
				} else {
					// console.log("doesnt intersect");
					nonIntxLayers.push(arrLayers[i]);
				}
			}
			arrLayers = intxLayers;
		} else {
			bounds = [ -180, -90, 180, 90 ];
		}

		var layerList = [];
		var needEmailInput = 0;
		var layerNumber = 0;
		var j = null;
		for (j in arrLayers) {
			layerNumber++;
			var currentLayer = arrLayers[j];
			if ((currentLayer.has("requiresEmailAddress"))
					&& (currentLayer.get("requiresEmailAddress"))
					&& (rasterFormat.toLowerCase() != "kmz")) {
				needEmailInput++;
			}
			// this is ugly. we should have a better "API" for download
			var format = "";
			if (currentLayer.get("baseType") == "vector") {
				format = vectorFormat;
			} else if (arrLayers[j].get("baseType") == "raster") {
				format = rasterFormat;
			}

			var layerId = currentLayer.get("LayerId");
			layerList.push({
				layerId : layerId,
				format : format
			});
		}

		var downloadDialog$ = jQuery("#downloadDialog");
		if (layerNumber == 0) {
			downloadDialog$.dialog('close');
			return;
		}
		var requestObj = {};
		requestObj.type = "layer";
		if (bounds.length > 0) {
			requestObj.bbox = bounds.join();
		}

		requestObj.layers = layerList;

		// first, check to see if anything is in savedLayers & checked
		var that = this;

		var downloadContinue = '<div>You have selected ' + layerNumber
				+ ' layer' + OpenGeoportal.Utility.pluralSuffix(layerNumber)
				+ ' for download.</div>\n';
		var addEmail = "";
		if (needEmailInput > 0) {
			addEmail += '<div><label for="emailAddress">You have selected some layers that require an email address. Please enter your email to receive a download link:</label><br />\n';
			addEmail += '<input id="emailAddress" type="text" /></div>\n';
			addEmail += '<span id="emailValidationError" class="warning"></span>';

		}
		if ((layerNumber - needEmailInput) > 0) {
			downloadContinue += '<div>A zip file will be generated. \n';
			downloadContinue += 'It may take up to 10 minutes to process your file.<br /> \n';
			downloadContinue += '<span class="notice">Do not close the GeoData website.</span></div>\n';
		}
		downloadContinue += addEmail;
		downloadDialog$.html(downloadContinue);
		downloadDialog$
				.dialog({
					title : "Download",
					width : 350,
					show : "fade",
					hide : "fade",
					buttons : {
						Cancel : function() {
							jQuery(this).dialog('close');
							jQuery("#optionDetails").html("");
							jQuery(".downloadSelection, .downloadUnselection")
									.removeClass(
											"downloadSelection downloadUnselection");
						},
						Download : function() {
							if (layerNumber === 0) {
								jQuery(this).dialog('close');
								return;
							}
							var emailAddress = "";
							if (needEmailInput > 0) {
								emailAddress = jQuery("#emailAddress").val();
								if (!OpenGeoportal.Utility
										.checkAddress(emailAddress)) {
									var warningText = 'You must enter a valid email address.';
									jQuery("#emailValidationError").html(
											warningText);
									return;
								}
							}
							requestObj.email = emailAddress;

							that.requestDownload(requestObj, jQuery(this));

						}

					}
				});
		var email$ = jQuery("#emailAddress");
		if (email$.length > 0) {
			email$.focus();
		} else {
			downloadDialog$.siblings(".ui-dialog-buttonpane").find(
					".ui-dialog-buttonset > button").last().focus();
		}
	};

	this.isClipped = function() {
		if (jQuery('#checkClip').is(':checked')) {
			return true;
		} else {
			return false;
		}
	};

	this.requestErrorMessage = function(errorMessageObj) {

		var line = "";
		var failedToDownload = null;
		for (failedToDownload in data.failed) {
			line += "<tr>";
			// for (var infoElement in data.failed[failedToDownload]){
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
			// }
			line += "</tr>";
		}
		if (line.length > 0) {
			var message = '<table class="downloadStatus">';
			message += line;
			message += "</table>";
			this.genericModalDialog(message, "Download Errors");
		}
	};

	this.requestDownloadSuccess = function(data) {
		// this will simply be a request Id. add it to the request queue.
		// OpenGeoportal.org.downloadQueue.registerLayerRequest(data.requestId);

		// will also have status info for requested layers in this returned
		// object
		/*
		 * var line = ""; for (var failedToDownload in data.failed){ line += "<tr>";
		 * //for (var infoElement in data.failed[failedToDownload]){ line += "<td>";
		 * line += '<span class="ui-icon ui-icon-alert" style="float:left;
		 * margin:0 7px 20px 0;"></span>'; line += "</td>"; line += "<td>";
		 * line += data.failed[failedToDownload]["institution"]; line += "</td>";
		 * line += "<td>"; line += data.failed[failedToDownload]["title"];
		 * line += "</td>"; line += "<td>"; line +=
		 * data.failed[failedToDownload]["layerId"]; line += "</td>"; line += '<td><span
		 * class="warning">'; line += data.failed[failedToDownload]["message"];
		 * line += "</span></td>"; //} line += "</tr>"; } if (line.length >
		 * 0){ var message = '<table class="downloadStatus">'; message += line;
		 * message += "</table>"; this.genericModalDialog(message, "DOWNLOAD
		 * ERRORS"); } if (data.succeeded.length > 0){ //check packageLink if
		 * (typeof data.packageLink != 'undefined'){ jQuery("body").append('<iframe
		 * style="display:none" src="' + data.packageLink + '"></iframe>'); }
		 * var line = ""; for (var successful in data.succeeded){ if
		 * (data.succeeded[successful].disposition == "LINK_EMAILED"){ line += "<tr>";
		 * line += "<td>"; line += data.succeeded[successful]["institution"];
		 * line += "</td>"; line += "<td>"; line +=
		 * data.succeeded[successful]["title"]; line += "</td>"; //line += "<td>";
		 * //line += data.succeeded[successful]["layerId"]; //line += "</td>";
		 * //line += "<td>"; //line += data.succeeded[successful]["message"];
		 * //line += "</td>"; line += "</tr>"; } }
		 * 
		 * if (line.length > 0){ var message = "<p>A link for the following
		 * layers was emailed to '" + requestObj.email + "'. "; message += '<span
		 * class="notice">It may take up to 10 minutes to receive the email.</span></p>';
		 * message += '<table class="downloadStatus">'; message += line;
		 * message += "</table>"; this.genericModalDialog(message, "LAYERS
		 * EMAILED"); } }
		 */

	};

	this.requestDownload = function(requestObj, dialog$) {
		this.appState.get("requestQueue").createRequest(requestObj);

		try {
			var options = {
				to : "#requestTickerContainer",
				className : "ui-effects-transfer"
			};
			dialog$.parent().effect("transfer", options, 500, function() {
				dialog$.dialog('close');
			});

		} catch (e) {
			console.log(e);
			dialog$.dialog("close");
		}

		// where should this go?
		// jQuery(".downloadSelection,
		// .downloadUnselection").removeClass("downloadSelection
		// downloadUnselection");

	};

	this.markRows = function(arrModel, markClass) {
		var i = null;
		for (i in arrModel) {
			var layerId = arrModel[i].get("LayerId");
			var row$ = this.findTableRow(layerId);
			if (row$.next().hasClass("previewTools")) {
				row$.add(row$.next());
			}

			row$.addClass(markClass);

		}
	};

	this.getLayerList = function(action) {

		jQuery(".cartSelected").removeClass("cartSelected");
		jQuery(".cartUnavailable").removeClass("cartUnavailable");

		// these are the layers that have the action available
		var arrSelected = [];
		var arrUnavailable = [];
		var that = this;
		this.backingData.each(function(model) {
			if (!that.backingData.isActionAvailable(model, action)) {
				arrUnavailable.push(model);
			} else {
				if (model.get("isChecked")) {
					arrSelected.push(model);
				}
			}
		});
		this.markRows(arrUnavailable, "cartUnavailable");
		this.markRows(arrSelected, "cartSelected");
		// grey out layers where the action is unavailable

		/*
		 * var locationObj = jQuery.parseJSON(cart.getColumnData(aData,
		 * 'Location')); console.log(locationObj); var downloadLinkExists =
		 * false; var directDownloadUrl = ""; if (typeof
		 * locationObj["fileDownload"] != undefined){ downloadLinkExists = true;
		 * directDownloadUrl = locationObj["fileDownload"] }
		 * layerInfo[layerId].directDownload = downloadLinkExists;
		 * layerInfo[layerId].directDownloadUrl = directDownloadUrl;
		 */
		return arrSelected;
	};

	this.addSharedLayersToCart = function() {
		if (OpenGeoportal.Config.shareIds.length > 0) {
			var solr = new OpenGeoportal.Solr();
			solr.getLayerInfoFromSolr(OpenGeoportal.Config.shareIds,
					this.getLayerInfoJsonpSuccess, this.getLayerInfoJsonpError);
			return true;
		} else {
			return false;
		}
	};

	this.getLayerInfoJsonpSuccess = function(data) {
		// console.log(this);
		var docs = data.response.docs;
		that.backingData.add(docs);

		// if we want to preview the layer call below
		var i = null;
		for (i in docs) {
			that.addToPreviewed(docs[i].LayerId);
			// add info about color and size here as well.
			// layerid~1AAA tilde is delimiter, first character is size, last
			// three are color?
		}

		jQuery(document).trigger("map.zoomToLayerExtent", {
			bbox : OpenGeoportal.Config.shareBbox
		});
		// jQuery("#tabs").tabs("option", "active", 1);

	};

	this.getLayerInfoJsonpError = function() {
		throw new Error(
				"The attempt to retrieve layer information from layerIds failed.");
	};

	/*
	 * // solr query against layerIds // process data functions, pass to this
	 * function this.addLayerToCart = function(layerData){ var savedTable =
	 * jQuery('#savedLayers').dataTable(); var currentData =
	 * savedTable.fnGetData(); layerData = [layerData]; var newData =
	 * layerData.concat(currentData); savedTable.fnClearTable();
	 * savedTable.fnAddData(newData); this.updateSavedLayersNumber(); //TODO:
	 * add to cart collection //jQuery('#savedLayersNumber').text('(' +
	 * OpenGeoportal.cartTableObject.numberOfResults() + ')');
	 * //console.log(layerData); //var headingsObj =
	 * this.cartTableObject.tableHeadingsObj; //var layerId =
	 * layerData[0][headingsObj.getColumnIndex('LayerId')]; //var dataType =
	 * layerData[0][headingsObj.getColumnIndex('DataType')]; //var layerModel =
	 * this.previewed.getLayerModel({layerId: layerId, dataType: dataType});
	 * //layerModel.set({inCart: true}); };
	 */
	this.shortenLink = function(longLink) {
		var request = {
			"link" : longLink
		};
		var url = "shortenLink";
		var that = this;
		var ajaxArgs = {
			url : url,
			data : jQuery.param(request),
			type : "GET",
			dataType : "json",
			success : function(data) {
				var shortLink = data["shortLink"];
				jQuery("#shareText")
						.attr("rows", that.calculateRows(shortLink));
				jQuery("#shareDialog").dialog('open');
				jQuery("#shareText").text(shortLink).focus();
			}
		};

		jQuery.ajax(ajaxArgs);
	};

	this.calculateRows = function(theText) {
		var numCharacters = theText.length;
		var rows = 1;
		if (numCharacters > 75) {
			rows = Math.floor(numCharacters / 40);
		}
		return rows;
	};

	this.shareLayers = function() {

		var arrModels = this.getLayerList("shareLink");
		var layers = this.getLayerIdsFromModelArray(arrModels);

		var dialogContent = "";
		if (layers.length === 0) {
			dialogContent = 'No layers have been selected.';
			// this should probably call a dialog instance for error
			// messages/notifications
		} else {
			var path = top.location.href.substring(0, top.location.href
					.lastIndexOf("/"));
			var shareLink = path + "/";
			var geodeticBbox = OpenGeoportal.ogp.map.getGeodeticExtent()
					.toBBOX();
			var queryString = '?' + jQuery.param({
				ogpids : layers.join(),
				bbox : geodeticBbox
			});
			shareLink += queryString;

			dialogContent = '<textarea id="shareText" class="linkText" ></textarea> \n';
			dialogContent += '<p>Use this link to share this Cart</p>';
			this.shortenLink(shareLink);
		}

		this.createShareDialog(dialogContent);
	};

	this.createShareDialog = function(dialogContent) {
		if (typeof jQuery('#shareDialog')[0] == 'undefined') {
			var shareDiv = '<div id="shareDialog" class="dialog"> \n';
			shareDiv += dialogContent;
			shareDiv += '</div> \n';
			jQuery('#dialogs').append(shareDiv);
			jQuery("#shareDialog")
					.dialog(
							{
								zIndex : 3000,
								autoOpen : false,
								width : 495,
								height : 'auto',
								title : 'Share Cart',
								resizable : false,
								buttons : {
									Close : function() {
										jQuery(this).dialog('close');
										jQuery("#optionDetails").html("");
										jQuery(
												".downloadSelection, .downloadUnselection")
												.removeClass(
														"downloadSelection downloadUnselection");
									}
								}
							});
		} else {
			// replace dialog text/controls & open the instance of 'dialog' that
			// already exists
			jQuery("#shareDialog").html(dialogContent);
		}
		jQuery('#shareText').focus(function() {
			// Select input field contents
			this.select();
		});
	};

	this.getLayerIdsFromModelArray = function(arrModel) {
		var arrLayerId = [];
		var i = null;
		for (i in arrModel) {
			arrLayerId.push(arrModel[i].get("LayerId"));
		}
		return arrLayerId;
	};

	this.shareServices = function() {
		var layerList = this.getLayerList("webService");
		var dialogContent = "";
		var queryString = this.getLayerIdsFromModelArray(layerList);

		if (queryString.length == 0) {
			dialogContent = 'No layers have been selected.';
		} else {

			var serviceTypes = [
					{
						url : "dynamic/wfs",
						title : "Web Feature Service (WFS):",
						caption : "Creates a vector web service. Only available for vector data."
					},
					{
						url : "dynamic/wms",
						title : "Web Mapping Service (WMS):",
						caption : "Creates a raster web service for all your data. Vector data will be converted to raster format."
					} ];// WCS later?
			var path = top.location.href.substring(0, top.location.href
					.lastIndexOf("/"));
			dialogContent += '<p>Web Services are provided in two formats. Paste the selected link into your desktop mapping software.</p>';
			dialogContent += '<div id="owsServicesArea">\n';
			var i = null;
			for (i in serviceTypes) {
				dialogContent += '<span class="sub_headerTitle">'
						+ serviceTypes[i].title + '</span><a href="#">?</a>';
				dialogContent += '<br/><span>' + serviceTypes[i].caption
						+ '</span>';
				dialogContent += '<div class="owsServicesLinkContainer">';
				var dynamicCapabilitiesRequest = path + "/"
						+ serviceTypes[i].url + "?ogpids=" + queryString.join()
						+ "&request=GetCapabilities";
				dialogContent += '<textarea class="shareServicesText linkText" >'
						+ dynamicCapabilitiesRequest + '</textarea> <br />\n';
				dialogContent += '</div><br/>';
			}

			dialogContent += '</div>';

		}

		if (typeof jQuery('#shareDialog')[0] == 'undefined') {
			var shareDiv = '<div id="shareServicesDialog" class="dialog"> \n';
			shareDiv += '</div> \n';
			jQuery('#dialogs').append(shareDiv);
			jQuery("#shareServicesDialog")
					.dialog(
							{
								zIndex : 3000,
								autoOpen : false,
								height : 'auto',
								title : 'Web Services',
								width : 495,
								buttons : {
									Close : function() {
										jQuery(this).dialog('close');
										jQuery("#optionDetails").html("");
										jQuery(
												".downloadSelection, .downloadUnselection")
												.removeClass(
														"downloadSelection downloadUnselection");
									}
								}
							});
		}
		// replace dialog text/controls & open the instance of 'dialog' that
		// already exists
		jQuery("#shareServicesDialog").html(dialogContent);
		var that = this;
		jQuery(".shareServicesText").each(function() {
			jQuery(this).attr("rows", that.calculateRows(jQuery(this).text()));
		});

		jQuery("#shareServicesDialog").dialog('open');

		jQuery('.shareServicesText').bind("focus", function() {
			// Select input field contents
			this.select();
		});
		jQuery('.shareServicesText').first().focus();

	};

	this.createExportParams = function() {
		var exportParams = {};
		exportParams.layers = this.getLayerList("mapIt");
		exportParams.extent = {};
		var map = OpenGeoportal.ogp.map;
		exportParams.extent.global = map.getSpecifiedExtent("global");
		exportParams.extent.current = map.getSpecifiedExtent("current");
		exportParams.extent.maxForLayers = map.getSpecifiedExtent(
				"maxForLayers", exportParams.layers);
		return exportParams;
	};

	this.displayOptionText = function(event, optionText, listLabel) {
		var that = this;
		var button$ = jQuery(event.target);

		if (!button$.hasClass(".button")) {
			button$ = button$.closest(".button");
		}

		var optionContainer$ = jQuery("#optionDetails");
		optionContainer$.html('<div>' + optionText + '</div>');

		if (optionContainer$.css("display") === "none") {
			optionContainer$.show();
			jQuery(".arrow_buttons").hide();
		}
		button$.parent().find(".button").removeClass("detailsBottom");
		button$.addClass("detailsBottom");

	};

	this.addCartHeaderButton = function(buttonId, buttonLabel, helpText,
			listLabel, clickHandler) {
		var that = this;
		this.controls.appendButton(jQuery("#cartHeader"), buttonId,
				buttonLabel, clickHandler).on("mouseover", function(event) {
			that.displayOptionText(event, helpText, listLabel);
			that.getLayerList(listLabel);
		});
	};

	this.createCartButtons = function() {

		var that = this;
		var mapItHtml = "Open highlighted layers in GeoCommons to create maps.";
		var shareHtml = "Create a link to share this Cart.";
		var webServiceHtml = "Stream highlighted layers into an application.";
		var downloadHtml = "Download highlighted layers to your computer.";
		var removeHtml = "Remove selected layers from Cart.";

		var removeClick = function() {
			that.removeRows();
		};
		var downloadClick = function() {
			that.downloadDialog();
		};
		var mapItClick = function() {
			var geoCommonsExport = new OpenGeoportal.Export.GeoCommons(that
					.createExportParams());
			geoCommonsExport.exportDialog(that);
		};
		var webServiceClick = function() {
			that.shareServices();
		};
		var shareClick = function() {
			that.shareLayers();
		};

		this.addCartHeaderButton("removeFromCartButton", "Remove", removeHtml,
				"removeFromCart", removeClick);
		this.addCartHeaderButton("downloadButton", "Download", downloadHtml,
				"download", downloadClick);
		this.addCartHeaderButton("webServiceButton", "Web Service",
				webServiceHtml, "webService", webServiceClick);
		this.addCartHeaderButton("shareButton", "Share", shareHtml,
				"shareLink", shareClick);
		this.addCartHeaderButton("mapItButton", "MapIt", mapItHtml, "mapIt",
				mapItClick);

		// Hover handler
		var hideDetails = function() {
			jQuery(".arrow_buttons").show();
			jQuery("#optionDetails").hide();
			jQuery(".button").removeClass("detailsBottom");
			jQuery(".cartSelected, .cartUnavailable").removeClass(
					"cartSelected cartUnavailable");
		};
		// hide on the header, rather than the buttons, so the ui doesn't flash
		jQuery("#cartHeader.tableHeader").on("mouseleave", hideDetails);
		// hide here, or it's annoying to get to tabs
		jQuery("#optionDetails").on("mouseenter", hideDetails);

		/*
		 * 
		 * function(){if ((jQuery("#shareDialog").length ==
		 * 0)||(!jQuery("#shareDialog").dialog("isOpen"))){jQuery("#optionDetails").hide();
		 * jQuery(".downloadSelection,
		 * .downloadUnselection").removeClass("downloadSelection
		 * downloadUnselection");}});
		 * .hover(function(){jQuery("#optionDetails").html(webServiceHtml).show();that.getLayerList("webService");},
		 * function(){if ((jQuery("#shareServicesDialog").length ==
		 * 0)||(!jQuery("#shareServicesDialog").dialog("isOpen"))){jQuery("#optionDetails").hide();
		 * jQuery(".downloadSelection,
		 * .downloadUnselection").removeClass("downloadSelection
		 * downloadUnselection");}});
		 * jQuery("#downloadButton").hover(function(){jQuery("#optionDetails").html(downloadHtml).show();that.getLayerList("download");},
		 * function(){if ((jQuery("#downloadDialog").length ==
		 * 0)||(!jQuery("#downloadDialog").dialog("isOpen"))){jQuery("#optionDetails").hide();
		 * jQuery(".downloadSelection,
		 * .downloadUnselection").removeClass("downloadSelection
		 * downloadUnselection");}});
		 * jQuery("#removeFromCartButton").hover(function(){jQuery("#optionDetails").html(removeHtml).show();that.getLayerList("removeFromCart");},
		 * function(){jQuery("#optionDetails").hide();jQuery(".downloadSelection,
		 * .downloadUnselection").removeClass("downloadSelection
		 * downloadUnselection");});
		 */
	};

	// TODO: rewrite
	this.initSortable = function() {
		var that = this;
		jQuery("#savedLayers > tbody")
				.sortable(
						{
							helper : "original",
							opacity : .5,
							containment : "parent",
							items : "tr",
							tolerance : "pointer",
							cursor : "move",
							start : function(event, ui) {
								// this code is ugly...optimize
								jQuery("#savedLayers .resultsControls")
										.each(
												function() {
													var rowObj = jQuery(this)
															.parent()[0];
													// console.log(rowObj);
													var tableObj = jQuery(
															"#savedLayers")
															.dataTable();
													tableObj.fnClose(rowObj);
													// why doesn't this close
													// the row?
													tableObj.fnDraw(false);
												});
							},
							stop : function(event, ui) {
								var dataArr = [];
								var tableObj = jQuery("#savedLayers")
										.dataTable();
								dataArr = tableObj.fnGetData();
								var newArr = [];
								var openCount = 0;
								jQuery("#savedLayers > tbody > tr")
										.each(
												function(index, Element) {
													var dataTableIndex = tableObj
															.fnGetPosition(Element);
													if (typeof dataTableIndex == 'number') {
														newArr[index
																- openCount] = dataArr[dataTableIndex];
													} else {
														openCount += 1;
													}
												});
								tableObj.fnClearTable(false);
								tableObj.fnAddData(newArr);
								var tableLength = newArr.length;
								var i = null;
								for (i in newArr) {

									if (typeof OpenGeoportal.ogp.map
											.getLayersByName(newArr[i][0])[0] != 'undefined') {
										var layer = OpenGeoportal.ogp.map
												.getLayersByName(newArr[i][0])[0];
										OpenGeoportal.ogp.map.setLayerIndex(
												layer, tableLength - (i + 1));
									}
								}

								that.callbackExpand();

							}
						});
	};
};

OpenGeoportal.CartTable.prototype = Object
		.create(OpenGeoportal.LayerTable.prototype);
