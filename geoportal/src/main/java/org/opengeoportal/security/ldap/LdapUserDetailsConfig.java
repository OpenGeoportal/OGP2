package org.opengeoportal.security.ldap;

import java.util.*;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.ldap.core.DirContextOperations;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.ldap.userdetails.LdapUserDetailsMapper;
import org.springframework.security.ldap.userdetails.UserDetailsContextMapper;

@Configuration
public class LdapUserDetailsConfig {
	@Value("${login.ldap.admins:")
	String admins;

	@Bean("ogpUserDetailsContextMapper")
	public UserDetailsContextMapper userDetailsContextMapper() {
		return new LdapUserDetailsMapper() {
			private String admins;
			private List<String> adminList = new ArrayList<>();

			final Logger logger = LoggerFactory.getLogger(this.getClass());

			public void setAdmins(){
				if (!admins.isBlank()){
					adminList = List.of(admins.replace(" ", "").split(","));
				}
			}

			private Boolean isAdmin(String username){
				if (adminList == null) {
					setAdmins();
				}
				return adminList.contains(username.toLowerCase());
			}

			@Override
			public UserDetails mapUserFromContext( DirContextOperations ctx, String username, Collection<? extends GrantedAuthority> authority ){

				UserDetails originalUser = super.mapUserFromContext( ctx, username, authority );

				Set<GrantedAuthority> authorities = new HashSet<GrantedAuthority>();
				authorities.add(new SimpleGrantedAuthority("ROLE_USER"));

				if(isAdmin(originalUser.getUsername())){
					authorities.add(new SimpleGrantedAuthority("ROLE_ADMIN"));
				}
				//logger.debug(originalUser.getUsername());
				//logger.debug(originalUser.getPassword());
				//logger.debug(authorities.toString());

				// create a new user with applied authorities
				User newUser = new User(originalUser.getUsername(), "password", authorities);

				return newUser;
			}
		};
	}

}