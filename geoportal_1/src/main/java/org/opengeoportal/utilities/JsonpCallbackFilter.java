package org.opengeoportal.utilities;

import java.io.IOException;

import javax.servlet.Filter;
import javax.servlet.FilterChain;
import javax.servlet.FilterConfig;
import javax.servlet.ServletException;
import javax.servlet.ServletRequest;
import javax.servlet.ServletResponse;

import java.io.OutputStream;
import java.util.Map;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;


/**
 * a filter that wraps jsonp responses with callback specified in the parameters
 * 
 * 
 * @author cbarne02
 *
 */
public class JsonpCallbackFilter implements Filter {

	final Logger logger = LoggerFactory.getLogger(this.getClass());

		@Override
		public void init(FilterConfig fConfig) throws ServletException {}

		@Override
		public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain) throws IOException, ServletException {
			HttpServletRequest httpRequest = (HttpServletRequest) request;
			HttpServletResponse httpResponse = (HttpServletResponse) response;

			@SuppressWarnings("unchecked")
			Map<String, String[]> parms = httpRequest.getParameterMap();
			if(parms.containsKey("callback")) {
				
				logger.info("Wrapping response with JSONP callback '" + parms.get("callback")[0] + "'");

				OutputStream out = httpResponse.getOutputStream();

				GenericResponseWrapper wrapper = new GenericResponseWrapper(httpResponse);

				chain.doFilter(request, wrapper);

				out.write(new String(parms.get("callback")[0] + "(").getBytes());
				out.write(wrapper.getData());
				out.write(new String(");").getBytes());

				wrapper.setContentType("text/javascript;charset=UTF-8");

				out.close();
			} else {
				chain.doFilter(request, response);
			}
		}

		@Override
		public void destroy() {}
	}

