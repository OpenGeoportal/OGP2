package org.opengeoportal.download.methods;

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
            GenericDownloader genericDownloader,
            @Qualifier("wmsDownloadMethodHelper") PerLayerDownloadMethodHelper perLayerDownloadMethodHelper){
        return new PerLayerDownloadMethodImpl(genericDownloader, perLayerDownloadMethodHelper);
    }

    @Bean("downloadMethod.kmlReflector")
    @Scope("prototype")
    public PerLayerDownloadMethod kmlDownloadMethod(
            GenericDownloader genericDownloader,
            @Qualifier("kmlDownloadMethodHelper") PerLayerDownloadMethodHelper perLayerDownloadMethodHelper){
        return new PerLayerDownloadMethodImpl(genericDownloader, perLayerDownloadMethodHelper);
    }

    @Bean("downloadMethod.wfs")
    @Scope("prototype")
    public PerLayerDownloadMethod wfsDownloadMethod(
            GenericDownloader genericDownloader,
            @Qualifier("wfsDownloadMethodHelper") PerLayerDownloadMethodHelper perLayerDownloadMethodHelper){
        return new PerLayerDownloadMethodImpl(genericDownloader, perLayerDownloadMethodHelper);
    }

    @Bean("downloadMethod.wfs.proxied")
    @Scope("prototype")
    public PerLayerDownloadMethod proxiedWfsDownloadMethod(
            GenericDownloader genericDownloader,
            @Qualifier("proxiedWfsDownloadMethodHelper") PerLayerDownloadMethodHelper perLayerDownloadMethodHelper){
        return new PerLayerDownloadMethodImpl(genericDownloader, perLayerDownloadMethodHelper);
    }

    @Bean("downloadMethod.wcs")
    @Scope("prototype")
    public PerLayerDownloadMethod wcsDownloadMethod(
            GenericDownloader genericDownloader,
            @Qualifier("wcsDownloadMethodHelper") PerLayerDownloadMethodHelper perLayerDownloadMethodHelper){
        return new PerLayerDownloadMethodImpl(genericDownloader, perLayerDownloadMethodHelper);
    }

    @Bean("downloadMethod.wcs.proxied")
    @Scope("prototype")
    public PerLayerDownloadMethod proxiedWcsDownloadMethod(
            GenericDownloader genericDownloader,
            @Qualifier("proxiedWcsDownloadMethodHelper") PerLayerDownloadMethodHelper perLayerDownloadMethodHelper){
        return new PerLayerDownloadMethodImpl(genericDownloader, perLayerDownloadMethodHelper);
    }

    @Bean("downloadMethod.file")
    @Scope("prototype")
    public PerLayerDownloadMethod fileDownloadMethod(
            GenericDownloader genericDownloader,
            @Qualifier("fileDownloadMethodHelper") PerLayerDownloadMethodHelper perLayerDownloadMethodHelper){
        return new PerLayerDownloadMethodImpl(genericDownloader, perLayerDownloadMethodHelper);
    }

    @Bean("downloadMethod.hgl")
    @Scope("prototype")
    public EmailDownloadMethod hglDownloadMethod(HttpRequester httpRequester){
        return new HGLEmailDownloadMethod(httpRequester);
    }
}
