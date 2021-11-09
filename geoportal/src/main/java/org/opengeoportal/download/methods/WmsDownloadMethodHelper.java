package org.opengeoportal.download.methods;

import java.net.MalformedURLException;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;
import java.util.stream.Stream;

import org.opengeoportal.download.exception.RequestCreationException;
import org.opengeoportal.download.types.LayerRequest;
import org.opengeoportal.download.types.RequestParams.Method;
import org.opengeoportal.layer.BoundingBox;
import org.opengeoportal.layer.GeometryType;
import org.opengeoportal.utilities.OgpUtils;

import com.fasterxml.jackson.core.JsonParseException;
import org.springframework.stereotype.Component;

import static org.opengeoportal.utilities.OgpUtils.checkUrl;
import static org.opengeoportal.utilities.OgpUtils.getClipBounds;

@Component("wmsDownloadMethodHelper")
public class WmsDownloadMethodHelper implements PerLayerDownloadMethodHelper {
	private static final Double MAX_AREA =  1800.0 * 1800.0;  //should be within recommended geoserver memory settings.

	@Override
	public Boolean includesMetadata() {
		return false;
	}

	@Override
	public Method getMethod() {
		return Method.GET;
	}
	@Override
	public Set<String> getExpectedContentType(){
		return Stream.of("application/zip", "application/vnd.google-earth.kml+xml", "application/vnd.google-earth.kmz",
						"image/geotiff", "image/tiff", "image/tiff; subtype=\"geotiff\"")
				.collect(Collectors.toCollection(HashSet::new));
	}

	@Override
	public String createQueryString(LayerRequest layerRequest) throws RequestCreationException {
		//--generate POST message
		//info needed: geometry column, bbox coords, epsg code, workspace & layername
	 	//all client bboxes should be passed as lat-lon coords.  we will need to get the appropriate epsg code for the layer
	 	//in order to return the file in original projection to the user (will also need to transform the bbox)
		BoundingBox bounds = null;
		try {
			bounds = getClipBounds(layerRequest);
		} catch (Exception e) {
			e.printStackTrace();
			throw new RequestCreationException("Problem creating bounds for request.");
		}

		String layerName = null;
		try {
			layerName = layerRequest.getLayerNameNS();
		} catch (Exception e) {
			e.printStackTrace();
			throw new RequestCreationException("Problem creating qualified layer name.");
		}
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
		
		String format = layerRequest.getRequestedFormat();
		if (format.equalsIgnoreCase("geotiff")){
			format = "image/geotiff";
		}
		String getFeatureRequest = "SERVICE=WMS&VERSION=1.1.1&REQUEST=GetMap&SRS=epsg:" +
				epsgCode + "&BBOX=" + bounds.toString() + "&LAYERS=" + layerName +
				"&HEIGHT=" + requestDimensions.get("height") + "&WIDTH=" + requestDimensions.get("width") +
				"&FORMAT=" + format;
		if (!format.equals("kmz")){
			getFeatureRequest += "&TILED=no";
		} else {
			if (GeometryType.isVector(GeometryType.parseGeometryType(layerRequest.getLayerInfo().getDataType()))){
				getFeatureRequest += "&format_options=kmattr:true;kmscore:100;";
			} else {
				getFeatureRequest += "&format_options=kmattr:true;kmscore:0;";
			}
		}
    	return getFeatureRequest;
	}

	@Override
	public List<String> getUrls(LayerRequest layer) throws RequestCreationException {
		String url = null;
		try {
			url = layer.getWmsUrl();
		} catch (JsonParseException e) {
			e.printStackTrace();
			throw new RequestCreationException("Problem parsing WMS url from record.");
		}
		url = OgpUtils.filterQueryString(url);
		try {
			checkUrl(url);
		} catch (MalformedURLException e) {
			e.printStackTrace();
			throw new RequestCreationException("WMS url from record is malformed.");
		}
		return List.of(url);
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

}
