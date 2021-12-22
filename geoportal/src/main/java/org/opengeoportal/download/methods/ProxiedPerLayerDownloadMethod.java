package org.opengeoportal.download.methods;

import org.opengeoportal.config.exception.ConfigException;
import org.opengeoportal.config.proxy.InternalServerMapping;
import org.opengeoportal.config.proxy.ProxyConfigRetriever;
import org.opengeoportal.download.types.LayerRequest;
import org.opengeoportal.download.types.RequestParams;
import org.opengeoportal.search.OGPRecord;

import java.io.File;
import java.util.Set;
import java.util.concurrent.Future;

public class ProxiedPerLayerDownloadMethod extends PerLayerDownloadMethodImpl implements PerLayerDownloadMethod {

    final ProxyConfigRetriever proxyConfigRetriever;

    public ProxiedPerLayerDownloadMethod(FileDownloader fileDownloader,
                                         PerLayerDownloadMethodHelper perLayerDownloadMethodHelper,
                                         ProxyConfigRetriever proxyConfigRetriever) {
        super(fileDownloader, perLayerDownloadMethodHelper);
        this.proxyConfigRetriever = proxyConfigRetriever;
    }

    public Future<Set<File>> download(LayerRequest currentLayer) throws Exception {
        OGPRecord ogpRecord = currentLayer.getLayerInfo();
        currentLayer.setMetadata(getPerLayerDownloadMethodHelper().includesMetadata());
        RequestParams requestParams = createDownloadRequest(currentLayer);
        String name = currentLayer.getLayerInfo().getName();

        InternalServerMapping sm = null;
        try {
            sm = proxyConfigRetriever.getInternalServerMapping("wms", ogpRecord.getInstitution(), ogpRecord.getAccess());
        } catch (ConfigException e) {
            e.printStackTrace();
        }
        if (proxyConfigRetriever.hasProxy("wms", ogpRecord.getInstitution(), ogpRecord.getAccess()) &&
                proxyConfigRetriever.hasCredentials(sm)){
            return getFileDownloader().download(requestParams, name,
                    getPerLayerDownloadMethodHelper().getExpectedContentType(),
                    sm.getUsername(), sm.getPassword());
        } else {
            return getFileDownloader().download(requestParams, name,
                    getPerLayerDownloadMethodHelper().getExpectedContentType());        }
    }
}
