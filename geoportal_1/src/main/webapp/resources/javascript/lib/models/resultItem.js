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


OpenGeoportal.Models.ResultItem = Backbone.Model.extend({

    idAttribute: "LayerId",

    /*initialize: function(opts) {

     console.log("initializing result item");
     console.log(opts);
     //this.setDataTypes(opts.DataType);

    }//,
*/
    /**
     * Sets two boolean properties on a layer: isVector and isRaster.
     */
   /* setDataTypes: function(datatype) {

        var dt,
            v_formats = ['point', 'line', 'polygon'],
            r_formats = ['raster', 'paper map'];

        if (typeof datatype === "string") {
            dt = datatype.toLowerCase();
            this.set("isVector", _.indexOf(v_formats, dt) !== -1);
            this.set("isRaster", _.indexOf(r_formats, dt) !== -1);
        }

    },

    sync: function() {}*/

});

OpenGeoportal.ResultCollection = Backbone.Collection.extend({
	model: OpenGeoportal.Models.ResultItem
});
