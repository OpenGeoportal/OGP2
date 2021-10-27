
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

// This code uses ogpConfig.json values via org.OpenGeoPortal.InstitutionInfo.getSearch()

if (typeof org == 'undefined')
	{ 
		org = {};
	} 
	else if (typeof org != "object")
	{
		throw new Error("org already exists and is not an object");
	}

// Repeat the creation and type-checking code for the next level
if (typeof org.OpenGeoPortal == 'undefined')
	{
		org.OpenGeoPortal = {};
	} 
	else if (typeof org.OpenGeoPortal != "object")
	{
		throw new Error("org.OpenGeoPortal already exists and is not an object");
	}

org.OpenGeoPortal.Solr = function()
{
	// constructor code
	org.OpenGeoPortal.Solr.prototype.Institutions = [];
	org.OpenGeoPortal.Solr.prototype.DataTypes = [];

};

org.OpenGeoPortal.Solr.ServerName = "";
//org.OpenGeoPortal.Solr.prototype.ServerPort = "80";

/** 
 * config element from ogpConfig.json can contain either a single server 
 *  or all the shards on which to run queries
 * we always send the query to the first server in the list
 * the way the jsonp call works, server name needs the protocol (http://)
 *  also, it must end in "/select" for Solr.  this function adds them if they aren't there
 * this function is inefficient because it re-processes the shards every time it is called
 */
org.OpenGeoPortal.Solr.prototype.getServerName = function getServerName()
{
	var configInfo = org.OpenGeoPortal.InstitutionInfo.getSearch().serviceAddress;
	var elements = configInfo.split(",");
	var primaryServer = elements[0];
	if (!(primaryServer.indexOf("http://") == 0||primaryServer.indexOf("https://") == 0)){
		primaryServer = "http://" + primaryServer;
	}
	var select = "select";
	if ((primaryServer.substring(primaryServer.length - select.length) == select) == false)
	{
	    // here if the server name does not end in select
	    primaryServer = primaryServer + "select";
	}
	return primaryServer;
};

/**
 * return the shard argument for a Solr search command
 * config element from ogpConfig.json can contain a single server or all the shards on which to run queries
 * the returned Solr argument should not contain any protocol specification ("http://")
 *  nor should the urls end in "/select".  this function removes these elements as needed
 * this function is inefficient because it re-processes the shards every time it is called
 * @return
 */
org.OpenGeoPortal.Solr.prototype.getShardServerNames = function getShardNames()
{
	var configInfo = org.OpenGeoPortal.InstitutionInfo.getSearch().serviceAddress;
	var elements = configInfo.split(",");
	var shards = "";
	if (elements.length == 1)
		// here if there really aren't any shards, only a single primary server listed
		return shards;

	// otherwise, we build the Solr shard string
	var protocol = "http://";
	var select = "select";
	for (var i = 0 ; i < elements.length ; i++)
	{
		if (elements[i].indexOf(protocol) == 0)
			// shards can not specify protocol
			elements[i] = elements[i].substr(protocol.length);

		if ((elements[i].substring(elements[i].length - select.length) == select) == true)
		    // here if the current element ends in "select", we must strip it from shards
		    elements[i] = elements[i].substring(0, elements[i].length - select.length);
		if (shards.length > 0)
			shards = shards + ",";
		shards = shards + elements[i];
	}
	shards = "shards=" + shards;
	return shards;
};

org.OpenGeoPortal.Solr.prototype.getServerPort = function getServerPort()
{
	var portValue = org.OpenGeoPortal.InstitutionInfo.getSearch().servicePort;
	return portValue;
};




/*
 * Other queries
 */


//returns the solr query to obtain a layer's metadata document from the Solr server
org.OpenGeoPortal.Solr.prototype.getMetadataQuery = function getMetadataQuery(layerId)
{
	var jsonClause = this.getReturnTypeClause();
	var returnedColumns = this.getReturnedColumnsClause(this.FgdcTextRequest);
	var extras = this.combineFiltersAndClauses([jsonClause, returnedColumns]);
	var solrQuery = "q=" + "LayerId" + ":" + layerId + extras; 
	return solrQuery;
};

//returns the solr query to obtain a layer's metadata document from the Solr server
org.OpenGeoPortal.Solr.prototype.getTermQuery = function getFacetQuery(termField, requestTerm)
{
	var jsonClause = this.getReturnTypeClause();
	requestTerm = requestTerm + ".*";
	var solrQuery = "terms.fl=" + termField + "&terms.regex=" + requestTerm + "&terms.regex.flag=case_insensitive&terms.limit=-1&" +jsonClause;
	return solrQuery;
};

//returns the solr query to obtain a layer info from the Solr server given a layerId or array of layerId's
org.OpenGeoPortal.Solr.prototype.getInfoFromLayerIdQuery = function getInfoFromLayerIdQuery(layerId)
{
	var jsonClause = this.getReturnTypeClause();
	var returnedColumns = this.getReturnedColumnsClause(this.SearchRequest);
	var extras = this.combineFiltersAndClauses([jsonClause, returnedColumns]);
	var solrQuery;
	if (layerId.constructor == Array){
		solrQuery = "q=";
		for (var layerIndex in layerId){
			solrQuery += "LayerId" + ":" + layerId[layerIndex];
			if (layerIndex < (layerId.length - 1)){
				solrQuery += '+OR+';
			}
		}
	} else {
		solrQuery = "q=" + "LayerId" + ":" + layerId;
	}
	solrQuery += extras + "&rows=10000";
	return solrQuery;
};





/*
 * Main query components
 */


org.OpenGeoPortal.Solr.prototype.SortAcending = "asc";
org.OpenGeoPortal.Solr.prototype.SortDecending = "desc";

/*Boosts*/
org.OpenGeoPortal.Solr.prototype.LayerWithinMap = {term: "LayerWithinMap", hasBoost: true, boost: "9.0", hasCap: false};
org.OpenGeoPortal.Solr.prototype.LayerMatchesScale = {term: "LayerMatchesScale", hasBoost: true, boost: "3.0", hasCap: false};
org.OpenGeoPortal.Solr.prototype.LayerMatchesCenter = {term: "LayerMatchesCenter", hasBoost: true, boost: "2.0", hasCap: false};
org.OpenGeoPortal.Solr.prototype.LayerIntersectionScale = {term: "LayerIntersectionScale", hasBoost: true, boost: "2.0", hasCap: false};
org.OpenGeoPortal.Solr.prototype.LayerAreaIntersection = {term: "LayerAreaIntersection", hasBoost: true, boost: "3.0", hasCap: false};

/*defaults */
org.OpenGeoPortal.Solr.prototype.BasicKeywordString = null;

