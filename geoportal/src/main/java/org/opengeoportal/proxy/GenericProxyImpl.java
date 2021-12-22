package org.opengeoportal.proxy;

import java.io.IOException;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.apache.commons.io.IOUtils;
import org.opengeoportal.http.HttpRequester;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Scope;
import org.springframework.stereotype.Component;

@Component
@Scope("prototype")
public class GenericProxyImpl implements GenericProxy {
	final Logger logger = LoggerFactory.getLogger(this.getClass());
	
	protected final HttpRequester httpRequester;

	@Autowired
	public GenericProxyImpl(HttpRequester httpRequester) {
		this.httpRequester = httpRequester;
	}


	@Override
	public void proxyRequest(HttpServletRequest request,
			HttpServletResponse response, String remoteUrl){

			try {
				IOUtils.copy(httpRequester.sendRequest(remoteUrl, "", "GET", "*/*"), response.getOutputStream());
			} catch (IOException e) {
				logger.error(e.getLocalizedMessage());
				
			}
	}

	@Override
	public void proxyRequest(HttpServletRequest request,
							 HttpServletResponse response, String remoteUrl, String username, String password){

		try {
			IOUtils.copy(httpRequester.sendRequest(remoteUrl,
					"",
					"GET",
					"*/*",
					username, password), response.getOutputStream());
		} catch (IOException e) {
			logger.error(e.getLocalizedMessage());

		}
	}

	
}
