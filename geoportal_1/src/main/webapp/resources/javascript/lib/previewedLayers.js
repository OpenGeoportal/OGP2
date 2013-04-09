if (typeof OpenGeoportal == 'undefined'){
	OpenGeoportal = {};
} else if (typeof OpenGeoportal != "object"){
    throw new Error("OpenGeoportal already exists and is not an object");
}
/*OpenGeoportal.PreviewedLayers
*	object to hold which layers are currently previewed
*/
OpenGeoportal.PreviewedLayers = function PreviewedLayers(){
			this.layers = [];
			this.getLayers = function(){
				return this.layers;
			};
			this.addLayer = function(layer){
				this.layers.unshift(layer);
				return this.layers;
			};
			this.removeLayer = function(columnValue, columnIndex){
				for (var layerIndex in this.layers){
					if (this.layers[layerIndex][columnIndex] == columnValue){
						this.layers.splice(layerIndex, 1);
					}
				}
			};
			this.clearLayers= function(){
				this.layers = [];
			};
}; 