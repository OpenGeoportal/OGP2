package org.opengeoportal.proxy;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Conditional;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.PropertySource;
import org.springframework.web.servlet.handler.SimpleUrlHandlerMapping;

import java.util.Properties;

/**
 * Created by cbarne02 on 6/5/17.
 * <p>
 * Configuration class for Solr Proxy. Beans are created conditionally. See @SolrProxyConditional
 */

@Configuration
@PropertySource("WEB-INF/ogp.properties")
public class SolrProxyConfig {

    @Value("${solr.proxy.path:/solr}")
    private String pathToServlet;

    @Value("${solr.url.internal}")
    private String internalSolrURL;

    private final static String solrProxyServlet = "solrProxy";

    @Bean(name = solrProxyServlet)
    @Conditional(SolrProxyConditional.class)
    public SolrProxyWrappingController getSolrProxyWrappingController() {
        SolrProxyWrappingController solrProxyWrapper = new SolrProxyWrappingController();
        solrProxyWrapper.setServletClass(org.mitre.dsmiley.httpproxy.ProxyServlet.class);
        solrProxyWrapper.setServletName("solrProxy");

        Properties initParams = new Properties();
        initParams.put("targetUri", internalSolrURL);
        initParams.put("log", true);

        solrProxyWrapper.setInitParameters(initParams);
        return solrProxyWrapper;
    }

    @Bean
    @Conditional(SolrProxyConditional.class)
    public SimpleUrlHandlerMapping solrProxyServletMapping() {
        SimpleUrlHandlerMapping mapping = new SimpleUrlHandlerMapping();
        mapping.setOrder(Integer.MAX_VALUE - 2);

        Properties urlProperties = new Properties();
        urlProperties.put(pathToServlet + "/*", solrProxyServlet);

        mapping.setMappings(urlProperties);

        return mapping;
    }
}
