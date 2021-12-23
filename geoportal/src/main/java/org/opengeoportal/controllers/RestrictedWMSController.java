package org.opengeoportal.controllers;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.opengeoportal.config.exception.ConfigException;
import org.opengeoportal.config.ogp.OgpConfigRetriever;
import org.opengeoportal.config.proxy.InternalServerMapping;
import org.opengeoportal.config.proxy.ProxyConfigRetriever;
import org.opengeoportal.proxy.GenericProxy;
import org.opengeoportal.proxy.ProxyFactory;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;

@Controller
@RequestMapping("/restricted/*")
public class RestrictedWMSController {
	final Logger logger = LoggerFactory.getLogger(this.getClass());

	private final ProxyConfigRetriever proxyConfigRetriever;

	final
	OgpConfigRetriever ogpConfigRetriever;
	
	private final ProxyFactory proxyFactory;

	@Autowired
	public RestrictedWMSController(ProxyConfigRetriever proxyConfigRetriever, OgpConfigRetriever ogpConfigRetriever, ProxyFactory proxyFactory) {
		this.proxyConfigRetriever = proxyConfigRetriever;
		this.ogpConfigRetriever = ogpConfigRetriever;
		this.proxyFactory = proxyFactory;
	}

	@PreAuthorize("hasAnyRole('ROLE_USER', 'ROLE_ADMIN')")
	@RequestMapping(value="/{repositoryId}/wms", method=RequestMethod.GET)
	public void forwardWMSRequest(@PathVariable String repositoryId, HttpServletRequest request, HttpServletResponse response) throws Exception {
		//If the request went through to the controller, we know that the user has authenticated
		//We're also checking that the repositoryId is equal to the one set in config for login capability and that there is a proxy defined
		//for the repositoryId
		//probably a better place to centralize/abstract this
		if (ogpConfigRetriever.getConfig().getLoginConfig().getRepositoryId().equalsIgnoreCase(repositoryId)  && proxyConfigRetriever.hasProxy("wms", repositoryId, "restricted")){
			// forward the request to the protected GeoServer instance

			InternalServerMapping proxyServer = null;
			try {
				proxyServer = this.getProxyTo(repositoryId);
			} catch (ConfigException e) {
				logger.error(e.getMessage());
				response.sendError(403);
			}
			assert proxyServer != null;
			String remoteUrl = proxyServer.getInternalUrl() + "?"
					+ request.getQueryString();
			logger.info("executing WMS request to protected GeoServer: "
					+ remoteUrl);
			GenericProxy proxy = proxyFactory.getObject();
			if (proxyConfigRetriever.hasCredentials(proxyServer)){
				proxy.proxyRequest(request, response, remoteUrl, proxyServer.getUsername(), proxyServer.getPassword());
			} else {
				proxy.proxyRequest(request, response, remoteUrl);
			}
		} else {
			response.sendError(403);
		}
	}
	
	public InternalServerMapping getProxyTo(String repositoryId) throws ConfigException {
		return proxyConfigRetriever.getInternalServerMapping("wms", repositoryId, "restricted");
	}


}
