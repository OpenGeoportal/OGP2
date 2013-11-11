package org.opengeoportal.download.methods;

import java.io.File;

import com.vividsolutions.jts.geom.Envelope;

public interface FeatureSourceToShape {

	File exportToShapefile() throws Exception;

	void setFeatureCollectionBBox(Envelope bbox) throws Exception;

	FeatureSourceRetriever getFeatureSourceRetriever();

}