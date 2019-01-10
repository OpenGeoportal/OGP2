package org.opengeoportal.controllers;

import org.opengeoportal.user.UserState;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;

@Controller
public class ResetController {

    @Autowired
    UserState userState;

    final Logger logger = LoggerFactory.getLogger(this.getClass());

    @RequestMapping(value={"/reset"}, method= RequestMethod.GET)
    public String resetPage() throws Exception {

        // clear the user state
        userState.clearState();

        // redirect to homepage
        return "redirect:/";

    }
}
