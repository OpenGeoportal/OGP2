package org.OpenGeoPortal.Utilities;

import org.codehaus.jackson.annotate.JsonIgnoreProperties;
import org.codehaus.jackson.annotate.JsonProperty;

@JsonIgnoreProperties(ignoreUnknown=true)
public class LinkShortenRequestGoogle {
	/*{
 "kind": "urlshortener#url",
 "id": "http://goo.gl/fbsS",
 "longUrl": "http://www.google.com/"
}
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
