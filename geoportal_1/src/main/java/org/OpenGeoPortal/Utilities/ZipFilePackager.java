package org.OpenGeoPortal.Utilities;

import java.io.BufferedOutputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileNotFoundException;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.util.Enumeration;
import java.util.HashSet;
import java.util.Set;

import org.apache.commons.compress.archivers.ArchiveEntry;
import org.apache.commons.compress.archivers.zip.ZipArchiveEntry;
import org.apache.commons.compress.archivers.zip.ZipArchiveInputStream;
import org.apache.commons.compress.archivers.zip.ZipArchiveOutputStream;
import org.apache.commons.compress.archivers.zip.ZipFile;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class ZipFilePackager{
	/**
	 * Adds a set of files to a zip archive.
	 * @param Set<File> filesToPackage
	 * @param File zipArchive
	 * 
	 * @throws FileNotFoundException 
	 */
	final static Logger logger = LoggerFactory.getLogger(ZipFilePackager.class.getName());

	public static File zipUpFile(File fileToZip) throws IOException{
		String zipFileName = fileToZip.getName() + ".zip";
		File zipFile = new File(fileToZip.getParent(), zipFileName);
		ZipArchiveOutputStream newZipStream = new ZipArchiveOutputStream(zipFile);
		//add this uncompressed file to the archive
		int bytesRead;
		byte[] buffer = new byte[1024 * 1024];

		ZipArchiveEntry zipEntry = new ZipArchiveEntry(fileToZip.getName());
		newZipStream.putArchiveEntry(zipEntry);
		FileInputStream currentFileStream = new FileInputStream(fileToZip);
		while ((bytesRead = currentFileStream.read(buffer))!= -1) {
			newZipStream.write(buffer, 0, bytesRead);
		}
		newZipStream.closeArchiveEntry();
		newZipStream.close();
		currentFileStream.close();
		logger.info("Deleting: " + fileToZip.getName());
		fileToZip.delete();
		return zipFile;
	}
	
	public static void addFilesToArchive(Set<File> filesToPackage, File zipArchive) throws IOException {
	    if (filesToPackage.isEmpty()){
	    	//if there are no files, don't do anything.
	    	logger.error("No files to package.");
	    	return;
	    }
	    if (filesToPackage.size() == 1){
	    	File returnFile = filesToPackage.iterator().next();
	    	if (returnFile.getName().toLowerCase().endsWith(".zip")){
	    		logger.debug("Only 1 zip file...no need to process");
	    		returnFile.renameTo(zipArchive);
	    		return;
	    	}
	    }
		byte[] buffer = new byte[1024 * 1024];
	    
		ZipArchiveOutputStream newZipStream = new ZipArchiveOutputStream(zipArchive);
	    int zipFileCounter = 0;
	    for (File currentFile : filesToPackage){
	    	try{
	    		FileInputStream currentFileStream = new FileInputStream(currentFile);
	    		zipFileCounter++;
	    		if (!currentFile.getName().toLowerCase().endsWith(".zip")){
	    			logger.debug("Adding uncompressed file...");
	    			//add this uncompressed file to the archive
	    			int bytesRead;
	    			String entryName = currentFile.getName();
	    			logger.debug("Zipping: " + entryName);
	    			ZipArchiveEntry zipEntry = new ZipArchiveEntry(entryName);
	    			newZipStream.putArchiveEntry(zipEntry);
	    			while ((bytesRead = currentFileStream.read(buffer))!= -1) {
	    				newZipStream.write(buffer, 0, bytesRead);
	    			}
	    			newZipStream.closeArchiveEntry();
	    		} else {
	    			logger.debug("Adding entries from compressed file...");
	    			//read the entries from the zip file and copy them to the new zip archive
	    			//so that we don't have to recompress them.
	    			ZipArchiveInputStream currentZipStream = new ZipArchiveInputStream(currentFileStream);
	    			ArchiveEntry currentEntry;
	    			while ((currentEntry = currentZipStream.getNextEntry()) != null) {
	    				String entryName = currentEntry.getName();
		    			logger.debug("Zipping: " + entryName);
	    				ZipArchiveEntry zipEntry = new ZipArchiveEntry(entryName);
	    				try {
	    					newZipStream.putArchiveEntry(zipEntry);
	    				} catch (Exception e){
	    					//duplicate names should never happen.
	    					entryName = Math.round(Math.random() * 10000) + "_" + entryName;
	    					ZipArchiveEntry zipEntry2 = new ZipArchiveEntry(entryName);
	    					newZipStream.putArchiveEntry(zipEntry2);
	    				}
	    				int bytesRead;
	    				while ((bytesRead = currentZipStream.read(buffer))!= -1) {
	    					newZipStream.write(buffer, 0, bytesRead);
	           	 		}
	    				newZipStream.closeArchiveEntry();
	    			}
	    			currentZipStream.close();
	    		}	
	    	} catch (FileNotFoundException e) {
				// TODO Auto-generated catch block
				e.printStackTrace();
			} catch (IOException e) {
				// TODO Auto-generated catch block
				e.printStackTrace();
			} finally {
				//always delete the file
				logger.debug("Deleting: " + currentFile.getName());
	    		currentFile.delete();

	    	}
    	}
	    
	    if (zipFileCounter > 0){
	     	try {
				newZipStream.close();
			} catch (IOException e) {
				// TODO Auto-generated catch block
				e.printStackTrace();
			}
	    }
	    
		//long endTime = System.currentTimeMillis();
		//logger2.info(zipFileCounter + " file(s) zipped in " + (endTime - startTime) + " milliseconds.");
	}
	
	/*public static Set<File> unarchiveFiles(File zippedFile) throws Exception {
		ZipFile zipFile = new ZipFile(zippedFile);
		zipFile.
		ZipArchiveEntry entry = zipFile.getEntry(name);
		InputStream content = zipFile.getInputStream(entry);
		try {
		    READ UNTIL content IS EXHAUSTED
		} finally {
		    content.close();
		}		
	}*/
	public static Set<File> unarchiveFiles(File zipArchive) throws Exception {
		Set<File> unarchivedFiles = new HashSet<File>();
    	try{
    		if (!zipArchive.canRead()){
    			if (!zipArchive.setReadable(true)){
    				throw new IOException("File is not readable");
    			}
    		}
    		String fileName = zipArchive.getName();
    		File containerDir;
    		if (fileName.endsWith(".zip")){
    			fileName = fileName.substring(0, fileName.lastIndexOf(".zip"));
    			containerDir = new File(zipArchive.getParentFile(), fileName);
    			containerDir.mkdir();
    		} else {
    			throw new IOException("Not a zipfile!");
    		}
    		ZipFile zipFile = new ZipFile(zipArchive);
			Enumeration<ZipArchiveEntry> entries = zipFile.getEntriesInPhysicalOrder();
			
			while (entries.hasMoreElements()) {
				ZipArchiveEntry currentEntry = entries.nextElement();
				String entryName = currentEntry.getName();
				logger.debug("Current entry: " + entryName);
				try { 
					logger.debug(zipArchive.getParent() + "/" + currentEntry.getName());
					File destFile = new File(containerDir, currentEntry.getName());
					if (currentEntry.isDirectory()){
						destFile.mkdir();
						logger.debug("created directory: " + destFile.getAbsolutePath());
						// create the parent directory structure if needed
					} else {
						File parentDir = destFile.getParentFile();
						if (!parentDir.exists()){
							parentDir.mkdir();
						}
						destFile.createNewFile();
						logger.debug("created file: " + destFile.getAbsolutePath());
						copyInputStream(zipFile.getInputStream(currentEntry),
								new BufferedOutputStream(new FileOutputStream(destFile)));
						unarchivedFiles.add(destFile);
						logger.info("Unzipped file : " + destFile.getName());
					}
				} catch (Exception e){
					e.printStackTrace();
					logger.error("zip exception:" + e.getMessage());
					break;
				}
			}
			
			zipFile.close();
			
	} catch (FileNotFoundException e) {
		logger.error("file not found exception");
		//e.printStackTrace();
	} catch (IOException e) {
		logger.error("IO exception");
		//e.printStackTrace();
	}
		return unarchivedFiles;
	}

	
	
	public static final void copyInputStream(InputStream in, OutputStream out)
			throws IOException
			{
			byte[] buffer = new byte[2048];
			int len;
			while((len = in.read(buffer)) >= 0)
			out.write(buffer, 0, len);
			in.close();
			out.close();
			}
}
