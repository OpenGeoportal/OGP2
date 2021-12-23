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

    getSelectedRepositories: function () {
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
		//console.log("mapextent");
		//console.log(arguments);
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
        this.set("firstQueryFired", true);
		// console.log(solr.getURL());
		return request;
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
		return;
/*        var initQuery = this.get("initialQuery");
        if (!_.has(initQuery, "ExternalLayerId")) {
            throw new Error("Initial Query can only handle ExternalLayerId queries at this time.");
        }*/
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

		params["dataTypes"] = this.getSelected("dataTypeList");
		params["repositories"] = this.getSelectedRepositories();

		return params;
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
		return;
/*		var solr = this.get("history").pop();
		if (solr != null)
			solr.executeSearchQuery(this.searchRequestJsonpSuccess,
					this.searchRequestJsonpError);*/
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
		return;
/*		var solr = this.get("history").pop();
		if (solr != null) {
			solr.clearBoundingBox();
			solr.executeSearchQuery(this.emptySearchMessageHandler,
					this.searchRequestJsonpError);
		}*/
	}
});