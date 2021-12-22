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

    private final FileDownloader fileDownloader;

    private final PerLayerDownloadMethodHelper perLayerDownloadMethodHelper;

    public PerLayerDownloadMethodImpl(FileDownloader fileDownloader, PerLayerDownloadMethodHelper perLayerDownloadMethodHelper) {
        this.fileDownloader = fileDownloader;
        this.perLayerDownloadMethodHelper = perLayerDownloadMethodHelper;
    }


    public RequestParams createDownloadRequest(LayerRequest layerRequest) throws RequestCreationException {
        try {
            String queryString = perLayerDownloadMethodHelper.createQueryString(layerRequest);
            List<String> urls = perLayerDownloadMethodHelper.getUrls(layerRequest);
            return new RequestParams(new HashSet<>(urls), queryString, perLayerDownloadMethodHelper.getMethod());
        } catch (Exception e) {
            throw new RequestCreationException("Error creating download request");
        }

    }

    public FileDownloader getFileDownloader() {
        return fileDownloader;
    }

    public PerLayerDownloadMethodHelper getPerLayerDownloadMethodHelper() {
        return perLayerDownloadMethodHelper;
    }

    public Future<Set<File>> download(LayerRequest currentLayer) throws Exception {
        currentLayer.setMetadata(perLayerDownloadMethodHelper.includesMetadata());

        RequestParams requestParams = createDownloadRequest(currentLayer);
        String name = currentLayer.getLayerInfo().getName();
        return fileDownloader.download(requestParams, name, perLayerDownloadMethodHelper.getExpectedContentType());
    }

    public Boolean hasRequiredInfo(LayerRequest layerRequest){
        try {
            RequestParams requestParams = createDownloadRequest(layerRequest);
            return true;
        } catch (RequestCreationException e) {
            logger.error("Layer does not have required info for DownloadMethod");
            logger.debug(e.getMessage());
            return false;
        }
    }
}
