package org.opengeoportal.config.search;

import java.net.URL;
import java.util.List;

public interface SearchConfigRetriever {

	List<SearchRepository> getSearchRepositories();
	URL getSearchUrl();
	SearchConfig getConfig();
}
