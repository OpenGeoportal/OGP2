package org.opengeoportal.utilities;

import java.io.File;
import java.io.FileInputStream;
import java.io.FileNotFoundException;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.util.Enumeration;
import java.util.HashSet;
import java.util.Set;

import org.apache.commons.compress.archivers.ArchiveEntry;
import org.apache.commons.compress.archivers.zip.ZipArchiveEntry;
import org.apache.commons.compress.archivers.zip.ZipArchiveInputStream;
import org.apache.commons.compress.archivers.zip.ZipArchiveOutputStream;
import org.apache.commons.compress.archivers.zip.ZipFile;
import org.apache.commons.io.IOUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * This class contains utility methods for zipping and unzipping files
 * 
 * @author Chris Barnett
 */
public class ZipFilePackager{
	/**
	 * Adds a set of files to a zip archive.
	 * @param Set<File> filesToPackage
	 * @param File zipArchive
	 * 
	 * @throws FileNotFoundException 
	 */
	final static Logger logger = LoggerFactory.getLogger(ZipFilePackager.class.getName());

	/**
	 * Zips up a File
	 * 
	 * This method creates a zip archive in the File's current directory with the File's name appended with ".zip".  
	 * Once the archive is created, the original file is deleted.
	 * 
	 * @param fileToZip		a File to zip
	 * @return the zipped File
	 * @throws IOException 	if there is a problem reading or writing a File
	 */
	public static File zipUpFile(File fileToZip) throws IOException {
		String zipFileName = fileToZip.getName() + ".zip";
		File zipFile = new File(fileToZip.getParent(), zipFileName);
		ZipArchiveEntry zipEntry = new ZipArchiveEntry(fileToZip.getName());

		FileInputStream currentFileStream = null;
		ZipArchiveOutputStream newZipStream = null;

		try {
			newZipStream = new ZipArchiveOutputStream(zipFile);
			//add this uncompressed file to the archive
			newZipStream.putArchiveEntry(zipEntry);

			currentFileStream = new FileInputStream(fileToZip);
			IOUtils.copy(currentFileStream, newZipStream);
		} finally {
			newZipStream.closeArchiveEntry();
			IOUtils.closeQuietly(newZipStream);
			IOUtils.closeQuietly(currentFileStream);
			try {
				logger.info("Deleting: " + fileToZip.getName());
				fileToZip.delete();
			} catch (Exception e){
				logger.error("Unable to delete file.  Check permissions.");
			}
		}
		return zipFile;
	}
	
	
	/**
	 * Adds a Set of Files to an existing Zip Archive
	 * 
	 * Adds a new ZipArchive entry for each of a Set of Files to a Zip Archive
	 * 
	 * @param filesToPackage	a Set of Files to add to a zip archive
	 * @param zipArchive		the zip archive to add the passed Set of Files to
	 * @throws IOException
	 */
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
	    
	    ZipArchiveOutputStream newZipStream = null;
	    try{
	    	newZipStream = new ZipArchiveOutputStream(zipArchive);

	    	for (File currentFile : filesToPackage){
	    		FileInputStream currentFileStream = null;
	    		try{

	    			currentFileStream = new FileInputStream(currentFile);
	    			if (!currentFile.getName().toLowerCase().endsWith(".zip")){

	    				logger.debug("Adding uncompressed file...");
	    				//add this uncompressed file to the archive
	    				//create a new archive entry with the file's name
	    				String entryName = currentFile.getName();
	    				logger.debug("Zipping: " + entryName);
	    				ZipArchiveEntry zipEntry = new ZipArchiveEntry(entryName);

	    				try{
	    					newZipStream.putArchiveEntry(zipEntry);
	    					IOUtils.copy(currentFileStream, newZipStream);
	    				} finally {
	    					//always close the archive entry
	    					newZipStream.closeArchiveEntry();
	    					//InputStreams are closed elsewhere
	    				}
	    			} else {
	    				logger.debug("Adding entries from compressed file...");
	    				//read the entries from the zip file and copy them to the new zip archive
	    				//so that we don't have to recompress them.
	    				ZipArchiveInputStream currentZipStream = null;
	    				try{
	    					ArchiveEntry currentEntry = null;
	    					currentZipStream = new ZipArchiveInputStream(currentFileStream);

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
	    						IOUtils.copy(currentZipStream, newZipStream);


	    					}
	    				} finally {
	    					newZipStream.closeArchiveEntry();
	    					IOUtils.closeQuietly(currentZipStream);
	    				}
	    			}	
	    		} catch (FileNotFoundException e) {
	    			String filename = currentFile.getName();
	    			logger.error("File not found ['" + filename + "']");

	    		} catch (IOException e) {
	    			// TODO Auto-generated catch block
	    			e.printStackTrace();
	    		} finally {
	    			IOUtils.closeQuietly(currentFileStream);
	    			//always delete the file
	    			logger.debug("Deleting: " + currentFile.getName());
	    			currentFile.delete();

	    		}
	    	}


	    } finally {
	    	IOUtils.closeQuietly(newZipStream);
	    }

	}

	/**
	 * Unzips a zipped archive into a Set of Files
	 * 
	 * @param zipArchive	archive File to unzip
	 * @return	a Set of Files from the archive
	 * @throws Exception
	 */
	
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
						InputStream zipStream = null;
						FileOutputStream fos = null;
						try{
							zipStream = zipFile.getInputStream(currentEntry);
							fos = new FileOutputStream(destFile);
							IOUtils.copy(zipStream, fos);
						} finally {
							IOUtils.closeQuietly(zipStream);
							IOUtils.closeQuietly(fos);
							
						}
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

}
