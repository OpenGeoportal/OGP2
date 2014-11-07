package org.opengeoportal.download.methods;

import java.io.BufferedInputStream;
import java.io.File;
import java.io.InputStream;
import java.net.MalformedURLException;
import java.util.HashSet;
import java.util.Iterator;
import java.util.List;
import java.util.Set;
import java.util.concurrent.Future;
import java.io.IOException; 
import java.net.URL;

import org.apache.commons.io.FileUtils;
import org.apache.commons.io.IOUtils;
import org.apache.commons.net.ftp.FTP;
import org.apache.commons.net.ftp.FTPClient;
import org.apache.commons.net.ftp.FTPFile;
import org.apache.commons.net.ftp.FTPReply;
import org.opengeoportal.download.types.LayerRequest;
import org.opengeoportal.utilities.OgpFileUtils;
import org.springframework.scheduling.annotation.AsyncResult;

import com.fasterxml.jackson.core.JsonParseException;

public class FtpFileDownloadMethod extends AbstractDownloadMethod implements PerLayerDownloadMethod {
	private static final Boolean INCLUDES_METADATA = false;
	private static final String METHOD = "GET";
	
	@Override
	public Boolean includesMetadata() {
		return INCLUDES_METADATA;
	}

	@Override
	public String getMethod(){
		return METHOD;
	}
	
	@Override
	public Set<String> getExpectedContentType(){
		Set<String> expectedContentType = new HashSet<String>();
		expectedContentType.add("application/zip");
		return expectedContentType;
	}
	
	@Override
	public Boolean expectedContentTypeMatched(String foundContentType){
		//a file download could be anything
		return true;
	}
	
	@Override
	public String createDownloadRequest() throws Exception {
				return "";
	}

	@Override
	public List<String> getUrls(LayerRequest layer) throws MalformedURLException, JsonParseException{
		List<String> urls = layer.getDownloadUrl();
		Iterator<String> iter = urls.iterator();
		
		
		while(iter.hasNext()){
			String currentUrl = iter.next();
			if(currentUrl.contains("ftp")){
				logger.info("download url:" + currentUrl);
				try {
					this.checkUrl(currentUrl);
				} catch (MalformedURLException e){
					
				}
			}
			else
				urls.remove(currentUrl);			
		}
		return urls;
	};
	
	@Override
	public Future<Set<File>> download(LayerRequest currentLayer) throws Exception {
		this.currentLayer = currentLayer;
		currentLayer.setMetadata(this.includesMetadata());

		File directory = getDirectory();
		Set<File> fileSet = new HashSet<File>();
		List<String> urls = this.getUrls(currentLayer);
		for (String url: urls){
			InputStream inputStream = null;
			URL currentURL = new URL(url);
			String ftpServerAddress = currentURL.getHost();
			String currentPath = currentURL.getPath();
			
			FTPClient ftp = new FTPClient();
			int delimiterIndex = currentPath.lastIndexOf("/");
			String remoteDirectory = currentPath.substring(0,delimiterIndex);
			String fileName = currentPath.substring(delimiterIndex+1);
			
			try{
				int reply;
				ftp.connect(ftpServerAddress);
				ftp.setFileType(FTP.BINARY_FILE_TYPE);
				//Although they are open FTP servers, in order to access the files, a anonymous login is necessary.
				ftp.login("anonymous", "anonymous");
				System.out.println("Connected to " + ftpServerAddress + ".");
			    System.out.print(ftp.getReplyString());
			    
			    // After connection attempt, you should check the reply code to verify success.
			    reply = ftp.getReplyCode();
			    
			    if(!FTPReply.isPositiveCompletion(reply)) {
			        ftp.disconnect();
			        System.err.println("FTP server refused connection.");
			        System.exit(1);
			      }
			    reply = ftp.getReplyCode();
			    
			    //enter passive mode
	            ftp.enterLocalPassiveMode();
			    
	            //change current directory
	            ftp.changeWorkingDirectory(remoteDirectory);
	            
	            //check if the file with given name exists on ftp server
	            try{
	            	FTPFile[] ftpFiles = ftp.listFiles(fileName);
		            if (ftpFiles != null && ftpFiles.length > 0){
		            	for (FTPFile file: ftpFiles){
		            		if(!file.isFile())
		            			continue;
		            		System.out.println("Found file:" + file.getName());
		            	
		            		//transfer the file
		            		inputStream = ftp.retrieveFileStream(file.getName());
		            		
		            		//save the file and add to fileset
		            		//TODO: ftp file does not contain MIME type. 
		            		File outputFile = OgpFileUtils.createNewFileFromDownload(fileName, "ZIP", directory);
		    				//FileUtils with a BufferedInputStream seems to be the fastest method with a small sample size.  requires more testing
		    				BufferedInputStream bufferedIn = null;
		    				try {
		    					bufferedIn = new BufferedInputStream(inputStream);
		    					FileUtils.copyInputStreamToFile(bufferedIn, outputFile);
		    					fileSet.add(outputFile);
		    				} finally {
		    					IOUtils.closeQuietly(bufferedIn);
		    				}
		            	}            	
		            }
	            } catch(IOException e){
	            	e.printStackTrace();
	            } finally {
	            	ftp.logout();
	            }            		    
			} catch(IOException e) {
			      e.printStackTrace();
			} finally {
			      if(ftp.isConnected()) {
			          try {
			            ftp.disconnect();
			          } catch(IOException ioe) {
			            // do nothing
			          }
			      }
			      IOUtils.closeQuietly(inputStream);
			}			
		}
		return new AsyncResult<Set<File>>(fileSet);
	};	
}
