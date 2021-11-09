package org.opengeoportal.download.methods;

import org.opengeoportal.download.exception.RequestCreationException;
import org.opengeoportal.download.types.LayerRequest;
import org.opengeoportal.download.types.RequestParams.Method;

import java.util.List;
import java.util.Set;

public interface PerLayerDownloadMethodHelper {
    Set<String> getExpectedContentType();

    String createQueryString(LayerRequest layerRequest) throws RequestCreationException;

    List<String> getUrls(LayerRequest layer) throws RequestCreationException;

    Boolean includesMetadata();

    Method getMethod();
}
