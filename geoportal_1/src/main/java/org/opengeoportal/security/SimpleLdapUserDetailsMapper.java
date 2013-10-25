package org.opengeoportal.security;

import java.util.Collection;
import java.util.HashSet;
import java.util.Set;

import org.apache.commons.lang.ArrayUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.ldap.core.DirContextOperations;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.ldap.userdetails.LdapUserDetailsMapper;

public class SimpleLdapUserDetailsMapper extends LdapUserDetailsMapper {
	protected String admins;
	protected String[] adminList;
	final Logger logger = LoggerFactory.getLogger(this.getClass());

	
	public void setAdmins(String admins){
		admins = admins.replace(" ", "");
		adminList = admins.split(",");
	}
	
	protected Boolean isAdmin(String username){
		return ArrayUtils.contains(adminList, username);
	}
	
	@Override
	public UserDetails mapUserFromContext( DirContextOperations ctx, String username, Collection<? extends GrantedAuthority> authority ){
	
		UserDetails originalUser = super.mapUserFromContext( ctx, username, authority );

		// Current authorities come from LDAP groups

		Set<GrantedAuthority> authorities = new HashSet<GrantedAuthority>();
		authorities.add(new SimpleGrantedAuthority("ROLE_USER"));
		
		if(isAdmin(originalUser.getUsername())){
			authorities.add(new SimpleGrantedAuthority("ROLE_ADMIN"));
		}
		logger.debug(originalUser.getUsername());
		logger.debug(originalUser.getPassword());
		logger.debug(authorities.toString());
		User newUser = new User(originalUser.getUsername(), "password", authorities);

		return newUser;
	}
}