package org.opengeoportal.proxy.controllers;

import java.net.URLDecoder;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

import org.opengeoportal.proxy.ImageHandler;
import org.opengeoportal.proxy.ImageHandlerFactory;

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

/**
* This controller given the above parameters + z order, grabs images
* from various servers and composites them.  Is passed a custom json object to maintain structure.
* 
* We should offer formats available via geoserver.
* 
* determine if a layer is within the provided bounds and exclude it if not
* 
* @author Chris Barnett
*/

@Controller
@RequestMapping("/requestImage")
public class ImageController {
	final Logger logger = LoggerFactory.getLogger(this.getClass());

	@Autowired
	private ImageHandlerFactory imageHandlerFactory;

	@RequestMapping(method=RequestMethod.POST, headers = "content-type=application/x-www-form-urlencoded", produces="application/json")
	public @ResponseBody Map<String,String> processImageRequest(@RequestBody String imageRequest) throws Exception {


		ObjectMapper mapper = new ObjectMapper();
		ImageRequest imageRequestObj = mapper.readValue(URLDecoder.decode(imageRequest, "UTF-8"), ImageRequest.class);

		Map<String, String> map = new HashMap<String, String>();
		
		ImageHandler imageHandler = imageHandlerFactory.getObject();
		UUID requestId = imageHandler.requestImage(RequestContextHolder.currentRequestAttributes().getSessionId(), imageRequestObj);
		logger.debug("Image requested.");
		
		map.put("requestId", requestId.toString());
		return map;
	}


}
