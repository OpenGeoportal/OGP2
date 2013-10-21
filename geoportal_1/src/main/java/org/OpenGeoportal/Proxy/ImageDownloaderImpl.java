package org.OpenGeoportal.Proxy;

import java.io.File;
import java.io.IOException;
import java.io.InputStream;
import java.util.concurrent.Future;

import org.OpenGeoportal.Utilities.Http.HttpRequester;
import org.apache.commons.io.FileUtils;
import org.apache.commons.io.IOUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.scheduling.annotation.Async;
import org.springframework.scheduling.annotation.AsyncResult;

public class ImageDownloaderImpl implements ImageDownloader {
	final Logger logger = LoggerFactory.getLogger(this.getClass());

	@Autowired @Qualifier("httpRequester.generic")
	private HttpRequester httpRequester;
	
	@Override
	@Async
	public Future<File> getImage(String baseUrl, String queryString) throws IOException {
		InputStream is = null;
		try {
			File tempFile = File.createTempFile("img", ".png");
			logger.info(baseUrl);
			is = this.httpRequester.sendRequest(baseUrl, queryString, "GET");
			String contentType = this.httpRequester.getContentType();
			if (contentType.toLowerCase().contains("png")){
				FileUtils.copyInputStreamToFile(is, tempFile);
			} else {
				if ((contentType.toLowerCase().contains("xml"))||(contentType.toLowerCase().contains("html"))||
						(contentType.toLowerCase().contains("text"))){
					logger.error("Response content: " + IOUtils.toString(is));
				}
				throw new IOException("Unexpected content-type: " + contentType);
			}
			return new AsyncResult<File>(tempFile);
			
		} finally {
			IOUtils.closeQuietly(is);
		}
	}

}
