package org.opengeoportal.download.methods;

import java.io.File;
import java.util.Set;

import com.vividsolutions.jts.geom.Envelope;

public interface FeatureSourceToShape {

	void setFeatureCollectionBBox(Envelope bbox) throws Exception;

	FeatureSourceRetriever getFeatureSourceRetriever();

	Set<File> exportToShapefiles() throws Exception;

}