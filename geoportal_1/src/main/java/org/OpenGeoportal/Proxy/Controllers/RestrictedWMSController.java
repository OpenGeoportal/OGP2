package org.OpenGeoportal.Proxy.Controllers;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.OpenGeoportal.Proxy.GenericProxy;
import org.OpenGeoportal.Security.OgpUserContext;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;

@Controller
@RequestMapping("/restricted/*")
public class RestrictedWMSController {
	final Logger logger = LoggerFactory.getLogger(this.getClass());

	private @Value("${ogp.proxyToWMS}") String proxyTo;


	@Autowired
	private OgpUserContext ogpUserContext;
	@Autowired @Qualifier("proxy.simple")
	private GenericProxy genericProxy;
	
	@RequestMapping(value="/wms", method=RequestMethod.GET)
	public void forwardWMSRequest(HttpServletRequest request, HttpServletResponse response) throws Exception {
		// check authentication
		if (ogpUserContext.isAuthenticatedLocally()){
			// forward the request to the protected GeoServer instance

			String remoteUrl = this.getProxyTo() + "?"
					+ request.getQueryString();
			logger.info("executing WMS request to protected GeoServer: "
					+ remoteUrl);
			this.genericProxy.proxyRequest(request, response, remoteUrl);
		} else {
			response.sendError(403);
		}
	}
	
	public String getProxyTo() {
		return proxyTo;
	}

	public void setProxyTo(String proxyTo) {
		this.proxyTo = proxyTo;
	}
}
