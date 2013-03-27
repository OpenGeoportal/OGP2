if (typeof OpenGeoportal == 'undefined'){
	OpenGeoportal = {};
} else if (typeof OpenGeoportal != "object"){
    throw new Error("OpenGeoportal already exists and is not an object");
}

OpenGeoportal.ErrorObject = function(errObj, customMessage){
	var debug = false;
	if (typeof jQuery('#errorDialog')[0] == 'undefined'){
		var div = '<div id="errorDialog" class="dialog">';
		div += '<p>';
		if (debug){
			div += 'An Error has occured in the following function:';
			div += '<br />';
			div += '<textarea rows="5" cols="80">' + arguments.callee.caller + '</textarea>';
			div += '<br />';
			div += errObj.name + ": " + errObj.message;
			div += '<br />';
		}
		div += customMessage;
		div += '</p>';
		div += '</div>';
		jQuery('body').append(div);
		jQuery('#errorDialog').dialog({
    		zIndex: 2999,
    		width: 550,
    		resizable: false,
    		autoOpen: false		
		});
	}
	jQuery('#errorDialog').dialog('open');
};

OpenGeoportal.ErrorObject.prototype = new Error();

