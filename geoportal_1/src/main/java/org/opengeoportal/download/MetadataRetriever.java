package org.opengeoportal.download;

import java.io.File;

public interface MetadataRetriever {

	File getXMLFile(String metadataFileName, File xmlFile) throws Exception;
	String getXMLStringFromId(String layerID, String xmlFormat) throws Exception;
	String getContactName(String layerID);
	String getContactPhoneNumber(String layerId);
	String getContactAddress(String layerID);
}
