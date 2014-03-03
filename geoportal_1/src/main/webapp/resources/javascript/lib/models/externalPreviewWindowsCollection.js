if (typeof OpenGeoportal === 'undefined') {
	OpenGeoportal = {};
} else if (typeof OpenGeoportal !== "object") {
	throw new Error("OpenGeoportal already exists and is not an object");
}

if (typeof OpenGeoportal.Models === 'undefined') {
	OpenGeoportal.Models = {};
} else if (typeof OpenGeoportal.Models !== "object") {
	throw new Error("OpenGeoportal.Models already exists and is not an object");
}

OpenGeoportal.Models.ImageCollectionUnGeoreferenced = Backbone.Model
		.extend({
			defaults : {
				baseURL : null,
				layers : null,
				CQL : null,
				collectionurl : null,
				gssUrl : null,
				windowUrl : "ungeoreferenced",
				windowTarget : "_blank",
				windowOptions : "width=800,height=800,status=yes,resizable=yes"

			},
			initialize : function() {
				var location = this.get("parsedLocation");
				var workspaceName = this.get("workspaceName");
				var collectionId = this.get("CollectionId");

				if (typeof location.imageCollection !== "undefined") {
					console
							.log("This layer requires the property 'imageCollection' in the Location field.");
				} else {

					var gssURL = null;

					// this url should be included in the solr location
					// field, since gss
					// must be run locally against the image
					if (typeof location.imageCollection.gssUrl !== "undefined") {
						gssURL = location.imageCollection.gssUrl;
					} else if (this.get("Institution").toLowerCase() === "berkeley") {
						// since this url can only apply to Berkeley layers...
						gssURL = 'http://linuxdev.lib.berkeley.edu:8080/newOGP/gss';

					}

					var baseURL = null;
					if (typeof location.imageCollection.url !== "undefined") {
						baseURL = location.imageCollection.url;
					}

					var path = null;
					if (typeof location.imageCollection.path !== "undefined") {
						path = location.imageCollection.path;
					}

					var collectionurl = null;
					if (typeof location.imageCollection.collectionurl !== "undefined") {
						collectionurl = location.imageCollection.collectionurl;
					}

					this.set({
						gssURL : gssURL,
						layers : workspaceName + ":" + collectionId,
						baseURL : baseURL,
						CQL : "PATH='" + path + "'",
						collectionurl : collectionurl
					});
				}
			}
		});

// a place to store references to external windows and associated data
// should the logic go in a view instead?
OpenGeoportal.ExternalPreviewWindows = Backbone.Collection
		.extend({
			initialize : function() {

				this.listenTo(this, "add", this.openWindow);
				this.listenTo(this, "remove", this.closeWindow);

			},
			openWindow : function(model, val, options) {
				// open an external window, reading values from model passed to
				// the collection arguments for "open" URL,name,specs,replace
				// url is required
				if (model.has("windowUrl")) {
					var url = model.get("windowUrl");
					var target = null;
					if (model.has("windowTarget")) {
						target = model.get("windowTarget");
					}
					var options = null;
					if (model.has("windowOptions")) {
						options = model.get("windowOptions");
					}
					var windowReference = window.open(url, target, options);
					model.set({
						windowReference : windowReference
					});

					// pass the model to the child window
					// child window code should define this object, but just in
					// case...
					if (typeof windowReference.OpenGeoportal === "undefined") {
						windowReference.OpenGeoportal = {};
					}
					windowReference.OpenGeoportal.externalWindowAttr = model.attributes;

					// we also need to add a listener to the beforeunload event
					// of the
					// child window. On beforeunload, remove the model from the
					// collection
					var that = this;

					// will this work? seems reasonable. limited to same domain?
					jQuery(windowReference).unload(function() {
						that.remove(model);
					});

				} else {
					console.log("No url specified for new window.");
				}
			},
			closeWindow : function(model, val, options) {
				if (model.has("windowReference")) {
					// check to see if the windowReference still exists
					model.get("windowReference").close();
				}
			}
		});