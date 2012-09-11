package org.OpenGeoPortal.Download.Controllers;

import java.util.UUID;


import org.OpenGeoPortal.Download.DownloadStatusManager;
import org.OpenGeoPortal.Download.DownloadStatusManagerImpl.DownloadRequestStatus;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;

@Controller
@RequestMapping("/downloadStatus")
public class IngestStatusController {

	@Autowired
	private DownloadStatusManager downloadStatusManager;
	final Logger logger = LoggerFactory.getLogger(this.getClass());
	
	@RequestMapping(method=RequestMethod.GET, produces="application/json")
	public @ResponseBody DownloadRequestStatus getDownloadStatus(@RequestParam("requestId") String requestId)  {
		DownloadRequestStatus downloadStatus = downloadStatusManager.getDownloadRequestStatus(UUID.fromString(requestId));
		return downloadStatus;
	}
}
