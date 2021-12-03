package org.opengeoportal;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.actuate.autoconfigure.security.servlet.ManagementWebSecurityAutoConfiguration;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.security.servlet.SecurityAutoConfiguration;
import org.springframework.boot.autoconfigure.solr.SolrAutoConfiguration;

@SpringBootApplication(exclude = {SolrAutoConfiguration.class,
        SecurityAutoConfiguration.class,
        ManagementWebSecurityAutoConfiguration.class})
public class OGPApplication {

    public static void main(String[] args) {
        SpringApplication.run(OGPApplication.class, args);
    }
}
