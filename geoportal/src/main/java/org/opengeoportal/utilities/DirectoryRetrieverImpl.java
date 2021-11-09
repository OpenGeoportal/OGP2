package org.opengeoportal.utilities;

import java.io.File;
import java.io.IOException;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
public class DirectoryRetrieverImpl implements DirectoryRetriever {
	private final String downloadDirectory;

	protected final Logger logger = LoggerFactory.getLogger(this.getClass());

	public DirectoryRetrieverImpl(@Value("${downloadDir}") String downloadDirectory) {
		this.downloadDirectory = downloadDirectory;
	}
	
	/**
	 * a method to create a directory to put downloaded files into, if it doesn't already exist
	 * puts the directory in the temp directory
	 * 
	 * @param	directoryName	the name of the directory as a String
	 * @throws IOException 
	 * 
	 */
	public File getDirectory(String directoryName) throws IOException{
		//check permissions
		File tempFile = File.createTempFile("tmp", "tmp");
		File tempDir = tempFile.getParentFile();
		tempFile.delete();
		File theDirectory = new File(tempDir, directoryName);
				
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
	 * @return a File handle for the temp directory, which we're using for downloads
	 */
	public File getDownloadDirectory() {
		File theDirectory = null;
		try {
			theDirectory = getDirectory(downloadDirectory);
		} catch (IOException e) {
			logger.error("Unable to retrieve directory ['" + downloadDirectory + "'] in the temp directory.");
		}
		return theDirectory;
	}
}
