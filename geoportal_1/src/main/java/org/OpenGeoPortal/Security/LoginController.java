package org.OpenGeoPortal.Security;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;

@Controller
public class LoginController {
	@Autowired
	@Qualifier("formLoginService")
	LoginService loginService;
	final Logger logger = LoggerFactory.getLogger(this.getClass());

	@RequestMapping(value="loginStatus", method=RequestMethod.GET, produces="application/json")
	@ResponseBody public LoginStatus getStatus() {
		return loginService.getStatus();
	}

	@RequestMapping(value="login", method=RequestMethod.GET, produces="application/json")
	@ResponseBody public LoginStatus login(@RequestParam("j_username") String username,
                         @RequestParam("j_password") String password) {
		return loginService.login(username, password);
	}
	
	@RequestMapping(value="logout", method=RequestMethod.GET, produces="application/json")
	@ResponseBody public LoginStatus logout() {
		return loginService.logout();
	}
}
