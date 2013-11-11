package org.opengeoportal.download.methods;

import org.geotools.data.simple.SimpleFeatureSource;
import org.opengeoportal.download.types.LayerRequest;

public interface FeatureSourceRetriever {
	SimpleFeatureSource getFeatureSource() throws Exception;

	void createFeatureSourceFromLayerRequest(LayerRequest layerRequest) throws Exception;
}
