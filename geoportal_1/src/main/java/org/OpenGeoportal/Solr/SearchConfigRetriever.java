package org.OpenGeoportal.Solr;

import java.io.IOException;

public interface SearchConfigRetriever {

	String getSearchUrl() throws Exception;

	String getSearchPort() throws Exception;
	
	String getHome() throws Exception;
	
	String getArbitrary(String configKey) throws Exception;

	String getWmsProxy(String institution, String accessLevel) throws Exception;

	String getWfsProxy(String institution, String accessLevel) throws IOException;
	
	String getWcsProxy(String institution, String accessLevel) throws IOException;

	String getWmsProxyInternal(String institution, String accessLevel) throws Exception;

	String getWfsProxyInternal(String institution, String accessLevel) throws IOException;

	String getWcsProxyInternal(String institution, String accessLevel) throws IOException;

	boolean hasWmsProxy(String institution, String access);
	
	boolean hasWfsProxy(String institution, String access);

	boolean hasWcsProxy(String institution, String access);

	String getWfsUrl(SolrRecord solrRecord) throws IOException;

	String getWmsUrl(SolrRecord solrRecord) throws IOException;

	String getWcsUrl(SolrRecord solrRecord) throws IOException;

	void setSearchUrl(String url);
}
