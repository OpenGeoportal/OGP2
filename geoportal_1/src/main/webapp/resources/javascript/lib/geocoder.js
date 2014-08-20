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
	this.geocoder = new google.maps.Geocoder();
	
	/**
	 * geocodes the value typed into the geocoder text input using the Google
	 * maps geocoder
	 * 
	 * @param locationTerm	a string containing the location to geocode
	 * @returns jQuery.promise that is resolved when the results are returned
	 */
	this.getGeocodePromise = function(locationTerm) {
		var dfd = new jQuery.Deferred();
		var that = this;
		this.geocoder.geocode({
			'address' : locationTerm
		}, function(results, status) {

			var processedResponse = that.processGeocoderResults(results, status);
			dfd.resolve(processedResponse);
		});

		return dfd.promise();
	};
	

	/**
	 * transform the response from the geocoder to one usable by autocomplete mechanism
	 */
	this.processGeocoderResults = function(results, status){
		/*
		 * for Google Javascript API geocoder
		 * "OK" indicates that no errors occurred; the address was
		 * successfully parsed and at least one geocode was returned.
		 * "ZERO_RESULTS" indicates that the geocode was successful but
		 * returned no results. This may occur if the geocode was passed a
		 * non-existent address or a latlng in a remote location.
		 * "OVER_QUERY_LIMIT" indicates that you are over your quota.
		 * "REQUEST_DENIED" indicates that your request was denied,
		 * generally because of lack of a sensor parameter.
		 * "INVALID_REQUEST" generally indicates that the query (address or
		 * latlng) is missing. UNKNOWN_ERROR indicates that the request
		 * could not be processed due to a server error. The request may
		 * succeed if you try again
		 */
		var geocodeResponse = {
			labels : [],
			values : []
		};
		// var labelArr = [];

		if (status === "OK") {

			for ( var i in results) {
				var viewPort = results[i].geometry.viewport;
				var extent = [];
				extent.push(viewPort.getSouthWest().lng());
				extent.push(viewPort.getSouthWest().lat());
				extent.push(viewPort.getNorthEast().lng());
				extent.push(viewPort.getNorthEast().lat());
				//uncomment to show geocoded bounding box on the map
				//OpenGeoportal.ogp.map.addMapBBox({bbox:extent.join()});
				var bbox = extent.join();
				var currentAddress = results[i].formatted_address;
				var currentResponse = {};
				currentResponse.name = currentAddress;
				currentResponse.bbox = bbox;
				currentResponse.fullResponse = results[i];
				geocodeResponse.values.push(currentResponse);
				geocodeResponse.labels.push(currentAddress);

			}
		} else if (status === "ZERO_RESULTS") {
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
		
		// Override the _renderMenu method for this dialog to add google attribution
		autocompleteInstance._renderMenu = function( ul, items ) {
			var that = this;
			jQuery.each( items, function( index, item ) {
				that._renderItemData( ul, item );
			});
			var attribution = '<li class="searchAttribution"><div class="poweredByGoogleAttr"></div></li>';
			jQuery( attribution ).appendTo( ul ).removeClass("ui-widget-content ui-menu-divider");
			 
		};

	};


};