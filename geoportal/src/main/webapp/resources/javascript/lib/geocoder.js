/**
 * 
 * @author Chris Barnett
 * 
 */

if (typeof OpenGeoportal === 'undefined') {
	OpenGeoportal = {};
} else if (typeof OpenGeoportal !== "object") {
	throw new Error("OpenGeoportal already exists and is not an object");
}

/**
 * Geocoder constructor: this object determines the behavior of the Geocoder.  Currently uses Google's
 * geocoder.
 * 
 */
OpenGeoportal.Geocoder = function Geocoder() {
	
	/**
	 * geocodes the value typed into the geocoder text input using the OpenStreetMaps
	 * maps geocoder, nominatim, via jsonp request
	 * 
	 * @param locationTerm	a string containing the location to geocode
	 * @returns jQuery.promise that is resolved when the results are returned
	 */
	this.getGeocodePromise = function(locationTerm) {
		var dfd = new jQuery.Deferred();
		var that = this;
		
		requestURL = 'https://nominatim.openstreetmap.org/search?json_callback=geoCallback'	

		function geoCallback() {
			//console.log("geoCallback");
		};
		
		$.ajax({
			url: requestURL,
			dataType: "jsonp",
			jsonp: false,
			jsonpCallback: "geoCallback",
			async:false,
			data: { q: locationTerm, format: "json", limit: 5 },
			success: function(data) {
				var processedResponse = that.processGeocoderResults(data);
				dfd.resolve(processedResponse);
			}
		});

		return dfd.promise();
	};
	

	/**
	 * transform the response from the geocoder to one usable by autocomplete mechanism
	 */
	this.processGeocoderResults = function(results){
		var geocodeResponse = {
			labels : [],
			values : []
		};

		if ( results.length > 0 ) {
			for (var i in results) {
				var viewPort = results[i].boundingbox;

				var southwest = L.latLng(viewPort[0],viewPort[2]);
				var northeast = L.latLng(viewPort[1],viewPort[3]);
				var bbox = L.latLngBounds(southwest, northeast);

				var displayName = results[i].display_name;
				var currentResponse = {}
				currentResponse.name = displayName;
				currentResponse.bbox = bbox;
				currentResponse.fullResponse = results[i];
				geocodeResponse.values.push(currentResponse);
				geocodeResponse.labels.push(displayName);
			}	
		} else if ( results.length == 0 ) {
			geocodeResponse.labels.push("No results found.");
		} else {
			geocodeResponse.labels.push("Error retrieving results.");
		}
		
		return geocodeResponse;
	};
	
	this.geocodeAutocomplete = function(geocodeField$) {
		var geocodeResponse = {};
		var that = this;

		
		geocodeField$.autocomplete({
			source : function(request, response) {
				geocodePromise = that.getGeocodePromise(request.term);
				jQuery.when(geocodePromise).then(function(message) {
					geocodeResponse = message;
					response(geocodeResponse.labels);
				});

			},
			minLength : 3,
			delay : 200,
			select : function(event, ui) {
				for ( var i in geocodeResponse.values) {
					if (geocodeResponse.values[i].name === ui.item.value) {
						geocodeField$.data({
							"geocode" : geocodeResponse.values[i]
						});
						return;
					}
				}
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
		
		var autocompleteInstance = geocodeField$.autocomplete()
			// Retrieve the autocomplete's instance and store it.
			.data( "ui-autocomplete" );
		
		// Override the _renderMenu method for this dialog to add OSM attribution
		autocompleteInstance._renderMenu = function( ul, items ) {
			var that = this;
			jQuery.each( items, function( index, item ) {
				that._renderItemData( ul, item );
			});
			var attribution = '<li class="searchAttribution">Powered by OpenStreetMap</li>';
			jQuery( attribution ).appendTo( ul ).removeClass("ui-widget-content ui-menu-divider");
			 
		};

	};


};
