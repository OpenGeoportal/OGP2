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
			this.searcher = new OpenGeoportal.Views.Query({
				model : OpenGeoportal.ogp.appState.get("queryTerms"),
				el : "form#searchForm"
			});
		}
		var self = this;
	},

    fetchOn: false,
	searcher: null,
	url : function(){
		return this.searcher.getSearchRequest();
		},

	totalResults: 0,
    parse: function(resp) {
        return this.solrToCollection(resp);
      },
		// converts solr response object to backbone models
	solrToCollection: function(dataObj) {
			// dataObj is a Javascript object (usually) returned by Solr
			this.totalResults = dataObj.response.numFound;
			var start = dataObj.response.start;
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
				
				solrLayer.resultNum = start;
				start++;
				arrModels.push(solrLayer);
			});
			return arrModels;
		},
	    
		enableFetch: function() {
		      this.fetchOn = true;
		    },

		disableFetch: function() {
		      this.fetchOn = false;
		    },
		
		extraParams: {
			//does this get added by solr object?
		},
		
		pageParams: {
			start: 0,
			rows: 50
		},
		
		fetchStatus: null,
		
		newSearch: function(){
			if (!this.fetchOn && this.fetchStatus !== null){
				this.fetchStatus.abort();
			}
			
	        this.disableFetch();
	        this.pageParams.start = 0;
	        var that = this;

	        this.fetchStatus = this.fetch({
	          dataType: "jsonp",
			  jsonp: "json.wrf",

	          complete: function(){that.fetchComplete.apply(that, arguments);},
	          reset: true,
	          data: $.extend(this.pageParams, this.extraParams)
	        });

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
	          dataType: "jsonp",
			  jsonp: "json.wrf",

	         // success: this.fetchSuccess,
	         // error: this.fetchError,
	          complete: function(){that.fetchComplete.apply(that, arguments);},
	          remove: false,
	          data: $.extend(this.pageParams, this.extraParams)
	        });
		},

		fetchError: function(collection, response) {
		      self.enableFetch();

		      self.options.error(collection, response);
		    },
		fetchComplete: function(){
			this.enableFetch();
		}

});
