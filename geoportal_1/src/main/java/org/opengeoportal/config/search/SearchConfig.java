package org.opengeoportal.config.search;

import java.net.URL;
import java.util.List;

public class SearchConfig {
/*
 * 
 * # comma separated list of repository ids (see repositories.properties)
# that will appear in the repositories drop down 
# and will be queried by solr 
ogp.repositories=tufts,harvard,berkeley,mit,massgis
ogp.repositories.defaultSelected=tufts,harvard,berkeley,mit,massgis

solr.url.internal=http://localhost:8080/solr
# the url given to the web browser so that it can query solr directly
# if .internal is blank the external value will be used internally as well
# By default, this value will point to the Tufts production solr instance
solr.url.external=http://geodata.tufts.edu/solr
 * 
 * 
 */
	URL searchUrl;
	URL internalSearchUrl;
	List<SearchRepository> searchRepositories;

	public URL getSearchUrl() {
		return searchUrl;
	}

	public void setSearchUrl(URL searchUrl) {
		this.searchUrl = searchUrl;
	}

	public URL getInternalSearchUrl() {
		return internalSearchUrl;
	}

	public void setInternalSearchUrl(URL internalSearchUrl) {
		this.internalSearchUrl = internalSearchUrl;
	}

	public List<SearchRepository> getSearchRepositories() {
		return searchRepositories;
	}

	public void setSearchRepositories(List<SearchRepository> searchRepositories) {
		this.searchRepositories = searchRepositories;
	}

}
