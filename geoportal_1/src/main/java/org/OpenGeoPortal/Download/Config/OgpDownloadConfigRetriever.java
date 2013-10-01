package org.OpenGeoPortal.Download.Config;

import java.util.Iterator;
import java.util.SortedMap;
import java.util.TreeMap;

import org.OpenGeoPortal.Download.LayerDownloader;
import org.OpenGeoPortal.Download.Types.LayerRequest;
import org.OpenGeoPortal.Solr.SolrRecord;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.BeansException;
import org.springframework.beans.factory.BeanFactory;
import org.springframework.beans.factory.BeanFactoryAware;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.node.ArrayNode;

public class OgpDownloadConfigRetriever extends ConfigRetriever implements DownloadConfigRetriever, BeanFactoryAware{
	
	/*
	 * 
	 * (non-Javadoc)
	 * @see org.OpenGeoPortal.Download.DownloadConfigRetriever#getClassKey(org.OpenGeoPortal.Download.RequestedLayer)
	 */
	final Logger logger = LoggerFactory.getLogger(this.getClass());
	final static Logger slogger = LoggerFactory.getLogger(OgpDownloadConfigRetriever.class.getName());

	protected BeanFactory beanFactory;

	public String getClassKey(LayerRequest layer) throws Exception {
		this.readConfigFile();
		SolrRecord record = layer.getLayerInfo();
		JsonNode institutions = this.configContents.path("institutions");
		JsonNode methods = institutions.path(record.getInstitution());
		
		if (methods.isMissingNode() || !methods.isArray()){
			try{
				return this.getDefaultDownloadKey(institutions, layer);
			} catch (Exception e){
				e.printStackTrace();
				logger.error("Class Key not defined for this layer.");
				throw new Exception("Class Key not defined for this layer.");
			}
		}
		ArrayNode methodArray = (ArrayNode) methods;
		Iterator<JsonNode> institutionIterator = methodArray.elements();
		String classKey = null;
		while (institutionIterator.hasNext()){
			JsonNode currentNode = institutionIterator.next();
			logger.debug("trying access matches...");
			Boolean accessMatch = matchNode(currentNode, "accessLevel", record.getAccess().toLowerCase());
			if (!accessMatch){
				continue;
			}
			logger.debug("access match");
			

			Boolean dataTypeMatch = matchNode(currentNode, "dataType", getGeneralizedDataType(record.getDataType().toLowerCase()));
			if (!dataTypeMatch){
				continue;
			}
			logger.debug("data type match");
			
			Boolean outputFormatMatch = matchNode(currentNode, "outputFormats", layer.getRequestedFormat().toLowerCase());
			if (!outputFormatMatch){
				continue;
			}
			logger.debug("requested format match");
			
			classKey = currentNode.path("classKey").asText();
			if (accessMatch && dataTypeMatch && outputFormatMatch){
				break;
			}
		}
		if (classKey == null){
			try{
				classKey = this.getDefaultDownloadKey(institutions, layer);
			} catch (Exception e){
				logger.error("Class Key not defined for this layer.");
				throw new Exception("Class Key not defined for this layer.");
			}
		}
		logger.debug(layer.getId() + ": " + classKey);
		
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
				slogger.debug("node value:" + currentNode.asText());
				if (currentNode.asText().equalsIgnoreCase(value.trim())){
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

	public void setBeanFactory(BeanFactory beanFactory) throws BeansException {
		this.beanFactory = beanFactory;
	}

	/**
	 * a method to get a concrete class of type LayerDownloader given a string key defined in WEB-INF/download.xml
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
	
	private Boolean hasRequirements(String classKey, LayerRequest layer){
		//query the download method to see if it has the info it needs
		LayerDownloader testDownloader = getLayerDownloader(classKey);
		Boolean hasInfo = testDownloader.hasRequiredInfo(layer);
		return hasInfo;
	}
	
	private String getDefaultDownloadKey(JsonNode institutions, LayerRequest layer) throws Exception{
		logger.info("Trying default method...");
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
				String classKey = currentNode.path("classKey").asText();
				Integer preference = currentNode.path("preference").asInt();
				logger.debug("Matched classKey: " + classKey);
				if (hasRequirements(classKey, layer)){
					logger.debug("requirements met: " + classKey);
					classKeys.put(preference, classKey);
				} else {
					logger.debug("requirements not met for: " + classKey);
				}
			}
		}
		if (!classKeys.isEmpty()){
			String bestMatch = classKeys.get(classKeys.firstKey());
			logger.info("Trying preferred match..." + bestMatch);
			return bestMatch;
		} else {
			String errMsg = "No applicable default download method found.";
			logger.error(errMsg);
			throw new Exception(errMsg);
		}
	}
	
	
}
