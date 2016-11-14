package org.opengeoportal.export.geocommons;

import java.util.UUID;

public interface GeoCommonsExportHandler {
	UUID requestExport(GeoCommonsExportRequest exportRequest);

}
