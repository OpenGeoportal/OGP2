package org.opengeoportal.download.config;

import java.io.File;
import java.io.IOException;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.io.Resource;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

/**
 * an abstract class for reading a JSON config file
 * @author chris
 *
 */
public abstract class ConfigRetriever {
	public JsonNode configContents = null;
	Resource resource;
	protected final Logger logger = LoggerFactory.getLogger(this.getClass());
	
	public void setResource(Resource resource){
		this.resource = resource;
	}
	
	/**
	 * reads the JSON file into a string
	 * @return a string containing the JSON config object
	 * @throws java.io.IOException
	 */
	public File loadConfigFile() throws java.io.IOException {
		File configFile = resource.getFile();
		return configFile;
	}
	
	/**
	 * parses the JSON string into a Jackson JsonNode, stores it in the property configContents
	 * @throws IOException
	 */
	public void readConfigFile() throws IOException{
		if (configContents == null){
			ObjectMapper mapper = new ObjectMapper();
			JsonNode rootNode = mapper.readValue(this.loadConfigFile(), JsonNode.class);			
			JsonNode jsonResponse = rootNode.path("config");
			this.configContents = jsonResponse;
		}
	}

}
