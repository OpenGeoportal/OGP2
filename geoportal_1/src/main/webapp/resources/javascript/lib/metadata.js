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
	this.template = OpenGeoportal.ogp.template;

	/*
	 * Metadata control
	 * 
	 */

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
		var document = this.template.genericIframe({
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
			jQuery('#dialogs').append(this.template.genericDialogShell({
				elId : dialogId
			}));
		}

		var metadataDialog$ = jQuery("#" + dialogId);
		// should remove any handlers w/in #metadataDialog
		// can't pass the document directly into the template; it just evaluates
		// as a string
		metadataDialog$.html(this.template.metadataContent({
			layerId : layerId
		})).find("#metadataContent").append(document);
		try {
			metadataDialog$.dialog("destroy");
		} catch (e) {
		}

		var dialogHeight = 400;
		metadataDialog$.dialog({
			zIndex : 9999,
			width : 630,
			height : dialogHeight,
			title : "Metadata",
			autoOpen : false
		});

		return metadataDialog$;
	};

	this.addScrollMetadataToTop = function() {
		var content$ = jQuery("#metadataContent");
		content$.prepend(this.template.toMetadataTop());
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

		jQuery("#toMetadataTop").on("click", function() {
			jQuery("#metadataContent")[0].scrollTop = 0;
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
					.prepend(this.template.dialogHeaderButton(params));
			jQuery("#" + buttonId).button();
		}

		jQuery("#" + buttonId).off();
		var that = this;
		jQuery("#" + buttonId).on("click", function() {
			that.downloadMetadata(layerId);
		});
	};



	this.downloadMetadata = function downloadMetadata(layerId) {
		var iframeSource = "getMetadata/xml?download=true&id=" + layerId;
		this.iframeDownload("metadataDownloadIframe", iframeSource);

		// this.analytics.track("Metadata", "Download Metadata", layerId);
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

	// handles jsonp response from request for metadata call
	this.viewMetadataJsonpError = function() {
		throw new Error(
				"The attempt to retrieve metadata for this layer failed.");
	};

	this.goToExternal = function(url) {
		window.open(url);

	};
	
	/* client side metadata transform*/
	/*
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
			this.viewMetadataFromSolr(layerId);
		}
	};
	// obtain layer's metadata via jsonp call
	this.viewMetadataFromSolr = function(layerId) {
		// make an ajax call to retrieve metadata
		var solr = new OpenGeoportal.Solr();
		var url = solr.getServerName() + "?"
				+ jQuery.param(solr.getMetadataParams(layerId));
		var query = solr.sendToSolr(url, this.viewMetadataJsonpSuccess,
				this.viewMetadataJsonpError, this);

		// this.analytics.track("Metadata", "Display Metadata", layerId);
	};

	this.viewExternalMetadata = function(layerId, url) {
		var document = this.template.genericIframe({
			iframeSrc : url,
			iframeClass : "metadataIframe"
		});
		var dialog$ = this.renderMetadataDialog(layerId, document);
		dialog$.dialog("open");
	};

	this.processMetadataSolrResponse = function(data) {
		var solrResponse = data.response;
		var totalResults = solrResponse.numFound;
		if (totalResults != 1) {
			throw new Error("Request for Metadata returned " + totalResults
					+ ".  Exactly 1 was expected.");
			return;
		}
		var doc = solrResponse.docs[0]; // get the first layer object
		return doc;
	};
	// handles jsonp response from request for metadata call
	this.viewMetadataJsonpSuccess = function(data) {
		try {
			var doc = this.processMetadataSolrResponse(data);
			var metadataRawText = doc.FgdcText;
			var layerId = doc.LayerId;

			var xmlDocument = null;
			try {
				xmlDocument = jQuery.parseXML(metadataRawText);
			} catch (e) {
				throw new Error(
						"Error parsing returned XML: the document may be invalid.");
			}
			var document = null;
			try {
				document = this.renderXmlMetadata(xmlDocument);
			} catch (e) {
				throw new Error(
						"Error transforming XML document: the document may be of the wrong type.");
			}
			var dialog$ = this.renderMetadataDialog(layerId, document);
			this.addMetadataDownloadButton(dialog$, layerId);
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
			jQuery('#dialogs').append(this.template.genericDialogShell({
				elId : dialogId
			}));
		}

		var metadataDialog$ = jQuery("#" + dialogId);
		// should remove any handlers w/in #metadataDialog
		// can't pass the document directly into the template; it just evaluates
		// as a string
		metadataDialog$.html(this.template.metadataContent({
			layerId : layerId
		})).find("#metadataContent").append(document);
		try {
			metadataDialog$.dialog("destroy");
		} catch (e) {
		}

		var dialogHeight = 400;
		metadataDialog$.dialog({
			zIndex : 9999,
			width : 630,
			height : dialogHeight,
			title : "Metadata",
			autoOpen : false
		});

		return metadataDialog$;
	};

	this.addScrollMetadataToTop = function() {
		var content$ = jQuery("#metadataContent");
		content$.prepend(this.template.toMetadataTop());
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

		jQuery("#toMetadataTop").on("click", function() {
			jQuery("#metadataContent")[0].scrollTop = 0;
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
					.prepend(this.template.dialogHeaderButton(params));
			jQuery("#" + buttonId).button();
		}

		jQuery("#" + buttonId).off();
		var that = this;
		jQuery("#" + buttonId).on("click", function() {
			that.downloadMetadata(layerId);
		});
	};

	this.renderXmlMetadata = function(xmlMetadataDocument) {
		var url = this.chooseStyleSheet(xmlMetadataDocument);
		var xslDocument = this.retrieveStyleSheet(url);
		return this.transformXml(xmlMetadataDocument, xslDocument);
	};

	this.chooseStyleSheet = function(metadataDocument) {
		var stylesheetPath = "resources/xml/";
		var ISO_19139_styleSheet = "isoBasic.xsl";
		var FGDC_styleSheet = "FGDC_V2_a.xsl";
		var xslUrl = null;

		if (metadataDocument.firstChild.localName == "MD_Metadata") {
			// ISO 19139 stylesheet
			xslUrl = ISO_19139_styleSheet;
		} else {
			// FGDC stylesheet
			xslUrl = FGDC_styleSheet;
		}
		xslUrl = stylesheetPath + xslUrl;

		return xslUrl;
	};

	this.retrieveStyleSheet = function(url) {
		var styleSheet = null;

		var params = {
			url : url,
			async : false,
			dataType : 'xml',
			success : function(data) {
				styleSheet = data;
			}
		};
		jQuery.ajax(params);
		return styleSheet;
	};

	this.transformXml = function(xmlDocument, styleSheet) {
		var resultDocument = null;
		if (styleSheet !== null) {
			if (window.ActiveXObject) {
				// IE
				resultDocument = xmlDocument.transformNode(styleSheet);
			} else {
				var xsltProcessor = new XSLTProcessor();
				xsltProcessor.importStylesheet(styleSheet);
				resultDocument = xsltProcessor.transformToFragment(xmlDocument,
						window.document);
			}
		}
		return resultDocument;
	};

	this.downloadMetadata = function downloadMetadata(layerId) {
		var iframeSource = "getMetadata/download?id=" + layerId;
		OpenGeoportal.ogp.widgets.iframeDownload("metadataDownloadIframe", iframeSource);

		// this.analytics.track("Metadata", "Download Metadata", layerId);
	};
	
	// handles jsonp response from request for metadata call
	this.viewMetadataJsonpError = function() {
		throw new Error(
				"The attempt to retrieve metadata for this layer failed.");
	};
	*/
};