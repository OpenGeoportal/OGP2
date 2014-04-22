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
OpenGeoportal.ResultsCollection = Backbone.PageableCollection.extend({
	model: OpenGeoportal.Models.ResultItem,
    // Enable infinite paging
    mode: "infinite",
    
	searcher: null,
	url : function(){
		if (this.searcher == null){
			this.searcher = new OpenGeoportal.Views.Query({
				model : new OpenGeoportal.Models.QueryTerms(),
				el : "form#searchForm"
			});
		}
		return this.searcher.getSearchRequest();// + "&start=" + this.start + "&rows=" + this.state.pageSize;
		},
		
	    // Initial pagination states
	    state: {
	    	firstPage: 0,
	    	pageSize: 50
	    },

	    // You can remap the query parameters from `state` keys from
	    // the default to those your server supports
	    queryParams: {
	    	currentPage: "start",
	    	pageSize: "rows",
	    	totalPages: null,
	    	totalRecords: null,
	    	sortKey: null
	    },

	totalResults: 0,
	isLoading: false,
    parseRecords: function(resp) {
        return this.solrToCollection(resp);
      },
		// converts solr response object to backbone models
	solrToCollection: function(dataObj) {
			// dataObj is a Javascript object (usually) returned by Solr

			this.totalResults = dataObj.response.numFound;
			var solrLayers = dataObj.response.docs;

			// solr docs holds an array of hashtables, each hashtable contains a
			// layer

			var arrModels = [];
			_.each(solrLayers, function(solrLayer){
				//just parse the json here, so we can use the results elsewhere
				var locationParsed = {};
				try {
					var rawVal = solrLayer.Location;
					if (rawVal.length > 2){
						locationParsed = jQuery.parseJSON(rawVal);
					}
				} catch (e){
					console.log([solrLayer["LayerId"], e]);
				}
				solrLayer.Location = locationParsed;
				arrModels.push(solrLayer);
			});
			return arrModels;
		}
		
		/*getResults: function(){
			if (this.isLoading){
				return;
			}
			var that = this;
			this.start = 0;
			this.isLoading = true;
			this.fetch({dataType: "jsonp", jsonp: "json.wrf", reset: true, complete: function(){that.isLoading = false;}});
		},
		
		nextPage: function(){
			if (this.isLoading){
				return;
			}
			console.log("next page");
			var that = this;
			this.start += this.rows + 1;
			this.isLoading = true;
			this.fetch({dataType: "jsonp", jsonp: "json.wrf", remove: false, complete: function(models){
				that.isLoading = false;
				}
			});
		}*/

});
