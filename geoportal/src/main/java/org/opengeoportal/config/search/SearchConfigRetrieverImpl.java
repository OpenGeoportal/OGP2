package org.opengeoportal.config.search;

import java.net.MalformedURLException;
import java.net.URL;
import java.util.ArrayList;
import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.annotation.PostConstruct;

@Component
public class SearchConfigRetrieverImpl implements SearchConfigRetriever {

	@Value("${search.url}")
	private String searchUrl;

	@Value("${search.repositories}")
	private String[] searchRepositories;

	@Value("${search.repositoriesSelected}")
	private String[] repositoriesSelected;

	SearchConfig searchConfig;
	
	protected final Logger logger = LoggerFactory.getLogger(this.getClass());

	@Override
	public SearchConfig getConfig() {
		return searchConfig;
	} 

	@PostConstruct
	public SearchConfig load() throws Exception {

		searchConfig = new SearchConfig();
		
		URL extUrl = null;
		try{
			extUrl = new URL(searchUrl);
			searchConfig.setSearchUrl(extUrl);
		} catch (MalformedURLException e){
			throw new Exception("Search URL is malformed!");
		}
		
		List<SearchRepository> searchRep = new ArrayList<SearchRepository>();
		searchConfig.setSearchRepositories(searchRep);

		for (String rep: searchRepositories){
			SearchRepository sr = new SearchRepository();
			sr.id = rep;
			sr.selected = isSelectedByDefault(rep);
			searchRep.add(sr);
		}
		
		return searchConfig;
	}
	
	Boolean isSelectedByDefault(String repositoryId){
		for (String rep: repositoriesSelected) {
			if (rep.equalsIgnoreCase("all") || rep.equalsIgnoreCase(repositoryId)){
				return true;
			}
		}
		return false;
	}

	@Override
	public List<SearchRepository> getSearchRepositories() {
		return getConfig().getSearchRepositories();
	}

	@Override
	public URL getSearchUrl() {
		return getConfig().getSearchUrl();
	}

}
