package org.OpenGeoPortal.Utilities;

import java.io.File;

import org.OpenGeoPortal.Layer.BoundingBox;

public interface QuickDownload {
	public File downloadZipFile(String layerId, BoundingBox bounds) throws Exception;
}
