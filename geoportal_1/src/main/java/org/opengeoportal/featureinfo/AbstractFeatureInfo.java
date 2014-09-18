package org.opengeoportal.featureinfo;

import java.io.IOException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import javax.xml.xpath.XPathExpressionException;

import org.opengeoportal.metadata.FgdcMetadataParser;
import org.opengeoportal.solr.SolrRecord;
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

public abstract class AbstractFeatureInfo {

	protected static final String TIMEOUT_MESSAGE = "The remote server is not responding. Please try again later";
	protected static final String OPERATION_NOT_SUPPORTED_MESSAGE = "GetFeatureInfo not supported for this layer.";

	@Autowired
	protected FgdcMetadataParser fgdcMetadataParser;
	
	protected SolrRecord solrRecord;
	
	protected final Logger logger = LoggerFactory.getLogger(this.getClass());

	public SolrRecord getSolrRecord() {
		if (solrRecord == null){
			logger.warn("Must set SolrRecord first!");
		}
		return solrRecord;
	}

	public void setSolrRecord(SolrRecord solrRecord) {
		this.solrRecord = solrRecord;
	}

	/*
	 * (non-Javadoc)
	 * 
	 * @see
	 * org.opengeoportal.ogc.wms.WmsGetFeatureInfo#getFeatureInformation(java
	 * .lang.String, java.lang.String, java.lang.String, java.lang.String,
	 * java.lang.String, java.lang.String, int)
	 */
	public ModelMap getFeatureInformation(Double[] coord,
			Double[] bbox, String srs, Integer[] pixel,
			Integer[] size,
			int maxFeatures) throws Exception {
		SolrRecord solrRecord = getSolrRecord();
		ModelMap model = new ModelMap();
		model.addAttribute("title", solrRecord.getLayerDisplayName());
		model.addAttribute("layerId", solrRecord.getLayerId());
		
		if (hasInfoUrl()) {
			String url = getInfoUrl();

			String layerName = OgpUtils.getLayerNameNS(
					solrRecord.getWorkspaceName(), solrRecord.getName());
			Map<String, String> query = createFeatureInfoQuery(layerName,
					coord, bbox, srs, pixel, size, maxFeatures);
			List<Map<String,String>> featureMap = new ArrayList<Map<String,String>>();
			Map<String,String> attributeMap = new HashMap<String,String>();
			try {
				 featureMap = handleFeatureInfo(url, query);
			} catch (IOException e) {
				model.addAttribute("error", TIMEOUT_MESSAGE);
			}
			
			try {
				String metadata = solrRecord.getFgdcText();
				if (!metadata.isEmpty()){
					attributeMap = getAttributeMetadata(metadata);
				}
			} catch (Exception e){
				model.addAttribute("metadata_error", "Error parsing metadata");
			}
			model.addAttribute("features", featureMap);
			model.addAttribute("attrDictionary", attributeMap);
			
			return model;
		} else {

			throw new Exception(OPERATION_NOT_SUPPORTED_MESSAGE);
		}

	}
	
	protected abstract boolean hasInfoUrl();
	
	protected abstract String getInfoUrl() throws Exception;
	
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
	 * 	 Converts parameters passed to a map of parameters
	 * 
	 * @param layerName
	 * @param coord
	 * @param bbox
	 * @param srs
	 * @param pixel
	 * @param size
	 * @param maxFeatures
	 * @return a Map representing the parameters to send 
	 */
	protected abstract Map<String, String> createFeatureInfoQuery(String layerName,
			Double[] coord,
			Double[] bbox, String srs, Integer[] pixel,
			Integer[] size,
			int maxFeatures);
	
	protected abstract List<Map<String, String>> handleFeatureInfo(String url,
			Map<String, String> query) throws IOException, Exception;



}
