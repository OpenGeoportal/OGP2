package org.opengeoportal.ogc;

import java.io.InputStream;

import org.apache.commons.io.IOUtils;
import org.apache.solr.client.solrj.SolrServerException;
import org.opengeoportal.metadata.LayerInfoRetriever;
import org.opengeoportal.ogc.OwsInfo;
import org.opengeoportal.solr.SearchConfigRetriever;
import org.opengeoportal.solr.SolrRecord;
import org.opengeoportal.utilities.OgpUtils;
import org.opengeoportal.utilities.http.HttpRequester;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class OgcInfoRequesterImpl implements OgcInfoRequester {
	private HttpRequester httpRequester;
	private OgcInfoRequest ogcInfoRequest;
	private LayerInfoRetriever layerInfoRetriever;
	private SearchConfigRetriever searchConfigRetriever;
	final Logger logger = LoggerFactory.getLogger(this.getClass());

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

	public LayerInfoRetriever getLayerInfoRetriever() {
		return layerInfoRetriever;
	}

	public void setLayerInfoRetriever(LayerInfoRetriever layerInfoRetriever) {
		this.layerInfoRetriever = layerInfoRetriever;
	}

	public SearchConfigRetriever getSearchConfigRetriever() {
		return searchConfigRetriever;
	}

	public void setSearchConfigRetriever(SearchConfigRetriever searchConfigRetriever) {
		this.searchConfigRetriever = searchConfigRetriever;
	}


	private OwsInfo handleResponse(String contentType, InputStream inputStream) throws Exception{
		logger.info(contentType);
		Boolean contentMatch = contentType.toLowerCase().contains("xml");
		if (!contentMatch){
			logger.error("Unexpected content type: " + contentType);
			//If there is a mismatch with the expected content, but the response is text, we want to at least log the response
			if (contentType.toLowerCase().contains("text")||contentType.toLowerCase().contains("html")||contentType.toLowerCase().contains("xml")){
				logger.error("Returned text: " + IOUtils.toString(inputStream));
			} 
		
			throw new Exception("Unexpected content type");

		} else {
			try{
				return ogcInfoRequest.parseResponse(inputStream);
			} catch (Exception e){
				e.printStackTrace();
				throw new Exception("Could not parse response");
			}
		}
	}
		
	public OwsInfo getOwsInfo(SolrRecord solrRecord, String owsUrl) throws Exception {
		InputStream is = null;
		try{
			String layerName = OgpUtils.getLayerNameNS(solrRecord.getWorkspaceName(), solrRecord.getName());

			String request = ogcInfoRequest.createRequest(layerName);
			String method = ogcInfoRequest.getMethod();

			is = httpRequester.sendRequest(owsUrl, request, method);

			int status = httpRequester.getStatus();
			if (status == 200){
				String contentType = httpRequester.getContentType().toLowerCase();
				return handleResponse(contentType, is);
			} else {
				throw new Exception("Error communicating with server! response: " + Integer.toString(status));
			}
		} finally {
			IOUtils.closeQuietly(is);
		}
	}
	

	public OwsInfo getOwsInfo(SolrRecord solrRecord) throws Exception {
		InputStream is = null;
		try{
			String layerName = OgpUtils.getLayerNameNS(solrRecord.getWorkspaceName(), solrRecord.getName());

			String request = ogcInfoRequest.createRequest(layerName);
			String method = ogcInfoRequest.getMethod();
			String protocol = ogcInfoRequest.getOgcProtocol();
			String url = "";
			if (protocol.equalsIgnoreCase("wms")){
				url = searchConfigRetriever.getWmsUrl(solrRecord); 
			} else if (protocol.equalsIgnoreCase("wfs")){
				url = searchConfigRetriever.getWfsUrl(solrRecord);
			} else if (protocol.equalsIgnoreCase("wcs")){
				url = searchConfigRetriever.getWcsUrl(solrRecord);
			}

			is = httpRequester.sendRequest(url, request, method);

			int status = httpRequester.getStatus();
			if (status == 200){
				String contentType = httpRequester.getContentType().toLowerCase();
				return handleResponse(contentType, is);
			} else {
				throw new Exception("Error communicating with server! response: " + Integer.toString(status));
			}
		} finally {
			IOUtils.closeQuietly(is);
		}
	}
	

	public OwsInfo getResponseMap(String layerId) throws SolrServerException, Exception {
		SolrRecord solrRecord = layerInfoRetriever.getAllLayerInfo(layerId);
		logger.info(solrRecord.toString());

		return getOwsInfo(solrRecord);
		
	}

	@Override
	public AugmentedSolrRecord getOgcAugment(String layerId) throws SolrServerException, Exception {
			SolrRecord solrRecord = layerInfoRetriever.getAllLayerInfo(layerId);
			return getOgcAugment(solrRecord);
	}

	@Override
	public AugmentedSolrRecord getOgcAugment(String layerId, String owsUrl) throws SolrServerException, Exception {
		SolrRecord solrRecord = layerInfoRetriever.getAllLayerInfo(layerId);
		logger.info(solrRecord.toString());
		return getOgcAugment(solrRecord, owsUrl);
	}
	
	@Override
	public AugmentedSolrRecord getOgcAugment(SolrRecord solrRecord, String owsUrl)
			throws Exception {
		AugmentedSolrRecord asr = new AugmentedSolrRecord();
		asr.setSolrRecord(solrRecord);
		OwsInfo info = getOwsInfo(solrRecord, owsUrl);
		asr.getOwsInfo().add(info);

		return asr;
	}

	@Override
	public AugmentedSolrRecord getOgcAugment(SolrRecord solrRecord)
			throws Exception {
		
		AugmentedSolrRecord asr = new AugmentedSolrRecord();
		asr.setSolrRecord(solrRecord);
		OwsInfo info = getOwsInfo(solrRecord);
		asr.getOwsInfo().add(info);
		return asr;
	}
	

}
