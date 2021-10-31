package org.opengeoportal.download.methods;

import org.locationtech.jts.geom.Envelope;

import java.io.File;
import java.util.Set;


public interface FeatureSourceToShape {

	void setFeatureCollectionBBox(Envelope bbox) throws Exception;

	FeatureSourceRetriever getFeatureSourceRetriever();

	Set<File> exportToShapefiles() throws Exception;

}