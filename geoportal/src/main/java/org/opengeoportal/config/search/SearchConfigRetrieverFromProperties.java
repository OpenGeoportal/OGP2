package org.opengeoportal.config.search;

import java.net.MalformedURLException;
import java.net.URL;
import java.util.ArrayList;
import java.util.List;
import java.util.Properties;

import org.apache.commons.lang3.StringUtils;
import org.opengeoportal.config.PropertiesFile;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class SearchConfigRetrieverFromProperties implements SearchConfigRetriever {
	private static final String INTERNAL_SEARCH_URL = "solr.url.internal";
	private static final String EXTERNAL_SEARCH_URL = "solr.url.external";
	private static final String SEARCH_REPOSITORIES = "ogp.repositories";
	private static final String DEFAULT_REPOSITORIES = "ogp.repositories.defaultSelected";
	PropertiesFile propertiesFile;
	SearchConfig searchConfig;
	
	protected final Logger logger = LoggerFactory.getLogger(this.getClass());
	
	public PropertiesFile getPropertiesFile() {
		return propertiesFile;
	}

	public void setPropertiesFile(PropertiesFile propertiesFile) {
		this.propertiesFile = propertiesFile;
	}
	
	@Override
	public SearchConfig getConfig() {
		return searchConfig;
	} 

	public void setSearchConfig(SearchConfig searchConfig) {
		this.searchConfig = searchConfig;
	}
 
	@Override
	public SearchConfig load() throws Exception {
		Properties props = propertiesFile.getProperties();
		/*URL searchUrl;
		URL internalSearchUrl;
		List<SearchRepository> searchRepositories;*/
		
		searchConfig = new SearchConfig();


		URL intUrl = null;
		if (props.containsKey(INTERNAL_SEARCH_URL) && StringUtils.isNotEmpty(props.getProperty(INTERNAL_SEARCH_URL))){
			String intSearch = props.getProperty(INTERNAL_SEARCH_URL);
			try{
				intUrl = new URL(intSearch);
			} catch (MalformedURLException e){
				throw new Exception("Internal Search URL ['property " + INTERNAL_SEARCH_URL + "'] is malformed!");
			}
		} else {
			//use the external facing solr url internally if no internal url is set 
			if (props.containsKey(EXTERNAL_SEARCH_URL)){
				String extSearch = props.getProperty(EXTERNAL_SEARCH_URL);
				try{
					intUrl = new URL(extSearch);
					logger.info("{0} is missing or invalid. Using {1} for internal queries".format(INTERNAL_SEARCH_URL, intUrl.toString()));
				} catch (MalformedURLException e){
					throw new Exception("External Search URL ['property " + EXTERNAL_SEARCH_URL + "'] is malformed!");
				}


			} else {
				throw new Exception("Must set a search URL!");
			}
			logger.debug("the internal url is set to the same value as the external url");
		}
		
		searchConfig.setInternalSearchUrl(intUrl);

		
		List<SearchRepository> searchRep = new ArrayList<SearchRepository>();
		searchConfig.setSearchRepositories(searchRep);
		
		if (props.containsKey(SEARCH_REPOSITORIES)){
			String reps = props.getProperty(SEARCH_REPOSITORIES);
			logger.info("Search Repositories added: ");
			for (String rep: StringUtils.split(reps, ",")){
				SearchRepository sr = new SearchRepository();
				logger.info("- " + rep);
				sr.setId(rep);
				sr.setSelected(isSelectedByDefault(props, rep));
				searchRep.add(sr);
			}
		}
		
		
		return searchConfig;
	}
	
	Boolean isSelectedByDefault(Properties props, String repositoryId){
		if (props.containsKey(DEFAULT_REPOSITORIES)){
			String reps = props.getProperty(DEFAULT_REPOSITORIES);
			for (String rep: StringUtils.split(reps, ",")){
				if (rep.equalsIgnoreCase("all") || rep.equalsIgnoreCase(repositoryId)){
					return true;
				}
			}
		}
		
		return false;
	}

	@Override
	public List<SearchRepository> getSearchRepositories() {
		return getConfig().getSearchRepositories();
	}

	@Override
	public URL getInternalSearchUrl() {
		return getConfig().getInternalSearchUrl();
	}

}
