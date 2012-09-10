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

public class LogoutServlet implements HttpRequestHandler {
	private OgpAuthenticator ogpAuthenticator;



	public OgpAuthenticator getOgpAuthenticator() {
		return ogpAuthenticator;
	}



	public void setOgpAuthenticator(OgpAuthenticator ogpAuthenticator) {
		this.ogpAuthenticator = ogpAuthenticator;
	}

	@Override
	public void handleRequest(HttpServletRequest request,
			HttpServletResponse response) throws ServletException, IOException {


		/**
		  this jsp logs the user out by killing the session
		*/
		HttpSession session = request.getSession();
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

		response.setContentType("application/json");
		//return a json object to let the client know login status 
		response.getWriter().write(returnValue);
	}
}
