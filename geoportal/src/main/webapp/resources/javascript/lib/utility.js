/* This javascript module includes utility functions for OpenGeoPortal plus
 * extra functions with no current home. OpenGeoportal.Utility is a
 * namespace rather than an object.  The XML functions might go away when we
 * upgrade to a newer version of jQuery, as it contains functions to parse XML.
 * 
 * author: Chris Barnett
 * 
 */

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

OpenGeoportal.Utility.ImageLocation = "resources/media/";
OpenGeoportal.Utility.CssLocation = "resources/css/";
OpenGeoportal.Utility.JspfLocation = "jspf/";

OpenGeoportal.Utility.InitSet = false;

OpenGeoportal.Utility.getImage = function(imageName) {
	return OpenGeoportal.Utility.ImageLocation + imageName;
};

OpenGeoportal.Utility.CurrentTab = 0;
/*OpenGeoportal.Utility.whichTab = function() {
	var tabInfo = {};
	var tabIndex;
	if (arguments.length > 0) {
		tabIndex = arguments[0];
	} else {
		tabIndex = OpenGeoportal.Utility.CurrentTab;
	}
	tabInfo.index = tabIndex;
	switch (tabIndex) {
	case 0:
		tabInfo.name = 'search';
		tabInfo.tableObject = function() {
			return OpenGeoportal.ogp.resultsTableObj;
		};
		tabInfo.tableDiv = 'resultsTable';
		tabInfo.tableName = 'searchResults';
		break;
	case 1:
		tabInfo.name = 'saved';
		tabInfo.tableObject = function() {
			return OpenGeoportal.ogp.cartTableObj;
		};
		tabInfo.tableDiv = 'savedLayersTable';
		tabInfo.tableName = 'savedLayers';
		break;
	default:
		// throw new Error('No tab is selected.');
	}
	return tabInfo;
};
*/
/*OpenGeoportal.Utility.whichSearch = function() {
	var activeSearchDiv = null;
	jQuery(".searchBox > div").each(function() {
		if (jQuery(this).css("display") == 'block') {
			activeSearchDiv = jQuery(this).attr("id");
		}
	});
	var searchInfo = {};
	// searchInfo.script = 'solrSearchHandler.jsp';
	switch (activeSearchDiv) {
	case "basicSearchBox":
		searchInfo.type = 'basicSearch';
		break;
	case "advancedSearchBox":
		searchInfo.type = 'advancedSearch';
		break;
	default:
		// throw new Error('No tab is selected.');
	}
	return searchInfo;
};*/
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
			bool = item == "true";
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
		if (val.length == 1) {
			hex[nr] = '0' + val;
		}
	});
	return hex.join('').toUpperCase();
};

/*OpenGeoportal.Utility.idEscape = function(domElementId) {
	return domElementId.replace(/(:|\.)/g, '\\$1');
};*/

/*
 * OpenGeoportal.Utility.getMetadata = function (layerId){ var params = { url:
 * "getMetadata.jsp?layer=" + layerId, dataType: 'xml', success: function(data){
 * console.log(data); } }; jQuery.ajax(params); };
 */

OpenGeoportal.Utility.escapeQuotes = function(stringOfInterest) {
	return stringOfInterest.replace("'", "\\'").replace('"', '\\"');

};

