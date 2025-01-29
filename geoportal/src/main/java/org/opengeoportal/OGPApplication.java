package org.opengeoportal;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.security.servlet.SecurityAutoConfiguration;
import org.springframework.boot.autoconfigure.solr.SolrAutoConfiguration;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication(exclude = {SolrAutoConfiguration.class,
        SecurityAutoConfiguration.class})
@EnableScheduling
public class OGPApplication {

    public static void main(String[] args) {
        SpringApplication.run(OGPApplication.class, args);
    }
}
