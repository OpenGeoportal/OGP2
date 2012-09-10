package org.OpenGeoPortal.Authentication;


public class AuthenticationObject {
	private String institution;
	private OgpRoles role;
	private String username;
	private String password;
	private Boolean authenticated;
	
	AuthenticationObject(String institution, OgpRoles ogpRole, String username, String password, Boolean authenticated){
		this.institution = institution;
		this.role = ogpRole;
		this.username = username;
		this.password = password;
		this.authenticated = authenticated;
	}
	
	public String getInstitution() {
		return institution;
	}
	public void setInstitution(String institution) {
		this.institution = institution;
	}
	public OgpRoles getRole() {
		return role;
	}
	public void setRole(OgpRoles role) {
		this.role = role;
	}
	public String getUsername() {
		return username;
	}
	public void setUsername(String username) {
		this.username = username;
	}
	public String getPassword() {
		return password;
	}
	public void setPassword(String password) {
		this.password = password;
	}
	public Boolean getAuthenticated() {
		return authenticated;
	}
	public void setAuthenticated(Boolean authenticated) {
		this.authenticated = authenticated;
	}
}
