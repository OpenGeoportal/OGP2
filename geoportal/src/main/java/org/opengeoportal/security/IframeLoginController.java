package org.opengeoportal.security;

import org.opengeoportal.config.ogp.OgpConfigRetriever;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.servlet.ModelAndView;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.ObjectWriter;

/**
 * Use this controller for iframe login with authentication natively supported in Spring Security (like CAS)
 * @author cbarne02
 *
 */
@Controller
public class IframeLoginController {
	@Autowired
	@Qualifier("formLoginService")
	LoginService loginService;
	
	@Autowired
	OgpConfigRetriever ogpConfigRetriever;
	
	final Logger logger = LoggerFactory.getLogger(this.getClass());

	@RequestMapping(value="restricted/weblogin", method=RequestMethod.GET)
	@ResponseBody public ModelAndView getStatus() throws JsonProcessingException {
		logger.debug("Login status checked");

		  String sendingPage = ogpConfigRetriever.getPropertyWithDefault("ogp.domain", "");
		  //create the model to return
		  ModelAndView mav = new ModelAndView("iframeLogin"); 
		  LoginStatus status = loginService.getStatus();
		  
		  ObjectWriter ow = new ObjectMapper().writer();
		  String json = ow.writeValueAsString(status);
		  
		  //test
		  //json = json.replace("false", "true");
		  
		  //send the authentication status as a json string
		  mav.addObject("authStatus", json);
		  //the sendingPage must be set to the domain of the OGP instance running for postMessage to work properly
		  mav.addObject("sendingPage", sendingPage);

		  return mav;
	}

}
