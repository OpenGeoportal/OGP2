
if (typeof OpenGeoportal === 'undefined') {
	OpenGeoportal = {};
} else if (typeof OpenGeoportal !== "object") {
	throw new Error("OpenGeoportal already exists and is not an object");
}

if (typeof OpenGeoportal.Utility === 'undefined') {
	OpenGeoportal.Utility = {};
} else if (typeof OpenGeoportal.Utility !== "object") {
	throw new Error("OpenGeoportal.Utility already exists and is not an object");
}


/**
 * Some utility functions and settings.
 */
OpenGeoportal.Utility.ImageLocation = "resources/media/";
OpenGeoportal.Utility.CssLocation = "resources/css/";
OpenGeoportal.Utility.JspfLocation = "jspf/";

OpenGeoportal.Utility.InitSet = false;

OpenGeoportal.Utility.getImage = function(imageName) {
	return OpenGeoportal.Utility.ImageLocation + imageName;
};

OpenGeoportal.Utility.CurrentTab = 0;

OpenGeoportal.Utility.LocalStorage = {};
OpenGeoportal.Utility.LocalStorage.setBool = function(key, boolVal){

	if (window.localStorage){
		var val = "false";
		if (boolVal){
			val = "true";
		} 
		window.localStorage.setItem(key, val);
	} 

};

OpenGeoportal.Utility.LocalStorage.getBool = function(key, defaultVal){
	var bool = false;
	if (typeof defaultVal !== "undefined"){
		bool = defaultVal;
	}
	if (window.localStorage){
		var item = window.localStorage.getItem(key);
		if (item !== null){
			bool = item === "true";
		}
	}
	
	return bool;
};

OpenGeoportal.Utility.LocalStorage.resetItems = function(arrKeys){
	if (window.localStorage){
		_.each(arrKeys, function(item){
			window.localStorage.removeItem(item);
		});
	}
};


OpenGeoportal.Utility.rgb2hex = function(rgb) {
	rgb = rgb.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);
	function hex(x) {
		return ("0" + parseInt(x).toString(16)).slice(-2);
	}
	return "#" + hex(rgb[1]) + hex(rgb[2]) + hex(rgb[3]);
};

OpenGeoportal.Utility.hexFromRGB = function(r, g, b) {
	var hex = [ r.toString(16), g.toString(16), b.toString(16) ];
	jQuery.each(hex, function(nr, val) {
		if (val.length === 1) {
			hex[nr] = '0' + val;
		}
	});
	return hex.join('').toUpperCase();
};


OpenGeoportal.Utility.escapeQuotes = function(stringOfInterest) {
	return stringOfInterest.replace("'", "\\'").replace('"', '\\"');

};

OpenGeoportal.Utility.stripExtraSpaces = function(stringOfInterest) {
	return stringOfInterest.replace("\n", "").replace(/\s+/g, ' ');
};

OpenGeoportal.Utility.loadIndicatorStatus = [];// {selector: "",
// currentRequests: 0}; keep
// track of how many requests
// there are for this spinner

OpenGeoportal.Utility.getIndicatorStatus = function(selector, loadType) {
	var indicators = OpenGeoportal.Utility.loadIndicatorStatus;
	for ( var i in indicators) {
		if (indicators[i].selector === selector) {
			if (indicators[i].loadType === loadType){
				return indicators[i];
			}
		}
	}

	return {};
};

/**
 * show load indicator (spinner).  using HTML5 canvas "Spinner"
 * @param selector	jQuery selector
 * @param options
 */
