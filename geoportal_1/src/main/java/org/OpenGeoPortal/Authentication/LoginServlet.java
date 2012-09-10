package org.OpenGeoPortal.Authentication;

import java.io.IOException;

import javax.servlet.ServletException;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.servlet.http.HttpSession;

import org.springframework.web.HttpRequestHandler;

/**
this servlet handles jsonp authentication requests

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

public class LoginServlet implements HttpRequestHandler {

	@Override
	public void handleRequest(HttpServletRequest request,
			HttpServletResponse response) throws ServletException, IOException {

		if (request.getScheme() != "https"){
			//only allow ssl requests
			response.setStatus(403);
		}
		if (request.getMethod() != "POST"){
			//only allow POST requests
			response.setStatus(403);
		}

		String username = request.getParameter("username");
		String password = request.getParameter("password");
		
		HttpSession session = request.getSession(true);//create a session if one doesn't exist
		System.out.println("username attribute = " + session.getAttribute("username"));

		boolean authenticated = false;
		String returnValue = null;
		if ((username == null) || (password == null)) {
			returnValue = "{\"authenticated\": false, \"admin\": false, \"username\": \"" + username + "\"}";
		} else {	
			// here with all required arguments
			// authenticate against local resources
			authenticated = ogpAuthenticator.authenticate(username, password);
			
			System.out.println("for " + username + " Authenticator returned " + authenticated);
			
			// now, build jsonp response
			returnValue = "{\"authenticated\": " + authenticated + ", \"admin\": false, \"username\": \"" + username + "\", \"institution\": \"tufts\" }";
		}
		//make the attribute an object that contains necessary info
		if (authenticated){
			session.setAttribute("username", username);
		} else {
			session.removeAttribute("username");
		}
		response.setContentType("application/json");
		//return a json object to let the client know login status 
		response.getWriter().write(returnValue);
	}
}
