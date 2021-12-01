package org.opengeoportal.download;

import org.opengeoportal.download.exception.MetadataParsingException;

import java.io.File;
import java.util.Map;

public interface MetadataRetriever {

	File getXMLFile(String metadataFileName, File xmlFile) throws Exception;
	String getXMLStringFromId(String layerID, String xmlFormat) throws Exception;
	String getContactName(String layerID);
	String getContactPhoneNumber(String layerId);
	String getContactAddress(String layerID);
	String getMetadataAsHtml(String layerID) throws Exception;
	Map<String,String> getAttributeDescriptions(String layerID) throws MetadataParsingException;
}
