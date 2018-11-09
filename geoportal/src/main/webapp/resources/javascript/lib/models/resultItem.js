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
 * The ResultsCollection holds search results. It also contains some logic for parsing results from Solr and for
 * paging. The ResultsCollection is where the actually Solr search query is fired, using Backbone fetch.
 * @type {any}
 */


OpenGeoportal.Models.ResultItem = Backbone.Model.extend({
	//there are some cases where the LayerId doesn't make a good id for a Backbone model
    //idAttribute: "LayerId"

});


OpenGeoportal.ResultsCollection = Backbone.Collection.extend({
	model: OpenGeoportal.Models.ResultItem,

    constructor: function (attributes, options) {
        _.extend(this, _.pick(options, "previewed", "queryTerms", "sort", "facets"));
        Backbone.Collection.apply(this, arguments);
    },

    initialize: function () {
        this.queryTerms.setSortInfo(this.sort);
    },
	
    fetchOn: false,

    queryTerms: null,

	url : function(){
        return this.queryTerms.getSearchRequest();
		},

	totalResults: 0,

    parse: function(resp) {
        return this.solrToCollection(resp);
      },

    parseFacets: function (facetResponse) {
        var facets = [];
        _.each(facetResponse.facet_fields, function (v, k) {
            var f = {
                field_id: k
            };
            for (var i = 0; i < v.length; i += 2) {
                f[v[i]] = v[i + 1];
            }
            facets.push(f);
        });

        return facets;
    },

    updateFacets: function (facetResponse) {
        var updatedFacets = this.parseFacets(facetResponse);
        var self = this;
        _.each(updatedFacets, function (facet) {
            var f = self.facets.findWhere({field_id: facet.field_id});
            if (_.isUndefined(f)) {
                self.facets.add(facet);
            } else {
                f.set(facet);
            }
        });

    },
		// converts solr response object to backbone models
	solrToCollection: function(dataObj) {
			// dataObj is a Javascript object (usually) returned by Solr
			this.totalResults = dataObj.response.numFound;
			var start = dataObj.response.start;
			var solrLayers = dataObj.response.docs;
			var ids = [];
        var previewed = this.previewed.each(function (model) {
            if (model.get("preview") === "on") {
                ids.push(model.get("LayerId"));
            }
        });
        this.updateFacets(dataObj.facet_counts);
			// solr docs holds an array of hashtables, each hashtable contains a
			// layer
			var arrModels = [];
			
			_.each(solrLayers, function(solrLayer){

				solrLayer.resultNum = start;
				start++;
				
				//filter out layers in the preview pane

				if (_.contains(ids, solrLayer.LayerId)){
					solrLayer.hidden = true;
				}
				
				//just parse the json here, so we can use the results elsewhere
				var locationParsed = {};
				try {
					var rawVal = solrLayer.Location;
					if (rawVal.length > 2){
						locationParsed = jQuery.parseJSON(rawVal);
					}
				} catch (err){
					console.log([solrLayer["LayerId"], err]);
				}
				solrLayer.Location = locationParsed;
                var dType = solrLayer.DataType;
                if (dType === "Paper Map" || dType === "Scanned Map") {
                    solrLayer.DataType = "ScannedMap";
                }
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
            // these parameters are used directly by Solr, so we need to maintain the naming conventions
			start: 0,
			rows: 50
		},
		
		fetchStatus: null,
		
		newSearch: function(){
			//console.log('new search');
			if (!this.fetchOn && typeof this.fetchStatus !== "undefined" && this.fetchStatus !== null){
				console.log("abort called");
				this.fetchStatus.abort();
			} else if (!this.fetchOn){
				return;
			}
			
	        this.disableFetch();
	        this.pageParams.start = 0;
	        var that = this;

	        var xhr = this.fetch({
	          dataType: "jsonp",
			  jsonp: "json.wrf",
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
	          dataType: "jsonp",
			  jsonp: "json.wrf",

	         // success: this.fetchSuccess,
	         // error: this.fetchError,
	          complete: function(){that.fetchComplete.apply(that, arguments);},
	          remove: false,
	          data: $.extend(this.pageParams, this.extraParams)
	        });
		},


		fetchComplete: function(){
			this.enableFetch();
		}

});
