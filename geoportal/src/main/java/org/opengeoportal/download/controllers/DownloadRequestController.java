package org.opengeoportal.download.controllers;

import java.net.URLDecoder;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

import org.opengeoportal.download.DownloadHandler;
import org.opengeoportal.download.DownloadHandlerFactory;
import org.opengeoportal.download.DownloadRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.context.request.RequestContextHolder;

import com.fasterxml.jackson.databind.ObjectMapper;

@Controller
@RequestMapping("/requestDownload")
public class DownloadRequestController {
	final Logger logger = LoggerFactory.getLogger(this.getClass());
	@Autowired
	private DownloadHandlerFactory downloadHandlerFactory;

	
	@RequestMapping(method=RequestMethod.POST, headers = "content-type=application/x-www-form-urlencoded", produces="application/json")
	public @ResponseBody Map<String,String> processDownload(@RequestBody String downloadRequest) throws Exception {

		/**
		 * This servlet should receive a POST request with an object containing 
		 * all the info needed for each layer to be downloaded.  The servlet calls a class 
		 * that handles all of the download logic. If one has been provided, an email address is passed to the 
		 * download code to accomodate systems that email a link to the user for their layers
		 *
		 * @author Chris Barnett
		 */

		ObjectMapper mapper = new ObjectMapper();

		DownloadRequest	submittedRequest = mapper.readValue(URLDecoder.decode(downloadRequest, "UTF-8"), DownloadRequest.class);
		
		String sessionId = RequestContextHolder.currentRequestAttributes().getSessionId();
		submittedRequest.setSessionId(sessionId);
		
		DownloadHandler downloadHandler = downloadHandlerFactory.getObject();
		UUID requestId = downloadHandler.requestLayers(submittedRequest);
		
		Map<String,String> map = new HashMap<String,String>();
		map.put("requestId", requestId.toString());
		return map;
	}
}
