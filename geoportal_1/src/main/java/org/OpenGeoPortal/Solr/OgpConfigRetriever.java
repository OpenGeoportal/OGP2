package org.OpenGeoPortal.Solr;

import java.io.IOException;
import java.util.Iterator;
import java.util.List;

import org.OpenGeoPortal.Download.Config.ConfigRetriever;
import org.codehaus.jackson.JsonNode;
import org.codehaus.jackson.node.ArrayNode;

public class OgpConfigRetriever extends ConfigRetriever implements
		SearchConfigRetriever {

	public String getSearchUrl() throws IOException {
		this.readConfigFile();
		JsonNode jsonObject = this.configContents.path("search");
		return jsonObject.path("serviceAddress").getTextValue();
	}

	public String getSearchPort() throws IOException {
		this.readConfigFile();
		JsonNode jsonObject = this.configContents.path("search");
		int searchPort = jsonObject.path("servicePort").asInt();
		return Integer.toString(searchPort);
	}

	public String getSearchType() throws IOException {
		this.readConfigFile();
		JsonNode jsonObject = this.configContents.path("search");
		return jsonObject.path("serviceType").getTextValue();
	}

	public String getHome() throws IOException {
		this.readConfigFile();
		return this.configContents.path("homeInstitution").getTextValue();
	}

	public Boolean isOgp() {
		return true;
	}

	public String getArbitrary(String configKey) throws Exception {
		/*
		 * this only works for strings in the top level. should eventually be
		 * more generic
		 */
		this.readConfigFile();
		return this.configContents.path(configKey).getTextValue();
	}

	private String getProxy(String institution, String accessLevel, String serviceKey)
			throws IOException {
		this.readConfigFile();
		institution = institution.trim();
		accessLevel = accessLevel.trim();
		JsonNode allInstitutionsObject = this.configContents.path("institutions");
		JsonNode institutionObject = allInstitutionsObject.path(institution);
		if (institutionObject.has("proxy")) {
			JsonNode proxyObject = institutionObject.path("proxy");
			ArrayNode accessNode = (ArrayNode) proxyObject.path("accessLevel");
			Iterator<JsonNode> accessIterator = accessNode.getElements();
			while (accessIterator.hasNext()){
				String currentValue = accessIterator.next().getTextValue();
				if (currentValue.equalsIgnoreCase(accessLevel)){
					return proxyObject.path(serviceKey).getTextValue();
				}
			}
			return null;
		
		} else {
			return null;
		}
	}
	
	@Override
	public String getWmsProxy(String institution, String accessLevel)
			throws IOException {
		return getProxy(institution, accessLevel, "wms");
	}
	
	@Override
	public String getWfsProxy(String institution, String accessLevel)
			throws IOException {
		return getProxy(institution, accessLevel, "wfs");
	}
}
