package org.opengeoportal.export.geocommons;

import java.util.UUID;


import org.opengeoportal.download.RequestStatusManager;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;


public class GeoCommonsExportHandlerImpl implements GeoCommonsExportHandler {
	final Logger logger = LoggerFactory.getLogger(this.getClass());
	@Autowired
	private RequestStatusManager requestStatusManager;
	@Autowired
	private GeoCommonsExporter geoCommonsExporter;

	@Override
	public UUID requestExport(GeoCommonsExportRequest exportRequest) {
		UUID requestId = registerRequest(exportRequest.getSessionId(), exportRequest);
		geoCommonsExporter.submitExportRequest(exportRequest);
		return requestId;
	}
	
	private UUID registerRequest(String sessionId, GeoCommonsExportRequest exportRequest) {
		UUID requestId = UUID.randomUUID();
		requestStatusManager.addExportRequest(requestId, sessionId, exportRequest);
		return requestId;
	}
	
}
