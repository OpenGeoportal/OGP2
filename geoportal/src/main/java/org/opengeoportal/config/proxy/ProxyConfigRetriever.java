package org.opengeoportal.config.proxy;

import org.opengeoportal.config.exception.ConfigException;

import java.io.IOException;
import java.util.List;

public interface ProxyConfigRetriever {
	
	String getExternalProxyUrl(String type, String repository, String accessLevel) throws Exception, ConfigException;

	InternalServerMapping getInternalServerMapping(String type, String repository, String accessLevel) throws ConfigException;

	String getInternalProxyUrl(String type, String repository, String accessLevel) throws ConfigException;

	boolean hasProxy(String type, String repository, String accessLevel);

	List<ProxyConfig> load() throws IOException;

	List<ProxyConfig> getConfig();

	boolean hasCredentials(InternalServerMapping sm);

	List<ProxyConfig> getPublicConfig();

	String getInternalUrl(String type, String repository, String accessLevel,
			String locationField) throws Exception, ConfigException;

	String getExternalUrl(String type, String repository, String accessLevel,
			String locationField) throws Exception, ConfigException;

}
