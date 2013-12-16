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

if (typeof OpenGeoportal.Views == 'undefined'){
	OpenGeoportal.Views = {};
} else if (typeof OpenGeoportal.Views != "object"){
    throw new Error("OpenGeoportal.Views already exists and is not an object");
}




/**
 * Search
 */
//this should be a view of the query terms model
OpenGeoportal.Views.Query = Backbone.View.extend({	
/*	
 * model passed into this query
	mapExtent: {minX: -180, maxX: 180, minY: -90, maxY: 90},
	ignoreSpatial: false,
	displayRestricted: [],
	sortBy: "score",
	sortDir: "asc",
	what: "",
	where: "",
	keyword: "",
	originator: "",
	dataType: "",
	repository: "",
	yearRange: {from: null, to: null},
	isoTopic: "",
	facets: "",
	searchType: "basic"
*/
	whereText: "(Example: Boston, MA)",
	whatText: "(Example: buildings)",
	initialize: function(){
		jQuery("#whereField").attr("placeholder", this.whereText);
		jQuery("#whatField").attr("placeholder", this.whatText);

		this.controls = OpenGeoportal.ogp.appState.get("controls");
		var that = this;
		this.controls.prependButton(jQuery(".basicSearchButtons"), "basicSearchSubmit", "Search", function(){that.fireSearchWithZoom();}).addClass("searchButton");		
		
		this.controls.solrAutocomplete(jQuery("#advancedOriginatorField"), "OriginatorSort");
		this.createInstitutionsMenu();
		this.createDataTypesMenu();
		this.createTopicsMenu();
		
		this.mapInputsToModel();
		
		var advSearchButtons$ = jQuery(".advancedSearchButtons").first();
		this.controls.prependButton(advSearchButtons$, "advancedSearchSubmit", "Search", function(){that.fireSearchWithZoom();}).addClass("searchButton");		
		this.controls.prependButton(advSearchButtons$, "advancedSearchClear", "Clear", this.clearForm);	

		this.listenTo(this.model, "change:mapExtent", this.extentChanged);
		

		this.mapFilterHandler();
		this.searchTypeHandler();
		this.showRestrictedHandler();
		this.searchBoxKeypressHandler();
		
		jQuery(document).on("map.extentChanged", function(){that.setMapExtent.apply(that, arguments);});
	},
	  events: {
		  "blur input": "setTextValue"
		 },
	
	/****************
	 * Interface between ui and solr query 
	 ****************/
			
		getTextInputValue: function(fieldId){
			var rawText = jQuery("#" + fieldId).val().trim();
		},
		mapInputsToModel: function(){
			jQuery("#whatField").data({queryAttr: "what"});
			jQuery("#whereField").data({queryAttr: "where"});
			jQuery("#advancedKeywordText").data({queryAttr: "keyword"});
			jQuery("#advancedOriginatorText").data({queryAttr: "originator"});
			jQuery("#advancedDateFromText").data({queryAttr: "dateFrom"});
			jQuery("#advancedDateToText").data({queryAttr: "dateTo"});
		},
		setTextValue: function(event){
			var target$ = jQuery(event.currentTarget);
			var attr = target$.data().queryAttr;
			var val = target$.val().trim();
			this.model.set(attr, val);

			//map field to model attribute
		},
		
		zoomToWhere: function(){
			var bbox = jQuery("#whereField").data().geocode.bbox;
			if (typeof bbox !== "undefined"){
				jQuery(document).trigger("map.zoomToLayerExtent", {bbox: bbox});		
			}

		},

		clearWhere: function(){
			jQuery("#whereField").val("").data().geocode = {};
			
		},
		fireSearchWithZoom: function(){
			if (this.model.get("searchType") === "advanced"){
				var ignoreSpatial = this.model.get("ignoreSpatial");
				if (!ignoreSpatial){
					this.zoomToWhere();
				}
			} else {
				this.zoomToWhere();
			}
			this.fireSearch();
		},
		
		extentChanged: function(){
			console.log("*******************************************************extent changed");
			this.fireSearch();	
			//on the next extent change, clear the where field
			//this.listenToOnce(this.model, "change:mapExtent", this.clearWhere);

		},
		
		fireSearch: function(){
			jQuery(document).trigger("fireSearch");
		},

		/**
		 * this function returns a solr URL with the many standard options set
		 * it provides a base solr object for both basic and advanced searching
		 * @return Solr URL
		 */
		getSearchRequest: function(){

			var solr = null;
			
			var searchType = this.model.get("searchType");
			
			if (searchType == 'basic'){
				solr = this.getBasicSearchQuery();
			} else if (searchType =='advanced'){
				solr = this.getAdvancedSearchQuery();
			} else {
				//fall through
				solr = this.getBasicSearchQuery();
			}

			this.addToHistory(solr);
			console.log(solr.getURL());
			return solr.getURL();
		},
		
		//perhaps this should be in the tableOrganize object
		getSortInfo: function(){
			//TODO: fix this
			var sortObj = OpenGeoportal.ogp.resultsTableObj.tableOrganize;
			
			
			//should this logic be in the solr object?
			var sortColumn = sortObj.get("column");
			if ((sortColumn == null) || (sortColumn == "score"))
				sortColumn = "score";
			else if ((sortColumn == "ContentDate") || (sortColumn == "Access"))
				sortColumn == sortColumn;  // nothing to do, sortColumn doesn't need adjustment
			else
				sortColumn = sortColumn + "Sort";  // use solr sort column that hasn't been tokenized
			
			var sort = {
				column: sortColumn,
				direction: sortObj.get("direction")
			};
			
			return sort;
		},
		
		/*
		 * adds spatial search params to solr object if pertinent
		 */
		setMapExtent: function(event, data){
					//make sure we're getting the right values for the extent
					var extent = data.mapExtent;
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
					var mapExtent = {minX: minX, maxX: maxX, minY: minY, maxY: maxY};
					this.model.set({mapExtent: mapExtent});
			
		},
		
		
		/**
		 * add elements specific to basic search
		 */
		getBasicSearchQuery: function(){
			var solr = new OpenGeoportal.Solr();
			
			var sort = this.getSortInfo();
			solr.setSort(sort.column, sort.direction);

			solr.setBoundingBox(this.model.get("mapExtent"));

			
			if ((whatField != null) && (whatField != "")){
				solr.setWhat(this.model.get("what"));
			}
			
			if ((whereField != null) && (whereField != "")){
				solr.setWhere(whereField);
			}
			
			solr.addFilter(solr.createAccessFilter(this.model.get("displayRestricted")));

			/*
			var institutionConfig = OpenGeoportal.InstitutionInfo.getInstitutionInfo();
			
			for (var institution in institutionConfig){
				solr.addInstitution(institution);
			}
			*/
			return solr;
		},
		
		getAdvancedSearchQuery: function(){
			var solr = new OpenGeoportal.Solr();
			
			var sort = this.getSortInfo();
			solr.setSort(sort.column, sort.direction);
			
			//check if "ignore map extent" is checked
			var ignoreSpatial = this.model.get("ignoreSpatial");
			solr.setIgnoreSpatial(ignoreSpatial);
			if (!ignoreSpatial){
				solr.setBoundingBox(this.model.get("mapExtent"));
			}

			
			var keywords = this.getTextInputValue('advancedKeywordText');
			if ((keywords != null) && (keywords != "")){
				solr.setAdvancedKeywords(keywords);
			}
			
			var dateFrom = this.model.get("dateFrom");
			var dateTo = this.model.get("dateTo");
			solr.addFilter(solr.createDateRangeFilter("ContentDate", dateFrom, dateTo));
			
			var dataTypes = this.model.get("dataType");//columnName, values, joiner, prefix
			solr.addFilter(solr.createFilter("DataType", dataTypes, "{!tag=dt}"));

			var repositories = this.model.get("repository");
			solr.addFilter(solr.createFilter("Institution", repositories, "{!tag=insf}"));

			solr.addFilter(solr.createAccessFilter(this.model.get("displayRestricted")));

			var originator = this.model.get("originator");
			//TODO: should this be a filter?
			solr.addFilter(solr.createFilter("Originator", originator, null, "AND"));

			var isoTopic = this.model.get("isoTopic");
			solr.addFilter(solr.createFilter("ThemeKeywordsSynonymsIso", isoTopic));

			
			return solr;
		},
		
		searchTypeHandler: function(){
			var that = this;
			jQuery(document).on("search.setBasic", function(){
				that.model.set({searchType: "basic"});
			});
			jQuery(document).on("search.setAdvanced", function(){
				that.model.set({searchType: "advanced"});
			});
		},
		mapFilterHandler: function(){
			var that = this;
			jQuery("#mapFilterCheck").on(
					"change", function(event) {
						that.model.set({ignoreSpatial: this.checked});
						//var value = this.checked ? "Checked" : "Unchecked";
						//analytics.track("Limit Results to Visible Map", value);
					}
			);	
		},
		showRestrictedHandler: function(){
			var that = this;
			jQuery("#restrictedCheck").on(
					"change", function(event) {
						var arrRestricted = [];
						if (!this.checked){
							arrRestricted = that.model.defaults.displayRestricted;
						}
						that.model.set({displayRestricted: arrRestricted});
					}
			);	
		},
		searchBoxKeypressHandler: function(){
			var that = this;
			jQuery('.searchBox').keypress(function(event){
				var type, search, keyword;

				if (event.keyCode == '13') {
					event.preventDefault();
					jQuery(event.target).blur();
					that.fireSearchWithZoom();
					jQuery(event.target).focus();

				} 
			});
		},



		/**
		 * uses styledSelect to create the menu in advanced search that allows a user to select which institutions to search; dynamically created
		 * from info in OpenGeoportal.Config
		 */
		createInstitutionsMenu: function() {
			var iconRenderer = this.controls.renderRepositoryIcon;
			var repositoryCollection = OpenGeoportal.Config.Repositories;
			var that = this;
			var callback = function(){
				var repositoryMenu = new OpenGeoportal.Views.CollectionMultiSelectWithCheckbox({
					collection: repositoryCollection,
					el: "div#repositoryDropdown",
					valueAttribute: "id",
					displayAttribute: "shortName",
					buttonLabel: "Select repositories",
					itemClass: "repositoryMenuItem",
					iconRenderer: iconRenderer,
					controlClass: "repositoryCheck"
				});
				that.repositories = repositoryMenu;
				that.model.set({repository: that.repositories.getValueAsArray()});
				that.repositories.$el.on("change", function(){that.model.set({repository: that.repositories.getValueAsArray()});});
			};
			if (repositoryCollection.length === 0){
				//create the view once the Repository collection is 'fetched'
				repositoryCollection.once("sync", callback); 
			} else {
				callback();
			}
			
		},

		/**
		 * uses styledSelect to create the menu in advanced search that allows a user to select which data types to search; dynamically created
		 * from info in OpenGeoportal.InstitutionInfo
		 */
		createDataTypesMenu: function() {
			var iconRenderer = this.controls.renderTypeIcon;
			var dataTypesMenu = new OpenGeoportal.Views.CollectionMultiSelectWithCheckbox({
				collection: OpenGeoportal.Config.DataTypes,
				el: "div#dataTypeDropdown",
				valueAttribute: "value",
				displayAttribute: "displayName",
				buttonLabel: "Select data types",
				itemClass: "dataTypeMenuItem",
				iconRenderer: iconRenderer,
				controlClass: "dataTypeCheck"
				});
			this.dataTypes = dataTypesMenu;
			this.model.set({dataType: this.dataTypes.getValueAsArray()});
			var that = this;
			this.dataTypes.$el.on("change", function(){that.model.set({dataType: that.dataTypes.getValueAsArray()});});

		},

		/**
		 * uses styledSelect to create the menu in advanced search that allows a user to select an ISO topic to search
		 */
	  createTopicsMenu: function() {
			var topicCategories = [{topic:"", label:"None", selected: true},
			                       {topic:"farming", label:"Agriculture and Farming"},
			                       {topic:"biota", label:"Biology and Ecology"},
			                       {topic:"boundaries", label:"Administrative and Political Boundaries"},
			                       {topic:"climatologyMeteorologyAtmosphere", label:"Atmospheric and Climatic"},
			                       {topic:"economy", label:"Business and Economic"},
			                       {topic:"elevation", label:"Elevation and Derived Products"},
			                       {topic:"environment", label:"Environment and Conservation"},
			                       {topic:"geoscientificinformation", label:"Geological and Geophysical"},
			                       {topic:"health", label:"Human Health and Disease"},
			                       {topic:"imageryBaseMapsEarthCover", label:"Imagery and Base Maps"},
			                       {topic:"intelligenceMilitary", label:"Military"},
			                       {topic:"inlandWaters", label:"Inland Water Resources"},
			                       {topic:"location", label:"Locations and Geodetic Networks"},
			                       {topic:"oceans", label:"Oceans and Estuaries"},
			                       {topic:"planningCadastre", label:"Cadastral"},
			                       {topic:"society", label:"Cultural, Society, and Demographics"},
			                       {topic:"structure", label:"Facilities and Structure"},
			                       {topic:"transportation", label:"Transportation Networks"},
			                       {topic:"utilitiesCommunication", label:"Utilities and Communication"}
			                       ];

			//Do I even need to extend this?
			var topicCollection = Backbone.Collection.extend({});
			var collection = new topicCollection(topicCategories);
			
			var topicView = new OpenGeoportal.Views.CollectionSelect({
											collection: collection, 
											el: "div#topicDropdown",
											valueAttribute: "topic",
											displayAttribute: "label",
											buttonLabel: "Select a topic",
											itemClass: "isoTopicMenuItem"
											});
			this.topics = topicView;
			this.model.set({isoTopic: this.topics.getValue()});
			var that = this;
			this.topics.$el.on("change", function(){that.model.set({isoTopic: that.topics.getValue()});});

		},
		
		clearForm: function(){
			//TODO: a placeholder
		},
		clearInput: function(divName){
			jQuery('#' + divName + ' :input').each(function(){
				var type = this.type;
				var tag = this.tagName.toLowerCase();
				if (type == 'text' || type == 'password' || tag == 'textarea'){
					this.value = '';
				} else if (type == 'checkbox' || type == 'radio'){
					this.checked = false;
				} else if (tag == 'select'){
					this.selectedIndex = 0;
				}
			});
		},

		clearDefault: function(inputFieldName){
			var searchTextElement = document.getElementById(inputFieldName);
			
			if (searchTextElement == null)
				return;
			var currentValue = searchTextElement.value;
			if (currentValue.indexOf("Search") == 0)
				searchTextElement.value = "";
		},

		//default text for the search input box
		searchText: "(Example: Buildings)",


		
		/**********
		 * Callbacks
		 *********/


		// keeping track of the last solr search is useful in multiple cases
		// if a search that filter based on the map returned no results we want to 
		//   re-run the search without the map filter and let user know if there are results
		// after use login we re-run the query to update "login" buttons on layers

		history: [],
		addToHistory: function(solr){
			//number of search objects to keep
			var historyLength = 5;
			this.history.push(solr);
			while (this.history.length > historyLength){
				this.history.shift();
			}
			
		},
		rerunLastSearch: function(){
			var solr = this.history.pop();
			if (solr != null)
				solr.executeSearchQuery(this.searchRequestJsonpSuccess, this.searchRequestJsonpError);
		},

		/**
		 * called when the last search returned no results
		 *  we rerun the last search without a spatial constraint
		 *  if this search returns hits, we let the user know there is data outside the map
		 * note that this function changes the value returned by "getLastSolrSearch()"
		 * @return
		 */
		addSpatialToEmptySearchMessage: function(){
			var solr = this.history.pop();
			if (solr != null){
				solr.clearBoundingBox();
				solr.executeSearchQuery(this.emptySearchMessageHandler, this.searchRequestJsonpError);
			}
		}
});		
			