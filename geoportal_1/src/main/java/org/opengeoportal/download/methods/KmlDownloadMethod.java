package org.opengeoportal.download.methods;

import java.net.MalformedURLException;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

import org.opengeoportal.download.types.LayerRequest;
import org.opengeoportal.layer.BoundingBox;
import org.opengeoportal.layer.GeometryType;
import org.opengeoportal.utilities.OgpUtils;

import com.fasterxml.jackson.core.JsonParseException;

public class KmlDownloadMethod extends AbstractDownloadMethod implements PerLayerDownloadMethod {
	private static final Boolean INCLUDES_METADATA = false;
	private static final String METHOD = "GET";
	
	@Override
	public Boolean includesMetadata() {
		return INCLUDES_METADATA;
	}

	@Override
	public String getMethod(){
		return METHOD;
	}

	@Override
	public Set<String> getExpectedContentType(){
		Set<String> expectedContentType = new HashSet<String>();
		expectedContentType.add("application/vnd.google-earth.kml+xml");
		expectedContentType.add("application/vnd.google-earth.kmz");
		return expectedContentType;
	}

	@Override
	public String createDownloadRequest() throws Exception {

		BoundingBox bounds = this.getClipBounds();
		String layerName = this.currentLayer.getLayerNameNS();
		/* we're going to use the kml reflector
		 * http://localhost:8080/geoserver/wms/kml?layers=topp:states

		kmscore=<value> 0 = force raster, 100 = force vector
		kmattr=[true|false] : whether or not kml has clickable attributes
		The format_options is a container for parameters that are format specific. The options in it are expressed as:
		 */
		
		String getFeatureRequest = "BBOX=" + bounds.toString() + "&LAYERS=" + layerName + "&format_options=kmattr:true;";
		if (GeometryType.isVector(GeometryType.parseGeometryType(currentLayer.getLayerInfo().getDataType()))){
			getFeatureRequest += "kmscore:100;";
		} else {
			getFeatureRequest += "kmscore:0;";
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
}
