package org.opengeoportal.config.repositories;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.Properties;

import org.opengeoportal.config.PropertiesFile;
import org.opengeoportal.config.search.SearchConfigRetriever;
import org.opengeoportal.config.search.SearchRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;

public class RepositoryConfigRetrieverFromProperties implements RepositoryConfigRetriever {
	public final String SHORT_NAME_KEY = "shortName";
	public final String FULL_NAME_KEY = "fullName";
	public final String ICON_CLASS_KEY = "sourceIconClass";

	@Autowired
	SearchConfigRetriever searchConfigRetriever;
	
	List<RepositoryConfig> repositoryConfig;
	
	PropertiesFile propertiesFile;
	
	protected final Logger logger = LoggerFactory.getLogger(this.getClass());
	
	public PropertiesFile getPropertiesFile() {
		return propertiesFile;
	}

	public void setPropertiesFile(PropertiesFile propertiesFile) {
		this.propertiesFile = propertiesFile;
	}
	
	@Override
	public List<RepositoryConfig> getConfig(){
		return repositoryConfig;
	}
	
	@Override
	public List<RepositoryConfig> load() throws IOException {
		Properties props = propertiesFile.getProperties();
		
		//we have a list of repositories to display/search from ogp.config
		//and a list of which should be selected by default
		
		List<SearchRepository> repositories = searchConfigRetriever.getSearchRepositories();
		
		List<String> configElements = new ArrayList<String>();
		configElements.add(SHORT_NAME_KEY);
		configElements.add(FULL_NAME_KEY);
		configElements.add(ICON_CLASS_KEY);
		
		repositoryConfig = new ArrayList<RepositoryConfig>();
		
		for (SearchRepository rep: repositories){
			
			RepositoryConfig repConf = new RepositoryConfig();
			repConf.setId(rep.getId());
			repConf.setSelected(rep.getSelected());

			for (String elem: configElements){
				String key = rep.getId() + "." + elem;
				if (props.containsKey(key)){
					String val = props.getProperty(key);
					//add val to RepositoryConfig object
					setValue(repConf, key, val);
				}
				//else ignore the key
			}
			
			repositoryConfig.add(repConf);
		}
		/*
		 * tufts.shortName=Tufts
		 * tufts.fullName="Tufts University"
		 * tufts.sourceIconClass=tuftsIcon
		 * 
		 */
		return repositoryConfig;
	}

	void setValue(RepositoryConfig repConf, String key, String value){
		if (key.contains(SHORT_NAME_KEY)){
			repConf.setShortName(value);
		} else if (key.contains(FULL_NAME_KEY)){
			repConf.setFullName(value);
		} else if (key.contains(ICON_CLASS_KEY)){
			repConf.setIconClass(value);
		} else {
			logger.warn("Key ['" + key + "'] is unknown.");
		}
	}

}
