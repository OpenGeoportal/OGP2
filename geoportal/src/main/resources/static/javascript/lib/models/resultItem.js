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
	//there are some cases where the LayerId doesn't make a good id for a Backbone model
    //idAttribute: "LayerId"

});

OpenGeoportal.ResultCollection = Backbone.Collection.extend({
	model: OpenGeoportal.Models.ResultItem
});

//collection for the bbview results table (to replace above)
OpenGeoportal.ResultsCollection = Backbone.Collection.extend({
	model: OpenGeoportal.Models.ResultItem,
	initialize: function(){
		if (this.searcher === null){
			this.searcher = OpenGeoportal.ogp.appState.get("queryTerms"); 
		}
	},
	
    fetchOn: false,
	searcher: null,
	url : function(){
		return this.searcher.getSearchRequest();
		},

	totalResults: 0,
    parse: function(resp) {
        return this.searchResponseToCollection(resp);
      },
		// converts solr response object to backbone models
	searchResponseToCollection: function(response) {
			this.totalResults = response.numFound;
			var start = response.start;
			var rowList = response.docs;
			var ids = [];
			OpenGeoportal.ogp.appState.get("previewed").each(function(model){
				if (model.get("preview") === "on"){
					ids.push(model.get("LayerId"));
				}
			});

			// solr docs holds an array of hashtables, each hashtable contains a
			// layer
			var arrModels = [];
			
			_.each(rowList, function(row){

				row.resultNum = start;
				start++;
				
				//filter out layers in the preview pane

				if (_.contains(ids, row.LayerId)){
					row.hidden = true;
				}
				
				//just parse the json here, so we can use the results elsewhere
				var locationParsed = {};
				try {
					var rawVal = row.Location;
					if (rawVal.length > 2){
						locationParsed = jQuery.parseJSON(rawVal);
					}
				} catch (err){
					console.log([row["LayerId"], err]);
				}
				row.Location = locationParsed;

                // Collapse these values to "Paper Map".
                var dType = row.DataType;
                dType = dType.replace(/\s/g, "").toLowerCase();
                if (dType === "scannedmap" || dType === "papermap") {
                    row.DataType = "Paper Map";
                }

				arrModels.push(row);
			});
			return arrModels;
		},
	    
		
		enableFetch: function() {
		      this.fetchOn = true;
		    },

		disableFetch: function() {
		      this.fetchOn = false;
		    },
		
		extraParams: {},
		
		pageParams: {
			start: 0,
			rows: 50
		},
		
		fetchStatus: null,
		
		newSearch: function(){
			if (!this.fetchOn && typeof this.fetchStatus !== "undefined" && this.fetchStatus !== null){
				console.log("abort called");
				this.fetchStatus.abort();
			}
			
	        this.disableFetch();
	        this.pageParams.start = 0;
	        var that = this;

	        var xhr = this.fetch({
	          dataType: "json",
	          complete: function(){that.fetchComplete.apply(that, arguments); jQuery(document).trigger("newResults");},
	          reset: true,
	          data: $.extend(this.pageParams, this.extraParams)
	        });
	        this.fetchStatus = xhr;
	        return xhr;
		},
		
		nextPage: function(){
			if (!this.fetchOn){
				return;
			}
			
	       this.disableFetch();
	        
	       this.pageParams.start = this.last().get("resultNum") + 1;
	       
	       if (this.pageParams.start > this.totalResults){
	    	   return;
	       }
	       var that = this;
	       this.fetchStatus = this.fetch({
	          dataType: "json",
	          complete: function(){that.fetchComplete.apply(that, arguments);},
	          remove: false,
	          data: $.extend(this.pageParams, this.extraParams)
	        });
		},


		fetchComplete: function(){
			this.enableFetch();
		}

});
