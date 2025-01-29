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

search.url=http://localhost:8983/solr/ogp
# the url given to the web browser so that it can query solr directly
 * 
 * 
 */
	URL searchUrl;
	List<SearchRepository> searchRepositories;

	public URL getSearchUrl() {
		return searchUrl;
	}

	public void setSearchUrl(URL searchUrl) {
		this.searchUrl = searchUrl;
	}

	public List<SearchRepository> getSearchRepositories() {
		return searchRepositories;
	}

	public void setSearchRepositories(List<SearchRepository> searchRepositories) {
		this.searchRepositories = searchRepositories;
	}

}