OpenGeoportal.Utility.showLoadIndicator = function(selector, loadType, options) {
	/*
	 * Spinners methods:
	 * Spinners.create('.loading').play(); Spinners.get('.loading').pause();
	 * Spinners.get('.loading').stop(); Spinners.get('.loading').remove();
	 * Spinners.get(document.getElementById('mySpinner')).toggle();
	 */
	//console.log("showLoadIndicator called");
	var spinner = Spinners.get(selector);
	if (spinner.items().length === 0) {
		// create new spinner
		var params = {
			radius: 5,
			height : 5,
			width : 5,
			dashes : 8,
			color : '#4E4E4F'
		};

		if (typeof options !== "undefined") {
			params = jQuery.extend(params, options);
		}
		spinner = Spinners.create(selector, params);
	}

	spinner.play();

	var status = OpenGeoportal.Utility.getIndicatorStatus(selector, loadType);
	if (typeof status.currentRequests === "undefined") {
		OpenGeoportal.Utility.loadIndicatorStatus.push({
			selector : selector,
			loadType: loadType,
			currentRequests : 1
		});
	} else {
		status.currentRequests++;
	}

	jQuery(selector).fadeIn();
};

/**
 * hide the load indicator (spinner)
 * @param selector	jQuery selector
 */
OpenGeoportal.Utility.hideLoadIndicator = function(selector, loadType) {
	//console.log("hideLoadIndicator called");
	var status = OpenGeoportal.Utility.getIndicatorStatus(selector, loadType);
	if (typeof status.currentRequests !== "undefined") {
		if (status.currentRequests > 0) {
			status.currentRequests--;
		}
	}

	//TODO: if currentRequests === 0, remove the object
	//TODO: only stop the spinner if length of status array is 0
	if (typeof status.currentRequests === "undefined"
			|| status.currentRequests === 0) {
		jQuery(selector).fadeOut();

		var spinner = Spinners.get(selector);
		if (spinner.items().length !== 0) {
			spinner.stop();
		}
	}

};

OpenGeoportal.Utility.checkAddress = function(emailAddress) {
	var stringArray = emailAddress.split("@");
	if (stringArray.length < 2) {
		return false;
	} else {
		var domainArray = stringArray[1].split(".");
		var userString = stringArray[0];
		if (domainArray.length < 2) {
			return false;
		} else if ((domainArray[0].length + domainArray[1].length + userString.length) < 3) {
			return false;
		}
	}
	return true;

};

OpenGeoportal.Utility.pluralSuffix = function(totalNumber) {
	var plural;
	if (totalNumber > 1) {
		plural = "s";
	} else {
		plural = "";
	}
	return plural;
};

OpenGeoportal.Utility.doPrint = function() {
	window.print();
	// jQuery('head > link[href="css/print.css"]').remove();
};

OpenGeoportal.Utility.elementFlash = function(el$, offsetColor) {
	if (typeof offsetColor === "undefined") {
		offsetColor = "#0755AC";
	}
	var color = el$.css("color");
	el$.animate({
		color : offsetColor
	}, 125).animate({
		color : color
	}, 125).animate({
		color : offsetColor
	}, 125).animate({
		color : color
	}, 125);
};

OpenGeoportal.Utility.getScrollbarWidth = function() {
	if (!OpenGeoportal.Utility.requiresScrollbarAdjustment()) {
		return 0;
	}
	var outer, outerStyle, scrollbarWidth;
	outer = document.createElement('div');
	outerStyle = outer.style;
	outerStyle.position = 'absolute';
	outerStyle.width = '100px';
	outerStyle.height = '100px';
	outerStyle.overflow = "scroll";
	outerStyle.top = '-9999px';
	document.body.appendChild(outer);
	scrollbarWidth = outer.offsetWidth - outer.clientWidth;
	document.body.removeChild(outer);
	return scrollbarWidth;
};

OpenGeoportal.Utility.requiresScrollbarAdjustment = function() {
	var userAgent = window.navigator.userAgent;
	if (userAgent.indexOf("Macintosh") > 0) {
		return false;
	}

	return true;
};

OpenGeoportal.Utility.removeParams = function(url, paramArray) {
	var urlArray = url.split("?");
	var query = urlArray[1];
	var queryArr = query.split("&");
	for ( var i in queryArr) {
		for ( var j in paramArray) {

			if (queryArr[i].indexOf(paramArray[j]) === 0) {
				queryArr[i] = "";
			}
		}
	}

	return urlArray[0] + "?" + queryArr.join("&");
};

