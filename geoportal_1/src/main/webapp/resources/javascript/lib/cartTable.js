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
		this.highlightRowsHandler();
	};

	// **************Table Specific
	this.numberOfResults = function() {
		var number = this.getTableObj().fnSettings().fnRecordsTotal();
		return number;
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
							var model = that.backingData.findWhere({LayerId: layerId});
							if (typeof model !== "undefined"){
								model.set({
									isChecked : checkVal
								});
							}
						});
		

		 jQuery(document).on('click', '#downloadHeaderCheck',
				 that.toggleChecksSaved);
	};



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

	this.highlightRowsHandler = function(){
		var that = this;
		jQuery(document).on("highlightCartRows", function(e){

			that.markSelected(e.layers);
		});
		jQuery(document).on("clearCartRows", function(e){

			that.clearMarkedRows();
		});
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
		jQuery(".cartAction").removeClass("cartAction");
	};

	this.markSelected = function(arrSelected) {
		this.clearMarkedRows();
		this.markRowsWithClass(this.backingData.models, "cartAction");
		this.markRowsWithClass(arrSelected, "cartSelected");
	};

	// put in Cart Collection?
	this.addSharedLayersToCart = function() {
		if (OpenGeoportal.Config.shareIds.length > 0) {
			var solr = new OpenGeoportal.Solr();
			var that = this;
			solr.getLayerInfoFromSolr(OpenGeoportal.Config.shareIds,
					function(){that.getLayerInfoJsonpSuccess.apply(that, arguments);}, 
					function(){that.getLayerInfoJsonpError.apply(that, arguments);});
			return true;
		} else {
			return false;
		}
	};

	this.getLayerInfoJsonpSuccess = function(data) {
		var tableData = this.processSearchResponse(data);
		var that = this;
		
		// if we want to preview the layer call below
		var i = null;
		
		//the layers won't get added to the cart table via reset, so remove them and re-add them.
		var collection = this.backingData.clone();
		this.backingData.reset();
		this.backingData.add(collection.models);
		collection.each(function(model){
			try{
				that.addToPreviewed(model.get("LayerId"));
			} catch (e) {
				console.log(e);
			}
			// add info about color and size here as well.
			// layerid~1AAA tilde is delimiter, first character is size, last
			// three are color?
			console.log(that.previewed);
		});

		jQuery(document).trigger("map.zoomToLayerExtent", {
			bbox : OpenGeoportal.Config.shareBbox
		});
		// jQuery("#tabs").tabs("option", "active", 1);

	};

	this.getLayerInfoJsonpError = function() {
		throw new Error(
				"The attempt to retrieve layer information from layerIds failed.");
	};



};

OpenGeoportal.CartTable.prototype = Object
		.create(OpenGeoportal.LayerTable.prototype);
