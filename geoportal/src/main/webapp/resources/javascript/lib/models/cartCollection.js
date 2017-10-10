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

OpenGeoportal.Models.CartLayer = OpenGeoportal.Models.ProtocolAware.extend({

	defaults : {},

	intersectsBounds : function(bounds) {

		var minX = this.get("MinX");
		var minY = this.get("MinY");
		var maxX = this.get("MaxX");
		var maxY = this.get("MaxY");
		// would prefer for bounds to be an object, rather than an array
		var isIntx = function(min1, max1, min2, max2) {
			return (Math.min(max1, max2) - Math.max(min1, min2)) > 0;
		};

		if (!isIntx(bounds[1], bounds[3], minY, maxY)) {
			return false;
		}

		var dateLine = false;
		if (minX > maxX) {
			// wraps across international date line.
			dateLine = true;
		}
		if (!dateLine) {
			var xIntx = isIntx(bounds[0], bounds[2], minX, maxX);
			return xIntx;
		}

		// split the model's bounds into 2 boxes
		var xIntx1 = isIntx(bounds[0], bounds[2], -180.0, maxX);
		var xIntx2 = isIntx(bounds[0], bounds[2], minX, 180.0);
		return xIntx1 || xIntx2;
	},

	assignAttributes : function() {

		//additional attributes are assigned in views

	}
});


OpenGeoportal.CartCollection = Backbone.Collection
		.extend({
			
			model : OpenGeoportal.Models.CartLayer,
			
			initialize : function() {
				this.template = OpenGeoportal.ogp.template;
				this.listenTo(this, "invalid", function(model, error) {
					console.log(error);
				});
				
				this.listenTo(this, "add remove", this.notifyExternal);
			},

			notifyExternal: function(model){
				jQuery(document).trigger("cartUpdated", {
					LayerId : model.get("LayerId")
				});
			},
			
			addLayer : function(model, options) {
				// check the login object
				var loginModel = OpenGeoportal.ogp.appState.get("login").model; 
				var hasAccess = loginModel.hasAccess(model);

				if (!hasAccess) {
					var canLogin = loginModel.canLogin(model);
					if (this.showAuthWarning(model, canLogin)){
						this.addWithWarning(model, canLogin);
					} else {
						this.add(model);
					}

				} else {
					this.add(model);
				}
			},

			toggleCartState : function(itemModel) {
				// console.log("toggleCartState");
				var layerId = itemModel.get("LayerId");
				var layerModel = this.findWhere({
					LayerId : layerId
				});

				if (typeof layerModel === "undefined") {
					var cartItem = itemModel.clone();// Do I need to clone,
					// since I am passing
					// just the attributes?
					this.addLayer(new OpenGeoportal.Models.CartLayer(
							cartItem.attributes));

				} else {
					this.remove(layerModel);
				}
			},

			ShowWarningId: "showAuthenticationWarning",
			
			getLocalProperty: function(){
				return this.ShowWarningId + "Local";

			},
			
			getExternalProperty: function(){
				return this.ShowWarningId + "External";

			},
			
			showAuthWarning: function(model, canLogin){
				var showDialog = true;
				if (canLogin) {
					//check local storage for val;
					showDialog = OpenGeoportal.Utility.LocalStorage.getBool(this.getLocalProperty(), true);
				} else {
					//check local storage for val;
					showDialog = OpenGeoportal.Utility.LocalStorage.getBool(this.getExternalProperty(), true);
				}

				return showDialog;
			},

			
			addWithWarning : function(layerModel, canLogin) {
				var that = this;
				var addToCartFunction = function() {
					that.add(layerModel);
					jQuery(this).dialog('close');

				};

				var loginAndAddFunction = function() {

					var loginView = OpenGeoportal.ogp.appState.get("login");
					loginView.promptLogin();

					// pass some info to the loginDialog
					jQuery(this).dialog('disable');
					// listenTo (Once) user object; test for hasAccess; then add
					// layerModel to collection

					var deferredAdd = function(model) {
						if (model.hasAccess(layerModel)) {
							that.add(layerModel);
						}

						dialog$.dialog('close');

					};

					loginView.listenToOnce(loginView.model,
							"change:authenticated", deferredAdd);

					jQuery(document).on(
							"loginCancel",
							function() {
								dialog$.dialog("enable");
								loginView.stopListening(loginView.model,
										"change:authenticated", deferredAdd);

							});
				};

				var cancelFunction = function() {

					jQuery(this).dialog('close');
				};

				var institution = layerModel.get("Institution");
				var localeWarning = "";
				var buttons = {};
				var lsProperty = "";

				if (canLogin) {
					localeWarning = this.template.restrictedWarningLocal();
					buttons["Login & Add"] = loginAndAddFunction;
					buttons["Add Only"] = addToCartFunction;
					buttons["Cancel"] = cancelFunction;
					lsProperty = this.getLocalProperty();
				} else {
					localeWarning = this.template.restrictedWarningExternal({repository: institution});
					buttons["Add"] = addToCartFunction;
					buttons["Cancel"] = cancelFunction;
					lsProperty = this.getExternalProperty();
				}
				
				var warningMessage = this.template.restrictedWarning({repository: institution, localeWarning: localeWarning});
				var dialog$ = OpenGeoportal.ogp.widgets.genericModalDialog(warningMessage, "Restricted Layer");
				
				dialog$.on("click", ".doNotShow", function(){
					var show = true;
					if (jQuery(this).is("input:checked")){
						show = false;
					}

					OpenGeoportal.Utility.LocalStorage.setBool(lsProperty, show);
				});
		
				dialog$.dialog({
					width : 535,
					buttons : buttons
				}).siblings(".ui-dialog-buttonpane").find(
						".ui-dialog-buttonset > button").first().focus();
			}
		});
