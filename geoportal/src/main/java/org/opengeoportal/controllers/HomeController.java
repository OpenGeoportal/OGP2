package org.opengeoportal.controllers;

import java.io.IOException;
import java.util.HashSet;

import java.util.Set;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.opengeoportal.config.clientoptions.OgpClientConfigRetriever;
import org.opengeoportal.config.clientoptions.domain.OgpClientConfig;
import org.opengeoportal.config.ogp.OgpConfig;
import org.opengeoportal.config.ogp.OgpConfigRetriever;
import org.opengeoportal.config.proxy.ProxyConfigRetriever;
import org.opengeoportal.config.wro.WroConfig;
import org.opengeoportal.config.wro.WroResourceRetriever;
import org.opengeoportal.security.LoginService;
import org.opengeoportal.user.UserState;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.servlet.ModelAndView;

@Controller
public class HomeController {
	@Autowired
	private OgpConfigRetriever ogpConfigRetriever;

	@Autowired
    private OgpClientConfigRetriever ogpClientConfigRetriever;


    @Autowired
    private ProxyConfigRetriever proxyConfigRetriever;

    @Autowired
    private WroResourceRetriever wroResourceRetriever;

    @Autowired
    private LoginService loginService;

    @Autowired
    UserState userState;

    final Logger logger = LoggerFactory.getLogger(this.getClass());

	@RequestMapping(value={"/index", "/"}, method=RequestMethod.GET)
	public ModelAndView getHomePage(@RequestParam(value="ogpids", defaultValue = "") Set<String> layerIds,
                                    @RequestParam(value = "bbox", defaultValue = "-180,-90,180,90") String bbox,
                                    @RequestParam(value = "layer[]", defaultValue = "") Set<String> layers,
                                    @RequestParam(value = "minX", defaultValue = "-180") String minx,
                                    @RequestParam(value = "maxX", defaultValue = "180") String maxx,
                                    @RequestParam(value = "minY", defaultValue = "-90") String miny,
                                    @RequestParam(value = "maxY", defaultValue = "90") String maxy,
                                    @RequestParam(value = "dev", defaultValue = "false") Boolean isDev) throws Exception {

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

    private void addConfig(ModelAndView mav, Boolean isDev) throws IOException {

        OgpClientConfig clientConfig = ogpClientConfigRetriever.getConfig();
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
        mav.addObject("topics", toJsonString(clientConfig.getTopics()));

        mav.addObject("dataTypes", toJsonString(clientConfig.getDatatypes()));
        mav.addObject("proxies", toJsonString(proxyConfigRetriever.getPublicConfig()));

        mav.addObject("repositories", toJsonString(clientConfig.getRepositories()));
        mav.addObject("basemaps", toJsonString(clientConfig.getBasemaps()));


        mav.addObject("userState", toJsonString(userState.getStateMap()));

        if (isDev) {
            Set<WroConfig> wroSet = wroResourceRetriever.getWroConfigSets();
            for (WroConfig wro : wroSet) {
                if (wro.getName().equalsIgnoreCase("ogp")) {
                    mav.addObject("devCss", wro.getCss());
                    mav.addObject("devJs", wro.getJs());
                } else if (wro.getName().equalsIgnoreCase("lib")) {
                    mav.addObject("libCss", wro.getCss());
                    mav.addObject("libJs", wro.getJs());
                }
            }
        }
    }

    private String toJsonString(Object obj) throws JsonProcessingException {
        ObjectMapper mapper = new ObjectMapper();
        return mapper.writeValueAsString(obj);
    }


}