org.OpenGeoPortal.Solr.prototype.LayerDisplayNameTerm = {term: "LayerDisplayNameSynonyms", baseTerm:"LayerDisplayName", hasBoost: true, boost: "5.0", hasCap: true, cap: "0.5"};
org.OpenGeoPortal.Solr.prototype.ThemeKeywordsTerm = {term: "ThemeKeywordsSynonymsLcsh", baseTerm: "ThemeKeywords", hasBoost: true, boost: "1.0", hasCap: true, cap: "0.5"};
org.OpenGeoPortal.Solr.prototype.PlaceKeywordsTerm = {term: "PlaceKeywordsSynonyms", baseTerm: "PlaceKeywords", hasBoost: true, boost: "2.0", hasCap: false};
org.OpenGeoPortal.Solr.prototype.PublisherTerm = {term: "Publisher", hasBoost: true, boost: "1.0", hasCap: false};
org.OpenGeoPortal.Solr.prototype.OriginatorTerm = {term: "Originator", hasBoost: true, boost: "1.0", hasCap: false};
org.OpenGeoPortal.Solr.prototype.IsoTopicTerm = {term: "ThemeKeywordsSynonymsIso", hasBoost: true, boost: "4.0", hasCap: false};

org.OpenGeoPortal.Solr.prototype.GenericPhraseBoost = "9.0";


org.OpenGeoPortal.Solr.prototype.BasicKeywordTerms = [org.OpenGeoPortal.Solr.prototype.LayerDisplayNameTerm,
                                                      org.OpenGeoPortal.Solr.prototype.ThemeKeywordsTerm,
                                                      org.OpenGeoPortal.Solr.prototype.PlaceKeywordsTerm,
                                                      org.OpenGeoPortal.Solr.prototype.PublisherTerm,
                                                      org.OpenGeoPortal.Solr.prototype.OriginatorTerm];

org.OpenGeoPortal.Solr.prototype.AdvancedKeywordTerms = [org.OpenGeoPortal.Solr.prototype.LayerDisplayNameTerm,
                                                      org.OpenGeoPortal.Solr.prototype.ThemeKeywordsTerm,
                                                      org.OpenGeoPortal.Solr.prototype.PlaceKeywordsTerm];

org.OpenGeoPortal.Solr.prototype.MinX = null;
org.OpenGeoPortal.Solr.prototype.MaxX = null;
org.OpenGeoPortal.Solr.prototype.MinY = null;
org.OpenGeoPortal.Solr.prototype.MaxY = null;
org.OpenGeoPortal.Solr.prototype.RowCount = 20;
org.OpenGeoPortal.Solr.prototype.StartRow = 0;
org.OpenGeoPortal.Solr.prototype.SortOrder = org.OpenGeoPortal.Solr.prototype.SortDecending;
org.OpenGeoPortal.Solr.prototype.SortColumn = "score";

org.OpenGeoPortal.Solr.prototype.FromDate = null;
org.OpenGeoPortal.Solr.prototype.ToDate = null;
org.OpenGeoPortal.Solr.prototype.DataTypes = [];
org.OpenGeoPortal.Solr.prototype.Institutions = [];
org.OpenGeoPortal.Solr.prototype.AccessDisplay = null;

org.OpenGeoPortal.Solr.prototype.Publisher = null;
org.OpenGeoPortal.Solr.prototype.Originator = null;
org.OpenGeoPortal.Solr.prototype.AdvancedKeywordString = null;

// the OpenGeoPortal UI provides a pull-down with topics such as "Agriculture and Farming"
org.OpenGeoPortal.Solr.prototype.TopicString = null;


org.OpenGeoPortal.Solr.prototype.DataType = {Raster: "Raster", PaperMap: "Paper+Map", Point: "Point", Line: "Line", Polygon: "Polygon"};

/*
 * Helper functions
 * 
 */
//examine a field for quotes and parse them correctly
org.OpenGeoPortal.Solr.prototype.tokenize = function tokenize(searchTerms)
{
	//we're using the pf param instead for phrase matching
	/*console.log(searchTerms);
	var arrMatch = searchTerms.match(/["]/g);
	if (arrMatch != null){
		if (arrMatch.length > 1){
			var searchString = searchTerms.match(/\w+|"(?:\\"|[^"])+"/g);
			console.log(searchString);
			return searchString;
		}
	} else {
		arrMatch = searchTerms.match(/[']/g);
		if (arrMatch != null){
			if (arrMatch.length > 1){
				var searchString =  searchTerms.match(/\w+|'(?:\\'|[^'])+'/g);
				console.log(searchString);
				return searchString;
			}
		} 
	}*/
	searchTerms = searchTerms.replace(/^\s+|\s+$/g,'').replace(/\s+/g,' ');

	return searchTerms.split(" ");

};



org.OpenGeoPortal.Solr.prototype.escapeSolrValue = function escapeSolrValue(solrValue)
{
	solrValue = this.filterCharacters(solrValue);
    solrValue = solrValue.replace(/{/g, "\\{").replace(/}/g, "\\}").replace(/\[/g, "\\[").replace(/]/g, "\\]")
    	.replace(/!/g, "\\!").replace(/[+]/g, "\\+").replace(/&/g, "\\&").replace(/~/g, "\\~").replace(/[(]/g, "\\(")
    	.replace(/[)]/g, "\\)").replace(/-/g, "\\-").replace(/\^/g, "\\^");

    return solrValue;
};

