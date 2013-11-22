// This code provides an interface to the spatial data in the OpenGeoServer Solr server

// To use it, first create an instance.  Then call member functions to set 
//   as many search parameters as desired (e.g., setBoundingBox or setPublisher).
//   Finally, to run the query call executeSearchQuery with success and error functions.

// Solr queries can contain multiple filters (fq=) and a single query term (q=).  Filters are used to eliminate rows
// from the set of returned results.  However, they do not affect scoring.  The query term
// can both eliminate rows and specify a boost (which affects scoring).
// For spatial searching, both filtering and query terms are used. 
// For keyword searching, only query terms are used (different boosts are applied to each field).
// For searches requiring both keywords and spatial elements, their query terms are ANDed together

// Documentation on search in OpenGeoPortal is at http://code.google.com/p/opengeoportal/wiki/Search

// This code uses ogpConfig.json values via OpenGeoportal.InstitutionInfo.getSearch()

// Repeat the creation and type-checking code for the next level
if (typeof OpenGeoportal == 'undefined') {
	OpenGeoportal = {};
} else if (typeof OpenGeoportal != "object") {
	throw new Error("OpenGeoportal already exists and is not an object");
}

OpenGeoportal.Solr = function() {
	// constructor code
	this.Institutions = [];
	this.DataTypes = [];

	this.ServerName = "";//includes any path elements & port number

	/**
	 * config element from ogpConfig.json can contain either a single server or
	 * all the shards on which to run queries we always send the query to the
	 * first server in the list the way the jsonp call works, server name needs
	 * the protocol (http://) also, it must end in "/select" for Solr. this
	 * function adds them if they aren't there this function is inefficient
	 * because it re-processes the shards every time it is called
	 */
	this.getServerName = function getServerName() {
		var configInfo = OpenGeoportal.Config.General.get("searchUrl");
		var elements = configInfo.split(",");
		var primaryServer = elements[0];
		if (!(primaryServer.indexOf("http://") == 0 || primaryServer
				.indexOf("https://") == 0)) {
			primaryServer = "http://" + primaryServer;
		}
		var select = "select";
		if ((primaryServer.substring(primaryServer.length - select.length) == select) == false) {
			// here if the server name does not end in select
			primaryServer = primaryServer + "select";
		}
		return primaryServer;
	};

	/**
	 * return the shard argument for a Solr search command config element from
	 * ogpConfig.json can contain a single server or all the shards on which to
	 * run queries the returned Solr argument should not contain any protocol
	 * specification ("http://") nor should the urls end in "/select". this
	 * function removes these elements as needed this function is inefficient
	 * because it re-processes the shards every time it is called
	 * 
	 * @return
	 */
	this.getShardServerNames = function getShardNames() {
		var configInfo = OpenGeoportal.Config.General.get("searchUrl");
		var elements = configInfo.split(",");
		var shards = "";
		if (elements.length == 1) {
			// here if there really aren't any shards, only a single primary
			// server listed
			return shards;
		}
		// otherwise, we build the Solr shard string
		var protocol = "http://";
		var select = "select";
		for ( var i = 0; i < elements.length; i++) {

			if (elements[i].indexOf(protocol) == 0) {
				// shards can not specify protocol
				elements[i] = elements[i].substr(protocol.length);
			}

			if ((elements[i].substring(elements[i].length - select.length) == select) == true) {
				// here if the current element ends in "select", we must strip
				// it from shards
				elements[i] = elements[i].substring(0, elements[i].length
						- select.length);
			}

			if (shards.length > 0) {
				shards = shards + ",";
			}

			shards = shards + elements[i];
		}
		shards = "shards=" + shards;
		return shards;
	};


	/*
	 * Other queries
	 */

	// returns the solr query to obtain a layer's metadata document from the
	// Solr server
	this.getMetadataParams = function(layerId) {
		var metadataParams = {
				q: this.createFilter("LayerId", layerId),
				fl: this.getReturnedColumns(this.MetadataRequest),
				wt: "json"
		};

		return metadataParams;
	};

	// returns the solr query to obtain terms directly from the index for a field
	this.getTermParams = function(termField, requestTerm) {
		var termParams = {
				"terms.fl": termField,
				"terms.regex": requestTerm,
				"terms.regex.flag": "case_insensitive",
				"terms.limit":	-1,
				wt: "json"
		};
		return termParams;
	};

	// returns the solr query params to obtain a layer info from the Solr server given
	// a layerId or array of layerId's
	this.getInfoFromLayerIdParams = function getInfoFromLayerIdQuery(layerId) {

		var infoParams = {
				q: this.createFilter("LayerId", layerId),
				wt: "json",
				fl: this.getReturnedColumns(this.SearchRequest),
				rows: 10000
		};
		return infoParams;
	};

	/*
	 * Main query components
	 */

	this.SortAscending = "asc";
	this.SortDescending = "desc";


	/* defaults */
	this.BasicKeywordString = null;

	this.LayerDisplayNameTerm = {
		term : "LayerDisplayNameSynonyms",
		boost : 5.0,
		cap : 0.5
	};
	this.ThemeKeywordsTerm = {
		term : "ThemeKeywordsSynonymsLcsh",
		boost : 1.0,
		cap : 0.5
	};
	this.PlaceKeywordsTerm = {
		term : "PlaceKeywordsSynonyms",
		boost : 2.0
	};
	this.PublisherTerm = {
		term : "Publisher",
		boost : 1.0
	};
	this.OriginatorTerm = {
		term : "Originator",
		boost : 1.0
	};
	this.IsoTopicTerm = {
		term : "ThemeKeywordsSynonymsIso",
		boost : 4.0
	};

	this.GenericPhraseBoost = 9.0;

	this.BasicKeywordTerms = [ this.LayerDisplayNameTerm,
			this.ThemeKeywordsTerm, this.PlaceKeywordsTerm, this.PublisherTerm,
			this.OriginatorTerm ];

	this.AdvancedKeywordTerms = [ this.LayerDisplayNameTerm,
			this.ThemeKeywordsTerm, this.PlaceKeywordsTerm ];

	this.MinX = null;
	this.MaxX = null;
	this.MinY = null;
	this.MaxY = null;
	this.RowCount = 20;
	this.StartRow = 0;
	this.SortOrder = this.SortDescending;
	this.SortColumn = "score";

	this.FromDate = null;
	this.ToDate = null;
	this.DataTypes = [];
	this.Institutions = [];
	this.AccessDisplay = null;

	this.Publisher = null;
	this.Originator = null;
	this.AdvancedKeywordString = null;

	// the OpenGeoPortal UI provides a pull-down with topics such as
	// "Agriculture and Farming"
	this.TopicString = null;

	// Look at the institution object...there is a collection there
	// should populate this object and the Data Type drop down from the same
	// place
	this.DataType = {
		Raster : "Raster",
		PaperMap : "Paper+Map",
		Point : "Point",
		Line : "Line",
		Polygon : "Polygon"
	};

	/*
	 * Helper functions
	 * 
	 */
	// examine a field for quotes and parse them correctly
	this.tokenize = function tokenize(searchTerms) {
		// we're using the pf param instead for phrase matching
		/*
		 * console.log(searchTerms); var arrMatch = searchTerms.match(/["]/g);
		 * if (arrMatch != null){ if (arrMatch.length > 1){ var searchString =
		 * searchTerms.match(/\w+|"(?:\\"|[^"])+"/g); console.log(searchString);
		 * return searchString; } } else { arrMatch = searchTerms.match(/[']/g);
		 * if (arrMatch != null){ if (arrMatch.length > 1){ var searchString =
		 * searchTerms.match(/\w+|'(?:\\'|[^'])+'/g); console.log(searchString);
		 * return searchString; } } }
		 */
		searchTerms = searchTerms.replace(/^\s+|\s+$/g, '')
				.replace(/\s+/g, ' ');

		return searchTerms.split(" ");

	};

	this.escapeSolrValue = function escapeSolrValue(solrValue) {
		solrValue = this.filterCharacters(solrValue);
		solrValue = solrValue.replace(/{/g, "\\{").replace(/}/g, "\\}")
				.replace(/\[/g, "\\[").replace(/]/g, "\\]")
				.replace(/!/g, "\\!").replace(/[+]/g, "\\+").replace(/&/g,
						"\\&").replace(/~/g, "\\~").replace(/[(]/g, "\\(")
				.replace(/[)]/g, "\\)").replace(/-/g, "\\-").replace(/\^/g,
						"\\^");

		return solrValue;
	};

	// filter out characters that cause problems for solr
	this.filterCharacters = function filterCharacters(solrValue) {
		solrValue = solrValue.replace(/[&\/\\#,+()$~%.'":*?<>{}]/g, '');
		return solrValue;
	};

	this.filters = [];
	// a private function used to create filters
	this.createFilter = function createFilter(columnName, values, prefix, joiner) {
		if (typeof values == "undefined" || values.length ===  0) {
			return ""; // on empty input, no filter returned
		}
		if (!jQuery.isArray(values)){
			values = [values];
		}
		if (typeof prefix == "undefined"){
			prefix = "";
		}
		var i;
		var temp = [];
		for (i = 0; i < values.length; i++) {
			var value = values[i];
			temp.push(columnName + ":" + value);
		}
		if (typeof joiner == "undefined"){
			joiner = "OR";
		} else {
			if ((joiner != "OR")&&(joiner != "AND")){
				throw new Error("clause must be joined with 'AND' or 'OR'.");
			}

		}
		var filter = temp.join(" " + joiner  + " ");

		return filter;
	};
	
	this.addFilter = function(filter){

		if (filter.length > 0){
			this.filters.push(filter);
		}
	};

	this.createAccessFilter = function(arrDisplayRestricted){

		var accessFilter = this.createFilter("Institution", arrDisplayRestricted);
		if (accessFilter.length > 0){
			accessFilter += " OR Access:Public";
		}
		return accessFilter;
	};

	/***************************************************************************
	 * Spatial query components
	 **************************************************************************/
	

	
	//all we need is "bounds", which in the application is the map extent
	this.getOgpSpatialQueryParams = function(bounds) {
		var centerLon = this.getCenter(bounds.minX, bounds.maxX);
		var centerLat = this.getCenter(bounds.minY, bounds.maxY);

		var bf_array = [
		                this.getBoundsAreaRelevancyClause() + "^" + this.LayerMatchesScale.boost,
                        this.getIntersectionAreaRelevancyClause() + "^" + this.LayerAreaIntersection.boost,
                        this.getCenterRelevancyClause(centerLat, centerLon) + "^" + this.LayerMatchesCenter.boost,
                        this.getLayerWithinMapClause() + "^" + this.LayerWithinMap.boost,
		                ];
        var params = {
                        bf: bf_array,
                        fq: [this.getIntersectionFilter()],
                        intx: this.getIntersectionFunction(bounds),
                        union: this.getBoundsArea(bounds),
                        
                    };

		return params;
	};


	//term objects
	this.LayerWithinMap = {
		term : "LayerWithinMap",
		boost : 9.0
	};
	
	this.LayerMatchesScale = {
		term : "LayerMatchesScale",
		boost : 8.0
	};
	this.LayerMatchesCenter = {
		term : "LayerMatchesCenter",
		boost : 1.0
	};

	this.LayerAreaIntersection = {
		term : "LayerAreaIntersection",
		boost : 3.0
	};
	
	/**
	 * Query component to filter out non-intersecting layers.
	 * 
	 * @return {string} Query string filter
	 */
	this.getIntersectionFilter = function() {
		//this filter should not be cached, since it will be different each time
		return "{!frange l=0 incl=false cache=false}$intx";

	};

	/**
	 * Returns the intersection area of the layer and map.
	 * 
	 * @return {string} Query string to calculate intersection
	 */
	this.getIntersectionFunction = function(bounds) {
		var intersection = "product(max(0,sub(min(" + bounds.maxX + ",MaxX),max("
				+ bounds.minX + ",MinX))),";
		intersection += "max(0,sub(min(" + bounds.maxY + ",MaxY),max(" + bounds.minY
				+ ",MinY))))";
		return intersection;

	};

	/**
	 * Calculates the reciprocal of the distance of the layer
	 * center from the bounding box center.
	 * 
	 * note that, while the squared Euclidean distance is perfectly adequate to calculate relative
	 * distances, it affects the score/ranking in a non-linear way; we may decide that is ok
	 * 
	 * @return {string} query string to calculate score for center distance
	 */
	this.getCenterRelevancyClause = function(centerLat, centerLon) {
		//dist(2, x, y, 0, 0) 
		var smoothingFactor = 1000;
		var score = "if(and(exists(CenterX),exists(CenterY)),";
		//score += "recip(sqedist(CenterX,CenterY," + centerLon + ","

		score += "recip(dist(2,CenterX,CenterY," + centerLon + ","
				+ centerLat + "),1," + smoothingFactor + "," + smoothingFactor + "),0)";

		return score;

	};
	

 	
	/**
	 * Compares the area of the layer to the area of the map extent; "scale"
	 * 
	 * @return {string} query string to calculate score for area comparison
	 */
	this.getBoundsAreaRelevancyClause = function() {
		//smoothing factor really should be examined;  is the curve shape appropriate?
		var smoothingFactor = 1000;
		var areaClause = "if(exists(Area),recip(abs(sub(Area,$union)),1," + smoothingFactor + "," + smoothingFactor + "),0)";
		return areaClause;
	};
	
	/**
 * return a search clause whose score reflects how much of the map this layers covers
 * 9 points in a 3x3 grid are used. we compute how many of those 9 points are within the 
 *  the layer's bounding box.  This count is then normalized and multiplied by the boost
 * the grid is evenly space and does not include points on the edge of the map. 
 *  for example, for a 3x3 grid we use 9 points spaced at 1/4, 1/2 and 3/4 x and y
 *  each point in the grid is weighted evenly 
 */
/*org.OpenGeoPortal.Solr.prototype.layerAreaIntersectionStepSize = 3;
org.OpenGeoPortal.Solr.prototype.layerAreaIntersectionScore = function (mapMinX, mapMaxX, mapMinY, mapMaxY)
{	
	var stepCount = this.layerAreaIntersectionStepSize;  // use 3x3 grid
	var mapDeltaX = Math.abs(mapMaxX - mapMinX);
	var mapXStepSize = mapDeltaX / (stepCount + 1.);

	var mapDeltaY = Math.abs(mapMaxY - mapMinY);
	var mapYStepSize = mapDeltaY / (stepCount + 1.);

	var clause = "sum(";  // add up all the map points within the layer
	for (var i = 0 ; i < stepCount  ; i++) {

		for (var j = 0 ; j < stepCount ; j++){

			var currentMapX = mapMinX + ((i + 1) * mapXStepSize);
			var currentMapY = mapMinY + ((j + 1) * mapYStepSize);

			//console.log([currentMapX, currentMapY]);
			// is the current map point in the layer
			// that is, is currentMapX between MinX and MaxX and is currentMapY betweeen MinY and MaxY

			//why 400?
			var thisPointWithin = "map(sum(map(sub(" + currentMapX + ",MinX),0,400,1,0),";
			thisPointWithin += "map(sub("+ currentMapX + ",MaxX),-400,0,1,0),";
			thisPointWithin += "map(sub(" + currentMapY + ",MinY),0,400,1,0),";
			thisPointWithin += "map(sub(" + currentMapY + ",MaxY),-400,0,1,0)),";
			thisPointWithin += "4,4,1,0)";  // final map values
			

			// note that map(" + currentMapX + ",MinX,MaxX,1,0) doesn't work 
			//  because the min,max,target in map must be constants, not field values
			//  so we do many sub based comparisons

			if ((i > 0) || (j > 0)){
				clause += ",";  // comma separate point checks
			}

			clause += thisPointWithin;
		}
	}
	clause += ")";

	// clause has the sum of 9 point checks, this could be 9,6,4,3,2,1 or 0
	// normalize to between 0 and 1, then multiple by boost

	clause = "product(" + clause + "," + (1.0 / (stepCount * stepCount)) + ")";
	clause = "product(" + clause + "," + this.LayerAreaIntersection.boost + ")";
	//tempClause = clause;  // set global for debugging
	//console.log(clause);
	return clause;
};*/


	/**
	 * 
	 * 
	 *
	 * Compares the area of the layer's intersection with the map extent to the area of the map extent
	 * $intx depends on the intersection function defined in "getIntersectionFunction", while $union
	 * depends on the value of union being populated with the area of the map extent 
	 * 
	 * @return {string} query string to calculate score for area comparison
	 */
	this.getIntersectionAreaRelevancyClause = function() {
		//$intx is the area of intersection of the layer bounds and the search extent
		//$union is the area of the search extent
		//var areaClause = "scale(div($intx,$union),0,1)";
		var areaClause = "if($intx,recip(abs(sub($intx,$union)),1,1000,1000),0)";
		return areaClause;

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

	/*
	 * if (and(....), 1, 0)^layerwithinboost
	 * 
	 * and( if(exists(MinX),map(MinX,0,1,1,0),0),
	 * if(exists(MaxX),map(MaxX,0,1,1,0),0),
	 * if(exists(MinY),map(MinY,0,1,1,0),0),
	 * if(exists(MaxY),map(MaxY,0,1,1,0),0) )
	 */
	
	/*
	 * 
	 * function withinMap(layerWithinMap(mapMinX, mapMaxX, mapMinY, mapMaxY) {
	 * 
	 * var layerWithinMap =
	 * "if(and(exists(MinX),exists(MaxX),exists(MinY),exists(MaxY),"
	 * layerWithinMap += "product(" + this.LayerWithinMapBoost + ",map(sum(";
	 * layerWithinMap += "map(MinX," + mapMinX + "," + mapMaxX + ",1,0),";
	 * layerWithinMap += "map(MaxX," + mapMinX + "," + mapMaxX + ",1,0),";
	 * layerWithinMap += "map(MinY," + mapMinY + "," + mapMaxY + ",1,0),";
	 * layerWithinMap += "map(MaxY," + mapMinY + "," + mapMaxY + ",1,0))";
	 * layerWithinMap += ",4,4,1,0))),0)";
	 * 
	 * return layerWithinMap;
	 * 
	 * 
	 */
	this.getLayerWithinMapClause = function() {
		/*
		var getMapClause = function(solrCoordField, minCoord, maxCoord){
			var mapClause = "if(exists(" + solrCoordField + "), map(" + solrCoordField + "," + minCoord + "," + maxCoord + ",1,0)";
			return mapClause;
		};
		
		var solrBoundsFields = ["MinX", "MaxX", "MinY", "MaxY"];

		var arrClause = [];
		for (var i in solrBoundsFields){
			arrClause.push(getMapClause(solrBoundsFields[i], bounds.minX, bounds.maxX)); 
		}
		//I'm betting that this "and" function is faster than "product"
		var layerWithinMap = "if(and(" + arrClause.join() + "))";
		
		return layerWithinMap;
		*/
		//$intx is the area of intersection
		//Area is the stored area of the layer extent
		//var areaClause = "div($intx,Area)";
		//be careful with these reciprocal clauses the way they are weighted should generally be dynamic
		//var areaClause = "if(exists(Area),recip(abs(sub($intx,Area)),1,Area,Area),0)";
		// map(x,min,max,target,value)
		//to give the boost if a certain percentage of the area is in the search extent
		//map($intx,product(.95,Area),Area,0,1);
		
		//This clause is true to Steve's original conception of giving a straight-across
		//boost to any layer fully contained by the search extent, translated into a more
		//compact expression, as allowed by newer solr query syntax.
		
		//if the Area value exists, subtract the area of intersection from the total layer area.
		//this will yield 0 if they are the same, which equates to a boolean false
		//take "not" to yield a boolean true (= 1)
		//if there is a differential, "not" will yield a boolean false (= 0)
		//var areaClause = "if(exists(Area),not(sub(Area,$intx)),0)";
		var within = "1";
		var notwithin = "0";
		var areaClause = "if(exists(Area),not(sub(Area,$intx)),0)";

		return areaClause;
	};
	
	//Helpers
	
	this.setBoundingBox = function setBoundingBox(bounds) {
		this.bounds = {
				minX: Math.max(bounds.minX, -180),
				minY: Math.max(bounds.minY, -90),
				maxX: Math.min(bounds.maxX, 180),
				maxY: Math.min(bounds.maxY, 90)
				};
	};
//?
	this.clearBoundingBox = function clearBoundingBox() {
		this.bounds = {};
	};
	
	this.getCenter = function(min, max){
		if (min >= max){
			var tempMin = min;
			min = max;
			max = tempMin;
		}
		return Math.abs((max - min)/2) + min;
 	};
		
 	this.getBoundsArea = function(bounds){
		var w = Math.abs(bounds.maxX - bounds.minX);
		var l = Math.abs(bounds.maxY - bounds.minY);

		return l * w;
 	};

//does the text below still apply?

	/**
	 * a private function that returns a search element to detect intersecting
	 * layers uses intersection of axis aligned bounding boxes (AABB) using
	 * separating axis layers that have an intersecting axis with the map do not
	 * intersect the map and are filtered out note that if the map covers the
	 * layer or if the map is contained within the layer, there is no separating
	 * axis so this function works for them as well. implementing separating
	 * axis on AABB in Solr's functional language (which lacks an if statement)
	 * is a little tricky so this function generates a complicated string
	 * 
	 * some info on separating access on AABB see:
	 * http://www.gamasutra.com/view/feature/3383/simple_intersection_tests_for_games.php?page=3
	 * 
	 * this function returns something that looks like: product(2.0,
	 * map(sum(map(sub(abs(sub(-71.172866821289,CenterX)),sum(0.7539367675480051,HalfWidth)),0,400000,1,0),
	 * map(sub(abs(sub(42.3588141761575,CenterY)),sum(0.6900056205085008,HalfHeight)),0,400000,1,0)),0,0,1,0))
	 * 
	 * @return
	 */

	/***************************************************************************
	 * Keyword/text components
	 **************************************************************************/

		
 	this.ignoreSpatial = false;
 	this.setIgnoreSpatial = function(bool){
 		this.ignoreSpatial = bool;
 	};
 	
   this.getSearchParams = function(){
	   //TODO: this is not the greatest.  It might be better if the solr object was a model/collection?
	   	this.textParams = this.getOgpTextSearchParams();
	   	this.spatialParams = {};
	   	if (!this.ignoreSpatial){
	   		this.spatialParams = this.getOgpSpatialQueryParams(this.bounds);
	   	}
	   	
        this.baseParams = {
            wt: "json",
            /*facet: true,
            "facet.field": [
                "{!ex=dt,insf}InstitutionSort",
                "{!ex=dt,insf}DataTypeSort",
                "{!ex=dt,insf}PlaceKeywordsSort"
            ],
            "f.PlaceKeywordsSort.facet.mincount": 1,
            "f.PlaceKeywordsSort.facet.limit": 10,*/
            defType: "edismax",
            fl: this.getReturnedColumns(this.SearchRequest),
            sort: this.getSortClause()//,
            //debug: true
        };

        var params = this.combineParams(this.baseParams, this.spatialParams, this.textParams);
        return params;
   };
   
   this.combineParams = function(){
	   var newParams = {};
	   for (var i in arguments){
		   var currentObj = arguments[i];
		   
		   for (var j in currentObj){
			   if (typeof newParams[j] == "undefined" || newParams[j].length === 0) {
				   newParams[j] = currentObj[j];
			   } else if (jQuery.isArray(newParams[j])){
				   if (jQuery.isArray(currentObj[j])){
					   for (var k in currentObj[j]){
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
   
    this.getOgpTextSearchParams = function() {
    	//I would like to auto sense whether this is a basic or advanced search based on which ui fields are populated;
    	//perhaps this can/should be abstracted to a higher level
    	
        var qf_array = [ 
            "LayerDisplayName^5",
            "LayerDisplayNameSynonyms^2",
            "ThemeKeywordsSynonymsLcsh^1",
            "Originator^1",
            "Publisher^1"
        ];

        var params = {
            qf: qf_array.join(" "),
            q: this.what || "*",
            fq: this.filters
        };

        return params;
    };
  
    this.setWhat = function(what){
    	this.what = what;
    };
    
    this.setWhere = function(where){
    	this.where = where;
    };
    /**
     * Return parameters for textual search in a basic search
     *
     * @private
     * @return {object} solr parameters
     */
    this.getOgpBasicTextSearchParams = function(){
    	var userTerms = "";//the what field and the where field;  do we need the granularity to parse each separately?
        var qf_array = [
                        "LayerDisplayName^"+Config.solr.LayerDisplayName,
                        "Publisher^"+Config.solr.Publisher,
                        "Originator^"+Config.solr.Originator,
                        "Abstract^"+Config.solr.Abstract,
                        "PlaceKeywords^"+Config.solr.PlaceKeywords
                    ];

                    var params = {
                        qf: qf_array.join(" "),
                        q: userTerms || "*",
                        fq: this.getFilters()
                    };

                    return params;
    };
	
	
	this.setBasicKeywords = function setBasicKeywords(keywords) {
		this.BasicKeywordString = keywords;
	};

	this.getBasicKeywords = function getBasicKeywords() {
		return this.BasicKeywordString;
	};

	this.getBasicKeywordTerms = function getBasicKeywordTerms() {
		return this.BasicKeywordTerms;
	};

	this.getBasicKeywordTermsArr = function getBasicKeywordTermsArr() {
		var keywordArr = [];
		// console.log(this.BasicKeywordTerms);
		for ( var i = 0; i < this.BasicKeywordTerms.length; i++) {
			keywordArr.push(this.BasicKeywordTerms[i].term);
		}
		// console.log(keywordArr);
		return keywordArr;
	};

	this.setAdvancedKeywords = function setAdvancedKeywords(keywordString) {
		this.AdvancedKeywordString = keywordString;
	};

	this.getAdvancedKeywords = function getAdvancedKeywords() {
		return this.AdvancedKeywordString;
	};

	this.getAdvancedKeywordTerms = function getAdvancedKeywordTerms() {
		return this.AdvancedKeywordTerms;
	};

	this.getAdvancedKeywordTermsArr = function getAdvancedKeywordTermsArr() {
		var keywordArr = [];
		for ( var i = 0; i < this.AdvancedKeywordTerms.length; i++) {
			keywordArr.push(this.AdvancedKeywordTerms[i].term);
		}

		return keywordArr;
	};

	this.getKeywordQuery = function getKeywordQuery(keywords, terms) {
		var temp = keywords;

		if ((temp == null) || (temp == "") || (temp.indexOf("Search for") > -1)) {
			return null;
		}

		// temp = this.escapeSolrValue(temp);
		var keywords = this.tokenize(temp);
		var keywordQuery = "";
		var i;

		var processedKeywordArr = [];
		var useKeywordQuery = false;

		for (i = 0; i < keywords.length; i++) {

			var currentKeyword = this.escapeSolrValue(keywords[i].trim());// .replace(/["]/g,
																			// '\\"').replace(/[']/g,
																			// '\\"');

			if (currentKeyword.length > 0) {

				if (currentKeyword.indexOf(":") > 0) {
					// here if we have something of the form Field:Value
					// that is, user supplied the Solr field name and value to
					// search for, add it to query
					var elements = currentKeyword.split(":");
					var fieldName = elements[0];
					var fieldValue = elements[1];
					keywordQuery += "query({!dismax qf=" + fieldName + " v='"
							+ fieldValue + "'})";
				} else {
					// here if user entered keywords they want searched against
					// standard fields
					useKeywordQuery = true;
					processedKeywordArr.push(currentKeyword);
				}
			}
		}

		if (useKeywordQuery) {
			if (keywords.length > 1) {
				processedKeyword = "(" + processedKeywordArr.join(" ") + ")";
			} else {
				processedKeyword = processedKeywordArr[0];
			}
			keywordQuery = this
					.getKeywordQueryTemplate(processedKeyword, terms);
		}

		return keywordQuery;

	};

	this.getKeywordQueryTermTemplate = function getKeywordQueryTermTemplate(
			keyword, termObject) {

		var capPrefix = "";
		var capSuffix = "";
		if (termObject.hasCap) {
			capPrefix = "(min";
			capSuffix = termObject.cap + "),"
		}

		var keywordQuery = "product" + capPrefix + "(query({!dismax qf="
				+ termObject.term;
		keywordQuery += " v='" + keyword + "'})," + capSuffix
				+ termObject.boost + ")";
		return keywordQuery;
	};

	// for the advanced query, the keyword search only looks at keywords and the
	// LayerDisplayName
	this.getKeywordQueryTemplate = function getKeywordQueryTemplate(keyword,
			terms) {
		var keywordQuery = "sum(";
		var queryArr = [];
		for ( var i = 0; i < terms.length; i++) {
			queryArr.push(this.getKeywordQueryTemplate(keyword, terms[i]));
		}
		keywordQuery += queryArr.join(",");
		keywordQuery += ")";

		return keywordQuery;
	};

	// return a query that searches for all the passed keywords in many fields
	// for fields that include synonyms, we must cap the value since
	// synonym can explode out to many words, layers with many matches would get
	// too large a score contribution
	// note the returned string does not contain "q="
	this.getBasicKeywordQuery = function getBasicKeywordQuery() {

		return this.getKeywordQuery(this.getBasicKeywords(),
				this.BasicKeywordTerms);
	};

	this.getAdvancedKeywordQuery = function getAdvancedKeywordQuery(
			keywordString) {
		return this.getKeywordQuery(this.getAdvancedKeywords(),
				this.getAdvancedKeywordTerms);
	};

	// create a filter query for the keywords against the non-exact fields
	this.getKeywordFilter = function(keywords, arrFilterFields) {
		// console.log(arrFilterFields);
		var temp = keywords;
		if ((temp == null) || (temp == "") || (temp.indexOf("Search for") > -1)) {
			return null;
		}
		// temp = temp.replace(/^\s+|\s+$/g,'').replace(/\s+/g,' ');
		// temp = this.escapeSolrValue(temp);
		var keywords = this.tokenize(temp);
		// var keywords = temp.split(" ");
		var keywordFilter = "";
		var i;
		var processedKeywordArr = [];
		var useKeywordFilter = false;
		for (i = 0; i < keywords.length; i++) {
			var currentKeyword = this.escapeSolrValue(keywords[i].trim());
			if (currentKeyword.indexOf(":") > 0) {
				// here if we have something of the form Field:Value
				// that is, user supplied the Solr field name and its value
				// nothing to do for the filter
			} else {
				useKeywordFilter = true;
				// here if user entered keywords they want searched against
				// standard fields
				processedKeywordArr.push(currentKeyword);
			}

		}

		if (useKeywordFilter) {
			if (keywords.length > 1) {
				processedKeyword = "(" + processedKeywordArr.join(" ") + ")";
			} else {
				processedKeyword = processedKeywordArr[0];
			}

			var numFields = arrFilterFields.length;
			var term = ":" + processedKeyword;
			var joiner = "+OR+";
			keywordFilter += arrFilterFields.join(term + joiner);
			if (numFields > 0) {
				keywordFilter += term;
			}
		}
		keywordFilter = "fq=" + keywordFilter;
		// console.log(keywordFilter);
		return keywordFilter;
	};

	// create a filter query for the keywords against the non-exact fields
	this.getKeywordPhraseFilter = function(keywords, arrTerms) {
		// console.log(arrFilterFields);
		var temp = keywords;
		if ((temp == null) || (temp == "") || (temp.indexOf("Search for") > -1)) {
			return null;
		}

		var keywords = this.tokenize(temp);

		var keywordFilter = "";
		var i;
		var processedKeywordArr = [];
		var useKeywordFilter = false;
		for (i = 0; i < keywords.length; i++) {
			var currentKeyword = this.escapeSolrValue(keywords[i].trim());

			if (currentKeyword.indexOf(":") > 0) {
				// here if we have something of the form Field:Value
				// that is, user supplied the Solr field name and its value
				// nothing to do for the filter
			} else {
				useKeywordFilter = true;
				// here if user entered keywords they want searched against
				// standard fields
				processedKeywordArr.push(currentKeyword);
			}

		}

		if (useKeywordFilter) {
			var arrFilterFields = [];
			for ( var j = 0; j < arrTerms.length; j++) {
				if (typeof arrTerms[j].baseTerm != "undefined") {
					arrFilterFields.push(arrTerms[j].baseTerm);
				}
			}
			if (keywords.length > 1) {
				processedKeyword = "'" + processedKeywordArr.join(" ") + "'";
				var numFields = arrFilterFields.length;
				var term = ":" + processedKeyword;
				var boost = "^" + this.GenericPhraseBoost;
				var joiner = boost + "&pf=";
				keywordFilter += arrFilterFields.join(term + joiner);

				if (numFields > 0) {
					keywordFilter += term;
				}
				keywordFilter = "&pf=" + keywordFilter + boost;
			} else {
				keywordFilter = ""; // doesn't make sense to do phrase matching
									// for single terms
			}
		}
		return keywordFilter;
	};




	this.setAccessDisplay = function setAccessDisplay(accessValue) {
		this.AccessDisplay = accessValue;
	};

	this.getAccessFilter = function getAccessFilter() {
		if ((this.AccessDisplay == null) || (this.AccessDisplay == ""))
			return "";
		return this.getFilter("Access", [ this.AccessDisplay ]);
	};


	// a topic can be a set of words, we basically treat each word like a
	// keyword //TODO: does this help?
	this.getTopicQuery = function getTopicQuery() {
		var temp = this.getTopic();
		temp = temp.trim();
		if ((temp == null) || (temp == ""))
			return null;
		var topics = temp.split(" ");
		var topicFilter = "";
		var i;
		for (i = 0; i < topics.length; i++) {
			var currentTopic = topics[i];
			if (currentTopic != "") {
				// if (i > 0)
				// topicFilter += "+OR+";
				topicFilter += "product(query({!dismax qf="
						+ this.IsoTopicTerm.term + " v='" + currentTopic
						+ "'})," + this.IsoTopicTerm.boost + ")";
				// topicFilter += "ThemeKeywordsSynonymsIso:" + currentTopic +
				// "^4";
			}
		}
		return topicFilter;
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
	this.createDateRangeFilter = function createDateRangeFilter(dateField, fromDate, toDate) {
		var dateSuffix = "-01-01T01:01:01Z"; // per an ISO standard solr
												// expects
		fromDate = this.filterDateValue(fromDate);
		toDate = this.filterDateValue(toDate);
		
		if (((fromDate == null) || (fromDate == ""))
				&& ((toDate == null) || (toDate == ""))){
			return ""; // no date search data specified so no search filter
		}
		
		fromDate =  fromDate || "0001";
		toDate = toDate || "2100";

		fromDate += dateSuffix;
		toDate += dateSuffix;
		
		return this.createRangeFilter(dateField, fromDate, toDate);

	};
	
	this.createRangeFilter = function(field, from, to, prefix){
		if (typeof prefix == "undefined"){
			prefix = "";
		}
		var searchClause = field + ":[" + from + " TO "	+ to + "]";
		return prefix + searchClause;
	};

	
	
	
	
	this.setTopic = function setTopic(topic) {
		this.TopicString = topic;
	};

	this.getTopic = function getTopic() {
		return this.TopicString;
	};

	this.setSort = function(column, order) {
		this.SortColumn = column;
		this.SortOrder = order;
	};

	this.setDates = function(fromDate, toDate) {
		this.FromDate = fromDate;
		this.ToDate = toDate;
	};

	this.setPublisher = function setPublisher(publisher) {
		this.Publisher = publisher;
	};

	this.setOriginator = function setOriginator(originator) {
		this.Originator = originator;
	};

	/*
	// this function returns a new string that is some combination of the passed
	// strings
	// if the originalString is not empty, it returns originalString + separator
	// + concatElement
	// if this originalString is empty, it returns concatElement
	// if concatElement is empty, originalString is returned
	this.concatWith = function concatWith(originalString, concatElement,
			separator) {
		if (((originalString == null) || (originalString == ""))
				&& ((concatElement == null) || (concatElement == ""))) {
			return "";
		}
		var returnValue = "";

		if ((originalString == null) || (originalString == "")) {
			returnValue = concatElement;

		} else if ((concatElement == null) || (concatElement == "")) {
			returnValue = originalString;
		} else {
			returnValue = originalString + separator + concatElement;
		}
		return returnValue;
	};
	
	this.getAndFilter = function(term, values) {
		if ((values == null) || (values == "")) {
			return "";
		}

		var arrValues = this.tokenize(values);
		;
		var filter = "";
		for ( var i = 0; i < arrValues.length; i++) {

			var currentSource = this.escapeSolrValue(arrValues[i]);
			if (currentSource.length > 0) {
				if (i == 0) {
					filter = "fq=";
				}
				if (i > 0) {
					filter += "+AND+";
				}
				filter += term + ":" + currentSource;
			}
		}
		filter += "&pf=" + term + ":" + arrValues.join(" ");
		return filter;
	};

	this.getPublisherFilter = function getPublisherFilter() {
		return this.getAndFilter("Publisher", this.Publisher);

	};

	this.getOriginatorFilter = function getOriginatorFilter() {
		return this.getAndFilter("Originator", this.Originator);

	};
	
		// return a URL parameter formatted string containing all the Solr filters
	// and
	// clauses in the passed elements array
	// this function iterates over all of the elements and builds a string with
	// & before each
	// note the returned string begins with a & character.
	this.combineFiltersAndClauses = function combineFiltersAndClauses(elements) {
		var combined = "";
		var i;
		for (i = 0; i < elements.length; i++) {
			var element = elements[i];
			if ((element != null) && (element != ""))
				combined = combined + "&" + element;
		}
		return combined;
	};
*/
	/*
	 * should search results include restricted data from remote institutions if
	 * so, call this function
	 */
	this.setAllRestricted = function setAllRestricted() {
		this.restrictedFilter = "";
	};

	/*
	 * should search results include restricted data only from the local
	 * institution if so, call this function with the name of the local
	 * institution as it appears in the Access field
	 */
	this.setLocalRestricted = function setLocalRestricted(institutionName) {
		this.restrictedFilter = "fq=Institution:" + institutionName
				+ "+OR+Access:Public";
	};

	/*
	 * get the filter to potentially eliminate remote restricted layers.
	 */
	this.getRestrictedFilter = function getRestrictedFilter() {
		if (this.restrictedFilter == null) {
			return "";
		} else {
			return this.restrictedFilter;
		}
	};
	

	

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
			timeout: 5000,
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

	
	this.termQuery = function termQuery(field, term, successFunction, errorFunction) {
		var url = this.getServerName().substring(0,
				this.getServerName().indexOf("select"))
				+ "terms";

		var query = jQuery.param(this.getTermParams(field, term), true);

		this.sendToSolr(url + "?" + query, successFunction, errorFunction);
	};


	// this function must be passed the name of the column to sort on and the
	// direction to sort
	// e.g., getSortClause("ContentDate", this.SortDecending);
	this.getSortClause = function getSortClause() {
		var column = this.SortColumn;
		var order = this.SortOrder;
		if (this.SortColumn == null)
			column = "score";
		if (this.SortOrder == null)
			order = this.SortDecending;
		var sortClause = column + " " + order;
		return sortClause;
	};

	this.SearchRequest = "Search";
	this.MetadataRequest = "FgdcText";
	this.CountRequest = "CountOnly";

	this.SearchRequestColumns = [ "Name", "Institution", "Access", "DataType",
			"LayerDisplayName", "Publisher", "GeoReferenced", "Originator",
			"Location", "MinX", "MaxX", "MinY", "MaxY", "ContentDate",
			"LayerId", "score", "WorkspaceName" ];
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

	// return a Solr clause specifying the index of the first search result to
	// return
	// we only return a subset of the full search results, the next and previous
	// buttons are used to
	// navigate through the entire search results. The passed resultStart
	// specifies which
	// the index of the first result to return
	this.getResultStartClause = function getResultStartClause() {
		return "start=" + this.StartRow;
	};

	this.setResultStartRow = function setResultStartRow(start) {
		this.StartRow = start;
	};

	this.getResultStartRow = function getResultStartRow() {
		return this.StartRow;
	};

	// return a Solr clause specifying how many results to return. How many
	// results are needed to
	// display can vary based on what panels are open and closed (e.g., advanced
	// search) or the
	// size of the browser window.
	this.getResultCountClause = function getResultCountClause() {
		if (this.RowCount == 'Infinity') {
			return "rows=0";
		} else {
			return "rows=" + this.RowCount;
		}
	};




	/*
	 * 
	 * 
	 * 
	 * defaults = { wt: "json", q: "*:*", rows: 20, facet: true, "facet.field": [
	 * "{!ex=inst}InstitutionSort", "{!ex=dt}DataTypeSort", "PlaceKeywordsSort" ],
	 * "f.PlaceKeywordsSort.facet.mincount": 1,
	 * "f.PlaceKeywordsSort.facet.limit": 10, "facet.range":
	 * "{!ex=df}ContentDate", "facet.range.start": "1900-01-01T01:01:01Z",
	 * "facet.range.end": "NOW", "facet.range.gap": "+10YEAR",
	 * "facet.range.other": "before", start: 0, defType: "edismax", fl:
	 * "Access,Area,CenterX,CenterY,DataType,DataTypeSort,HalfHeight,HalfWidth,Institution,InstitutionSort,LayerDisplayName,LayerId,Location,MaxX,MaxY,MinX,MinY,Name,WorkspaceName" };
	 * 
	 * params = $.extend({}, defaults, this.params);
	 * 
	 * 
	 */

	this.getSearchQuery = function getSearchQuery() {
		var keywordQuery = null;
		var keywordFilter = null;
		var topicQuery = null;
		var topicFilter = null;
		var spatialFilter = "";
		var spatialQuery = null;
		var queryClause = "";

		// at most, only one of basicKeywords or advancedKeywords should be set
		var basicKeywords = this.getBasicKeywords();
		var advancedKeywords = this.getAdvancedKeywords();

		if (basicKeywords != null) {
			keywordQuery = this.getBasicKeywordQuery();
			var arrBasicTerms = this.getBasicKeywordTermsArr();
			keywordFilter = this.getKeywordFilter(basicKeywords, arrBasicTerms);
			keywordFilter += this.getKeywordPhraseFilter(basicKeywords, this
					.getBasicKeywordTerms());
		} else if (advancedKeywords != null) {

			var arrAdvancedTerms = this.getAdvancedKeywordTermsArr();

			keywordQuery = this.getAdvancedKeywordQuery();
			keywordFilter = this.getKeywordFilter(advancedKeywords,
					arrAdvancedTerms);
			keywordFilter += this.getKeywordPhraseFilter(advancedKeywords, this
					.getAdvancedKeywordTerms());

		}
		var topic = this.getTopic();
		if (topic != null) {
			topicQuery = this.getTopicQuery();
			topicFilter = this.getTopicFilter();
		}

		if (this.MinX != null) {
			// here if we need spatial filter and scoring
			spatialQuery = this.getSpatialQuery();
			spatialFilter = this.getLayerIntersectsMapFilter();
		}

		queryClause = this.combineQueries(spatialQuery, keywordQuery,
				topicQuery);

		var returnType = this.getReturnTypeClause();
		var returnedColumns = this.getReturnedColumnsClause(this.SearchRequest);
		var rowCount = this.getResultCountClause();
		var startRow = this.getResultStartClause();
		var sortClause = this.getSortClause();
		var dateFilter = this.getDateFilter();
		var dataTypeFilter = this.getDataTypeFilter();
		var institutionFilter = this.getInstitutionFilter();
		var accessFilter = this.getAccessFilter();
		var publisher = this.getPublisherFilter();
		var originator = this.getOriginatorFilter();
		var restrictedFilter = this.getRestrictedFilter();
		var shardClause = this.getShardServerNames(); // "shards=geoportal-dev.atech.tufts.edu/solr,gis.lib.berkeley.edu:8080/solr/";
		var extras = this.combineFiltersAndClauses([ spatialFilter, returnType,
				returnedColumns, rowCount, startRow, shardClause, sortClause,
				keywordFilter, dateFilter, dataTypeFilter, institutionFilter,
				accessFilter, publisher, originator, restrictedFilter,
				topicFilter ]);

		var query = "q=" + queryClause + "&debugQuery=false&" + extras; // spatialFilter
																		// + "&"
																		// +
																		// returnType
																		// + "&"
																		// +
																		// returnedColumns;
		// foo = query;
		return query;
	};

	this.getURL = function() {

		var query = jQuery.param(this.getSearchParams(), true);
		return this.getServerName() + "?" + query;

	};

	// combine the three possible queries (spatial, keywords and topic) into a
	// unified solr query
	this.combineQueries = function combineQueries(spatialQuery, keywordQuery,
			topicQuery) {

		// first check to see if we have any query clauses, if not search for
		// everything
		var nullCount = 0;
		if (spatialQuery == null)
			nullCount++;
		if (keywordQuery == null)
			nullCount++;
		if (topicQuery == null)
			nullCount++;

		if (nullCount == 3)
			return "*:*";

		// still in development

		var returnValue = "_val_:\"sum(";
		if (spatialQuery != null)
			returnValue += spatialQuery;
		else
			returnValue += "0";
		returnValue += ",";

		if (keywordQuery != null)
			returnValue += keywordQuery;
		else
			returnValue += "0";

		returnValue += ",";
		if (topicQuery != null)
			returnValue += topicQuery;
		else
			returnValue += "0";

		returnValue += ")\"";

		return returnValue;

	};

	/**
	 * execute the right search query for all the parameters set in this solr
	 * object note this isn't used to obtain metadata, it is used to perform a
	 * "normal" search it is call for both basic and advanced searches
	 */
	this.executeSearchQuery = function executeSearchQuery(success, error) {
		var query = this.getSearchQuery();
		this.sendToSolr(this.getServerName() + "?" + query, success, error);
	};

	this.showAdminControls = function() {
		var adminDivId = "solrAdminDiv";

		if (typeof jQuery("#" + adminDivId)[0] == 'undefined') {

			var arrTerms = [ this.LayerWithinMap, this.LayerMatchesScale,
					this.LayerMatchesCenter, this.LayerIntersectionScale,
					this.LayerDisplayNameTerm, this.ThemeKeywordsTerm,
					this.PlaceKeywordsTerm, this.PublisherTerm,
					this.OriginatorTerm ];
			var shareDiv = '<div id="' + adminDivId + '" class="dialog"> \n';
			shareDiv += '</div> \n';
			jQuery('body').append(shareDiv);

			var adminDiv$ = jQuery("#" + adminDivId);

			this.createAdminControls(adminDiv$, arrTerms);

			var that = this;
			// console.log(adminDiv$);
			adminDiv$.dialog({
				zIndex : 3000,
				autoOpen : false,
				width : 'auto',
				title : 'Solr Admin',
				context : that,
				resizable : false
			});

		}
		jQuery("#" + adminDivId).dialog('open');

	};

	this.createAdminControls = function(div$, arrTerms) {

		for ( var i = 0; i < arrTerms.length; i++) {
			this.addAdminSlider(div$, arrTerms[i]);
		}

	};

	this.addAdminSlider = function(div$, termObj) {

		if (termObj.hasBoost) {
			var term = termObj.term + "Boost";
			var labelDivId = term + "Label";
			var valueDivId = term + "Value";
			var sliderDivId = term + "Slider";
			var html = "<p><label id='" + labelDivId + "' for='" + valueDivId
					+ "'>" + termObj.term + ":</label>\n";
			html += "<input type='text' id='" + valueDivId
					+ "' style=\"border:0;\" value='" + termObj.boost + "'/>";
			html += "</p>\n";
			html += "<div class='solrAdminSlider' id='" + sliderDivId
					+ "'></div>";
			// console.log(div$, html);
			div$.append(html);

			jQuery("#" + sliderDivId).slider({
				min : 0,
				max : 100,
				step : .5,
				value : parseInt(termObj.boost),
				slide : function(event, ui) {
					jQuery("#" + valueDivId).val(ui.value);
					termObj.boost = ui.value;
				}
			});

		}
		if (termObj.hasCap) {
			var term = termObj.term + "Cap";
			var labelDivId = term + "Label";
			var valueDivId = term + "Value";
			var sliderDivId = term + "Slider";
			var html = "<p><label id='" + labelDivId + "' for='" + valueDivId
					+ "'>" + termObj.term + ":</label>\n";
			html += "<input type='text' id='" + valueDivId
					+ "' style=\"border:0;\" value='" + termObj.cap + "'/>";
			html += "</p>\n";
			html += "<div class='solrAdminSlider' id='" + sliderDivId
					+ "'></div>";

			div$.append(html);

			jQuery("#" + sliderDivId).slider({
				min : 0,
				max : 100,
				step : .5,
				value : parseInt(termObj.cap),
				slide : function(event, ui) {
					jQuery("#" + valueDivId).val(ui.value);
					termObj.cap = ui.value;
				}
			});
		}

	};
};

// edismax
// aliasing
// &f.who.qf=name^5.0+namealias^2.0&f.where.qf=address^1.0+city^10.0+state

// this function can be called from the console to test the Solr object
// it gets the metadata for a layer
/*
 * function testGetMetadata() { var solr = new OpenGeoportal.Solr(); var query =
 * solr.getMetadataQuery(7944); solr.sendToSolr(query, testSuccess, testError);
 * return "testGetMetadata done"; };
 */
// this function can be called from the console to test the Solr object
/*
 * function testSearchComposite() { var solr = new OpenGeoportal.Solr(); var
 * keywordQuery = solr.getBasicKeywordQuery("Somerville"); var spatialQuery =
 * solr.getSpatialQuery(0.0, 1.0, 0.0, 1.0); var query = "q=" + spatialQuery;
 * //*:*"; institutionFilter = solr.getInstitutionFilter(["Tufts"]);
 * dataTypeFilter = solr.getDataTypeFilter([solr.DataType.Polygon]); dateFilter =
 * solr.getDateFilter(1950, null); sortClause =
 * solr.getSortClause("ContentDate", solr.SortDecending); returnedColumnsClause =
 * solr.getReturnedColumnsClause(solr.SearchRequest); returnTypeClause =
 * solr.getReturnTypeClause(); spatialFilter =
 * solr.getLayerIntersectsMapFilter(0.0, 1.0, 0.0, 1.0); extras =
 * solr.combineFiltersAndClauses([institutionFilter, dataTypeFilter, sortClause,
 * returnedColumnsClause, returnTypeClause, spatialFilter]); query = query + "&" +
 * spatialFilter + "&wt=json" + "&" + institutionFilter + "&" + dataTypeFilter +
 * "&" + dateFilter + "&" + sortClause; //extras; //query = query + "&" +
 * institutionFilter + "&" + dataTypeFilter + "&" + dateFilter + "&" +
 * sortClause + "&" + spatialFilter // "&wt=json" + "&" + returnedColumnsClause;
 * //query = "q=*:*&wt=json&"; solr.sendToSolr(query, testSuccess, testError);
 * return "testSearchInstitutions done"; };
 */

// this function can be called from the console to test the Solr object
/*
 * function testDirect() {
 * 
 * var solr = new OpenGeoportal.Solr(); var url ="http://" +
 * solr.getServerName() + ":" + solr.getServerPort() +
 * "/solr/select?q=*:*&wt=json&json.wrf=?"; var ajaxParams = { type: "GET", url:
 * url, dataType: 'jsonp', jsonp: 'json.wrf', success: function(data) { foo =
 * data; alert("testDirect succes"); }, error: function(arg) { alert("testDirect
 * fail"); } }; jQuery.ajax(ajaxParams); return "called";
 *  }
 */
