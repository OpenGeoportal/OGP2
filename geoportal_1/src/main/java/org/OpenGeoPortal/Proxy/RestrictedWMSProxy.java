package org.OpenGeoPortal.Proxy;

import java.io.IOException;

import javax.servlet.ServletException;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.OpenGeoPortal.Authentication.OgpUserContext;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.HttpRequestHandler;

public class RestrictedWMSProxy implements HttpRequestHandler {
	private GenericProxy genericProxy;
	private String proxyTo;
	@Autowired
	private OgpUserContext ogpUserContext;

	//this needs to handle authentication if supplied a username and password

	public String getProxyTo() {
		return proxyTo;
	}

	public void setProxyTo(String proxyTo) {
		this.proxyTo = proxyTo;
	}

	public void setGenericProxy(GenericProxy genericProxy) {
		this.genericProxy = genericProxy;
	}

	public GenericProxy getGenericProxy() {
		return this.genericProxy;
	}

	private Boolean isLocallyAuthenticated(){
		try {
			return SecurityContextHolder.getContext().getAuthentication().isAuthenticated();
		} catch (NullPointerException e){
			return false;
		}
	}
	
	@Override
	public void handleRequest(HttpServletRequest request,
			HttpServletResponse response) throws ServletException, IOException {
		// check authentication
		if (ogpUserContext.isAuthenticatedLocally()){
			// forward the request to the protected GeoServer instance
			System.out.println("executing WMS request to protected GeoServer: "
					+ request.getQueryString());
			String remoteUrl = this.proxyTo + "?"
					+ request.getQueryString();
			
			this.genericProxy.proxyRequest(request, response, remoteUrl);
		} else {
			response.sendError(401);
		}

	}
}
