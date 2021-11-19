/** 
 * This javascript module includes functions for dealing with login
 * 
 * @author Chris Barnett
 * 
 */

/**
 * create the namespace objects if they don't already exist
 */

if (typeof OpenGeoportal == 'undefined') {
	OpenGeoportal = {};
} else if (typeof OpenGeoportal != "object") {
	throw new Error("OpenGeoportal already exists and is not an object");
}

if (typeof OpenGeoportal.Models == 'undefined') {
	OpenGeoportal.Models = {};
} else if (typeof OpenGeoportal.Models != "object") {
	throw new Error("OpenGeoportal.Models already exists and is not an object");
}

// {"authenticated":true,"username":"cbarne02","authorities":[{"authority":"ROLE_USER"}]}
/**
 * 
 */
// this should really allow us to help manage multiple repository access,
// instead of just assuming "local"
/**
 * Override Backbone.sync to pass cookies via CORS
 */
Backbone.sync = _.wrap(Backbone.sync, function(sync, method, model, options) {
	if (!options.xhrFields) {
		options.xhrFields = {
			withCredentials : true
		};
	}

	options.headers = options.headers || {};

	sync(method, model, options);
});

OpenGeoportal.Models.User = Backbone.Model.extend({

	defaults : {
		repository : "",
		username : "anonymous",
		authenticated : false,
		authorities : [],
		message : ""
	},

	initialize : function() {
		// we need: login repositoryId,
		// login type (form or iframe)
		// login url (relative)
		// https: domain, port, etc

		var loginConfig = OpenGeoportal.Config.General.get("loginConfig");
		var institution = loginConfig.repositoryId;
		var labelPrefix = "";// institution;
		if (loginConfig.secureDomain.length > 0) {
			// console.log("setting secureDomain");
			this.set({
				secureDomain : loginConfig.secureDomain
			});
		}
		this.set({
			repository : institution
		});
		var type = loginConfig.type;
		var authUrl = this.getUrl() + loginConfig.url;

		if (labelPrefix.length > 0) {
			labelPrefix += " ";
		}
		var usernameLabel = labelPrefix + "Username:";
		var passwordLabel = labelPrefix + "Password:";

		this.set({
			type : type
		});
		this.set({
			authUrl : authUrl
		});
		this.set({
			userNameLabel : usernameLabel
		});
		this.set({
			passwordLabel : passwordLabel
		});

		// this.listenTo(this, "change:authenticated", )
	},
	url : function() {
		return this.getUrl() + "loginStatus";
	},
	getUrl : function() {
		var secureDomain;

		if (this.has("secureDomain")) {
			// default to current hostname and port on https
			secureDomain = this.get("secureDomain");
			if (secureDomain.indexOf("/") !== -1) {
				// TODO: remove trailing slash if it exists
			}
		} else {
			var hostname = window.location.hostname;
			var port = window.location.port;
			if ((port == "") || (port == null)) {
				port = "";
			} else {
				port = ":" + port;
			}
			var protocol = "https";

			secureDomain = protocol + "://" + hostname + port;

		}

		var currentPathname = window.location.pathname;
		var pathParts = currentPathname.split("/");
		var extraPath = "";
		if (pathParts.length > 2) {
			extraPath = pathParts[1] + "/";
		}

		var url = secureDomain + "/" + extraPath;
		return url;
	},

	logout : function() {
		// for logout capability
		var that = this;
		var url = this.getUrl() + "logout";
		var ajaxArgs = {
			url : url,
			crossDomain : true,
			xhrFields : {
				withCredentials : true
			},
			context : that,
			dataType : "json"

		};
		// meh. should modify spring security to return a 200 instead of a 302 ?

		jQuery.ajax(ajaxArgs).always(function() {
			that.fetch();
		});
	},
	canLogin : function(layerModel) {
		var repository = layerModel.get("Institution");
		return this.canLoginLogic(repository);
	},
	canLoginLogic : function(repository) {
		// only supporting local login for now

		if (repository.toLowerCase() === this.get("repository").toLowerCase()) {
			return true;
		} else {
			return false;
		}
	},

	hasAccess : function(layerModel) {

		var layerRep = layerModel.get("Institution");
		var layerAccess = layerModel.get("Access");
		return this.hasAccessLogic(layerAccess, layerRep);

	},

	hasAccessLogic : function(layerAccess, layerRep) {
		layerAccess = layerAccess.toLowerCase();
		layerRep = layerRep.toLowerCase();
		var authenticated = this.get("authenticated");
		var authRep = this.get("repository").toLowerCase();

		if (layerAccess === "public") {
			return true;
		} else if (authenticated && (authRep === layerRep)) {
			return true;
		} else {
			return false;
		}
	}
});

