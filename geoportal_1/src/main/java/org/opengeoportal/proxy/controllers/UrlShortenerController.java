package org.opengeoportal.proxy.controllers;

import java.util.HashMap;
import java.util.Map;

import org.opengeoportal.utilities.UrlShortener;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;

@Controller
@RequestMapping("/shortenLink")
public class UrlShortenerController {
	final Logger logger = LoggerFactory.getLogger(this.getClass());
	@Autowired
	private UrlShortener urlShortener;

	@RequestMapping(method=RequestMethod.GET, produces="application/json")
	public @ResponseBody Map<String,String> shortenLink(@RequestParam("link") String link) throws Exception {
		// return the shortened link, or the original if there was an error
		String shortLink;
		try {
			shortLink = urlShortener.retrieveShortLink(link);
		} catch (Exception e) {
			logger.error("Unable to retrieve shortened Link.");
			shortLink = link;
		}
		Map<String, String> map = new HashMap<String, String>();
		map.put("shortLink", shortLink);
		return map;
	}
}
