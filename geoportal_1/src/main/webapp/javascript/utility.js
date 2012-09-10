/* This javascript module includes utility functions for OpenGeoPortal plus
 * extra functions with no current home. org.OpenGeoPortal.Utility is a
 * namespace rather than an object.  The XML functions might go away when we
 * upgrade to a newer version of jQuery, as it contains functions to parse XML.
 * 
 * author: Chris Barnett
 * 
 */

if (typeof org == 'undefined'){ 
	org = {};
} else if (typeof org != "object"){
	throw new Error("org already exists and is not an object");
}

// Repeat the creation and type-checking code for the next level
if (typeof org.OpenGeoPortal == 'undefined'){
	org.OpenGeoPortal = {};
} else if (typeof org.OpenGeoPortal != "object"){
    throw new Error("org.OpenGeoPortal already exists and is not an object");
}

if (typeof org.OpenGeoPortal.Utility == 'undefined'){
	org.OpenGeoPortal.Utility = {};
} else if (typeof org.OpenGeoPortal.Utility != "object"){
    throw new Error("org.OpenGeoPortal.Utility already exists and is not an object");
}

org.OpenGeoPortal.Utility.whichTab = function(){
	var tabInfo = {};
	var tabIndex;
	if (arguments.length > 0){
		tabIndex = arguments[0];
	} else {
		tabIndex = jQuery("#tabs").tabs( "option", "selected" );
	}
	tabInfo.index = tabIndex;
	switch (tabIndex){
	case 0:
		tabInfo.name = 'welcome';
		tabInfo.tableObject = false;
		tabInfo.tableDiv = false;
		tabInfo.tableName = false;
		break;
	case 1:
		tabInfo.name = 'search';
		tabInfo.tableObject = function(){return org.OpenGeoPortal.resultsTableObj;};
		tabInfo.tableDiv = 'resultsTable';
		tabInfo.tableName = 'searchResults';
		break;
	case 2:
		tabInfo.name = 'saved';
		tabInfo.tableObject = function(){return org.OpenGeoPortal.cartTableObj;};
		tabInfo.tableDiv = 'savedLayersTable';
		tabInfo.tableName = 'savedLayers';
		break;
	default:
		//throw new Error('No tab is selected.');			
	}
	return tabInfo;
};


org.OpenGeoPortal.Utility.whichSearch = function(){
	var activeSearchDiv = null;
	jQuery(".searchBox > div").each(function(){
		if (jQuery(this).css("display") == 'block'){
			activeSearchDiv = jQuery(this).attr("id");
		}
	});
	var searchInfo = {};
	//searchInfo.script = 'solrSearchHandler.jsp';
	switch (activeSearchDiv){
	case "basicSearchBox":
		searchInfo.type = 'basicSearch';
		break;
	case "advancedSearchBox":
		searchInfo.type = 'advancedSearch';
		break;
	default:
		//throw new Error('No tab is selected.');
	}
	return searchInfo;
};

org.OpenGeoPortal.Utility.rgb2hex = function(rgb) {
    rgb = rgb.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);
    function hex(x) {
        return ("0" + parseInt(x).toString(16)).slice(-2);
    }
    return "#" + hex(rgb[1]) + hex(rgb[2]) + hex(rgb[3]);
};

org.OpenGeoPortal.Utility.hexFromRGB = function(r, g, b) {
	var hex = [
		r.toString(16),
		g.toString(16),
		b.toString(16)
	];
	jQuery.each(hex, function (nr, val) {
		if (val.length == 1) {
			hex[nr] = '0' + val;
		}
	});
	return hex.join('').toUpperCase();
};

org.OpenGeoPortal.Utility.idEscape = function (domElementID) { 
	   return domElementID.replace(/(:|\.)/g,'\\$1');
};

org.OpenGeoPortal.Utility.getMetadata = function (layerId){
	var params = {
			url: "getMetadata.jsp?layer=" + layerId,
			dataType: 'xml',
			success: function(data){
				console.log(data);
			}
		  };
		jQuery.ajax(params);
};

org.OpenGeoPortal.Utility.loadIndicatorStatus = {"intervalId": "", "currentRequests": 0};

org.OpenGeoPortal.Utility.showLoadIndicator = function(div){
	var that = this;
	var indicatorFunction = function(){
		try{
			indicator.css("background-position", 
				function(a,b){
					var y = parseInt(b.substr(b.indexOf(" "))); 
					y -= 25; 
					var value =  "0 " + y + "px";
					return value;});
		} catch (e){}
	};
	var indicator = jQuery('#' + div);
		//var j = 1;
		//no current ajax requests, so we can start a new indicator
		if (that.loadIndicatorStatus["currentRequests"] == 0){
			indicator.css("background-image", "url('media/progress.png')");
			indicator.fadeIn();

			that.loadIndicatorStatus["intervalId"] = setInterval(indicatorFunction, 84);
			that.loadIndicatorStatus["currentRequests"] = 1;
		} else {
			//we don't need to setInterval or change intervalId; we do need to push a value into currentRequests
			/*var requests = that.loadIndicatorStatus["currentRequests"];
			for (var i in requests){
				if (requests[i] > j){
					j = requests[i];
				}
			}
			j++;*/
			//pass in a value that is 1 larger than the largest value in the array to keep uniqueness
			that.loadIndicatorStatus["currentRequests"] += 1;
		}
		//return j;
		//console.log(that.loadIndicatorStatus["currentRequests"]);
	};
	
org.OpenGeoPortal.Utility.hideLoadIndicator = function(div){
	var that = this;
	var indicator = jQuery('#' + div);

		//remove the passed ajaxRequestId from the currentRequests array.  if the array is now empty, then proceed

		/*var requests = that.loadIndicatorStatus["currentRequests"];
		for (var i in requests){
			if (requests[i] == requestId){
				that.loadIndicatorStatus["currentRequests"].splice(i, 1);
				break;
			}
		}*/
	that.loadIndicatorStatus["currentRequests"] -= 1;
		if (that.loadIndicatorStatus["currentRequests"] == 0){
			indicator.fadeOut();
			clearInterval(that.loadIndicatorStatus["intervalId"]);
			that.loadIndicatorStatus["intervalId"] = "";
		}
	
};

