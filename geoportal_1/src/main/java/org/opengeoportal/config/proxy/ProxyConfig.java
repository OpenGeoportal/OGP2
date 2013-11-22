package org.opengeoportal.config.proxy;

import java.util.ArrayList;
import java.util.List;

public class ProxyConfig {
/*# if you are using ogp to proxy download and preview of layers, set it
# up here.  (form is: proxy.${repository id}.*)
proxy.tufts.accessLevel=restricted

proxy.tufts.geoserver.internal=http://127.0.0.1:8580
proxy.tufts.geoserver.external=restricted
proxy.tufts.geoserver.username=
proxy.tufts.geoserver.password=
*/
	String repositoryId;
	List<String> accessLevels;
	List<ServerMapping> serverMapping = new ArrayList<ServerMapping>();

	public String getRepositoryId() {
		return repositoryId;
	}

	public void setRepositoryId(String repositoryId) {
		this.repositoryId = repositoryId;
	}

	public List<String> getAccessLevels() {
		return accessLevels;
	}

	public void setAccessLevels(List<String> accessLevels) {
		this.accessLevels = accessLevels;
	}

	public List<ServerMapping> getServerMapping() {
		return serverMapping;
	}

	public void setServerMapping(List<ServerMapping> serverMapping) {
		this.serverMapping = serverMapping;
	}
}
