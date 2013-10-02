package org.OpenGeoportal.Download.Methods;

import java.io.IOException;
import java.net.MalformedURLException;
import java.util.ArrayList;
import java.util.List;

import org.OpenGeoportal.Download.Types.LayerRequest;
import org.OpenGeoportal.Solr.SearchConfigRetriever;
import org.springframework.beans.factory.annotation.Autowired;

import com.fasterxml.jackson.core.JsonParseException;


public class ProxiedWfsDownloadMethod extends
		WfsDownloadMethod implements PerLayerDownloadMethod {
	@Autowired
	private SearchConfigRetriever searchConfigRetriever;
	
	@Override
	public List<String> getUrls(LayerRequest layer) throws MalformedURLException, JsonParseException{
		String url;
		List<String> urls = new ArrayList<String>();

		try {
			url = getProxyTo(layer);
			urls.add(url);

		} catch (IOException e) {
			e.printStackTrace();
			throw new MalformedURLException("Proxy url not found.");
		}
		return urls;
	}
	
	public String getProxyTo(LayerRequest layer) throws IOException {
		return searchConfigRetriever.getWfsProxyInternal(layer.getLayerInfo().getInstitution(), layer.getLayerInfo().getAccess());
	}
}
