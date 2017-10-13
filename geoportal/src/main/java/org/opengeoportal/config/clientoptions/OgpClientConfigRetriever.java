package org.opengeoportal.config.clientoptions;

import java.io.IOException;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.opengeoportal.config.clientoptions.domain.OgpClientConfig;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.Resource;
import org.springframework.core.io.ResourceLoader;
import org.springframework.stereotype.Component;

import javax.annotation.PostConstruct;

/**
 * Class for dealing with JSON config file
 * @author cbarne02
 */
@Component
public class OgpClientConfigRetriever {

    @Autowired
    public OgpClientConfigRetriever(ResourceLoader resourceLoader){
        this.resourceLoader = resourceLoader;
    }

    private ResourceLoader resourceLoader;

    private OgpClientConfig config;



    @PostConstruct
    public void load() throws IOException {
        Resource config_file = resourceLoader.getResource("WEB-INF/ogp_config.json");
        ObjectMapper jsonMapper = new ObjectMapper();
        // deserialize contents of each file into an object of type
        config = jsonMapper.readValue(config_file.getFile(), OgpClientConfig.class);
    }


    public void reload() throws IOException {
        load();
    }

    public OgpClientConfig getConfig() {
        return config;
    }

}
