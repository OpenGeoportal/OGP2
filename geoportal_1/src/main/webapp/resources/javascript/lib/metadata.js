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

	this.model = null;

	this.setModel = function (model) {
		if (this.model !== null && this.model !== model) {
			this.model.set("selected", false);
		}

		this.model = model;
	};


	this.viewMetadata = function (model) {

		this.setModel(model);
		var location = model.get("Location");

		this.deferred = jQuery.Deferred();

		// should store this somewhere else; some sort of
		// config
		var values = ["metadataLink", "purl", "libRecord"];
		if (OpenGeoportal.Utility.hasLocationValue(location, values)) {
			// display external metadata in an iframe
			var url = OpenGeoportal.Utility.getLocationValue(location, values);
			this.viewExternalMetadata(model, url);
		} else {
			this.viewMetadataFromOgp(model);
		}

		return this.deferred.promise();
	};

	this.next = function () {
		this.goto(this.getIndex(this.model) + 1);

	};

	this.prev = function () {
		this.goto(this.getIndex(this.model) - 1);
	};

	this.getIndex = function (model) {
		return model.collection.indexOf(model);
	};

	this.goto = function (indexNum) {
		var nextmodel = this.model.collection.at(indexNum);
		if (typeof nextmodel != "undefined") {
			this.viewMetadata(nextmodel);
		} else {
			console.log("no results at: " + indexNum);
			//should make a solr request
		}
	};

	this.viewExternalMetadata = function (model, url) {
		var layerId = model.get("LayerId");
		var document = this.template.get('genericIframe')({
			iframeSrc: url,
			iframeClass: "metadataIframe"
		});
		var $dialog = this.renderMetadataDialog(layerId, document);
		$dialog.dialog("open");

	};

	this.viewMetadataFromOgp = function (model) {
		var layerId = model.get("LayerId");

		try {

			var document = null;
			var params = {
				url: "layer/" + layerId,
				async: false,
				success: function (data) {
					document = data;
				}
			};
			jQuery.ajax(params);

			var $dialog = this.renderMetadataDialog(layerId, document);
			this.addMetadataDownloadButton($dialog, layerId);
			//this.addFullscreenButton($dialog);
			//this.addPagingButtons($dialog);
			this.addScrollMetadataToTop();

			$dialog.dialog("open");
			this.ellipsisHandler($dialog);

		} catch (e) {
			this.model.set("selected", false);
			console.log(e);
			throw new Error("Error opening the metadata dialog.");
		}
	};

	this.ellipsisHandler = function ($dialog) {
		var $desc = $dialog.find(".metadataDescription");
		if ($desc.length === 0) {
			console.log("metadata description not found");
			return;
		}


		this.renderEllipsis($desc);
		var that = this;

		$desc.on("resize", function () {
			that.renderEllipsis($desc);
		});


	};


	this.renderEllipsis = function ($desc) {

		if ($desc.get(0).scrollHeight > $desc.height()) {

			if ($desc.find(".moreWords").length === 0) {
				var more = "more...";
				var less = "less...";
				$('<a class="moreWords offsetColor">' + more + '</a>').insertAfter($desc).click(function () {
					$desc.toggleClass("unelided");

					if ($(this).text() === more) {
						$(this).text(less);
					} else {
						$(this).text(more);
					}
				});
			}
		} else {
			if ($desc.find(".moreWords").length !== 0) {
				$desc.find(".moreWords").remove();
				if ($desc.hasClass("unelided")) {
					$desc.removeClass("unelided");
				}
			}


		}
	};

	this.renderMetadataDialog = function(layerId, document) {
		var dialogId = "metadataDialog";
		if (typeof jQuery('#' + dialogId)[0] == 'undefined') {
			jQuery('#dialogs').append(this.template.get('genericDialogShell')({
				elId : dialogId
			}));
		}

		var $metadataDialog = jQuery("#" + dialogId);
		// should remove any handlers w/in #metadataDialog
		// can't pass the document directly into the template; it just evaluates
		// as a string
		$metadataDialog.html(this.template.get('metadataContent')({
			layerId : layerId,
			elId: this.elId
		})).find('#' + this.elId).append(document);
		try {
			$metadataDialog.dialog("destroy");
		} catch (e) {
		}

		var dialogHeight = 450;
		var that = this;

		$metadataDialog.dialog({
			zIndex : 9999,
			width : 750,
			height : dialogHeight,
			title : "Metadata",
			autoOpen: false,
			beforeClose: function () {
				that.model.set("selected", false);
			},
			open: function () {
				$metadataDialog.scrollTo(0);
				that.model.set("selected", true);
				that.deferred.resolve("opened");
			}
		});

		return $metadataDialog;
	};

	this.addScrollMetadataToTop = function() {
		var $content = jQuery('#' + this.elId);
		$content.prepend(this.template.get('toMetadataTop')({content: "to top"}));
		$content[0].scrollTop = 0;

		// event handlers
		$content.find("a").click(function (event) {
			var toId = jQuery(this).attr("href");
			if (toId.indexOf("#") == 0) {
				event.preventDefault();
				// parse the hrefs for the anchors in this DOM element into toId
				toId = toId.substring(1);
				$content.scrollTo(jQuery('[id="' + toId + '"]'));
			}
		});
		var that = this;
		jQuery("#toMetadataTop").on("click", function() {
			jQuery('#' + that.elId)[0].scrollTop = 0;
		});
	};

	this.addMetadataDownloadButton = function ($metadataDialog, layerId) {
		var buttonId = "metadataDownloadButton";
		if (jQuery("#" + buttonId).length == 0) {
			var params = {};
			params.displayClass = "ui-titlebar-button";
			params.buttonId = buttonId;
			params.buttonLabel = "Download Metadata (XML)";
			$metadataDialog.parent().find(".ui-dialog-titlebar").first()
					.prepend(this.template.get('dialogHeaderButton')(params));
			jQuery("#" + buttonId).button();
		}

		jQuery("#" + buttonId).off();
		var that = this;
		jQuery("#" + buttonId).on("click", function() {
			that.downloadMetadata(layerId);
		});
	};

	this.addFullscreenButton = function ($metadataDialog) {
		var buttonId = "metadataFullscreenButton";
		if (jQuery("#" + buttonId).length == 0) {
			var params = {};
			params.displayClass = "ui-titlebar-button fullscreen";
			params.buttonId = buttonId;
			params.buttonLabel = "";
			$metadataDialog.parent().find(".ui-dialog-titlebar").first()
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

	this.addPagingButtons = function ($metadataDialog) {
		var divClass = "metadata-paging";
		if (jQuery("." + divClass).length == 0) {
			var params = {};
			params.elClass = divClass;
			$metadataDialog.parent().find(".metadataDialogContent")
				.prepend(this.template.get('divNoId')(params));
		}

		this.addPrevButton($metadataDialog);
		this.addNextButton($metadataDialog);

	};

	this.addNextButton = function ($metadataDialog) {
		var buttonId = "metadataNextButton";
		if (jQuery("#" + buttonId).length == 0) {
			var params = {};
			params.displayClass = "metadata-next";
			params.buttonId = buttonId;
			params.buttonLabel = ">";
			$metadataDialog.parent().find(".metadata-paging")
				.append(this.template.get('dialogHeaderButton')(params));
			jQuery("#" + buttonId).button();
		}

		jQuery("#" + buttonId).off();
		var that = this;
		jQuery("#" + buttonId).on("click", function () {
			that.next();
		});
	};

	this.addPrevButton = function ($metadataDialog) {
		var buttonId = "metadataPrevButton";
		if (jQuery("#" + buttonId).length == 0) {
			var params = {};
			params.displayClass = "metadata-prev";
			params.buttonId = buttonId;
			params.buttonLabel = "<";
			$metadataDialog.parent().find(".metadata-paging")
				.append(this.template.get('dialogHeaderButton')(params));
			jQuery("#" + buttonId).button();
		}

		jQuery("#" + buttonId).off();
		var that = this;
		jQuery("#" + buttonId).on("click", function () {
			that.prev();
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
		var $iframe = jQuery(newIframe).appendTo('#iframes');
		var timeout = 1 * 120 * 1000;// allow 2 minute for download before
		// iframe
		// is removed
		jQuery(document).on("iframeload", $iframe, function () {
			setTimeout(function() {
				$iframe.remove();
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