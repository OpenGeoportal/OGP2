package org.OpenGeoPortal.Security;

import java.util.ArrayList;
import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

@Service("formLoginService")
public class FormLoginService implements LoginService {
	final Logger logger = LoggerFactory.getLogger(this.getClass());

    @Autowired(required = false)
    @Qualifier("authenticationManager")
    AuthenticationManager authenticationManager;

    public LoginStatus getStatus() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && !auth.getName().equals("anonymousUser") && auth.isAuthenticated()) {
            return new LoginStatus(true, auth.getName(), auth.getAuthorities());
        } else {
            return new LoginStatus(false, null, auth.getAuthorities());
        }
    }

    public LoginStatus login(String username, String password) {
        UsernamePasswordAuthenticationToken token = new UsernamePasswordAuthenticationToken(username, password);
        logger.info("Attempting login.");
        try {
            Authentication auth = authenticationManager.authenticate(token);
            logger.info("Login succeeded!");
            SecurityContextHolder.getContext().setAuthentication(auth);

            return new LoginStatus(auth.isAuthenticated(), auth.getName(), auth.getAuthorities());
        } catch (BadCredentialsException e) {
        	List<GrantedAuthority> authorities = new ArrayList<GrantedAuthority>();
            return new LoginStatus(false, null, authorities);
        }
    }

	@Override
	public LoginStatus logout() {     
		logger.info("Logout succeeded!");
        SecurityContextHolder.getContext().getAuthentication().setAuthenticated(false);

        List<GrantedAuthority> authorities = new ArrayList<GrantedAuthority>();
        return new LoginStatus(false, null, authorities);
        
	}
}
