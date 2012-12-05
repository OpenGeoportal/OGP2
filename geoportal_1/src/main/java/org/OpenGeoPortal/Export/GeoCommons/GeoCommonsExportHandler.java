package org.OpenGeoPortal.Export.GeoCommons;

import java.util.UUID;

public interface GeoCommonsExportHandler {
	UUID requestExport(GeoCommonsExportRequest exportRequest);

}
