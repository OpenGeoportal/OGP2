package org.opengeoportal.download.methods;

import java.net.MalformedURLException;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

import org.opengeoportal.download.types.LayerRequest;
import org.opengeoportal.layer.BoundingBox;
import org.opengeoportal.layer.GeometryType;
import org.opengeoportal.ogc.OgcInfoRequest;
import org.opengeoportal.solr.SolrRecord;
import org.opengeoportal.utilities.OgpUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;

import com.fasterxml.jackson.core.JsonParseException;

public class WmsDownloadMethod extends AbstractDownloadMethod implements PerLayerDownloadMethod {	
	private static final Double MAX_AREA =  1800.0 * 1800.0;  //should be within recommended geoserver memory settings.
	private static final Boolean INCLUDES_METADATA = false;
	final Logger logger = LoggerFactory.getLogger(this.getClass());

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
		expectedContentType.add("application/vnd.google-earth.kml+xml");
		expectedContentType.add("application/vnd.google-earth.kmz");
		expectedContentType.add("image/geotiff");
		expectedContentType.add("image/tiff");
		expectedContentType.add("image/tiff; subtype=\"geotiff\"");

		return expectedContentType;
	}
	
	public String createDownloadRequest() throws Exception {
		//--generate POST message
		//info needed: geometry column, bbox coords, epsg code, workspace & layername
	 	//all client bboxes should be passed as lat-lon coords.  we will need to get the appropriate epsg code for the layer
	 	//in order to return the file in original projection to the user (will also need to transform the bbox)
		SolrRecord layerInfo = this.currentLayer.getLayerInfo();
		BoundingBox nativeBounds = new BoundingBox(layerInfo.getMinX(), layerInfo.getMinY(), layerInfo.getMaxX(), layerInfo.getMaxY());
		BoundingBox bounds = nativeBounds.getIntersection(this.currentLayer.getRequestedBounds());
		String layerName = this.currentLayer.getLayerNameNS();
		//for now we'll force wgs84.  we'll revisit if we need something different
		int epsgCode = 4326;
		/*
geoserver/wms?VERSION=1.3.0&REQUEST=GetMap&CRS=epsg:4326&BBOX=-90,-180,90,180&...

The format_options is a container for parameters that are format specific. The options in it are expressed as:

param1:value1;param2:value2;...

The currently recognized format options are:

    antialiasing (on, off, text): allows to control the use of antialiased rendering in raster outputs.
    dpi: sets the rendering dpi in raster outputs. The OGC standard dpi is 90, but if you need to perform 
    high resolution printouts it is advised to grab a larger image and set a higher dpi. For example, to 
    print at 300dpi a 100x100 image it is advised to ask for a 333x333 image setting the dpi value at 300. 
    In general the image size should be increased by a factor equal to targetDpi/90 and the target dpi set 
    in the format options.
			*/
		//height and width should be calculated based on the bounds
		Map<String,String> requestDimensions = this.calculateDimensions(bounds.getAspectRatio());
		
		String format = this.currentLayer.getRequestedFormat();
		if (format.toLowerCase().equals("geotiff")){
			format = "image/geotiff";
		}
		String getFeatureRequest = "SERVICE=WMS&VERSION=1.1.1&REQUEST=GetMap&SRS=epsg:" +
				epsgCode + "&BBOX=" + bounds.toString() + "&LAYERS=" + layerName +
				"&HEIGHT=" + requestDimensions.get("height") + "&WIDTH=" + requestDimensions.get("width") +
				"&FORMAT=" + format;
		if (!format.equals("kmz")){
			getFeatureRequest += "&TILED=no";
		} else {
			if (GeometryType.isVector(GeometryType.parseGeometryType(layerInfo.getDataType()))){
				getFeatureRequest += "&format_options=kmattr:true;kmscore:100;";
			} else {
				getFeatureRequest += "&format_options=kmattr:true;kmscore:0;";
			}
		}
    	return getFeatureRequest;
	}
	
	@Override
	public List<String> getUrls(LayerRequest layer) throws MalformedURLException, JsonParseException{
		String url = layer.getWmsUrl();
		url = OgpUtils.filterQueryString(url);
		this.checkUrl(url);
		return urlToUrls(url);
	}
	
		private Map<String, String> calculateDimensions(Double aspectRatio){
			String requestWidth;
			String requestHeight;
			Double heightNumber = Math.sqrt(MAX_AREA / aspectRatio);
			requestHeight = Integer.toString((int) Math.round(heightNumber));
			requestWidth = Integer.toString((int) Math.round(MAX_AREA/heightNumber));
			Map<String,String>requestDimensions = new HashMap<String,String>();
			requestDimensions.put("height", requestHeight);
			requestDimensions.put("width", requestWidth);
			return requestDimensions;
		};
		
		@Override
		public Boolean includesMetadata() {
			return INCLUDES_METADATA;
		}

}
