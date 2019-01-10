package org.opengeoportal.user;

import com.fasterxml.jackson.annotation.JsonInclude;
import org.apache.commons.collections.map.HashedMap;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Scope;
import org.springframework.context.annotation.ScopedProxyMode;
import org.springframework.stereotype.Component;

import javax.annotation.PostConstruct;

import java.util.Map;

@Scope(value = "session", proxyMode = ScopedProxyMode.TARGET_CLASS)
@Component
@JsonInclude(JsonInclude.Include.NON_NULL)
public class UserState {

    Map<String, Object> stateMap;

    final Logger logger = LoggerFactory.getLogger(this.getClass());

    @PostConstruct
    public void init() {

        stateMap = new HashedMap();
        logger.info("post construct...session user state");
    }

    public Map<String, Object> getStateMap() {
        return stateMap;
    }

    public void setStateMap(Map<String, Object> stateMap) {
        this.stateMap = stateMap;
    }

    public void clearState(){ this.stateMap = new HashedMap();}

}