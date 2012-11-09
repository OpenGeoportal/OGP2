package org.OpenGeoPortal.Security;

public interface LoginService {

	  LoginStatus getStatus();

	  LoginStatus login(String username, String password);

	LoginStatus logout();
	}