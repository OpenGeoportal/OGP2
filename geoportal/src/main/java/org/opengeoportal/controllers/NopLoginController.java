package org.opengeoportal.controllers;

import org.opengeoportal.config.ogp.OgpConfigRetriever;
import org.opengeoportal.security.LoginService;
import org.opengeoportal.security.LoginStatus;
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
 * Use this controller for login with auth schemes not natively supported in Spring Security (proprietery systems, Shib (until integration of SAML extension)
 * 
 * This should be the page that your external auth system protects.  Accessing this page authenticates you as an OGP user.  Since you can't get to this page without 
 * authenticating to your external system, OGP is protected from non-authorized users.  
 * If you can provide authentication with deeper Spring Security integrations,it is recommeneded.
 * 
 * @author cbarne02
 *
 */
@Controller
public class NopLoginController {
	final
	LoginService loginService;
	
	final
	OgpConfigRetriever ogpConfigRetriever;

	final Logger logger = LoggerFactory.getLogger(this.getClass());

	@Autowired
	public NopLoginController(@Qualifier("formLoginService") LoginService loginService, OgpConfigRetriever ogpConfigRetriever) {
		this.loginService = loginService;
		this.ogpConfigRetriever = ogpConfigRetriever;
	}

	@RequestMapping(value="weblogin", method=RequestMethod.GET)
	@ResponseBody public ModelAndView getStatus() throws JsonProcessingException {
		logger.debug("Login status checked");
		
		  String sendingPage = ogpConfigRetriever.getPropertyWithDefault("ogp.domain", "");
		  String noopUser = ogpConfigRetriever.getPropertyWithDefault("login.nop.user", "");
		  String noopPass = ogpConfigRetriever.getPropertyWithDefault("login.nop.password", "");

		  //create the model to return
		  ModelAndView mav = new ModelAndView("iframeLogin"); 
		  //The appropriate authentication manager must be configured.  The default one should work.  
		  //Make sure this username and password combo matches what's in your Spring Security context
		  LoginStatus status = loginService.login(noopUser, noopPass);
		  
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
