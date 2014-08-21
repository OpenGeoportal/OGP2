if (typeof OpenGeoportal == 'undefined'){
	OpenGeoportal = {};
} else if (typeof OpenGeoportal != "object"){
    throw new Error("OpenGeoportal already exists and is not an object");
}

if (typeof OpenGeoportal.Views == 'undefined'){
	OpenGeoportal.Views = {};
} else if (typeof OpenGeoportal.Views != "object"){
    throw new Error("OpenGeoportal.Views already exists and is not an object");
}


OpenGeoportal.Views.LayerAttributeView = Backbone.View.extend({
	initialize: function(){
		jQuery(document).trigger({type: "showLoadIndicator", loadType: "getFeature", layerId: layerId});
		this.listenTo("fetch", function(){
			that.render();
			jQuery(document).trigger({type: "hideLoadIndicator", loadType: "getFeature", layerId: layerId});
		});
	},
	getFeatureAttributesSuccessCallback: function(layerId, dialogTitle,
			data) {
		// grab the html table from the response
		var responseTable$ = jQuery(data).filter(function() {
			return jQuery(this).is('table');
		});

		var template = this.template;
		var tableText = "";

		if ((responseTable$.length === 0)
				|| (jQuery(data).find("tr").length === 0)) {
			// what should happen here? returned content is empty or otherwise
			// unexpected
			tableText = '<p>There is no data for "' + dialogTitle
					+ '" at this point.</p>';
		} else {
			responseTable$ = responseTable$.first();
			// process the html table returned from wms getfeature request
			var rows = this.processAttributeTable(responseTable$);

			tableText = template.attributeTable({
				layerId : layerId,
				title : dialogTitle,
				tableContent : rows
			});

			var attrNames = [];
			for ( var i in rows) {
				attrNames.push(rows[i].header);
			}
			this.registerAttributes(layerId, attrNames);

		}

		this.createAttributeDialog(tableText);

	},

	createAttributeDialog: function(dialogContent){
		// create a new dialog instance, or just open the dialog if it already
		// exists
		var elId = "featureInfo";
		if (typeof jQuery('#' + elId)[0] === 'undefined') {
			var infoDiv = template.genericDialogShell({
				elId : elId
			});
			jQuery("#dialogs").append(infoDiv);
			jQuery("#" + elId).dialog({
				zIndex : 2999,
				title : "Feature Attributes",
				width : 'auto',
				autoOpen : false
			});

		}
		
		jQuery("#" + elId).fadeOut(200, function() {
			jQuery(this).html(dialogContent);
			// limit the height of the dialog. some layers will have hundreds of
			// attributes
			var containerHeight = jQuery("#container").height();
			var linecount = jQuery(this).find("tr").length;
			var dataHeight = linecount * 20;
			if (dataHeight > containerHeight) {
				dataHeight = containerHeight;
			} else {
				dataHeight = "auto";
			}
			jQuery(this).dialog("option", "height", dataHeight);

			jQuery(this).dialog('open');
			jQuery(this).fadeIn(200);
		});
	},
	
	render: function(){
		return this;
	}


});


	

