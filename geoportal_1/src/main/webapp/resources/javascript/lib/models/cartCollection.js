if (typeof OpenGeoportal == 'undefined'){
	OpenGeoportal = {};
} else if (typeof OpenGeoportal != "object"){
    throw new Error("OpenGeoportal already exists and is not an object");
}

if (typeof OpenGeoportal.Models == 'undefined'){
	OpenGeoportal.Models = {};
} else if (typeof OpenGeoportal.Models != "object"){
    throw new Error("OpenGeoportal.Models already exists and is not an object");
}


OpenGeoportal.Models.CartLayer = OpenGeoportal.Models.DataTypeAware.extend({
	initialize: function(){
		this.assignDataTypeAttributes();
		this.requiresEmailAddress();
	},
	
	requiresEmailAddress: function(){
		//there should be a more generalized way to do this, rather than specifying "Harvard"
		if ((this.get("Institution").toLowerCase() == "harvard")&&(this.get("baseType") == "raster")){
			this.set({requiresEmailAddress: true, emailAddress: ""});
		} else {
			this.set({requiresEmailAddress: false, emailAddress: ""});
		}
	}
});

OpenGeoportal.CartCollection = Backbone.Collection.extend({
	model: OpenGeoportal.Models.CartLayer,
	initialize: function(){

		this.listenTo(this, "invalid", function(model, error){
		        console.log(error);
		    });
	},
	isActionAvailable: function(model, action){
		//returns true for passed models that have passed 'action' available
		var trueFunction = function(){return true};
		var filter = trueFunction; //returns true by default
		switch (action){
		case "mapIt":
			filter = this.mapItFilter;
			break;
		case "download":
			filter = this.downloadFilter;
			break;
		case "webService":
			filter = this.webServiceFilter;
			break;
		}
		return filter.call(this, model);
	},
	
	getItemsWithAction: function(action){
		var that = this;

		var arrItems = this.filter(function(model){

			return that.isActionAvailable(model, action);

			});
		return arrItems;
	},
	
	mapItFilter: function(model){
		//public vector layers only.
		if (model.get("Access").toLowerCase() != "public"){
			return false;
		} else {
			if (model.get("baseType").toLowerCase() == "vector"){
				return true;
			} else {
				return false;
			}
		}
	},
	
	downloadFilter: function(model){
		//no external restricted layers, no local restricted layers if not logged in. 
		var institution = model.get('Institution').toLowerCase();
		var access = model.get('Access').toLowerCase();
		var dataType = model.get('DataType').toLowerCase();

		if (dataType == "libraryrecord"){
			return false;
		}
		
		var hasAccess = OpenGeoportal.ogp.appState.get("login").model.hasAccess(model);
		return hasAccess;
	},
	
	webServiceFilter: function(model){
		//public layers only.  right now, only Tufts.
		var institution = model.get('Institution').toLowerCase();
		var access = model.get("Access").toLowerCase();
		var dataType = model.get('DataType').toLowerCase();
		if (dataType == "libraryrecord"){
			return false;
		}
		
		if (access != "public"){

			return false;
		} else {
			return true;
		}
	},
	
	intersectsBounds: function(model, bounds){
		//return an array of models in the collection that intersect the passed bounds
			var minX = model.get("MinX");
			var minY = model.get("MinY");
			var maxX = model.get("MaxX");
			var maxY = model.get("MaxY");
			console.log(model);
			console.log(bounds);//would prefer for bounds to be an object, rather than an array
			var isIntx = function(min1, max1, min2, max2){
				return (Math.min(max1, max2) - Math.max(min1, min2)) > 0;
			};		
		
			if (!isIntx(bounds[1], bounds[3], minY, maxY)){
				return false;
			}
		
			var dateLine = false;
			if (minX > maxX){
				//wraps across international date line.
				dateLine = true;
			}
			if (!dateLine){
				var xIntx = isIntx(bounds[0], bounds[2], minX, maxX);
				return xIntx;
			} else {
				//split the model's bounds into 2 boxes
				var xIntx1 = isIntx(bounds[0], bounds[2], -180.0, maxX);
				var xIntx2 = isIntx(bounds[0], bounds[2], minX, 180.0);
				return xIntx1 || xIntx2;
			}
	},

	addLayer: function(model, options){
		
		//check the login object
		var hasAccess = OpenGeoportal.ogp.appState.get("login").model.hasAccess(model);

		if (!hasAccess){
			this.addWithWarning(model);
			//alert("Must log in to preview or download this layer.");

		} else {
			this.add(model);
		}
	},
	
	toggleCartState: function(itemModel){

		var layerId = itemModel.get("LayerId");
		var layerModel = this.get(layerId);

		if (typeof layerModel == "undefined"){
			var cartItem = itemModel.clone();//Do I need to clone, since I am passing just the attributes?
			this.addLayer(new OpenGeoportal.Models.CartLayer(cartItem.attributes));

		} else {
			this.remove(layerId);
		}
	},
	
	ignoreAuthenticationWarning: {local: false, external: false},

	addWithWarning: function(model){
		var ignoreWarning = false;
		if (typeof options != "undefined" && typeof options.ignoreWarning != "undefined"){
			ignoreWarning = options.ignoreWarning;
		}
		//TODO: check IgnoreAuthenticationWarning (or whatever replaces it)
		var canLogin = OpenGeoportal.ogp.appState.get("login").model.canLogin(model);

		var institution = model.get("institution");
		var ignoreWarningId = "ignoreAuthenticationWarning";
		var disposition;
		var warningMessage = '<span>This layer is restricted by licensing agreement to the ' + institution + ' community. </span>';
		var that = this;
		
		jQuery(document).on("change", "#" + ignoreWarningId, function(){
			that.ignoreWarningId = jQuery(this).is(":checked");
		});
		
		if (canLogin){
			if (this.ignoreAuthenticationWarning.local){
				this.add(model);
				return;
			}
			warningMessage += '<span class="notice">Restricted layers can be added to the Cart, but you must login before you can preview or download restricted layers.</span>'; 
			
		} else {
			if (this.ignoreAuthenticationWarning.external){
				this.add(model);
				return;
			}
			warningMessage += '<span class="notice">Restricted layers can be added to the Cart here, but you must use ' + institution;
			warningMessage += "'s site and login to preview or download restricted layers.</span>"; 

		}

		warningMessage += "<br />";
		warningMessage += '<span class="ignoreWarning"><input id="' + ignoreWarningId + '" type="checkbox" /><label for="ignoreAuthenticationWarning">Don\'t show this message again.</span>';

		var divId = this.genericModalDialog(warningMessage, "Restricted Layer");
	},
	
	authenticationWarning: function(checkboxObj, rowData, canLogin){
		var instIndx = this.getColumnsIndex()["Institution"];
		var that = this;
		var institution = rowData[instIndx];
		
		var ignoreWarningId = "ignoreAuthenticationWarning";
		var disposition;
		var warningMessage = '<span>This layer is restricted by licensing agreement to the ' + institution + ' community. </span>';
		if (canLogin){
			if (this.IgnoreAuthenticationWarning.home){
				this.addToCart(checkboxObj, rowData);
				return;
			}
			warningMessage += '<span class="notice">Restricted layers can be added to the Cart, but you must login before you can preview or download restricted layers.</span>'; 
			ignoreWarningId += "Internal";
			disposition = "home";
		} else {
			if (this.IgnoreAuthenticationWarning.external){
				this.addToCart(checkboxObj, rowData);
				return;
			}
			warningMessage += '<span class="notice">Restricted layers can be added to the Cart here, but you must use ' + institution;
			warningMessage += "'s site and login to preview or download restricted layers.</span>"; 
			ignoreWarningId += "External";
			disposition = "external";
		}

		warningMessage += "<br />";
		warningMessage += '<span class="ignoreWarning"><input id="ignoreAuthenticationWarning" type="checkbox" /><label for="ignoreAuthenticationWarning">Don\'t show this message again.</span>';

		var divId = this.genericModalDialog(warningMessage, "Restricted Layer");

		var addToCartFunction = function() {
			that.IgnoreAuthenticationWarning[disposition] = jQuery("#ignoreAuthenticationWarning").is(":checked");
			jQuery(this).dialog('close');
			this.addToCart(checkboxObj, rowData);
		};

		var loginAndAddFunction = function(){
			that.IgnoreAuthenticationWarning[disposition] = jQuery("#" + ignoreWarningId).is(":checked");
			//that.promptLogin();
			that.login.loginDialog();

			//pass some info to the loginDialog
			jQuery(this).dialog('disable');
			var dialogBox = jQuery('#' + divId);
			jQuery(document).bind("loginSuccess.addToCart", function(){
				that.addToCart(checkboxObj, rowData);
				dialogBox.dialog('close');
				jQuery(document).unbind("loginSuccess.addToCart");
			});
			jQuery(document).bind("loginCancel", function(){
				dialogBox.dialog("enable");
			});
		};

		var cancelFunction = function(){
			that.IgnoreAuthenticationWarning[disposition] = jQuery("#" + ignoreWarningId).is(":checked");
			jQuery(this).dialog('close');
			//some code to deselect the layer check box;
			jQuery(checkboxObj).attr("checked", false);
		};

		var buttons = {};
		if (canLogin){
			buttons["Login & Add"] = loginAndAddFunction;
			buttons["Add Only"] = addToCartFunction;
			buttons["Cancel"] = cancelFunction;
		} else {
			buttons["Add"] = addToCartFunction;
			buttons["Cancel"] = cancelFunction;
		}

		jQuery('#' + divId).dialog(	
				{width: 535,
					buttons: buttons
				}
		);


	}
	
});
