package org.OpenGeoPortal.Download.Config;

import java.util.Iterator;

import org.OpenGeoPortal.Download.Types.LayerRequest;
import org.OpenGeoPortal.Solr.SolrRecord;
import org.codehaus.jackson.JsonNode;
import org.codehaus.jackson.node.ArrayNode;
import org.slf4j.Logger;

public class OgpDownloadConfigRetriever extends ConfigRetriever implements DownloadConfigRetriever{
	
	/*
	 * 
	 * 			if (!currentLayer.accessLevel.equalsIgnoreCase("public")){
				try {
					if (currentLayer.institution.equalsIgnoreCase(this.searchConfigRetriever.getHome())){
						if (!this.getLocallyAuthenticated()){
							//if the user is not logged in, deny the request
							currentLayer.setStatus(LayerStatus.PERMISSION_DENIED);
							continue;
						}
					} else {
						//currently no way to log in to remote institutions, so just deny all requests
						currentLayer.setStatus(LayerStatus.PERMISSION_DENIED);
						continue;
					}
				} catch (Exception e){
					currentLayer.setStatus(LayerStatus.PERMISSION_DENIED);
					System.out.println("CONFIGURATION ERROR: Please set your home institution in ogpConfig.json.");
				}
			}
	 * 
	 * 
	 * (non-Javadoc)
	 * @see org.OpenGeoPortal.Download.DownloadConfigRetriever#getClassKey(org.OpenGeoPortal.Download.RequestedLayer)
	 */
	Logger logger;
	
	public OgpDownloadConfigRetriever(String configFilePath){
		this.setConfigFilePath(configFilePath);
	}
	
	public String getClassKey(LayerRequest layer) throws Exception {
		this.readConfigFile();
		SolrRecord record = layer.getLayerInfo();
		JsonNode institutions = this.configContents.path("institutions");
		ArrayNode jsonArray = (ArrayNode) institutions.path(record.getInstitution());
		Iterator<JsonNode> institutionIterator = jsonArray.getElements();
		String classKey = null;
		while (institutionIterator.hasNext()){
			JsonNode currentNode = institutionIterator.next();
			ArrayNode accessArrayNode = (ArrayNode) currentNode.path("accessLevel");
			Boolean accessMatch = false;
			Iterator<JsonNode> accessIterator = accessArrayNode.iterator();
			while (accessIterator.hasNext()){
				if (accessIterator.next().getTextValue().equalsIgnoreCase(record.getAccess().toLowerCase())){
					accessMatch = true;
				}
			}
			if (!accessMatch){
				continue;
			}
			
			Boolean dataTypeMatch = false;
			ArrayNode dataTypeArrayNode = (ArrayNode) currentNode.path("dataType");
			String generalizedDataType = record.getDataType().toLowerCase();

			if (generalizedDataType.equals("point")||generalizedDataType.equals("line")||generalizedDataType.equals("polygon")){
				generalizedDataType = "vector";
			}
			Iterator<JsonNode> dataTypeIterator = dataTypeArrayNode.iterator();
			while (dataTypeIterator.hasNext()){
				if (dataTypeIterator.next().getTextValue().equalsIgnoreCase(generalizedDataType)){
					dataTypeMatch = true;
				}
			}
			if (!dataTypeMatch){
				continue;
			}
			
			Boolean outputFormatMatch = false;
			ArrayNode outputFormatArrayNode = (ArrayNode) currentNode.path("outputFormats");
			Iterator<JsonNode> outputFormatIterator = outputFormatArrayNode.iterator();
			while (outputFormatIterator.hasNext()){
				if (outputFormatIterator.next().getTextValue().equalsIgnoreCase(layer.getRequestedFormat().toLowerCase())){
					outputFormatMatch = true;
				}
			}
			if (!outputFormatMatch){
				continue;
			}
			
			classKey = currentNode.path("classKey").getTextValue();
			if (accessMatch && dataTypeMatch && outputFormatMatch){
				break;
			}
		}
		if (classKey == null){
			logger.error("Class Key not defined for this layer.");
			throw new Exception("Class Key not defined for this layer.");
		}
		logger.debug(layer.getId() + ": " + classKey);
		return classKey;
	}


}
