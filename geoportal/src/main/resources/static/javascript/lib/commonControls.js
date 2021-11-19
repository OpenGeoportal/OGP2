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
 * Widgets constructor this object determines how to render controls
 * common across the application
 * 
 */
OpenGeoportal.Widgets = function Widgets() {

	this.template = OpenGeoportal.ogp.template;
	

	
	// *
	this.appendButton = function(parent$, buttonId, buttonLabel, clickHandler) {
		// var that = this;
		var html = this.template.genericButton({
			buttonId : buttonId,
			buttonLabel : buttonLabel
		});
		jQuery(html).appendTo(parent$).hide();
		var button$ = jQuery("#" + buttonId);
		button$.button({
			create : function(event, ui) {
				jQuery(this).show();
			}
		}).on("click", clickHandler);
		return button$;
	};
	// * * *
	this.prependButton = function(parent$, buttonId, buttonLabel, clickHandler) {
		var html = this.template.genericButton({
			buttonId : buttonId,
			buttonLabel : buttonLabel
		});
		jQuery(html).prependTo(parent$).hide();
		var button$ = jQuery("#" + buttonId);
		button$.button({
			create : function(event, ui) {
				jQuery(this).show();
			}
		}).on("click", clickHandler);
		return button$;
	};
	// * *
	this.genericModalDialog = function(customMessage, dialogTitle) {

		var divId = "genericModalDialog" + jQuery('.genericModalDialog').size();
		var div = '<div id="' + divId + '" class="dialog genericModalDialog">';
		div += customMessage;
		div += '</div>';
		jQuery('#dialogs').append(div);

		jQuery('#' + divId).dialog({
			zIndex : 2999,
			title : dialogTitle,
			resizable : true,
			modal : true,
			minWidth : 415,
			autoOpen : false
		});

		return jQuery('#' + divId).dialog('open');
	};

	// used in geoCommonsExport.js...anywhere else? *
	this.dialogTemplate = function dialogTemplate(dialogDivId, dialogContent,
			dialogTitle, buttonsObj) {
		if (typeof jQuery('#' + dialogDivId)[0] === 'undefined') {
			var dialogDiv = '<div id="' + dialogDivId + '" class="dialog"> \n';
			dialogDiv += dialogContent;
			dialogDiv += '</div>\n';
			jQuery('#dialogs').append(dialogDiv);
			jQuery("#" + dialogDivId).dialog({
				zIndex : 3000,
				autoOpen : false,
				width : 'auto',
				title : dialogTitle,
				resizable : true,
				buttons : buttonsObj
			});
		} else {
			// replace dialog text/controls & open the instance of 'dialog' that
			// already exists
			jQuery("#" + dialogDivId).html(dialogContent);
			jQuery("#" + dialogDivId).dialog("option", "buttons", buttonsObj);
		}
		jQuery("#" + dialogDivId).dialog('open');
	};

	this.iframeDownload = function(iframeClass, iframeSrc) {
		var newIframe = this.template.iframeDownload({
			iframeClass : iframeClass,
			iframeSrc : iframeSrc
		});
		var iframe$ = jQuery(newIframe).appendTo('#iframes');
		var timeout = 1 * 120 * 1000;// allow 2 minute for download before
		// iframe
		// is removed
		jQuery(document).on("iframeload", iframe$, function() {
			setTimeout(function() {
				iframe$.remove();
			}, timeout);
		});
	};


};