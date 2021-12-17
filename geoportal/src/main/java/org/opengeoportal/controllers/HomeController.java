package org.opengeoportal.controllers;

import java.util.HashSet;
import java.util.Set;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.opengeoportal.config.DataTypeConfig;
import org.opengeoportal.config.TopicConfig;
import org.opengeoportal.config.ogp.OgpConfig;
import org.opengeoportal.config.ogp.OgpConfigRetriever;
import org.opengeoportal.config.proxy.ProxyConfigRetriever;
import org.opengeoportal.config.repositories.RepositoryConfigRetriever;
import org.opengeoportal.security.LoginService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.servlet.ModelAndView;

@Controller
public class HomeController {
	private final OgpConfigRetriever ogpConfigRetriever;
	private final LoginService loginService;
	private final ProxyConfigRetriever proxyConfigRetriever;
	private final RepositoryConfigRetriever repositoryConfigRetriever;
	private final TopicConfig topicConfig;
	private final DataTypeConfig dataTypeConfig;

	final Logger logger = LoggerFactory.getLogger(this.getClass());

	@Value("${ogp.defaultBasemap:osm}")
	String basemap;

	@Autowired
	public HomeController(OgpConfigRetriever ogpConfigRetriever,
						  LoginService loginService,
						  ProxyConfigRetriever proxyConfigRetriever,
						  RepositoryConfigRetriever repositoryConfigRetriever,
						  TopicConfig topicConfig, DataTypeConfig dataTypeConfig) {
		this.ogpConfigRetriever = ogpConfigRetriever;
		this.loginService = loginService;
		this.proxyConfigRetriever = proxyConfigRetriever;
		this.repositoryConfigRetriever = repositoryConfigRetriever;
		this.topicConfig = topicConfig;
		this.dataTypeConfig = dataTypeConfig;
	}

	@GetMapping({"/", "/index"})
	public ModelAndView getHomePage(@RequestParam(value="ogpids", defaultValue = "") Set<String> layerIds,
			@RequestParam(value="bbox", defaultValue = "-180,-90,180,90") String bbox,
			@RequestParam(value="layer[]", defaultValue = "") Set<String> layers,
			@RequestParam(value="minX", defaultValue = "-180") String minx,
			@RequestParam(value="maxX", defaultValue = "180") String maxx,
			@RequestParam(value="minY", defaultValue = "-90") String miny,
			@RequestParam(value="maxY", defaultValue = "90") String maxy,
			@RequestParam(value="dev", defaultValue = "false") Boolean isDev) throws Exception {
		//@RequestParam("ogpids") Set<String> layerIds, ..should be optional.  also a param to set dev vs. prod
		//create the model to return
		ModelAndView mav = new ModelAndView("ogp_home");

		//mav.addObject("dev", isDev);
		
		//if ogpids exists, add them to the Model
		
		if (!layerIds.isEmpty()){

			mav.addObject("shareIds", getQuotedSet(layerIds));
			mav.addObject("shareBbox", bbox);
		} else if (!layers.isEmpty()){
			//support old style share just in case
			mav.addObject("shareIds", getQuotedSet(layers));
			mav.addObject("shareBbox", minx + "," + miny + "," + maxx + "," + maxy);
		} else {
			//default values
			mav.addObject("shareIds", layerIds);
			mav.addObject("shareBbox", bbox);	
		}
		
		
		
		addConfig(mav);
		
		//Debugging
		/*Iterator<Entry<String, Object>> iter = mav.getModelMap().entrySet().iterator();
		  while (iter.hasNext()){
			Entry<String, Object> stuff = iter.next();
			logger.info(stuff.getKey());
			logger.info((String) stuff.getValue());
		}*/
		return mav;

	}
	
	private Set<String> getQuotedSet(Set<String> uqSet){
		Set<String> quotedSet = new HashSet<String>();
		for (String item: uqSet){
			quotedSet.add("\"" + item + "\""); 
		}
		
		return quotedSet;
	}
	
	private void addConfig(ModelAndView mav){
		OgpConfig conf = ogpConfigRetriever.getConfig();
		
		mav.addObject("titlePrimary", conf.getPageTitlePrimary());
		mav.addObject("titleOffset", conf.getPageTitleOffset());
		
		mav.addObject("extraJs", conf.getJsLocalized());	//<script type="text/javascript" src="resources/javascript/dataTables.scroller.min.js"></script>
		mav.addObject("extraCss", conf.getCssLocalized());  //<link rel="stylesheet" href="resources/css/google.css" type="text/css" />
		
		mav.addObject("analyticsId", conf.getAnalyticsId());
		mav.addObject("gmapsAPIKey", conf.getGmapsAPIKey());

		mav.addObject("loginRepository", conf.getLoginConfig().getRepositoryId());
		mav.addObject("loginType", conf.getLoginConfig().getType());
		mav.addObject("loginUrl", conf.getLoginConfig().getUrl());
		mav.addObject("secureDomain", conf.getLoginConfig().getSecureDomain());

		mav.addObject("basemap", basemap);

		//mav.addObject("loginStatus", toJsonString(loginService.getStatus()));
		mav.addObject("topics", toJsonString(topicConfig.getItems()));

		mav.addObject("dataTypes", toJsonString(dataTypeConfig.getItems()));
		mav.addObject("proxies", toJsonString(proxyConfigRetriever.getPublicConfig()));

		mav.addObject("repositories", toJsonString(repositoryConfigRetriever.getConfig()));


		//mav.addObject("userState", toJsonString(userState.getStateMap()));
		
	}

	private String toJsonString(Object obj) {
		try {
			ObjectMapper mapper = new ObjectMapper();
			return mapper.writeValueAsString(obj);
		} catch (JsonProcessingException e) {
			logger.error("error converting object to JSON string");
			return "{}";
		}
	}
}
