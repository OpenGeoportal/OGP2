package org.opengeoportal.config.proxy;

import java.io.IOException;
import java.util.List;

public interface ProxyConfigRetriever {
	
	String getExternalProxyUrl(String type, String repository, String accessLevel) throws Exception;

	String getInternalProxyUrl(String type, String repository, String accessLevel) throws Exception;

	boolean hasProxy(String type, String repository, String accessLevel);
	
	boolean hasCredentials(String type, String repository, String accessLevel);

	List<ProxyConfig> load() throws IOException;

	List<ProxyConfig> getConfig();

	List<ProxyConfig> getPublicConfig();

	String getInternalUrl(String type, String repository, String accessLevel,
			String locationField) throws Exception;

	String getExternalUrl(String type, String repository, String accessLevel,
			String locationField) throws Exception;

}
