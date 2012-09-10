package org.OpenGeoPortal.Utilities;

import java.io.File;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class OgpFileUtils {
	private static final int TEMP_DIR_ATTEMPTS = 10000;
	final static Logger logger = LoggerFactory.getLogger(OgpFileUtils.class.getName());

	/**
	 * Processes the layer's Name so that it can be used as a file name
	 * @param layerName
	 * @return filtered name
	 */
	public static String filterName(String layerName){
		layerName = layerName.trim();
		//remove the workspace name prefix if it exists
		if (layerName.contains(":")){
			layerName = layerName.substring(layerName.indexOf(":") + 1);
		}
		//replace periods with underscores
		layerName = layerName.replace(".", "_");
		return layerName;
	}
	
	/**
	 * method creates a new file, adds the appropriate extension to the filename based on MIME-TYPE
	 * @param layerName, mimeType, directory
	 * @return a handle to the new file
	 */
	public static File createNewFileFromDownload(String fileName, String mimeType, File directory){
		fileName = OgpFileUtils.filterName(fileName);
		String responseContentType = mimeType;
		System.out.println("response MIME-Type: " + responseContentType);
		//get info from RequestedLayer object
		if (responseContentType.indexOf(";") > -1){
			responseContentType = responseContentType.substring(0, responseContentType.indexOf(";"));
		}
		String fileExtension;
		if ((responseContentType.contains("text/xml")||responseContentType.contains("application/xml"))){
			fileExtension = ".xml";
		} else if ((responseContentType.contains("text/html")||responseContentType.contains("application/html"))){
			fileExtension = ".html";
		} else if (responseContentType.contains("application/zip")){
			fileExtension = ".zip";
		} else if ((responseContentType.equals("image/tiff;subtype=\"geotiff\""))||responseContentType.contains("image/tiff")){ 
			fileExtension = ".tif";
		} else if (responseContentType.contains("image/jpeg")){ 
			fileExtension = ".jpg";
		} else if (responseContentType.contains("application/vnd.google-earth.kmz")){ 
			fileExtension = ".kmz";
		} else if (responseContentType.contains("application/vnd.ogc.se_xml")){ 
			fileExtension = "_error.xml";
		} else {
			fileExtension = ".unk";
		}

		File newFile = new File(directory, fileName + fileExtension);
		int i = 1;
		while (newFile.exists()){
			newFile = new File(directory, fileName + i + fileExtension);
			i++;
		}
		return newFile;
	}
	
	public static File createTempDir() {
		  File baseDir = new File(System.getProperty("java.io.tmpdir"));
		  String baseName = System.currentTimeMillis() + "-";

		  for (int counter = 0; counter < TEMP_DIR_ATTEMPTS; counter++) {
		    File tempDir = new File(baseDir, baseName + counter);
		    if (tempDir.mkdir()) {
		      return tempDir;
		    }
		  }
		  throw new IllegalStateException("Failed to create directory within "
		      + TEMP_DIR_ATTEMPTS + " attempts (tried "
		      + baseName + "0 to " + baseName + (TEMP_DIR_ATTEMPTS - 1) + ')');
		}
}
