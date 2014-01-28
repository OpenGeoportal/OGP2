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
import org.opengeoportal.ogc.wfs.WfsGetFeature;
import org.opengeoportal.solr.SolrRecord;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;

public class WfsDownloadMethod extends AbstractDownloadMethod implements PerLayerDownloadMethod {	
	private static final Boolean INCLUDES_METADATA = false;
	final Logger logger = LoggerFactory.getLogger(this.getClass());
	@Autowired
	@Qualifier("ogcInfoRequest.wfs")
	private OgcInfoRequest ogcInfoRequest;
	
	@Override
	public String getMethod(){
		return WfsGetFeature.getMethod();
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
		String layerName = this.currentLayer.getLayerNameNS();
		SolrRecord layerInfo = this.currentLayer.getLayerInfo();
		BoundingBox nativeBounds = new BoundingBox(layerInfo.getMinX(), layerInfo.getMinY(), layerInfo.getMaxX(), layerInfo.getMaxY());
		BoundingBox bounds = nativeBounds.getIntersection(this.currentLayer.getRequestedBounds());

		String workSpace = layerInfo.getWorkspaceName();
		
		Map<String, String> describeLayerInfo = null;
		try {
			describeLayerInfo = OwsInfo.findWfsInfo(this.currentLayer.getOwsInfo()).getInfoMap();
		} catch (Exception e){
			this.currentLayer.getOwsInfo().add(getWfsDescribeLayerInfo());
			describeLayerInfo = OwsInfo.findWfsInfo(this.currentLayer.getOwsInfo()).getInfoMap();
		}

		String geometryColumn = describeLayerInfo.get("geometryColumn");
		String nameSpace = describeLayerInfo.get("nameSpace");
		int epsgCode = 4326;//we are filtering the bounds based on WGS84
		
		String bboxFilter = "";
		if (!nativeBounds.isEquivalent(bounds)){

  			bboxFilter += WfsGetFeature.getBboxFilter(bounds, geometryColumn, epsgCode);
		}
		
		//really, we should check the get caps doc to see if this is a viable option...probably this should be done before/at the download prompt
		String outputFormat = "shape-zip";
		
		String request =  WfsGetFeature.createWfsGetFeatureRequest(layerName, workSpace, nameSpace, outputFormat, bboxFilter);
		return request;
	}
	 
	@Override
	public List<String> getUrls(LayerRequest layer) throws Exception{
		String url = layer.getWfsUrl();
		this.checkUrl(url);
		return urlToUrls(url);
	}
	
	 OwsInfo getWfsDescribeLayerInfo() throws Exception {
		 InputStream inputStream = null;
		 
		 try{
			 String layerName = this.currentLayer.getLayerNameNS();
			 String describeFeatureRequest = ogcInfoRequest.createRequest(layerName);
			 String method = ogcInfoRequest.getMethod();
			 String url = this.getUrl(this.currentLayer);
			 inputStream = this.httpRequester.sendRequest(url, describeFeatureRequest, method);
			 String contentType = this.httpRequester.getContentType();

			 if (!contentType.contains("xml")){
				 throw new Exception("Expecting an XML response; instead, got content type '" + contentType + "'");
			 }
		
			 return ogcInfoRequest.parseResponse(inputStream);
		 } finally {
			IOUtils.closeQuietly(inputStream);
		 }
	 }


	@Override
	public Boolean includesMetadata() {
		return INCLUDES_METADATA;
	}

}
