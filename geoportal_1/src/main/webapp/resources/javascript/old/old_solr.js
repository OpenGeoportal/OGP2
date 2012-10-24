
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

// returns the solr query to obtain a layer's metadata document from the Solr server
org.OpenGeoPortal.Solr.prototype.getMetadataQuery = function getMetadataQuery(layerId)
{
	var jsonClause = this.getReturnTypeClause();
	var returnedColumns = this.getReturnedColumnsClause(this.FgdcTextRequest);
	var extras = this.combineFiltersAndClauses([jsonClause, returnedColumns]);
	var solrQuery = "q=" + "LayerId" + ":" + layerId + extras; 
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
	solrQuery += extras;
	return solrQuery;
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
	if (primaryServer.indexOf("http://") != 0)
		primaryServer = "http://" + primaryServer;
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
	//return this.ServerPort;
};

/*org.OpenGeoPortal.Solr.prototype.getAjaxJsp = function getAjaxJsp()
{
	return "executeQuery.jsp";
};*/

org.OpenGeoPortal.Solr.prototype.DataType = {Raster: "Raster", PaperMap: "Paper+Map", Point: "Point", Line: "Line", Polygon: "Polygon"};


// set the data types to search for, vector is shorthand for point, line and polygon
/*org.OpenGeoPortal.Solr.prototype.setDataTypes = function setDataTypes(rasterFlag, vectorFlag, mapFlag)
{
	var i = 0;
	if (rasterFlag)
	{
		this.DataTypes[i] = this.DataType.Raster;
		i = i + 1;
	}
	if (vectorFlag)
	{
		this.DataTypes[i] = this.DataType.Point;
		i = i + 1;
		this.DataTypes[i] = this.DataType.Line;
		i = i + 1;
		this.DataTypes[i] = this.DataType.Polygon;
		i = i + 1;
	}
	if (mapFlag)
	{
		this.DataTypes[i] = this.DataType.PaperMap;
		i = i + 1;
	}
};*/

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

//this function must be passed an array containing instances from DataType
//e.g., getDataTypeFilter([org.OpenGeoPortal.Solr.prototype.DataType.Raster, org.OpenGeoPortal.Solr.prototype.DataType.Polygon]);
org.OpenGeoPortal.Solr.prototype.getPublisherFilter = function getPublisherFilter(dataTypes)
{
	return this.getFilter("Publisher", dataTypes);
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


// a private function used to create filters
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
	filter = "fq=" + escape(temp);
	return filter;
	
};

// return a query that searches for all the passed keywords in many fields
// note the returned string does not contain "q="
org.OpenGeoPortal.Solr.prototype.getBasicKeywordQuery = function getBasicKeywordQuery()
{
	var temp = this.getBasicKeywords();
	if ((temp == null) || (temp == "") || (temp.indexOf("Search for") > -1))
		return null;
	temp = temp.replace(/^\s+|\s+$/g,'').replace(/\s+/g,' ');
	var keywords = temp.split(" ");
	var keywordFilter = "";
	var i;
	for (i = 0 ; i < keywords.length ; i++)
	{
		var currentKeyword = keywords[i];
		if (currentKeyword.length > 0)
		{
			if (i > 0)
				keywordFilter += "+OR+";
			if (currentKeyword.indexOf(":") > 0)
			{
				// here if we have something of the form Field:Value
				// that is, user supplied the Solr field name and we don't use default field names
				keywordFilter += currentKeyword;
			}
			else
			{
				// here if user entered keywords they want searched against standard fields
				keywordFilter += "LayerDisplayName:" + currentKeyword + "^3";
				keywordFilter += "+OR+ThemeKeywords:" + currentKeyword + "^2";
				keywordFilter += "+OR+PlaceKeywords:" + currentKeyword + "^2";
				keywordFilter += "+OR+Publisher:" + currentKeyword;
				keywordFilter += "+OR+Originator:" + currentKeyword;
			}
		}
	}
	return keywordFilter;
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
			if (i > 0)
				topicFilter += "+OR+";
			topicFilter += "ThemeKeywords:" + currentTopic + "^4";
		}
	}
	return topicFilter;
};

org.OpenGeoPortal.Solr.prototype.setAdvancedKeywords = function setAdvancedKeyword(keywordString)
{
	this.AdvancedKeywordString = keywordString;
};

org.OpenGeoPortal.Solr.prototype.getAdvancedKeywords = function getAdvancedKeyword()
{
	return this.AdvancedKeywordString;
};

