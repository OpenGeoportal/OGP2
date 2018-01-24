package org.opengeoportal.proxy.solr;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Condition;
import org.springframework.context.annotation.ConditionContext;
import org.springframework.core.type.AnnotatedTypeMetadata;

/**
 * Created by cbarne02 on 6/5/17.
 * <p>
 * Simple Conditional to determine whether the SolrProxy is enabled based on value in ogp.properties. defaults to false
 * if the property is missing.
 */
public class SolrProxyConditional implements Condition {

    final Logger logger = LoggerFactory.getLogger(SolrProxyConditional.class);

    @Override
    public boolean matches(ConditionContext context,
                           AnnotatedTypeMetadata metadata) {
        String proxyEnabledString = context.getEnvironment().getProperty("solr.proxy.enabled", "false");
        Boolean proxyEnabled = Boolean.valueOf(proxyEnabledString);
        logger.debug("Solr Proxy enabled?: " + Boolean.toString(proxyEnabled));
        return proxyEnabled;
    }

}