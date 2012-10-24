/** 
 * This javascript module includes functions for dealing with login
 * 
 * @author Chris Barnett
 * 
 */

/**
 * create the namespace objects if they don't already exist
 */
if (typeof org == 'undefined'){ 
	org = {};
} else if (typeof org != "object"){
	throw new Error("org already exists and is not an object");
}

// Repeat the creation and type-checking code for the next level
if (typeof org.OpenGeoPortal == 'undefined'){
	org.OpenGeoPortal = {};
} else if (typeof org.OpenGeoPortal != "object"){
    throw new Error("org.OpenGeoPortal already exists and is not an object");
}

org.OpenGeoPortal.LogIn = function(institution){
	this.TYPE = org.OpenGeoPortal.InstitutionInfo.getLoginType(institution); //"iframe"; other choice is "form"; would be nice to get this from ogp config

	this.userNameLabel = institution + " Username:";
	this.passwordLabel = institution + " Password:";
	this.dialogTitle = "LOGIN";
	
	this.authenticationPage = org.OpenGeoPortal.InstitutionInfo.getAuthenticationPage(institution);;
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
	jQuery("#loginDialog").dialog("stack");

};

// retrieve user entered values, generate https request and set login flag
// some special processing is included for running on localhost 
this.processFormLogin = function()
{
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
	if ((port == "") || (port == null))
		port = "443";
	port = ":" + port;
	var protocol = "https";
	if (hostname == "localhost")
		protocol = "http";
	var that = this;
	var url = protocol + "://" + hostname + port + "/" + extraPath + this.authenticationPage;
	var username = jQuery("#loginFormUsername").val();
	var password = jQuery("#loginFormPassword").val();
	var ajaxArgs = {url: url, type: "POST", 
			context: that,
			data: {"username": username, "password": password},
			dataType: "jsonp",
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

//callback handler invoked with response to authenticate server call
//sets the userId variable to hold the id of the logged in user
this.loginResponse = function(data, textStatus, jqXHR)
{
	var loggedIn = data.authenticated;
	var username = data.username;
	var that = this;
	if (loggedIn)
	{
		if (typeof _gaq != "undefined")
			_gaq.push(["_trackEvent", "login", "success"]);
		this.userId = username || loggedIn;
		jQuery("#loginDialog").dialog('close');	
		jQuery(document).trigger("loginSucceeded");
	}
	else
	{
		if (typeof _gaq != "undefined")
			_gaq.push(["_trackEvent", "login", "failed"]);
		this.userId = null;
		this.loginDialog({"message": "login failed"});
		jQuery(document).trigger("loginFailed");

	}
};


//callback handler invoked when if an error occurs during ajax call to authenticate a user
this.loginResponseError = function(jqXHR, textStatus, errorThrown){
	this.loginDialog({"message": "an error occured during log in: " + textStatus});
	this.userId = null;
};

	
};
