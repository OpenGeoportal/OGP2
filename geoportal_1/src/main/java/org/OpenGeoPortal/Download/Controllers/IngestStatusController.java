package org.OpenGeoPortal.Download.Controllers;

import java.util.UUID;

import javax.servlet.http.HttpServletResponse;

import org.OpenGeoPortal.Download.DownloadStatusManager;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.context.request.WebRequest;
import org.springframework.web.servlet.ModelAndView;

@Controller
@RequestMapping("/downloadStatus")
public class IngestStatusController {

	@Autowired
	private DownloadStatusManager downloadStatusManager;
	final Logger logger = LoggerFactory.getLogger(this.getClass());
	
	@RequestMapping(method=RequestMethod.GET, produces="application/json")
	public @ResponseBody DownloadStatus getDownloadStatus(@RequestParam("requestId") String requestId, Model model)  {
		DownloadStatus ingestStatus = downloadStatusManager.getDownloadStatus(UUID.fromString(requestId));
		model.addAttribute("downloadStatus", downloadStatus);

		return ingestStatus;
	}
}
