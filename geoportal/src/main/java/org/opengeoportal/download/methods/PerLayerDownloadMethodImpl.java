package org.opengeoportal.download.methods;

import org.opengeoportal.download.exception.RequestCreationException;
import org.opengeoportal.download.types.LayerRequest;
import org.opengeoportal.download.types.RequestParams;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.File;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.concurrent.Future;

public class PerLayerDownloadMethodImpl implements PerLayerDownloadMethod {
    final Logger logger = LoggerFactory.getLogger(this.getClass());

    private final GenericDownloader genericDownloader;

    private final PerLayerDownloadMethodHelper perLayerDownloadMethodHelper;

    public PerLayerDownloadMethodImpl(GenericDownloader genericDownloader, PerLayerDownloadMethodHelper perLayerDownloadMethodHelper) {
        this.genericDownloader = genericDownloader;
        this.perLayerDownloadMethodHelper = perLayerDownloadMethodHelper;
    }


    public RequestParams createDownloadRequest(LayerRequest layerRequest) throws RequestCreationException {
        try {
            String queryString = perLayerDownloadMethodHelper.createQueryString(layerRequest);
            List<String> urls = perLayerDownloadMethodHelper.getUrls(layerRequest);
            return new RequestParams(new HashSet<>(urls), queryString, RequestParams.Method.GET);
        } catch (Exception e) {
            throw new RequestCreationException("Error creating download request");
        }

    }

    public Future<Set<File>> download(LayerRequest currentLayer) throws Exception {
        currentLayer.setMetadata(perLayerDownloadMethodHelper.includesMetadata());

        RequestParams requestParams = createDownloadRequest(currentLayer);
        String name = currentLayer.getLayerInfo().getName();
        return genericDownloader.download(requestParams, name, perLayerDownloadMethodHelper.getExpectedContentType());
    }

    public Boolean hasRequiredInfo(LayerRequest layerRequest){
        try {
            RequestParams requestParams = createDownloadRequest(layerRequest);
            return true;
        } catch (RequestCreationException e) {
            e.printStackTrace();
            logger.error("Layer does not have required info for DownloadMethod");
            return false;
        }
    }
}
