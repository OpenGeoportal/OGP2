package org.opengeoportal.config;

import java.io.IOException;
import java.io.InputStream;
import java.util.Properties;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.io.Resource;

public class PropertiesFile {
	Properties properties;
	private final Resource resource;//	<beans:property name="resource" value="WEB-INF/repositories.properties"/> ogp.properties
	protected final Logger logger = LoggerFactory.getLogger(this.getClass());

	public PropertiesFile(Resource resource) {
		this.resource = resource;
	}

	public void refreshProperties() throws IOException {
		readProperties();
	}
	
	private void readProperties() throws IOException{
		try (InputStream is = resource.getInputStream()){
			properties = new Properties();
			properties.load(is);
		}
	}
	
	public String getProperty(String propertyName) throws IOException{
		if (properties == null){
			readProperties();
		}
		return properties.getProperty(propertyName);
	}
	 
	public Properties getProperties() throws IOException {
		if (properties == null){
			readProperties();
		}
		return properties;
	}
	
	public String[] getPropertyArray(String propertyName) throws IOException {
		return this.getProperty(propertyName).split(",");
	}

	public String getProperty(String propertyKey, String defaultValue) {
		return properties.getProperty(propertyKey, defaultValue);
	}
}
