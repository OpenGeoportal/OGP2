package org.OpenGeoportal.Utilities;

import java.io.File;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;

/**
 * This class inspects the donwload directory, looks for files last modified before FILE_AGE_MINUTES, then deletes them
 * 
 * This is set up as a recurring task
 * 
 * @author cbarne02
 *
 */
public class CleanupDirectoryImpl implements CleanupDirectory {
	private static final int FILE_AGE_MINUTES = 240;
	@Autowired
	private DirectoryRetriever directoryRetriever;
	final static Logger logger = LoggerFactory.getLogger(CleanupDirectoryImpl.class.getName());

	/* (non-Javadoc)
	 * @see org.OpenGeoPortal.Utilities.CleanupDirectory#cleanupDownloadDirectory()
	 */
	public void cleanupDownloadDirectory(){
		logger.debug("Attempting to clean directory...");
		//this is not great...only handles one level of directories
		try {
			//convert to milliseconds
			int counter = 0;
			long timeInterval = FILE_AGE_MINUTES * 60 * 1000;
			File[] downloadedFiles = directoryRetriever.getDownloadDirectory().listFiles();
			long currentTime = System.currentTimeMillis();

			for (File downloadedFile : downloadedFiles) {
			
				if (downloadedFile.isDirectory()){
					File[] innerDownloadedFiles = downloadedFile.listFiles();
					for (File innerDownloadedFile : innerDownloadedFiles) {
						if (currentTime - innerDownloadedFile.lastModified() > timeInterval){
							logger.info("Deleting file: " + innerDownloadedFile.getName());
							innerDownloadedFile.delete();
							counter++;
						}
					}
					if (downloadedFile.listFiles().length == 0){
						logger.info("Deleting directory: " + downloadedFile.getName());
						downloadedFile.delete();
						counter++;
					}
				} else { 
				
					if (currentTime - downloadedFile.lastModified() > timeInterval){
						logger.info("Deleting file: " + downloadedFile.getName());
						downloadedFile.delete();
						counter++;
					}
					
				}
				
			}
			if (counter == 0){
				logger.debug("No items to delete.");
			}
		} catch (Exception e) {
			logger.error("Attempt to delete old files was unsuccessful.");
		}
		
	}
}
