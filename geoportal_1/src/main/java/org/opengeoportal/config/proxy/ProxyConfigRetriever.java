package org.opengeoportal.config.proxy;

import java.io.IOException;
import java.util.List;

public interface ProxyConfigRetriever {
	
	String getExternalProxy(String type, String repository, String accessLevel) throws Exception;

	String getInternalProxy(String type, String repository, String accessLevel) throws Exception;

	boolean hasProxy(String type, String repository, String accessLevel);

	String getUrl(String type, String repository, String accessLevel, String locationField) throws Exception;
	
	boolean hasCredentials(String type, String repository, String accessLevel);

	List<ProxyConfig> load() throws IOException;

	List<ProxyConfig> getConfig();

	List<ProxyConfig> getPublicConfig();

}
