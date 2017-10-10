package org.opengeoportal.utilities;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;


@JsonIgnoreProperties(ignoreUnknown=true)
public class LinkShortenRequestGoogle {
	/*
	 * Example request to Google Link Shortener API	
	 * {
 	 *	"kind": "urlshortener#url",
 	 *	"id": "http://goo.gl/fbsS",
 	 *	"longUrl": "http://www.google.com/"
	 *	}
	 */	
	LinkShortenRequestGoogle (String longUrl){
		this.setLongUrl(longUrl);
	}
	
	@JsonProperty
	private String longUrl;   

	   public void setLongUrl (String longUrl){
	       this.longUrl = longUrl;
	   }
	   public String getLongUrl (){
	       return this.longUrl;
	   }

}
