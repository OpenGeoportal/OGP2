package org.opengeoportal.download.methods;

import org.opengeoportal.config.proxy.ProxyConfigRetriever;
import org.opengeoportal.http.HttpRequester;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Scope;

@Configuration
public class DownloadMethodConfig {

    @Bean("downloadMethod.wms")
    @Scope("prototype")
    public PerLayerDownloadMethod wmsDownloadMethod(
            FileDownloader fileDownloader,
            @Qualifier("wmsDownloadMethodHelper") PerLayerDownloadMethodHelper perLayerDownloadMethodHelper){
        return new PerLayerDownloadMethodImpl(fileDownloader, perLayerDownloadMethodHelper);
    }

    @Bean("downloadMethod.kmlReflector")
    @Scope("prototype")
    public PerLayerDownloadMethod kmlDownloadMethod(
            FileDownloader fileDownloader,
            @Qualifier("kmlDownloadMethodHelper") PerLayerDownloadMethodHelper perLayerDownloadMethodHelper){
        return new PerLayerDownloadMethodImpl(fileDownloader, perLayerDownloadMethodHelper);
    }

    @Bean("downloadMethod.wfs")
    @Scope("prototype")
    public PerLayerDownloadMethod wfsDownloadMethod(
            FileDownloader fileDownloader,
            @Qualifier("wfsDownloadMethodHelper") PerLayerDownloadMethodHelper perLayerDownloadMethodHelper){
        return new PerLayerDownloadMethodImpl(fileDownloader, perLayerDownloadMethodHelper);
    }

    @Bean("downloadMethod.wfs.proxied")
    @Scope("prototype")
    public PerLayerDownloadMethod proxiedWfsDownloadMethod(
            FileDownloader fileDownloader,
            @Qualifier("proxiedWfsDownloadMethodHelper") PerLayerDownloadMethodHelper perLayerDownloadMethodHelper,
            ProxyConfigRetriever proxyConfigRetriever){
        return new ProxiedPerLayerDownloadMethod(fileDownloader, perLayerDownloadMethodHelper, proxyConfigRetriever);
    }

    @Bean("downloadMethod.wcs")
    @Scope("prototype")
    public PerLayerDownloadMethod wcsDownloadMethod(
            FileDownloader fileDownloader,
            @Qualifier("wcsDownloadMethodHelper") PerLayerDownloadMethodHelper perLayerDownloadMethodHelper){
        return new PerLayerDownloadMethodImpl(fileDownloader, perLayerDownloadMethodHelper);
    }

    @Bean("downloadMethod.wcs.proxied")
    @Scope("prototype")
    public PerLayerDownloadMethod proxiedWcsDownloadMethod(
            FileDownloader fileDownloader,
            @Qualifier("proxiedWcsDownloadMethodHelper") PerLayerDownloadMethodHelper perLayerDownloadMethodHelper,
            ProxyConfigRetriever proxyConfigRetriever){
        return new ProxiedPerLayerDownloadMethod(fileDownloader, perLayerDownloadMethodHelper, proxyConfigRetriever);
    }

    @Bean("downloadMethod.file")
    @Scope("prototype")
    public PerLayerDownloadMethod fileDownloadMethod(
            FileDownloader fileDownloader,
            @Qualifier("fileDownloadMethodHelper") PerLayerDownloadMethodHelper perLayerDownloadMethodHelper){
        return new PerLayerDownloadMethodImpl(fileDownloader, perLayerDownloadMethodHelper);
    }

    @Bean("downloadMethod.hgl")
    @Scope("prototype")
    public EmailDownloadMethod hglDownloadMethod(HttpRequester httpRequester){
        return new HGLEmailDownloadMethod(httpRequester);
    }
}
