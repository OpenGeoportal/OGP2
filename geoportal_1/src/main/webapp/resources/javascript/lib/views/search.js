/**
 * This javascript module includes functions for dealing with search All the
 * logic for search should be here. this module should be capable of converting
 * data to a format usable elsewhere in the app and adapting form elements to
 * search params defined in the Solr object
 * 
 * @author Chris Barnett
 * 
 */

if (typeof OpenGeoportal == 'undefined') {
	OpenGeoportal = {};
} else if (typeof OpenGeoportal != "object") {
	throw new Error("OpenGeoportal already exists and is not an object");
}

if (typeof OpenGeoportal.Views == 'undefined') {
	OpenGeoportal.Views = {};
} else if (typeof OpenGeoportal.Views != "object") {
	throw new Error("OpenGeoportal.Views already exists and is not an object");
}

/**
 * Search
 */
// this should be a view of the query terms model
OpenGeoportal.Views.Query = Backbone.View
		.extend({

			initialize : function() {
				jQuery("#whereField").attr("placeholder", this.model.get("whereExample"));
				jQuery("#whatField").attr("placeholder", this.model.get("whatExample"));

				this.widgets = OpenGeoportal.ogp.widgets;
				this.tableControls = OpenGeoportal.ogp.tableControls;
				this.geocoder = new OpenGeoportal.Geocoder();
				
				var that = this;
				
				this.geocoder.geocodeAutocomplete(jQuery("#whereField"));

				this.widgets.prependButton(jQuery(".basicSearchButtons"),
						"basicSearchSubmit", "Search", function() {
							that.fireSearchWithZoom();
						}).addClass("searchButton");
				
				this.solrAutocomplete(
						jQuery("#advancedOriginatorText"), "OriginatorSort");
				
				this.createInstitutionsMenu();
				this.createDataTypesMenu();
				this.createTopicsMenu();
				
				this.mapInputsToModel();

				var advSearchButtons$ = jQuery(".advancedSearchButtons")
						.first();
				this.widgets.prependButton(advSearchButtons$,
						"advancedSearchSubmit", "Search", function() {
							that.fireSearchWithZoom();
						}).addClass("searchButton");
				this.widgets.prependButton(advSearchButtons$,
						"advancedSearchClear", "Clear", function(){that.clearForm();});

				this.listenTo(this.model, "change:mapExtent",
						this.extentChanged);

				this.mapFilterHandler();
				this.searchTypeHandler();
				this.showRestrictedHandler();
				this.searchBoxKeypressHandler();

				jQuery(document).on("map.extentChanged", function(e, data) {
					that.model.setMapExtent(data.mapExtent, data.mapCenter);
				});
			},
			
			events : {
				"blur input" : "setTextValue",
				"change #whereField": "doGeocode",
				"keypress #whereField": "noteWhereChanged",
				"change #whatField,#advancedKeywordText,#advancedOriginatorText,#advancedDateFromText,#advancedDateToText": "noteSearchChanged"
			},

			/*******************************************************************
			 * Interface between ui and solr query
			 ******************************************************************/

			/**
			 * maps dom elements to attributes in the model by attaching the attribute name with jQuery.data
			 * nb: ideally, this happens when the dom elements are created via template to ensure a match
			 */
			mapInputsToModel : function() {
				jQuery("#whatField").data({
					queryAttr : "what"
				});
				jQuery("#whereField").data({
					queryAttr : "where"
				});
				jQuery("#advancedKeywordText").data({
					queryAttr : "keyword"
				});
				jQuery("#advancedOriginatorText").data({
					queryAttr : "originator"
				});
				jQuery("#advancedDateFromText").data({
					queryAttr : "dateFrom"
				});
				jQuery("#advancedDateToText").data({
					queryAttr : "dateTo"
				});
			},
			/**
			 * using the mapping in mapInputsToModel, sets the value of a model attribute from the dom value
			 */
			setTextValue : function(event) {
				var target$ = jQuery(event.currentTarget);
				var attr = target$.data().queryAttr;
				var val = "";
				if (_.has(target$.data(), "preferredValue") && target$.data().preferredValue.length > 0){
					val = target$.data().preferredValue;
				} else { 
					val = target$.val().trim();
				}
				this.model.set(attr, val);

				// map field to model attribute
			},

			
			handleGeocodeResults: function(geocode, where$){

				var prevGeocode = where$.data().geocode || {};
				
				where$.data("geocode", geocode);
				
				var bbox = geocode.bbox;
				
				if (typeof bbox !== "undefined") {
					
					where$.val(geocode.name);
					
					if (_.has(geocode, "fullResponse") && _.has(geocode.fullResponse, "address_components")){
						var comp = geocode.fullResponse.address_components;
						if (comp.length > 0 && _.has(comp[0], "long_name")){
							var name = comp[0].long_name;
							where$.data().preferredValue = name;
							this.model.set({where: name});
						}
					}
					
					
					this.model.set({geocodedBbox: geocode.bbox});

					if (this.checkWhereChanged()){
						
						if (_.has(prevGeocode, "name") && _.has(geocode, "name")){
							if (prevGeocode.name == geocode.name){
								//console.log("geocode names match");
								//if the user has typed any keys, we should fire a geocode
								this.model.trigger("change:geocodedBbox");
							}
						}
					}
					

				} else {
					// console.log("zoomToWhere");
					this.fireSearch();
				}
				

			},
			
			checkChanged: function(prop){
				var val = this[prop];
				if (val){
					this[prop] = false;
				}
				return val;
			},
			
			whereChanged: false,
			
			noteWhereChanged: function(){
				this.whereChanged = true;
			},
			
			checkWhereChanged: function(){
				var check = this.checkChanged("whereChanged");
				return check;
			},
			
			searchChanged: false,
			
			checkSearchChanged: function(){
				return this.checkChanged("searchChanged");
			},
			
			noteSearchChanged: function(){
				this.searchChanged = true;
			},
			
			doGeocode: function(){
				// try to geocode the value in the where field if it doesn't
				// come from the geocoder
				//console.log(arguments);
				var geocodeField$ = jQuery("#whereField");
				var promise = this.geocoder.getGeocodePromise(geocodeField$.val().trim());
				var that = this;
				jQuery.when(promise).done(
						function(message) {
									
							// console.log("message");
							// console.log(message);
							if (message.values.length > 0) {
								that.handleGeocodeResults(message.values[0], geocodeField$);

							} else {
								//console.log("geocode without messages");
								that.clearWhere();
								that.fireSearch();
							}

						});
			},
			


			clearWhere : function() {
				//console.log("clear where");
				var where$ = jQuery("#whereField");
				//clear the geocode value
				where$.data().geocode = {};
				where$.data().preferredValue = "";
				
				this.geocodeBbox = null;
				this.model.set({where: ""});
				where$.val("");
			
			},
			
			fireSearchWithZoom : function() {
				if (this.model.get("searchType") === "advanced") {
					var ignoreSpatial = this.model.get("ignoreSpatial");
					if (ignoreSpatial) {
						this.fireSearch();
						return;
					}
				}
				//if where is empty, ignore zoom
				var where$ = jQuery("#whereField");
					
				if (where$.val().trim().length === 0) {
					//console.log("just firing search");
					this.fireSearch();
					return;
				}
				
				//if extent hasn't changed, but other search values have, fire search
				if (this.checkSearchChanged()){
					//console.log("searchChanged");
					this.fireSearch();
					return;
				}
				
			},
			
			extentChangeQueue : [],
			extentChanged : function() {
				// should be a delay before fireSearch is called, so we don't
				// have a bunch of fireSearch events at once
				var id = setTimeout(this.fireSearch, 100);
				for ( var i in this.extentChangeQueue) {
					clearTimeout(this.extentChangeQueue[i]);
				}
				this.extentChangeQueue.push(id);

			},

			fireSearch : function() {

				jQuery(document).trigger("fireSearch");
			},

			searchTypeHandler : function() {
				var that = this;
				jQuery(document).on("search.setBasic", function() {
					that.noteSearchChanged();
					that.model.set({
						searchType : "basic"
					});
				});
				jQuery(document).on("search.setAdvanced", function() {
					that.noteSearchChanged();
					that.model.set({
						searchType : "advanced"
					});
				});
			},
			
			mapFilterHandler : function() {
				var that = this;
				jQuery("#mapFilterCheck").on("change", function(event) {
					that.noteSearchChanged();
					that.model.set({
						ignoreSpatial : this.checked
					});
					// var value = this.checked ? "Checked" : "Unchecked";
					// analytics.track("Limit Results to Visible Map", value);
				});
			},
			
			showRestrictedHandler : function() {
				
				var that = this;
				jQuery("#restrictedCheck").on("change", function(event) {
					that.noteSearchChanged();
					var arrRestricted = [];
					if (!this.checked) {
						arrRestricted = that.model.get("displayRestrictedBasic");
					} else {
						arrRestricted = that.model.get("repositoryList").pluck("shortName");
					}
					that.model.set({
						displayRestrictedAdvanced : arrRestricted
					});
				});
			},
			
			searchBoxKeypressHandler : function() {
				var that = this;
				jQuery('.searchBox').keypress(function(event) {
					// var type, search, keyword;
					if (event.keyCode == '13') {
						event.preventDefault();
						jQuery(event.target).blur();
						that.fireSearchWithZoom();
						jQuery(event.target).focus();

					}
				});
			},

			/**
			 * uses styledSelect to create the menu in advanced search that
			 * allows a user to select which institutions to search; dynamically
			 * created from info in OpenGeoportal.Config
			 */
			createInstitutionsMenu : function() {
				var repositoryCollection = this.model.get("repositoryList");
				var that = this;
				var iconRenderer = this.tableControls.renderRepositoryIcon;

				var callback = function() {
					var repositoryMenu = new OpenGeoportal.Views.CollectionMultiSelectWithCheckbox(
							{
								collection : repositoryCollection,
								el : "div#repositoryDropdown",
								valueAttribute : "shortName",
								displayAttribute : "shortName",
								buttonLabel : "Select repositories",
								itemClass : "repositoryMenuItem",
								iconRenderer : iconRenderer,
								controlClass : "repositoryCheck",
								showOnly: true
							});
					that.repositories = repositoryMenu;
					that.model.set({
						repository : that.repositories.getValueAsArray()
					});
					that.repositories.$el.on("change", function() {
						that.noteSearchChanged();
						that.model.set({
							repository : that.repositories.getValueAsArray()
						});
					});
				};
				if (repositoryCollection.length === 0) {
					// create the view once the Repository collection is
					// 'fetched'
					repositoryCollection.once("sync", callback);
				} else {
					callback();
				}

			},

			/**
			 * uses styledSelect to create the menu in advanced search that
			 * allows a user to select which data types to search; dynamically
			 * created from info in OpenGeoportal.InstitutionInfo
			 */
			createDataTypesMenu : function() {
				var that = this;
				var iconRenderer = this.tableControls.renderTypeIcon;
				var dataTypes = this.model.get("dataTypeList");
				var dataTypesMenu = new OpenGeoportal.Views.CollectionMultiSelectWithCheckbox(
						{
							collection : dataTypes,
							el : "div#dataTypeDropdown",
							valueAttribute : "value",
							displayAttribute : "displayName",
							buttonLabel : "Select data types",
							itemClass : "dataTypeMenuItem",
							iconRenderer : iconRenderer,
							controlClass : "dataTypeCheck",
							showOnly: true
						});

				this.dataTypes = dataTypesMenu;
				this.model.set({
					dataType : this.dataTypes.getValueAsArray()
				});
				this.dataTypes.$el.on("change", function() {
					that.noteSearchChanged();

					that.model.set({
						dataType : that.dataTypes.getValueAsArray()
					});
				});

			},

			/**
			 * uses styledSelect to create the menu in advanced search that
			 * allows a user to select an ISO topic to search
			 */
			createTopicsMenu : function() {
				var isoTopics = this.model.get("isoTopicList");
				this.topics = new OpenGeoportal.Views.CollectionSelect({
					collection : isoTopics,
					el : "div#topicDropdown",
					valueAttribute : "topic",
					displayAttribute : "label",
					buttonLabel : "Select a topic",
					itemClass : "isoTopicMenuItem"
				});
				this.model.set({
					isoTopic : this.topics.getValue()
				});
				var that = this;
				this.topics.$el.on("change", function() {
					that.noteSearchChanged();
				
					that.model.set({
						isoTopic : that.topics.getValue()
					});
				});

			},

			clearForm : function(e) {
								
				//clear checkboxes
				this.clearInput("restrictedCheck");
				this.clearInput("mapFilterCheck");
				//clear text fields
				this.clearInput("advancedKeywordText");
				this.clearInput("advancedOriginatorText");
				this.clearInput("advancedDateFromText");
				this.clearInput("advancedDateToText");
				
				//reset isotopic
				this.topics.changeSelected("");
				//reset datatype and repository dropdowns
				this.dataTypes.selectAll();
				this.repositories.selectAll();
				this.noteSearchChanged();

			},
			
			clearInput : function(divName) {
				jQuery('#' + divName + ':input').each(
						function() {
							var type = this.type;
							var tag = this.tagName.toLowerCase();
							if (type == 'text' || type == 'password' || type == 'search'
									|| tag == 'textarea') {
								this.value = '';
							} else if (type == 'checkbox' || type == 'radio') {
								if (this.checked){
									this.checked = false;
									jQuery(this).trigger("change");
								}
							} else if (tag == 'select') {
								this.selectedIndex = 0;
							}
							jQuery(this).trigger("blur");
						});
			},

			solrAutocomplete: function(textField$, solrField) {
				textField$.autocomplete({
					source : function(request, response) {
						var solr = new OpenGeoportal.Solr();
						var facetSuccess = function(data) {
							var labelArr = [];
							var dataArr = data.terms[solrField];
							for ( var i in dataArr) {
								if (i % 2 != 0) {
									continue;
								}
								var temp = {
									"label" : dataArr[i],
									"value" : '"' + dataArr[i] + '"'
								};
								labelArr.push(temp);
								i++;
								i++;
							}
							response(labelArr);
						};
						var facetError = function() {
						};
						solr.termQuery(solrField, request.term, facetSuccess,
								facetError, this);

					},
					minLength : 2,
					select : function(event, ui) {

					},
					open : function() {
						jQuery(this).removeClass("ui-corner-all").addClass(
								"ui-corner-top");
					},
					close : function() {
						jQuery(this).removeClass("ui-corner-top").addClass(
								"ui-corner-all");
					}
				});
			}
		});
