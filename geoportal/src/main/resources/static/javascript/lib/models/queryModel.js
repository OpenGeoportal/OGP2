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


OpenGeoportal.Models.QueryTerms = Backbone.Model.extend({
	defaults: {

		what: "",
		where: "",
		keyword: "",
		originator: "",
		dataType: [],
		repository: [],
		dateFrom: null,
		dateTo: null,
		isoTopic: "",
		facets: "",
		sortBy: "score",
		sortDir: "asc",
		mapExtent: {minX: -180, maxX: 180, minY: -90, maxY: 90},
		mapCenter: {centerX: 0, centerY: 0},
		ignoreSpatial: false,
		isoTopicList: null,
		dataTypeList: null,
		repositoryList: null,
		showRestricted: false,
		whatExample: "(Example: buildings)",
		whereExample:"(Example: Boston, MA)",
		searchType: "basic",
		history: []
	}, 
	
	initialize: function(){
		this.set({
			isoTopicList: OpenGeoportal.Config.IsoTopics,
			dataTypeList: OpenGeoportal.Config.DataTypes,
			repositoryList: OpenGeoportal.Config.Repositories});
	},
	
	/*
	 * adds spatial search params to solr object if pertinent
	 */
	setMapExtent : function(extent, center) {
		// make sure we're getting the right values for the extent

		var minX = extent.left;
		var maxX = extent.right;
		var minY = extent.bottom;
		var maxY = extent.top;
		var mapDeltaX = Math.abs(maxX - minX);
		var mapDeltaY = Math.abs(maxY - minY);
		if (mapDeltaX > 350) {
			minX = -180.0;
			maxX = 180.0;
		}
		if (mapDeltaY > 165) {
			minY = -90;
			maxY = 90;
		}
		var mapExtent = {
			minX : minX,
			maxX : maxX,
			minY : minY,
			maxY : maxY
		};

		//var center = data.mapCenter;
		var mapCenter = {
			centerX : center.lon,
			centerY : center.lat
		};

		this.set({
			mapExtent : mapExtent,
			mapCenter : mapCenter
		}, {
			silent : true
		});

		// if either attribute changes, fire a search
		if (typeof this.changed.mapCenter !== "undefined"
				|| typeof this.changed.mapExtent !== "undefined") {
			this.trigger("change:mapExtent");
		}

	},

	/**
	 * this function returns a solr URL with the many standard options
	 * set it provides a base solr object for both basic and advanced
	 * searching
	 * 
	 * @return Solr URL
	 */
	getSearchRequest : function() {

		var request = null;

		if (this.get("searchType") === 'advanced') {
			request = 'advancedSearch?' + jQuery.param(this.getAdvancedSearchQuery(), false);
		} else {
			request = 'search?' + jQuery.param(this.getBasicSearchQuery(), false);
		}

		this.addToHistory(request);

		return request;
	},
	getSortInfo : function() {
		return OpenGeoportal.ogp.resultsTableObj.tableOrganize;

	},
	/**
	 * add elements specific to basic search
	 */
	getBasicSearchQuery : function() {
		var sort = this.getSortInfo();
		var bounds = this.get("mapExtent");
		var center = this.get("mapCenter");

		return {
			what: this.get("what") || "",
			column: sort.get("column"),
			direction: sort.get("direction"),
			minX : Math.max(bounds.minX, -180),
			minY : Math.max(bounds.minY, -90),
			maxX : Math.min(bounds.maxX, 180),
			maxY : Math.min(bounds.maxY, 90),
			centerX: center.centerX,
			centerY: center.centerY
		}
	},

	process_term: function(params, param_key, param_value) {
		if (typeof param_value === "string") {
			if (param_value.trim().length > 0) {
				params[param_key] = param_value.trim();
			}
		} else {
			if (param_value !== null && param_value !== undefined) {
				params[param_key] = param_value;
			}
		}
	},

	getAdvancedSearchQuery : function() {

		var sort = this.getSortInfo();
		var bounds = this.get("mapExtent");
		var center = this.get("mapCenter");
		var ignoreSpatial = this.get("ignoreSpatial");
		var showRestricted = this.get("showRestricted");

		var params = {};
		this.process_term(params, "keyword", this.get("keyword")|| "");
		this.process_term(params, "where", this.get("where")|| "");
		this.process_term(params, "column", sort.get("column"));
		this.process_term(params, "direction", sort.get("direction"));
		this.process_term(params, "ignoreSpatial", ignoreSpatial);
		this.process_term(params, "includeRestricted", showRestricted);
		this.process_term(params, "dateFrom", this.get("dateFrom"));
		this.process_term(params, "dateTo", this.get("dateTo"));
		this.process_term(params, "originator", this.get("originator"));
		this.process_term(params, "publisher", this.get("publisher"));
		this.process_term(params, "isoTopic", this.get("isoTopic"));
		this.process_term(params, "dateFrom", this.get("dateFrom"));

		if (!ignoreSpatial) {
			this.process_term(params, "minX",  Math.max(bounds.minX, -180));
			this.process_term(params, "minY",  Math.max(bounds.minY, -90));
			this.process_term(params, "maxX",  Math.min(bounds.maxX, 180));
			this.process_term(params, "maxY",  Math.min(bounds.maxY, 90));
			this.process_term(params, "centerX",  center.centerX);
			this.process_term(params, "centerY",  center.centerY);
		}

		params["dataTypes"] = this.get("dataType");
		params["repositories"] = this.get("repository");

		return params;
	},

	/*******************************************************************
	 * Callbacks
	 ******************************************************************/

	// keeping track of the last search is useful in multiple cases
	// if a search that filter based on the map returned no results we
	// want to
	// re-run the search without the map filter and let user know if
	// there are results
	// after use login we re-run the query to update "login" buttons on
	// layers
	addToHistory : function(searchQuery) {
		// number of search objects to keep
		var historyLength = 5;
		var history = this.get("history");
		history.push(searchQuery);
		while (history.length > historyLength) {
			history.shift();
		}

	},

	rerunLastSearch : function() {
		var searchQuery = this.get("history").pop();
		if (searchQuery != null)
			solr.executeSearchQuery(this.searchRequestJsonpSuccess,
					this.searchRequestJsonpError);
	},

	/**
	 * called when the last search returned no results we rerun the last
	 * search without a spatial constraint if this search returns hits,
	 * we let the user know there is data outside the map note that this
	 * function changes the value returned by "getLastSolrSearch()"
	 * 
	 * @return
	 */
	addSpatialToEmptySearchMessage : function() {
		var searchQuery = this.get("history").pop();
		if (searchQuery != null) {
			searchQuery.clearBoundingBox();
			searchQuery.executeSearchQuery(this.emptySearchMessageHandler,
					this.searchRequestJsonpError);
		}
	}
});