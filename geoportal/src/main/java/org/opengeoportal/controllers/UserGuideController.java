package org.opengeoportal.controllers;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;

/**
 * Created by cbarne02 on 11/18/16.
 */
@Controller
public class UserGuideController {

    @RequestMapping(value = "userguide", method = RequestMethod.GET)
    public String getUserGuide() {
        return "userGuide";
    }

}
