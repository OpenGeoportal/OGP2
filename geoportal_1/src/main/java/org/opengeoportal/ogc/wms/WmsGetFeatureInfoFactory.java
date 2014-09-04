package org.opengeoportal.ogc.wms;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.BeansException;
import org.springframework.context.ApplicationContext;
import org.springframework.context.ApplicationContextAware;

/**
 * @author cbarne02
 * 
 *         A class to create WmsGetFeatureInfo type objects. We need this since
 *         our controller is of singleton scope and WmsGetFeatureInfo is
 *         prototype scope. Implementing ApplicationContextAware allows us
 *         access to the Spring Application Context for the application.
 */
public class WmsGetFeatureInfoFactory implements ApplicationContextAware {
	private ApplicationContext applicationContext;
	final Logger logger = LoggerFactory.getLogger(this.getClass());

	public WmsGetFeatureInfo getObject() throws Exception {
		logger.debug("Creating WmsGetFeatureInfo bean");
		return applicationContext.getBean(WmsGetFeatureInfo.class);
	}

	public Class<WmsGetFeatureInfo> getObjectType() {
		return WmsGetFeatureInfo.class;
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
