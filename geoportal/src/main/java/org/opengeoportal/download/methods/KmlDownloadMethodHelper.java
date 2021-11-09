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
import org.opengeoportal.layer.GeometryType;
import org.opengeoportal.utilities.OgpUtils;

import com.fasterxml.jackson.core.JsonParseException;
import org.springframework.stereotype.Component;

import static org.opengeoportal.utilities.OgpUtils.checkUrl;
import static org.opengeoportal.utilities.OgpUtils.getClipBounds;

@Component("kmlDownloadMethodHelper")
public class KmlDownloadMethodHelper implements PerLayerDownloadMethodHelper {

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
		return Stream.of("application/vnd.google-earth.kml+xml", "application/vnd.google-earth.kmz")
				.collect(Collectors.toCollection(HashSet::new));
	}

	@Override
	public String createQueryString(LayerRequest layerRequest) throws RequestCreationException {
		BoundingBox bounds;
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
		/* we're going to use the kml reflector
		 * http://localhost:8080/geoserver/wms/kml?layers=topp:states

		kmscore=<value> 0 = force raster, 100 = force vector
		kmattr=[true|false] : whether or not kml has clickable attributes
		The format_options is a container for parameters that are format specific. The options in it are expressed as:
		 */

		String getFeatureRequest = "BBOX=" + bounds.toString() + "&LAYERS=" + layerName + "&format_options=kmattr:true;";
		if (GeometryType.isVector(GeometryType.parseGeometryType(layerRequest.getLayerInfo().getDataType()))){
			getFeatureRequest += "kmscore:100;";
		} else {
			getFeatureRequest += "kmscore:0;";
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
}
