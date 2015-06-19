package org.opengeoportal.download;

import java.util.Iterator;
import java.util.SortedMap;
import java.util.TreeMap;


import org.opengeoportal.download.config.DownloadConfigRetriever;
import org.opengeoportal.download.types.LayerRequest;
import org.opengeoportal.solr.SolrRecord;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.BeansException;
import org.springframework.beans.factory.BeanFactory;
import org.springframework.beans.factory.BeanFactoryAware;
import org.springframework.beans.factory.annotation.Autowired;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.node.ArrayNode;

/**
 * This class provides a concrete implementation of a download method for a layer based on DataType, Access level,
 * requested format, Institution (if specified in ogpDownloadConfig.json), and preference. If the data requirements for
 * the first preference are not met, the next registered method is attempted, and so on.
 */
public class LayerDownloaderProvider implements BeanFactoryAware {
	private BeanFactory beanFactory;
	final Logger logger = LoggerFactory.getLogger(this.getClass());
	final static Logger slogger = LoggerFactory.getLogger(LayerDownloaderProvider.class.getName());
	
	@Autowired
	private DownloadConfigRetriever downloadConfigRetriever;
		

	public LayerDownloader build(LayerRequest layer) throws Exception{
		String classKey = getClassKey(layer);
		return getLayerDownloader(classKey);
	}  
	
	public LayerDownloader build(String classKey) throws Exception{
		return getLayerDownloader(classKey);
	}

	public Boolean isDownloadable(LayerRequest layer) {
		Boolean downloadable = false;
		
		try {
			this.getClassKey(layer);
			downloadable = true;
		} catch (Exception e){
			logger.warn(e.getMessage());
		}
		return downloadable;
	}
	
	public String getClassKey(LayerRequest layer) throws Exception {
		JsonNode institutions = downloadConfigRetriever.getDownloadConfig().path("institutions");
		
		SolrRecord record = layer.getLayerInfo();
		JsonNode methods = institutions.path(record.getInstitution().trim().toLowerCase());
		if (!methods.isArray()){
			try{
				return this.getDefaultDownloadKey(institutions, layer);
			} catch (Exception e){
				logger.error("Class Key not defined for this layer.");
				throw new Exception("Class Key not defined for this layer.");
			}
		}

		ArrayNode methodArray = (ArrayNode) methods;
		Iterator<JsonNode> institutionIterator = methodArray.elements();
		String classKey = null;
		while (institutionIterator.hasNext()){
			JsonNode currentNode = institutionIterator.next();
			Boolean match = matchAllCriteria(currentNode, layer);
			
			//If the match is complete, don't look any further
			if (match){
				classKey = currentNode.path("classKey").textValue();
				logger.debug("match");
				break;
			} 
		}

		if (classKey == null){
			logger.debug("class key is null. should mean no match");
			//no match was found in download config, so we're trying defaults
			try{
				return this.getDefaultDownloadKey(institutions, layer);
			} catch (Exception e){
				logger.error("Class Key not defined for this layer.");
				throw new Exception("Class Key not defined for this layer.");
			}
		} else {
			logger.debug("should get here on match");
			//make sure the layer has the requirements for the match
			if (hasRequirements(classKey, layer)){
				return classKey;
			} else {
				try{
					return this.getDefaultDownloadKey(institutions, layer);
				} catch (Exception e){
					logger.error("Class Key not defined for this layer.");
					throw new Exception("Class Key not defined for this layer.");
				}
			}
		}

	}

	private Boolean matchAllCriteria(JsonNode currentNode, LayerRequest layer){
		SolrRecord record = layer.getLayerInfo();
		logger.debug(record.getAccess().toLowerCase());
		logger.debug(record.getDataType().toLowerCase());
		logger.debug(layer.getRequestedFormat().toLowerCase());
		
		logger.debug("trying access matches...");
		Boolean accessMatch = matchNode(currentNode, "accessLevel", record.getAccess().toLowerCase());
		if (!accessMatch){
			return false;
		}
		logger.debug("access match");


		Boolean dataTypeMatch = matchNode(currentNode, "dataType", getGeneralizedDataType(record.getDataType().toLowerCase()));
		if (!dataTypeMatch){
			return false;
		}
		logger.debug("data type match");

		Boolean outputFormatMatch = matchNode(currentNode, "outputFormats", layer.getRequestedFormat().toLowerCase());
		if (!outputFormatMatch){
			return false;
		}
		logger.debug("requested format match");

		return true;
	}
	
