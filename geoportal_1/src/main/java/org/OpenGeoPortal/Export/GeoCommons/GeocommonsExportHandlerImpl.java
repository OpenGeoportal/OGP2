package org.OpenGeoPortal.Export.GeoCommons;

import java.util.UUID;

import org.OpenGeoPortal.Download.RequestStatusManager;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;


public class GeocommonsExportHandlerImpl implements GeocommonsExportHandler {
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
