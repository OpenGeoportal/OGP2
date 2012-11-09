package org.OpenGeoPortal.Security;

public interface OgpUserContext {
	//boolean authenticate(String username, String password);
	boolean isAuthenticatedLocally();
}
