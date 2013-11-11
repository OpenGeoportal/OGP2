/**
 * This javascript module maintains state for how the table is configured
 * 
 * @author Chris Barnett
 * 
 */

if (typeof OpenGeoportal == 'undefined'){
	OpenGeoportal = {};
} else if (typeof OpenGeoportal != "object"){
	throw new Error("OpenGeoportal already exists and is not an object");
}

if (typeof OpenGeoportal.Models == 'undefined'){
	OpenGeoportal.Models = {};
} else if (typeof OpenGeoportal.Models != "object"){
    throw new Error("OpenGeoportal.Models already exists and is not an object");
}

/**
 * TableConfig
 * this object maintains state for the LayerTable
 * 
 */

OpenGeoportal.Models.ColumnInfo = Backbone.Model.extend({
	idAttribute: "columnName"
});

//object defines the columns and their display properties, holds state information
OpenGeoportal.TableConfig = Backbone.Collection.extend({
	model: OpenGeoportal.Models.ColumnInfo,
	comparator: function(model) {
		  return model.get("order");
	}
	
});
