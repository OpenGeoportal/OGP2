package org.OpenGeoPortal.Authentication;

//import edu.tufts.utils.LDAP;

public class TuftsAuthenticationMethod implements AuthenticationMethod {

	private String institution = "Tufts";

	@Override
	public boolean authenticate(String username, String password) {
		return false;
		//return LDAP.authenticate(username, password);
	}
	
	@Override
	public String getInstitution(){
		return this.institution;
	}

}