OpenGeoportal.Utility.stripExtraSpaces = function(stringOfInterest) {
	return stringOfInterest.replace("\n", "").replace(/\s+/g, ' ');
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

	var keyArrLower = OpenGeoportal.Utility.getArrayToLower(_.keys(location));
	var lowerArr = OpenGeoportal.Utility.getArrayToLower(keyArr);

	var hasKey = false;

	for ( var i in lowerArr) {
		if (_.has(lowerArr, i)) {

			if (_.indexOf(keyArrLower, lowerArr[i]) >= 0) {
				hasKey = true;
			}

		}
	}

	return hasKey;
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

OpenGeoportal.Utility.createSLD = function(sldParams) {
        var layerName = sldParams.layerName;
	var layerType = sldParams.layerType;
	var fillColor = sldParams.fillColor;
	var strokeColor = sldParams.strokeColor;
	var strokeWidth = sldParams.strokeWidth;

        var baseXML = '<sld:StyledLayerDescriptor xmlns:sld="http://www.opengis.net/sld" version="1.0.0" xsi:schemaLocation="http://www.opengis.net/sld http://schemas.opengis.net/sld/1.0.0/StyledLayerDescriptor.xsd" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:ogc="http://www.opengis.net/ogc" xmlns:gml="http://www.opengis.net/gml"></sld:StyledLayerDescriptor>';
       
        parser = new DOMParser();
       
        xmlDoc = parser.parseFromString(baseXML, "text/xml");

        var namedLayerTag = xmlDoc.createElement("sld:NamedLayer")

        var rootTag = xmlDoc.getElementsByTagName("sld:StyledLayerDescriptor")[0];
	//Chrome not identifying element with it's namespace
	if (rootTag == null || !rootTag) {
		rootTag = xmlDoc.getElementsByTagName("StyledLayerDescriptor");
	}
        var nameTag = xmlDoc.createElement("sld:Name");
       
        var nameValue = xmlDoc.createTextNode(sldParams.layerName);
        nameTag.appendChild(nameValue);
       
        var userStyleTag = xmlDoc.createElement("sld:UserStyle");
        namedLayerTag.appendChild(nameTag);
        namedLayerTag.appendChild(userStyleTag);
       
        var featureStyleTypeTag = xmlDoc.createElement("sld:FeatureTypeStyle");
        userStyleTag.appendChild(featureStyleTypeTag);
       
        var ruleTag = xmlDoc.createElement("sld:Rule");
        featureStyleTypeTag.appendChild(ruleTag);

        if (layerType == "point") {
            var pointSymbolizerTag = xmlDoc.createElement("sld:PointSymbolizer");
            ruleTag.appendChild(pointSymbolizerTag);
           
            var graphicTag = xmlDoc.createElement("sld:Graphic");
            pointSymbolizerTag.appendChild(graphicTag);
           
            var markTag = xmlDoc.createElement("sld:Mark");
            graphicTag.appendChild(markTag);
           
            var wellKnownNameTag = xmlDoc.createElement("sld:WellKnownName");
            wellKnownNameValue = xmlDoc.createTextNode("circle");
            wellKnownNameTag.appendChild(wellKnownNameValue);
            markTag.appendChild(wellKnownNameTag);
           
            var fillTag = xmlDoc.createElement("sld:Fill");
            markTag.appendChild(fillTag);
           
            var cssParameterTag_Fill = xmlDoc.createElement("sld:CssParameter");
            cssParameterTag_Fill.setAttribute("name","fill");
            cssParameterTag_FillValue = xmlDoc.createTextNode(sldParams.fillColor);
            cssParameterTag_Fill.appendChild(cssParameterTag_FillValue);
            fillTag.appendChild(cssParameterTag_Fill);
           
            if (sldParams.strokeWidth > 2) {
		var strokeWidth = 1;
                var strokeTag = xmlDoc.createElement("sld:Stroke");
                markTag.appendChild(strokeTag);
                var cssParameterTag_Stroke = xmlDoc.createElement("sld:CssParameter");
		cssParameterTag_Stroke.setAttribute("name", "stroke");
                cssParameterTag_StrokeValue = xmlDoc.createTextNode(sldParams.strokeColor);
                cssParameterTag_Stroke.appendChild(cssParameterTag_StrokeValue);
                strokeTag.appendChild(cssParameterTag_Stroke);
           
           
                var cssParameterTag_StrokeWidth = xmlDoc.createElement("sld:CssParameter");
                cssParameterTag_StrokeWidth.setAttribute("name", "stroke-width");
                cssParameterTag_StrokeWidthValue = xmlDoc.createTextNode(strokeWidth);
                cssParameterTag_StrokeWidth.appendChild(cssParameterTag_StrokeWidthValue)
                strokeTag.appendChild(cssParameterTag_StrokeWidth);
            }
           
            var sizeTag = xmlDoc.createElement("sld:Size");
            sizeTagValue = xmlDoc.createTextNode(sldParams.strokeWidth);
            sizeTag.appendChild(sizeTagValue);
            graphicTag.appendChild(sizeTag);
        }
       
        else if (layerType == "line") {
            var lineSymbolizerTag = xmlDoc.createElement("sld:LineSymbolizer");
            ruleTag.appendChild(lineSymbolizerTag);
           
            var strokeTag = xmlDoc.createElement("sld:Stroke");
            lineSymbolizerTag.appendChild(strokeTag);
           
            var cssParameterTag_Stroke = xmlDoc.createElement("sld:CssParameter")
            cssParameterTag_Stroke.setAttribute("name","stroke");
            cssParameterTag_StrokeValue = xmlDoc.createTextNode(sldParams.strokeColor);
            cssParameterTag_Stroke.appendChild(cssParameterTag_StrokeValue);
            strokeTag.appendChild(cssParameterTag_Stroke);
           
            var cssParameterTag_StrokeWidth = xmlDoc.createElement("sld:CssParameter");
            cssParameterTag_StrokeWidth.setAttribute("name","stroke-width");
            cssParameterTag_StrokeWidthValue = xmlDoc.createTextNode(sldParams.strokeWidth);
            cssParameterTag_StrokeWidth.appendChild(cssParameterTag_StrokeWidthValue);
            strokeTag.appendChild(cssParameterTag_StrokeWidth);
           
        }
       
        else if (layerType == "polygon") {
            var polygonSymbolizerTag = xmlDoc.createElement("sld:PolygonSymbolizer");
            ruleTag.appendChild(polygonSymbolizerTag);
           
            var fillTag = xmlDoc.createElement("sld:Fill");
            polygonSymbolizerTag.appendChild(fillTag);
           
            var cssParameterTag_Fill = xmlDoc.createElement("sld:CssParameter");
            cssParameterTag_Fill.setAttribute("name","fill");
            var cssParameterTag_FillValue = xmlDoc.createTextNode(sldParams.fillColor);
            cssParameterTag_Fill.appendChild(cssParameterTag_FillValue);
            fillTag.appendChild(cssParameterTag_Fill);
           
            var strokeTag = xmlDoc.createElement("sld:Stroke");
            polygonSymbolizerTag.appendChild(strokeTag);
           
            var cssParameterTag_Stroke = xmlDoc.createElement("sld:CssParameter");
            var cssParameterTag_StrokeWidth = xmlDoc.createElement("sld:CssParameter");
            cssParameterTag_Stroke.setAttribute("name","stroke");
            cssParameterTag_StrokeWidth.setAttribute("name","stroke-width");
            cssParameterTag_StrokeValue = xmlDoc.createTextNode(sldParams.strokeColor);
            cssParameterTag_StrokeWidthValue = xmlDoc.createTextNode(sldParams.strokeWidth);
            cssParameterTag_Stroke.appendChild(cssParameterTag_StrokeValue);
            cssParameterTag_StrokeWidth.appendChild(cssParameterTag_StrokeWidthValue);
            strokeTag.appendChild(cssParameterTag_Stroke);
            strokeTag.appendChild(cssParameterTag_StrokeWidth);       
        }
	$(rootTag).append(namedLayerTag);
        var serializer = new XMLSerializer();
        var xmlString = serializer.serializeToString(xmlDoc)
             
        return xmlString;
}


