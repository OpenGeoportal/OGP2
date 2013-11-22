package org.opengeoportal.security;

import java.io.Serializable;

import org.springframework.security.access.PermissionEvaluator;
import org.springframework.security.core.Authentication;
/**
 * use this class to determine if the user has permission to perform an action on a layer
 * Use this in conjunction with Spring Security hasPermission annotation expression
 * 
 * 
 * @author cbarne02
 *
 */
public class LayerPermissionEvaluator implements PermissionEvaluator {

	@Override
	public boolean hasPermission(Authentication arg0, Object arg1, Object arg2) {
		// TODO Auto-generated method stub
		return false;
	}

	@Override
	public boolean hasPermission(Authentication arg0, Serializable arg1,
			String arg2, Object arg3) {
		// TODO Auto-generated method stub
		return false;
	}

}
