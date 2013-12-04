package org.opengeoportal.security;

import java.io.Serializable;

import org.opengeoportal.config.ogp.OgpConfigRetriever;
import org.opengeoportal.solr.SolrRecord;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.PermissionEvaluator;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
/**
 * use this class to determine if the user has permission to perform an action on a layer
 * Use this in conjunction with Spring Security hasPermission annotation expression
 * 
 * 
 * @author cbarne02
 *
 */
public class LayerPermissionEvaluator implements PermissionEvaluator {
	final Logger logger = LoggerFactory.getLogger(this.getClass());
	
	@Autowired
	OgpConfigRetriever ogpConfigRetriever;
	
	@Override
	public boolean hasPermission(Authentication authentication, Object targetDomainObject, Object permission){
		logger.info("checking permission...");
		  boolean hasPermission = false;
		  
		  if (targetDomainObject instanceof SolrRecord){
			  SolrRecord sr = (SolrRecord) targetDomainObject;
			  if (sr.getAccess().equalsIgnoreCase("public")){
				  hasPermission = true;
			  } else if (authentication.isAuthenticated() && hasAuthority(authentication, "ROLE_USER")){

				  String repId = ogpConfigRetriever.getConfig().getLoginConfig().getRepositoryId();
				  if (sr.getInstitution().equalsIgnoreCase(repId)){
					  hasPermission = true;
				  }
				  //also get repositoryId for authentication
				  //if the 2 match return true;
				  //should we add repository specific authority?
			  }
			 
		  } else {
			  logger.error("Only allowed to authorize using SolrRecord Object.");
		  }
		  	 //user should have access:
			  //1. layer is public
			  //2. user is authenticated and repository matches authentication repository
			  //Permissions: data access
			  //currently, it's really just yes, the user can access the data, or no they can't
			  //all metadata is available to the user

		  return hasPermission;
		  
		   
	}

	private boolean hasAuthority(Authentication authentication, String role) {
		  logger.info(authentication.getName());
		  for (GrantedAuthority ga: authentication.getAuthorities()){
			  logger.info(ga.getAuthority());
			  if (ga.getAuthority().equalsIgnoreCase(role)){
				  return true;
			  }
		  }

		return false;
	}

	@Override
	public boolean hasPermission(Authentication auth, Serializable targetId, String targetType, Object permission) {
		// TODO Auto-generated method stub
		return false;
	}

}
