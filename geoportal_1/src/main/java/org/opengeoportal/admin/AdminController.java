package org.opengeoportal.admin;

import java.net.URL;
import java.util.LinkedHashMap;
import java.util.Map;


import org.opengeoportal.config.search.SearchConfigRetriever;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;

/**
 * Not currently used.  Could be developed into a more user friendly interface for setting config.
 * 
 * @author cbarne02
 *
 */
@Controller
@RequestMapping("/admin")
public class AdminController {

	final Logger logger = LoggerFactory.getLogger(this.getClass());

	@Autowired
	SearchConfigRetriever searchConfigRetriever;
	
	@RequestMapping(value="setSearch", method=RequestMethod.GET, produces="application/json")
	public @ResponseBody Map<String,Object> setSearchUrl(@RequestParam("url") String url) throws Exception {
		Boolean success = false;
		try {
			searchConfigRetriever.setSearchUrl(new URL(url));
			success = true;
		} catch (Exception e){
			logger.error("Problem setting solr url: " + url);
		}
		Map<String,Object> responseMap = new LinkedHashMap<String,Object>();
		responseMap.put("success", success);
		return responseMap;
	}

}
