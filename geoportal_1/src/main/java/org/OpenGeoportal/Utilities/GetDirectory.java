package org.OpenGeoportal.Utilities;

import java.io.File;
import java.io.IOException;

import org.springframework.core.io.Resource;

public class GetDirectory implements DirectoryRetriever {
	private static final String DOWNLOAD_DIRECTORY = "download";
	Resource resource;


	public void setResource(Resource resource){
		this.resource = resource;
	}
	
	/**
	 * a method to create a directory to put downloaded files into, if it doesn't already exist
	 * 
	 * @param	directoryName	the name of the directory as a String
	 * @throws IOException 
	 * 
	 */
	public File getDirectory(String directoryName) throws IOException{
		//check permissions

		String directoryString = this.resource.getFile().getParentFile().getParentFile().getAbsolutePath();
		directoryString += "/" + directoryName;
		//System.out.println(directoryString);
		File theDirectory = new File(directoryString);
				
		if (!theDirectory.exists()){
			theDirectory.mkdir();
		}
		
		if (!theDirectory.canRead() || !theDirectory.canWrite()){
			throw new IOException("Download directory is inaccessible.");
		} else {
			return theDirectory;
		}
	}
	

	/** 
	 * 
	 * @return a File handle for the download directory specified in DOWNLOAD_DIRECTORY
	 * @see org.OpenGeoPortal.Utilities.DirectoryRetriever#getDownloadDirectory()
	 */
	public File getDownloadDirectory() {
		try {
			File theDirectory = this.getDirectory(DOWNLOAD_DIRECTORY);
			return theDirectory;
		} catch (IOException e) {
			// TODO Auto-generated catch block
			System.out.println("The directory \"" + DOWNLOAD_DIRECTORY + "\" could not be retrieved.");
			return null;
		}
	}
}
