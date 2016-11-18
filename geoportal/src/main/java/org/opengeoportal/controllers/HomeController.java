package org.opengeoportal.controllers;

import java.util.HashSet;
import java.util.Iterator;
import java.util.Map;
import java.util.Set;

import org.opengeoportal.config.ogp.OgpConfig;
import org.opengeoportal.config.ogp.OgpConfigRetriever;
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
		
		
		
		addConfig(mav);
		
		//Debugging
/*		Iterator<Map.Entry<String, Object>> iter = mav.getModelMap().entrySet().iterator();
          while (iter.hasNext()){
			Map.Entry<String, Object> stuff = iter.next();
			logger.info(stuff.getKey());
			  if (stuff.getValue() instanceof String) {
				  logger.info((String) stuff.getValue());
			  }
			  if (stuff.getValue() instanceof Boolean) {
				  logger.info(Boolean.toString((Boolean) stuff.getValue()));
			  }

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

        String extraJs = conf.getJsLocalized();
        if (extraJs.length() > 0) {
            mav.addObject("hasExtraJs", true);
            mav.addObject("extraJs", extraJs);
        } else {
            mav.addObject("hasExtraJs", false);
        }
        //<script type="text/javascript" src="resources/javascript/dataTables.scroller.min.js"></script>
        //<link rel="stylesheet" href="resources/css/google.css" type="text/css" />
        String extraCss = conf.getCssLocalized();
        if (extraJs.length() > 0) {
            mav.addObject("hasExtraCss", true);
            mav.addObject("extraCss", extraCss);
        } else {
            mav.addObject("hasExtraCss", false);
        }


		mav.addObject("searchUrl", conf.getSearchUrl().toString());
		mav.addObject("analyticsId", conf.getAnalyticsId());
		
		mav.addObject("loginRepository", conf.getLoginConfig().getRepositoryId());
		mav.addObject("loginType", conf.getLoginConfig().getType());
		mav.addObject("loginUrl", conf.getLoginConfig().getUrl());
		mav.addObject("secureDomain", conf.getLoginConfig().getSecureDomain());
		
	}


}