org.OpenGeoPortal.Solr.prototype.getAdvancedKeywordQuery = function getAdvancedKeywordQuery(keywordString)
{
	var temp = this.getAdvancedKeywords();
	if ((temp == null) || (temp == ""))
		return null;	
	temp = temp.replace(/^\s+|\s+$/g,'').replace(/\s+/g,' ');
	var keywords = temp.split(" ");
	var keywordFilter = "";
	var i;
	for (i = 0 ; i < keywords.length ; i++)
	{
		var currentKeyword = keywords[i];
		if (currentKeyword.length > 0)
		{
			if (i > 0)
				keywordFilter += "+OR+";
			if (currentKeyword.indexOf(":") > 0)
			{
				// here if we have something of the form Field:Value
				// that is, user supplied the Solr field name and we don't use default field names
				keywordFilter += currentKeyword;
			}
			else
			{
				// here if user entered keywords they want searched against standard fields
				keywordFilter += "LayerDisplayName:" + currentKeyword + "^3";
				keywordFilter += "+OR+ThemeKeywords:" + currentKeyword + "^2";
				keywordFilter += "+OR+PlaceKeywords:" + currentKeyword + "^2";
			}
		}
	}
	return keywordFilter;
};

// this function must be passed years, either the from date or the to date can be null
//  e.g., getDateFilter(1940, null);  // get layers since 1940
org.OpenGeoPortal.Solr.prototype.getDateFilter = function getDateFilter()
{
	var dateSuffix = "-01-01T01:01:01Z";  // per an ISO standard solr expects
	var fromDate = this.FromDate;
	var toDate = this.ToDate;
	
	if (((fromDate == null) || (fromDate == "")) && ((toDate == null) || (toDate =="")))
		return "";  // no date search data specified so no search filter
	
	if ((fromDate == null) || (fromDate == ""))
		fromDate = "0001";
	if ((toDate == null) || (toDate == ""))
	{
		toDate = "2100";
	}
	var searchClause = "fq=ContentDate:[" + fromDate + dateSuffix + "+TO+" + toDate + dateSuffix + "]";
	return searchClause;
};


// return a Solr filter that filters out layers that do not intersect the passed bounding box
// it uses frange with a lower and upper bound
org.OpenGeoPortal.Solr.prototype.getLayerIntersectsMapFilter = function getLayerIntersectsMapFilter() //mapMinX, mapMaxX, mapMinY, mapMaxY)
{
	var intersectionScore = this.layerIntersectsMapAux(this.MinX, this.MaxX, this.MinY, this.MaxY); 
	var intersectionFilter = "fq={!frange+l%3D1+u%3D10}" + intersectionScore;
	return intersectionFilter;
};

org.OpenGeoPortal.Solr.prototype.SortAcending = "asc";
org.OpenGeoPortal.Solr.prototype.SortDecending = "desc";

org.OpenGeoPortal.Solr.prototype.LayerWithinMapBoost = "10.0";
org.OpenGeoPortal.Solr.prototype.LayerMatchesScaleBoost = "15.0";
org.OpenGeoPortal.Solr.prototype.LayerMatchesCenterBoost = "3.0";
org.OpenGeoPortal.Solr.prototype.LayerIntersectionScaleBoost = "2.0";

org.OpenGeoPortal.Solr.prototype.BasicKeywordString = null;
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
org.OpenGeoPortal.Solr.prototype.AdvancedKeywordString = null;

// the OpenGeoPortal UI provides a pull-down with topics such as "Agriculture and Farming"
org.OpenGeoPortal.Solr.prototype.TopicString = null;



