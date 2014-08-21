package org.opengeoportal.proxy.controllers;

import java.io.IOException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.jsoup.nodes.Element;
import org.jsoup.select.Elements;
import org.opengeoportal.config.proxy.ProxyConfigRetriever;
import org.opengeoportal.metadata.LayerInfoRetriever;
import org.opengeoportal.solr.SolrRecord;
import org.opengeoportal.utilities.LocationFieldUtils;
import org.opengeoportal.utilities.OgpUtils;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;

@Controller
@RequestMapping("/featureInfo")
public class GetFeatureInfoController {
	private static final int NUMBER_OF_FEATURES = 20;

	//unfortunately, not every source supports gml response
	private static final String WMS_RESPONSE_FORMAT = "text/html";
	private static final String WMS_EXCEPTION_FORMAT = "application/vnd.ogc.se_xml";
	private static final String WMS_VERSION = "1.1.1";
	private static final String EPSG_CODE = "EPSG:3857";

	
	final Logger logger = LoggerFactory.getLogger(this.getClass());
	
	@Autowired
	private LayerInfoRetriever layerInfoRetriever;
	@Autowired
	private ProxyConfigRetriever proxyConfigRetriever;
	
	@RequestMapping(method=RequestMethod.GET)
	@ResponseBody
	public List<Map<String,String>> getFeatureInfo(@RequestParam("ogpid") String layerId, @RequestParam("bbox") String bbox, 
			@RequestParam("x") String xCoord,@RequestParam("y") String yCoord,
			@RequestParam("width") String width,@RequestParam("height") String height) throws Exception {
	    
	    SolrRecord layerInfo = getSolrRecord(layerId);
	    
	   List<Map<String,String>> featureInfo = getFeatureInformation(layerInfo, xCoord, yCoord, bbox, height, width);
	    
	    //convert featureInfo object to json consumable by backbone (should be a collection); a map?
	    
		return featureInfo;

	}
	
	SolrRecord getSolrRecord(String layerId) throws Exception {
	    Set<String> layerIds = new HashSet<String>();
	    layerIds.add(layerId);
	    
	    List<SolrRecord> allLayerInfo = this.layerInfoRetriever.fetchAllowedRecords(layerIds);
	    
	    if (allLayerInfo.isEmpty()){
	    	throw new Exception("No allowed records returned for Layer Id: ['" + layerId + "'");
	    }
	    
	    SolrRecord layerInfo = allLayerInfo.get(0);
	    return layerInfo;
	}
	
	
	List<Map<String,String>> getFeatureInformation(SolrRecord layerInfo, String xCoord, String yCoord, String bbox, String height, String width) throws Exception {
	    if (LocationFieldUtils.hasWmsUrl(layerInfo.getLocation())){
		    String url = proxyConfigRetriever.getInternalUrl("wms", layerInfo.getInstitution(), layerInfo.getAccess(), layerInfo.getLocation());
		    //filter any query terms
		    url = OgpUtils.filterQueryString(url);
		    
		    String layerName = 	OgpUtils.getLayerNameNS(layerInfo.getWorkspaceName(), layerInfo.getName());
		    Map<String,String> query = createWmsGetFeatureInfoQuery(layerName, xCoord, yCoord, bbox, height, width);
		    return handleWmsGetFeatureInfo(url, query);
	    } else {
	    	//we can add other cases in the future ...WFS, ArcGIS Server feature service, geojson, etc.
	    	throw new Exception("GetFeatureInfo not supported for this layer.");
	    }
	    
	}
	
	
	Map<String,String> createWmsGetFeatureInfoQuery(String layerName, String xCoord, String yCoord, String bbox, String height, String width){
	    //in caps to support ogc services through arcgis server 9.x
		// .data("query", "Java")
		Map<String,String> query = new HashMap<String,String>();
		query.put("SERVICE", "WMS");
		query.put("VERSION", WMS_VERSION);
		query.put("REQUEST", "GetFeatureInfo");
		query.put("INFO_FORMAT", WMS_RESPONSE_FORMAT);
		query.put("SRS", EPSG_CODE);
		query.put("FEATURE_COUNT", Integer.toString(NUMBER_OF_FEATURES));
		query.put("STYLES", "");
		query.put("HEIGHT", height);
		query.put("WIDTH", width);
		query.put("BBOX", bbox);
		query.put("X", xCoord);
		query.put("Y", yCoord);
		query.put("QUERY_LAYERS", layerName);
		query.put("LAYERS", layerName);
		query.put("EXCEPTIONS", WMS_EXCEPTION_FORMAT);
		
	    return query;
	}
	
	List<Map<String,String>> handleWmsGetFeatureInfo(String url, Map<String,String> query) throws IOException{
		Document doc = getWmsHtmlDoc(url, query);
		return processWmsHtmlResponse(doc);
	}
	
	Document getWmsHtmlDoc(String url, Map<String,String> query) throws IOException{
		logger.info("Executing WMS getFeatureRequest to: " + url);
		Document doc = Jsoup.connect(url).data(query).get();
		return doc;
	}
	
	
	List<Map<String,String>> processWmsHtmlResponse(Document doc){
		List<Map<String,String>> responseList = new ArrayList<Map<String,String>>();

		Elements tables = doc.select("table");
		if (tables.size() > 1){
			logger.warn("Multiple tables present in response. Parsing first found.");
		}
		
		Element table = tables.get(0);
		Elements rows = table.select("tr");
		
		Elements headers = rows.select("th");
		
		if (headers.size() < 1){
			//there's a problem
		}
		
		List<String> attributes = new ArrayList<String>();
		for (Element header: headers){
			attributes.add(header.ownText());
		}
				
		for (Element row: rows){
			Elements cells = row.children();
			//create a list of table cell data
			List<String> values = new ArrayList<String>();
			for (Element cell: cells){

				if (cell.tagName().equalsIgnoreCase("td")){
					values.add(cell.ownText());
				}
			}
			
			if (attributes.size() != values.size()){
				logger.warn("Lists are of unequal length.  Skipping this row");
				continue;
			}
			//merge lists
			Map<String,String> info = new LinkedHashMap<String,String>();

		    for (int i=0; i < attributes.size(); i++) {
		    	info.put(attributes.get(i), values.get(i));    // is there a clearer way?
			}
			
			responseList.add(info);
		}
		
		return responseList;
	}	

}
