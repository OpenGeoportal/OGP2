package org.OpenGeoPortal.Utilities;

import java.io.File;

import org.OpenGeoPortal.Layer.BoundingBox;

/**
 * An interface to download a zipped shapefile 
 * 
 * @author cbarne02
 *
 */
public interface QuickDownload {
	public File downloadZipFile(String layerId, BoundingBox bounds) throws Exception;
}
