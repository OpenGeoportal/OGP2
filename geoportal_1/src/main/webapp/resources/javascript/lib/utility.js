/* This javascript module includes utility functions for OpenGeoPortal plus
 * extra functions with no current home. OpenGeoportal.Utility is a
 * namespace rather than an object.  The XML functions might go away when we
 * upgrade to a newer version of jQuery, as it contains functions to parse XML.
 * 
 * author: Chris Barnett
 * 
 */

if (typeof OpenGeoportal == 'undefined'){
	OpenGeoportal = {};
} else if (typeof OpenGeoportal != "object"){
    throw new Error("OpenGeoportal already exists and is not an object");
}

if (typeof OpenGeoportal.Utility == 'undefined'){
	OpenGeoportal.Utility = {};
} else if (typeof OpenGeoportal.Utility != "object"){
    throw new Error("OpenGeoportal.Utility already exists and is not an object");
}

OpenGeoportal.Utility.ImageLocation = "resources/media/";
OpenGeoportal.Utility.CssLocation = "resources/css/";
OpenGeoportal.Utility.JspfLocation = "jspf/";
	
OpenGeoportal.Utility.InitSet = false;

OpenGeoportal.Utility.getImage = function(imageName){
	return OpenGeoportal.Utility.ImageLocation + imageName;
};

OpenGeoportal.Utility.CurrentTab = 0;
OpenGeoportal.Utility.whichTab = function(){
	var tabInfo = {};
	var tabIndex;
	if (arguments.length > 0){
		tabIndex = arguments[0];
	} else {
		tabIndex = OpenGeoportal.Utility.CurrentTab;
	}
	tabInfo.index = tabIndex;
	switch (tabIndex){
	case 0:
		tabInfo.name = 'search';
		tabInfo.tableObject = function(){return OpenGeoportal.ogp.resultsTableObj;};
		tabInfo.tableDiv = 'resultsTable';
		tabInfo.tableName = 'searchResults';
		break;
	case 1:
		tabInfo.name = 'saved';
		tabInfo.tableObject = function(){return OpenGeoportal.ogp.cartTableObj;};
		tabInfo.tableDiv = 'savedLayersTable';
		tabInfo.tableName = 'savedLayers';
		break;
	default:
		//throw new Error('No tab is selected.');			
	}
	return tabInfo;
};


OpenGeoportal.Utility.whichSearch = function(){
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

OpenGeoportal.Utility.rgb2hex = function(rgb) {
    rgb = rgb.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);
    function hex(x) {
        return ("0" + parseInt(x).toString(16)).slice(-2);
    }
    return "#" + hex(rgb[1]) + hex(rgb[2]) + hex(rgb[3]);
};

OpenGeoportal.Utility.hexFromRGB = function(r, g, b) {
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

OpenGeoportal.Utility.idEscape = function (domElementId) { 
	   return domElementId.replace(/(:|\.)/g,'\\$1');
};

OpenGeoportal.Utility.getMetadata = function (layerId){
	var params = {
			url: "getMetadata.jsp?layer=" + layerId,
			dataType: 'xml',
			success: function(data){
				console.log(data);
			}
		  };
		jQuery.ajax(params);
};

OpenGeoportal.Utility.escapeQuotes = function(stringOfInterest){
	return stringOfInterest.replace("'", "\\'").replace('"', '\\"');
	
};

OpenGeoportal.Utility.stripExtraSpaces = function(stringOfInterest){
	stringOfInterest = stringOfInterest.replace("\n", "");
	return stringOfInterest.replace(/\s+/g, ' ');
};

OpenGeoportal.Utility.loadIndicatorStatus = {"intervalId": "", "currentRequests": 0};

OpenGeoportal.Utility.indicatorAnimationStart = function(div){
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
	indicator.css("background-image", "url('" + OpenGeoportal.Utility.getImage("progress.png") + "')");
	var intervalId = setInterval(indicatorFunction, 84);
	return intervalId;
};

OpenGeoportal.Utility.showLoadIndicator = function(div){
	var that = this;
	/*var indicatorFunction = function(){
		try{
			indicator.css("background-position", 
				function(a,b){
					var y = parseInt(b.substr(b.indexOf(" "))); 
					y -= 25; 
					var value =  "0 " + y + "px";
					return value;});
		} catch (e){}
	};*/
	var indicator = jQuery('#' + div);
		//var j = 1;
		//no current ajax requests, so we can start a new indicator
		if (that.loadIndicatorStatus["currentRequests"] == 0){
			//indicator.css("background-image", "url('" + OpenGeoportal.Utility.getImage("progress.png") + "')");

			that.loadIndicatorStatus["intervalId"] = OpenGeoportal.Utility.indicatorAnimationStart(div);
			indicator.fadeIn();
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
	
OpenGeoportal.Utility.hideLoadIndicator = function(div){
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

	
OpenGeoportal.Utility.checkAddress = function(emailAddress){
		var stringArray = emailAddress.split("@");
		if (stringArray.length < 2) {
			return false;
		} else {
			var domainArray = stringArray[1].split(".");
			var userString = stringArray[0];
			if (domainArray.length < 2) {
				return false;
			} else if ((domainArray[0].length + domainArray[1].length + userString.length) < 3){
				return false;
			} 
		}
		return true;

	};
 
 OpenGeoportal.Utility.pluralSuffix = function(totalNumber){
			var plural;
			if (totalNumber > 1){
				plural = "s";
			} else {
				plural = "";
			}
			return plural;
		};
		
OpenGeoportal.Utility.doPrint = function(){
		window.print();
		//jQuery('head > link[href="css/print.css"]').remove();
	};

