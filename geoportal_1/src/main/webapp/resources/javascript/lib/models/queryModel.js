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
		displayRestrictedAdvanced: [],

		geocodedBbox: null,
		isoTopicList: null,
		dataTypeList: null,
		repositoryList: null,
		displayRestrictedBasic: [],
		whatExample: "(Example: buildings)",
		whereExample:"(Example: Boston, MA)",
		searchType: "basic",
		history: []
	}, 
	
	initialize: function(){
		var restricted = OpenGeoportal.Config.General.get("loginConfig").repositoryId;

		this.set({displayRestrictedBasic: [restricted],
			displayRestrictedAdvanced:  [restricted],
			isoTopicList: OpenGeoportal.Config.IsoTopics,
			dataTypeList: OpenGeoportal.Config.DataTypes,
			repositoryList: OpenGeoportal.Config.Repositories});
		
		this.listenTo(this, "change:geocodedBbox", function(){
			//console.log("geocoder map zoom");
			var geoBbox = this.get("geocodedBbox");
			if (geoBbox !== null){
				jQuery(document).trigger("map.zoomToLayerExtent", {
					bbox : geoBbox
				});
			}
		});
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

		var solr = null;

		var searchType = this.get("searchType");

		if (searchType === 'basic') {
			solr = this.getBasicSearchQuery();
		} else if (searchType === 'advanced') {
			solr = this.getAdvancedSearchQuery();
		} else {
			// fall through
			solr = this.getBasicSearchQuery();
		}

		this.addToHistory(solr);
		// console.log(solr.getURL());
		return solr.getURL();
	},
	getSortInfo : function() {
		return OpenGeoportal.ogp.resultsTableObj.tableOrganize;

	},
	/**
	 * add elements specific to basic search
	 */
	getBasicSearchQuery : function() {
		var solr = new OpenGeoportal.Solr();
		solr.setSearchType(this.get("searchType"));
		var sort = this.getSortInfo();
		solr.setSort(sort.get("column"), sort.get("direction"));

		solr.setBoundingBox(this.get("mapExtent"));
		solr.setCenter(this.get("mapCenter"));

		var what = this.get("what");
		if ((what != null) && (what != "")) {
			solr.setWhat(what);
		}
		
		var where = this.get("where");
		if ((where != null) && (where != "")){
			solr.setWhere(where); 
		}
		 

		solr.addFilter(solr.createAccessFilter(this.get("displayRestrictedBasic")));

		/*
		 * var institutionConfig =
		 * OpenGeoportal.InstitutionInfo.getInstitutionInfo();
		 * 
		 * for (var institution in institutionConfig){
		 * solr.addInstitution(institution); }
		 */
		return solr;
	},

	getAdvancedSearchQuery : function() {
		var solr = new OpenGeoportal.Solr();
		solr.setSearchType(this.get("searchType"));

		var sort = this.getSortInfo();
		solr.setSort(sort.get("column"), sort.get("direction"));

		// check if "ignore map extent" is checked
		var ignoreSpatial = this.get("ignoreSpatial");
		solr.setIgnoreSpatial(ignoreSpatial);
		if (!ignoreSpatial) {
			solr.setBoundingBox(this.get("mapExtent"));
			solr.setCenter(this.get("mapCenter"));
		}

		var keywords = this.get("keyword");
		if ((keywords !== null) && (keywords !== "")) {
			solr.setAdvancedKeywords(keywords);
		}

		var dateFrom = this.get("dateFrom");
		var dateTo = this.get("dateTo");
		solr.addFilter(solr.createDateRangeFilter("ContentDate",
				dateFrom, dateTo));

		var dataTypes = this.get("dataType");// columnName,
		// values, joiner,
		// prefix
		solr.addFilter(solr.createFilter("DataType", dataTypes,
				"{!tag=dt}"));

		var repositories = this.get("repository");
		//console.log(repositories);
		solr.addFilter(solr.createFilter("Institution", repositories,
				"{!tag=insf}"));

		solr.addFilter(solr.createAccessFilter(this.get("displayRestrictedAdvanced")));

		var originator = this.get("originator");
		// TODO: should this be a filter?
		solr.addFilter(solr.createFilter("Originator", originator,
				null, "AND"));

		var isoTopic = this.get("isoTopic");
		solr.addFilter(solr.createFilter("ThemeKeywordsSynonymsIso",
				isoTopic));

		return solr;
	},
	

	/*******************************************************************
	 * Callbacks
	 ******************************************************************/

	// keeping track of the last solr search is useful in multiple cases
	// if a search that filter based on the map returned no results we
	// want to
	// re-run the search without the map filter and let user know if
	// there are results
	// after use login we re-run the query to update "login" buttons on
	// layers
	addToHistory : function(solr) {
		// number of search objects to keep
		var historyLength = 5;
		var history = this.get("history");
		history.push(solr);
		while (history.length > historyLength) {
			history.shift();
		}

	},
	rerunLastSearch : function() {
		var solr = this.get("history").pop();
		if (solr != null)
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
		var solr = this.get("history").pop();
		if (solr != null) {
			solr.clearBoundingBox();
			solr.executeSearchQuery(this.emptySearchMessageHandler,
					this.searchRequestJsonpError);
		}
	}
});