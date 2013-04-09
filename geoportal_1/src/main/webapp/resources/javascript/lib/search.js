/**
 * This javascript module includes functions for dealing with search 
 * All the logic for search should be here.  this module should be capable of
 * converting data to a format usable elsewhere in the app and adapting form
 * elements to search params defined in the Solr object
 * 
 * @author Chris Barnett
 * 
 */

if (typeof OpenGeoportal == 'undefined'){
	OpenGeoportal = {};
} else if (typeof OpenGeoportal != "object"){
	throw new Error("OpenGeoportal already exists and is not an object");
}

/**
 * Search
 */
OpenGeoportal.Search = function Search(thisObj){
	
	//probably don't need this anymore
	this.getEmptyData = function(){
		var initData = {"response": {"docs": [{"LayerId": ["0"], "Name":["null"], "Location":[""], "LayerDisplayName":[""], "DataType":[""], 
			"Publisher":[""], "MinY":[1], "MaxY":[1], "MinX":[1], "MaxX":[1], "Access":[""], "Institution":[""], "Availability":[""]}]}};
		return initData;
	};
	
	this.state = thisObj.appState;

	//processData needs to be aware of the table headings object for the results table;  at least the columns
	//processData needs to be aware of previewed layers
	//converts solr response object to dataTables array
	this.processData = function(dataObj){
		// dataObj is a Javascript object (usually) returned by Solr
		var solrResponse = dataObj["response"];
		var totalResults = solrResponse["numFound"];
		var startIndex = solrResponse["start"];

		// solr docs holds an array of hashtables, each hashtable contains a layer
		var solrLayers = solrResponse["docs"];
		var arrData = [];

		// loop over all the returned layers
		var tableHeadings = thisObj.tableHeadingsObj.getTableConfig();
		//var previewedRows = thisObj.layerState.previewedLayers.getLayers();
		var layerIdIndex = thisObj.tableHeadingsObj.getColumnIndex("LayerId");
		
		rowloop:
			for (var j in solrLayers){
				j = parseInt(j);
				//console.log("in solr layers");
				//console.log(j);
				var arrRow = [];
				for (var k in tableHeadings){
					//console.log("in tableHeadings");
					//console.log(k);
					//skip over layers that are currently previewed, so that they don't appear multiple times
					/*if (k == "LayerId"){
						for (var rowIndex in previewedRows){
							if (solrLayers[j][k] == previewedRows[rowIndex][layerIdIndex]){
								continue rowloop;
							}
						}
					}*/
					//these must be ordered according to aTargets
					//columns w/ ajax == true should be populated with the returned solr data
					var currentHeading = tableHeadings[k];
					var headingIndex = currentHeading.columnConfig.aTargets[0];

					if (currentHeading.ajax) {
						//if the tableheading can't be found in the solr object put in an empty string as a placeholder
						if (typeof solrLayers[j][k] == 'undefined'){
							arrRow[headingIndex] = "";
						} else {
							if (solrLayers[j][k].constructor !== Array){
								arrRow[headingIndex] = solrLayers[j][k];
							} else {
								arrRow[headingIndex] = solrLayers[j][k].join();//in case the value is an array
							}
						}
					} else {
						//columns w/ ajax == false are placeholders and are populated by javascript
						arrRow[headingIndex] = "";
					}
				}
				arrData.push(arrRow); 
			}
		//console.log(arrData[0]);
		return arrData;
	};

	
	/*
	 * In the new search paradigm, we need to have dataTable's sSource point to a function that gets 
	 * a url to solr with appropriate params.  some params will be passed directly from the table so 
	 * that it can handle paging;  possibly sorting as well
	 * 
	 */
	/*
	 * 	var getSearchUrl = function(startIndex){
			var solr = new OpenGeoportal.Solr();
			solr.setBoundingBox(-180.0, 180.0, -90.0, 90.0);
			return solr;
		};
	 */
	/****************
	 * Solr search 
	 ****************/
	
	//perhaps this should be in the tableOrganize object
	this.getSortInfo = function(){
		//TODO: fix this
		var sortObj = thisObj.tableSettings.tableSorter.getState();
		var sortColumn = sortObj.organizeBy;
		if ((sortColumn == null) || (sortColumn == "score"))
			sortColumn = "score";
		else if ((sortColumn == "ContentDate") || (sortColumn == "Access"))
			sortColumn == sortColumn;  // nothing to do, sortColumn doesn't need adjustment
		else
			sortColumn = sortColumn + "Sort";  // use solr sort column that hasn't been tokenized
		
		var sort = {
			column: sortColumn,
			direction: sortObj.organizeDirection
		};
		
		return sort;
	};
	
	/*
	 * adds spatial search params to solr object if pertinent
	 */
	this.setSpatial = function(solr){
		if (this.state.getState("spatialSearch")){

			/*if (!OpenGeoportal.ogp.map.userMapAction){
				//if search gets called before the map is fully loaded, you get strange results
				solr.setBoundingBox(-180.0, 180.0, -90.0, 90.0);
			} else {*/
				//make sure we're getting the right values for the extent
				OpenGeoportal.ogp.map.updateSize();
				var extent = OpenGeoportal.ogp.map.returnExtent();
				var minX = extent.left;
				var maxX = extent.right;
				var minY = extent.bottom;
				var maxY = extent.top;
				var mapDeltaX = Math.abs(maxX - minX);
				var mapDeltaY = Math.abs(maxY - minY);
				if (mapDeltaX > 350){
					minX = -180.0;
					maxX = 180.0;
				}
				if (mapDeltaY > 165){
					minY = -90;
					maxY = 90;
				}

				solr.setBoundingBox(minX, maxX, minY, maxY);
			//}
		}
		return solr
	};
	
	this.whichSearch = function(){
		if (jQuery(".basicSearch").css("display") == "none"){
			return "advancedSearch";
		} else {
			return "basicSearch";
		}
	};
	/**
	 * this function returns a solr URL with the many standard options set
	 * it provides a base solr object for both basic and advanced searching
	 * @return Solr URL
	 */
	this.getSearchRequest = function(){
		var solr = new OpenGeoportal.Solr();
		
		var sort = this.getSortInfo();
		solr.setSort(sort.column, sort.direction);
		
		this.setSpatial(solr);

		var searchType = this.whichSearch();
		
		if (searchType == 'basicSearch'){
			this.addSearchRequestBasic(solr);
		} else if (searchType =='advancedSearch'){
			this.addSearchRequestAdvanced(solr);
		}

		this.setLastSolrSearch(solr);
		
		console.log(solr.getURL());
		return solr.getURL();
	};
	
	
	//*******Search Results only
	/**
	 * add elements specific to basic search
	 */
	this.addSearchRequestBasic = function(solr){
		var whereField = "";
		var whatField = jQuery('#basicSearchTextField').val().trim();
		
		if ((whatField != null) && (whatField != "")){
			solr.setBasicKeywords(whatField);
		}
		
		solr.setLocalRestricted(OpenGeoportal.InstitutionInfo.getHomeInstitution());
		
		var institutionConfig = OpenGeoportal.InstitutionInfo.getInstitutionInfo();
		
		for (var institution in institutionConfig){
			solr.addInstitution(institution);
		}
	};
	//*******Search Results only
	
	this.addAdvancedDataTypes = function(solr){
		var i = jQuery(".dataTypeCheck").length;
		var j = 0;
		jQuery(".dataTypeCheck").each(function(){
			if(jQuery(this).is(":checked")){
				solr.addDataType(jQuery(this).val());
				j++;
			}
		});
		if (j==0 || j == i){
			solr.addDataType("Unknown");
		}
		
	};
	
	this.addAdvancedRepositories = function (solr){
		jQuery(".sourceCheck").each(function(){
			if(jQuery(this).is(":checked")){
				solr.addInstitution(jQuery(this).val());
			}
		});
	};
	
	this.addAdvancedRestricted = function(solr){
		var allRestricted = jQuery("#restrictedCheck").is(":checked");
		if (allRestricted){
			solr.setAllRestricted();
		} else {
			solr.setLocalRestricted(OpenGeoportal.InstitutionInfo.getHomeInstitution());
		}
	};
	
	this.addIsoTopics = function(solr){
		var topicsElement = jQuery("input[type=radio][name=topicRadio]");
		var selectedTopic = topicsElement.filter(":checked").val();
		// first topic says "Select a topic" 
		var titleTopic = topicsElement.first().val();
		if (selectedTopic != titleTopic){
			// here if the user has actually selected a topic from the list
			// clean-up UI string and use it for search
			selectedTopic = selectedTopic.replace(/,/g, " ");
			selectedTopic = selectedTopic.replace(/ and /g, " ");
			solr.setTopic(selectedTopic);
		}
	};
	
	/**
	 * add elements specific to advanced
	 */
	this.addSearchRequestAdvanced = function(solr){
		
		var keywords = jQuery('#advancedKeywordText').val().trim();
		if ((keywords != null) && (keywords != "")){
			solr.setAdvancedKeywords(keywords);
		}
		var fromDate = jQuery('#advancedDateFromText').val().trim();
		var toDate = jQuery('#advancedDateToText').val().trim();
		solr.setDates(fromDate, toDate);

		this.addAdvancedDataTypes(solr);
		
		this.addAdvancedRepositories(solr);

		this.addAdvancedRestricted(solr);

		var originator = jQuery('#advancedOriginatorText').val().trim();
		solr.setOriginator(originator);

		this.addIsoTopics(solr);

	};
	
	/**********
	 * Callbacks
	 *********/
	
	//*******Search Results only
	this.searchRequestJsonpSuccess = function(data){
		//OpenGeoportal.ui.showSearchResults();
		that.populate(that.processData(data));	
		that.tableEffect("searchEnd");
		that.setResultNumber(data.response.numFound);
	};
	//*******Search Results only
	this.searchRequestJsonpError = function(){
		that.tableEffect("searchEnd");
		//throw new Error("The search for relevant layers failed");
	};
	//*******Search Results only

	//this.currentSolrObjects = [];


	// keeping track of the last solr search is useful in multiple cases
	// if a search that filter based on the map returned no results we want to 
	//   re-run the search without the map filter and let user know fi there are results
	// after use login we re-run the query to update "login" buttons on layers
	this.lastSolrSearch = null;

	this.setLastSolrSearch = function(solr){
		this.lastSolrSearch = solr;
	};

	this.getLastSolrSearch = function(){
		return this.lastSolrSearch;
	};

	this.rerunLastSearch = function(){
		var solr = this.getLastSolrSearch();
		if (solr != null)
			solr.executeSearchQuery(this.searchRequestJsonpSuccess, this.searchRequestJsonpError);
	};

	/**
	 * called when the last search returned no results
	 *  we rerun the last search without a spatial constraint
	 *  if this search returns hits, we let the user know there is data outside the map
	 * note that this function changes the value returned by "getLastSolrSearch()"
	 * @return
	 */
	this.addSpatialToEmptySearchMessage = function(){
		var solr = this.getLastSolrSearch();
		if (solr != null){
			solr.clearBoundingBox();
			solr.executeSearchQuery(this.emptySearchMessageHandler, this.searchRequestJsonpError);
		}
	};


	

};