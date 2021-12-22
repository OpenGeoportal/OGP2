package org.opengeoportal.proxy;

import java.io.File;
import java.io.InputStream;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.util.concurrent.Future;

import org.apache.commons.io.FileUtils;
import org.opengeoportal.http.HttpRequester;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
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
		
		String query = imageLocation.getQuery();
		String base = imageLocation.toString().replace(query, "");
		try (InputStream is = this.httpRequester.sendRequest(base, query, "GET", "text/xml")) {

			File tempFile = File.createTempFile("img", ".png");

			String contentType = this.httpRequester.getContentType();
			logger.debug(contentType);
			if (contentType.toLowerCase().contains("png")){
				FileUtils.copyInputStreamToFile(is, tempFile);
				return new AsyncResult<File>(tempFile);

			} else {
					if ((contentType.toLowerCase().contains("xml"))||(contentType.toLowerCase().contains("html"))||
							(contentType.toLowerCase().contains("text"))){
						logger.error("Response content: " + new String(is.readAllBytes(), StandardCharsets.UTF_8));
					}
				
				throw new Exception("Image not found");
			}

		}

	}

	@Override
	@Async
	public Future<File> getImage(URL imageLocation, String username, String password) throws Exception {

		String query = imageLocation.getQuery();
		String base = imageLocation.toString().replace(query, "");
		try (InputStream is = this.httpRequester.sendRequest(base, query, "GET",
				"text/xml", username, password)) {

			File tempFile = File.createTempFile("img", ".png");

			String contentType = this.httpRequester.getContentType();
			logger.debug(contentType);
			if (contentType.toLowerCase().contains("png")){
				FileUtils.copyInputStreamToFile(is, tempFile);
				return new AsyncResult<File>(tempFile);

			} else {
				if ((contentType.toLowerCase().contains("xml"))||(contentType.toLowerCase().contains("html"))||
						(contentType.toLowerCase().contains("text"))){
					logger.error("Response content: " + new String(is.readAllBytes(), StandardCharsets.UTF_8));
				}

				throw new Exception("Image not found");
			}

		}

	}
}
