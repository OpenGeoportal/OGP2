package org.opengeoportal.download.methods;

import java.net.MalformedURLException;
import java.util.ArrayList;
import java.util.List;

import org.opengeoportal.config.proxy.ProxyConfigRetriever;
import org.opengeoportal.download.types.LayerRequest;
import org.opengeoportal.solr.SolrRecord;
import org.springframework.beans.factory.annotation.Autowired;

import com.fasterxml.jackson.core.JsonParseException;

public class ProxiedWcsDownloadMethod extends Wcs1_1_1DownloadMethod
		implements PerLayerDownloadMethod {
	@Autowired
	private ProxyConfigRetriever proxyConfigRetriever;

	
	@Override
	public List<String> getUrls(LayerRequest layer) throws MalformedURLException, JsonParseException{
		String url;
		List<String> urls = new ArrayList<String>();

		try {
			url = getProxyTo(layer);
			urls.add(url);

		} catch (Exception e) {
			e.printStackTrace();
			throw new MalformedURLException("Proxy url not found.");
		}
		return urls;
	}
	
	public String getProxyTo(LayerRequest layer) throws Exception {
		SolrRecord sr = layer.getLayerInfo();
		return proxyConfigRetriever.getInternalProxyUrl("wcs", sr.getInstitution(), sr.getAccess());
	}
}
