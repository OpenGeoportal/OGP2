package org.opengeoportal.download;

import org.opengeoportal.download.methods.EmailDownloadMethod;
import org.opengeoportal.download.methods.PerLayerDownloadMethod;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Scope;

@Configuration
public class LayerDownloaderConfig {

    @Bean("layerDownloader.wms")
    @Scope("prototype")
    public PerLayerDownloader wmsLayerDownloader(
            @Qualifier("downloadMethod.wms") PerLayerDownloadMethod perLayerDownloadMethod,
            DownloadPackager downloadPackager){
        return new PerLayerDownloader(perLayerDownloadMethod, downloadPackager);
    }

    @Bean("layerDownloader.kml.reflector")
    @Scope("prototype")
    public PerLayerDownloader kmlLayerDownloader(
            @Qualifier("downloadMethod.kmlReflector") PerLayerDownloadMethod perLayerDownloadMethod,
            DownloadPackager downloadPackager){
        return new PerLayerDownloader(perLayerDownloadMethod, downloadPackager);
    }

    @Bean("layerDownloader.wfs")
    @Scope("prototype")
    public PerLayerDownloader wfsLayerDownloader(
            @Qualifier("downloadMethod.wfs") PerLayerDownloadMethod perLayerDownloadMethod,
            DownloadPackager downloadPackager){
        return new PerLayerDownloader(perLayerDownloadMethod, downloadPackager);
    }

    @Bean("layerDownloader.wfs.proxied")
    @Scope("prototype")
    public PerLayerDownloader proxiedWfsLayerDownloader(
            @Qualifier("downloadMethod.wfs.proxied") PerLayerDownloadMethod perLayerDownloadMethod,
            DownloadPackager downloadPackager){
        return new PerLayerDownloader(perLayerDownloadMethod, downloadPackager);
    }

    @Bean("layerDownloader.wcs")
    @Scope("prototype")
    public PerLayerDownloader wcsLayerDownloader(
            @Qualifier("downloadMethod.wcs") PerLayerDownloadMethod perLayerDownloadMethod,
            DownloadPackager downloadPackager){
        return new PerLayerDownloader(perLayerDownloadMethod, downloadPackager);
    }

    @Bean("layerDownloader.wcs.proxied")
    @Scope("prototype")
    public PerLayerDownloader proxiedWcsLayerDownloader(
            @Qualifier("downloadMethod.wcs.proxied") PerLayerDownloadMethod perLayerDownloadMethod,
            DownloadPackager downloadPackager){
        return new PerLayerDownloader(perLayerDownloadMethod, downloadPackager);
    }

    @Bean("layerDownloader.file")
    @Scope("prototype")
    public PerLayerDownloader fileLayerDownloader(
            @Qualifier("downloadMethod.file") PerLayerDownloadMethod perLayerDownloadMethod,
            DownloadPackager downloadPackager){
        return new PerLayerDownloader(perLayerDownloadMethod, downloadPackager);
    }

    @Bean("layerDownloader.email.HGL")
    @Scope("prototype")
    public EmailLayerDownloader hglEmailLayerDownloader(
            @Qualifier("downloadMethod.hgl") EmailDownloadMethod emailDownloadMethod){
        return new EmailLayerDownloader(emailDownloadMethod);
    }
}
