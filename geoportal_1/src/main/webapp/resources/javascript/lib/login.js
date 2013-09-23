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
		authorities: []
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
	}
});

OpenGeoportal.Views.Login = Backbone.View.extend({
	model: OpenGeoportal.Models.User,
	events: {
		//"click .loginButton: promptLogin"
	},
	initialize: function(){
		this.model.fetch();
		//we could put this on setInterval, so that when the user's session expires, they get properly logged out
		//this.listenTo(this.model, "change:authenticated", this.processLogin);
	
	}
});

OpenGeoportal.LogIn = function(institution){
	this.TYPE = OpenGeoportal.InstitutionInfo.getLoginType(institution); //"iframe"; other choice is "form"; would be nice to get this from ogp config

	this.userNameLabel = institution + " Username:";
	this.passwordLabel = institution + " Password:";
	this.dialogTitle = "LOGIN";
	
	this.authenticationPage = OpenGeoportal.InstitutionInfo.getAuthenticationPage(institution);;
	this.ogpBase = window.location.protocol + "//" + window.location.host;
	//this.responseObject = null;
	// userId is null if no user is logged in
	// when non-null, it is the id of the logged in user
	this.userId = null;

	this.isLoggedIn = function(){
		if (this.userId == null){
			return false;
		} else {
			return true;
		}
	};
	
	
	this.loginHandler = function(){
		var that = this;
		jQuery(document).off(".login");

		var promptLogin = function(e){that.promptLogin(e);};
		jQuery(document).on("click.login", ".loginButton", promptLogin); 
		jQuery("#headerLogin").on("click.login", promptLogin);

	};
	
	/*
	 * 
	 * login code
	 * 
	 */


	this.loginStatusHandler = function(){
		jQuery(document).bind("loginSucceeded", function(){
			jQuery(document).trigger("loginSuccess.addToCart");
			that.applyLoginActions();
			analytics.track("Login", "Login Success");
		});
		jQuery(document).on("loginFailed", function() {
			analytics.track("Login", "Login Failure");
		});	
	};
	
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
		this.loginDialog();
	};

	this.applyLoginActions = function(){
		// how do we update the UI so the user know login succeeded?
		this.changeLoginButtonsToControls();
		//change the login button in top right to logout
		var that = this;
		//console.log(this);
		jQuery("#headerLogin").text("Logout");
		jQuery("#headerLogin").unbind("click");
		jQuery("#headerLogin").click(function(event){event.preventDefault();
		//for logout capability
		that.login.processLogout();
		/*var ajaxArgs = {url: "logout", 
			crossDomain: true,
			xhrFields: {
				withCredentials: true
				},
			context: that,
			dataType: "json",
			success: that.logoutResponse
			};
		jQuery.ajax(ajaxArgs);*/
		});
	};

//return the login form to be presented to the user
	this.getLoginContent = function(message){
		var dialogContent;
		if (this.TYPE == "form"){
			dialogContent = '<form><table>' + 
			'<tr><td>' + this.userNameLabel + '</td>' + 
			'<td><input type="text" id="loginFormUsername" name="loginFormUsername"/></td></tr>' +
			'<tr><td>' + this.passwordLabel + '</td>' + 
			'<td><input type="password" id="loginFormPassword" name="loginFormUsername"/></td></tr>' +
			'</table></form>';
		} else if (this.TYPE == "iframe"){
			dialogContent = '<form><table>' +
			'<iframe  id="loginIframe"  frameborder="0"  vspace="0"  hspace="0"  marginwidth="2"  marginheight="2" width="700"  ' +
			'height="600"  src="' + this.authenticationPage + '"></iframe></table></form>';
		}
		if (message != null) {
			dialogContent = dialogContent + '<br/><span class="warning">' + message + "</span>";
		}
		
		return dialogContent;
	};

	this.loginDialog = function(loginObj){
		var dialogContent = "";
		if (loginObj == null){
			dialogContent = this.getLoginContent();
		} else if (typeof loginObj.message == "undefined"){
			dialogContent = this.getLoginContent();
		} else {
			dialogContent = this.getLoginContent(loginObj.message);
		}
	
		var that = this;
		if (typeof jQuery('#loginDialog')[0] == 'undefined'){
			var shareDiv = '<div id="loginDialog" class="dialog"> \n';
			shareDiv += dialogContent;
			shareDiv += '</div> \n';
			jQuery('body').append(shareDiv);
		
			var loginButtons;
			if (this.TYPE == "form"){
				loginButtons = {
						Login: function() {
							that.processFormLogin();
						},
						Cancel: function() {
							jQuery(this).dialog('close');
							jQuery(document).trigger("loginCancel");
						}
				};
			} else if (this.TYPE == "iframe"){
				loginButtons = {
						Cancel: function() {
							jQuery(this).dialog('close');
							jQuery(document).trigger("loginCancel");
						}
					};
			}
		
		jQuery("#loginDialog").dialog({
			autoOpen: false,
			width: 'auto',
			title: this.dialogTitle,
			context: that,
			resizable: false,
			zIndex: 3000,
			stack: true,
			buttons: loginButtons });
    } else {
    	//replace dialog text/controls & open the instance of 'dialog' that already exists
		jQuery("#loginDialog").html(dialogContent);
	}

	
	if (this.TYPE == "form"){
		jQuery("#loginDialog").unbind("keypress");
		jQuery('#loginDialog').bind("keypress", function(event){
			if (event.keyCode == '13') {
				that.processFormLogin();
			} 
		});
	} else if (this.TYPE == "iframe"){
		this.processIframeLogin();
	}
	
	jQuery("#loginDialog").dialog('open');
};

this.checkLoginStatus = function(){
	var that = this;
	var url = this.getUrl() + "loginStatus";
	var ajaxArgs = {url: url, type: "GET", 
			context: that,
			crossDomain: true,
			dataType: "json",
			success: that.loginStatusResponse
			};
	jQuery.ajax(ajaxArgs);
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
	
this.processIframeLogin = function(){
	var that = this;
	jQuery.receiveMessage(
			function(e) {
				that.loginResponse(jQuery.parseJSON(e.data));
				},
			that.ogpBase);
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

	
};
