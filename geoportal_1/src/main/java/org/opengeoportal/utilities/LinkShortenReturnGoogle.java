package org.opengeoportal.utilities;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

/**
 * A java object to parse and contain the response from a call to the Google Link Shortening API
 * 
 * @author cbarne02
 *
 */
@JsonIgnoreProperties(ignoreUnknown=true)
public class LinkShortenReturnGoogle {
	/*
	 * Example return from Google API:
	 * {
	 *		"kind": "urlshortener#url",
	 *		"id": "http://goo.gl/fbsS",
	 *		"longUrl": "http://www.google.com/"
	 *	}
	 */	

	@JsonProperty
	private String kind;
	@JsonProperty
	private String id;
	@JsonProperty
	private String longUrl;   

	public void setKind (String kind){
		this.kind = kind;
	}
	public String getKind(){
		return this.kind;
	}
	public void setId (String id){
		this.id = id;
	}
	public String getId (){
		return this.id;
	}
	public void setLongUrl (String longUrl){
		this.longUrl = longUrl;
	}
	public String getLongUrl (){
		return this.longUrl;
	}

}
