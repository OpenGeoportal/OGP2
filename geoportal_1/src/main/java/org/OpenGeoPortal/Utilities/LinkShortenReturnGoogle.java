package org.OpenGeoPortal.Utilities;

import org.codehaus.jackson.annotate.JsonIgnoreProperties;
import org.codehaus.jackson.annotate.JsonProperty;

@JsonIgnoreProperties(ignoreUnknown=true)
public class LinkShortenReturnGoogle {
	/*{
 "kind": "urlshortener#url",
 "id": "http://goo.gl/fbsS",
 "longUrl": "http://www.google.com/"
}
*/	@JsonProperty
	private String kind;
	@JsonProperty
	private String id;
	@JsonProperty
	private String longUrl;   
	   /*
	    * 
	    * {
 			"error": {
  				"errors": [
   						{
    					"domain": "global",
    					"reason": "required",
    					"message": "Required",
    					"locationType": "parameter",
    					"location": "resource.longUrl"
   						}
  				],
  			"code": 400,
  			"message": "Required"
 			}
		}
	    * 
	    * 
	    * 
	    */
	  /* public static class Error {
	       private String code;
	       private String message;

	       public void setCode(String code){
	           this.code = code;
	       }
	       public String getCode(){
	           return this.code;
	       }
	       
	       public void setMessage(String message){
	           this.message = message;
	       }
	       public String getMessage() {
	           return this.message;
	       }
	   }*/
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
