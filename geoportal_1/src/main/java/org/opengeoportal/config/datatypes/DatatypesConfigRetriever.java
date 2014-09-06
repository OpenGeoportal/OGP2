package org.opengeoportal.config.datatypes;

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
 
/**
 * Retrieves Datatype info from an xml file and marshalls into a List of POJOs
 * 
 * @author cbarne02
 *
 */
public class DatatypesConfigRetriever implements ConfigRetriever {

	@Autowired
	XmlProperties xmlProperties;
	
	List<DatatypeConfig> config = new ArrayList<DatatypeConfig>();
	
	private final String DATATYPE_PATH = "datatypes/node()";
	
	protected final Logger logger = LoggerFactory.getLogger(this.getClass());

	@Override
	public List<DatatypeConfig> getConfig() throws IOException{
		if (config.isEmpty()){
			load();
		}
		return config;
	}
	
	@Override
	public void reload() throws ConfigurationException{
		xmlProperties.reload();
		config.clear();
	}
	
	@Override
	public void load() throws IOException {
		
		//we have a list of datatypes to display/search from ogp_config.xml
		List<HierarchicalConfiguration> dtypes = xmlProperties.getConfig().configurationsAt(DATATYPE_PATH);
		
		for (HierarchicalConfiguration dt: dtypes){
			DatatypeConfig dtConfig = new DatatypeConfig();
			
			dtConfig.setSelected(dt.getBoolean("@selected"));
			dtConfig.setDisplayName(dt.getString("displayName"));
			dtConfig.setIconClass(dt.getString("iconClass"));
			dtConfig.setValue(dt.getString("value"));
			config.add(dtConfig);
		}
		

	}

}
