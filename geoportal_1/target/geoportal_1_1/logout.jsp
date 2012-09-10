<%@ page language="java" contentType="text/json; charset=UTF-8" pageEncoding="UTF-8" %>

<%
/**
  this jsp logs the user out by killing the session
*/

boolean authenticated = false;
while (session.getAttributeNames().hasMoreElements()) {
	if (session.getAttributeNames().nextElement().equals("username")){
		authenticated = true;
		break;
	}
}

String returnValue;
if (authenticated)
	session.invalidate();

returnValue = "{\"authenticated\": false, \"admin\": false}";

System.out.println("logged out");

out.write(returnValue);

%>