package org.OpenGeoportal.Ogc;

import java.net.MalformedURLException;
import java.net.URL;
import java.util.List;

import org.OpenGeoportal.Ogc.OwsInfo.OwsType;
import org.OpenGeoportal.Solr.SolrRecord;
import org.OpenGeoportal.Utilities.LocationFieldUtils;
import org.apache.solr.client.solrj.SolrServerException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;

import com.fasterxml.jackson.core.JsonParseException;

public class AugmentedSolrRecordRetrieverImpl implements AugmentedSolrRecordRetriever {
	final Logger logger = LoggerFactory.getLogger(this.getClass());
	private final int WMS_ATTEMPTS = 3;
	private final int DATA_ATTEMPTS = 3;
	private final int PAUSE = 200;//milliseconds

	@Autowired
	@Qualifier("ogcInfoRequester.wms")
	private OgcInfoRequester wmsRequester;
	@Autowired
	@Qualifier("ogcInfoRequester.wfs")
	private OgcInfoRequester wfsRequester;
	@Autowired
	@Qualifier("ogcInfoRequester.wcs_1_0_0")
	private OgcInfoRequester wcsRequester;
	 
	@Override
	public OwsInfo getWmsInfo(String layerId) throws Exception{
		List<OwsInfo> info = this.getWmsPlusSolrInfo(layerId).getOwsInfo();
		return OwsInfo.findWmsInfo(info);
	}
	
	@Override
	public AugmentedSolrRecord getWmsPlusSolrInfo(String layerId) throws Exception{
		AugmentedSolrRecord asr = getInfoAttempt(wmsRequester, WMS_ATTEMPTS, layerId);
		return asr;
	}
	
	@Override
	public OwsInfo getOgcDataInfo(String layerId) throws Exception {
		List<OwsInfo> info = this.getOgcAugmentedSolrRecord(layerId).getOwsInfo();
		for (OwsInfo infoBit: info){
			if (infoBit.getOwsProtocol().type.equals(OwsType.DATA)){
				//returns only the first match...for now at least, there should only be one
				return infoBit;
			}
		}
		throw new Exception("No OWS Data Info found!");

	}
	
	@Override
	public AugmentedSolrRecord getOgcAugmentedSolrRecord(String layerId) throws Exception {

		AugmentedSolrRecord asr = getWmsPlusSolrInfo(layerId);
		OwsInfo wmsInfo =  OwsInfo.findWmsInfo(asr.getOwsInfo());
		String type = wmsInfo.getInfoMap().get("owsType");
		//String qualName = wmsInfo.getWmsResponseMap().get("qualifiedName");
		String owsUrl = wmsInfo.getInfoMap().get("owsUrl");
		Thread.sleep(PAUSE);

		return addNativeTypeInfo(asr, type, owsUrl);
	}
	
	private AugmentedSolrRecord addNativeTypeInfo(AugmentedSolrRecord asr, String type, String owsUrl) throws JsonParseException, MalformedURLException{
		AugmentedSolrRecord dataInfo = null;
		URL owsUrlObj = new URL(owsUrl);

		if (type.equalsIgnoreCase("wfs")){
			String storedUrl = LocationFieldUtils.getWfsUrl(asr.getSolrRecord().getLocation());
			URL storedUrlObj = new URL(storedUrl);
			try{
				dataInfo = getInfoAttempt(wfsRequester, DATA_ATTEMPTS, asr.getSolrRecord());
				asr.getOwsInfo().add(OwsInfo.findWfsInfo(dataInfo.getOwsInfo()));
				
			} catch (Exception e){
				//if the urls are substantively different, try the one retrieved from wms describeLayer
				if (!storedUrlObj.getHost().equalsIgnoreCase(owsUrlObj.getHost()) || !storedUrlObj.getPath().equalsIgnoreCase(owsUrlObj.getPath())){
				logger.info("trying retrieved URL: " + owsUrl);
					try {
						dataInfo = getInfoAttempt(wfsRequester, DATA_ATTEMPTS, asr.getSolrRecord(), owsUrl);
						asr.getOwsInfo().add(OwsInfo.findWfsInfo(dataInfo.getOwsInfo()));
					} catch (Exception e1){
						
					}
				}
			}
		} else if (type.equalsIgnoreCase("wcs")){
			String storedUrl = LocationFieldUtils.getWcsUrl(asr.getSolrRecord().getLocation());
			URL storedUrlObj = new URL(storedUrl);
			try{
				dataInfo = getInfoAttempt(wcsRequester, DATA_ATTEMPTS, asr.getSolrRecord());
				asr.getOwsInfo().add(OwsInfo.findWcsInfo(dataInfo.getOwsInfo()));
			} catch (Exception e){
				//if the urls are substantively different, try the one retrieved from wms describeLayer
				if (!storedUrlObj.getHost().equalsIgnoreCase(owsUrlObj.getHost()) || !storedUrlObj.getPath().equalsIgnoreCase(owsUrlObj.getPath())){
					try {
						logger.info("trying retrieved URL: " + owsUrl);
						dataInfo = getInfoAttempt(wcsRequester, DATA_ATTEMPTS, asr.getSolrRecord(), owsUrl);
						asr.getOwsInfo().add(OwsInfo.findWcsInfo(dataInfo.getOwsInfo()));
					} catch (Exception e1){
					}
				}
				
			}
		}

		return asr;
	}
	
