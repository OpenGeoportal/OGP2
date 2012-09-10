package org.OpenGeoPortal.Authentication;

public class AlwaysAuthenticateAuthenticationMethod implements AuthenticationMethod {

	private String institution;
	//institution is set as a bean property

	@Override
	public boolean authenticate(String username, String password) {
		return true;
	}
	
	public void setInstitution(String institution){
		this.institution = institution;
	}
	
	@Override
	public String getInstitution(){
		return this.institution;
	}

}
