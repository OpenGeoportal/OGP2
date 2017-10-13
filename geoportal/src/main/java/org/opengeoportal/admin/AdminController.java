package org.opengeoportal.admin;

import java.io.IOException;
import java.util.LinkedHashMap;
import java.util.Map;


import org.opengeoportal.config.clientoptions.OgpClientConfigRetriever;
import org.opengeoportal.config.search.SearchConfigRetriever;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;

@Controller
@RequestMapping("/admin")
public class AdminController {

	final Logger logger = LoggerFactory.getLogger(this.getClass());

	@Autowired
	OgpClientConfigRetriever ogpClientConfigRetriever;

/*	@Autowired
	SearchConfigRetriever searchConfigRetriever;
	
	@RequestMapping(value="setSearch", method=RequestMethod.GET, produces="application/json")
	public @ResponseBody Map<String,Object> setSearchUrl(@RequestParam("url") String url) throws Exception {
		Boolean success = false;
		try {
			//searchConfigRetriever.setSearchUrl(url);
			success = true;
		} catch (Exception e){
			logger.error("Problem setting solr url: " + url);
		}
		Map<String,Object> responseMap = new LinkedHashMap<String,Object>();
		responseMap.put("success", success);
		return responseMap;
	}*/

	@RequestMapping(value="reloadClientConfig", method = RequestMethod.GET, produces = "application/json")
	public @ResponseBody Map<String, Object> reloadClientConfig() throws IOException {
		String message = "unknown reason";
		String status = "failed";
		Map<String,Object> responseMap = new LinkedHashMap<String,Object>();
		try {
			ogpClientConfigRetriever.reload();
			status = "succeeded";
			message = "Client Config reloaded.";
		} catch (Exception e){
			logger.error("Problem reloading Client Config");
		}
		responseMap.put("status", status);
		responseMap.put("message", message);
		return responseMap;
	}
}
