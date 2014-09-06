package org.opengeoportal.config.search;

import java.net.URL;
import java.util.List;

/**
 * interface for retrieving search config info from the properties file
 * 
 * @author cbarne02
 *
 */
public interface SearchConfigRetriever {

	/**
	 * Loads the config info from the properties file. Gets called by Spring as an init-method
	 * @return {SearchConfig}
	 * @throws Exception
	 */
	SearchConfig load() throws Exception;
	
	/**
	 * Returns a list of repositories included in the search
	 * 
	 * @return {List<SearchRepository>}
	 */
	List<SearchRepository> getSearchRepositories();
	
	/**
	 * @return {URL} the url of the solr instance used
	 */
	URL getSearchUrl();
	
	/**
	 * The Internal search url is used if solr is proxied (e.g. could be "http://localhost/solr") and
	 * the external facing value is either unavailable to the server or is problematic (through load balancers or
	 * filters)
	 * 
	 * @return
	 */
	URL getInternalSearchUrl();
	
	SearchConfig getConfig();
}
