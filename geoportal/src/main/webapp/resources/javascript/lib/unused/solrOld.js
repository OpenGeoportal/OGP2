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
	var shardClause = this.getShardServerNames(); // "shards=geoportal-dev.atech.tufts.edu/solr,gis.lib.berkeley.edu:8080/solr/";
	var extras = this
			.combineFiltersAndClauses([ spatialFilter, returnType,
					returnedColumns, rowCount, startRow, shardClause,
					sortClause, keywordFilter, dateFilter, dataTypeFilter,
					institutionFilter, accessFilter, publisher, originator,
					restrictedFilter, topicFilter ]);

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

/**
 * execute the right search query for all the parameters set in this solr object
 * note this isn't used to obtain metadata, it is used to perform a "normal"
 * search it is call for both basic and advanced searches
 */
this.executeSearchQuery = function executeSearchQuery(success, error) {
	var query = this.getSearchQuery();
	this.sendToSolr(this.getServerName() + "?" + query, success, error);
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
 * // this function returns a new string that is some combination of the passed //
 * strings // if the originalString is not empty, it returns originalString +
 * separator // + concatElement // if this originalString is empty, it returns
 * concatElement // if concatElement is empty, originalString is returned
 * this.concatWith = function concatWith(originalString, concatElement,
 * separator) { if (((originalString == null) || (originalString == "")) &&
 * ((concatElement == null) || (concatElement == ""))) { return ""; } var
 * returnValue = "";
 * 
 * if ((originalString == null) || (originalString == "")) { returnValue =
 * concatElement; } else if ((concatElement == null) || (concatElement == "")) {
 * returnValue = originalString; } else { returnValue = originalString +
 * separator + concatElement; } return returnValue; };
 * 
 * this.getAndFilter = function(term, values) { if ((values == null) || (values ==
 * "")) { return ""; }
 * 
 * var arrValues = this.tokenize(values); ; var filter = ""; for ( var i = 0; i <
 * arrValues.length; i++) {
 * 
 * var currentSource = this.escapeSolrValue(arrValues[i]); if
 * (currentSource.length > 0) { if (i == 0) { filter = "fq="; } if (i > 0) {
 * filter += "+AND+"; } filter += term + ":" + currentSource; } } filter +=
 * "&pf=" + term + ":" + arrValues.join(" "); return filter; };
 * 
 * this.getPublisherFilter = function getPublisherFilter() { return
 * this.getAndFilter("Publisher", this.Publisher); };
 * 
 * this.getOriginatorFilter = function getOriginatorFilter() { return
 * this.getAndFilter("Originator", this.Originator); }; // return a URL
 * parameter formatted string containing all the Solr filters // and // clauses
 * in the passed elements array // this function iterates over all of the
 * elements and builds a string with // & before each // note the returned
 * string begins with a & character. this.combineFiltersAndClauses = function
 * combineFiltersAndClauses(elements) { var combined = ""; var i; for (i = 0; i <
 * elements.length; i++) { var element = elements[i]; if ((element != null) &&
 * (element != "")) combined = combined + "&" + element; } return combined; };
 */
/*
 * should search results include restricted data from remote institutions if so,
 * call this function
 */
this.setAllRestricted = function setAllRestricted() {
	this.restrictedFilter = "";
};

/*
 * should search results include restricted data only from the local institution
 * if so, call this function with the name of the local institution as it
 * appears in the Access field
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
		keywordQuery = this.getKeywordQueryTemplate(processedKeyword, terms);
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
	keywordQuery += " v='" + keyword + "'})," + capSuffix + termObject.boost
			+ ")";
	return keywordQuery;
};

// for the advanced query, the keyword search only looks at keywords and the
// LayerDisplayName
this.getKeywordQueryTemplate = function getKeywordQueryTemplate(keyword, terms) {
	var keywordQuery = "sum(";
	var queryArr = [];
	for (var i = 0; i < terms.length; i++) {
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

	return this
			.getKeywordQuery(this.getBasicKeywords(), this.BasicKeywordTerms);
};

this.getAdvancedKeywordQuery = function getAdvancedKeywordQuery(keywordString) {
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
		for (var j = 0; j < arrTerms.length; j++) {
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

/*
 * Solr admin in the browser for testing
 */
this.showAdminControls = function() {
	var adminDivId = "solrAdminDiv";

	if (typeof jQuery("#" + adminDivId)[0] == 'undefined') {

		var arrTerms = [ this.LayerWithinMap, this.LayerMatchesScale,
				this.LayerMatchesCenter, this.LayerIntersectionScale,
				this.LayerDisplayNameTerm, this.ThemeKeywordsTerm,
				this.PlaceKeywordsTerm, this.PublisherTerm, this.OriginatorTerm ];
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

	for (var i = 0; i < arrTerms.length; i++) {
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
		html += "<div class='solrAdminSlider' id='" + sliderDivId + "'></div>";
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
		html += "<div class='solrAdminSlider' id='" + sliderDivId + "'></div>";

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

this.AccessDisplay = null;

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
			topicFilter += "product(query({!dismax qf="
					+ this.IsoTopicTerm.term + " v='" + currentTopic + "'}),"
					+ this.IsoTopicTerm.boost + ")";

		}
	}
	return topicFilter;
};

// the OpenGeoPortal UI provides a pull-down with topics such as
// "Agriculture and Farming"
this.TopicString = null;

this.setTopic = function setTopic(topic) {
	this.TopicString = topic;
};

this.getTopic = function getTopic() {
	return this.TopicString;
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

this.Publisher = null;
this.Originator = null;

this.FromDate = null;
this.ToDate = null;

this.DataTypes = [];
this.Institutions = [];

/*
 * Main query components
 */

/*
 * Helper functions
 * 
 */
// examine a field for quotes and parse them correctly
this.tokenize = function tokenize(searchTerms) {
	// we're using the pf param instead for phrase matching
	/*
	 * console.log(searchTerms); var arrMatch = searchTerms.match(/["]/g); if
	 * (arrMatch != null){ if (arrMatch.length > 1){ var searchString =
	 * searchTerms.match(/\w+|"(?:\\"|[^"])+"/g); console.log(searchString);
	 * return searchString; } } else { arrMatch = searchTerms.match(/[']/g); if
	 * (arrMatch != null){ if (arrMatch.length > 1){ var searchString =
	 * searchTerms.match(/\w+|'(?:\\'|[^'])+'/g); console.log(searchString);
	 * return searchString; } } }
	 */
	searchTerms = searchTerms.replace(/^\s+|\s+$/g, '').replace(/\s+/g, ' ');

	return searchTerms.split(" ");

};

this.escapeSolrValue = function escapeSolrValue(solrValue) {
	solrValue = this.filterCharacters(solrValue);
	solrValue = solrValue.replace(/{/g, "\\{").replace(/}/g, "\\}").replace(
			/\[/g, "\\[").replace(/]/g, "\\]").replace(/!/g, "\\!").replace(
			/[+]/g, "\\+").replace(/&/g, "\\&").replace(/~/g, "\\~").replace(
			/[(]/g, "\\(").replace(/[)]/g, "\\)").replace(/-/g, "\\-").replace(
			/\^/g, "\\^");

	return solrValue;
};

// filter out characters that cause problems for solr
this.filterCharacters = function filterCharacters(solrValue) {
	solrValue = solrValue.replace(/[&\/\\#,+()$~%.'":*?<>{}]/g, '');
	return solrValue;
};