org.OpenGeoPortal.Solr.prototype.setBoundingBox = function setBoundingBox(minX, maxX, minY, maxY)
{
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

org.OpenGeoPortal.Solr.prototype.setBasicKeywords = function setBasicKeywords(keywords)
{
	this.BasicKeywordString = keywords;
};

org.OpenGeoPortal.Solr.prototype.getBasicKeywords = function getBasicKeywords()
{
	return this.BasicKeywordString;
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

org.OpenGeoPortal.Solr.prototype.getPublisherFilter = function getPublisherFilter()
{
	if ((this.Publisher == null) || (this.Publisher == ""))
		return "";
	var publishers = this.Publisher.split(" ");
	var publishersFilter = "";
	for (var i = 0 ; i < publishers.length ; i++)
	{
		var currentSource = publishers[i];
		if (currentSource.length > 0)
		{
			if (i == 0)
				publishersFilter = "fq=";
			if (i > 0)
				publishersFilter += "+OR+";
			publishersFilter += "Publisher" + ":" + currentSource;
		}
	}
	return publishersFilter;
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
	if (this.restrictedFilter == null)
		return "";
	return this.restrictedFilter;
};

org.OpenGeoPortal.Solr.prototype.getSpatialQuery = function getSpatialQuery() //mapMinX, mapMaxX, mapMinY, mapMaxY)
{
	var spatialQuery = this.layerWithinMap(this.MinX, this.MaxX, this.MinY, this.MaxY) + 
						   this.layerMatchesArea(this.MinX, this.MaxX, this.MinY, this.MaxY) + 
						   this.layerNearCenterLongitude(this.MinX, this.MaxX) + 
						   this.layerNearCenterLatitude(this.MinY, this.MaxY);
	return spatialQuery;
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
 * Finally, the product converts the 1 to LayerWithingMapBoost
 */
org.OpenGeoPortal.Solr.prototype.layerWithinMap = function layerWithinMap(mapMinX, mapMaxX, mapMinY, mapMaxY)
{
	var layerWithinMap = "";
	layerWithinMap += "product(" + this.LayerWithinMapBoost + ",map(sum(";
	layerWithinMap += "map(MinX," + mapMinX + "," + mapMaxX + ",1,0),";
	layerWithinMap += "map(MaxX," + mapMinX + "," + mapMaxX + ",1,0),";
	layerWithinMap += "map(MinY," + mapMinY + "," + mapMaxY + ",1,0),";
	layerWithinMap += "map(MaxY," + mapMinY + "," + mapMaxY + ",1,0))";
	layerWithinMap += ",4,4,1,0)))";
	layerWithinMap = "_val_:\"" + layerWithinMap + "\"";
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
	var layerMatchesArea = "_val_:\"product(" + this.LayerMatchesScaleBoost 
								+ ",recip(sum(abs(sub(Area," + mapArea + ")),.01),1,1000,1000))\"";
	return layerMatchesArea;
};

/**
 * score layer based on how close map center latitude is to the layer's center latitude
 */
org.OpenGeoPortal.Solr.prototype.layerNearCenterLatitude = function layerNearCenterLatitude(mapMinY, mapMaxY)
{
	var centerY = (mapMaxY + mapMinY)/2.;
    var layerMatchesCenter = "_val_:\"product(" + this.LayerMatchesCenterBoost 
    							+ ",recip(abs(sub(product(sum(MaxY,MinY),.5)," + centerY + ")),1,1000,1000))\"";
    return layerMatchesCenter;	
};


/**
 * score layer based on how close map center longitude is to the layer's center longitude
 */
org.OpenGeoPortal.Solr.prototype.layerNearCenterLongitude = function layerNearCenterLongitude(mapMinX, mapMaxX)
{
	var centerX = (mapMaxX + mapMinX)/2.;
    var layerMatchesCenter = "_val_:\"product(" + this.LayerMatchesCenterBoost
    							+ ",recip(abs(sub(product(sum(MaxX,MinX),.5)," + centerX + ")),1,1000,1000))\"";
    return layerMatchesCenter;	
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
	var intersectionScore = "product(" + this.LayerIntersectionScaleBoost + "," + separatingAxisExistsFlag + ")";
	return intersectionScore;
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

// this function returns a Solr fl clause specifying the columns to return for the passed request
// since the full FGDC text can be very long, we don't want to return it for search requests
org.OpenGeoPortal.Solr.prototype.getReturnedColumnsClause = function getReturnedColumnsClause(requestType)
{
	var returnedColumns = "";
	if (requestType == org.OpenGeoPortal.Solr.prototype.FgdcTextRequest)
		returnedColumns = "fl=LayerId,FgdcText";
	else if (requestType == org.OpenGeoPortal.Solr.prototype.SearchRequest)
		returnedColumns = "fl=Name,CollectionId,Institution,Access,DataType,Availability,LayerDisplayName,Publisher,GeoReferenced" +
						  ",Originator,Location,MinX,MaxX,MinY,MaxY,ContentDate,LayerId,score,WorkspaceName,SrsProjectionCode";
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


// return a single solr query that combines all the passes elements in the passed queries array
/*org.OpenGeoPortal.Solr.prototype.combineQueries = function combineQueries(queries)
{
	var combined = "q=";
	var i;
	for (i = 0 ; i < queries.length ; i++)
	{
		var query = queries[i];
		if ((i != 0) && (query.length > 0))
			combined = combined + "+AND+";
		if (query.length > 0)
			combined = combined + query; 
	}
	return combined;
};*/

org.OpenGeoPortal.Solr.prototype.getSearchQuery = function getSearchQuery()
{
	var keywordQuery = null;
	var topicQuery = null;
	var spatialFilter = "";
	var spatialQuery = null;
	queryClause = "";
	
	// at most, only one of basicKeywords or advancedKeywords should be set 
	var basicKeywords = this.getBasicKeywords();
	var advancedKeywords = this.getAdvancedKeywords();
	if (basicKeywords != null)
		keywordQuery = this.getBasicKeywordQuery();
	else if (advancedKeywords != null)
		keywordQuery = this.getAdvancedKeywordQuery();

	var topic = this.getTopic();
	if (topic != null)
	{
		topicQuery = this.getTopicQuery();
	}
	
	
	if (this.MinX != null)
	{
		// here if we need spatial filter and scoring
		spatialQuery = this.getSpatialQuery();	
		spatialFilter = this.getLayerIntersectsMapFilter();
	}
	
	/*
	if ((keywordQuery == null) && (spatialQuery == null))
		queryClause = "*:*";
	else if ((keywordQuery == null) && (spatialQuery != null))
		queryClause = spatialQuery;
	else if ((keywordQuery != null) && (spatialQuery == null))
		queryClause = keywordQuery;
	else if ((keywordQuery != null) && (spatialQuery != null))
		queryClause = spatialQuery + "+AND+" + "%28" + keywordQuery + "%29";
	
	if (topicQuery)
		queryClause = queryClause += "+AND+" + "%28" + topicQuery + "%29";
	*/
	
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
	var restrictedFilter = this.getRestrictedFilter(); 
	var shardClause = this.getShardServerNames();  // "shards=geoportal-dev.atech.tufts.edu/solr,gis.lib.berkeley.edu:8080/solr/";
	var extras = this.combineFiltersAndClauses([spatialFilter, returnType, returnedColumns, rowCount, startRow, shardClause,
	                                            sortClause, dateFilter, dataTypeFilter, institutionFilter, accessFilter, publisher, restrictedFilter]);

	var query = "q=" + queryClause + "&" + extras; //spatialFilter + "&" + returnType + "&" + returnedColumns;
	foo = query;
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
	
	// if keyword query isn't the only query surround it with ( )
	if ((nullCount < 2) && keywordQuery)
		keywordQuery = "%28" + keywordQuery + "%29";
	// if topic query isn't the only query surround it with ( )
	if ((nullCount < 2) && topicQuery)
		topicQuery = "%28" + topicQuery + "%29";
	
	// combine queries
	var returnValue = this.concatWith(spatialQuery, keywordQuery, "+AND+");
	//var returnValue = this.concatWith(returnValue, topicQuery, "+AND+");
	returnValue = this.concatWith(returnValue, topicQuery, "+AND+");

	combinedQuery = returnValue;
	return returnValue;
	
};


// this function returns a new string that is some combination of the passed strings
// if the originalString is not empty, it returns originalString + separator + concatElement
// if this originalString is empty, it returns concatElement
// if concatElement is empty, originalString is returned
org.OpenGeoPortal.Solr.prototype.concatWith = function concatWith(originalString, concatElement, separator)
{
	if (((originalString == null) || (originalString == "")) && ((concatElement == null) || (concatElement == "")))
		return "";
	var returnValue = "";
	if ((originalString == null) || (originalString == ""))
		returnValue = concatElement;
	else if ((concatElement == null) || (concatElement == ""))
		returnValue = originalString;
	else
		returnValue = originalString + separator + concatElement;
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


function testSuccess(data)
{
	foo = data;
	alert("in testSuccess with " + data);
};

function testError(message)
{
	bar = message; 
	alert("in testError with " + message);
};


//this function can be called from the console to test the Solr object
// it gets the metadata for a layer
function testGetMetadata()
{
	var solr = new org.OpenGeoPortal.Solr();
	var query = solr.getMetadataQuery(7944);
	solr.sendToSolr(query, testSuccess, testError);
	return "testGetMetadata done";
};

//this function can be called from the console to test the Solr object
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


// this function can be called from the console to test the Solr object
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

}
