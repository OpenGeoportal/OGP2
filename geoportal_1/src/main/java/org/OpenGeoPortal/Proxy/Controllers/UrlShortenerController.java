package org.OpenGeoPortal.Proxy.Controllers;

import org.OpenGeoPortal.Utilities.UrlShortener;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;

@Controller
@RequestMapping("/shortenLink")
public class UrlShortenerController {
	private UrlShortener urlShortener;

	public void setUrlShortener(UrlShortener urlShortener) {
		this.urlShortener = urlShortener;
	}

	public UrlShortener getUrlShortener() {
		return this.urlShortener;
	}

	@RequestMapping(method=RequestMethod.GET, produces="application/json")
	public @ResponseBody MultiValueMap<String,String> shortenLink(@RequestParam("link") String link, Model model) throws Exception {
		// return the shortened link, or the original if there was an error
		String shortLink;
		try {
			shortLink = urlShortener.retrieveShortLink(link);
		} catch (Exception e) {
			shortLink = link;
		}
		MultiValueMap<String, String> map = new LinkedMultiValueMap<String, String>();
		map.add("shortLink", shortLink);
		return map;
	}
}
