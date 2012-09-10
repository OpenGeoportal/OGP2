
package org.OpenGeoPortal.Download.Config;

import java.io.File;
import java.io.IOException;

import org.codehaus.jackson.JsonNode;
import org.codehaus.jackson.map.ObjectMapper;



/**
 * an abstract class for reading a JSON config file
 * @author chris
 *
 */
public abstract class ConfigRetriever {
	public String configFilePath;
	public JsonNode configContents = null;
	
	public void setConfigFilePath(String configFilePath){
		this.configFilePath = configFilePath;
	}
	
	/**
	 * reads the JSON file into a string
	 * @return a string containing the JSON config object
	 * @throws java.io.IOException
	 */
	public File loadConfigFile() throws java.io.IOException {
		File configFile = new File(this.configFilePath);
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
