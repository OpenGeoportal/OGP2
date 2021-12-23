package org.opengeoportal.ogc;

import java.io.InputStream;
import java.nio.charset.StandardCharsets;

import org.opengeoportal.config.exception.ConfigException;
import org.opengeoportal.config.proxy.InternalServerMapping;
import org.opengeoportal.config.proxy.ProxyConfigRetriever;
import org.opengeoportal.search.OGPRecord;
import org.opengeoportal.utilities.OgpUtils;
import org.opengeoportal.http.HttpRequester;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class OgcInfoRequesterImpl implements OgcInfoRequester {
	private HttpRequester httpRequester;
	private OgcInfoRequest ogcInfoRequest;
	final Logger logger = LoggerFactory.getLogger(this.getClass());
	private ProxyConfigRetriever proxyConfigRetriever;

	public OgcInfoRequesterImpl(HttpRequester httpRequester, OgcInfoRequest ogcInfoRequest,
								ProxyConfigRetriever proxyConfigRetriever) {
		this.httpRequester = httpRequester;
		this.ogcInfoRequest = ogcInfoRequest;
		this.proxyConfigRetriever = proxyConfigRetriever;
	}

	public HttpRequester getHttpRequester() {
		return httpRequester;
	}

	public void setHttpRequester(HttpRequester httpRequester) {
		this.httpRequester = httpRequester;
	}

	public OgcInfoRequest getOgcInfoRequest() {
		return ogcInfoRequest;
	}

	public void setOgcInfoRequest(OgcInfoRequest ogcInfoRequest) {
		this.ogcInfoRequest = ogcInfoRequest;
	}

	public ProxyConfigRetriever getProxyConfigRetriever() {
		return proxyConfigRetriever;
	}

	public void setProxyConfigRetriever(ProxyConfigRetriever proxyConfigRetriever) {
		this.proxyConfigRetriever = proxyConfigRetriever;
	}

	private InputStream sendRequest(String url, OGPRecord ogpRecord) throws Exception, ConfigException {
		String layerName = OgpUtils.getLayerNameNS(ogpRecord.getWorkspaceName(), ogpRecord.getName());

		String request = ogcInfoRequest.createRequest(layerName);
		String method = ogcInfoRequest.getMethod();

		InternalServerMapping sm = null;
		try {
			sm = proxyConfigRetriever.getInternalServerMapping("wms", ogpRecord.getInstitution(), ogpRecord.getAccess());
		} catch (ConfigException e) {
			logger.warn(e.getMessage());
		}
		if (proxyConfigRetriever.hasProxy("wms", ogpRecord.getInstitution(), ogpRecord.getAccess()) &&
				proxyConfigRetriever.hasCredentials(sm)){
			return httpRequester.sendRequest(url, request, method, "text/xml",
					sm.getUsername(), sm.getPassword());
		} else {
			return httpRequester.sendRequest(url, request, method, "text/xml");
		}

	}

	public OwsInfo getOwsInfo(OGPRecord ogpRecord, String url) throws Exception{

		try (InputStream inputStream = sendRequest(url, ogpRecord)){

			int status = httpRequester.getStatus();
			if (status == 200) {
				String contentType = httpRequester.getContentType().toLowerCase();
				logger.info(contentType);
				Boolean contentMatch = contentType.toLowerCase().contains("xml");
				if (!contentMatch) {
					logger.error("Unexpected content type: " + contentType);
					//If there is a mismatch with the expected content, but the response is text, we want to at least log the response
					if (contentType.toLowerCase().contains("text") || contentType.toLowerCase().contains("html") || contentType.toLowerCase().contains("xml")) {
						logger.error("Returned text: " + new String(inputStream.readAllBytes(), StandardCharsets.UTF_8));
					}

					throw new Exception("Unexpected content type");

				} else {
					try {
						return ogcInfoRequest.parseResponse(inputStream);
					} catch (Exception e) {
						e.printStackTrace();
						throw new Exception("Could not parse response");
					}
				}
			} else {
				throw new Exception("Error communicating with server! response: " + Integer.toString(status));
			}
		} catch (ConfigException e) {
			logger.error(e.getMessage());
			throw new Exception("Misconfigured proxy");
		}
	}
	
	@Override
	public AugmentedSolrRecord getOgcAugment(OGPRecord ogpRecord, String owsUrl)
			throws Exception {
		AugmentedSolrRecord asr = new AugmentedSolrRecord();
		asr.setOgpRecord(ogpRecord);
		OwsInfo info = getOwsInfo(ogpRecord, owsUrl);
		asr.getOwsInfo().add(info);

		return asr;
	}

	@Override
	public AugmentedSolrRecord getOgcAugment(OGPRecord ogpRecord)
			throws Exception, ConfigException {
		
		AugmentedSolrRecord asr = new AugmentedSolrRecord();
		asr.setOgpRecord(ogpRecord);
		String protocol = ogcInfoRequest.getOgcProtocol().toLowerCase();
		String url = proxyConfigRetriever.getInternalUrl(protocol, ogpRecord.getInstitution(),
				ogpRecord.getAccess(), ogpRecord.getLocation());

		OwsInfo info = getOwsInfo(ogpRecord, url);
		asr.getOwsInfo().add(info);
		return asr;
	}
	

}
