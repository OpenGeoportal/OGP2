package org.opengeoportal.proxy;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

public interface GenericProxy {
	public void proxyRequest(HttpServletRequest request, HttpServletResponse response, String remoteUrl);

    void proxyRequest(HttpServletRequest request,
                      HttpServletResponse response, String remoteUrl, String username, String password);
}
