package org.OpenGeoportal.Solr;

import java.io.IOException;
import java.util.Iterator;

import org.OpenGeoportal.Download.Config.ConfigRetriever;
import org.OpenGeoportal.Utilities.LocationFieldUtils;
import org.springframework.beans.factory.annotation.Value;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.node.ArrayNode;

public class OgpConfigRetriever extends ConfigRetriever implements
		SearchConfigRetriever {

	private @Value("${ogp.proxyToWMS}") String proxyToWMS;
	private @Value("${ogp.proxyToWFS}") String proxyToWFS;
	private @Value("${ogp.proxyToWCS}") String proxyToWCS;

	private String searchUrl;
	
	public String getSearchUrl() throws IOException {
		if (searchUrl == null || searchUrl.isEmpty()){
			this.readConfigFile();
			JsonNode jsonObject = this.configContents.path("search");
			searchUrl = jsonObject.path("serviceAddress").asText();
		}
			
		return searchUrl;
		
		
	}
	
	@Override
	public void setSearchUrl(String url){
		this.searchUrl = url;
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
		return jsonObject.path("serviceType").asText();
	}

	public String getHome() throws IOException {
		this.readConfigFile();
		return this.configContents.path("homeInstitution").asText();
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
		return this.configContents.path(configKey).asText();
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
			Iterator<JsonNode> accessIterator = accessNode.elements();
			while (accessIterator.hasNext()){
				String currentValue = accessIterator.next().asText();
				if (currentValue.equalsIgnoreCase(accessLevel)){
					return proxyObject.path(serviceKey).asText();
				}
			}
			return null;
		
		} else {
			return null;
		}
	}

	@Override
	public String getWmsUrl(SolrRecord solrRecord) throws IOException{
		String institution = solrRecord.getInstitution();
		String access = solrRecord.getAccess();
		
		if (hasWmsProxy(institution, access)){
			return getWmsProxy(institution, access);
		} else {
			return LocationFieldUtils.getWmsUrl(solrRecord.getLocation());
		}
	}
	
	@Override
	public String getWfsUrl(SolrRecord solrRecord) throws IOException{
		String institution = solrRecord.getInstitution();
		String access = solrRecord.getAccess();
		
		if (hasWfsProxy(institution, access)){
			return getWfsProxy(institution, access);
		} else {
			return LocationFieldUtils.getWfsUrl(solrRecord.getLocation());
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

	@Override
	public String getWmsProxyInternal(String institution, String accessLevel)
			throws Exception {

		return this.proxyToWMS;
	}

	@Override
	public String getWfsProxyInternal(String institution, String accessLevel)
			throws IOException {
		return this.proxyToWFS;
	}

	@Override
	public boolean hasWmsProxy(String institution, String access) {
		return hasProxy(institution, access, "wms");
	}

	private boolean hasProxy(String institution, String access, String ogcProtocol){
		try {
			if (this.getProxy(institution, access, ogcProtocol) != null){
				return true;
			} else {
				return false;
			}
		} catch (IOException e) {
			e.printStackTrace();
			return false;
		}
	}
	
	@Override
	public boolean hasWfsProxy(String institution, String access) {
		return hasProxy(institution, access, "wfs");
	}

	@Override
	public String getWcsProxy(String institution, String accessLevel)
			throws IOException {
		return getProxy(institution, accessLevel, "wcs");

	}

	@Override
	public String getWcsProxyInternal(String institution, String accessLevel)
			throws IOException {
		
		return this.proxyToWCS;
	}

	@Override
	public boolean hasWcsProxy(String institution, String access) {
		return hasProxy(institution, access, "wcs");
	}

	@Override
	public String getWcsUrl(SolrRecord solrRecord) throws IOException {
		String institution = solrRecord.getInstitution();
		String access = solrRecord.getAccess();
		
		if (hasWfsProxy(institution, access)){
			return getWcsProxy(institution, access);
		} else {
			return LocationFieldUtils.getWcsUrl(solrRecord.getLocation());
		}
	}
}
