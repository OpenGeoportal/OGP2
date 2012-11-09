package org.OpenGeoPortal.Solr;

import java.io.IOException;

public interface SearchConfigRetriever {

	String getSearchUrl() throws Exception;

	String getSearchPort() throws Exception;
	
	String getHome() throws Exception;
	
	String getArbitrary(String configKey) throws Exception;

	String getWmsProxy(String institution, String accessLevel) throws Exception;

	String getWfsProxy(String institution, String accessLevel) throws IOException;
}
