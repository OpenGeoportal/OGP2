package org.opengeoportal;

import java.io.IOException;
import java.util.HashSet;
import java.util.Set;

import org.opengeoportal.config.datatypes.DatatypesConfigRetriever;
import org.opengeoportal.config.ogp.OgpConfig;
import org.opengeoportal.config.ogp.OgpConfigRetriever;
import org.opengeoportal.config.proxy.ProxyConfigRetriever;
import org.opengeoportal.config.repositories.RepositoryConfigRetriever;
import org.opengeoportal.config.topics.TopicsConfigRetriever;
import org.opengeoportal.config.wro.WroConfig;
import org.opengeoportal.config.wro.WroConfigRetriever;
import org.opengeoportal.security.LoginService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.servlet.ModelAndView;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;

/**
 * The Controller for the main OGP page.
 * 
 * Bootstraps config info. Also passes info from the "Share Cart" url.
 * 
 * @author cbarne02
 *
 */
@Controller
public class HomeController {
	@Autowired
	private OgpConfigRetriever ogpConfigRetriever;
	
	@Autowired
	private TopicsConfigRetriever topicsConfigRetriever;
	
	@Autowired
	private DatatypesConfigRetriever dataTypesConfigRetriever;
	
	@Autowired
	private ProxyConfigRetriever proxyConfigRetriever;
	
	@Autowired
	private WroConfigRetriever wroConfigRetriever;
	
	@Autowired
	private LoginService loginService;
	
	@Autowired
	private RepositoryConfigRetriever repositoryConfigRetriever;

	
	final Logger logger = LoggerFactory.getLogger(this.getClass());

	@RequestMapping(value={"/index", "/"}, method=RequestMethod.GET)
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

		mav.addObject("dev", isDev);
		
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
		
		
		
		addConfig(mav, isDev);
		
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
	
	private void addConfig(ModelAndView mav, Boolean isDev) throws IOException{
		OgpConfig conf = ogpConfigRetriever.getConfig();
		
		mav.addObject("titlePrimary", conf.getPageTitlePrimary());
		mav.addObject("titleOffset", conf.getPageTitleOffset());
		
		mav.addObject("extraJs", conf.getJsLocalized());
		mav.addObject("extraCss", conf.getCssLocalized());
		
		mav.addObject("searchUrl", conf.getSearchUrl().toString());
		mav.addObject("analyticsId", conf.getAnalyticsId());
		
		mav.addObject("loginRepository", conf.getLoginConfig().getRepositoryId());
		mav.addObject("loginType", conf.getLoginConfig().getType());
		mav.addObject("loginUrl", conf.getLoginConfig().getUrl());
		mav.addObject("secureDomain", conf.getLoginConfig().getSecureDomain());
		mav.addObject("loginStatus", toJsonString(loginService.getStatus()));
		mav.addObject("topics", toJsonString(topicsConfigRetriever.getConfig()));
		
		mav.addObject("dataTypes", toJsonString(dataTypesConfigRetriever.getConfig()));
		mav.addObject("proxies", toJsonString(proxyConfigRetriever.getPublicConfig()));
		
		mav.addObject("repositories", toJsonString(repositoryConfigRetriever.getConfig()));

		if (isDev){
			WroConfig wro = wroConfigRetriever.getConfig().get(0);
			mav.addObject("devCss", wro.getCss());
			mav.addObject("devJs", wro.getJs());
		}
	}
	
	private String toJsonString(Object obj) throws JsonProcessingException{
		ObjectMapper mapper = new ObjectMapper();
		return mapper.writeValueAsString(obj);
	}
	
}
