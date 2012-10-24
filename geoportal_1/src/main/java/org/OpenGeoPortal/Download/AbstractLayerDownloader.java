package org.OpenGeoPortal.Download;

import java.io.File;

import org.OpenGeoPortal.Download.Types.LayerRequest;

/**
 * Abstract class for downloading layers
 * @author chris
 *
 */
//the layer downloader should handle all the errors thrown by the download method,
//and take care of layer status
abstract class AbstractLayerDownloader implements LayerDownloader {
	private String responseFileType;
	private String responseFileName;
		
	public String getResponseFileType() {
		return this.responseFileType;
	}
	
	public String getResponseFileName() {
		return this.responseFileName;
	}
	
	public void setResponseFileName(String responseFileName) {
		this.responseFileName = responseFileName;
	}
	
	abstract public void downloadLayers(MethodLevelDownloadRequest request) throws Exception;
	
	/**
	 * method for changing a layer's Name to a string that can be used as a file name.
	 * could be more robust
	 * 
	 * @param layerName
	 * @return filtered layer name
	 */
	String filterFileName(String layerName){
		//remove the workspace name prefix if it exists
		layerName = layerName.substring(layerName.indexOf(":") + 1);
		//replace periods with underscores
		layerName = layerName.replace(".", "_");
		return layerName;
	}
			
	/**
	 * method creates a new file, adds the appropriate extension to the filename based on MIME-TYPE
	 * @param layerObject
	 * @return a handle to the new file
	 */
	File createNewFileObject(LayerRequest layerObject){
		//TODO  probably should put this in a separate class or find an existing class that does MIME-TYPE to file extenstion mapping
		String fileName = this.filterFileName(layerObject.getLayerInfo().getName());
		String responseContentType = layerObject.responseMIMEType;
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

		File newFile = new File(layerObject.getTargetDirectory(), fileName + fileExtension);
		int i = 1;
		while (newFile.exists()){
			newFile = new File(layerObject.getTargetDirectory(), fileName + i + fileExtension);
			i++;
		}
		return newFile;
	}
	
}
