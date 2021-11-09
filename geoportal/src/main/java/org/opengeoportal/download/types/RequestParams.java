package org.opengeoportal.download.types;

import java.util.Set;

public class RequestParams {
    public enum Method {
        GET,
        POST
    }
    final String queryParam;
    final Set<String> urls;
    final Method method;

    public RequestParams(Set<String> urls, String queryParam, Method method) {
        this.queryParam = queryParam;
        this.urls = urls;
        this.method = method;
    }

    public String getQueryParam() {
        return queryParam;
    }

    public Set<String> getUrls() {
        return urls;
    }

    public Method getMethod() {
        return method;
    }
}
