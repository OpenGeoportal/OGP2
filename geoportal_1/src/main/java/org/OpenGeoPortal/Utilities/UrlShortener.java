package org.OpenGeoPortal.Utilities;

/**
 * Interface for retrieving shortened Urls
 * 
 * @author cbarne02
 */
public interface UrlShortener {
	 public String retrieveShortLink(String longUrl) throws Exception;
}
