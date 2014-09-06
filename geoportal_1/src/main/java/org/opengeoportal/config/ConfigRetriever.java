package org.opengeoportal.config;

import java.io.IOException;
import java.util.List;

import org.apache.commons.configuration.ConfigurationException;


public interface ConfigRetriever {

	List<?> getConfig() throws IOException;

	void reload() throws ConfigurationException;

	void load() throws IOException;

}
