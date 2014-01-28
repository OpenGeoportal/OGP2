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

OpenGeoportal.Views.PreviewedLayersRow = Backbone.View.extend({
	tagName : "tr",
	className : "previewedRow",
	events : {
		"click .viewMetadataControl" : "viewMetadata",
		"click .colSave" : "toggleSave",
		"click .colPreview" : "togglePreview",
		"click .colExpand" : "toggleExpand",
		"click .colTitle" : "toggleExpand",
		"mouseover" : "showBounds",
		"mouseout" : "hideBounds"

	},
	initialize : function() {
		this.template = OpenGeoportal.ogp.appState.get("template");
		this.controls = OpenGeoportal.ogp.appState.get("controls");
		// share config with the results table
		this.tableConfig = OpenGeoportal.ogp.resultsTableObj.tableHeadingsObj;

		var that = this;
		this.tableConfig.listenTo(this.tableConfig, "change:visible",
				function() {
					that.render.apply(that, arguments);
				});
		this.login = OpenGeoportal.ogp.appState.get("login").model;

		this.login.listenTo(this.login, "change:authenticated", function() {
			that.removeOnLogout(that, arguments);
			that.render.apply(that, arguments);
		});
		this.listenTo(this.model, "change:preview", this.render);
		this.listenTo(this.model, "change:showControls", this.toggleControls);

	},

	removeOnLogout : function(loginView) {
		if (!this.login.hasAccess(this.model)) {
			this.model.set({
				preview : "off"
			});
		}
	},

	viewMetadata : function() {
		// console.log(arguments);
		var layerId = this.model.get("LayerId");
		this.controls.viewMetadata(layerId);
	},

	toggleSave : function() {
		var cart = OpenGeoportal.ogp.cartView.collection;
		cart.toggleCartState(this.model);

	},

	togglePreview : function() {
		var previewState = this.model.get("preview");
		if (previewState === "on") {
			this.model.set({
				preview : "off"
			});
		} else {
			this.model.set({
				preview : "on"
			});
		}
	},

	toggleExpand : function() {
		// console.log("toggleExpand");
		var controls = this.model.get("showControls");
		this.model.set({
			showControls : !controls
		});
	},

	render : function() {

		var html = "";
		var that = this;
		var model = this.model;
		// determine which td elements are visible from the the
		// tableConfig model
		var visibleColumns = this.tableConfig.where({
			visible : true
		});
		var toolsRow$ = this.$el.next();
		if (toolsRow$.hasClass("controls")) {
			toolsRow$.find("td.previewTools").attr("colspan",
					visibleColumns.length);

		}
		var i = null;
		for (i in visibleColumns) {
			var currCol = visibleColumns[i];
			var contents = "";
			if (currCol.has("modelRender")) {
				contents = currCol.get("modelRender")(model);
				html += this.template.tableCell({
					colClass : visibleColumns[i].get("columnClass"),
					contents : contents
				});
			} else {
				contents = model.get(currCol.get("columnName"));
				html += this.template.textTableCell({
					colClass : visibleColumns[i].get("columnClass"),
					contents : contents
				});
			}
		}

		var fullRow$ = this.$el;
		if (model.get("showControls")) {
			fullRow$.add(this.$el.next());
		}

		if (model.get("preview") === "off") {
			model.set({
				showControls : false
			});
			fullRow$.hide();
		} else {
			fullRow$.show();
		}

		this.$el.html(html);

		jQuery(document).trigger("render.previewPanel");

		this.addBottomBorder();
		return this;

	},

	addBottomBorder : function() {
		var pane$ = jQuery("div.dataTables_scrollHead");
		if (this.model.collection.where({
			preview : "on"
		}).length > 0) {
			if (!pane$.hasClass("previewPane")) {
				pane$.addClass("previewPane");
			}
		} else {
			if (pane$.hasClass("previewPane")) {
				pane$.removeClass("previewPane");
			}
		}
	},

	toggleControls : function() {
		this.render();
		var colspan = this.$el.find("td").length;
		if (this.model.get("showControls")) {
			if (!this.model.has("toolView")) {
				this.$el.after(this.template.previewToolsContainer({
					colspan : colspan
				}));
				// a view that watches expand state
				// Open this row
				var tools$ = this.$el.next().find(".previewTools").first();
				var view = new OpenGeoportal.Views.PreviewTools({
					model : this.model,
					el : tools$
				});// render to the container
				this.model.set({
					toolView : view
				});
			}
		} else {
			if (this.model.has("toolView")) {
				this.model.get("toolView").remove();
				this.model.unset("toolView");
				this.$el.next().parent(".controls").remove();
			}
		}

		jQuery(document).trigger("render.previewPanel");

	},
	showBounds : function() {
		var currModel = this.model;
		var bbox = {};
		bbox.south = currModel.get("MinY");
		bbox.north = currModel.get("MaxY");
		bbox.west = currModel.get("MinX");
		bbox.east = currModel.get("MaxX");
		jQuery(document).trigger("map.showBBox", bbox);
		// console.log("triggered map.showBBox");

	},
	hideBounds : function() {
		jQuery(document).trigger("map.hideBBox");
	}
});

OpenGeoportal.Views.PreviewedLayersTable = Backbone.View
		.extend({

			initialize : function() {
				this.listenTo(this.collection, "add", this.renderRow);
				var that = this;
				jQuery(document).on("view.showInCart", function() {
					that.refreshRow.apply(that, arguments);
				});
				jQuery(document).on("view.showNotInCart", function() {
					that.refreshRow.apply(that, arguments);
				});
				this.initRender();
				this.render();
			},
			initRender : function() {
				jQuery(".dataTables_scrollHead table")
						.append("<tbody></tbody>");
			},
			refreshRow : function(event, data) {
				var model = this.collection.findWhere({
					LayerId : data.layerId
				});
				if (typeof model !== "undefined") {
					this.renderedViews[model.cid].render();
				}
			},

			renderedViews : {}, // keep a reference to rendered
			// views...necessary?
			renderRow : function(model) {
				this.renderedViews[model.cid] = new OpenGeoportal.Views.PreviewedLayersRow(
						{
							model : model
						});
				this.$el.append(this.renderedViews[model.cid].render().el);
			},

			render : function() {
				var that = this;
				this.collection.each(function(model) {
					that.renderRow(model);
				});

				return this;

			}

		});