	@Override
	public AugmentedSolrRecord getOgcAugmentedSolrRecord(SolrRecord solrRecord) throws Exception {

		AugmentedSolrRecord asr = getInfoAttempt(wmsRequester, DATA_ATTEMPTS, solrRecord);
		OwsInfo wmsInfo =  OwsInfo.findWmsInfo(asr.getOwsInfo());
		String type = wmsInfo.getInfoMap().get("owsType");
		//String qualName = wmsInfo.getWmsResponseMap().get("qualifiedName");
		String owsUrl = wmsInfo.getInfoMap().get("owsUrl");
		Thread.sleep(PAUSE);

		return addNativeTypeInfo(asr, type, owsUrl);

	}
	
	
	private AugmentedSolrRecord getInfoAttempt(OgcInfoRequester requester, int numAttempts, String layerId) throws Exception{
		AugmentedSolrRecord asr = null;

		for (int i = 0; i < numAttempts; i++ ){
			logger.info("Attempt " + (i + 1));

			try{
				asr = requester.getOgcAugment(layerId);
				if (asr == null){
					continue;
				} else {
					return asr;
				}
			} catch (SolrServerException e){
				throw new Exception(e.getMessage());
			} catch (Exception e){
				//just continue
				logger.warn("Error requesting ogc info: " + e.getMessage());
			}
			Thread.sleep(PAUSE * (i + 1));
		}

		if (asr == null){
			throw new Exception("Error reaching the OGC server.");
		} else {
			return asr;
		}
	}
	
	private AugmentedSolrRecord getInfoAttempt(OgcInfoRequester requester, int numAttempts, SolrRecord solrRecord) throws Exception{
		AugmentedSolrRecord asr = null;
		for (int i = 0; i < numAttempts; i++ ){
			logger.info("Attempt " + (i + 1));
			try{
				asr = requester.getOgcAugment(solrRecord);
				if (asr == null){
					continue;
				} else {
					return asr;
				}
			} catch (Exception e){
				logger.warn("Error requesting ogc info: " + e.getMessage());
			}
			Thread.sleep(PAUSE * (i + 1));

		}
		if (asr == null){
			throw new Exception("Error reaching the OGC server.");
		} else {
			return asr;
		}
	}
	
	private AugmentedSolrRecord getInfoAttempt(OgcInfoRequester requester, int numAttempts, SolrRecord solrRecord, String url) throws Exception{
		AugmentedSolrRecord asr = null;
		for (int i = 0; i < numAttempts; i++ ){
			logger.info("Attempt " + (i + 1));

			try{
				asr = requester.getOgcAugment(solrRecord, url);
				if (asr == null){
					continue;
				} else {
					return asr;
				}
			} catch (Exception e){
				logger.warn("Error requesting ogc info: " + e.getMessage());
			}
			Thread.sleep(PAUSE * (i + 1));

		}
		if (asr == null){
			throw new Exception("Error reaching the OGC server.");
		} else {
			return asr;
		}
	}
}
