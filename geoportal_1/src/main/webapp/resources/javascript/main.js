/* This javascript module creates all the global objects, namespaces them
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
org.OpenGeoPortal.InstitutionInfo.getInstitutionInfo();
document.title = "GeoData@" + org.OpenGeoPortal.InstitutionInfo.getHomeInstitution();

var url = org.OpenGeoPortal.InstitutionInfo.getCustomCss();
if (document.createStyleSheet){
    document.createStyleSheet(url);
} else {
    jQuery('<link rel="stylesheet" type="text/css" href="' + url + '" />').appendTo('head'); 
}

jQuery(document).ready(function (){
	jQuery.noConflict();
	var javaScriptFileName = org.OpenGeoPortal.InstitutionInfo.getCustomJavaScript();
	if (javaScriptFileName.length > 0)
		jQuery.getScript(javaScriptFileName);
	
	org.OpenGeoPortal.layerState = new org.OpenGeoPortal.LayerSettings();
	org.OpenGeoPortal.map = new org.OpenGeoPortal.MapController();
	org.OpenGeoPortal.resultsTableObj = new org.OpenGeoPortal.LayerTable();
	org.OpenGeoPortal.cartTableObj = new org.OpenGeoPortal.LayerTable("savedLayersTable", "savedLayers");
	org.OpenGeoPortal.ui = new org.OpenGeoPortal.UserInterface();

	org.OpenGeoPortal.cartTableObj.hideCol("Save");
	org.OpenGeoPortal.cartTableObj.showCol("checkBox");
	org.OpenGeoPortal.ui.addSharedLayersToCart();
});

jQuery(window).unload(function(){
	jQuery.get("logout.jsp");
});
  