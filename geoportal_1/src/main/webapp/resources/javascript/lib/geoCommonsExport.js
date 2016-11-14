/**
 * This javascript module includes functions for exporting public layers to
 * GeoCommons via KML
 * 
 * @author Chris Barnett
 */

if (typeof OpenGeoportal === 'undefined') {
	OpenGeoportal = {};
} else if (typeof OpenGeoportal !== "object") {
	throw new Error("OpenGeoportal already exists and is not an object");
}

// Repeat the creation and type-checking code for the next level
if (typeof OpenGeoportal.Export === 'undefined') {
	OpenGeoportal.Export = {};
} else if (typeof OpenGeoportal.Export !== "object") {
	throw new Error("OpenGeoportal.Export already exists and is not an object");
}

/**
 * creates dialogs and requests to export a layer to GeoCommons.
 * @param exportObj
 */
OpenGeoportal.Export.GeoCommons = function GeoCommons(exportObj) {
	// console.log(exportObj);

	this.requestQueue = OpenGeoportal.ogp.appState.get("requestQueue");
	this.template = OpenGeoportal.ogp.template;
	this.widgets = OpenGeoportal.ogp.widgets;

	// an array of Backbone Models representing layers to export
	this.layerModels = exportObj.layers;
	this.descriptor = "geoCommonsExport";

	this.extentOptions = {
		"Layer Max" : exportObj.extent.maxForLayers,
		"Current Map" : exportObj.extent.current,
		"Global" : exportObj.extent.global
	};

	this.exportBasemapOptions = {
		"Acetate (GeoCommons default)" : "acetate",
		"Acetate Terrain" : "acetateterrain",
		"Google Hybrid" : "googlehybrid",
		"Google Satellite" : "googleaerial",
		"Google Street" : "googleroad",
		"OpenStreetMap" : "openstreetmap"
	};

	this.init = function init() {

	};

	this.exportDialog = function() {

		var dialogContent = this.getGeoCommonsExportDialogContent();
		var that = this;
		var dialogTitle = "Export Layers to GeoCommons";
		var dialogDivId = this.descriptor + "Dialog";
		// this.layerObj = uiObject.getLayerList("mapIt");
		var buttonsObj = {
			Cancel : function() {
				jQuery(this).dialog('close');
			},
			"Export" : function() {
				that.exportLayers.call(that);
				jQuery(this).dialog('close');
			}

		};
		this.widgets.dialogTemplate(dialogDivId, dialogContent, dialogTitle,
				buttonsObj);
		jQuery("#" + dialogDivId).dialog({
			"width" : "375"
		});
		jQuery("#" + dialogDivId).dialog('open');
		jQuery("#" + dialogDivId).dialog('moveToTop');

		jQuery("#" + dialogDivId).unbind("keypress");
		jQuery("#" + dialogDivId).bind("keypress", function(event) {
			if (event.keyCode == '13') {
				that.exportLayers();
				jQuery("#" + dialogDivId).dialog('close');
			}
		});
		jQuery("#createGeoCommonsAccountControl")
				.click(
						function() {
							window
									.open("http://geocommons.com/register",
											'geocommons',
											'toolbar=0,menubar=0,status=0,location=0,height=500,width=400');
						});
		
		return jQuery("#" + dialogDivId);
	};

	this.getInputElement = function(paramObj) {
		// function(labelText, inputType, className, idName, defaultValue){
		if (typeof paramObj.id === "undefined") {
			throw new Error("id must be defined.");
		}
		var idName = paramObj.id;
		var inputType = paramObj.type || "text";
		var defaultValue = paramObj.value || "";
		var labelText = paramObj.label || paramObj.name + ":" || "";
		var classNames;
		if (jQuery.isArray(paramObj.classes)) {
			classNames = paramObj.classes.join(" ");
		} else {
			classNames = paramObj.classes || "";
		}
		var elementType = paramObj.elementType || "textbox";
		elementType = elementType.toLowerCase();
		var elementLabelAsText = '<label for="' + idName + '">' + labelText
				+ '</label>';
		var elementAsText;
		switch (elementType) {
		case "textbox":
			elementAsText = elementLabelAsText + '<input type="' + inputType
					+ '" class="' + classNames + '" id="' + idName
					+ '" value="' + defaultValue + '" /></br>';
			break;
		case "selectbox":
			elementAsText = elementLabelAsText + '<select class="' + classNames
					+ '" id="' + idName + '" >';
			for ( var option in paramObj.options) {
				elementAsText += '<option value="' + paramObj.options[option]
						+ '" >' + option + '</option>';
			}
			elementAsText += '</select>';
			elementAsText += '</br>';
			break;
		}
		return elementAsText;
	};

	this.getGeoCommonsExportDialogContent = function() {
		var identifier = this.descriptor;
		var content = '<form id="' + identifier + 'Form">';

		var d = new Date();
		var arrDate = [ d.getMonth(), d.getDate(), d.getFullYear() ];
		var date = arrDate.join(".");
		var textBoxObj = {
			elementType : "textbox",
			id : identifier + "Title",
			name : "Title",
			value : "OGP Export " + date,
			classes : [ "dialog", identifier + "Form" ]
		};
		content += this.getInputElement(textBoxObj);

		textBoxObj.id = identifier + "Description";
		textBoxObj.name = "Description";

		var layerObj = this.layerModels;
		var titleArr = [];
		for ( var i in layerObj) {
			titleArr.push(layerObj[i].get("LayerDisplayName"));
		}
		textBoxObj.value = titleArr.join(", ");
		content += this.getInputElement(textBoxObj);

		// dropdown for extent
		/*
		 * var extentSelectId = identifier + "Extent"; var extentSelectObj = {
		 * elementType: "selectbox", id: extentSelectId, name: "Extent",
		 * options: this.extentOptions, classes: ["dialog", identifier + "Form"] };
		 * content += this.getInputElement(extentSelectObj);
		 */
		// bind change event to textBoxObj value above
		// dropdown for basemap
		var basemapSelectObj = {
			elementType : "selectbox",
			id : identifier + "Basemap",
			name : "Basemap",
			options : this.exportBasemapOptions,
			classes : [ "dialog", identifier + "Form" ]
		};
		content += this.getInputElement(basemapSelectObj);

		content += '<fieldset>';
		content += '<legend>GeoCommons Account Info</legend>';
		textBoxObj.id = identifier + "Username";
		textBoxObj.name = "Username";
		textBoxObj.value = null;
		content += this.getInputElement(textBoxObj);

		textBoxObj.id = identifier + "Password";
		textBoxObj.name = "Password";
		textBoxObj.type = "password";
		content += this.getInputElement(textBoxObj);

		content += '<div class="button linkButton" id="createGeoCommonsAccountControl">Create GeoCommons Account</div>';
		content += '</fieldset>';

		content += '</form>';
		return content;
	};

	this.getBasemapId = function getBasemapId(basemapDescriptor) {
		basemapDescriptor = basemapDescriptor.toLowerCase();
		var basemapMap = this.exportBasemapOptions;
		if (basemapMap[basemapDescriptor] !== "undefined") {
			return basemapMap[basemapDescriptor];
		} else {
			throw new Error('Basemap "' + basemapDescriptor + '" is undefined.');
		}
	};
	// need code to create dialog
	// code to send ajax request to export servlet
	this.createExportRequest = function createExportRequest() {
		// need a list of ogpids, basemap, username, password, extent
		// title, description....most of these will be provided by a form
		var descriptor = this.descriptor;
		var requestObj = {};
		requestObj.basemap = jQuery("#" + descriptor + "Basemap").val();
		requestObj.username = jQuery("#" + descriptor + "Username").val();
		requestObj.password = jQuery("#" + descriptor + "Password").val();
		requestObj.bbox = this.extentOptions["Layer Max"];// jQuery("#" +
		requestObj.title = jQuery("#" + descriptor + "Title").val();
		requestObj.description = jQuery("#" + descriptor + "Description").val();
		this.ogpids = [];
		for ( var i in this.layerModels) {
			this.ogpids.push(this.layerModels[i].get("LayerId"));
		}
		requestObj.layerIds = this.ogpids;
		
		return new OpenGeoportal.Models.GeoCommonsRequest(requestObj);

	};



	this.exportLayers = function exportLayers() {
		var request = this.createExportRequest();
		this.requestQueue.add(request);

	};

};
