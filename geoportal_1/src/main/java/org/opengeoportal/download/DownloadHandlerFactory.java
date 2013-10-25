package org.opengeoportal.download;


import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class DownloadHandlerFactory {
	final static Logger logger = LoggerFactory.getLogger(DownloadHandlerFactory.class.getName());

	public static DownloadHandler create(){
		logger.info("creating downloadHandler");
		return new DownloadHandlerImpl();
	}
}
