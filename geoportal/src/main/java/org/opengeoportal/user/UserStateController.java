package org.opengeoportal.user;

import org.apache.commons.collections.map.HashedMap;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@Controller
@RequestMapping("/user")
public class UserStateController {

    final Logger logger = LoggerFactory.getLogger(this.getClass());

    public void setUserState(UserState userState) {
        this.userState = userState;
    }

    @Autowired
    UserState userState;


    @RequestMapping(value = "state", method = RequestMethod.GET, produces = "application/json")
    public
    @ResponseBody
    Map<String, Object> getUserState() throws Exception {

        return this.userState.getStateMap();
    }

    @RequestMapping(value = "state", method = RequestMethod.POST, consumes = "application/json")
    public
    @ResponseBody
    Map<String, Object> saveUserState(@RequestBody Map<String, Object> userStateMap) throws Exception {
        logger.info(userStateMap.toString());
        this.userState.setStateMap(userStateMap);

        Map<String, Object> resp = new HashedMap();
        resp.put("success", true);
        return resp;
    }

    @RequestMapping(value = "state", method = RequestMethod.DELETE, produces = "application/json")
    public
    @ResponseBody
    Map<String, Object> clearUserState() throws Exception {

        this.userState.clearState();

        Map<String, Object> resp = new HashedMap();
        resp.put("success", true);
        return resp;
    }

}