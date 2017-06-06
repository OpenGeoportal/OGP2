package org.opengeoportal.proxy;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.servlet.ModelAndView;
import org.springframework.web.servlet.mvc.ServletWrappingController;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletRequestWrapper;
import javax.servlet.http.HttpServletResponse;

/**
 * Created by cbarne02 on 6/2/17.
 * Extends the Spring ServletWrappingController to properly handle paths for solr proxy.
 */
public class SolrProxyWrappingController extends ServletWrappingController {
    final Logger logger = LoggerFactory.getLogger(SolrProxyWrappingController.class);

    @Value("${solr.proxy.path:/solr}")
    private String pathToServlet;

    /**
     * Overrides and extends the basic Spring ServletWrappingController. The default version passes the wrong path to
     * the proxy servlet that is being wrapped.
     *
     * @param request  HttpServletRequest
     * @param response HttpServletResponse
     * @return ModelAndView
     * @throws Exception generic Exception
     */
    @Override
    protected ModelAndView handleRequestInternal(HttpServletRequest request, HttpServletResponse response) throws Exception {
        final String servletPathFinal = request.getServletPath();

        final HttpServletRequest wrapper = new HttpServletRequestWrapper(request) {
            @Override
            public String getPathInfo() {
                String path = servletPathFinal;

                if (path.startsWith(pathToServlet)) {
                    final int length = pathToServlet.length();
                    path = path.substring(length);
                }
                logger.debug(path);
                return path;
            }
        };

        return super.handleRequestInternal(wrapper, response);
    }
}