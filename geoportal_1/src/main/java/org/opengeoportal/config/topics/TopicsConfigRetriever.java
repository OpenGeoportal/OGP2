package org.opengeoportal.config.topics;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;

import org.apache.commons.configuration.ConfigurationException;
import org.apache.commons.configuration.HierarchicalConfiguration;
import org.opengeoportal.config.ConfigRetriever;
import org.opengeoportal.config.XmlProperties;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;

/**
 * Retrieves ISO topic info from an xml file and marshalls into a List of POJOs
 * 
 * @author cbarne02
 *
 */
public class TopicsConfigRetriever implements ConfigRetriever {

	@Autowired
	@Qualifier("properties.ogp")
	XmlProperties xmlProperties;
	
	List<TopicsConfig> config = new ArrayList<TopicsConfig>();
	
	private final String TOPICS_PATH = "topics/node()";

	protected final Logger logger = LoggerFactory.getLogger(this.getClass());

	@Override
	public List<TopicsConfig> getConfig() throws IOException{
		if (config.isEmpty()){
			load();
		}
		return config;
	}
	
	@Override
	public void reload() throws ConfigurationException{
		xmlProperties.reload();
		config = null;
	}
	
	@Override
	public void load() throws IOException {
		//we have a list of topics to display/search from ogp_config.xml

		List<HierarchicalConfiguration> dtypes = xmlProperties.getConfig().configurationsAt(TOPICS_PATH);


		for (HierarchicalConfiguration dt: dtypes){

			TopicsConfig dtConfig = new TopicsConfig();
			dtConfig.setDisplayName(dt.getString("displayName"));
			dtConfig.setValue(dt.getString("value"));
			config.add(dtConfig);
		}

				
	}

}
