package org.opengeoportal.controllers;

import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.util.UUID;

import org.opengeoportal.download.RequestStatusManager;
import org.opengeoportal.proxy.ImageRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.InputStreamResource;
import org.springframework.core.io.Resource;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RequestParam;

import static org.springframework.http.MediaType.APPLICATION_OCTET_STREAM;

@Controller
@RequestMapping("/getImage")
public class ImageRetrievalController {
	private final RequestStatusManager requestStatusManager;
	final Logger logger = LoggerFactory.getLogger(this.getClass());
	final static long TIMEOUT = 5000;//milliseconds
	final static long INTERVAL = 500;//milliseconds

	@Autowired
	public ImageRetrievalController(RequestStatusManager requestStatusManager) {
		this.requestStatusManager = requestStatusManager;
	}

	@RequestMapping(method=RequestMethod.GET)
	public ResponseEntity<Resource> getDownload(@RequestParam("requestId") String requestId) throws IOException, InterruptedException  {
		
		ImageRequest imageRequest = requestStatusManager.getImageRequest(UUID.fromString(requestId));
		File downloadPackage = imageRequest.getDownloadFile();

		long counter = 0;
		while (!downloadPackage.exists()){
			Thread.sleep(INTERVAL);
			counter += INTERVAL;
			if (counter >= TIMEOUT){
				logger.error("Download timed out.  File could not be found.");
				throw new IOException("File does not exist.");
			}
		}
		if (counter > 0){
			logger.debug("Milliseconds slept: " + Long.toString(counter));
		}
		logger.info(downloadPackage.getName());
		logger.info(downloadPackage.getAbsolutePath());
		InputStreamResource resource = new InputStreamResource(new FileInputStream(downloadPackage));

		return ResponseEntity
				.ok()
				.contentType(APPLICATION_OCTET_STREAM)
				.header("Content-Disposition", "attachment; filename=\"" + downloadPackage.getName() + "\"")
				.header("Content-Length", (int) downloadPackage.length() + "")
				.body(resource);
	}
}
