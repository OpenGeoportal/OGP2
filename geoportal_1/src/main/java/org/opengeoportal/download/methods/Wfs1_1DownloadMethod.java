package org.opengeoportal.download.methods;

import java.io.InputStream;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

import org.apache.commons.io.IOUtils;
import org.opengeoportal.download.types.LayerRequest;
import org.opengeoportal.layer.BoundingBox;
import org.opengeoportal.ogc.OgcInfoRequest;
import org.opengeoportal.ogc.OwsInfo;
import org.opengeoportal.solr.SolrRecord;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;

public class Wfs1_1DownloadMethod extends AbstractDownloadMethod implements PerLayerDownloadMethod {	
	private static final Boolean INCLUDES_METADATA = false;
	private static final String METHOD = "GET";

	@Autowired
	@Qualifier("ogcInfoRequest.wfs")
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
		String layerName = this.currentLayer.getLayerNameNS();
		SolrRecord layerInfo = this.currentLayer.getLayerInfo();
		BoundingBox nativeBounds = new BoundingBox(layerInfo.getMinX(), layerInfo.getMinY(), layerInfo.getMaxX(), layerInfo.getMaxY());
		BoundingBox bounds = nativeBounds.getIntersection(this.currentLayer.getRequestedBounds());

		/*String workSpace = layerInfo.getWorkspaceName();
		Map<String, String> describeLayerInfo = null;
		try {
			describeLayerInfo = OwsInfo.findWfsInfo(this.currentLayer.getOwsInfo()).getInfoMap();
		} catch (Exception e){
			this.currentLayer.getOwsInfo().add(getWfsDescribeLayerInfo());
			describeLayerInfo = OwsInfo.findWfsInfo(this.currentLayer.getOwsInfo()).getInfoMap();
		}
		String geometryColumn = describeLayerInfo.get("geometryColumn");
		String nameSpace = describeLayerInfo.get("nameSpace");
		String bboxFilter = "";
		if (!nativeBounds.isEquivalent(bounds)){
  			bboxFilter += "<ogc:Filter>"
      		+		"<ogc:BBOX>"
        	+			"<ogc:PropertyName>" + geometryColumn + "</ogc:PropertyName>"
        	+			bounds.generateGMLEnvelope(epsgCode)
        	+		"</ogc:BBOX>"
      		+	"</ogc:Filter>";
		}*/
		int epsgCode = 4326;//we are filtering the bounds based on WGS84
		String format = "shape-zip";
		String getFeatureRequest = "request=GetFeature&version=1.1.0&typeName=" + layerName + "&outputFormat=" + format + "&BBOX=" + bounds.toString() + ",EPSG:" + Integer.toString(epsgCode);

		// TODO should be xml
		/*String getFeatureRequest = "<wfs:GetFeature service=\"WFS\" version=\"1.1.0\""
			+ " outputFormat=\"shape-zip\""
			+ " xmlns:" + workSpace + "=\"" + nameSpace + "\""
  			+ " xmlns:wfs=\"http://www.opengis.net/wfs\""
  			+ " xmlns:ogc=\"http://www.opengis.net/ogc\""
  			+ " xmlns:gml=\"http://www.opengis.net/gml\""
  			+ " xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\""
  			+ " xsi:schemaLocation=\"http://www.opengis.net/wfs"
            + " http://schemas.opengis.net/wfs/1.1.0/wfs.xsd\">"
  			+ "<wfs:Query typeName=\"" + layerName + "\">"
  			+ bboxFilter
  			+ "</wfs:Query>"
			+ "</wfs:GetFeature>";
	*/
    	return getFeatureRequest;
	}
	
	@Override
	public List<String> getUrls(LayerRequest layer) throws Exception{
		String url = layer.getWfsUrl();
		this.checkUrl(url);
		return urlToUrls(url);
	}
	
	 OwsInfo getWfsDescribeLayerInfo()
	 	throws Exception {
		 InputStream inputStream = null;
		 try{
			 String layerName = this.currentLayer.getLayerNameNS();

			 inputStream = this.httpRequester.sendRequest(this.getUrl(this.currentLayer), ogcInfoRequest.createRequest(layerName), ogcInfoRequest.getMethod());
			 logger.info(this.httpRequester.getContentType());//check content type before doing any parsing of xml?

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
