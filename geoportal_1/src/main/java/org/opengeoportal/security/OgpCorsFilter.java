package org.opengeoportal.security;

import org.apache.commons.lang3.StringUtils;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.filter.CorsFilter;

/**
 * Created by cbarne02 on 11/10/16.
 * <p>
 * Spring-based CORS filter. Domain value is injected as a constructor argument from ogp.properties
 * We have to use the filter since Spring Security does not yet support the CORS annotations for
 * controllers. Defaults to http://localhost:8080
 */
public class OgpCorsFilter extends CorsFilter {

    public OgpCorsFilter(String domain) {
        super(configurationSource(domain));

    }

    private static UrlBasedCorsConfigurationSource configurationSource(String domain) {

        CorsConfiguration config = new CorsConfiguration();
        config.setAllowCredentials(true);
        if (StringUtils.isNotEmpty(domain)) {
            config.addAllowedOrigin(domain);
        } else {
            config.addAllowedOrigin("http://localhost:8080");
        }
        config.addAllowedHeader("*");
        config.addAllowedMethod("*");

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }
}