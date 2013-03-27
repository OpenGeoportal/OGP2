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

this.getUrl = function(){
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
