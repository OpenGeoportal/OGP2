/**
 * This javascript module maintains state for how the table is sorted
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
 * TableSettings
 * this object maintains state for the LayerTable
 * 
 */
OpenGeoportal.TableSettings = function TableSettings(thisObj){
	
	//really only applies to search results table
	this.tableSorter = {};
			
	//maintains state for layers, where the state can differ with table instances
	this.tableLayerState = new OpenGeoportal.TableLayerSettings(thisObj);

	//object defines the columns and their display properties, holds state information
	this.tableConfig = new OpenGeoportal.TableConfig(thisObj);

};