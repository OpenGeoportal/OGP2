<%@ page language="java" contentType="text/json; UTF-8" pageEncoding="UTF-8" import="edu.tufts.utils.*,java.util.Map, java.util.HashMap"%>

<% 

/**
  this jsp handles jsonp authentication requests

  it is called by client side code after the user enters their username and password.

  the session variable is used to store the authentication state of the user.  the
    session variable "username" holds the id of the logged in user.  if no user is
    logged in, the session variable "username" is null.  download related jsp 
    should check this session variable for non-public layers.
  
  note that this jsp only works via jsonp.  the OpenGeoPortal client must use jsonp 
    based cross-site scripting because the authentication request must be over https
    while the page is typically served over http.  This protocol mismatch is,
    by definition, a cross-site request so a standard ajax call would fail.
  
  we authenticate against an LDAP server at Tufts University.  
    (this LDAP server may hand off the authentication request to an AD server)
*/

String username = request.getParameter("username");
String password = request.getParameter("password");
String callback = request.getParameter("callback");

System.out.println("username attribute = " + session.getAttribute("username"));

boolean authenticated = false;

if ((username == null) || (password == null) || (callback == null))
{
	String returnValue = "{\"authenticated\": false, \"admin\": false, \"username\": \"" + username + "\"}";
	
	out.write(returnValue);	
}
else
{	
	// here with all required arguments
	// authenticate against local resources
	authenticated = LDAP.authenticate(username, password);
	
	System.out.println("for " + username + " LDAP returned " + authenticated);
	
	// now, build jsonp response
	String returnValue = "{\"authenticated\": " + authenticated + ", \"admin\": false, \"username\": \"" + username + "\", \"institution\": \"tufts\" }";
	returnValue = callback + "(" + returnValue + ")";
	out.write(returnValue);
}
//make the attribute an object that contains necessary info
if (authenticated){
	session.setAttribute("username", username);
} else {
	session.removeAttribute("username");
}
%>