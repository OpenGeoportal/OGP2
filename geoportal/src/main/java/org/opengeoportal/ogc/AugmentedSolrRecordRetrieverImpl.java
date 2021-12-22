package org.opengeoportal.ogc;

import com.fasterxml.jackson.core.JsonParseException;
import org.opengeoportal.config.exception.ConfigException;
import org.opengeoportal.ogc.OwsInfo.OwsType;
import org.opengeoportal.search.OGPRecord;
import org.opengeoportal.service.SearchService;
import org.opengeoportal.utilities.LocationFieldUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.context.annotation.Scope;
import org.springframework.stereotype.Component;

import java.net.MalformedURLException;
import java.net.URL;
import java.util.List;

@Component
@Scope("prototype")
public class AugmentedSolrRecordRetrieverImpl implements AugmentedSolrRecordRetriever {
	final Logger logger = LoggerFactory.getLogger(this.getClass());
	private final int WMS_ATTEMPTS = 3;
	private final int DATA_ATTEMPTS = 3;
	private final int PAUSE = 200;//milliseconds

	private final OgcInfoRequester wmsRequester;
	private final OgcInfoRequester wfsRequester;
	private final OgcInfoRequester wcsRequester;
	private final SearchService searchService;

	@Autowired
	public AugmentedSolrRecordRetrieverImpl(@Qualifier("ogcInfoRequester.wms") OgcInfoRequester wmsRequester,
											@Qualifier("ogcInfoRequester.wfs") OgcInfoRequester wfsRequester,
											@Qualifier("ogcInfoRequester.wcs_1_0_0") OgcInfoRequester wcsRequester,
											SearchService searchService) {
		this.wmsRequester = wmsRequester;
		this.wfsRequester = wfsRequester;
		this.wcsRequester = wcsRequester;
		this.searchService = searchService;
	}

	@Override
	public OwsInfo getWmsInfo(String layerId) throws Exception{
		List<OwsInfo> info = this.getWmsPlusSolrInfo(layerId).getOwsInfo();
		return OwsInfo.findWmsInfo(info);
	}
	
	@Override
	public AugmentedSolrRecord getWmsPlusSolrInfo(String layerId) throws Exception{
		return getInfoAttempt(wmsRequester, WMS_ATTEMPTS, layerId);
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
			String storedUrl = LocationFieldUtils.getWfsUrl(asr.getOgpRecord().getLocation());
			URL storedUrlObj = new URL(storedUrl);
			try{
				dataInfo = getInfoAttempt(wfsRequester, DATA_ATTEMPTS, asr.getOgpRecord());
				asr.getOwsInfo().add(OwsInfo.findWfsInfo(dataInfo.getOwsInfo()));
				
			} catch (Exception e){
				//if the urls are substantively different, try the one retrieved from wms describeLayer
				if (!storedUrlObj.getHost().equalsIgnoreCase(owsUrlObj.getHost()) || !storedUrlObj.getPath().equalsIgnoreCase(owsUrlObj.getPath())){
				logger.info("trying retrieved URL: " + owsUrl);
					try {
						dataInfo = getInfoAttempt(wfsRequester, DATA_ATTEMPTS, asr.getOgpRecord(), owsUrl);
						asr.getOwsInfo().add(OwsInfo.findWfsInfo(dataInfo.getOwsInfo()));
					} catch (Exception e1){
						logger.error("failed to get info");
						e1.printStackTrace();
					}
				}
			}
		} else if (type.equalsIgnoreCase("wcs")){
			String storedUrl = LocationFieldUtils.getWcsUrl(asr.getOgpRecord().getLocation());
			URL storedUrlObj = new URL(storedUrl);
			try{
				dataInfo = getInfoAttempt(wcsRequester, DATA_ATTEMPTS, asr.getOgpRecord());
				asr.getOwsInfo().add(OwsInfo.findWcsInfo(dataInfo.getOwsInfo()));
			} catch (Exception e){
				//if the urls are substantively different, try the one retrieved from wms describeLayer
				if (!storedUrlObj.getHost().equalsIgnoreCase(owsUrlObj.getHost()) || !storedUrlObj.getPath().equalsIgnoreCase(owsUrlObj.getPath())){
					try {
						logger.info("trying retrieved URL: " + owsUrl);
						dataInfo = getInfoAttempt(wcsRequester, DATA_ATTEMPTS, asr.getOgpRecord(), owsUrl);
						asr.getOwsInfo().add(OwsInfo.findWcsInfo(dataInfo.getOwsInfo()));
					} catch (Exception e1){
						logger.error("failed to get info");
						e1.printStackTrace();
					}
				}
				
			}
		}

		return asr;
	}
	
	@Override
	public AugmentedSolrRecord getOgcAugmentedSolrRecord(OGPRecord ogpRecord) throws Exception {

		AugmentedSolrRecord asr = getInfoAttempt(wmsRequester, DATA_ATTEMPTS, ogpRecord);
		OwsInfo wmsInfo =  OwsInfo.findWmsInfo(asr.getOwsInfo());
		String type = wmsInfo.getInfoMap().get("owsType");
		//String qualName = wmsInfo.getWmsResponseMap().get("qualifiedName");
		String owsUrl = wmsInfo.getInfoMap().get("owsUrl");
		Thread.sleep(PAUSE);

		return addNativeTypeInfo(asr, type, owsUrl);

	}
	
	
	private AugmentedSolrRecord getInfoAttempt(OgcInfoRequester requester, int numAttempts, String layerId) throws Exception{
		OGPRecord ogpRecord = searchService.findRecordById(layerId);
		return getInfoAttempt(requester, numAttempts, ogpRecord);

	}
	
	
	private AugmentedSolrRecord getInfoAttempt(OgcInfoRequester requester, int numAttempts, OGPRecord ogpRecord) throws Exception{
		AugmentedSolrRecord asr = null;
		for (int i = 0; i < numAttempts; i++ ){
			logger.info("Attempt " + (i + 1));
			try{
				asr = requester.getOgcAugment(ogpRecord);
				if (asr != null){
					return asr;
				}
			} catch (Exception | ConfigException e){
				logger.warn("Error requesting ogc info: " + e.getMessage());
			}
			Thread.sleep(PAUSE * (i + 1));

		}
		throw new Exception("Error reaching the OGC server.");
	}
	
	private AugmentedSolrRecord getInfoAttempt(OgcInfoRequester requester, int numAttempts, OGPRecord ogpRecord, String url) throws Exception{
		AugmentedSolrRecord asr = null;
		for (int i = 0; i < numAttempts; i++ ){
			logger.info("Attempt " + (i + 1));

			try{
				asr = requester.getOgcAugment(ogpRecord, url);
				if (asr != null){
					return asr;
				}
			} catch (Exception e){
				logger.warn("Error requesting ogc info: " + e.getMessage());
			}
			Thread.sleep(PAUSE * (i + 1));

		}

		throw new Exception("Error reaching the OGC server.");
	}
}
