package org.opengeoportal.utilities;

import java.io.File;
import java.io.IOException;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * Some utilities dealing with File handling.
 * 
 * @author cbarne02
 *
 */
public class OgpFileUtils {
	private static final int TEMP_DIR_ATTEMPTS = 10000;
	final static Logger logger = LoggerFactory.getLogger(OgpFileUtils.class.getName());

	/**
	 * Processes the layer's Name so that it can be used as a file name
	 * 
	 * processes the layer name String so that it can be used as a file name
	 * 
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
	 * 
	 * used for files retrieved over the web
	 * 
	 * @param fileName		the name of the File to create minus the extension
	 * @param mimeType		the mime-type of the File
	 * @param directory		the directory to create the new File in
	 * @return a handle to the new File
	 * @throws IOException 
	 */
	public static File createNewFileFromDownload(String fileName, String mimeType, File directory) throws IOException {
		String fileExtension = "";
		String[] fileNameArr = fileName.split("\\.");
		
		if (fileNameArr.length > 1){
			String temp = fileNameArr[fileNameArr.length -1];
			if (temp.length() == 3){
				//assume this is a file extension
				fileExtension = "." + temp;
				fileName = fileName.substring(0, fileName.indexOf(fileExtension));
			}
		}
		logger.debug(fileName);

		if (fileExtension.isEmpty()){
			//try to get it from the mime type
			fileExtension = getFileExtensionFromMimeType(mimeType);
		}
		fileName = OgpFileUtils.filterName(fileName);
		directory.mkdirs();
		directory.mkdir();
		File newFile = new File(directory, fileName + fileExtension);
		int i = 1;
		while (newFile.exists()){
			newFile = new File(directory, fileName + "_" + i + fileExtension);
			i++;
		}
		newFile.createNewFile();
		logger.debug("New file path: " + newFile.getAbsolutePath());
		return newFile;
	}
	
	/**
	 * a simplistic way of mapping mime-type to extensions.  There is likely a good library to use for this.
	 * 
	 * @param contentType	the mime-type of the content
	 * @return	an extension appropriate to the content type
	 */
	public static String getFileExtensionFromMimeType(String contentType){
		String responseContentType = contentType.toLowerCase();
		logger.info("response MIME-Type: " + responseContentType);
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
		} else if (responseContentType.contains("tiff")||responseContentType.contains("geotiff")){ 
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
		return fileExtension;
	}
	
	/**
	 * create a temp directory
	 * 
	 * @return a handle to a temporary directory
	 */
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
