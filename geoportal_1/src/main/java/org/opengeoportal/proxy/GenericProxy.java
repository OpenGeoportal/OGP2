package org.opengeoportal.proxy;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

public interface GenericProxy {
    void proxyRequest(HttpServletRequest request, HttpServletResponse response, String remoteUrl);
}
