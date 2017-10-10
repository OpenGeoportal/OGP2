if (typeof OpenGeoportal === 'undefined') {
	OpenGeoportal = {};
} else if (typeof OpenGeoportal !== "object") {
	throw new Error("OpenGeoportal already exists and is not an object");
}

if (typeof OpenGeoportal.Views === 'undefined') {
	OpenGeoportal.Views = {};
} else if (typeof OpenGeoportal.Views !== "object") {
	throw new Error("OpenGeoportal.Views already exists and is not an object");
}

/**
 * A Backbone View of the Cart Collection
 * 
 * @constructor
 */

OpenGeoportal.Views.ShareCart = OpenGeoportal.Views.CartActionView
		.extend({
			
			cartAction : function() {

				var arrModels = this.getApplicableLayers();
				// filter the cart collection and retrieve those that can be
				// shared

				var arrIds = [];
				_.each(arrModels, function(model) {
					arrIds.push(model.get("LayerId"));
				});

				var dialogContent = "";
				if (arrIds.length === 0) {
					dialogContent = 'No layers have been selected.';
					// this should probably call a dialog instance for error
					// messages/notifications
				} else {
					var path = top.location.href.substring(0, top.location.href
							.lastIndexOf("/"));
					var shareLink = path + "/";
					var visibleExtent = OpenGeoportal.ogp.map.getBounds().toBBoxString();
					var queryString = '?' + jQuery.param({
						ogpids : arrIds.join(),
						bbox : visibleExtent
					});
					shareLink += queryString;

					dialogContent = '<textarea id="shareText" class="linkText" ></textarea> \n';
					dialogContent += '<p>Use this link to share this Cart</p>';
					this.getShortLink(shareLink);
				}

				var dialog$ = this.createShareDialog(dialogContent);

			},

			getShortenLinkPromise: function(longLink) {
				var dfd = new jQuery.Deferred();

				var request = {
					"link" : longLink
				};
				var url = "shortenLink";
				var ajaxArgs = {
					url : url,
					data : jQuery.param(request),
					type : "GET",
					dataType : "json",
					success : function(data) {
						// var shortLink = data["shortLink"];
						dfd.resolve(data);
					}
				};

				jQuery.ajax(ajaxArgs);
				return dfd.promise();
			},
			
			getShortLink : function(longLink) {
				var promise = this.getShortenLinkPromise(longLink);

				promise.done(function(data) {
					//console.log(data);
					jQuery("#shareText").attr(
							"rows",
							OpenGeoportal.Utility
									.calculateTextAreaRows(data.shortLink));
					jQuery("#shareDialog").dialog('open');
					jQuery("#shareText").text(data.shortLink).focus();
				});

			},

			createShareDialog : function(dialogContent) {
				if (typeof jQuery('#shareDialog')[0] == 'undefined') {
					var shareDiv = '<div id="shareDialog" class="dialog"> \n';
					shareDiv += dialogContent;
					shareDiv += '</div> \n';
					jQuery('#dialogs').append(shareDiv);
					jQuery("#shareDialog")
							.dialog(
									{
										zIndex : 3000,
										autoOpen : false,
										width : 495,
										height : 'auto',
										title : 'Share Cart',
										resizable : false,
										buttons : {
											Close : function() {
												jQuery(this).dialog('close');
												jQuery("#optionDetails").html(
														"");
												jQuery(
														".downloadSelection, .downloadUnselection")
														.removeClass(
																"downloadSelection downloadUnselection");
											}
										}
									});
				} else {
					// replace dialog text/controls & open the instance of
					// 'dialog' that
					// already exists
					jQuery("#shareDialog").html(dialogContent);
				}
				jQuery('#shareText').focus(function() {
					// Select input field contents
					this.select();
				});
				
				return jQuery("#shareDialog");
			}
		});
