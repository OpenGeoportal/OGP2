package org.opengeoportal.controllers;

import org.opengeoportal.security.LoginService;
import org.opengeoportal.security.LoginStatus;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
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
	final LoginService loginService;

	@Value("${ogp.domain}")
	private String ogpDomain;

	final Logger logger = LoggerFactory.getLogger(this.getClass());

	@Autowired
	public IframeLoginController(@Qualifier("formLoginService") LoginService loginService) {
		this.loginService = loginService;
	}

	@RequestMapping(value="restricted/weblogin", method=RequestMethod.GET)
	@ResponseBody public ModelAndView getStatus() throws JsonProcessingException {
		logger.debug("Login status checked");

		  String sendingPage = ogpDomain;
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
