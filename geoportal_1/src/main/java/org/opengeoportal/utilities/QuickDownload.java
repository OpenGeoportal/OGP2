package org.opengeoportal.utilities;

import java.io.File;

import org.opengeoportal.layer.BoundingBox;

/**
 * An interface to download a zipped shapefile 
 * 
 * @author cbarne02
 *
 */
public interface QuickDownload {
	public File downloadZipFile(String layerId, BoundingBox bounds) throws Exception;
}
