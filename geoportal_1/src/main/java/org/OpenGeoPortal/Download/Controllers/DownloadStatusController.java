package org.OpenGeoPortal.Download.Controllers;

import java.io.File;
import java.util.UUID;

import javax.servlet.ServletContext;
import javax.servlet.http.HttpServletRequest;


import org.OpenGeoPortal.Download.DownloadStatusManager;
import org.OpenGeoPortal.Download.DownloadStatusManagerImpl.DownloadRequest;
import org.OpenGeoPortal.Download.Types.RequestStatus;
import org.apache.commons.httpclient.URI;
import org.apache.http.client.utils.URIUtils;
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
public class DownloadStatusController {

	@Autowired
	private DownloadStatusManager downloadStatusManager;
	final Logger logger = LoggerFactory.getLogger(this.getClass());
	HttpServletRequest request;
	DownloadRequest downloadRequest;
	
	@RequestMapping(method=RequestMethod.GET, produces="application/json")
	public @ResponseBody RequestStatus getDownloadStatus(@RequestParam("requestId") String requestId, HttpServletRequest request)  {
		this.request = request;
		this.downloadRequest = downloadStatusManager.getDownloadRequest(UUID.fromString(requestId));
		//really only need a subset of this and a summary? of errors/successes/warnings.  also a web friendly link to the download 
		//package location, rather than an absolute path; let's do that conversion, processing here
		return getRequestStatus();
	}
	
	private RequestStatus getRequestStatus(){
		ServletContext context = request.getSession().getServletContext();
		logger.debug("contextpath: " + context.getContextPath());
		String contextDir = context.getRealPath(context.getContextPath());
		logger.debug(contextDir);
		File downloadPackage = downloadRequest.getDownloadPackage();
		//have a separate controller that does downloads by requestId
		return null;
	}
}
