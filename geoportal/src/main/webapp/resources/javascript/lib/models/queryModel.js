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
 * QueryTerms sets defaults for OGP search queries, as well as setting behavior for basic and advanced query types.
 * @type {any}
 */
OpenGeoportal.Models.QueryTerms = Backbone.Model.extend({
    constructor: function (attributes, options) {
        _.extend(this, _.pick(options, "config"));
        Backbone.Model.apply(this, arguments);
    },

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
        includeRestricted: true,
        includeRestrictedBasic: false,
        alwaysIncludeRestrictedFrom: [],
        initialQuery: {},
        firstQueryFired: false,
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

    initialize: function (options) {

        // Always show restricted layers for repositories you can log in to
        var restricted = this.config.General.get("loginConfig").repositoryId;
        var alwaysInclude = this.get("alwaysIncludeRestrictedFrom");
        alwaysInclude.push(restricted);

        //show restricted layers from all repositories
        //var repositories = OpenGeoportal.Config.Repositories.pluck("shortName")[0];

        this.set({
            alwaysIncludeRestrictedFrom: alwaysInclude,
            isoTopicList: this.config.IsoTopics,
            dataTypeList: this.config.DataTypes,
            repositoryList: this.config.Repositories

        });

        this.listenTo(this, "change:geocodedBbox", function () {
            //console.log("geocoder map zoom");
            var geoBbox = this.get("geocodedBbox");
            if (geoBbox !== null) {
                jQuery(document).trigger("map.zoomToLayerExtent", {
                    bbox: geoBbox
                });
            }
        });
	},


    getSelected: function (list) {
        var selected = [];
        this.get(list).each(function (item) {
            if (item.has('selected') && item.get('selected')) {
                selected.push(item.get('value'));
            }
        });
        return selected;
    },

    getSelectedRepositories: function (list) {
        var selected = [];
        this.get("repositoryList").each(function (item) {
            if (item.has('selected') && item.get('selected')) {
                selected.push(item.get('shortName'));
            }
        });
        return selected;
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

        if (this.has("firstQueryFired") && !this.get("firstQueryFired")
            && this.has("initialQuery" && !_.isEmpty(this.get("initialQuery")))) {
            solr = this.getInitialQuery();
        } else {
            var searchType = this.get("searchType");

            if (searchType === 'basic') {
                solr = this.getBasicSearchQuery();
            } else if (searchType === 'advanced') {
                solr = this.getAdvancedSearchQuery();
            } else {
                // fall through
                solr = this.getBasicSearchQuery();
            }
        }

        this.addToHistory(solr);
        this.set("firstQueryFired", true);
		// console.log(solr.getURL());
		return solr.getURL();
	},

    sort: null,
    setSortInfo: function (sortModel) {
        this.sort = sortModel;
    },

    getSortInfo: function () {
        if (this.sort !== null) {
            return this.sort;
        } else {
            throw new Error("Must associate results table with the Query Model.");
        }

    },

    getInitialQuery: function () {
        var solr = new OpenGeoportal.Solr();
        var initQuery = this.get("initialQuery");
        if (!_.has(initQuery, "ExternalLayerId")) {
            throw new Error("Initial Query can only handle ExternalLayerId queries at this time.");
        }
        solr.addFilter(solr.createFilter("ExternalLayerId", initQuery["ExternalLayerId"]));
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
        if ((where != null) && (where != "")) {
            solr.setWhere(where);
        }

        var showRestricted = this.get("includeRestrictedBasic");

        if (!showRestricted) {

            //add filter for which restricted data to show by default (maybe for local layers)
            var alwaysInclude = this.get("alwaysIncludeRestrictedFrom");
            var filter = "";
            if (alwaysInclude.length > 0) {
                filter = solr.createAccessFilter(alwaysInclude);
            } else {
                filter = solr.createAccessFilter();
            }
            solr.addFilter(filter);
        }

        var repositories = this.config.Repositories.pluck("id");
        solr.addFilter(solr.createFilter("Institution", repositories, "{!tag=insf}"));
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

        var dataTypes = this.getSelected("dataTypeList");// columnName,
		// values, joiner,
        // prefix //expand "Paper Map" filter
        if (_.contains(dataTypes, "ScannedMap")) {
            dataTypes.push("Scanned Map");
            dataTypes.push("Paper Map");
        }
		solr.addFilter(solr.createFilter("DataType", dataTypes,
				"{!tag=dt}"));

        var repositories = this.getSelectedRepositories();
		//console.log(repositories);
		solr.addFilter(solr.createFilter("Institution", repositories,
				"{!tag=insf}"));

        var showRestricted = this.get("includeRestricted");

        if (!showRestricted) {

            //add filter for which restricted data to show by default (maybe for local layers)
            var alwaysInclude = this.get("alwaysIncludeRestrictedFrom");
            var filter = "";
            if (alwaysInclude.length > 0) {
                filter = solr.createAccessFilter(alwaysInclude);
            } else {
                filter = solr.createAccessFilter();
            }
            solr.addFilter(filter);
        }

		var originator = this.get("originator");
		// TODO: should this be a filter?
		solr.addFilter(solr.createFilter("Originator", originator,
				null, "AND"));

        var isoTopic = this.getSelected("isoTopicList")[0];

        if (isoTopic !== null && isoTopic.length > 0) {
            solr.addFilter(solr.createFilter("ThemeKeywordsSynonymsIso",
                isoTopic));
        }

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