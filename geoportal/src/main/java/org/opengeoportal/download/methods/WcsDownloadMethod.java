package org.opengeoportal.download.methods;

import java.io.InputStream;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

import org.apache.commons.io.IOUtils;
import org.opengeoportal.download.types.LayerRequest;
import org.opengeoportal.layer.BoundingBox;
import org.opengeoportal.layer.Envelope;
import org.opengeoportal.ogc.OgcInfoRequest;
import org.opengeoportal.ogc.OwsInfo;
import org.opengeoportal.ogc.wcs.wcs1_0_0.CoverageOffering1_0_0;
import org.opengeoportal.ogc.wcs.wcs1_0_0.WcsGetCoverage1_0_0;
import org.opengeoportal.solr.SolrRecord;
import org.opengeoportal.utilities.OgpUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;

public class WcsDownloadMethod extends AbstractDownloadMethod implements PerLayerDownloadMethod {	
	private static final Boolean INCLUDES_METADATA = false;

	@Autowired
	@Qualifier("ogcInfoRequest.wcs_1_0_0")
	private OgcInfoRequest ogcInfoRequest;
	@Override
	public String getMethod(){
		return WcsGetCoverage1_0_0.getMethod();
	}
	
	@Override
	public Set<String> getExpectedContentType(){
		Set<String> expectedContentType = new HashSet<String>();
		expectedContentType.add("application/zip");
		expectedContentType.add("image/tiff");
		expectedContentType.add("image/tiff;subtype=\"geotiff\"");
		expectedContentType.add("image/tiff; subtype=\"geotiff\"");
		return expectedContentType;
	}
	
	public String createDownloadRequest() throws Exception {
		//--generate POST message
		//info needed: geometry column, bbox coords, epsg code, workspace & layername
	 	//all client bboxes should be passed as lat-lon coords.  we will need to get the appropriate epsg code for the layer
	 	//in order to return the file in original projection to the user (will also need to transform the bbox)
    	//all client bboxes should be passed as lat-lon coords.  we will need to get the appropriate epsg code for the layer
		//in order to return the file in original projection to the user 

		CoverageOffering1_0_0 describeLayerInfo = null;
		try {
			describeLayerInfo = (CoverageOffering1_0_0) OwsInfo.findWcsInfo(this.currentLayer.getOwsInfo()).getOwsDescribeInfo();
		} catch (Exception e){
			this.currentLayer.getOwsInfo().add(getWcsDescribeCoverageInfo());
			describeLayerInfo = (CoverageOffering1_0_0) OwsInfo.findWcsInfo(this.currentLayer.getOwsInfo()).getOwsDescribeInfo();
		}
		
		SolrRecord layerInfo = this.currentLayer.getLayerInfo();
		
		Envelope env = describeLayerInfo.getLonLatEnvelope();
		BoundingBox nativeBounds = new BoundingBox(env.getMinX(), env.getMinY(), env.getMaxX(), env.getMaxY());
		logger.info("reqLatLon" + this.currentLayer.getRequestedBounds().toStringLatLon());
		logger.info("natLatLon" + nativeBounds.toStringLatLon());

		BoundingBox bounds = nativeBounds.getIntersection(this.currentLayer.getRequestedBounds());
		logger.info("intLatLon" + bounds.toStringLatLon());

		String layerName = this.currentLayer.getLayerNameNS();


		
		/*
		String epsgCode = describeLayerInfo.get("SRS");
		String domainSubset = "";

		//wcs requires this info, even for full extent
			String gmlLow = describeLayerInfo.get("gridEnvelopeLow");
			String gmlHigh = describeLayerInfo.get("gridEnvelopeHigh");
			String axes = "";
			if (describeLayerInfo.containsKey("axis1")){
				axes += "<gml:axisName>";
				axes += describeLayerInfo.get("axis1");
				axes += "</gml:axisName>";
				if (describeLayerInfo.containsKey("axis2")){
					axes += "<gml:axisName>";
					axes += describeLayerInfo.get("axis2");
					axes += "</gml:axisName>";
				}
			}
			domainSubset = "<domainSubset>"
				+				"<spatialSubset>"
				+					bounds.generateGMLEnvelope()
				+					"<gml:Grid dimension=\"2\">"
				+						"<gml:limits>"
				+							"<gml:GridEnvelope>"
				+								"<gml:low>" + gmlLow + "</gml:low>"
				+                				"<gml:high>" + gmlHigh + "</gml:high>"
				+							"</gml:GridEnvelope>"
				+						"</gml:limits>"
				+						axes
				+					"</gml:Grid>"
				+				"</spatialSubset>"
				+			"</domainSubset>";
		
		String format = "GeoTIFF";
	*/

      /*  GeoTiff - (format=geotiff)
        GTopo30 - (format=gtopo30)
        ArcGrid - (format=ArcGrid)
        GZipped ArcGrid - (format=ArcGrid-GZIP)
*/

		//http://data.fao.org/maps/wcs?service=WCS&version=1.0.0&request=GetCoverage&coverage=lus_mna_31661&bbox=-13.166733,39.766613,12.099957,63.333236&crs=EPSG:4326&format=geotiff&width=917&height=331
		/*
		String getCoverageRequest = "<GetCoverage service=\"WCS\" version=\"1.0.0\" "
			+  "xmlns=\"http://www.opengis.net/wcs\" "
	  		+  "xmlns:ogc=\"http://www.opengis.net/ogc\" "
	  		+  "xmlns:gml=\"http://www.opengis.net/gml\" " 
	  		+  "xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\" " 
	  		+  "xsi:schemaLocation=\"http://www.opengis.net/wcs http://schemas.opengis.net/wcs/1.0.0/getCoverage.xsd\">"
			+		"<sourceCoverage>" + layerName + "</sourceCoverage>"
			+ 		domainSubset
			+		"<output>"
		    +			"<crs>" + epsgCode + "</crs>"
			+			"<format>" + format + "</format>"
			+		"</output>"
			+	"</GetCoverage>";
		*/
		int epsgCode = 4326;
		String format = "geotiff";
		return WcsGetCoverage1_0_0.createWcsGetCoverageRequest(layerName, describeLayerInfo, bounds, epsgCode, format);
		//return getCoverageRequest;	 
	}
	
	@Override
	public List<String> getUrls(LayerRequest layer) throws Exception{
		String url = layer.getWcsUrl();
		this.checkUrl(url);
		return urlToUrls(url);
	}
	
	 OwsInfo getWcsDescribeCoverageInfo()
	 	throws Exception {
		 InputStream inputStream = null;
		 
		 try{
			String layerName = this.currentLayer.getLayerNameNS();
			
			inputStream = this.httpRequester.sendRequest(OgpUtils.filterQueryString(this.getUrl(this.currentLayer)), ogcInfoRequest.createRequest(layerName), ogcInfoRequest.getMethod());
			//parse the returned XML and return needed info as a map
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
