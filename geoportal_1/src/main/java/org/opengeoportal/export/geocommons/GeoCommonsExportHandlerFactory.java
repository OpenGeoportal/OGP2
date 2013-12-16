package org.opengeoportal.export.geocommons;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.BeansException;
import org.springframework.context.ApplicationContext;
import org.springframework.context.ApplicationContextAware;

public class GeoCommonsExportHandlerFactory implements ApplicationContextAware {
    private ApplicationContext applicationContext;
	final Logger logger = LoggerFactory.getLogger(this.getClass());

	public GeoCommonsExportHandler getObject() throws Exception {
		logger.info("Creating GeoCommonsExportHandler bean");
		return applicationContext.getBean(GeoCommonsExportHandler.class);
	}

	public Class<GeoCommonsExportHandler> getObjectType() {
		return GeoCommonsExportHandler.class;
	}

	public boolean isSingleton() {
		return false;
	}

	@Override
	public void setApplicationContext(ApplicationContext appContext)
			throws BeansException {
		applicationContext = appContext;
		
	}

}
