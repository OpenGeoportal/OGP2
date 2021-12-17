package org.opengeoportal.featureinfo;

import org.opengeoportal.config.proxy.ProxyConfigRetriever;
import org.opengeoportal.http.HttpRequester;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Scope;

@Configuration
public class FeatureInfoConfig {


    @Bean("wmsFeatureInfo")
    @Scope("prototype")
    FeatureInfo getWMSFeatureInfo(ProxyConfigRetriever proxyConfigRetriever, HttpRequester httpRequester) {
        return new WmsGetFeatureInfo(proxyConfigRetriever, httpRequester);
    }

    @Bean("arcgisFeatureInfo")
    @Scope("prototype")
    FeatureInfo getArcGISFeatureInfo(ProxyConfigRetriever proxyConfigRetriever) {
        return new ArcGISIdentify(proxyConfigRetriever);
    }
}
