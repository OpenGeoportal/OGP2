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
 * TableItems constructor this object determines how to render controls
 * and icons that appear in results/preview/cart tables
 * 
 * @requires OpenGeoportal.Config, OpenGeoportal.Template
 */
OpenGeoportal.TableItems = function TableItems() {
	
	var template = OpenGeoportal.Template;

	/***************************************************************************
	 * 
	 * Render table columns
	 **************************************************************************/

	// maps returned data type to appropriate image
	this.renderTypeIcon = function(dataType) {

		var typeIcon = OpenGeoportal.Config.DataTypes;
		var params = {};
		params.controlClass = "typeIcon";

		if ((typeof dataType == "undefined") || (dataType === null)) {
			params.displayClass = "undefinedType";
			params.tooltip = "Unspecified";
			params.text = "?";
		} else {
			// dataType = dataType.toLowerCase();

			var iconModel = typeIcon.findWhere({
				value : dataType
			});
			if (typeof iconModel == 'undefined') {
				params.displayClass = "undefinedType";
				params.tooltip = "Unspecified";
				params.text = "?";
			} else {
				params.displayClass = iconModel.get("iconClass");
				params.tooltip = iconModel.get("displayName");
				params.text = "";
			}
		}
		var icon = template.get('genericIcon')(params);

		return icon;
	};

	this.renderExpandControl = function(layerExpanded) {
		var params = {};
		params.text = "";
		params.controlClass = "expandControl";
		if (layerExpanded) {
			params.displayClass = "expanded";
			params.tooltip = "Hide preview controls";
		} else {
			params.displayClass = "notExpanded";
			params.tooltip = "Show preview controls";
		}
		return template.get('genericControl')(params);
	};

	this.renderPreviewControl = function(canPreview, hasAccess, canLogin, stateVal){
		if (canPreview){
			if (hasAccess) {
				return this.renderCheckboxPreviewControl(stateVal);
			} else {
				if (canLogin) {
					return this.renderLoginPreviewControl();
				} else {
                    return this.renderLinkControl(hasAccess);
				}
			}
		} else {
			//render an empty control if no location elements to support preview
            return this.renderPreviewNotAvailableControl();
		}
	};

    this.renderPreviewNotAvailableControl = function () {
		var params = {};
        params.controlClass = "previewNA";
        params.text = "";
        params.tooltip = "No preview is available for this layer.";
        params.displayClass = "";

        return template.get('genericControl')(params);
    };

    this.renderLinkControl = function (hasAccess) {
        var params = {};
		params.controlClass = "previewLink";
		params.text = "";
        if (hasAccess) {
            params.tooltip = "Preview layer at external site.";
        } else {
            params.tooltip = "Preview layer at external site. Login required.";
        }
		params.displayClass = "";

		return template.get('genericControl')(params);
	};

	this.renderLoginPreviewControl = function() {
		var params = {};
		params.controlClass = "loginButton";
		params.text = "";
		params.tooltip = "Login to access this layer";
		params.displayClass = "login";

		return template.get('genericControl')(params);

	};

	/**
	 * @requires depends on previewed collection
	 */
	this.renderCheckboxPreviewControl = function(previewState) {
		var stateVal = previewState;

		var params = {};
		params.controlClass = "previewControl";
		params.text = "";
        params.elId = _.uniqueId('preview_check_');
        params.isChecked = stateVal;
		switch (stateVal) {
		case false:
			params.tooltip = "Preview layer on the map";
			break;
		case true:
			params.tooltip = "Turn off layer preview on the map";
			break;
		default:
			break;
		}

        return template.get('checkboxControl')(params);
	};

	this.renderDate = function(date) {
		if (typeof date === "undefined") {
			return "";
		}
		if (date.length > 4) {
			date = date.substr(0, 4);
		}
		if (date === "0001") {
			date = "?";
		}
		return date;
	};

	// maps returned source type to appropriate image
	this.renderRepositoryIcon = function(repository) {

		if ((typeof repository === "undefined") || (repository === null)) {
			return "";
		}
		if (repository.length === 0) {
			return "";
		}
		repository = repository.toLowerCase();
		var params = {};
		params.tooltip = "";
		params.displayClass = "undefinedInstitution";
		params.controlClass = "repositoryIcon";
		params.text = "?";
		var repositoryModel = OpenGeoportal.Config.Repositories.get(repository);
		if (typeof repositoryModel === 'undefined') {
			//
		} else {
			params.tooltip = repositoryModel.get("fullName");
			params.displayClass = repositoryModel.get("iconClass");
			params.text = "";
		}
		return template.get('genericIcon')(params);
	};


	this.renderSaveControl = function(stateVal) {

		var params = {};
		params.controlClass = "saveControl";
		params.text = "";

		if (stateVal === true) {
			params.tooltip = "Remove this layer from your cart.";
			params.displayClass = "inCart";
		} else {
			params.tooltip = "Add this layer to your cart for download.";
			params.displayClass = "notInCart";
		}
		return template.get('genericControl')(params);
	};

	this.renderMetadataControl = function() {

		var params = {};
		params.controlClass = "infoControl";
		params.text = "";

		params.displayClass = "viewMetadataControl";
		params.tooltip = "Show metadata";

		return template.get('genericControl')(params);
	};

	this.renderDownloadControl = function(isChecked) {
		return template.get('defaultDownloadCheckbox')({isChecked: isChecked});
	};

};
