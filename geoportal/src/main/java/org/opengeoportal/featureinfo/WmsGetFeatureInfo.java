package org.opengeoportal.featureinfo;

import org.apache.commons.lang3.StringUtils;

import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.jsoup.nodes.Element;
import org.jsoup.select.Elements;
import org.opengeoportal.config.exception.ConfigException;
import org.opengeoportal.config.proxy.InternalServerMapping;
import org.opengeoportal.config.proxy.ProxyConfigRetriever;
import org.opengeoportal.featureinfo.exception.FeatureInfoException;
import org.opengeoportal.http.HttpRequester;
import org.opengeoportal.utilities.LocationFieldUtils;
import org.opengeoportal.utilities.OgpUtils;

import java.io.IOException;
import java.io.InputStream;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.*;


/**
 * @author cbarne02
 *         <p>
 *         An implementation of WmsGetFeatureInfo that uses Jsoup to parse
 *         returned HTML. We use HTML, since it is well-supported by various WMS
 *         servers. We convert to an object so the client doesn't need to parse.
 */

public class WmsGetFeatureInfo extends AbstractFeatureInfo implements FeatureInfo {

    // unfortunately, not every source supports gml response
    private static final String WMS_RESPONSE_FORMAT = "text/html";
    private static final String WMS_EXCEPTION_FORMAT = "application/vnd.ogc.se_xml";
    private static final String WMS_VERSION = "1.1.1";
    private static final int TIMEOUT = 5000;

    private final ProxyConfigRetriever proxyConfigRetriever;

    private final HttpRequester httpRequester;

    public WmsGetFeatureInfo(ProxyConfigRetriever proxyConfigRetriever, HttpRequester httpRequester) {
        this.proxyConfigRetriever = proxyConfigRetriever;
        this.httpRequester = httpRequester;
    }

    @Override
    public boolean hasInfoUrl() {
        return LocationFieldUtils.hasWmsUrl(getOGPRecord().getLocation());
    }

    @Override
    public String getInfoUrl() throws Exception, ConfigException {
        String url = proxyConfigRetriever.getInternalUrl("wms",
                ogpRecord.getInstitution(), ogpRecord.getAccess(),
                ogpRecord.getLocation());

        // filter any query terms
        url = OgpUtils.filterQueryString(url);
        return url;
    }


    /**
     * Converts parameters passed to a map of parameters
     *
     * @param layerName
     * @param coord
     * @param bbox
     * @param srs
     * @param pixel
     * @param size
     * @param maxFeatures
     * @return a map representing the parameters to send to the WMS server
     */
    protected Map<String, String> createFeatureInfoQuery(String layerName,
                                                         Double[] coord, Double[] bbox, String srs,
                                                         Integer[] pixel, Integer[] size, int maxFeatures) {
        // in caps to support ogc services through arcgis server 9.x
        // .data("query", "Java")
        Map<String, String> query = new HashMap<String, String>();
        query.put("SERVICE", "WMS");
        query.put("VERSION", WMS_VERSION);
        query.put("REQUEST", "GetFeatureInfo");
        query.put("INFO_FORMAT", WMS_RESPONSE_FORMAT);
        query.put("SRS", srs);
        query.put("FEATURE_COUNT", Integer.toString(maxFeatures));
        query.put("STYLES", "");
        query.put("HEIGHT", Integer.toString(size[1]));
        query.put("WIDTH", Integer.toString(size[0]));
        query.put("BBOX", StringUtils.join(bbox, ","));
        query.put("X", Integer.toString(pixel[0]));
        query.put("Y", Integer.toString(pixel[1]));
        query.put("QUERY_LAYERS", layerName);
        query.put("LAYERS", layerName);
        query.put("EXCEPTIONS", WMS_EXCEPTION_FORMAT);

        return query;
    }

    protected List<Map<String, String>> handleFeatureInfo(String url,
                                                          Map<String, String> query) throws FeatureInfoException, IOException {
        InputStream response = getWmsHtml(url, query);

        return processWmsHtmlResponse(response);

    }

    /**
     * Performs actual http GET to WMS server
     *
     * @param url
     * @param query
     * @return response InputStream
     * @throws IOException
     */
    InputStream getWmsHtml(String url, Map<String, String> query)
            throws IOException, FeatureInfoException {

        String queryString = query.entrySet().stream()
                .map(p -> URLEncoder.encode((p.getKey()), StandardCharsets.UTF_8)+ "=" + URLEncoder.encode(p.getValue(), StandardCharsets.UTF_8))
                .reduce((p1, p2) -> p1 + "&" + p2)
                .orElse("");

        InternalServerMapping sm = null;
        try {
            sm = proxyConfigRetriever.getInternalServerMapping("wms", ogpRecord.getInstitution(), ogpRecord.getAccess());
        } catch (ConfigException e) {
            logger.warn(e.getMessage());
        }
        InputStream response;
        if (proxyConfigRetriever.hasProxy("wms", ogpRecord.getInstitution(), ogpRecord.getAccess()) &&
                proxyConfigRetriever.hasCredentials(sm)){
            response =  httpRequester.sendRequest(url, queryString, "GET", "text/xml", sm.getUsername(), sm.getPassword());
        } else {
            response = httpRequester.sendRequest(url, queryString, "GET", "text/xml");
        }
        String returnedContentType = httpRequester.getContentType();
        logger.debug("returned content type: " + returnedContentType);
        if (!returnedContentType.toLowerCase().contains("html")) {
            throw new FeatureInfoException("Unable to parse response");
        }

        return response;
    }

    /**
     * parse the returned html table
     *
     * @param inputStream inputStream response
     * @return a list containing maps of feature attribute labels and values
     */
    List<Map<String, String>> processWmsHtmlResponse(InputStream inputStream) throws IOException {
        List<Map<String, String>> responseList = new ArrayList<Map<String, String>>();

        String htmlText = new String(inputStream.readAllBytes(), StandardCharsets.UTF_8);
        //logger.debug(htmlText);

        Document doc = Jsoup.parse(htmlText);

        Elements tables = doc.select("table");
        if (tables.isEmpty()) {
            logger.warn("no table found");
            return responseList;
        }

        if (tables.size() > 1) {
            logger.warn("Multiple tables present in response. Parsing first found.");
        }

        Element table = tables.get(0);
        Elements rows = table.select("tr");

        Elements headers = rows.select("th");

        List<String> attributes = new ArrayList<String>();
        for (Element header : headers) {
            attributes.add(header.ownText());
        }

        for (Element row : rows) {
            Elements cells = row.children();
            // create a list of table cell data
            List<String> values = new ArrayList<String>();
            for (Element cell : cells) {

                if (cell.tagName().equalsIgnoreCase("td")) {
                    values.add(cell.ownText());
                }
            }

            if (attributes.size() != values.size()) {
                continue;
            }
            // merge lists
            Map<String, String> info = new LinkedHashMap<String, String>();

            for (int i = 0; i < attributes.size(); i++) {
                info.put(attributes.get(i), values.get(i));
            }

            responseList.add(info);
        }

        return responseList;
    }

}
