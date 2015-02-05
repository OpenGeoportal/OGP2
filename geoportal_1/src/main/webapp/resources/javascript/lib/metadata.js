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
 * MetadataViewer constructor: this object determines the behavior of the Metadata viewer  
 * @requires OpenGeoportal.Solr, OpenGeoportal.Utility, OpenGeoportal.Template
 */
OpenGeoportal.MetadataViewer = function MetadataViewer() {
	/*
	 * Metadata control
	 * 
	 */
	this.template = OpenGeoportal.Template;

	/*
	 * Metadata control
	 * 
	 */
	this.elId = "metadataDialogContent";
	
	this.viewMetadata = function(model) {
		var location = model.get("Location");
		var layerId = model.get("LayerId");
		// should store this somewhere else; some sort of
		// config
		var values = [ "metadataLink", "purl", "libRecord" ];
		if (OpenGeoportal.Utility.hasLocationValue(location, values)) {
			// display external metadata in an iframe
			var url = OpenGeoportal.Utility.getLocationValue(location, values);
			this.viewExternalMetadata(layerId, url);
		} else {
				this.viewMetadataFromOgp(layerId);
		}
	};
	

	this.viewExternalMetadata = function(layerId, url) {
		var document = this.template.get('genericIframe')({
			iframeSrc : url,
			iframeClass : "metadataIframe"
		});
		var dialog$ = this.renderMetadataDialog(layerId, document);
		dialog$.dialog("open");
	};
	
	this.viewMetadataFromOgp = function(layerId){
		try {
			
			var document = null;
			var params = {
					url: "getMetadata",
					data: {id: layerId},
					async: false,
					success: function(data){
						document = data;
					}
			}
			jQuery.ajax(params);

			var dialog$ = this.renderMetadataDialog(layerId, document);
			this.addMetadataDownloadButton(dialog$, layerId);
			//this.addFullscreenButton(dialog$);
			this.addScrollMetadataToTop();

			dialog$.dialog("open");
		} catch (e) {
			console.log(e);
			throw new Error("Error opening the metadata dialog.");
		}
	};


	this.renderMetadataDialog = function(layerId, document) {
		var dialogId = "metadataDialog";
		if (typeof jQuery('#' + dialogId)[0] == 'undefined') {
			jQuery('#dialogs').append(this.template.get('genericDialogShell')({
				elId : dialogId
			}));
		}

		var metadataDialog$ = jQuery("#" + dialogId);
		// should remove any handlers w/in #metadataDialog
		// can't pass the document directly into the template; it just evaluates
		// as a string
		metadataDialog$.html(this.template.get('metadataContent')({
			layerId : layerId,
			elId: this.elId
		})).find('#' + this.elId).append(document);
		try {
			metadataDialog$.dialog("destroy");
		} catch (e) {
		}

		var dialogHeight = 450;
		metadataDialog$.dialog({
			zIndex : 9999,
			width : 750,
			height : dialogHeight,
			title : "Metadata",
			autoOpen : false
		});

		return metadataDialog$;
	};

	this.addScrollMetadataToTop = function() {
		var content$ = jQuery('#'+ this.elId);
		content$.prepend(this.template.get('toMetadataTop')({content: "to top"}));
		content$[0].scrollTop = 0;

		// event handlers
		content$.find("a").click(function(event) {
			var toId = jQuery(this).attr("href");
			if (toId.indexOf("#") == 0) {
				event.preventDefault();
				// parse the hrefs for the anchors in this DOM element into toId
				// current xsl uses names instead of ids; yuck
				toId = toId.substring(1);
				content$.scrollTo(jQuery('[name="' + toId + '"]'));
			}
		});
		var that = this;
		jQuery("#toMetadataTop").on("click", function() {
			jQuery('#' + that.elId)[0].scrollTop = 0;
		});
	};

	this.addMetadataDownloadButton = function(metadataDialog$, layerId) {
		var buttonId = "metadataDownloadButton";
		if (jQuery("#" + buttonId).length == 0) {
			var params = {};
			params.displayClass = "ui-titlebar-button";
			params.buttonId = buttonId;
			params.buttonLabel = "Download Metadata (XML)";
			metadataDialog$.parent().find(".ui-dialog-titlebar").first()
					.prepend(this.template.get('dialogHeaderButton')(params));
			jQuery("#" + buttonId).button();
		}

		jQuery("#" + buttonId).off();
		var that = this;
		jQuery("#" + buttonId).on("click", function() {
			that.downloadMetadata(layerId);
		});
	};
	
	this.addFullscreenButton = function(metadataDialog$) {
		var buttonId = "metadataFullscreenButton";
		if (jQuery("#" + buttonId).length == 0) {
			var params = {};
			params.displayClass = "ui-titlebar-button fullscreen";
			params.buttonId = buttonId;
			params.buttonLabel = "";
			metadataDialog$.parent().find(".ui-dialog-titlebar").first()
					.prepend(this.template.get('dialogHeaderButton')(params));
			jQuery("#" + buttonId).button();
		}

		jQuery("#" + buttonId).off();
		var that = this;
		jQuery("#" + buttonId).on("click", function() {
			if (that.isFullscreen()){
				that.exitFullscreen();
			} else {
				that.enterFullscreen();
			}
		});
	};



	this.downloadMetadata = function downloadMetadata(layerId) {
		var iframeSource = "getMetadata/xml?download=true&id=" + layerId;
		this.iframeDownload("metadataDownloadIframe", iframeSource);

		// this.analytics.track("Metadata", "Download Metadata", layerId);
	};

	this.iframeDownload = function(iframeClass, iframeSrc) {
		var newIframe = this.template.get('iframeDownload')({
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

	// handles jsonp response from request for metadata call
	this.viewMetadataJsonpError = function() {
		throw new Error(
				"The attempt to retrieve metadata for this layer failed.");
	};

	this.goToExternal = function(url) {
		window.open(url);

	};
	
	this.enterFullscreen = function(){
		var i = document.getElementById(this.elId);
		 
		// go full-screen
		if (i.requestFullscreen) {
		    i.requestFullscreen();
		} else if (i.webkitRequestFullscreen) {
		    i.webkitRequestFullscreen();
		} else if (i.mozRequestFullScreen) {
		    i.mozRequestFullScreen();
		} else if (i.msRequestFullscreen) {
		    i.msRequestFullscreen();
		}
	};
	
	this.isFullscreen = function(){
		var el =
			    document.fullscreenElement ||
			    document.webkitFullscreenElement ||
			    document.mozFullScreenElement ||
			    document.msFullscreenElement || null;
		if (el !== null && el.id == this.elId){
			return true;
		}
			return false;
		
	};
	
	this.exitFullscreen = function(){
		// exit full-screen
		if (document.exitFullscreen) {
		    document.exitFullscreen();
		} else if (document.webkitExitFullscreen) {
		    document.webkitExitFullscreen();
		} else if (document.mozCancelFullScreen) {
		    document.mozCancelFullScreen();
		} else if (document.msExitFullscreen) {
		    document.msExitFullscreen();
		}	
	};
	

};