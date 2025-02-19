package org.opengeoportal.featureinfo;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import org.apache.commons.lang3.StringUtils;
import org.opengeoportal.config.exception.ConfigException;
import org.opengeoportal.config.proxy.ProxyConfigRetriever;
import org.opengeoportal.featureinfo.exception.FeatureInfoException;
import org.opengeoportal.utilities.LocationFieldUtils;
import org.opengeoportal.utilities.OgpUtils;
import org.springframework.http.ResponseEntity;
import org.springframework.http.client.HttpComponentsClientHttpRequestFactory;
import org.springframework.web.client.RestTemplate;

import java.io.IOException;
import java.util.*;


public class ArcGISIdentify extends AbstractFeatureInfo implements FeatureInfo {

    private final ProxyConfigRetriever proxyConfigRetriever;

    RestTemplate restTemplate = new RestTemplate(new HttpComponentsClientHttpRequestFactory());

    public ArcGISIdentify(ProxyConfigRetriever proxyConfigRetriever) {
        this.proxyConfigRetriever = proxyConfigRetriever;
    }

    //imageDisplay: Syntax: <width>, <height>, <dpi>

    //f json

    //geometryType=esriGeometryPoint&geometry=<x>,<y>
    //http://sampleserver1.arcgisonline.com/ArcGIS/rest/services/Specialty/ESRI_StateCityHighway_USA/MapServer/
    //identify?geometryType=esriGeometryPoint&geometry=-120,40&tolerance=10&mapExtent=-119,38,-121,41&imageDisplay=400,300,96

    /**
     * Converts parameters passed to a map of parameters used by the RestTemplate
     *
     * @param layerName
     * @param coord
     * @param bbox
     * @param srs
     * @param pixel
     * @param size
     * @param maxFeatures
     * @return {{Map<String,String>}}a map representing the parameters to send to the WMS server
     */
    protected Map<String, String> createFeatureInfoQuery(String layerName,
                                                         Double[] coord,
                                                         Double[] bbox, String srs, Integer[] pixel,
                                                         Integer[] size,
                                                         int maxFeatures) {

        Map<String, String> query = new HashMap<String, String>();
        query.put("geometryType", "esriGeometryPoint");
        query.put("geometry", StringUtils.join(coord, ","));
        query.put("f", "json");
        query.put("tolerance", "2");
        if (srs.toLowerCase().contains("epsg")) {
            srs = srs.substring(5);
        }
        query.put("sr", srs);
        query.put("imageDisplay", StringUtils.join(size, ",") + ",72");
        query.put("mapExtent", StringUtils.join(bbox, ","));
        query.put("returnGeometry", "false");
        String layerFilter = "";
        if (StringUtils.isNumeric(layerName.substring(0, 1))) {
            layerFilter = ":" + layerName;
        }
        query.put("layers", "all" + layerFilter);

        return query;
    }


    @Override
    public boolean hasInfoUrl() {
        return LocationFieldUtils.hasArcGISRestUrl(getOGPRecord().getLocation());

    }


    @Override
    public String getInfoUrl() throws Exception, ConfigException {
        String url = proxyConfigRetriever.getInternalUrl("ArcGISRest",
                ogpRecord.getInstitution(), ogpRecord.getAccess(),
                ogpRecord.getLocation());
        // filter any query terms
        url = OgpUtils.filterQueryString(url);
        if (url.endsWith("/")) {
            url = url.substring(0, url.length());
        }

        //look for "MapServer" path
        int i = url.toLowerCase().indexOf("mapserver");
        if (i > -1) {
            url = url.substring(0, i - 1);
        }

        url += "/MapServer/identify";

        return url;
    }


    @Override
    protected List<Map<String, String>> handleFeatureInfo(String url,
                                                          Map<String, String> query) throws FeatureInfoException, IOException {
        JsonNode jn = sendIdentifyRequest(url, query);
        return processIdentifyResponse(jn);
    }

    private JsonNode sendIdentifyRequest(String url, Map<String, String> query) throws IOException {
        String queryString = getQueryString(query);
        String fullUrl = url + "?" + queryString;
        logger.debug("sending identify request to: " + fullUrl);


        ResponseEntity<String> stringResponse = restTemplate.getForEntity(fullUrl, String.class);
        String valueResults = stringResponse.getBody();
        logger.debug(valueResults);
        JsonNode node = new ObjectMapper().readTree(valueResults);
        return node;
    }

    private String getQueryString(Map<String, String> query) {
        List<String> paramList = new ArrayList<String>();
        for (String param : query.keySet()) {
            paramList.add(param + "=" + query.get(param));
        }
        String queryString = StringUtils.join(paramList, "&");
        return queryString;
    }

    //return syntax
    //{"results" : [ { "layerId" : <layerId1>, "layerName" : "<layerName1>",
    //"value" : "<value1>",  "displayFieldName" : "<displayFieldName1>",
    //"attributes" : {  "<fieldName11>" : <fieldValue11>,  "<fieldName12>" : <fieldValue12> },
    //"geometryType" : "<geometryType1>","hasZ" : <true|false>, //added in 10.1"hasM" : <true|false>,
    //added in 10.1"geometry" : {<geometry1>} },
    //{ "layerId" : <layerId2>, "layerName" : "<layerName2>", "value" : "<value2>",  "displayFieldName" : "<displayFieldName1>", "attributes" : {  "<fieldName21>" : <fieldValue21>,  "<fieldName22>" : <fieldValue22> }, "geometryType" : "<geometryType2>","hasZ" : <true|false>, //added in 10.1"hasM" : <true|false>, //added in 10.1 "geometry" : {<geometry2>} }]}
//{"results":[{"layerId":0,"layerName":"Canal Routes - Historic","displayFieldName":"CANAL_NAME","value":"Wabash-Erie","attributes":{"OBJECTID":"6","Name of Canal":"Wabash-Erie","Description of Canal Sub-sections":"","Shape":"Polyline","Length (meters)":"124360.692491"}}]}
    List<Map<String, String>> processIdentifyResponse(JsonNode jn) throws FeatureInfoException {
        JsonNode results = jn.at("/results");
        if (results.isArray()) {
            List<Map<String, String>> allAttrs = new ArrayList<Map<String, String>>();
            ArrayNode arrResults = (ArrayNode) results;
            Iterator<JsonNode> iter = arrResults.elements();

            while (iter.hasNext()) {
                JsonNode current = iter.next();
                JsonNode attrs = current.get("attributes");
                Map<String, String> attrMap = new LinkedHashMap<String, String>();
                allAttrs.add(attrMap);
                Iterator<String> iterAttr = attrs.fieldNames(); //iterate over elements, place them in Map<String,String>
                while (iterAttr.hasNext()) {
                    String currAttr = iterAttr.next();
                    attrMap.put(currAttr, attrs.get(currAttr).asText());
                }
            }
            return allAttrs;

        } else {
            throw new FeatureInfoException("Unexpected response");
        }

    }
}
