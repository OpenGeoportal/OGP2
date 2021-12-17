package org.opengeoportal.metadata;

import org.opengeoportal.metadata.exception.MetadataParsingException;

import java.io.File;
import java.util.Map;

public interface MetadataRetriever {

	File getXMLFile(String metadataFileName, File xmlFile) throws Exception;
	String getXMLStringFromId(String layerID) throws Exception;
	String getContactName(String layerID);
	String getContactPhoneNumber(String layerId);
	String getContactAddress(String layerID);
	String getMetadataAsHtml(String layerID, boolean withCss) throws Exception;
	Map<String,String> getAttributeDescriptions(String layerID) throws MetadataParsingException;
}
