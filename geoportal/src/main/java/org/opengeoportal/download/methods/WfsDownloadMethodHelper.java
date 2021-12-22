package org.opengeoportal.download.methods;

import java.net.MalformedURLException;
import java.util.*;

import org.opengeoportal.config.exception.ConfigException;
import org.opengeoportal.download.exception.RequestCreationException;
import org.opengeoportal.download.types.LayerRequest;
import org.opengeoportal.download.types.RequestParams.Method;
import org.opengeoportal.layer.BoundingBox;
import org.opengeoportal.ogc.AugmentedSolrRecord;
import org.opengeoportal.ogc.OgcInfoRequester;
import org.opengeoportal.ogc.OwsInfo;
import org.opengeoportal.ogc.wfs.WfsGetFeature;
import org.opengeoportal.search.OGPRecord;
import org.opengeoportal.utilities.LocationFieldUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Component;

import static org.opengeoportal.utilities.OgpUtils.checkUrl;
import static org.opengeoportal.utilities.OgpUtils.getClipBounds;

@Component("wfsDownloadMethodHelper")
public class WfsDownloadMethodHelper implements PerLayerDownloadMethodHelper {
	final Logger logger = LoggerFactory.getLogger(this.getClass());

	final OgcInfoRequester wfsInfoRequester;

	@Autowired
	public WfsDownloadMethodHelper(@Qualifier("ogcInfoRequester.wfs")OgcInfoRequester wfsInfoRequester) {
		this.wfsInfoRequester = wfsInfoRequester;
	}

	@Override
	public Method getMethod() {
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

		OGPRecord layerInfo = layerRequest.getLayerInfo();
		BoundingBox nativeBounds = new BoundingBox(layerInfo.getMinX(), layerInfo.getMinY(),
				layerInfo.getMaxX(), layerInfo.getMaxY());

		String workSpace = layerInfo.getWorkspaceName();

		Map<String, String> describeLayerInfo = null;
		try {
			describeLayerInfo = OwsInfo.findWfsInfo(layerRequest.getOwsInfo()).getInfoMap();
			assert describeLayerInfo.containsKey("geometryColumn");
			assert describeLayerInfo.containsKey("nameSpace");
		} catch (Exception e){
			try {
				logger.debug("Requesting additional info from WFS server.");
				// if the wfs layer info is not there, make a request to the WFS server
				AugmentedSolrRecord asr = wfsInfoRequester.getOgcAugment(layerInfo);
				describeLayerInfo = OwsInfo.findWfsInfo(asr.getOwsInfo()).getInfoMap();
			} catch (Exception | ConfigException ex) {
				logger.debug("Failed to get additional info from WFS server.");
				ex.printStackTrace();
			}
		}

		assert describeLayerInfo != null;
		if (describeLayerInfo.containsKey("geometryColumn") && describeLayerInfo.containsKey("nameSpace")) {
			String geometryColumn = describeLayerInfo.get("geometryColumn");
			String nameSpace = describeLayerInfo.get("nameSpace");
			int epsgCode = 4326;//we are filtering the bounds based on WGS84

			String bboxFilter = "";
			try {
				if (!nativeBounds.isEquivalent(bounds)) {

					bboxFilter += WfsGetFeature.getBboxFilter(bounds, geometryColumn, epsgCode);
				}
			} catch (Exception e) {
				e.printStackTrace();
				throw new RequestCreationException("error calculating bounds");
			}

			//really, we should check the get caps doc to see if this is a viable option...probably this should be done before/at the download prompt
			String outputFormat = "shape-zip";

			try {
				return WfsGetFeature.createWfsGetFeatureRequest(layerName, workSpace, nameSpace, outputFormat, bboxFilter);
			} catch (Exception e) {
				e.printStackTrace();
				throw new RequestCreationException("unable to form GetFeature request");

			}
		} else {
			throw new RequestCreationException("unable to retrieve WFS info");
		}
	}
	 
	@Override
	public List<String> getUrls(LayerRequest layer) throws RequestCreationException {
		
		//WFS services from ArcGIS Rest endpoints don't return shape-zip, so we have to use a different method
		//in the future, we should look to merge the 2 WFS download methods.  If the geotools version is fast enough,
		//it could be used for both types
		if(LocationFieldUtils.hasArcGISRestUrl(layer.getLayerInfo().getLocation())){
			return null;
		}

		String url = null;
		try {
			url = layer.getWfsUrl();
		} catch (Exception e) {
			e.printStackTrace();
		}
		try {
			checkUrl(url);
		} catch (MalformedURLException e) {
			e.printStackTrace();
		}
		assert url != null;
		return List.of(url);
	}
}
