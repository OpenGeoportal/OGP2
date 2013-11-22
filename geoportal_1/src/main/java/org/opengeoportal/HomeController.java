package org.opengeoportal;

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

	@RequestMapping(value="/index", method=RequestMethod.GET)
	public ModelAndView getHomePage() throws Exception {
		//@RequestParam("ogpids") Set<String> layerIds, ..should be optional.  also a param to set dev vs. prod
		//create the model to return
		ModelAndView mav = new ModelAndView("ogp_home"); 
		//if ogpids exists, add them to the Model
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
	
	private void addConfig(ModelAndView mav){
		OgpConfig conf = ogpConfigRetriever.getConfig();
		
		mav.addObject("pageTitle", conf.getPageTitle());
		
		mav.addObject("extraJs", conf.getJsLocalized());	//<script type="text/javascript" src="resources/javascript/dataTables.scroller.min.js"></script>
		mav.addObject("extraCss", conf.getCssLocalized());  //<link rel="stylesheet" href="resources/css/google.css" type="text/css" />
		
		mav.addObject("searchUrl", conf.getSearchUrl().toString());
		mav.addObject("analyticsId", conf.getAnalyticsId());
		
		mav.addObject("loginRepository", conf.getLoginConfig().getRepositoryId());
		mav.addObject("loginType", conf.getLoginConfig().getType());
		mav.addObject("loginUrl", conf.getLoginConfig().getUrl());
		mav.addObject("secureDomain", conf.getLoginConfig().getSecureDomain());
		
	}
}
