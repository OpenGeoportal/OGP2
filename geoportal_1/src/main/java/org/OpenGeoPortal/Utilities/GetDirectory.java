package org.OpenGeoPortal.Utilities;

import java.io.File;
import java.io.IOException;

import org.springframework.core.io.Resource;

public class GetDirectory implements DirectoryRetriever {
	Resource resource;


	public void setResource(Resource resource){
		this.resource = resource;
	}
	
	/**
	 * a method to create a directory to put downloaded files into, if it doesn't already exist
	 * @throws IOException 
	 * 
	 */
	public File getDirectory(String directoryName) throws IOException{
		//check permissions

		String directoryString = this.resource.getFile().getParentFile().getParentFile().getAbsolutePath();
		directoryString += "/" + directoryName;
		System.out.println(directoryString);
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
	
}
