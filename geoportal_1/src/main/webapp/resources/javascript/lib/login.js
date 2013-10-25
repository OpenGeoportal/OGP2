/** 
 * This javascript module includes functions for dealing with login
 * 
 * @author Chris Barnett
 * 
 */

/**
 * create the namespace objects if they don't already exist
 */

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

if (typeof OpenGeoportal.Views == 'undefined'){
	OpenGeoportal.Views = {};
} else if (typeof OpenGeoportal.Views != "object"){
    throw new Error("OpenGeoportal.Views already exists and is not an object");
}

//{"authenticated":true,"username":"cbarne02","authorities":[{"authority":"ROLE_USER"}]}
/**
 * 
 */
//this should really allow us to help manage multiple repository access, instead of just assuming "local"
OpenGeoportal.Models.User = Backbone.Model.extend({

	defaults: {
		username: "anonymous",
		authenticated: false,
		authorities: [],
		message: ""
	},
	initialize: function(){
		var institution = OpenGeoportal.InstitutionInfo.getHomeInstitution();
		var type = OpenGeoportal.InstitutionInfo.getLoginType(institution);
		var authUrl = this.getUrl() + OpenGeoportal.InstitutionInfo.getAuthenticationPage(institution);
		var usernameLabel = institution + " Username:";
		var passwordLabel = institution + " Password:";
		this.set({type: type});
		this.set({authUrl: authUrl});
		this.set({userNameLabel: usernameLabel});
		this.set({passwordLabel: passwordLabel});
	},
	url: function(){return this.getUrl() + "loginStatus";},
	getUrl: function(){
		var hostname = window.location.hostname;
		var currentPathname = window.location.pathname;
		var pathParts = currentPathname.split("/");
		var extraPath = "";
		if (pathParts.length > 2)
		{
			// a hack to handle localhost where there is another element in the pathname
			extraPath = pathParts[1] + "/";
		}
	        var port = window.location.port;
		if ((port == "") || (port == null)){
			port = "";
		} else {
			port = ":" + port;
		}
		var protocol = "https";
		if (hostname == "localhost"){
			//protocol = "http";
			port = ":8443";
		}
		var url = protocol + "://" + hostname + port + "/" + extraPath;
		return url;
	},
	
	logout: function() {
		//for logout capability
		var that = this;
		var url = this.getUrl() + "logout";
		var ajaxArgs = {
			url : url,
			crossDomain : true,
			xhrFields : {
				withCredentials : true
			},
			context : that,
			dataType : "json",
			success : function(data){that.set(data);}
		};
		jQuery.ajax(ajaxArgs);
	}
});

OpenGeoportal.Views.Login = Backbone.View.extend({
	model: OpenGeoportal.Models.User,

	events: {
		"loginSucceeded" 	: "loginSuccess",
		"loginFailed"		: "loginFailure"
		}, 
		
		initialize: function() {
			this.model.fetch();
			//we could put this on setInterval, so that when the user's session expires, they get properly logged out
			var that = this;
			jQuery(document).on("click", ".loginButton", function(){that.promptLogin.apply(that, arguments);});

			jQuery("#headerLogin").on("click.login", function(){that.headerLogin.apply(that, arguments);});

			this.listenTo(this.model, "change:authenticated", this.processLoginState);

		}, 
		
		headerLogin: function(event) {
			if (!this.model.get("authenticated")){
				this.promptLogin(event);
			} else {
				this.model.logout();
			}
		},
		promptLogin: function(event) {
			var dialogTitle = "Login";

			var dialogContent = dialogContent = this.getLoginContent();

			var that = this;
			if ( typeof jQuery('#loginDialog')[0] == 'undefined') {
				var shareDiv = '<div id="loginDialog" class="dialog"> \n';
				shareDiv += dialogContent;
				shareDiv += '</div> \n';
				jQuery('body').append(shareDiv);

				var loginButtons;
				var type = this.model.get("type");
				if (type == "form") {
					loginButtons = {
						Login : function() {
							that.processFormLogin();
						},
						Cancel : function() {
							jQuery(this).dialog('close');
							jQuery(document).trigger("loginCancel");
						}
					};
				} else if (type == "iframe") {
					loginButtons = {
						Cancel : function() {
							jQuery(this).dialog('close');
							jQuery(document).trigger("loginCancel");
						}
					};
				}

				jQuery("#loginDialog").dialog({
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
				//replace dialog text/controls & open the instance of 'dialog' that already exists
				jQuery("#loginDialog").html(dialogContent);
			}

			if (type == "form") {
				jQuery("#loginDialog").unbind("keypress");
				jQuery('#loginDialog').bind("keypress", function(event) {
					if (event.keyCode == '13') {
						that.processFormLogin();
					}
				});
			} else if (type == "iframe") {
				this.processIframeLogin();
			}

			jQuery("#loginDialog").dialog('open');
		},
		//return the login form to be presented to the user

			getLoginContent: function() {
				var dialogContent;
				var type = this.model.get("type");
				if (type == "form") {
					dialogContent = '<form><table>' + '<tr><td>' + this.model.get("userNameLabel") + '</td>' + '<td><input type="text" id="loginFormUsername" name="loginFormUsername"/></td></tr>' + '<tr><td>'
					 + this.model.get("passwordLabel") + '</td>' + '<td><input type="password" id="loginFormPassword" name="loginFormUsername"/></td></tr>' + '</table></form>';
				} else if (type == "iframe") {
					dialogContent = '<form><table>' + '<iframe  id="loginIframe"  frameborder="0"  vspace="0"  hspace="0"  marginwidth="2"  marginheight="2" width="700"  ' + 'height="600"  src="' 
					+ this.model.get("authUrl") + '"></iframe></table></form>';
				}

				dialogContent = dialogContent + '<br/><span class="warning"></span>';
				

				return dialogContent;
			},
			
			// retrieve user entered values, generate https request and set login flag

				// some special processing is included for running on localhost
				processFormLogin :function() {
					var that = this;
					var url = this.model.get("authUrl");
					//var url = this.authenticationPage;
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
				console.log(data);
				that.model.set(data);
				if (data.message !== null) {
					that.showLoginMessage(data.message);
				}
			},

						error : that.loginResponseError
					};
					jQuery.ajax(ajaxArgs);

				},
				
				showLoginMessage: function(passedMessage){
					if (passedMessage.length > 0){
						jQuery("#loginDialog .warning").text(passedMessage);
					}
				},
				processIframeLogin: function(){
					var that = this;
					jQuery.receiveMessage(
						function(e) {
							that.model.set(jQuery.parseJSON(e.data));
						},
						window.location.protocol + "//" + window.location.host);
				},
				
			loginResponseError: function(data){
				showLoginMessage(data.message);
			},
			//callback handler invoked with response to authenticate server call
			//sets the userId variable to hold the id of the logged in user
			processLoginState: function(model) {
				if (model.get("authenticated")) {
					
					console.log("authchanged true");
					jQuery("#headerLogin").text("Logout");

					jQuery("#loginDialog").dialog('close');
					jQuery(".loginButton").trigger("loginSucceeded");
					
				} else {
					jQuery("#headerLogin").text("Login");
					console.log("authchanged false");	
					jQuery(".previewControl").trigger("logoutSucceeded");
				
				}
			}



	});










