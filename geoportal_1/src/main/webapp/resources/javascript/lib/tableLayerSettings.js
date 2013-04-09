/**
 * This javascript module maintains state for how the table displays layers
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
 * TableLayerSettings
 * this object maintains state for layers, dependent on table instance
 * 
 */
OpenGeoportal.TableLayerSettings = function TableLayerSettings(thisObj){
				//{layerId: {key: value}}; currently "expanded" is the only key, value is boolean
				var layersExpandedState = {};
				var tableDefaults = {"expanded": false};
				this.getFeatureTitle = "";
				this.setState = function(layerId, updateObj){
					var sync = false;
					if (typeof layersExpandedState[layerId] == 'undefined'){
						layersExpandedState[layerId] = {};
						for (var key in tableDefaults){
							layersExpandedState[layerId][key] = tableDefaults[key];
						}
					}
					for (var key in updateObj){ 
						if (typeof tableDefaults[key] == 'undefined'){
							throw new Error('The parameter "' + key + '" cannot be set for tableLayerState.');
						} else {
							if (layersExpandedState[layerId][key] != updateObj[key]){
								layersExpandedState[layerId][key] = updateObj[key];
								sync = true;
							}
						}
					}
					//if state has changed, propogate the change
					if (sync){
						syncUi(layerId, updateObj);
					}
				};

				this.getState = function(layerId, key){
					if (typeof layersExpandedState[layerId] == 'undefined'){
						if (typeof tableDefaults[key] == 'undefined'){
							throw new Error('The parameter "' + key + '" is not applicable to tableLayerState.');
						} else {
							var stateValue = tableDefaults[key];
							return stateValue;
						}
					} else {
						var stateValue = layersExpandedState[layerId][key];
						return stateValue;
					}
				};

				var syncUi = function (updateLayerId, updateObj){
					for (var key in updateObj){
						switch(key){
						case "expanded":
							//Is there a better way to make sure that the event is limited to the current table?
							if (updateObj[key]){
								console.log('syncUi open row: ' + updateLayerId + " " + thisObj.getTableId());
								jQuery('#' + thisObj.getTableId()).trigger("view.expandRow", {"layerId": updateLayerId});
							} else {
								jQuery('#' + thisObj.getTableId()).trigger("view.closeRow", {"layerId": updateLayerId});
							}
							break;
						}}
				};
};