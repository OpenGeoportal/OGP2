package org.opengeoportal.download.methods;

import java.util.ArrayList;
import java.util.List;

import org.opengeoportal.config.exception.ConfigException;
import org.opengeoportal.config.proxy.ProxyConfigRetriever;
import org.opengeoportal.download.exception.RequestCreationException;
import org.opengeoportal.download.types.LayerRequest;
import org.opengeoportal.ogc.OgcInfoRequester;
import org.opengeoportal.search.OGPRecord;
import org.springframework.beans.factory.annotation.Autowired;

import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Component;

@Component("proxiedWcsDownloadMethodHelper")
public class ProxiedWcsDownloadMethodHelper extends
		WcsDownloadMethodHelper implements PerLayerDownloadMethodHelper {

	private final ProxyConfigRetriever proxyConfigRetriever;

	@Autowired
	public ProxiedWcsDownloadMethodHelper(@Qualifier("ogcInfoRequester.wcs_1_0_0") OgcInfoRequester wcsInfoRequester,
										  ProxyConfigRetriever proxyConfigRetriever) {
		super(wcsInfoRequester);
		this.proxyConfigRetriever = proxyConfigRetriever;
	}


	@Override
	public List<String> getUrls(LayerRequest layer) throws RequestCreationException {
		String url;
		List<String> urls = new ArrayList<String>();

		try {
			url = getProxyTo(layer);
			urls.add(url);

		} catch (ConfigException e) {
			logger.error(e.getMessage());
			throw new RequestCreationException("Proxy url not found.");
		}
		return urls;
	}
	
	public String getProxyTo(LayerRequest layer) throws ConfigException {
		OGPRecord sr = layer.getLayerInfo();
		return proxyConfigRetriever.getInternalProxyUrl("wcs", sr.getInstitution(), sr.getAccess());
	}
}
