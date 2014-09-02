package org.opengeoportal.ogc.wms;

import java.io.IOException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

import javax.xml.xpath.XPathExpressionException;

import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.jsoup.nodes.Element;
import org.jsoup.select.Elements;
import org.opengeoportal.config.proxy.ProxyConfigRetriever;
import org.opengeoportal.metadata.FgdcMetadataParser;
import org.opengeoportal.metadata.LayerInfoRetriever;
import org.opengeoportal.solr.SolrRecord;
import org.opengeoportal.utilities.LocationFieldUtils;
import org.opengeoportal.utilities.OgpUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.ui.ModelMap;
import org.xml.sax.SAXException;

/**
 * @author cbarne02
 * 
 *         An implementation of WmsGetFeatureInfo that uses Jsoup to parse
 *         returned HTML. We use HTML, since it is well-supported by various WMS
 *         servers. We convert to an object so the client doesn't need to parse.
 */

public class WmsGetFeatureInfoImpl implements WmsGetFeatureInfo {

	// unfortunately, not every source supports gml response
	private static final String WMS_RESPONSE_FORMAT = "text/html";
	private static final String WMS_EXCEPTION_FORMAT = "application/vnd.ogc.se_xml";
	private static final String WMS_VERSION = "1.1.1";
	private static final String EPSG_CODE = "EPSG:3857";
	private static final int TIMEOUT = 5000;
	private static final String TIMEOUT_MESSAGE = "The remote server is not responding. Please try again later";
	private static final String OPERATION_NOT_SUPPORTED_MESSAGE = "GetFeatureInfo not supported for this layer.";

	final Logger logger = LoggerFactory.getLogger(this.getClass());

	@Autowired
	private LayerInfoRetriever layerInfoRetriever;

	@Autowired
	private ProxyConfigRetriever proxyConfigRetriever;

	@Autowired
	private FgdcMetadataParser fgdcMetadataParser;

	/*
	 * (non-Javadoc)
	 * 
	 * @see
	 * org.opengeoportal.ogc.wms.WmsGetFeatureInfo#getFeatureInformation(java
	 * .lang.String, java.lang.String, java.lang.String, java.lang.String,
	 * java.lang.String, java.lang.String, int)
	 */
	@Override
	public ModelMap getFeatureInformation(String layerId, String xCoord,
			String yCoord, String bbox, String height, String width,
			int maxFeatures) throws Exception {
		ModelMap model = new ModelMap();
		SolrRecord layerInfo = getSolrRecord(layerId);
		model.addAttribute("title", layerInfo.getLayerDisplayName());
		model.addAttribute("layerId", layerInfo.getLayerId());

		if (LocationFieldUtils.hasWmsUrl(layerInfo.getLocation())) {
			String url = proxyConfigRetriever.getInternalUrl("wms",
					layerInfo.getInstitution(), layerInfo.getAccess(),
					layerInfo.getLocation());
			// filter any query terms
			url = OgpUtils.filterQueryString(url);

			String layerName = OgpUtils.getLayerNameNS(
					layerInfo.getWorkspaceName(), layerInfo.getName());
			Map<String, String> query = createWmsGetFeatureInfoQuery(layerName,
					xCoord, yCoord, bbox, height, width, maxFeatures);
			try {
				model.addAttribute("features",
						handleWmsGetFeatureInfo(url, query));
				model.addAttribute("attrDictionary",
						getAttributeMetadata(layerInfo.getFgdcText()));
			} catch (IOException e) {
				model.addAttribute("error", TIMEOUT_MESSAGE);
			}
			return model;
		} else {
			// we can add other cases in the future ...WFS, ArcGIS Server
			// feature service, geojson, etc.
			throw new Exception(OPERATION_NOT_SUPPORTED_MESSAGE);
		}

	}

	/**
	 * Retrieves attribute definitions from XML metadata
	 * 
	 * @param xmlString
	 * @return Map<String,String> map of attribute labels and their definitions,
	 *         if defined in the metadata
	 * @throws XPathExpressionException
	 * @throws SAXException
	 * @throws IOException
	 */
	public Map<String, String> getAttributeMetadata(String xmlString)
			throws XPathExpressionException, SAXException, IOException {
		fgdcMetadataParser.parse(xmlString);
		return fgdcMetadataParser.getAttributeMap();
	}

	/**
	 * Get the Solr record given a layerId, if the user has permission
	 * 
	 * @param layerId
	 * @return SolrRecord the solr record matching the passed layerId
	 * @throws Exception
	 */
	SolrRecord getSolrRecord(String layerId) throws Exception {
		Set<String> layerIds = new HashSet<String>();
		layerIds.add(layerId);

		List<SolrRecord> allLayerInfo = this.layerInfoRetriever
				.fetchAllowedRecords(layerIds);

		if (allLayerInfo.isEmpty()) {
			throw new Exception("No allowed records returned for Layer Id: ['"
					+ layerId + "'");
		}

		SolrRecord layerInfo = allLayerInfo.get(0);
		return layerInfo;
	}

	/**
	 * Converts parameters passed to a map of parameters
	 * 
	 * @param layerName
	 * @param xCoord
	 * @param yCoord
	 * @param bbox
	 * @param height
	 * @param width
	 * @param maxFeatures
	 * @return a map representing the parameters to send to the WMS server
	 */
	Map<String, String> createWmsGetFeatureInfoQuery(String layerName,
			String xCoord, String yCoord, String bbox, String height,
			String width, int maxFeatures) {
		// in caps to support ogc services through arcgis server 9.x
		// .data("query", "Java")
		Map<String, String> query = new HashMap<String, String>();
		query.put("SERVICE", "WMS");
		query.put("VERSION", WMS_VERSION);
		query.put("REQUEST", "GetFeatureInfo");
		query.put("INFO_FORMAT", WMS_RESPONSE_FORMAT);
		query.put("SRS", EPSG_CODE);
		query.put("FEATURE_COUNT", Integer.toString(maxFeatures));
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

	List<Map<String, String>> handleWmsGetFeatureInfo(String url,
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
		Document doc = Jsoup.connect(url).timeout(TIMEOUT).data(query).get();
		return doc;
	}

	/**
	 * uses the Jsoup library to parse the returned html table
	 * 
	 * @param doc
	 *            soup document
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
