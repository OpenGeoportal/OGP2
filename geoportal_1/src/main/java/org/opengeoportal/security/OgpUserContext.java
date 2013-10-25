package org.opengeoportal.security;

public interface OgpUserContext {
	//boolean authenticate(String username, String password);
	boolean isAuthenticatedLocally();
}
