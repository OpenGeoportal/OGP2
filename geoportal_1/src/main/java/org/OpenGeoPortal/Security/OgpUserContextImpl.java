package org.OpenGeoPortal.Security;

import org.springframework.security.core.context.SecurityContextHolder;

public class OgpUserContextImpl implements OgpUserContext {
	
	@Override
	public boolean isAuthenticatedLocally() {
		boolean authenticated = false;
		try {
			authenticated = SecurityContextHolder.getContext().getAuthentication().isAuthenticated();
		} catch (NullPointerException e){
			authenticated = false;
		}
		return authenticated;
	}

	/*@Override
	public boolean authenticate(String username, String password) {
		// TODO Auto-generated method stub
		return authenticationMethod.authenticate(username, password);
	}*/


}
