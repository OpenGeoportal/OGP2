package org.OpenGeoPortal.Authentication;

public interface AuthenticationMethod {

	boolean authenticate(String username, String password);

	String getInstitution();

}
