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


OpenGeoportal.Models.CartItem = OpenGeoportal.Models.ResultItem.extend({
});

OpenGeoportal.CartCollection = Backbone.Collection.extend({
	model: OpenGeoportal.Models.CartItem,
	initialize: function(){
		this.listenTo(this, "invalid", function(model, error){
		        console.log(error);
		    });
	},
	isActionAvailable: function(model, action){
		//return models in the collection that have passed 'action' available
		var trueFunction = function(){return true};
		var filter = trueFunction; //returns all models by default
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
	mapItFilter: function(model){
		//public vector layers only.
		if (model.get("Access").toLowerCase() != "public"){
			return false;
		} else {
			if (model.isVector){
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
		//we should examine location
		if (dataType == "libraryrecord"){
			return false;
		}
		if (access == "public"){
			return true;
		} else if (institution != "tufts"){
			return false;
		} else if (false){//check if the user is logged in
			return true;
		} else {
			return false;
		}
	},
	webServiceFilter: function(model){
		//public layers only.  right now, only Tufts.
		var institution = model.get('Institution').toLowerCase();
		var access = model.get("Access").toLowerCase();
		var dataType = model.get('DataType').toLowerCase();
		if (dataType == "libraryrecord"){
			return false;
		}
		if ((institution != "tufts")||(access != "public")){
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

			var isIntx = function(min1, max1, min2, max2){
				return (Math.min(max1, max2) - Math.max(min1, min2)) > 0;
			}		
		
			if (!isIntx(bounds.minY, bounds.maxY, minY, maxY)){
				return false;
			}
		
			var dateLine = false;
			if (minX > maxX){
				//wraps across international date line.
				dateLine = true;
			}
			if (!dateLine){
				var xIntx = isIntx(bounds.minX, bounds.maxX, minX, maxX);
				return xIntx;
			} else {
				//split the model's bounds into 2 boxes
				var xIntx1 = isIntx(bounds.minX, bounds.maxX, -180.0, maxX);
				var xIntx2 = isIntx(bounds.minX, bounds.maxX, minX, 180.0);
				return xIntx1 || xIntx2;
			}
	},

	addLayer: function(model, options){
		console.log(model);
		var ignoreWarning = false;
		if (typeof options != "undefined" && typeof options.ignoreWarning != "undefined"){
			ignoreWarning = options.ignoreWarning;
		}
		//TODO: check IgnoreAuthenticationWarning (or whatever replaces it)
		
		
		
		if (model.get("Access").toLowerCase() != "public"){
			//check the login object
			var loggedIn = {repositories: [], authenticated: false};
			if (loggedIn.repositories.length === 0){
				//this.authenticationWarning(model);
				alert("Must log in to preview or download this layer.");
			} else if (loggedIn.repositories.contains(model.get("Institution"))){
				this.add(model);
			} else {
				alert("Must log in to " + model.get("Institution") + " to preview or download this layer.");
			}
		} else {
			this.add(model);
		}
	},
	
	IgnoreAuthenticationWarning: {local: false, external: false},


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
			that.IgnoreAuthenticationWarning[disposition] = jQuery("#" + ignoreWarningId).is(":checked");
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
