package org.opengeoportal.utilities;

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
	int maxAge;
	@Autowired
	private DirectoryRetriever directoryRetriever;
	final static Logger logger = LoggerFactory.getLogger(CleanupDirectoryImpl.class.getName());

	public int getMaxAge() {
		return maxAge;
	}

	public void setMaxAge(int maxAge) {
		this.maxAge = maxAge;
	}

	private Boolean fileDelete(File file){
		String descriptor = "file";
		if (file.isDirectory()){
			descriptor = "directory";
		}
		
		if (file.canWrite() && !file.isHidden()){
			logger.info("Deleting " + descriptor + ": " + file.getName());
			return file.delete();

		} else {
			logger.warn("No permissions to delete "+ descriptor + ": " + file.getName());
			return false;
		}
	};
	/* (non-Javadoc)
	 * @see org.OpenGeoPortal.Utilities.CleanupDirectory#cleanupDownloadDirectory()
	 */
	public void cleanupDownloadDirectory(){
		logger.debug("Attempting to clean directory...");
		//this is not great...only handles one level of directories
		try {
			//convert to milliseconds
			int counter = 0;
			long timeInterval = maxAge * 60 * 1000;
			File[] downloadedFiles = directoryRetriever.getDownloadDirectory().listFiles();

			long currentTime = System.currentTimeMillis();

			for (File downloadedFile : downloadedFiles) {

				if (downloadedFile.isDirectory()){
					if (!downloadedFile.canRead()){
						continue;
					}
					File[] innerDownloadedFiles = downloadedFile.listFiles();
					for (File innerDownloadedFile : innerDownloadedFiles) {
						
						if (currentTime - innerDownloadedFile.lastModified() > timeInterval){
							if (fileDelete(innerDownloadedFile)){
								counter++;
							}
						}
					}
					if (downloadedFile.listFiles().length == 0){
						if (fileDelete(downloadedFile)){
							counter++;
						}
					}
				} else { 
				
					if (currentTime - downloadedFile.lastModified() > timeInterval){
						if (fileDelete(downloadedFile)){
							counter++;
						}
					}
					
				}
				
			}
			if (counter == 0){
				logger.debug("No items to delete.");
			}
		} catch (Exception e) {
			e.printStackTrace();
			logger.error("Attempt to delete old files was unsuccessful.");
		}
		
	}
}
