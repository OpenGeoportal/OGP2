package org.opengeoportal.featureinfo;

import org.apache.commons.lang.StringUtils;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.jsoup.nodes.Element;
import org.jsoup.select.Elements;
import org.opengeoportal.config.proxy.ProxyConfigRetriever;
import org.opengeoportal.utilities.LocationFieldUtils;
import org.opengeoportal.utilities.OgpUtils;
import org.springframework.beans.factory.annotation.Autowired;

import java.io.IOException;
import java.util.*;


/**
 * @author cbarne02
 *         <p>
 *         An implementation of WmsGetFeatureInfo that uses Jsoup to parse
 *         returned HTML. We use HTML, since it is well-supported by various WMS
 *         servers. We convert to an object so the client doesn't need to parse.
 */

public class WfsGetFeature extends AbstractFeatureInfo implements FeatureInfo {

    // unfortunately, not every source supports gml response
    private static final String WMS_RESPONSE_FORMAT = "text/html";
    private static final String WMS_EXCEPTION_FORMAT = "application/vnd.ogc.se_xml";
    private static final String WMS_VERSION = "1.1.1";
    private static final int TIMEOUT = 5000;

    @Autowired
    private ProxyConfigRetriever proxyConfigRetriever;

    @Override
    public boolean hasInfoUrl() {
        return LocationFieldUtils.hasWmsUrl(getSolrRecord().getLocation());
    }

    @Override
    public String getInfoUrl() throws Exception {
        String url = proxyConfigRetriever.getInternalUrl("wms",
                solrRecord.getInstitution(), solrRecord.getAccess(),
                solrRecord.getLocation());
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
                                                          Map<String, String> query) throws IOException {
        Document doc = getWmsHtmlDoc(url, query);
        return processWmsHtmlResponse(doc);
    }

    /**
     * Performs actual http GET to WMS server using jsoup
     *
     * @param url
     * @param query
     * @return jsoup document
     * @throws IOException
     */
    Document getWmsHtmlDoc(String url, Map<String, String> query)
            throws IOException {
        logger.debug("Executing WMS getFeatureRequest to: " + url);
        logger.debug(StringUtils.join(query.keySet(), ","));
        logger.debug(StringUtils.join(query.values(), ","));
        Document doc = Jsoup.connect(url).timeout(TIMEOUT).data(query).get();
        return doc;
    }

    /**
     * uses the Jsoup library to parse the returned html table
     *
     * @param doc soup document
     * @return a list containing maps of feature attribute labels and values
     */
    List<Map<String, String>> processWmsHtmlResponse(Document doc) {
        List<Map<String, String>> responseList = new ArrayList<Map<String, String>>();

        Elements tables = doc.select("table");
        if (tables.isEmpty()) {
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
