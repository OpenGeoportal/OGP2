package org.OpenGeoPortal.Utilities;

import java.util.ArrayList;
import java.util.List;

import org.OpenGeoPortal.Solr.SearchConfigRetriever;
import org.springframework.http.converter.HttpMessageConverter;
import org.springframework.http.converter.json.MappingJacksonHttpMessageConverter;
import org.springframework.web.client.RestTemplate;

public class UrlShortenerGoogle implements UrlShortener {
	private String url = "https://www.googleapis.com/urlshortener/v1/url?key=";
	private SearchConfigRetriever searchConfigRetriever;
    
	public void setSearchConfigRetriever(SearchConfigRetriever searchConfigRetriever){
		this.searchConfigRetriever = searchConfigRetriever;
	}
	
	public SearchConfigRetriever getSearchConfigRetriever(){
		return this.searchConfigRetriever;
	}
	
    public String retrieveShortLink(String longUrl){
    	/*
    	 * 	/*POST https://www.googleapis.com/urlshortener/v1/url
		Content-Type: application/json

		{"longUrl": "http://www.google.com/"}
    	 */
 	   RestTemplate template = new RestTemplate();
 	   List<HttpMessageConverter<?>> messageConverters = new ArrayList<HttpMessageConverter<?>>();
	   messageConverters.add(new MappingJacksonHttpMessageConverter());
 	   template.setMessageConverters(messageConverters);
         //now we need to add the parameters
 	   String apiKey = null;
 	   try {
 		   apiKey = this.searchConfigRetriever.getArbitrary("googleAPIKey");
 	   } catch (Exception e1) {
 		   // TODO Auto-generated catch block
 		   e1.printStackTrace();
 		   //If there is an error simply return the original url
 		   return longUrl;
 	   }

       LinkShortenRequestGoogle postObject = new LinkShortenRequestGoogle(longUrl);
       LinkShortenReturnGoogle result = null;
       try {
    	   result = template.postForObject(url + apiKey, postObject, LinkShortenReturnGoogle.class);
       } catch (Exception e){
    	   e.getMessage();
 		   //If there is an error simply return the original url
    	   return longUrl;
       }
       return result.getId();
    }
}
