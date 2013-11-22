package org.opengeoportal.proxy.controllers;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.opengeoportal.config.proxy.ProxyConfigRetriever;
import org.opengeoportal.proxy.GenericProxy;
import org.opengeoportal.security.OgpUserContext;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;

@Controller
@RequestMapping("/restricted/*")
public class RestrictedWMSController {
	final Logger logger = LoggerFactory.getLogger(this.getClass());

	@Autowired
	private ProxyConfigRetriever proxyConfigRetriever;

	@Autowired
	private OgpUserContext ogpUserContext;
	@Autowired @Qualifier("proxy.simple")
	private GenericProxy genericProxy;
	
	@RequestMapping(value="/{repositoryId}/wms", method=RequestMethod.GET)
	public void forwardWMSRequest(@PathVariable String repositoryId, HttpServletRequest request, HttpServletResponse response) throws Exception {
		// check authentication
		if (ogpUserContext.isAuthenticatedLocally()){
			// forward the request to the protected GeoServer instance

			String remoteUrl = this.getProxyTo(repositoryId) + "?"
					+ request.getQueryString();
			logger.info("executing WMS request to protected GeoServer: "
					+ remoteUrl);
			this.genericProxy.proxyRequest(request, response, remoteUrl);
		} else {
			response.sendError(403);
		}
	}
	
	public String getProxyTo(String repositoryId) throws Exception {
		
		return proxyConfigRetriever.getInternalProxy("wms", repositoryId, "restricted");
	}


}
