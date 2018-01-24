// This code provides an interface to the spatial data in the OpenGeoportal Solr server


// Solr queries can contain multiple filters (fq=) and a single query term (q=).  Filters are used to eliminate rows
// from the set of returned results.  However, they do not affect scoring.  The query term
// can both eliminate rows and specify a boost (which affects scoring).
// For spatial searching, both filtering and query terms are used.

// Repeat the creation and type-checking code for the next level
if (typeof OpenGeoportal === 'undefined') {
	OpenGeoportal = {};
} else if (typeof OpenGeoportal !== "object") {
	throw new Error("OpenGeoportal already exists and is not an object");
}

OpenGeoportal.Solr = function() {
	// constructor code

    /**
     * retrieve the solr endpoint injected into the client on page load. could be a url or a relative path.
     */
	this.getServerName = function getServerName() {
		return OpenGeoportal.Config.General.get("searchUrl");
	};


	/***************************************************************************
	 * Base Query
	 **************************************************************************/

	this.ignoreSpatial = false;
	this.setIgnoreSpatial = function(bool) {
		this.ignoreSpatial = bool;
	};

	this.getSearchParams = function() {

		this.textParams = this.getOgpTextSearchParams();
		this.spatialParams = {};
		if (!this.ignoreSpatial) {
			this.spatialParams = this.getOgpSpatialQueryParams(this.bounds);
		}

		this.baseParams = {
			wt : "json",
            facet: true,
            'facet.field': ['{!ex=f_institution}InstitutionSort', '{!ex=f_datatype}DataTypeSort'],
            'facet.method': 'enum',
			defType : "edismax",
			fl : this.getReturnedColumns(this.SearchRequest),
			sort : this.getSortClause()
		// ,
		// debug: true
		};

		var params = this.combineParams(this.baseParams, this.spatialParams,
				this.textParams);
		return params;
	};

	this.combineParams = function() {
		var newParams = {};
		for ( var i in arguments) {
			var currentObj = arguments[i];

			for ( var j in currentObj) {
				if (typeof newParams[j] === "undefined"
						|| newParams[j].length === 0) {
					newParams[j] = currentObj[j];
				} else if (jQuery.isArray(newParams[j])) {
					if (jQuery.isArray(currentObj[j])) {
						for ( var k in currentObj[j]) {
							newParams[j].push(currentObj[j][k]);
						}
					} else {
						newParams[j].push(currentObj[j]);
					}
				} else {
					newParams[j] = currentObj[j];
				}
			}
		}

		return newParams;
	};

	/*
	 * Sorting
	 */

	this.SortAscending = "asc";
	this.SortDescending = "desc";

	this.SortOrder = this.SortDescending;
	this.SortColumn = "score";

	this.setSort = function(column, order) {
		if (order !== "asc" && order !== "desc") {
			order = this.SortOrder;
		}
		if (column === null) {
			column = this.SortColumn;
		} else if (_.contains([ "score", "ContentDate", "Access" ], column)) {
			// nothing to do, sortColumn
			// doesn't need adjustment
		} else {
			column += "Sort"; // use solr sort column
			// that hasn't been
			// tokenized
			// Is it worth generalizing this?
		}

		this.SortColumn = column;
		this.SortOrder = order;
	};

	// this function must be passed the name of the column to sort on and the
	// direction to sort
	// e.g., getSortClause("ContentDate", this.SortDecending);
	this.getSortClause = function getSortClause() {
		var column = this.SortColumn;
		var order = this.SortOrder;

		var sortClause = column + " " + order;
		return sortClause;
	};

	/*
	 * Returned Columns
	 */
	this.SearchRequest = "Search";
	this.MetadataRequest = "FgdcText";
	this.CountRequest = "CountOnly";

	this.SearchRequestColumns = [ "Name", "Institution", "Access", "DataType",
			"LayerDisplayName", "Publisher", "GeoReferenced", "Originator",
			"Location", "MinX", "MaxX", "MinY", "MaxY", "ContentDate",
			"LayerId", "score", "WorkspaceName", "CollectionId", "Availability" ];

	// this function returns a Solr fl clause specifying the columns to return
	// for the passed request
	// since the full FGDC text can be very long, we don't want to return it for
	// search requests
	this.getReturnedColumns = function getReturnedColumns(requestType) {
		var returnedColumns = "";
		if (requestType == this.MetadataRequest) {
			returnedColumns = "LayerId,FgdcText";
		} else if (requestType == this.CountRequest) {
			returnedColumns = "";
		} else if (requestType == this.SearchRequest) {
			returnedColumns = this.SearchRequestColumns.join();
		} else {
			returnedColumns = "error in this.getReturnedColumnsClause"
					+ " did not understand passed requestType " + requestType;
		}

		return returnedColumns;
	};

	this.getURL = function() {

		var query = jQuery.param(this.getSearchParams(), true);
		return this.getServerName() + "?" + query;

	};


	/***************************************************************************
	 * Keyword/text components
	 **************************************************************************/

	/**
	 * Return parameters for text search component
	 * 
	 * @private
	 * @return {object} solr parameters
	 */
	this.getOgpTextSearchParams = function() {

		var terms = this.getTerms();

		var params = {
			qf : terms.fields.join(" "),
			q : terms.userTerms || "*",
			fq : this.filters
		};

        if (this.where.length > 0) {
            var whereParams = this.getWhereBoost();
            params = this.combineParams(params, whereParams);
        }

        if (this.what.length > 0) {
            var whatParams = this.getExactWhatBoost();
            params = this.combineParams(params, whatParams);
        }
		return params;
	};

	// default value
	this.SearchType = "basic";
	this.setSearchType = function(searchType) {
		this.SearchType = searchType;
	};

	// auto sense whether this is a basic or advanced search
	// based on which ui fields are populated;
	this.getTerms = function() {
		var searchType = this.SearchType;
		var terms = {};
		if (searchType === "advanced") {
			terms.userTerms = this.getAdvancedKeywords();
			terms.fields = this.getAdvancedKeywordTermsArr();
		} else if (searchType === "basic") {
			terms.userTerms = this.what;
			terms.fields = this.getBasicKeywordTermsArr();
		} else {
			throw new Error("Search type '" + searchType + "' is unsupported.");
		}
		return terms;
	};

    this.what = "";

	this.setWhat = function(what) {
		this.what = what;
	};

    this.where = "";
	this.setWhere = function(where) {
		this.where = where;
	};
    /*
     *
     */
    this.whereBoosts = {
        titleBoost: 2,
        titleSynonymsBoost: 1,
        boost: 40
    };


    this.getWhereBoost = function () {
        var params = {};
        var term = this.where.trim();

        params.where = '{!query}LayerDisplayNameSynonyms:' + term + '^' + this.whereBoosts.titleSynonymsBoost + ' LayerDisplayName:"' + term + '"^' + this.whereBoosts.titleBoost;
        params.bf = ["map($where,.5,1000,1,0)^" + +this.whereBoosts.boost];

        return params;
    };

	this.AdvancedKeywordString = null;

	this.setAdvancedKeywords = function setAdvancedKeywords(keywordString) {
		this.AdvancedKeywordString = keywordString;
	};

	this.getAdvancedKeywords = function getAdvancedKeywords() {
		return this.AdvancedKeywordString;
	};

	// you can specify different solr fields and boosts for basic and advanced.
    this.LayerDisplayNameSynonymsTerm = {
		basic : {
			term : "LayerDisplayNameSynonyms",
            boost: 2
		},
		advanced : {
			term : "LayerDisplayNameSynonyms",
            boost: 2
		}
	};

    this.LayerDisplayNameTerm = {
        term: "LayerDisplayName",
        boost: 2
    };

	this.ThemeKeywordsTerm = {
		term : "ThemeKeywordsSynonymsLcsh",
        boost: 2
	};

	this.PlaceKeywordsTerm = {
        basic: {
            term: "PlaceKeywordsSynonyms",
            boost: .3
        },
        advanced: {
            term: "PlaceKeywordsSynonyms",
            boost: .5
        }
	};

	this.PublisherTerm = {
		term : "Publisher",
        boost: 1
	};

	this.OriginatorTerm = {
		term : "Originator",
        boost: 1.2
	};

	this.IsoTopicTerm = {
		term : "ThemeKeywordsSynonymsIso",
        boost: 5
	};

    //if we don't boost exact match, rare matches are placed ahead
    this.getExactWhatBoost = function () {
        var params = {};
        var term = this.what.trim();

        params.what = '{!query}' + this.LayerDisplayNameTerm.term + ':' + term + '^' + this.LayerDisplayNameTerm.boost;
        params.bf = ["map($what,.5,1000,1,0)^30"];

        return params;
    };
	// Terms that will be searched in a basic search against the what field
	// contents
	// Search Title, theme keywords, place keywords, publisher, and originator
    this.BasicKeywordTerms = [this.LayerDisplayNameSynonymsTerm,
			this.ThemeKeywordsTerm, this.PlaceKeywordsTerm, this.PublisherTerm,
			this.OriginatorTerm ];

	// Terms that will be searched in an advanced search against the keyword
	// field contents
	// Search Title, theme keywords, and place keywords
    this.AdvancedKeywordTerms = [this.LayerDisplayNameSynonymsTerm,
			this.ThemeKeywordsTerm, this.PlaceKeywordsTerm ];

	this.getKeywordTerms = function(termArr, termType) {
		var keywordArr = [];
		for (var i = 0; i < termArr.length; i++) {
			var currentTerm = termArr[i];
			if (currentTerm.hasOwnProperty(termType)) {
				currentTerm = currentTerm[termType];
			}
			keywordArr.push(currentTerm.term + "^" + currentTerm.boost);
		}
		return keywordArr;
	};

	this.getBasicKeywordTermsArr = function getBasicKeywordTermsArr() {
		return this.getKeywordTerms(this.BasicKeywordTerms, "basic");
	};

	this.getAdvancedKeywordTermsArr = function getAdvancedKeywordTermsArr() {
		return this.getKeywordTerms(this.AdvancedKeywordTerms, "advanced");
	};

	/*
	 * Filters
	 * 
	 */
	this.filters = [];
	// a private function used to create filters
	this.createFilter = function createFilter(columnName, values, prefix,
			joiner) {
		if (typeof values === "undefined" || values.length === 0) {
			return ""; // on empty input, no filter returned
		}
		if (!jQuery.isArray(values)) {
			values = [ values ];
		}
		if (typeof prefix === "undefined") {
			prefix = "";
		}
		var i;
		var temp = [];
		for (i = 0; i < values.length; i++) {
			var value = values[i];
			temp.push(columnName + ":" + value);
		}
		if (typeof joiner === "undefined") {
			joiner = "OR";
		} else {
			if ((joiner != "OR") && (joiner != "AND")) {
				throw new Error("clause must be joined with 'AND' or 'OR'.");
			}

		}
		var filter = temp.join(" " + joiner + " ");
        filter = '{!tag=f_' + columnName.toLowerCase() + '}' + filter;
		return filter;
	};

	this.createRangeFilter = function(field, from, to, prefix) {
		if (typeof prefix === "undefined") {
			prefix = "";
		}
		var searchClause = field + ":[" + from + " TO " + to + "]";
		return prefix + searchClause;
	};

	this.addFilter = function(filter) {

		if (filter.length > 0) {
			this.filters.push(filter);
		}
	};

	/**
	 * Specialized Filters
	 */
	this.createAccessFilter = function(arrDisplayRestricted) {

        arrDisplayRestricted = arrDisplayRestricted | [];

        var accessFilter = this.createFilter("Access", "Public");

        if (arrDisplayRestricted.length > 0) {
            accessFilter += " OR ";
            accessFilter += this.createFilter("Institution",
                arrDisplayRestricted);
		}
		return accessFilter;
	};

	this.filterDateValue = function filterDateValue(dateValue) {
		if ((dateValue == null) || (dateValue == "")) {
			return "";
		}
		// only 4 digit numbers should be allowed
		if (!jQuery.isNumeric(dateValue)) {
			throw new Error("Year must be numeric");
		}
		var dateLen = dateValue.length;

		if (dateLen > 4) {
			throw new Error("Year cannot be more than 4 digits.");
		} else if (dateLen == 4) {
			return dateValue;
		} else if (dateLen == 3) {
			return "0" + dateValue;
		} else if (dateLen == 2) {
			return "00" + dateValue;
		} else if (dateLen == 1) {
			return "000" + dateValue;
		}

		return "";

	};

	// this function must be passed years, either the from date or the to date
	// can be null
	// e.g., getDateFilter(1940, null); // get layers since 1940
	this.createDateRangeFilter = function createDateRangeFilter(dateField,
			fromDate, toDate) {
		var dateSuffix = "-01-01T01:01:01Z"; // per an ISO standard solr
		// expects
		fromDate = this.filterDateValue(fromDate);
		toDate = this.filterDateValue(toDate);

		if (((fromDate == null) || (fromDate == ""))
				&& ((toDate == null) || (toDate == ""))) {
			return ""; // no date search data specified so no search filter
		}

		fromDate = fromDate || "0001";
		toDate = toDate || "2100";

		fromDate += dateSuffix;
		toDate += dateSuffix;

		return this.createRangeFilter(dateField, fromDate, toDate);

	};

	/***************************************************************************
	 * Spatial query components
	 **************************************************************************/

	// term objects
	// boost have to be extremely high when using boost function syntax to match
	// up with
	// values in previous version.
	this.LayerWithinMap = {
		term : "LayerWithinMap",
        boost: 40.0
	};

	this.LayerMatchesScale = {
		term : "LayerMatchesScale",
        boost: 120.0
	};
	this.LayerMatchesCenter = {
		term : "LayerMatchesCenter",
        boost: 20.0
	};

	this.LayerAreaIntersection = {
		term : "LayerAreaIntersection",
        boost: 35.0
	};

	// all we need is "bounds", which in the application is the map extent
	this.getOgpSpatialQueryParams = function(bounds) {
		/*
		 * var centerLon = this.getCenter(bounds.minX, bounds.maxX); var
		 * centerLat = this.getCenter(bounds.minY, bounds.maxY);
		 * console.log(centerLon); console.log(centerLat);
		 */
		// bf clauses are additive
		// var area = this.getBoundsArea(bounds);
		var bf_array = [
				this.classicLayerMatchesArea(bounds) + "^"
						+ this.LayerMatchesScale.boost,
            //this.classicLayerAreaIntersectionScore(bounds) + "^"
            //		+ this.LayerAreaIntersection.boost,
            // this.classicCenterRelevancyClause() + "^"
            //		+ this.LayerMatchesCenter.boost,
				this.classicLayerWithinMap(bounds) + "^"
						+ this.LayerWithinMap.boost ];
		var params = {
			bf : bf_array,
			fq : [ this.getIntersectionFilter() ],
            y: this.getYRange(bounds),
            intx: this.getIntersectionFunction(bounds),
            dintx: this.getDLIntersectionFunction(bounds),
            dl: this.getDatelineCrossIntersectionFilter()
		};

		return params;
	};

	/**
	 * Query component to filter out non-intersecting layers.
	 * 
	 * @return {string} Query string filter
	 */
	this.getIntersectionFilter = function() {
		// this filter should not be cached, since it will be different each
		// time
        return "{!frange l=0 incl=false cache=false}if($dl,$dintx,$intx)";

	};

	/**
	 * Returns the intersection area of the layer and map.
	 * 
	 * @return {string} Query string to calculate intersection
	 */
	this.getIntersectionFunction = function(bounds) {
        // this filter gets all results where MinX is greater than Maxx {!frange u=0 incu=false}sub(MaxX,MinX),
        //which indicates crossing the dateline

		var xRange;
        var yRange = "$y";
        var intersection;

		if (bounds.minX > bounds.maxX) {
            //client extent crosses the dateline
            var xRange1 = this.getRangeClause(bounds.minX, "MinX", 180, "MaxX");
            var xRange2 = this.getRangeClause(-180, "MinX", bounds.maxX, "MaxX");
            intersection = "product(sum(" + xRange1 + "," + xRange2 + ")," + yRange + ")";
		} else {
            xRange = this.getRangeClause(bounds.minX, "MinX", bounds.maxX, "MaxX");
            intersection = "product(" + xRange + "," + yRange + ")";
		}

        return intersection;

    };

    /**
     * Returns a filter that determines if the dateline is crossed
     *
     * @return {string} Query string to calculate intersection
     */
    this.getDatelineCrossIntersectionFilter = function () {
        // this filter gets all results where MinX is greater than Maxx {!frange u=0 incu=false}sub(MaxX,MinX),
        //which indicates crossing the dateline


        return "{!frange u=0 incu=false}sub(MaxX,MinX)";

    };

    this.getRangeClause = function (minVal, minTerm, maxVal, maxTerm) {

        var rangeClause = "max(sub(min(" + maxVal + "," + maxTerm
            + "),max(" + minVal + "," + minTerm + ")),0)";
        return rangeClause;
    };

    /**
     * Returns the intersection area of the layer and map if the dateline is crossed (indexed bounds)
     *
     * @return {string} Query string to calculate intersection
     */
    this.getDLIntersectionFunction = function (bounds) {
        // TODO: this needs work. have to account for dateline crossing properly
        // this filter gets all results where MinX is greater than Maxx {!frange u=0 incu=false}sub(MaxX,MinX),
        //which indicates crossing the dateline

        var yRange = "$y";
        var intersection;

        if (bounds.minX > bounds.maxX) {
            //client extent crosses the dateline
            var xRangeA1 = this.getRangeClause(bounds.minX, "MinX", 180, 180);

            var xRangeB1 = this.getRangeClause(-180, -180, bounds.maxX, "MaxX");

            intersection = "product(sum(" + xRangeA1 + "," + xRangeB1 + ")," + yRange + ")";
        } else {

            var xRangeA = this.getRangeClause(bounds.minX, "MinX", bounds.maxX, 180);

            var xRangeB = this.getRangeClause(bounds.minX, -180, bounds.maxX, "MaxX");
            intersection = "product(sum(" + xRangeA + "," + xRangeB + ")," + yRange + ")";

        }

		return intersection;

	};

    this.getYRange = function (bounds) {
        var yRange = this.getRangeClause(bounds.minY, "MinY", bounds.maxY, "MaxY");
        return yRange;
    };
	/**
	 * score layer based on how close map center latitude is to the layer's
	 * center latitude
	 */
	this.layerNearCenterClause = function(center, minTerm, maxTerm) {
		var smoothingFactor = 1000;
		var layerMatchesCenter = "recip(abs(sub(product(sum(" + minTerm + ","
				+ maxTerm + "),.5)," + center + ")),1," + smoothingFactor + ","
				+ smoothingFactor + ")";
		return layerMatchesCenter;
	};

	this.classicCenterRelevancyClause = function() {
        //need to adjust for MaxX < MinX (crosses dateline)
		var center = this.getCenter();
		var clause = "sum("
				+ this.layerNearCenterClause(center.centerX, "MinX", "MaxX")
				+ ",";
		clause += this.layerNearCenterClause(center.centerY, "MinY", "MaxY")
				+ ")";
        return "scale(" + clause + ",0,1)";
	};

	/**
	 * return a search element to boost the scores of layers whose scale matches
	 * the displayed map scale specifically, it compares their area
	 */
	this.classicLayerMatchesArea = function(bounds) {
		var mapDeltaX = Math.abs(bounds.maxX - bounds.minX);
        if (bounds.minX > bounds.maxX) {
            mapDeltaX = 360 - mapDeltaX;
        }
		var mapDeltaY = Math.abs(bounds.maxY - bounds.minY);
		var mapArea = (mapDeltaX * mapDeltaY);
        var smoothingFactor = mapArea * 10;
		var layerMatchesArea = "recip(sum(abs(sub(Area," + mapArea
				+ ")),.01),1," + smoothingFactor + "," + smoothingFactor + ")";
		return layerMatchesArea;
	};

	/**
	 * return a search clause whose score reflects how much of the map this
	 * layers covers 9 points in a 3x3 grid are used. we compute how many of
	 * those 9 points are within the the layer's bounding box. This count is
	 * then normalized and multiplied by the boost the grid is evenly space and
	 * does not include points on the edge of the map. for example, for a 3x3
	 * grid we use 9 points spaced at 1/4, 1/2 and 3/4 x and y each point in the
	 * grid is weighted evenly
	 */
	this.classicLayerAreaIntersectionScore = function(bounds) {
		var mapMaxX = bounds.maxX;
		var mapMinX = bounds.minX;
		var mapMinY = bounds.minY;
		var mapMaxY = bounds.maxY;

		var stepCount = 3; // use 3x3 grid
		var mapDeltaX = Math.abs(mapMaxX - mapMinX);

        //needs to account for dl cross
        if (mapMinX > mapMaxX) {
            mapDeltaX = 360 - mapDeltaX;
        }
		var mapXStepSize = mapDeltaX / (stepCount + 1.);

		var mapDeltaY = Math.abs(mapMaxY - mapMinY);
		var mapYStepSize = mapDeltaY / (stepCount + 1.);

		var clause = "sum("; // add up all the map points within the layer
		for (var i = 0; i < stepCount; i++) {

			for (var j = 0; j < stepCount; j++) {

				var currentMapX = mapMinX + ((i + 1) * mapXStepSize);
				var currentMapY = mapMinY + ((j + 1) * mapYStepSize);

				// console.log([currentMapX, currentMapY]);
				// is the current map point in the layer
				// that is, is currentMapX between MinX and MaxX and is
				// currentMapY betweeen MinY and MaxY

				// why 400? this should not be a fixed size
				var thisPointWithin = "map(sum(map(sub(" + currentMapX
						+ ",MinX),0,400,1,0),";
				thisPointWithin += "map(sub(" + currentMapX
						+ ",MaxX),-400,0,1,0),";
				thisPointWithin += "map(sub(" + currentMapY
						+ ",MinY),0,400,1,0),";
				thisPointWithin += "map(sub(" + currentMapY
						+ ",MaxY),-400,0,1,0)),";
				thisPointWithin += "4,4,1,0)"; // final map values

				// note that map(" + currentMapX + ",MinX,MaxX,1,0) doesn't work
				// because the min,max,target in map must be constants, not
				// field values
				// so we do many sub based comparisons

				if ((i > 0) || (j > 0)) {
					clause += ","; // comma separate point checks
				}

				clause += thisPointWithin;
			}
		}
		clause += ")";

		// clause has the sum of 9 point checks, this could be 9,6,4,3,2,1 or 0
		// normalize to between 0 and 1, then multiple by boost

		clause = "product(" + clause + "," + (1.0 / (stepCount * stepCount))
				+ ")";

		return clause;
	};

    this.boundTrim = function (val, min, max) {
        if (val <= min) {
            return min;
        } else if (val >= max) {
            return max;
        } else {
            return val;
        }
    };

    this.xTrim = function (x) {
        return this.boundTrim(x, -180, 180);
    };

    this.yTrim = function (y) {
        return this.boundTrim(y, -90, 90);
    };


	/**
	 * compute a score for layers within the current map the layer's MinX and
	 * MaxX must be within the map extent in X and the layer's MinY and MaxY
	 * must be within the map extent in Y I had trouble using a range based test
	 * (e.g., MinX:[mapMinX+TO+mapMapX]) along with other scoring functions
	 * based on _val_. So, this function is like the other scoring functions and
	 * uses _val_. The Solr "sum" function returns 4 if the layer is contained
	 * within the map. The outer "map" converts 4 to 1 and anything else to 0.
	 * Finally, the product converts the 1 to LayerWithinMapBoost
	 */
	this.classicLayerWithinMap = function(bounds) {
        //needs to account for dl cross, both for query bounds and result bounds
        //one check would be to see if the center x is within


        var margin = .2;
        var getDelta = function (min, max) {
            var delta = Math.abs(max - min);
            if (min > max) {
                delta = 360 - delta;
            }
            return delta;
        };
        //bounds from the map extent
        //console.log(bounds);

        var xDelta = getDelta(bounds.minX, bounds.maxX, margin);

        var yDelta = getDelta(bounds.minY, bounds.maxY, margin);

        var bufferX = false;
        if (yDelta > xDelta) {
            bufferX = true;
        }

		var mapMinX = bounds.minX;
        var mapMaxX = bounds.minX + xDelta;
		var mapMinY = bounds.minY;
		var mapMaxY = bounds.maxY;


        //add a buffer the short side, because of the way zoom to extent works

        if (bufferX) {
            mapMinX = this.xTrim(mapMinX - xDelta * margin);
            mapMaxX = this.xTrim(mapMaxX + xDelta * margin);

        } else {
            mapMinY = this.yTrim(mapMinY - yDelta * margin);
            mapMaxY = this.yTrim(mapMaxY + yDelta * margin);
        }

        var layerWithinMap = "";

        //if query bounds don't straddle the dateline, this should be fine.
        layerWithinMap = "if(and(exists(MinX),exists(MaxX),exists(MinY),exists(MaxY)),";

        layerWithinMap += "map(sum(";
        layerWithinMap += "map(MinX," + mapMinX + "," + mapMaxX + ",1,0),";
        layerWithinMap += "map(MaxX," + mapMinX + "," + mapMaxX + ",1,0),";
        layerWithinMap += "map(MinY," + mapMinY + "," + mapMaxY + ",1,0),";
        layerWithinMap += "map(MaxY," + mapMinY + "," + mapMaxY + ",1,0))";
        layerWithinMap += ",4,4,1,0),0)";


		return layerWithinMap;
	};

	// Helpers

	this.setBoundingBox = function setBoundingBox(bounds) {
		this.bounds = {
			minX : Math.max(bounds.minX, -180),
			minY : Math.max(bounds.minY, -90),
			maxX : Math.min(bounds.maxX, 180),
			maxY : Math.min(bounds.maxY, 90)
		};
	};

	this.clearBoundingBox = function clearBoundingBox() {
		this.bounds = {};
	};

	this.center = {};

	this.setCenter = function(center) {
		this.center = center;
	};

	this.getCenter = function() {
		return this.center;
		/*
		 * if (min >= max){ var tempMin = min; min = max; max = tempMin; }
		 * return Math.abs((max - min)/2) + min;
		 */
	};

	this.getBoundsArea = function(bounds) {
		var w = Math.abs(bounds.maxX - bounds.minX);
		var l = Math.abs(bounds.maxY - bounds.minY);

		return l * w;
	};

	/**
	 * Other Solr queries: term query, layerInfo query, metadata query
	 * 
	 */

	/**
	 * execute the passed query asynchronously and call the success or error
	 * function when completed a jsonp
	 */

	this.sendToSolr = function sendToSolr(url, successFunction, errorFunction) {
		var ajaxParams = {
			type : "GET",
			url : url,
			dataType : 'jsonp',
			jsonp : 'json.wrf',
			timeout : 5000,
			crossDomain : true,
			success : function(data) {
				successFunction(data);
			},
			error : function(arg) {
				errorFunction(arg);
			}
		};
		if (arguments.length > 3) {
			// 4th parameter is context parameter
			var newContext = arguments[3];
			ajaxParams.context = newContext;
			var newSuccessFunction = function(data) {
				successFunction.apply(newContext, arguments);
			};
			ajaxParams.success = newSuccessFunction;
		}
		jQuery.ajax(ajaxParams);
	};

	// returns the solr query to obtain a layer's metadata document from the
	// Solr server
	
	
	this.getArbitraryParams = function(layerId, request) {
		var params = {
			q : this.createFilter("LayerId", layerId),
			fl : this.getReturnedColumns(request),
			wt : "json"
		};

		return params;
	};
	
	this.getMetadataParams = function(layerId) {
		return this.getArbitraryParams(layerId, this.MetadataRequest);
	};
	

	// returns the solr query to obtain terms directly from the index for a
	// field
	this.getTermParams = function(termField, requestTerm) {
		var termParams = {
			"terms.fl" : termField,
			"terms.regex" : ".*" + requestTerm + ".*",
			"terms.regex.flag" : "case_insensitive",
			"terms.limit" : -1,
			omitHeader : true,
			wt : "json"
		};
		return termParams;
	};

	// returns the solr query params to obtain a layer info from the Solr server
	// given
	// a layerId or array of layerId's
	this.getInfoFromLayerIdParams = function getInfoFromLayerIdQuery(layerId) {

		var infoParams = {
			q : this.createFilter("LayerId", layerId),
			wt : "json",
			fl : this.getReturnedColumns(this.SearchRequest),
			rows : 10000
		};
		return infoParams;
	};

	this.getLayerInfoFromSolr = function(layerIds, successFunction,
			errorFunction) {
		var url = this.getServerName();

		var query = jQuery.param(this.getInfoFromLayerIdParams(layerIds), true);

		this.sendToSolr(url + "?" + query, successFunction, errorFunction);
	};

	this.termQuery = function termQuery(field, term, successFunction,
			errorFunction) {
		var url = this.getServerName().substring(0,
				this.getServerName().indexOf("select"))
				+ "terms";

		var query = jQuery.param(this.getTermParams(field, term), true);

		this.sendToSolr(url + "?" + query, successFunction, errorFunction);
	};

	/*
	 * 
	 * Experimental spatial query clauses
	 * 
	 */

	// all we need is "bounds", which in the application is the map extent
	this.getNewOgpSpatialQueryParams = function(bounds) {
		var centerLon = this.getCenter(bounds.minX, bounds.maxX);
		var centerLat = this.getCenter(bounds.minY, bounds.maxY);

        // bf clauses are additive
		var area = this.getBoundsArea(bounds);
		var bf_array = [
				this.getBoundsAreaRelevancyClause() + "^"
						+ this.LayerMatchesScale.boost,
				// this.getIntersectionAreaRelevancyClause(area) + "^" +
				// this.LayerAreaIntersection.boost,
				this.getCenterRelevancyClause(centerLat, centerLon) + "^"
						+ this.LayerMatchesCenter.boost// ,
		// this.getLayerWithinMapClause() + "^" + this.LayerWithinMap.boost
		];
		var params = {
			bf : bf_array,
			boost : this.getLayerWithinMapClause(),
			fq : [ this.getIntersectionFilter() ],
			intx : this.getIntersectionFunction(bounds),
			union : area,
			debug : true
		};

		return params;
	};

	/**
	 * Calculates the reciprocal of the distance of the layer center from the
	 * bounding box center.
	 * 
	 * note that, while the squared Euclidean distance is perfectly adequate to
	 * calculate relative distances, it affects the score/ranking in a
	 * non-linear way; we may decide that is ok
	 * 
	 * @return {string} query string to calculate score for center distance
	 */
	this.getCenterRelevancyClause = function(centerLat, centerLon) {
		var smoothingFactor = 1000;
		var score = "if(and(exists(CenterX),exists(CenterY)),";

		score += "recip(dist(2,CenterX,CenterY," + centerLon + "," + centerLat
				+ "),1," + smoothingFactor + "," + smoothingFactor + "),0)";

		return score;

	};

	/**
	 * Compares the area of the layer to the area of the map extent; "scale"
	 * 
	 * @return {string} query string to calculate score for area comparison
	 */
	this.getBoundsAreaRelevancyClause = function() {
		// smoothing factor really should be examined; is the curve shape
		// appropriate?
		var smoothingFactor = 1000;
		var areaClause = "if(exists(Area),recip(abs(sub(Area,$union)),1,"
				+ smoothingFactor + "," + smoothingFactor + "),0)";
		return areaClause;
	};

	/**
	 * 
	 * Compares the area of the layer's intersection with the map extent to the
	 * area of the map extent. $intx depends on the intersection function
	 * defined in "getIntersectionFunction", while $union depends on the value
	 * of union being populated with the area of the map extent
	 * 
	 * @return {string} query string to calculate score for area comparison
	 */
	this.getIntersectionAreaRelevancyClause = function(area) {
		// how useful is this? what exactly are we trying to measure that is not
		// accounted for elsewhere implicitly or explicitly

		// $intx is the area of intersection of the layer bounds and the search
		// extent
		// $union is the area of the search extent

		// a few different ideas
		// var areaClause = "scale(div($intx,$union),0,1)";
		// if $intx - $union = 0, then the layer likely fully overlaps
		// var areaClause =
		// "if($intx,recip(abs(sub($intx,$union)),1,1000,1000),0)";
		//
		area = area - 1;
		var areaClause = "if(not(sub($union,$intx)),div($intx,$union),0)";
		// var areaClause = "if(map(Area,0," + area +
		// ",1,0),div($intx,$union),0)";
		return areaClause;

	};
	this.getLayerWithinMapClause = function() {
		// $intx is the area of intersection
		// Area is the stored area of the layer extent
		// var areaClause = "div($intx,Area)";
		// be careful with these reciprocal clauses the way they are weighted
		// should generally be dynamic
		// var areaClause =
		// "if(exists(Area),recip(abs(sub($intx,Area)),1,Area,Area),0)";
		// map(x,min,max,target,value)
		// to give the boost if a certain percentage of the area is in the
		// search extent
		// map($intx,product(.95,Area),Area,0,1);
		// This clause is true to Steve's original conception of giving a
		// straight-across
		// boost to any layer fully contained by the search extent, translated
		// into a more
		// compact expression, as allowed by newer solr query syntax.
		// if the Area value exists, subtract the area of intersection from the
		// total layer area.
		// this will yield 0 if they are the same, which equates to a boolean
		// false
		// take "not" to yield a boolean true (= 1)
		// if there is a differential, "not" will yield a boolean false (= 0)
		// var areaClause = "if(exists(Area),not(sub(Area,$intx)),0)";
		// var within = "1";
		// var notwithin = "0";
		// var areaClause = "if(exists(Area),not(sub(Area,$intx)),0)";
		// var areaClause = "{!frange u=1 incu=false cache=false}
		// if(exists(Area),if(not(sub(Area,$intx)),div($intx,$union),0),0)";
		var areaClause = "{!frange u=15 l=0 incu=false incl=false cache=false} product(15,div($intx,$union))";
		return areaClause;
	};

};
