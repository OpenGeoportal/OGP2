package org.opengeoportal.config.download;

import java.io.File;
import java.io.IOException;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Component;

import javax.annotation.PostConstruct;

@Component
public class OgpDownloadConfigRetriever implements DownloadConfigRetriever {
	JsonNode configContents = null;

	private final Resource resource;

	public OgpDownloadConfigRetriever(@Value("/WEB-INF/ogpDownloadConfig.json") Resource resource) {
		this.resource = resource;
	}

	@Override
	public synchronized JsonNode getDownloadConfig() throws IOException {

		readConfigFile();

		return this.configContents;
	}

	/**
	 * reads the JSON file into a string
	 * @return a string containing the JSON config object
	 * @throws java.io.IOException
	 */
	public File loadConfigFile() throws java.io.IOException {
		return resource.getFile();
	}

	/**
	 * parses the JSON string into a Jackson JsonNode, stores it in the property configContents
	 * @throws IOException
	 */
	@PostConstruct
	public void readConfigFile() throws IOException{
		if (configContents == null){
			ObjectMapper mapper = new ObjectMapper();
			JsonNode rootNode = mapper.readValue(this.loadConfigFile(), JsonNode.class);
			this.configContents = rootNode.path("config");
		}
	}

}