/*

	
	this.logoutResponse = function() {
		var that = this;
		jQuery(document).on("logoutSucceeded", function(event){
			jQuery("#headerLogin").text("Login").unbind("click");
			jQuery("#headerLogin").click(function(event){that.promptLogin(event);});
			that.changeControlsToLoginButtons(that.config.getHomeInstitution());//get local inst.
			//
			//will also need to turn on login labels for layers in search results and cart, remove 
			//restricted layers from preview?
			//should we logout on page load to prevent weird states? or just check the state at page load?
		});
	};

	this.promptLogin = function(event){
		console.log("promptLogin");
		this.loginDialog();
	};



// retrieve user entered values, generate https request and set login flag
// some special processing is included for running on localhost 
this.processFormLogin = function()
{
	var that = this;
	var url = this.getUrl() + this.authenticationPage;
	//var url = this.authenticationPage;
	var username = jQuery("#loginFormUsername").val();
	var password = jQuery("#loginFormPassword").val();
	var ajaxArgs = {
			type: "POST",
			url: url, 
			context: that,
			crossDomain: true,
			xhrFields: {
				withCredentials: true
				},
			data: {"username": username, "password": password},
			dataType: "json",
			success: that.loginResponse, 
			error: that.loginResponseError};
	jQuery.ajax(ajaxArgs);
	
};
	



this.processLogout = function(){
	//for logout capability
	var that = this;
	var url = this.getUrl() + "logout";
	var ajaxArgs = {url: url, 
		crossDomain: true,
		xhrFields: {
			withCredentials: true
			},
		context: that,
		dataType: "json",
		success: that.logoutResponse
		};
	jQuery.ajax(ajaxArgs);
};

//callback handler invoked with response to authenticate server call
//sets the userId variable to hold the id of the logged in user
this.loginStatusResponse = function(data, textStatus, jqXHR)
{

	var that = this;
	if (data.authenticated)
	{
		var username = data.username;
		this.userId = username || data.authenticated;
		jQuery(document).trigger("loginSucceeded");
	}
	else
	{
		that.loginStatusError(data,textStatus,jqXHR);

	}
};
//callback handler invoked with response to authenticate server call
//sets the userId variable to hold the id of the logged in user
this.loginResponse = function(data, textStatus, jqXHR){
	var that = this;
	if (data.authenticated){
		var username = data.username;
		this.userId = username || data.authenticated;
		jQuery("#loginDialog").dialog('close');	
		jQuery(document).trigger("loginSucceeded");
	}
	else{
		that.loginResponseError(data,textStatus,jqXHR);

	}
};

this.logoutResponse = function(data, textStatus, jqXHR) {
	var that = this;
	if (!data.authenticated) {
		this.userId = null;
		jQuery(document).trigger("logoutSucceeded");
	} else {
		jQuery(document).trigger("logoutFailed");
	}

};
//callback handler invoked when if an error occurs during ajax call to authenticate a user
this.loginResponseError = function(jqXHR, textStatus, errorThrown){
	this.userId = null;
	this.loginDialog({"message": "login failed"});
	jQuery(document).trigger("loginFailed");
};

//callback handler invoked when if an error occurs during ajax call to authenticate a user
this.loginStatusError = function(jqXHR, textStatus, errorThrown){
	this.userId = null;
	jQuery(document).trigger("loginFailed");
};

	
*/
