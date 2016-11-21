package org.opengeoportal.image;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import org.springframework.beans.BeansException;
import org.springframework.context.ApplicationContext;
import org.springframework.context.ApplicationContextAware;

/**
 * Factory class to produce ImageHandler prototype-scoped beans.
 */
public class ImageHandlerFactory implements ApplicationContextAware {
    private ApplicationContext applicationContext;
	final Logger logger = LoggerFactory.getLogger(this.getClass());

	public ImageHandler getObject() throws Exception {
        logger.debug("Creating ImageHandler bean");
        return applicationContext.getBean(ImageHandler.class);
	}

	public Class<ImageHandler> getObjectType() {
		return ImageHandler.class;
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
