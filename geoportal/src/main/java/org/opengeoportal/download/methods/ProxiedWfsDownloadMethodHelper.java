package org.opengeoportal.download.methods;

import java.util.ArrayList;
import java.util.List;

import org.opengeoportal.config.proxy.ProxyConfigRetriever;
import org.opengeoportal.download.exception.RequestCreationException;
import org.opengeoportal.download.types.LayerRequest;
import org.opengeoportal.ogc.OgcInfoRequester;
import org.opengeoportal.search.OGPRecord;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Component;


@Component("proxiedWfsDownloadMethodHelper")
public class ProxiedWfsDownloadMethodHelper extends
		WfsDownloadMethodHelper implements PerLayerDownloadMethodHelper {
	private final ProxyConfigRetriever proxyConfigRetriever;

	@Autowired
    public ProxiedWfsDownloadMethodHelper(
			@Qualifier("ogcInfoRequester.wfs") OgcInfoRequester wfsInfoRequester,
			ProxyConfigRetriever proxyConfigRetriever) {
        super(wfsInfoRequester);
        this.proxyConfigRetriever = proxyConfigRetriever;
	}

    @Override
	public List<String> getUrls(LayerRequest layer) throws RequestCreationException {
		String url;
		List<String> urls = new ArrayList<String>();

		try {
			url = getProxyTo(layer);
			urls.add(url);

		} catch (Exception e) {
			e.printStackTrace();
			throw new RequestCreationException("Proxy url not found.");
		}
		return urls;
	}
	
	public String getProxyTo(LayerRequest layer) throws Exception {
		OGPRecord sr = layer.getLayerInfo();
		return proxyConfigRetriever.getInternalProxyUrl("wfs", sr.getInstitution(), sr.getAccess());
	}
}
