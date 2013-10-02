package org.OpenGeoportal.Download.Controllers;

import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

import org.OpenGeoportal.Download.DownloadHandler;
import org.OpenGeoportal.Security.OgpUserContext;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.context.request.RequestContextHolder;

@Controller
@RequestMapping("/requestDownload")
public class DownloadRequestController {
	final Logger logger = LoggerFactory.getLogger(this.getClass());
	@Autowired
	private DownloadHandler downloadHandler;
	@Autowired
	private OgpUserContext ogpUserContext;
	
	@RequestMapping(method=RequestMethod.POST, produces="application/json")
	public @ResponseBody Map<String,String> processDownload(@RequestParam("layers[]") String[] layers, @RequestParam("email") String email, 
			@RequestParam("bbox") String bbox) throws Exception {
		 /**
		 * This servlet should receive a POST request with an object containing 
		 * all the info needed for each layer to be downloaded.  The servlet calls a class 
		 * that handles all of the download logic.  Additionally, it checks the session
		 * variable "username" to see if the user has authenticated.  A boolean is passed
		 * to the download code.  If one has been provided, an email address is passed to the 
		 * download code to accomodate systems that email a link to the user for their layers
		 *
		 * @author Chris Barnett
		 */
		logger.debug(layers[0]);
		  //do data validation here
		String[] arrBbox = bbox.split(",");
		Map<String,String> layerMap = new HashMap<String,String>();
		for (int i = 0; i < layers.length; i++){
			String[] layerInfo = layers[i].split("=");
			layerMap.put(layerInfo[0], layerInfo[1]);
		}
		Boolean authenticated = false;
		if (ogpUserContext.isAuthenticatedLocally()){
			authenticated = true;
		}
		String sessionId = RequestContextHolder.currentRequestAttributes().getSessionId();
		UUID requestId = downloadHandler.requestLayers(sessionId, layerMap, arrBbox, email, authenticated);
		Map<String,String> map = new HashMap<String,String>();
		map.put("requestId", requestId.toString());
		return map;
	}
}
