package org.opengeoportal.download.methods;

import java.io.File;
import java.util.HashSet;
import java.util.Set;
import java.util.concurrent.Future;

import org.geotools.geometry.jts.ReferencedEnvelope;
import org.geotools.referencing.crs.DefaultGeographicCRS;
import org.opengeoportal.download.types.LayerRequest;
import org.opengeoportal.layer.BoundingBox;
import org.opengis.referencing.crs.CoordinateReferenceSystem;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.AsyncResult;

import com.vividsolutions.jts.geom.Envelope;

public class GeoToolsDownloadMethod implements PerLayerDownloadMethod {
	private static final Boolean INCLUDES_METADATA = false;
	
	private FeatureSourceToShape featureSourceToShape;
	
	final Logger logger = LoggerFactory.getLogger(this.getClass());

	public FeatureSourceToShape getFeatureSourceToShape() {
		return featureSourceToShape;
	}

	public void setFeatureSourceToShape(FeatureSourceToShape featureSourceToShape) {
		this.featureSourceToShape = featureSourceToShape;
	}

	@Override
	public Future<Set<File>> download(LayerRequest currentLayer)
			throws Exception {
		BoundingBox bbox = currentLayer.getRequestedBounds();
		Envelope currentBounds = new Envelope(bbox.getMinX(), bbox.getMinY(), bbox.getMaxX(), bbox.getMaxY());
		FeatureSourceRetriever fsr = featureSourceToShape.getFeatureSourceRetriever();
		fsr.createFeatureSourceFromLayerRequest(currentLayer);
		//might as well get the native bounds from the source...the metadata might be wrong
		ReferencedEnvelope nativeBounds = fsr.getFeatureSource().getBounds();
		CoordinateReferenceSystem crs = DefaultGeographicCRS.WGS84;
		ReferencedEnvelope currentEnv = ReferencedEnvelope.create(currentBounds, crs);
		
		logger.info(currentEnv.toString());
		logger.info(currentEnv.getCoordinateReferenceSystem().toString());
		logger.info(nativeBounds.toString());
		logger.info(nativeBounds.getCoordinateReferenceSystem().toString());
		/*if (!nativeBounds.intersects(currentBounds)){
			//throw Exception?  bounds don't intersect
			throw new Exception("Bounds don't intersect!");
		}*/
		
		//featureSourceToShape.setFeatureCollectionBBox(currentBounds);
		
		Set<File> fileSet = new HashSet<File>();
		fileSet.add(featureSourceToShape.exportToShapefile());
		return new AsyncResult<Set<File>>(fileSet);
	}

	@Override
	public Boolean includesMetadata() {
		return INCLUDES_METADATA;
	}

	@Override
	public Boolean hasRequiredInfo(LayerRequest layer) {
		// TODO determine how to do this generically
		return true;
	}

}
