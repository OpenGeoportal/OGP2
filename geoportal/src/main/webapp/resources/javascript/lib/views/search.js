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
 * The Query view handles the rendering and behavior of the basic and advanced search forms. It's backed by
 * the QueryTerms model.
 */
// this should be a view of the query terms model
OpenGeoportal.Views.Query = Backbone.View
		.extend({

			initialize : function(options) {
                _.extend(this, _.pick(options, "map", "widgets", "tableControls", "ready"));

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

				var advSearchButtons$ = $(".advancedSearchButtons").first();
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
				this.fireSearchHandler();

				$(document).on("map.extentChanged", function(e, searchExtent) {
					that.model.setMapExtent(searchExtent);
				});

                $("#whereField").focus();

                if (this.model.get('searchType') === "advanced"){
                	this.showAdvanced();
				}
			},
			
			events : {
                "blur input": "setTextValue",
                "change #whereField": "doGeocode",
                "keypress #whereField": "noteWhereChanged",
                "change #whatField,#advancedKeywordText,#advancedOriginatorText,#advancedDateFromText,#advancedDateToText": "noteSearchChanged",
                "search #whereField,#whatField,#advancedKeywordText,#advancedOriginatorText,#advancedDateFromText,#advancedDateToText": "noteSearchChanged",
                "click .searchToggle": "toggleSearch"

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
                    queryAttr: "what",
                    fieldType: "text"
                }).val(this.model.get("what")).attr("placeholder", this.model.get("whatExample"));

				jQuery("#whereField").data({
                    queryAttr: "where",
                    fieldType: "text"
                }).val(this.model.get("where")).attr("placeholder", this.model.get("whereExample"));

				jQuery("#advancedKeywordText").data({
                    queryAttr: "keyword",
                    fieldType: "text"
                }).val(this.model.get("keyword"));


				jQuery("#advancedOriginatorText").data({
                    queryAttr: "originator",
                    fieldType: "text"
                }).val(this.model.get("originator"));

				jQuery("#advancedDateFromText").data({
                    queryAttr: "dateFrom",
                    fieldType: "text"
                }).val(this.model.get("dateFrom"));

				jQuery("#advancedDateToText").data({
                    queryAttr: "dateTo",
                    fieldType: "text"
                }).val(this.model.get("dateTo"));
			},


            /**
			 * using the mapping in mapInputsToModel, sets the value of a model attribute from the dom value
			 */
			setTextValue : function(event) {
				var target$ = jQuery(event.currentTarget);
				var attr = target$.data().queryAttr;
                var val = "";
                if (_.has(target$.data(), "preferredValue") && target$.data().preferredValue.length > 0) {
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

                    if (_.has(geocode, "fullResponse") && _.has(geocode.fullResponse, "address_components")) {
                        var comp = geocode.fullResponse.address_components;
                        if (comp.length > 0 && _.has(comp[0], "long_name")) {
                            var name = comp[0].long_name;
                            where$.data().preferredValue = name;
                            this.model.set({where: name});
                        }
                    }


                    this.model.set({geocodedBbox: geocode.bbox});

                    if (this.checkWhereChanged()) {

                        if (_.has(prevGeocode, "name") && _.has(geocode, "name")) {
                            if (prevGeocode.name == geocode.name) {
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

            checkChanged: function (prop) {
                var val = this[prop];
                if (val) {
                    this[prop] = false;
                }
                return val;
            },

            whereChanged: false,

            noteWhereChanged: function () {
                this.whereChanged = true;
            },

            checkWhereChanged: function () {
                var check = this.checkChanged("whereChanged");
                return check;
            },

            searchChanged: false,

            checkSearchChanged: function () {
                return this.checkChanged("searchChanged");
			},

            noteSearchChanged: function () {
                this.searchChanged = true;
            },

            doGeocode: function () {
                // try to geocode the value in the where field if it doesn't
                // come from the geocoder
                //console.log(arguments);
                var geocodeField$ = jQuery("#whereField");
                var promise = this.geocoder.getGeocodePromise(geocodeField$.val().trim());
                var that = this;
                jQuery.when(promise).done(
                    function (message) {

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
						// console.log("firesearchWithZoom ignore spatial");
						this.fireSearch();
						//this.clearWhere();
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
                if (this.checkSearchChanged()) {
                    //console.log("searchChanged");
                    this.fireSearch();

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

			fireSearchHandler: function(){
				var that = this;
				$(document).on('fireSearch', function(){
					console.log('fireSearch triggered');
					that.fireSearch();
				});
			},

			fireSearch : function() {
				$.when.apply(this.ready).done(
					function(){
						$(document).trigger("newSearch");
                    }
				);
				// todo: wait to fire search until everything in ready is ready. should just cancel if not ready?
				//jQuery(document).trigger("newSearch");
			},

			searchTypeHandler : function() {
				var that = this;
                jQuery(document).on("searchform.setBasic", function () {
                    that.noteSearchChanged();
					that.model.set({
						searchType : "basic"
					});
				});
                jQuery(document).on("searchform.setAdvanced", function () {
                    that.noteSearchChanged();
					that.model.set({
						searchType : "advanced"
					});
				});
			},
			
			mapFilterHandler : function() {
				var that = this;
				var $mapFilter = $("#mapFilterCheck");
				$mapFilter.prop('checked', this.model.get('ignoreSpatial'));

				$mapFilter.on("change", function(event) {
                    that.noteSearchChanged();
					that.model.set({
						ignoreSpatial : this.checked
					});
					// var value = this.checked ? "Checked" : "Unchecked";
					// analytics.track("Limit Results to Visible Map", value);
				});
			},
			
			showRestrictedHandler : function() {

				var $check = $("#restrictedCheck");
                //initialize with model value
                $check.prop("checked", this.model.get("includeRestricted"));

                var that = this;
                $check.on("change", function (event) {
                    var checked = jQuery(this).prop("checked");

                    that.model.set({
                        includeRestricted: checked
                    });

                    that.noteSearchChanged();

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
                                displayAttribute: "fullName",
								buttonLabel : "Select repositories",
								itemClass : "repositoryMenuItem",
								iconRenderer : iconRenderer,
								controlClass : "repositoryCheck",
                                countClass: "facet_InstitutionSort",
								showOnly: true
							});
					that.repositories = repositoryMenu;


                    that.repositories.$el.on("change", function() {
                        that.noteSearchChanged();

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
                            countClass: "facet_DataTypeSort",
                            showOnly: true
						});

				this.dataTypes = dataTypesMenu;

				this.dataTypes.$el.on("change", function() {
                    that.noteSearchChanged();

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
                    valueAttribute: "value",
                    displayAttribute: "displayName",
					buttonLabel : "Select a topic",
					itemClass : "isoTopicMenuItem"
				});

				var that = this;
				this.topics.$el.on("change", function() {
                    that.noteSearchChanged();

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
            },

			showAdvanced: function(){
                var $search = $("#searchForm");

                // hide basic search controls
                $search.find(".basicSearch").hide();
                $("#geosearchDiv").removeClass("basicSearch").addClass(
                    "advancedSearch");

                var $searchBox = $('#searchBox');
                var hght = $(".searchFormRow").height() * 3;
                $searchBox.height($searchBox.height() + hght);

                var $adv = $search.find(".advancedSearch");
                $adv.filter(".searchRow1").show();
                $adv.filter(".searchRow2").show();
                $adv.filter(".searchRow3").show();
                $adv.filter(".searchRow4").show();

                this.map.ready.then(function(){
                    $(".olControlModPanZoomBar, .olControlPanel, #mapToolBar, #neCorner, #nwCorner, .leaflet-top").addClass("slideVertical");
                    var margin = $(".slideVertical").css("margin-top");
                    $(".slideVertical").css({"margin-top": parseInt(margin) + hght});
                    $(document).trigger("searchform.resize", {"delta": hght});
                });



            },
            /**
			 * expand search box height to accommodate advanced search.
             * @param hght  searchRow height
             * @param stepTime speed to show each row
             */
            expandSearchBox: function (hght, stepTime) {
                var $search = $("#searchForm");

                // hide basic search controls
                $search.find(".basicSearch").hide();
                $("#geosearchDiv").removeClass("basicSearch").addClass(
                    "advancedSearch");

                // animate expansion of each row
                var $adv = $search.find(".advancedSearch");
                $adv.filter(".searchRow1").show();

                var $searchBox = $('#searchBox');
                $searchBox.animate(
                    {
                        height: "+=" + hght
                    },
                    {
                        queue: false,
                        duration: stepTime,
                        easing: "linear",
                        complete: function () {
                            $adv.filter(".searchRow2").show();
                            $searchBox.animate(
                                {
                                    height: "+=" + hght
                                },
                                {
                                    queue: false,
                                    duration: stepTime,
                                    easing: "linear",
                                    complete: function () {
                                        $adv.filter(".searchRow3").show();
                                        $searchBox.animate(
                                            {
                                                height: "+=" + hght
                                            },
                                            {
                                                queue: false,
                                                duration: stepTime,
                                                easing: "linear",
                                                complete: function () {
                                                    $adv.filter(".searchRow4").show();
                                                    $("#lessSearchOptions").focus();
                                                    // let the application know which search to perform
                                                    $(document).trigger("searchform.setAdvanced");

                                                }
                                            });
                                    }
                                });
                        }
                    });

                // move other items that need to slide down
                $(".slideVertical").animate(
                    {
                        "margin-top": "+=" + hght * 3
                    },
                    {
                        duration: stepTime * 3,
                        easing: "linear",
                        complete: function () {
                            $(document).trigger("searchform.resize", {"delta": hght * 3});
                        }
                    });


            },

            /**
			 * Shrink search box size for basic search
             * @param hght  searchRow height
             * @param stepTime  speed to hide each row
             */
            shrinkSearchBox: function (hght, stepTime) {
            	// move other items that need to slide up
                $(".slideVertical").animate(
                    {
                        "margin-top": "-=" + hght * 3
                    },
                    {
                        queue: false,
                        duration: stepTime * 3,
                        easing: "linear",
                        complete: function () {
                            $(document).trigger("searchform.resize", {"delta": hght * -3});
                        }
                    });

                var $search = $("#searchForm");
                var $adv = $search.find(".advancedSearch");
                var $searchBox = $('#searchBox');

                $adv.filter(".searchRow4").hide();

                $searchBox.animate(
                    {
                        height: "-=" + hght
                    },
                    {
                        queue: false,
                        duration: stepTime,
                        easing: "linear",
                        complete: function () {
                            // jQuery(".slideVertical").animate({"margin-top":
                            // "-=" + hght, queue: false, duration: 100,
                            // easing: "linear"});
                            $adv.filter(".searchRow3").hide();
                            $searchBox.animate(
                                {
                                    height: "-=" + hght
                                },
                                {
                                    queue: false,
                                    duration: stepTime,
                                    easing: "linear",
                                    complete: function () {
                                        $adv.filter(".searchRow2").hide();
                                        $searchBox.animate(
                                            {
                                                height: "-="
                                                + hght
                                            },
                                            {
                                                queue: false,
                                                duration: stepTime,
                                                easing: "linear",
                                                complete: function () {
                                                    $("#geosearchDiv").removeClass("advancedSearch")
                                                        .addClass("basicSearch");
                                                    $adv.filter(".searchRow1").hide();
                                                    $search.find(".basicSearch").show();
                                                    $("#moreSearchOptions").focus();
                                                    // let the application know which search to perform
                                                    $(document).trigger("searchform.setBasic");

                                                }
                                            });
                                    }
                                });
                        }
                    });

            },

            /**
			 * toggle which search form to show, including animated resize.
             * @param e
             */
            toggleSearch: function (e) {

                var stepTime = 50;
                var thisId = $(e.target).attr('id');
                var hght = $(".searchFormRow").height();
                $(".olControlModPanZoomBar, .olControlPanel, #mapToolBar, #neCorner, #nwCorner, .leaflet-top").addClass("slideVertical");

                if (thisId === 'moreSearchOptions') {
                    this.expandSearchBox(hght, stepTime);

                } else if (thisId === 'lessSearchOptions') {
                    this.shrinkSearchBox(hght, stepTime);
                }
			}
		});
