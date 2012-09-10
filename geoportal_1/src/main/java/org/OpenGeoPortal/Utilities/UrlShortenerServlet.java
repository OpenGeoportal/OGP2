package org.OpenGeoPortal.Utilities;

import java.io.IOException;

import javax.servlet.ServletException;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.springframework.web.HttpRequestHandler;

public class UrlShortenerServlet implements HttpRequestHandler {
	private UrlShortener urlShortener;

	public void setUrlShortener(UrlShortener urlShortener) {
		this.urlShortener = urlShortener;
	}

	public UrlShortener getUrlShortener() {
		return this.urlShortener;
	}

	@Override
	public void handleRequest(HttpServletRequest request,
			HttpServletResponse response) throws ServletException, IOException {
		// do data validation here
		String longLink = request.getParameter("link");

		// return the shortened link, or the original if there was an error
		String shortLink;
		try {
			shortLink = urlShortener.retrieveShortLink(longLink);
		} catch (Exception e) {
			shortLink = longLink;
		}
		response.setContentType("application/json");

		response.getWriter().write("{\"shortLink\":\"" + shortLink + "\"}");
	}
}
