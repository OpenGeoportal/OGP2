package org.opengeoportal.proxy;

import java.io.File;
import java.io.InputStream;
import java.net.URL;
import java.util.concurrent.Future;

import org.apache.commons.io.FileUtils;
import org.apache.commons.io.IOUtils;
import org.opengeoportal.http.HttpRequester;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.context.annotation.Scope;
import org.springframework.scheduling.annotation.Async;
import org.springframework.scheduling.annotation.AsyncResult;
import org.springframework.stereotype.Component;

@Component
@Scope("prototype")
public class ImageDownloaderImpl implements ImageDownloader {
	final Logger logger = LoggerFactory.getLogger(this.getClass());

	private final HttpRequester httpRequester;

	@Autowired
	public ImageDownloaderImpl(HttpRequester httpRequester) {
		this.httpRequester = httpRequester;
	}

	@Override
	@Async
	public Future<File> getImage(URL imageLocation) throws Exception {		
		
		InputStream is = null;
		try {
			File tempFile = File.createTempFile("img", ".png");
			String query = imageLocation.getQuery();
			String base = imageLocation.toString().replace(query, "");
			
			is = this.httpRequester.sendRequest(base, query, "GET");
			String contentType = this.httpRequester.getContentType();
			logger.debug(contentType);
			if (contentType.toLowerCase().contains("png")){
				FileUtils.copyInputStreamToFile(is, tempFile);
				return new AsyncResult<File>(tempFile);

			} else {
					if ((contentType.toLowerCase().contains("xml"))||(contentType.toLowerCase().contains("html"))||
							(contentType.toLowerCase().contains("text"))){
						logger.error("Response content: " + IOUtils.toString(is));
					}
				
				throw new Exception("Image not found");
			}

		} finally {
			IOUtils.closeQuietly(is);
		}

	}

}
