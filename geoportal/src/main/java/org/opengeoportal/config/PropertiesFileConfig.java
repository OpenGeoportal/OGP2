package org.opengeoportal.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.ClassPathResource;

@Configuration
public class PropertiesFileConfig {
    /***
     * configures beans for configuration files
     * @return
     */
/*    @Bean("properties.generalOgp")
    public PropertiesFile generalProperties(){
        return new PropertiesFile(new ClassPathResource("WEB-INF/ogp.properties"));
    }*/

    @Bean("properties.repositories")
    public PropertiesFile repositoriesProperties(){
        return new PropertiesFile(new ClassPathResource("WEB-INF/repositories.properties"));
    }
}
