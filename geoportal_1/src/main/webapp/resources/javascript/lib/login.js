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

if (typeof OpenGeoportal.Views == 'undefined') {
	OpenGeoportal.Views = {};
} else if (typeof OpenGeoportal.Views != "object") {
	throw new Error("OpenGeoportal.Views already exists and is not an object");
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

OpenGeoportal.Views.Login = Backbone.View
		.extend({
			model : OpenGeoportal.Models.User,

			initialize : function() {
				this.model.fetch();
				// we could put this on setInterval, so that when the user's
				// session expires, they get properly logged out
				// or will this just keep the session open?
				var that = this;
				jQuery(document).on("click", ".loginButton", function() {
					that.promptLogin.apply(that, arguments);
				});

				jQuery("#headerLogin").on("click.login", function() {
					that.headerLogin.apply(that, arguments);
				});

				this.listenTo(this.model, "change:authenticated",
						this.processLoginState);

			},

			headerLogin : function(event) {
				if (!this.model.get("authenticated")) {
					this.promptLogin(event);
				} else {
					this.model.logout();
				}
			},

			promptLogin : function() {
				var deferred = jQuery.Deferred();
				var dialogTitle = "Login";

				var dialogContent = this.getLoginContent();

				var type = this.model.get("type");

				if (type === "iframe") {
					// add listener for postMessage
					this.processIframeLogin(deferred);
				}

				var that = this;
				var dialogId = "loginDialog";
				var dialog$ = jQuery("#" + dialogId);

				if (dialog$.length === 0) {
					var shareDiv = '<div id="' + dialogId
							+ '" class="dialog"> \n';
					shareDiv += dialogContent;
					shareDiv += '</div> \n';
					jQuery('body').append(shareDiv);
					dialog$ = jQuery("#" + dialogId);

					var loginButtons;
					if (type === "form") {
						loginButtons = {
							Cancel : function() {
								jQuery(this).dialog('close');
							},
							Login : function() {
								that.processFormLogin(deferred);
							}

						};
					} else if (type === "iframe") {
						loginButtons = {
							Cancel : function() {
								jQuery(this).dialog('close');
							}
						};
					}

					dialog$.dialog({
						autoOpen : false,
						width : 'auto',
						title : dialogTitle,
						context : that,
						resizable : false,
						zIndex : 3000,
						stack : true,
						buttons : loginButtons
					});
				} else {
					// replace dialog text/controls & open the instance of
					// 'dialog' that already exists
					dialog$.html(dialogContent);
				}

				if (type === "form") {
					dialog$.off("keypress");
					dialog$.on("keypress", function(event) {
						if (event.keyCode === 13) {
							that.processFormLogin(deferred);
						}
					});
				}

				dialog$.dialog('open');
				dialog$.find("input:text").first().focus();
				return deferred.promise();
			},
			// return the login form to be presented to the user

			getLoginContent : function() {
				var dialogContent;
				var type = this.model.get("type");
				if (type == "form") {
					dialogContent = '<form><table>'
							+ '<tr><td>'
							+ this.model.get("userNameLabel")
							+ '</td>'
							+ '<td><input type="text" id="loginFormUsername" name="loginFormUsername"/></td></tr>'
							+ '<tr><td>'
							+ this.model.get("passwordLabel")
							+ '</td>'
							+ '<td><input type="password" id="loginFormPassword" name="loginFormUsername"/></td></tr>'
							+ '</table></form>';
				} else if (type == "iframe") {
					dialogContent = '<form><table>'
							+ '<iframe  id="loginIframe"  frameborder="0"  vspace="0"  hspace="0"  marginwidth="2"  marginheight="2" width="700"  '
							+ 'height="600"  src="' + this.model.get("authUrl")
							+ '"></iframe></table></form>';
				}

				dialogContent = dialogContent
						+ '<br/><span class="warning"></span>';

				return dialogContent;
			},

			// retrieve user entered values, generate https request and set
			// login flag

			// some special processing is included for running on localhost
			processFormLogin : function(deferred) {
				var that = this;
				var url = this.model.get("authUrl");
				// var url = this.authenticationPage;
				var username = jQuery("#loginFormUsername").val();
				var password = jQuery("#loginFormPassword").val();
				var ajaxArgs = {
					type : "POST",
					url : url,
					context : that,
					crossDomain : true,
					xhrFields : {
						withCredentials : true
					},
					data : {
						"username" : username,
						"password" : password
					},
					dataType : "json",

					success : function(data) {
						that.model.set(data);
						if (that.model.get("authenticated")) {
							// console.log("resolve");
							deferred.resolve();
						}

						if (typeof data.message !== "undefined"
								&& data.message !== null) {
							that.showLoginMessage(data.message);
						}
					},

					error : that.loginResponseError
				};
				return jQuery.ajax(ajaxArgs);

			},

			showLoginMessage : function(passedMessage) {
				if (passedMessage.length > 0) {
					jQuery("#loginDialog .warning").text(passedMessage);
				}
			},

			processIframeLogin : function(deferred) {
				var that = this;
				// IE uses "onmessage" instead of "message"
				var eventMethod = window.addEventListener ? "addEventListener"
						: "attachEvent";
				var messageEvent = eventMethod == "attachEvent" ? "onmessage"
						: "message";
				jQuery(window).on(messageEvent, function(e) {
					that.model.set(jQuery.parseJSON(e.originalEvent.data));
					if (that.model.get("authenticated")) {
						deferred.resolve();
					} else {
						deferred.fail();
					}
				});

			},

			loginResponseError : function(data) {

				this.showLoginMessage("Error communicating with login server.");
			},
			// callback handler invoked with response to authenticate server
			// call
			// sets the userId variable to hold the id of the logged in user
			processLoginState : function(model) {
				if (model.get("authenticated")) {

					// console.log("authchanged true");
					jQuery("#headerLogin").text("Logout");

					jQuery("#loginDialog").dialog('close');
					jQuery(".loginButton").trigger("loginSucceeded");

				} else {
					jQuery("#headerLogin").text("Login");
					// console.log("authchanged false");
					jQuery(".previewControl").trigger("logoutSucceeded");

				}
			}

		});