//filter out characters that cause problems for solr
org.OpenGeoPortal.Solr.prototype.filterCharacters = function filterCharacters(solrValue){
	solrValue = solrValue.replace(/[&\/\\#,+()$~%.'":*?<>{}]/g,'');
	return solrValue;
};


//a private function used to create filters
org.OpenGeoPortal.Solr.prototype.getFilter = function getFilter(columnName, values)
{
	if (values.length == 0)
		return "";  // on empty input, no filter returned
	
	var i;
	var temp = "";
	for (i = 0 ; i < values.length ; i++)
	{
		var value = values[i];
		if (i > 0)
			temp += "+OR+";
		temp += columnName + ":" + value;
	}
	var filter = "fq=" + escape(temp);
	//filter += "&pf=" + escape(columnName + ":" + values.join(" ")) + "^" + this.GenericPhraseBoost;
	return filter;
	
};

//this function returns a new string that is some combination of the passed strings
//if the originalString is not empty, it returns originalString + separator + concatElement
//if this originalString is empty, it returns concatElement
//if concatElement is empty, originalString is returned
org.OpenGeoPortal.Solr.prototype.concatWith = function concatWith(originalString, concatElement, separator)
{
	if (((originalString == null) || (originalString == "")) && ((concatElement == null) || (concatElement == ""))){
		return "";
	}
	var returnValue = "";
	if ((originalString == null) || (originalString == "")){
		returnValue = concatElement;
	} else if ((concatElement == null) || (concatElement == "")){
		returnValue = originalString;
	} else {
		returnValue = originalString + separator + concatElement;
	}
	return returnValue;
};



/*************************************************************************************************
 * Spatial query components
 *************************************************************************************************/

org.OpenGeoPortal.Solr.prototype.getSpatialQuery = function getSpatialQuery() {
	
	var spatialQuery = "sum(" + this.layerWithinMap(this.MinX, this.MaxX, this.MinY, this.MaxY) + 
				"," + this.layerMatchesArea(this.MinX, this.MaxX, this.MinY, this.MaxY) + 
				"," + this.layerNearCenterLongitude(this.MinX, this.MaxX) + 
				"," + this.layerAreaIntersectionScore(this.MinX, this.MaxX, this.MinY, this.MaxY) +
				"," + this.layerNearCenterLatitude(this.MinY, this.MaxY) + 
				")";

	//return "";
	return spatialQuery;
};

org.OpenGeoPortal.Solr.prototype.setBoundingBox = function setBoundingBox(minX, maxX, minY, maxY)
{
	/*
	 * 	mapMinX = Math.max(mapMinX, -180);
	mapMinY = Math.max(mapMinY, -90);
	mapMaxX = Math.min(mapMaxX, 180);
	mapMaxY = Math.min(mapMaxY, 90);
	 */
	if (minX < -180){
		minX = -180;
	}
	if (maxX > 180){
		maxX = 180;
	}
	if (minY < -90){
		minY = -90;
	}
	if (maxY > 90){
		maxY = 90;
	}
	this.MinX = minX;
	this.MaxX = maxX;
	this.MinY = minY;
	this.MaxY = maxY;
};

org.OpenGeoPortal.Solr.prototype.clearBoundingBox = function clearBoundingBox()
{
	this.MinX = null;
	this.MaxX = null;
	this.MinY = null;
	this.MaxY = null;
};

/**
 * compute a score for layers within the current map
 * the layer's MinX and MaxX must be within the map extent in X
 * and the layer's MinY and MaxY must be within the map extent in Y
 * I had trouble using a range based test (e.g., MinX:[mapMinX+TO+mapMapX])
 *   along with other scoring functions based on _val_.  So, this function
 *   is like the other scoring functions and uses _val_.
 * The Solr "sum" function returns 4 if the layer is contained within the map.
 * The outer "map" converts 4 to 1 and anything else to 0.  
 * Finally, the product converts the 1 to LayerWithinMapBoost
 */
org.OpenGeoPortal.Solr.prototype.layerWithinMap = function layerWithinMap(mapMinX, mapMaxX, mapMinY, mapMaxY)
{
	var layerWithinMap = "";
	layerWithinMap += "product(" + this.LayerWithinMap.boost + ",map(sum(";
	layerWithinMap += "map(MinX," + mapMinX + "," + mapMaxX + ",1,0),";
	layerWithinMap += "map(MaxX," + mapMinX + "," + mapMaxX + ",1,0),";
	layerWithinMap += "map(MinY," + mapMinY + "," + mapMaxY + ",1,0),";
	layerWithinMap += "map(MaxY," + mapMinY + "," + mapMaxY + ",1,0))";
	layerWithinMap += ",4,4,1,0))";
	
	return layerWithinMap;
};



/** 
 * return a search element to boost the scores of layers whose scale matches the displayed map scale
 * specifically, it compares their area
 */
org.OpenGeoPortal.Solr.prototype.layerMatchesArea = function layerMatchesArea(mapMinX, mapMaxX, mapMinY, mapMaxY)
{
	var mapDeltaX = Math.abs(mapMaxX - mapMinX);
	var mapDeltaY = Math.abs(mapMaxY - mapMinY);
	var mapArea = (mapDeltaX * mapDeltaY);
	var layerMatchesArea = "product(" + this.LayerMatchesScale.boost 
				+ ",recip(sum(abs(sub(Area," + mapArea + ")),.01),1,1000,1000))";
	//				+ ",recip(val,1,1000,1000))";

	//var layerMatchesArea = "_val_:\"" + layerMatchesArea + "\"";

	return layerMatchesArea;
};

/**
 * return a search clause whose score reflects how much of the map this layers covers
 * 9 points in a 3x3 grid are used. we compute how many of those 9 points are within the 
 *  the layer's bounding box.  This count is then normalized and multiplied by the boost
 * the grid is evenly space and does not include points on the edge of the map. 
 *  for example, for a 3x3 grid we use 9 points spaced at 1/4, 1/2 and 3/4 x and y
 *  each point in the grid is weighted evenly 
 *    (distance from center of map to center of layer is provided by another clause)
 */
org.OpenGeoPortal.Solr.prototype.layerAreaIntersectionStepSize = 3;
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
			
			/*var thisPointWithin = "map(sum(";

			thisPointWithin += "map(";
				thisPointWithin += "sub(" + currentMapX + ",MinX)";
			thisPointWithin += ",0," + parseInt(mapXStepSize) + ",1,0),"
				
			thisPointWithin += "map(";
				thisPointWithin += "sub(" + currentMapX + ",MaxX)";
			thisPointWithin += ",-" + parseInt(mapXStepSize) + ",0,1,0),";
				
			thisPointWithin += "map(";
				thisPointWithin += "sub(" + currentMapY + ",MinY)";
			thisPointWithin += ",0," + parseInt(mapYStepSize) + ",1,0),";
			
			thisPointWithin += "map(";
				thisPointWithin += "sub(" + currentMapY + ",MaxY)";
			thisPointWithin += ",-" + parseInt(mapYStepSize) + ",0,1,0),"
				
			thisPointWithin += "),4,4,1,0)";*/

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
};


/**
 * score layer based on how close map center latitude is to the layer's center latitude
 */
org.OpenGeoPortal.Solr.prototype.layerNearCenterLatitude = function layerNearCenterLatitude(mapMinY, mapMaxY)
{
	var centerY = (mapMaxY + mapMinY)/2.;
    var layerMatchesCenter = "product(" + this.LayerMatchesCenter.boost 
				+ ",recip(abs(sub(product(sum(MaxY,MinY),.5)," + centerY + ")),1,1000,1000))";
    //var layerMatchesCenter = "_val_:\"" + layerMatchesCenter + "\"";
    return layerMatchesCenter;	
};


/**
 * score layer based on how close map center longitude is to the layer's center longitude
 */
org.OpenGeoPortal.Solr.prototype.layerNearCenterLongitude = function layerNearCenterLongitude(mapMinX, mapMaxX)
{
	var centerX = (mapMaxX + mapMinX)/2.;
    var layerMatchesCenter = "product(" + this.LayerMatchesCenter.boost
    				+ ",recip(abs(sub(product(sum(MaxX,MinX),.5)," + centerX + ")),1,1000,1000))";
    //var layerMatchesCenter = "_val_:\"" + layerMatchesCenter + "\"";

    return layerMatchesCenter;	
};

//return a Solr filter that filters out layers that do not intersect the passed bounding box
//it uses frange with a lower and upper bound
org.OpenGeoPortal.Solr.prototype.getLayerIntersectsMapFilter = function getLayerIntersectsMapFilter() //mapMinX, mapMaxX, mapMinY, mapMaxY)
{
	var intersectionScore = this.layerIntersectsMapAux(this.MinX, this.MaxX, this.MinY, this.MaxY); 
	var intersectionFilter = "fq={!frange+l%3D1+u%3D10}" + intersectionScore;
	//intersectionFilter += "&fq=Area:[0.01+TO+*]";
	//console.log(intersectionFilter);
	return intersectionFilter;
};

/**
 * a private function that returns a search element to detect intersecting layers
 * uses intersection of axis aligned bounding boxes (AABB) using separating axis
 * layers that have an intersecting axis with the map do not intersect the map and are filtered out
 * note that if the map covers the layer or if the map is contained within the layer, there is no separating axis
 *   so this function works for them as well.  
 * implementing separating axis on AABB in Solr's functional language (which lacks an if statement)
 *   is a little tricky so this function generates a complicated string
 *   
 * some info on separating access on AABB see:
 *   http://www.gamasutra.com/view/feature/3383/simple_intersection_tests_for_games.php?page=3
 *   
 * this function returns something that looks like:
 * product(2.0,
 * map(sum(map(sub(abs(sub(-71.172866821289,CenterX)),sum(0.7539367675480051,HalfWidth)),0,400000,1,0),
 * map(sub(abs(sub(42.3588141761575,CenterY)),sum(0.6900056205085008,HalfHeight)),0,400000,1,0)),0,0,1,0))
 *
 * @return
 */
org.OpenGeoPortal.Solr.prototype.layerIntersectsMapAux = function layerIntersectsMapAux(mapMinX, mapMaxX, mapMinY, mapMaxY)
{
	var mapCenterX = (mapMaxX + mapMinX) / 2.;
	var mapHalfWidth = (mapMaxX - mapMinX) / 2.;
	var mapCenterY = (mapMaxY + mapMinY) / 2.;
	var mapHalfHeight = (mapMaxY - mapMinY) / 2.;

	var centerDistanceX = "abs(sub(" + mapCenterX + ",CenterX))";
	var centerDistanceY = "abs(sub(" + mapCenterY + ",CenterY))";
	// the separatingAxis is positive if it is actually a separating axis (no intersection)
	var separatingAxisX = "sub(" + centerDistanceX + ",sum(" + mapHalfWidth + ",HalfWidth))";
	var separatingAxisY = "sub(" + centerDistanceY + ",sum(" + mapHalfHeight + ",HalfHeight))";
	// separatingAxisFlag is either 0 or 1, 1 when a separating axis exists
	var separatingAxisFlagX = "map(" + separatingAxisX + ",0,400000,1,0)";
	var separatingAxisFlagY = "map(" + separatingAxisY + ",0,400000,1,0)";
	// separatingAxisExists: 0 for no, 1 or 2 for yes
	var separatingAxisExists = "sum(" + separatingAxisFlagX + "," + separatingAxisFlagY + ")";
	// separatingAxisExistsFlag: 0 if no separating axis (the boxes intersect so add to score)
	//   or 1 if axis exists (that is, the boxes don't intersect so don't add to score)
	var separatingAxisExistsFlag = "map(" + separatingAxisExists + ",0,0,1,0)"; 
	var intersectionScore = "product(" + this.LayerIntersectionScale.boost + "," + separatingAxisExistsFlag + ")";
	return intersectionScore;
};

/*************************************************************************************************
 * Keyword/text components
 *************************************************************************************************/
org.OpenGeoPortal.Solr.prototype.setBasicKeywords = function setBasicKeywords(keywords)
{
	this.BasicKeywordString = keywords;
};

org.OpenGeoPortal.Solr.prototype.getBasicKeywords = function getBasicKeywords()
{
	return this.BasicKeywordString;
};

org.OpenGeoPortal.Solr.prototype.setAdvancedKeywords = function setAdvancedKeywords(keywordString)
{
	this.AdvancedKeywordString = keywordString;
};

org.OpenGeoPortal.Solr.prototype.getAdvancedKeywords = function getAdvancedKeywords()
{
	return this.AdvancedKeywordString;
};


org.OpenGeoPortal.Solr.prototype.getBasicKeywordTerms = function getBasicKeywordTerms()
{
	return this.BasicKeywordTerms;
};

org.OpenGeoPortal.Solr.prototype.getBasicKeywordTermsArr = function getBasicKeywordTermsArr()
{
	var keywordArr = [];
	//console.log(this.BasicKeywordTerms);
	for (var i = 0; i < this.BasicKeywordTerms.length; i++){
		keywordArr.push(this.BasicKeywordTerms[i].term);
	}
	//console.log(keywordArr);
	return keywordArr;
};

org.OpenGeoPortal.Solr.prototype.getAdvancedKeywordTerms = function getAdvancedKeywordTerms()
{
	return this.AdvancedKeywordTerms;
};

org.OpenGeoPortal.Solr.prototype.getAdvancedKeywordTermsArr = function getAdvancedKeywordTermsArr()
{
	var keywordArr = [];
	for (var i = 0; i < this.AdvancedKeywordTerms.length; i++){
		keywordArr.push(this.AdvancedKeywordTerms[i].term);
	}
	
	return keywordArr;
};

org.OpenGeoPortal.Solr.prototype.getBaseKeywordQuery = function getBaseKeywordQuery(keywords, keywordQueryTemplateFunction){
	var temp = keywords;
	
	if ((temp == null) || (temp == "") || (temp.indexOf("Search for") > -1)){
		return null;
	}
	
	//temp = this.escapeSolrValue(temp);
	var keywords = this.tokenize(temp);
	var keywordQuery = "";
	var i;
	
	var processedKeywordArr = [];
	var useKeywordQuery = false;
	
	for (i = 0 ; i < keywords.length ; i++){
		
		var currentKeyword = this.escapeSolrValue(keywords[i].trim());//.replace(/["]/g, '\\"').replace(/[']/g, '\\"');
		
		if (currentKeyword.length > 0){
			
			if (currentKeyword.indexOf(":") > 0){
				// here if we have something of the form Field:Value
				// that is, user supplied the Solr field name and value to search for, add it to query
				var elements = currentKeyword.split(":");
				var fieldName = elements[0];
				var fieldValue = elements[1];
				keywordQuery += "query({!dismax qf=" + fieldName + " v='" + fieldValue + "'})";
			} else {
				// here if user entered keywords they want searched against standard fields
				useKeywordQuery = true;
				processedKeywordArr.push(currentKeyword);
			}
		}
	}
	
	if (useKeywordQuery){
		if (keywords.length > 1){
			processedKeyword = "(" + processedKeywordArr.join(" ") + ")";
		} else {
			processedKeyword = processedKeywordArr[0];
		}
		keywordQuery = keywordQueryTemplateFunction.call(this, processedKeyword);
	}
	
	return keywordQuery;		
	
};

org.OpenGeoPortal.Solr.prototype.getKeywordQueryTemplate = function getKeywordQueryTemplate(keyword, termObject){

	var capPrefix = "";
	var capSuffix = "";
	if (termObject.hasCap){
		capPrefix = "(min";
		capSuffix = termObject.cap + "),";
	}

	var keywordQuery = "product" + capPrefix + "(query({!dismax qf=" + termObject.term;
	keywordQuery += " v='" + keyword + "'})," + capSuffix + termObject.boost + ")";
	return keywordQuery;
};


//for the basic query, we want to search LayerDisplayName, Keywords, Publisher, and Originator
org.OpenGeoPortal.Solr.prototype.getBasicKeywordQueryTemplate = function getBasicKeywordQueryTemplate(keyword){
	var keywordQuery = "sum(";
	var keywords = this.getBasicKeywordTerms();
	var queryArr = [];
	for (var i = 0; i < keywords.length; i++){
		queryArr.push(this.getKeywordQueryTemplate(keyword, keywords[i]));
	}
	keywordQuery += queryArr.join(",");
	keywordQuery += ")";
	
	return keywordQuery;
};

//for the advanced query, the keyword search only looks at keywords and the LayerDisplayName
org.OpenGeoPortal.Solr.prototype.getAdvancedKeywordQueryTemplate = function getAdvancedKeywordQueryTemplate(keyword){
	var keywordQuery = "sum(";
	var keywords = this.getAdvancedKeywordTerms();
	var queryArr = [];
	for (var i = 0; i < keywords.length; i++){
		queryArr.push(this.getKeywordQueryTemplate(keyword, keywords[i]));
	}
	keywordQuery += queryArr.join(",");
	keywordQuery += ")";
	
	return keywordQuery;
};

// return a query that searches for all the passed keywords in many fields
// for fields that include synonyms, we must cap the value since
//  synonym can explode out to many words, layers with many matches would get 
//  too large a score contribution
// note the returned string does not contain "q="
org.OpenGeoPortal.Solr.prototype.getBasicKeywordQuery = function getBasicKeywordQuery(){
	
	return this.getBaseKeywordQuery(this.getBasicKeywords(), this.getBasicKeywordQueryTemplate);
};

org.OpenGeoPortal.Solr.prototype.getAdvancedKeywordQuery = function getAdvancedKeywordQuery(keywordString)
{
	return this.getBaseKeywordQuery(this.getAdvancedKeywords(), this.getAdvancedKeywordQueryTemplate);
};

// create a filter query for the keywords against the non-exact fields
org.OpenGeoPortal.Solr.prototype.getKeywordFilter = function(keywords, arrFilterFields) {
	//console.log(arrFilterFields);
	var temp = keywords;
	if ((temp == null) || (temp == "") || (temp.indexOf("Search for") > -1))
		return null;
	//temp = temp.replace(/^\s+|\s+$/g,'').replace(/\s+/g,' ');
	//temp = this.escapeSolrValue(temp);
	var keywords = this.tokenize(temp);
	//var keywords = temp.split(" ");
	var keywordFilter = "";
	var i;
	var processedKeywordArr = [];
	var useKeywordFilter = false;
	for (i = 0 ; i < keywords.length ; i++)
	{
		var currentKeyword = this.escapeSolrValue(keywords[i].trim());//.replace(/["]/g, '\\"').replace(/[']/g, '\\"');
		/*if (i > 0)
			keywordFilter += "+AND+";*/
		if (currentKeyword.indexOf(":") > 0){
			// here if we have something of the form Field:Value
			// that is, user supplied the Solr field name and its value
			// nothing to do for the filter
		} else {
			useKeywordFilter = true;
			// here if user entered keywords they want searched against standard fields
			processedKeywordArr.push(currentKeyword);
		}

	}
	
	if (useKeywordFilter){
		if (keywords.length > 1){
			processedKeyword = "(" + processedKeywordArr.join(" ") + ")";
		} else {
			processedKeyword = processedKeywordArr[0];
		}
		
		var numFields = arrFilterFields.length;
		var term = ":" + processedKeyword;
		var joiner = "+OR+";
		keywordFilter += arrFilterFields.join(term + joiner);
		if (numFields > 0){
			keywordFilter += term;
		}
	}
	keywordFilter = "fq=" + keywordFilter;
	//console.log(keywordFilter);
	return keywordFilter;
};


//create a filter query for the keywords against the non-exact fields
org.OpenGeoPortal.Solr.prototype.getKeywordPhraseFilter = function(keywords, arrTerms) {
	//console.log(arrFilterFields);
	var temp = keywords;
	if ((temp == null) || (temp == "") || (temp.indexOf("Search for") > -1))
		return null;

	var keywords = this.tokenize(temp);

	var keywordFilter = "";
	var i;
	var processedKeywordArr = [];
	var useKeywordFilter = false;
	for (i = 0 ; i < keywords.length ; i++)
	{
		var currentKeyword = this.escapeSolrValue(keywords[i].trim());

		if (currentKeyword.indexOf(":") > 0){
			// here if we have something of the form Field:Value
			// that is, user supplied the Solr field name and its value
			// nothing to do for the filter
		} else {
			useKeywordFilter = true;
			// here if user entered keywords they want searched against standard fields
			processedKeywordArr.push(currentKeyword);
		}

	}
	
	if (useKeywordFilter){
		var arrFilterFields = [];
		for (var j = 0; j < arrTerms.length; j++){
			if (typeof arrTerms[j].baseTerm != "undefined"){
				arrFilterFields.push(arrTerms[j].baseTerm);
			}
		}
		if (keywords.length > 1){
			processedKeyword = "'" + processedKeywordArr.join(" ") + "'";
			var numFields = arrFilterFields.length;
			var term = ":" + processedKeyword;
			var boost = "^" + this.GenericPhraseBoost;
			var joiner =  boost + "&pf=";
			keywordFilter += arrFilterFields.join(term + joiner);
			if (numFields > 0){
				keywordFilter += term;
			}
			keywordFilter = "&pf=" + keywordFilter + boost;
		} else {
			keywordFilter = ""; //doesn't make sense to do phrase matching for single terms
		}
	}
	return keywordFilter;
};

/*
 * Additional query and filter substrings for advanced search
 */
/* Data Types */
// set specific data types to search
org.OpenGeoPortal.Solr.prototype.setDataTypes = function setDataTypes(rasterFlag, pointFlag, lineFlag, polygonFlag, mapFlag)
{
	var i = 0;
	if (rasterFlag)
	{
		this.DataTypes[i] = this.DataType.Raster;
		i = i + 1;
	}
	if (pointFlag)
	{
		this.DataTypes[i] = this.DataType.Point;
		i = i + 1;
	}
	if (lineFlag)
	{
		this.DataTypes[i] = this.DataType.Line;
		i = i + 1;
	}
	if (polygonFlag)
	{
		this.DataTypes[i] = this.DataType.Polygon;
		i = i + 1;
	}
	if (mapFlag)
	{
		this.DataTypes[i] = this.DataType.PaperMap;
		i = i + 1;
	}
};

org.OpenGeoPortal.Solr.prototype.addDataType = function addDataType(dataType)
{
	this.DataTypes[this.DataTypes.length] = this.DataType[dataType];
};


// this function must be passed an array containing instances from DataType
//  e.g., getDataTypeFilter([org.OpenGeoPortal.Solr.prototype.DataType.Raster, org.OpenGeoPortal.Solr.prototype.DataType.Polygon]);
org.OpenGeoPortal.Solr.prototype.getDataTypeFilter = function getDataTypeFilter()
{
	return this.getFilter("DataType", this.DataTypes);
};

// this function must be passed of array of institution names
//  e.g., getInstitutionFilter(["Tufts", "MIT"]);
// these strings must match the values of the institution field in Solr 
org.OpenGeoPortal.Solr.prototype.setInstitutions = function setInstitutions(institutions)
{
	this.Institutions = institutions;
};

org.OpenGeoPortal.Solr.prototype.addInstitution = function addInstitution(institution)
{
	this.Institutions[this.Institutions.length] = institution;
};

org.OpenGeoPortal.Solr.prototype.getInstitutionFilter = function getInstitutionFilter()
{
	return this.getFilter("Institution", this.Institutions);
};


org.OpenGeoPortal.Solr.prototype.setAccessDisplay = function setAccessDisplay(accessValue)
{
	this.AccessDisplay = accessValue;
};

org.OpenGeoPortal.Solr.prototype.getAccessFilter = function getAccessFilter()
{
	if ((this.AccessDisplay == null) || (this.AccessDisplay == ""))
		return "";
	return this.getFilter("Access", [this.AccessDisplay]);
};



org.OpenGeoPortal.Solr.prototype.getTopicFilter = function(){
	var temp = this.getTopic();
	temp = temp.trim();
	if ((temp == null) || (temp == ""))
		return null;
	var topics = temp.split(" ");
	var topicFilter = "";
	var keywordFilter = "";
	var i;
	for (i = 0 ; i < topics.length ; i++){
		var currentKeyword = topics[i];
		if (i > 0){
			keywordFilter += "+OR+";
		}
		keywordFilter += this.IsoTopicTerm.term + ":" + currentKeyword;
	}
	return "fq=" + keywordFilter;
};

// a topic can be a set of words, we basically treat each word like a keyword
org.OpenGeoPortal.Solr.prototype.getTopicQuery = function getTopicQuery()
{
	var temp = this.getTopic();
	temp = temp.trim();
	if ((temp == null) || (temp == ""))
		return null;
	var topics = temp.split(" ");
	var topicFilter = "";
	var i;
	for (i = 0 ; i < topics.length ; i++)
	{
		var currentTopic = topics[i];
		if (currentTopic != "")
		{
			//if (i > 0)
			//	topicFilter += "+OR+";
			topicFilter += "product(query({!dismax qf=" + this.IsoTopicTerm.term + " v='" + 
				currentTopic + "'})," + this.IsoTopicTerm.boost + ")";
			//topicFilter += "ThemeKeywordsSynonymsIso:" + currentTopic + "^4";
		}
	}
	return topicFilter;
};

org.OpenGeoPortal.Solr.prototype.filterDateValue = function filterDateValue(dateValue){
	if ((dateValue == null) || (dateValue == "")){
		return "";
	}
	//only 4 digit numbers should be allowed
	if (!jQuery.isNumeric(dateValue)){
		throw new Error("Year must be numeric");
	}
	var dateLen = dateValue.length;
	
	if (dateLen > 4){
		throw new Error("Year cannot be more than 4 digits.");
	} else if (dateLen == 4){
		return dateValue;
	} else if (dateLen == 3){
		return "0" + dateValue;
	} else if(dateLen == 2){
		return "00" + dateValue;
	} else if(dateLen == 1){
		return "000" + dateValue;
	} 
		
	return "";
	
};

// this function must be passed years, either the from date or the to date can be null
//  e.g., getDateFilter(1940, null);  // get layers since 1940
org.OpenGeoPortal.Solr.prototype.getDateFilter = function getDateFilter()
{
	var dateSuffix = "-01-01T01:01:01Z";  // per an ISO standard solr expects
	var fromDate = this.filterDateValue(this.FromDate);
	var toDate = this.filterDateValue(this.ToDate);
	
	if (((fromDate == null) || (fromDate == "")) && ((toDate == null) || (toDate =="")))
		return "";  // no date search data specified so no search filter
	
	if ((fromDate == null) || (fromDate == "")){
		fromDate = "0001";
	}
	
	if ((toDate == null) || (toDate == "")){
		toDate = "2100";
	}
	
	var searchClause = "fq=ContentDate:[" + fromDate + dateSuffix + "+TO+" + toDate + dateSuffix + "]";
	return searchClause;
};



org.OpenGeoPortal.Solr.prototype.setTopic = function setTopic(topic)
{
	this.TopicString = topic;
};

org.OpenGeoPortal.Solr.prototype.getTopic = function getTopic()
{
	return this.TopicString;
};

org.OpenGeoPortal.Solr.prototype.setSort = function(column, order)
{
	this.SortColumn = column;
	this.SortOrder = order;
};

org.OpenGeoPortal.Solr.prototype.setDates = function (fromDate, toDate)
{
	this.FromDate = fromDate;
	this.ToDate = toDate;
};

org.OpenGeoPortal.Solr.prototype.setPublisher = function setPublisher(publisher)
{
	this.Publisher = publisher;
};

org.OpenGeoPortal.Solr.prototype.setOriginator = function setOriginator(originator)
{
	this.Originator = originator;
};

org.OpenGeoPortal.Solr.prototype.getAndFilter = function(term, values){
	if ((values == null) || (values == "")){
		return "";
	}
	
	var arrValues = this.tokenize(values);;
	var filter = "";
	for (var i = 0 ; i < arrValues.length ; i++){
		
		var currentSource = this.escapeSolrValue(arrValues[i]);
		if (currentSource.length > 0){
			if (i == 0){
				filter = "fq=";
			}
			if (i > 0){
				filter += "+AND+";
			}
			filter += term + ":" + currentSource;
		}
	}
	filter += "&pf=" + term + ":" + arrValues.join(" ");
	return filter;
};

org.OpenGeoPortal.Solr.prototype.getPublisherFilter = function getPublisherFilter()
{
	return this.getAndFilter("Publisher", this.Publisher);

};

org.OpenGeoPortal.Solr.prototype.getOriginatorFilter = function getOriginatorFilter()
{
	return this.getAndFilter("Originator", this.Originator);

};

/*
 * should search results include restricted data from remote institutions
 * if so, call this function 
 */
org.OpenGeoPortal.Solr.prototype.setAllRestricted = function setAllRestricted()
{
	this.restrictedFilter = "";
};

/*
 * should search results include restricted data only from the local institution
 * if so, call this function with the name of the local institution as it appears in the Access field
 */
org.OpenGeoPortal.Solr.prototype.setLocalRestricted = function setLocalRestricted(institutionName)
{
	this.restrictedFilter = "fq=Institution:" + institutionName + "+OR+Access:Public";
};

/*
 * get the filter to potentially eliminate remote restricted layers.
 */
org.OpenGeoPortal.Solr.prototype.getRestrictedFilter = function getRestrictedFilter()
{
	if (this.restrictedFilter == null){
		return "";
	} else {
		return this.restrictedFilter;
	}
};



/**
 * execute the passed query asynchronously and call the success or error function when completed
 * a jsonp 
 */

org.OpenGeoPortal.Solr.prototype.sendToSolr = function sendToSolr(query, successFunction, errorFunction)
{
	var ajaxParams = 
		{
			type: "GET",
			url: this.getServerName() + "?" + query,
			dataType: 'jsonp',
			jsonp: 'json.wrf',
	        //timeout: 5000,
	        crossDomain: true,
			success: function(data){
					successFunction(data);
				},
			error: function(arg){
					errorFunction(arg);
				}
		};
	if (arguments.length > 3){
		//4th parameter is context parameter
		var newContext = arguments[3];
		ajaxParams.context = newContext;
		var newSuccessFunction = function(data){successFunction(data, newContext);};
		ajaxParams.success = newSuccessFunction;
	}
	jQuery.ajax(ajaxParams);
};

org.OpenGeoPortal.Solr.prototype.termQuery = function termQuery(query, successFunction, errorFunction)
{
	var url = this.getServerName().substring(0,this.getServerName().indexOf("select")) + "terms";
	var ajaxParams = 
		{
			type: "GET",
			url: url + "?" + query,
			dataType: 'jsonp',
			jsonp: 'json.wrf',
	        timeout: 5000, //if timeout occurs, error function is called
	        crossDomain: true,
			success: function(data){
					successFunction(data);
				},
			error: function(arg){
				//console.log("error");
					errorFunction(arg);
				}
		};
	if (arguments.length > 3){
		//4th parameter is context parameter
		var newContext = arguments[3];
		ajaxParams.context = newContext;
		var newSuccessFunction = function(data){successFunction(data, newContext);};
		ajaxParams.success = newSuccessFunction;
	}
	//console.log(this);
	jQuery.ajax(ajaxParams);
};

// this function must be passed the name of the column to sort on and the direction to sort
//  e.g., getSortClause("ContentDate", org.OpenGeoPortal.Solr.prototype.SortDecending);
org.OpenGeoPortal.Solr.prototype.getSortClause = function getSortClause()  //column, order)
{
	var column = this.SortColumn;
	var order = this.SortOrder;
	if (this.SortColumn == null) 
		column = "score";
	if (this.SortOrder == null)
		order = org.OpenGeoPortal.Solr.prototype.SortDecending;
	var sortClause = "sort=" + column + "+" + order;
	return sortClause;
};

org.OpenGeoPortal.Solr.prototype.SearchRequest = "Search";
org.OpenGeoPortal.Solr.prototype.FgdcTextRequest = "FgdcText";
org.OpenGeoPortal.Solr.prototype.CountRequest = "CountOnly";

// this function returns a Solr fl clause specifying the columns to return for the passed request
// since the full FGDC text can be very long, we don't want to return it for search requests
org.OpenGeoPortal.Solr.prototype.getReturnedColumnsClause = function getReturnedColumnsClause(requestType)
{
	var returnedColumns = "";
	if (requestType == org.OpenGeoPortal.Solr.prototype.FgdcTextRequest)
		returnedColumns = "fl=LayerId,FgdcText";
	else if (requestType == org.OpenGeoPortal.Solr.prototype.CountRequest)
		returnedColumns = "fl=";
	else if (requestType == org.OpenGeoPortal.Solr.prototype.SearchRequest)
		returnedColumns = "fl=Name,Institution,Access,DataType,LayerDisplayName,Publisher,GeoReferenced" +
						  ",Originator,Location,MinX,MaxX,MinY,MaxY,ContentDate,LayerId,score,WorkspaceName";
	else
		returnedColumns = "error in org.OpenGeoPortal.Solr.prototype.getReturnedColumnsClause" +
						  " did not understand passed requestType " + requestType;
	return returnedColumns;
};





// return a Solr clause specifying the index of the first search result to return
// we only return a subset of the full search results, the next and previous buttons are used to 
//  navigate through the entire search results.  The passed resultStart specifies which
//  the index of the first result to return
org.OpenGeoPortal.Solr.prototype.getResultStartClause = function getResultStartClause()
{
	return "start=" + this.StartRow; 
};

org.OpenGeoPortal.Solr.prototype.setResultStartRow = function setResultStartRow(start)
{
	this.StartRow = start;
};

org.OpenGeoPortal.Solr.prototype.getResultStartRow = function getResultStartRow()
{
	return this.StartRow;
};

// return a Solr clause specifying how many results to return.  How many results are needed to 
//  display can vary based on what panels are open and closed (e.g., advanced search) or the
//  size of the browser window.
org.OpenGeoPortal.Solr.prototype.getResultCountClause = function getResultCountClause()
{
	if(this.RowCount == 'Infinity'){
		return "rows=0";
	} else {
		return "rows=" + this.RowCount;
	}
};


org.OpenGeoPortal.Solr.prototype.getReturnTypeClause = function getReturnTypeClause()
{
	return "wt=json";
};


// return a URL parameter formatted string containing all the Solr filters and
//   clauses in the passed elements array
// this function iterates over all of the elements and builds a string with & before each
// note the returned string begins with a & character. 
org.OpenGeoPortal.Solr.prototype.combineFiltersAndClauses = function combineFiltersAndClauses(elements)
{
	var combined = "";
	var i;
	for (i = 0 ; i < elements.length ; i++)
	{
		var element = elements[i];
		if ((element != null) && (element != ""))
			combined = combined + "&" + element;  
	}
	return combined;
};

/*
 * 
 * 
 * 
 *         defaults = {
            wt: "json",
            q: "*:*",
            rows: 20,
            facet: true,
            "facet.field": [
                "{!ex=inst}InstitutionSort",
                "{!ex=dt}DataTypeSort",
                "PlaceKeywordsSort"
            ],
            "f.PlaceKeywordsSort.facet.mincount": 1,
            "f.PlaceKeywordsSort.facet.limit": 10,
            "facet.range": "{!ex=df}ContentDate",
            "facet.range.start": "1900-01-01T01:01:01Z",
            "facet.range.end": "NOW",
            "facet.range.gap": "+10YEAR",
            "facet.range.other": "before",
            start: 0,
            defType: "edismax",
            fl: "Access,Area,CenterX,CenterY,DataType,DataTypeSort,HalfHeight,HalfWidth,Institution,InstitutionSort,LayerDisplayName,LayerId,Location,MaxX,MaxY,MinX,MinY,Name,WorkspaceName"
        };

        params = $.extend({}, defaults, this.params);
 * 
 * 
 */
org.OpenGeoPortal.Solr.prototype.getSearchQuery = function getSearchQuery()
{
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
	
	if (basicKeywords != null){
		keywordQuery = this.getBasicKeywordQuery();
		var arrBasicTerms = this.getBasicKeywordTermsArr();
		keywordFilter = this.getKeywordFilter(basicKeywords, arrBasicTerms);
		keywordFilter += this.getKeywordPhraseFilter(basicKeywords, this.getBasicKeywordTerms());
	} else if (advancedKeywords != null){

		var arrAdvancedTerms = this.getAdvancedKeywordTermsArr();

		keywordQuery = this.getAdvancedKeywordQuery();
		keywordFilter = this.getKeywordFilter(advancedKeywords, arrAdvancedTerms);
		keywordFilter += this.getKeywordPhraseFilter(advancedKeywords, this.getAdvancedKeywordTerms());

	}
	var topic = this.getTopic();
	if (topic != null){
		topicQuery = this.getTopicQuery();
		topicFilter = this.getTopicFilter();
	}
	
	
	if (this.MinX != null){
		// here if we need spatial filter and scoring
		spatialQuery = this.getSpatialQuery();	
		spatialFilter = this.getLayerIntersectsMapFilter();
	}
	
	queryClause = this.combineQueries(spatialQuery, keywordQuery, topicQuery);
	
	
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
	var shardClause = this.getShardServerNames();  // "shards=geoportal-dev.atech.tufts.edu/solr,gis.lib.berkeley.edu:8080/solr/";
	var extras = this.combineFiltersAndClauses([spatialFilter, returnType, returnedColumns, rowCount, startRow, shardClause,
	                                            sortClause, keywordFilter, dateFilter, dataTypeFilter, institutionFilter, 
						    accessFilter, publisher, originator, restrictedFilter, topicFilter]);

	var query = "q=" + queryClause + "&debugQuery=false&" + extras; //spatialFilter + "&" + returnType + "&" + returnedColumns;
	//foo = query;
	return query;
};	

// combine the three possible queries (spatial, keywords and topic) into a unified solr query
org.OpenGeoPortal.Solr.prototype.combineQueries = function combineQueries(spatialQuery, keywordQuery, topicQuery)
{
	
	// first check to see if we have any query clauses, if not search for everything
	var nullCount = 0;
	if (spatialQuery == null) nullCount++;
	if (keywordQuery == null) nullCount++;
	if (topicQuery == null) nullCount++;
	
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
 * execute the right search query for all the parameters set in this solr object
 * note this isn't used to obtain metadata, it is used to perform a "normal" search
 * it is call for both basic and advanced searches
 */
org.OpenGeoPortal.Solr.prototype.executeSearchQuery = function executeSearchQuery(success, error)
{
	var query = this.getSearchQuery();
	this.sendToSolr(query, success, error);
};


org.OpenGeoPortal.Solr.prototype.showAdminControls = function ()
{
	var adminDivId = "solrAdminDiv";
	
	if (typeof jQuery("#" + adminDivId)[0] == 'undefined'){
		
		var arrTerms = [this.LayerWithinMap,
		                this.LayerMatchesScale,
		                this.LayerMatchesCenter,
		                this.LayerIntersectionScale,
		                this.LayerDisplayNameTerm,
		                this.ThemeKeywordsTerm,
		                this.PlaceKeywordsTerm,
		                this.PublisherTerm,
		                this.OriginatorTerm];
		var shareDiv = '<div id="' + adminDivId + '" class="dialog"> \n';
		shareDiv += '</div> \n';
		jQuery('body').append(shareDiv);

		var adminDiv$ = jQuery("#" + adminDivId);

		this.createAdminControls(adminDiv$, arrTerms);
		
		var that = this;
		//console.log(adminDiv$);
		adminDiv$.dialog({
			zIndex: 3000,
			autoOpen: false,
			width: 'auto',
			title: 'Solr Admin',
			context: that,
			resizable: false});
		
	}
	jQuery("#" + adminDivId).dialog('open');

};

org.OpenGeoPortal.Solr.prototype.createAdminControls = function(div$, arrTerms){

	for (var i = 0; i < arrTerms.length; i++){
			this.addAdminSlider(div$, arrTerms[i]);
		}	
	
};

org.OpenGeoPortal.Solr.prototype.addAdminSlider = function(div$, termObj){
	
	if (termObj.hasBoost){
		var term = termObj.term + "Boost";
		var labelDivId = term + "Label";
		var valueDivId = term + "Value";
		var sliderDivId = term + "Slider";
		var html = "<p><label id='" + labelDivId + "' for='" + valueDivId + "'>" + termObj.term + ":</label>\n";
		html += "<input type='text' id='" + valueDivId + "' style=\"border:0;\" value='" + termObj.boost + "'/>";
		html += "</p>\n";
		html += "<div class='solrAdminSlider' id='" + sliderDivId + "'></div>";
		//console.log(div$, html);
		div$.append(html);
		
		jQuery("#" + sliderDivId).slider({min: 0, max: 100, step: .5, value: parseInt(termObj.boost),
			slide: function(event, ui) {
				jQuery("#" + valueDivId).val(ui.value);
				termObj.boost = ui.value;
			}});
		
	} if (termObj.hasCap){
		var term = termObj.term + "Cap";
		var labelDivId = term + "Label";
		var valueDivId = term + "Value";
		var sliderDivId = term + "Slider";
		var html = "<p><label id='" + labelDivId + "' for='" + valueDivId + "'>" + termObj.term + ":</label>\n";
		html += "<input type='text' id='" + valueDivId + "' style=\"border:0;\" value='" + termObj.cap + "'/>";
		html += "</p>\n";
		html += "<div class='solrAdminSlider' id='" + sliderDivId + "'></div>";
		
		div$.append(html);
		
		jQuery("#" + sliderDivId).slider({min: 0, max: 100, step: .5, value: parseInt(termObj.cap),
			slide: function(event, ui) {
				jQuery("#" + valueDivId).val(ui.value);
				termObj.cap = ui.value;
			}});
	}
 
};




//this function can be called from the console to test the Solr object
// it gets the metadata for a layer
/*
function testGetMetadata()
{
	var solr = new org.OpenGeoPortal.Solr();
	var query = solr.getMetadataQuery(7944);
	solr.sendToSolr(query, testSuccess, testError);
	return "testGetMetadata done";
};
*/
//this function can be called from the console to test the Solr object
/*
function testSearchComposite()
{
	var solr = new org.OpenGeoPortal.Solr();	
	var keywordQuery = solr.getBasicKeywordQuery("Somerville"); 
	var spatialQuery = solr.getSpatialQuery(0.0, 1.0, 0.0, 1.0);
	var query = "q=" + spatialQuery; //*:*";
	institutionFilter = solr.getInstitutionFilter(["Tufts"]);
	dataTypeFilter = solr.getDataTypeFilter([solr.DataType.Polygon]);
	dateFilter = solr.getDateFilter(1950, null);
	sortClause = solr.getSortClause("ContentDate", solr.SortDecending);  
	returnedColumnsClause = solr.getReturnedColumnsClause(solr.SearchRequest);
	returnTypeClause = solr.getReturnTypeClause();
	spatialFilter = solr.getLayerIntersectsMapFilter(0.0, 1.0, 0.0, 1.0);
	extras = solr.combineFiltersAndClauses([institutionFilter, dataTypeFilter, sortClause, returnedColumnsClause, returnTypeClause, spatialFilter]);
	query = query + "&" + spatialFilter + "&wt=json" + "&" + institutionFilter + "&" + dataTypeFilter + "&" + dateFilter + "&" + sortClause;  //extras;
	//query = query + "&" + institutionFilter + "&" + dataTypeFilter + "&" + dateFilter + "&" + sortClause + "&" + spatialFilter
	//		"&wt=json" + "&" + returnedColumnsClause;
	//query = "q=*:*&wt=json&";
	solr.sendToSolr(query, testSuccess, testError);
	return "testSearchInstitutions done";
};
*/

// this function can be called from the console to test the Solr object
/*
function testDirect()
{

	var solr = new org.OpenGeoPortal.Solr();	
	var url ="http://" + solr.getServerName() + ":" + solr.getServerPort() + "/solr/select?q=*:*&wt=json&json.wrf=?";
	var ajaxParams = 
		{
			type: "GET",
			url: url, 
			dataType: 'jsonp',
			jsonp: 'json.wrf',
			success: function(data)
				{
					foo = data;
					alert("testDirect succes");
				},
			error: function(arg)
				{
					alert("testDirect fail");
				}
		};
	jQuery.ajax(ajaxParams);
	return "called";

}*/
