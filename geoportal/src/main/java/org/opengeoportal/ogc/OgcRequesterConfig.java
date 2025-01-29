package org.opengeoportal.ogc;

import org.opengeoportal.config.proxy.ProxyConfigRetriever;
import org.opengeoportal.http.HttpRequester;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Scope;

@Configuration
public class OgcRequesterConfig {

    @Bean("ogcInfoRequester.wms")
    @Scope("prototype")
    public OgcInfoRequester wmsInfoRequester(HttpRequester httpRequester,
                                             @Qualifier("ogcInfoRequest.wms") OgcInfoRequest ogcInfoRequest,
                                             ProxyConfigRetriever proxyConfigRetriever){
        return new OgcInfoRequesterImpl(httpRequester, ogcInfoRequest, proxyConfigRetriever);
    }

    @Bean("ogcInfoRequester.wfs")
    @Scope("prototype")
    public OgcInfoRequester wfsInfoRequester(HttpRequester httpRequester,
                                             @Qualifier("ogcInfoRequest.wfs") OgcInfoRequest ogcInfoRequest,
                                             ProxyConfigRetriever proxyConfigRetriever){
        return new OgcInfoRequesterImpl(httpRequester, ogcInfoRequest, proxyConfigRetriever);
    }

    @Bean("ogcInfoRequester.wcs_1_0_0")
    @Scope("prototype")
    public OgcInfoRequester wcs1_0_0InfoRequester(HttpRequester httpRequester,
                                             @Qualifier("ogcInfoRequest.wcs_1_0_0") OgcInfoRequest ogcInfoRequest,
                                             ProxyConfigRetriever proxyConfigRetriever){
        return new OgcInfoRequesterImpl(httpRequester, ogcInfoRequest, proxyConfigRetriever);
    }

    @Bean("ogcInfoRequester.wcs_1_1_1")
    @Scope("prototype")
    public OgcInfoRequester wcs1_1_1InfoRequester(HttpRequester httpRequester,
                                                  @Qualifier("ogcInfoRequest.wcs_1_1_1") OgcInfoRequest ogcInfoRequest,
                                                  ProxyConfigRetriever proxyConfigRetriever){
        return new OgcInfoRequesterImpl(httpRequester, ogcInfoRequest, proxyConfigRetriever);
    }

}