	public void setBeanFactory(BeanFactory beanFactory) throws BeansException {
		this.beanFactory = beanFactory;
	}

	/**
	 * a method to get a concrete class of type LayerDownloader given the id string in the Spring Application Context
	 * 
	 * 
	 * @param downloaderKey a string key that identifies a concrete class of LayerDownloader
	 * @return the concrete LayerDownloader object
	 */
	public LayerDownloader getLayerDownloader(String downloaderKey){
		LayerDownloader layerDownloader = (LayerDownloader) beanFactory.getBean(downloaderKey);
		if (layerDownloader == null){
			throw new NullPointerException("LayerDownloader could not be retrieved");
		}
		return layerDownloader;
	}
	
	private static String getGeneralizedDataType(String dataType){
		if (dataType.equals("point")||dataType.equals("line")||dataType.equals("polygon")){
			dataType = "vector";
		}
		return dataType;
	}
	
	private static Boolean matchNode(JsonNode parentNode, String path, String value){
		Boolean match = false;
		JsonNode matchNode = parentNode.path(path);
		if (matchNode.isArray()){
			ArrayNode arrayNode = (ArrayNode) matchNode;
			Iterator<JsonNode> iterator = arrayNode.iterator();
			while (iterator.hasNext()){
				JsonNode currentNode = iterator.next();
				slogger.debug("node value:" + currentNode.textValue());
				if (currentNode.textValue().equalsIgnoreCase(value.trim())){
					match = true;
				}
			}
		} else if (matchNode.isTextual()){
			slogger.debug("text node");
		} else if(matchNode.isMissingNode()){
			slogger.debug("Node at path ['" + path + "'] does not exist.");
		}
		slogger.debug("path: " + path + ", value: " + value + " match: " + match.toString());
		return match;
	}

	/**
	 * A cursory check to see if OGP has the information required to attempt a download of the layer for a given method.
	 *
	 * @param classKey
	 * @param layer
	 * @return
	 */
	private Boolean hasRequirements(String classKey, LayerRequest layer){
		//query the download method to see if it has the info it needs
		LayerDownloader testDownloader = getLayerDownloader(classKey);
		Boolean hasInfo = testDownloader.hasRequiredInfo(layer);
		return hasInfo;
	}

	/**
	 * Look for the default download method defined in ogpDownloadConfig.json. The method returns the first download
	 * method, in order of specified preference, that meets the requirements for the method. (appropriate url type, etc.)
	 *
	 * @param institutions
	 * @param layer
	 * @return
	 * @throws Exception
	 */
	private String getDefaultDownloadKey(JsonNode institutions, LayerRequest layer) throws Exception{
		logger.info("Looking for default method...");

		JsonNode defaultNode = institutions.path("default");
		if (!defaultNode.isArray()){
			throw new Exception("No default defined!");
		}
		ArrayNode jsonArray = (ArrayNode) defaultNode;
		Iterator<JsonNode> iterator = jsonArray.elements();
		SortedMap<Integer, String> classKeys = new TreeMap<Integer, String>();

		while (iterator.hasNext()){
			JsonNode currentNode = iterator.next();
			Boolean outputFormatMatch = matchNode(currentNode, "outputFormats", layer.getRequestedFormat().toLowerCase());
			if (outputFormatMatch){
				String classKey = currentNode.path("classKey").textValue();
				Integer preference = currentNode.path("preference").intValue();
				classKeys.put(preference, classKey);

			}
		}

		for (Integer key : classKeys.keySet()) {

			String match = classKeys.get(key);

			logger.info("examining requirements for... " + match);
			logger.debug("Matched classKey: " + match);
			if (hasRequirements(match, layer)) {
				logger.debug("requirements met: " + match);
				logger.info("Preferred match..." + match);
				return match;
			} else {
				logger.debug("requirements not met for: " + match);
			}

		}

		String errMsg = "No applicable default download method found.";
		logger.error(errMsg);
		throw new Exception(errMsg);
	}
}
