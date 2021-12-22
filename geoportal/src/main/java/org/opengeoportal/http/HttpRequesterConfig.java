package org.opengeoportal.http;

import org.opengeoportal.http.httpclient.HttpClientHelper;
import org.opengeoportal.http.httpclient.HttpClientHttpRequester;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Scope;

@Configuration
public class HttpRequesterConfig {

    @Bean("httpRequester")
    @Scope("prototype")
    HttpRequester httpRequester(HttpClientHelper httpClientHelper){
        return new HttpClientHttpRequester(httpClientHelper);
    }
}
