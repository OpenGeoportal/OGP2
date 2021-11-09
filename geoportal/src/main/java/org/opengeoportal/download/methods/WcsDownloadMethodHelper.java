package org.opengeoportal.download.methods;

import java.net.MalformedURLException;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;
import java.util.stream.Stream;

import org.opengeoportal.download.exception.RequestCreationException;
import org.opengeoportal.download.types.LayerRequest;
import org.opengeoportal.download.types.RequestParams.Method;
import org.opengeoportal.layer.BoundingBox;
import org.opengeoportal.layer.Envelope;
import org.opengeoportal.ogc.AugmentedSolrRecord;
import org.opengeoportal.ogc.OgcInfoRequester;
import org.opengeoportal.ogc.OwsInfo;
import org.opengeoportal.ogc.wcs.wcs1_0_0.CoverageOffering1_0_0;
import org.opengeoportal.ogc.wcs.wcs1_0_0.WcsGetCoverage1_0_0;
import org.opengeoportal.utilities.OgpUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Component;

import static org.opengeoportal.utilities.OgpUtils.checkUrl;

@Component("wcsDownloadMethodHelper")
public class WcsDownloadMethodHelper implements PerLayerDownloadMethodHelper {
	final Logger logger = LoggerFactory.getLogger(this.getClass());

	final OgcInfoRequester wcsInfoRequester;

	@Autowired
	public WcsDownloadMethodHelper(@Qualifier("ogcInfoRequester.wcs_1_0_0")OgcInfoRequester wcsInfoRequester) {
		this.wcsInfoRequester = wcsInfoRequester;
	}

	@Override
	public Boolean includesMetadata() {
		return false;
	}

	@Override
	public Method getMethod(){
		return Method.POST;
	}
	
	@Override
	public Set<String> getExpectedContentType(){
		return Stream.of("application/zip", "image/geotiff", "image/tiff",
						"image/tiff; subtype=\"geotiff\"", "image/tiff;subtype=\"geotiff\"")
				.collect(Collectors.toCollection(HashSet::new));
	}

	@Override
	public String createQueryString(LayerRequest layerRequest) throws RequestCreationException {
		//--generate POST message
		//info needed: geometry column, bbox coords, epsg code, workspace & layername
	 	//all client bboxes should be passed as lat-lon coords.  we will need to get the appropriate epsg code for the layer
	 	//in order to return the file in original projection to the user (will also need to transform the bbox)
    	//all client bboxes should be passed as lat-lon coords.  we will need to get the appropriate epsg code for the layer
		//in order to return the file in original projection to the user 

		CoverageOffering1_0_0 describeLayerInfo = null;
		try {
			describeLayerInfo = (CoverageOffering1_0_0) OwsInfo.findWcsInfo(layerRequest.getOwsInfo()).getOwsDescribeInfo();
		} catch (Exception e){
			try {
				AugmentedSolrRecord asr = wcsInfoRequester.getOgcAugment(layerRequest.getLayerInfo());
				describeLayerInfo = (CoverageOffering1_0_0) OwsInfo.findWcsInfo(asr.getOwsInfo()).getInfoMap();
			} catch (Exception ex) {
				ex.printStackTrace();
				throw new RequestCreationException("unable to retrieve WCS envelope information to form request");
			}
		}

		Envelope env = describeLayerInfo.getLonLatEnvelope();
		BoundingBox nativeBounds = new BoundingBox(env.getMinX(), env.getMinY(), env.getMaxX(), env.getMaxY());
		logger.info("reqLatLon" + layerRequest.getRequestedBounds().toStringLatLon());
		logger.info("natLatLon" + nativeBounds.toStringLatLon());

		BoundingBox bounds = null;
		try {
			bounds = nativeBounds.getIntersection(layerRequest.getRequestedBounds());
			logger.info("intLatLon" + bounds.toStringLatLon());

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
		try {
			return WcsGetCoverage1_0_0.createWcsGetCoverageRequest(layerName, describeLayerInfo, bounds, epsgCode, format);
		} catch (Exception e) {
			e.printStackTrace();
			throw new RequestCreationException("unable to create WCS GetCoverage request");

		}
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