OpenGeoportal.Utility.compareUrls = function(url1, url2, ignoreParams) {
	var compareurl1 = OpenGeoportal.Utility.removeParams(url1, ignoreParams);

	var compareurl2 = OpenGeoportal.Utility.removeParams(url2, ignoreParams);
	if (compareurl1 === compareurl2) {
		return true;
	}
	return false;
};

OpenGeoportal.Utility.hasOneOf = function(object, keyArr) {
	var exists = false;
	for ( var i in keyArr) {
		if (_.has(keyArr, i)) {
			exists = exists || _.has(object, keyArr[i]);
		}
	}
	return exists;
};

OpenGeoportal.Utility.getLocationValue = function(location, keyArr) {
	var url = null;
	for ( var i in keyArr) {
		if (_.has(keyArr, i)) {
			if (_.has(location, keyArr[i])) {
				url = location[keyArr[i]];
				break;
			}
		}
	}

	if (_.isArray(url)) {
		url = url[0];
	}
	return url;
};

OpenGeoportal.Utility.getArrayToLower = function(arr) {
	var lowerArr = [];
	_.each(arr, function(element) {
		lowerArr.push(element.toLowerCase());
	});

	return lowerArr;
};

OpenGeoportal.Utility.arrayContainsIgnoreCase = function(arr, val) {
	var lcArr = OpenGeoportal.Utility.getArrayToLower(arr);
	var lcVal = val.toLowerCase();

	return (_.indexOf(lcArr, lcVal) >= 0);

};

OpenGeoportal.Utility.hasLocationValueIgnoreCase = function(location, keyArr) {

	var hasKey = false;
    var locArr = _.keys(location);

    _.each(keyArr, function (el) {
        _.each(locArr, function (el2) {
            if (el.toLowerCase() === el2.toLowerCase()) {
                hasKey = true;
            }
        });
    });


    return hasKey;
};

OpenGeoportal.Utility.StringHash = function (str) {

    /*    var hval = 0x811c9dc5;
     var fnv_32_prime = 0x01000193;
     var uint32_max = 2 * * 32;
     for (var i=0; i < str.length; i++) {
     hval = hval ^ ord(str.charAt(i));
     hval = (hval * fnv_32_prime) % uint32_max;
     }
     return hval*/

    var hash = 0;

    for (var i = 0; i < str.length; i++) {
        hash ^= str.charCodeAt(i);
        hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
    }
    return hash;

};

OpenGeoportal.Utility.getLocationValueIgnoreCase = function (location, key) {
    var locKeys = _.keys(location);
    var locKeysLower = OpenGeoportal.Utility.getArrayToLower(locKeys);

    var keyLower = key.toLowerCase();

    var j = _.indexOf(locKeysLower, keyLower);
    if (j >= 0) {
        return location[locKeys[j]];
	}

    throw new Error("Location key not found!");
};

OpenGeoportal.Utility.hasLocationValue = function(location, keyArr) {
	return !_.isNull(OpenGeoportal.Utility.getLocationValue(location, keyArr));
};

OpenGeoportal.Utility.calculateTextAreaRows = function(theText) {
	var numCharacters = theText.length;
	var rows = 1;
	if (numCharacters > 75) {
		rows = Math.floor(numCharacters / 40);
	}
	return rows;
};

OpenGeoportal.Utility.anchorsToNiceScroll = function(affectedDiv, offsetHash) {
	jQuery("#" + affectedDiv + " a.niceScroll").click(function(event) {
		event.preventDefault();
		// parse the hrefs for the anchors in this DOM element into toId
		var toId = jQuery(this).attr("href");
		jQuery("#" + affectedDiv).scrollTo(jQuery(toId), {
			offset : offsetHash
		});
	});
};


