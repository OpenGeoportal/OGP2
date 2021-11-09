package org.opengeoportal.download.methods;

import java.net.MalformedURLException;
import java.util.*;

import org.opengeoportal.download.exception.RequestCreationException;
import org.opengeoportal.download.types.LayerRequest;
import org.opengeoportal.download.types.RequestParams.Method;
import org.opengeoportal.layer.BoundingBox;
import org.opengeoportal.ogc.AugmentedSolrRecord;
import org.opengeoportal.ogc.OgcInfoRequester;
import org.opengeoportal.ogc.OwsInfo;
import org.opengeoportal.ogc.wcs.WcsGetCoverage1_1_1;
import org.opengeoportal.search.OGPRecord;
import org.opengeoportal.utilities.OgpUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Component;

import static org.opengeoportal.utilities.OgpUtils.checkUrl;

@Component("wcs1_1_1DownloadMethodHelper")
public class Wcs1_1_1DownloadMethodHelper implements PerLayerDownloadMethodHelper {
	final Logger logger = LoggerFactory.getLogger(this.getClass());

	final OgcInfoRequester wcsInfoRequester;

	@Autowired
	public Wcs1_1_1DownloadMethodHelper(@Qualifier("ogcInfoRequester.wcs_1_1_1") OgcInfoRequester wcsInfoRequester) {
		this.wcsInfoRequester = wcsInfoRequester;
	}

	@Override
	public Method getMethod(){
		return Method.POST;
	}

	@Override
	public Boolean includesMetadata() {
		return false;
	}
	
	@Override
	public Set<String> getExpectedContentType(){
		return Collections.singleton("application/zip");
	}

	@Override
	public String createQueryString(LayerRequest layerRequest) throws RequestCreationException {
		//--generate POST message
		//info needed: geometry column, bbox coords, epsg code, workspace & layername
		//all client bboxes should be passed as lat-lon coords.  we will need to get the appropriate epsg code for the layer
		//in order to return the file in original projection to the user (will also need to transform the bbox)
		//all client bboxes should be passed as lat-lon coords.  we will need to get the appropriate epsg code for the layer
		//in order to return the file in original projection to the user
		OGPRecord layerInfo = layerRequest.getLayerInfo();
		BoundingBox nativeBounds = new BoundingBox(layerInfo.getMinX(), layerInfo.getMinY(), layerInfo.getMaxX(), layerInfo.getMaxY());
		BoundingBox bounds = null;

		try {
			bounds = nativeBounds.getIntersection(layerRequest.getRequestedBounds());
		} catch (Exception e) {
			e.printStackTrace();
			throw new RequestCreationException("unable to calculate requested bounds");
		}
		String layerName = null;
		try {
			layerName = layerRequest.getLayerNameNS();
		} catch (Exception e) {
			e.printStackTrace();
			throw new RequestCreationException("unable to parse qualified layer Name");

		}

		Map<String, String> describeCoverageInfo = null;

		try {
			describeCoverageInfo = OwsInfo.findWcsInfo(layerRequest.getOwsInfo()).getInfoMap();
		} catch (Exception e){
			try {
				AugmentedSolrRecord asr = wcsInfoRequester.getOgcAugment(layerRequest.getLayerInfo());
				describeCoverageInfo = OwsInfo.findWcsInfo(asr.getOwsInfo()).getInfoMap();
			} catch (Exception ex) {
				ex.printStackTrace();
				throw new RequestCreationException("unable to retrieve WCS envelope information to form request");
			}
		}
		int epsgCode = 4326;

		/*
        GeoTiff - (format=geotiff)
        GTopo30 - (format=gtopo30)
        ArcGrid - (format=ArcGrid)
        GZipped ArcGrid - (format=ArcGrid-GZIP)
	*/

		String outputFormat = "image/tiff;subtype=&quot;geotiff&quot;";
		String getCoverageRequest = null;
		try {
			getCoverageRequest = WcsGetCoverage1_1_1.createWcsGetCoverageRequest(layerName, describeCoverageInfo, bounds, epsgCode, outputFormat);
			logger.debug(getCoverageRequest);
		} catch (Exception e) {
			e.printStackTrace();
			throw new RequestCreationException("unable to create WCS GetCoverage request");
		}

		return getCoverageRequest;
	}

	@Override
	public List<String> getUrls(LayerRequest layer) throws RequestCreationException{
		String url = null;
		try {
			url = layer.getWcsUrl();
		} catch (Exception e) {
			e.printStackTrace();
			throw new RequestCreationException("Problem parsing WCS url from record.");
		}
		url = OgpUtils.filterQueryString(url);
		try {
			checkUrl(url);
		} catch (MalformedURLException e) {
			e.printStackTrace();
			throw new RequestCreationException("WCS url from record is malformed.");
		}
		return List.of(url);
	}


}
