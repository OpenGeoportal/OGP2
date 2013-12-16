package org.opengeoportal.proxy;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.BeansException;
import org.springframework.context.ApplicationContext;
import org.springframework.context.ApplicationContextAware;

public class ImageDownloaderFactory implements ApplicationContextAware {
    private ApplicationContext applicationContext;
	final Logger logger = LoggerFactory.getLogger(this.getClass());

	public ImageDownloader getObject() throws Exception {
		logger.info("Creating ImageDownloader bean");
		return applicationContext.getBean(ImageDownloader.class);
	}

	public Class<ImageDownloader> getObjectType() {
		return ImageDownloader.class;
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
