package org.opengeoportal.proxy;

import java.io.InputStream;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

public interface GenericProxy {
	public void proxyRequest(HttpServletRequest request, HttpServletResponse response, String remoteUrl);
	public InputStream getContentStream(HttpServletRequest request, HttpServletResponse response, String remoteUrl);
}
