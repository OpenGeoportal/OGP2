package org.OpenGeoPortal.Export.GeoCommons;

import java.util.UUID;

public interface GeocommonsExportHandler {
	UUID requestExport(GeoCommonsExportRequest exportRequest);

}
