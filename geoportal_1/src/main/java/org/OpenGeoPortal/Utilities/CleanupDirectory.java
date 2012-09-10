package org.OpenGeoPortal.Utilities;

import java.io.File;

public class CleanupDirectory {
	private static void cleanupDownloadDirectory(File downloadDirectory, long fileAgeMinutes){
		try {
			//convert to milliseconds
			long timeInterval = fileAgeMinutes * 60 * 1000;
			File[] downloadedFiles = downloadDirectory.listFiles();
			for (File downloadedFile : downloadedFiles) {
				long currentTime = System.currentTimeMillis();
				if (currentTime - downloadedFile.lastModified() > timeInterval){
					System.out.println("deleting " + downloadedFile.getName());
					downloadedFile.delete();
				}
			}
		} catch (Exception e) {
			System.out.println("Attempt to delete old files was unsuccessful.");
		}
		
	}
}
