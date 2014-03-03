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

	this.markRowsWithClass = function(arrModel, markClass) {
		var i = null;
		for (i in arrModel) {
			var layerId = arrModel[i].get("LayerId");
			var row$ = this.findTableRow(layerId);
			if (row$.next().find(".previewTools").length > 0) {
				row$ = row$.add(row$.next());
			}

			row$.addClass(markClass);

		}
	};

	this.clearMarkedRows = function() {
		jQuery(".cartSelected").removeClass("cartSelected");
		jQuery(".cartUnavailable").removeClass("cartUnavailable");
	};

	this.markUnavailableAndSelected = function(arrUnavailable, arrSelected) {
		this.clearMarkedRows();
		this.markRowsWithClass(arrUnavailable, "cartUnavailable");
		this.markRowsWithClass(arrSelected, "cartSelected");
	};

	// put in Cart Collection?
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

	this.displayOptionText = function(event, optionText, listLabel) {
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
			// TODO: how do I highlight rows in the table?
		});
	};

	this.createCartButtons = function() {

		var that = this;
		var mapItHtml = "Open highlighted layers in GeoCommons to create maps.";
		var shareHtml = "Create a link to share this Cart.";
		var webServiceHtml = "Stream highlighted layers into an application.";
		var downloadHtml = "Download highlighted layers to your computer.";
		var removeHtml = "Remove selected layers from Cart.";

		var cartCollection = this.backingData;

		var removeClick = function() {
			that.removeRows();
		};
		// what happens to views when they go out of scope?
		var downloadClick = function() {
			new OpenGeoportal.Views.Download({
				collection : cartCollection
			});
		};
		var mapItClick = function() {
			new OpenGeoportal.Views.MapIt({
				collection : cartCollection
			});
		};
		var webServiceClick = function() {
			new OpenGeoportal.Views.WebServices({
				collection : cartCollection
			});
		};
		var shareClick = function() {
			new OpenGeoportal.Views.ShareCart({
				collection : cartCollection
			});
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

};

OpenGeoportal.CartTable.prototype = Object
		.create(OpenGeoportal.LayerTable.prototype);
