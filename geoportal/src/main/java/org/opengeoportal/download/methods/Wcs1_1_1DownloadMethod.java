package org.opengeoportal.download.methods;

import java.io.InputStream;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

import org.apache.commons.io.IOUtils;
import org.opengeoportal.download.types.LayerRequest;
import org.opengeoportal.layer.BoundingBox;
import org.opengeoportal.ogc.OgcInfoRequest;
import org.opengeoportal.ogc.OwsInfo;
import org.opengeoportal.ogc.wcs.WcsGetCoverage1_1_1;
import org.opengeoportal.solr.SolrRecord;
import org.opengeoportal.utilities.OgpUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;

public class Wcs1_1_1DownloadMethod extends AbstractDownloadMethod implements PerLayerDownloadMethod {	
	private static final Boolean INCLUDES_METADATA = false;
	private static final String METHOD = "POST";

	@Autowired
	@Qualifier("ogcInfoRequest.wcs_1_1_1")
	private OgcInfoRequest ogcInfoRequest;
	
	@Override
	public String getMethod(){
		return METHOD;
	}
	
	@Override
	public Set<String> getExpectedContentType(){
		Set<String> expectedContentType = new HashSet<String>();
		expectedContentType.add("application/zip");
		return expectedContentType;
	}
	
	public String createDownloadRequest() throws Exception {
		//--generate POST message
		//info needed: geometry column, bbox coords, epsg code, workspace & layername
	 	//all client bboxes should be passed as lat-lon coords.  we will need to get the appropriate epsg code for the layer
	 	//in order to return the file in original projection to the user (will also need to transform the bbox)
    	//all client bboxes should be passed as lat-lon coords.  we will need to get the appropriate epsg code for the layer
		//in order to return the file in original projection to the user 

		SolrRecord layerInfo = this.currentLayer.getLayerInfo();
		BoundingBox nativeBounds = new BoundingBox(layerInfo.getMinX(), layerInfo.getMinY(), layerInfo.getMaxX(), layerInfo.getMaxY());
		BoundingBox bounds = nativeBounds.getIntersection(this.currentLayer.getRequestedBounds());
		String layerName = this.currentLayer.getLayerNameNS();

		Map<String, String> describeCoverageInfo = null;
		try {
			describeCoverageInfo = OwsInfo.findWcsInfo(this.currentLayer.getOwsInfo()).getInfoMap();
		} catch (Exception e){
			this.currentLayer.getOwsInfo().add(getWcsDescribeCoverageInfo());
			describeCoverageInfo = OwsInfo.findWcsInfo(this.currentLayer.getOwsInfo()).getInfoMap();
		}
		
		int epsgCode = 4326;

		/*
        GeoTiff - (format=geotiff)
        GTopo30 - (format=gtopo30)
        ArcGrid - (format=ArcGrid)
        GZipped ArcGrid - (format=ArcGrid-GZIP)
	*/

		String outputFormat = "image/tiff;subtype=&quot;geotiff&quot;"; 
		String getCoverageRequest = WcsGetCoverage1_1_1.createWcsGetCoverageRequest(layerName, describeCoverageInfo, bounds, epsgCode, outputFormat);
		logger.info(getCoverageRequest);

		return getCoverageRequest;	 
	}
	
	@Override
	public List<String> getUrls(LayerRequest layer) throws Exception{
		String url = layer.getWcsUrl();
		this.checkUrl(url);
		return urlToUrls(url);
	}

	private OwsInfo getWcsDescribeCoverageInfo() throws Exception {
		InputStream inputStream = null;
		try{
			String layerName = this.currentLayer.getLayerNameNS();
			String describeCoverageRequest = ogcInfoRequest.createRequest(layerName);

			inputStream = this.httpRequester.sendRequest(OgpUtils.filterQueryString(this.getUrl(this.currentLayer)), describeCoverageRequest, ogcInfoRequest.getMethod());
			//parse the returned XML and return needed info as a map

			OwsInfo info = ogcInfoRequest.parseResponse(inputStream);
			return info;

		} finally {
			IOUtils.closeQuietly(inputStream);
		}
	}

	@Override
	public Boolean includesMetadata() {
		return INCLUDES_METADATA;
	}


}
