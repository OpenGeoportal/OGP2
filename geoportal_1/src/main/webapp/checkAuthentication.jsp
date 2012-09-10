<%@ page language="java" contentType="text/json; charset=UTF-8" pageEncoding="UTF-8" %>

<% 

/**
  this jsp checks to see if the user is authenticated in an existing session
*/

boolean authenticated = false;
while (session.getAttributeNames().hasMoreElements()) {
	if (session.getAttributeNames().nextElement().equals("username")){
		authenticated = true;
		break;
	}
}

String returnValue;
if (authenticated) {
	returnValue = "{\"authenticated\": " + authenticated + ", \"admin\": false, \"username\": \"" + session.getAttribute("username") + "\", \"institution\": \"tufts\" }";
} else {
	returnValue = "{\"authenticated\": false, \"admin\": false}";
}

out.write(returnValue);

%>