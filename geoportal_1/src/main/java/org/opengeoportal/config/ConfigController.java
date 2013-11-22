package org.opengeoportal.config;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.opengeoportal.config.ogp.OgpConfig;
import org.opengeoportal.config.ogp.OgpConfigRetriever;
import org.opengeoportal.config.proxy.ProxyConfig;
import org.opengeoportal.config.proxy.ProxyConfigRetriever;
import org.opengeoportal.config.repositories.RepositoryConfig;
import org.opengeoportal.config.repositories.RepositoryConfigRetriever;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.ResponseBody;

@Controller
@RequestMapping("/config")
public class ConfigController {

	final Logger logger = LoggerFactory.getLogger(this.getClass());

	@Autowired
	RepositoryConfigRetriever repositoryConfigRetriever;
	
	@Autowired
	OgpConfigRetriever ogpConfigRetriever;
	
	@Autowired
	ProxyConfigRetriever proxyConfigRetriever;
	
	@RequestMapping(value="repositories", method=RequestMethod.GET, produces="application/json")
	public @ResponseBody List<RepositoryConfig> getRepositoryConfig() throws Exception {

		return repositoryConfigRetriever.getConfig();
	}
	
	@RequestMapping(value="general", method=RequestMethod.GET, produces="application/json")
	public @ResponseBody OgpConfig getSearchConfig() throws Exception {

		return ogpConfigRetriever.getConfig();
	}
	
	@RequestMapping(value="proxy", method=RequestMethod.GET, produces="application/json")
	public @ResponseBody List<ProxyConfig> getProxyConfig() throws Exception {
		//must only serve a reduced version...we don't want to hand out internal addresses/credentials to the client
		return proxyConfigRetriever.getPublicConfig();

	}
}