package org.opengeoportal.download.methods;

import java.io.File;
import java.io.IOException;
import java.io.InputStream;
import java.net.MalformedURLException;
import java.net.URI;

import org.apache.commons.io.FileUtils;
import org.apache.commons.io.IOUtils;
import org.apache.commons.net.ftp.FTP;
import org.apache.commons.net.ftp.FTPClient;
import org.apache.commons.net.ftp.FTPReply;
import org.opengeoportal.utilities.OgpFileUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;


public abstract class AbstractFtpDownloadMethod extends AbstractDownloadMethod {
	private String filename;
	final Logger logger = LoggerFactory.getLogger(this.getClass());

	@Override
	public String checkUrl(String url) throws MalformedURLException {
		try{
		
			if (!url.toLowerCase().startsWith("ftp")){
				throw new MalformedURLException("Must use File Transfer Protocol.");
			}
		} catch (MalformedURLException e){
			logger.error("URL is malformed: '" + url + "' " + e.getMessage());
			throw new MalformedURLException();
		}
	
		return url;
	}
	
	public File getFileFromUrl(String url, String query) throws Exception {
		//url = "ftp://ftp.glcf.umd.edu/glcf/Landsat/WRS1/p001/r026/p001r026_1dx19760327.MSS-GLS1975/p001r026_1dm19760327_z22_10.tif.gz";
		URI uri = new URI(url);
		String ftpServerAddress = uri.getHost();
		String currentPath = uri.getPath();
		FTPClient ftp = new FTPClient();
		
		int delimiterIndex = currentPath.lastIndexOf("/");
		String fileName = currentPath.substring(delimiterIndex+1);

		InputStream inputStream = null;
		try{
			ftp.connect(ftpServerAddress);
			//Although they are open FTP servers, in order to access the files, a anonymous login is necessary.
			ftp.login("anonymous", "anonymous");
			logger.info("Connected to " + ftpServerAddress);
			logger.info(ftp.getReplyString());
		
			// After connection attempt, you should check the reply code to verify success.
			int reply = ftp.getReplyCode();
			if(!FTPReply.isPositiveCompletion(reply)) {
				logger.error("FTP server refused connection.");
				throw new Exception("FTP server refused connection.");
			}
		
			reply = ftp.getReplyCode();
			
			ftp.setFileType(FTP.BINARY_FILE_TYPE);

			//enter passive mode
			ftp.enterLocalPassiveMode();

			logger.debug("retrieving file");
			File file = getOutputFile(fileName);
			inputStream = ftp.retrieveFileStream(currentPath);

			FileUtils.copyInputStreamToFile(inputStream, file);
			boolean complete = ftp.completePendingCommand();
				
			return file;

		} catch(Exception e){
				e.printStackTrace();
				throw e;
		} finally {
			IOUtils.closeQuietly(inputStream);
			
			ftp.logout();

			if(ftp.isConnected()) {
				try {
					logger.info("Disconnecting...");
					ftp.disconnect();
				} catch(IOException ioe) {
					// do nothing
				}
			}
		}

	}
	

	
	public File getOutputFile(String filename) throws IOException{
		File directory = getDirectory();
		//try reading this from the file extension
		String contentType = "unknown";
		if (filename.toLowerCase().endsWith(".zip")){
			contentType = "application/zip";
		}
		logger.info("Creating new output file...");
		return OgpFileUtils.createNewFileFromDownload(filename, contentType, directory);
	}
}
	
	
	
	