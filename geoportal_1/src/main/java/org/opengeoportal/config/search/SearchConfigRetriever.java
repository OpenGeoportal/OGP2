package org.opengeoportal.config.search;

import java.net.URL;
import java.util.List;

public interface SearchConfigRetriever {

	SearchConfig load() throws Exception;
	List<SearchRepository> getSearchRepositories();
	URL getSearchUrl();
	URL getInternalSearchUrl();
	SearchConfig getConfig();
}
