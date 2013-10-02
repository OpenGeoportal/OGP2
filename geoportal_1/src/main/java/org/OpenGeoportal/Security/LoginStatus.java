package org.OpenGeoportal.Security;

import java.util.Collection;

import org.springframework.security.core.GrantedAuthority;

public class LoginStatus {
    private final boolean authenticated;
    private final String username;
    private final Collection<? extends GrantedAuthority> authorities;

	public LoginStatus(boolean loggedIn, String username, Collection<? extends GrantedAuthority> authorities) {
      this.authenticated = loggedIn;
      this.username = username;
      this.authorities = authorities;
    }
 
    public boolean isAuthenticated() {
      return authenticated;
    }
 
    public String getUsername() {
      return username;
    }
    
    public Collection<? extends GrantedAuthority> getAuthorities() {
		return authorities;
	}
}
