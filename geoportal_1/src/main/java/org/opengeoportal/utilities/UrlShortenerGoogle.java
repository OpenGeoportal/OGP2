package org.opengeoportal.utilities;

import java.util.ArrayList;
import java.util.List;

import org.opengeoportal.solr.SearchConfigRetriever;
import org.springframework.http.converter.HttpMessageConverter;
import org.springframework.http.converter.json.MappingJackson2HttpMessageConverter;
import org.springframework.web.client.RestTemplate;

/**
 * A class that uses the Google Url Shortener API to get shortened links.
 
 * Implements the interface UrlShortener
 * 
 * @author cbarne02
 *
 */

public class UrlShortenerGoogle implements UrlShortener {
	private String url = "https://www.googleapis.com/urlshortener/v1/url?key=";
	private SearchConfigRetriever searchConfigRetriever;
    
	public void setSearchConfigRetriever(SearchConfigRetriever searchConfigRetriever){
		this.searchConfigRetriever = searchConfigRetriever;
	}
	
	public SearchConfigRetriever getSearchConfigRetriever(){
		return this.searchConfigRetriever;
	}
	

    /** 
     * Takes a url and returns a shortened version from the Google Url Shortener service
     * 
     * @param longUrl	a String containing the url to be shortened
     * @return a String containing the shortened Url, if the call to Google was successful.  
     * @throws Exception	
     * @see org.OpenGeoPortal.Utilities.UrlShortener#retrieveShortLink(java.lang.String)
     */
    public String retrieveShortLink(String longUrl) throws Exception{
    	/*
    	 * 	/*POST https://www.googleapis.com/urlshortener/v1/url
		Content-Type: application/json

		{"longUrl": "http://www.google.com/"}
    	 */
 	   RestTemplate template = new RestTemplate();
 	   List<HttpMessageConverter<?>> messageConverters = new ArrayList<HttpMessageConverter<?>>();
	   messageConverters.add(new MappingJackson2HttpMessageConverter());
 	   template.setMessageConverters(messageConverters);
 	   //retrieve the google api key from a config file
 	   String apiKey = this.searchConfigRetriever.getArbitrary("googleAPIKey");
         //now we need to add the parameters
       LinkShortenRequestGoogle postObject = new LinkShortenRequestGoogle(longUrl);
       LinkShortenReturnGoogle result = template.postForObject(url + apiKey, postObject, LinkShortenReturnGoogle.class);

       return result.getId();
    }
}
