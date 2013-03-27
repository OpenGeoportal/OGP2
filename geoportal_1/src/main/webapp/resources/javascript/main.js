/* This javascript module creates all the global objects, namespaces them
 * 
 * author: Chris Barnett
 * 
 */

if (typeof OpenGeoportal == 'undefined'){
	OpenGeoportal = {};
} else if (typeof OpenGeoportal != "object"){
    throw new Error("OpenGeoportal already exists and is not an object");
}

OpenGeoportal.init = function(){
	OpenGeoportal.InstitutionInfo.getInstitutionInfo();
	document.title = "GeoData@" + OpenGeoportal.InstitutionInfo.getHomeInstitution();

	//we do this here so that we can try to get the css before the document is ready (should we do this in the jsp instead?)
	var url = OpenGeoportal.InstitutionInfo.getCustomCss();
	if (document.createStyleSheet){
		document.createStyleSheet(url);
	} else {
		jQuery('<link rel="stylesheet" type="text/css" href="' + url + '" />').appendTo('head'); 
	}
};

OpenGeoportal.init();

jQuery(document).ready(function (){
	jQuery.noConflict();
	var javaScriptFileName = OpenGeoportal.InstitutionInfo.getCustomJavaScript();
	if (javaScriptFileName.length > 0){
		jQuery.getScript(javaScriptFileName);
	}
	//ogp will hold instances
	OpenGeoportal.ogp = {};
	var ogp = OpenGeoportal.ogp;	//an alias
	
	ogp.appState = new OpenGeoportal.OgpSettings();
	
	ogp.map = new OpenGeoportal.MapController();
	ogp.map.createMap();
	
	ogp.resultsTableObj = new OpenGeoportal.LayerTable(ogp.appState);
	ogp.resultsTableObj.initTable("searchResults");

	ogp.cartTableObj = new OpenGeoportal.LayerTable(ogp.appState);
	ogp.cartTableObj.initTable("cart");
	
	ogp.ui = new OpenGeoportal.UserInterface();
	ogp.ui.init();

	ogp.cartTableObj.hideCol("Save");
	ogp.cartTableObj.showCol("checkBox");
	ogp.cartTableObj.addToCart = function(){
		var that = this;
		jQuery(document).on('addToCart', aData, function(){
			var savedTable = that.getTableObj();
			var currentData = savedTable.fnGetData();
			var newData = aData.concat(currentData);
			savedTable.fnClearTable();
			savedTable.fnAddData(newData);
		});
	 };
	 
	ogp.ui.addSharedLayersToCart();
	
	ogp.downloadQueue = new OpenGeoportal.Downloader();
	
	var welcome = '<div id="welcomeText" class="welcomeText">'
		+ '<h1>Welcome</h1>'
		+ '<p>'
		+ 'There are two ways to begin your search:'
		+	'</p>' 
		+ '<ol>'
		+ '<li>'
		+ 'Enter information using one or both search fields.'
		+ '</li>'
		+ '<li>'
		+ 'Zoom in on a location using the map.'
		+ '</li>'
		+ '</ol>'
		+ '</div>';
	var params = {"height": 335,
				"width": 700,
				"top": 259,
				"left": 269,
				"arrow": "top"};
	ogp.ui.infoBubble(welcome, params);

	/*downtime notice */
	/*var downtimeText = "Layers will be unavailable until later this afternoon while we perform server maintenance. We apologize for the inconvenience.";
	var downtimeDiv = '<div id="downtimeNotice" class="dialog infoDialog"><p>' + downtimeText + '</p></div>';
	jQuery("body").append(downtimeDiv);
	jQuery('#downtimeNotice').dialog({
		zIndex: 2999,
		title: "Downtime",
		resizable: false,
		minWidth: 415,
		autoOpen: false		
	});
	jQuery("#downtimeNotice").dialog("open");
	*/
});
  