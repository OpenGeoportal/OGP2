package org.opengeoportal.download.methods;

import java.io.File;
import java.io.IOException;
import java.io.InputStream;
import java.net.MalformedURLException;
import java.net.URL;

import org.apache.commons.io.FileUtils;
import org.apache.commons.io.IOUtils;
import org.opengeoportal.utilities.OgpFileUtils;
import org.opengeoportal.utilities.http.HttpRequester;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;


public abstract class AbstractHttpDownloadMethod extends AbstractDownloadMethod {
	protected HttpRequester httpRequester;
	
	final Logger logger = LoggerFactory.getLogger(this.getClass());

	
	public HttpRequester getHttpRequester() {
		return httpRequester;
	}

	public void setHttpRequester(HttpRequester httpRequester) {
		this.httpRequester = httpRequester;
	}
	
	public abstract String getMethod();

	@Override
	public String checkUrl(String url) throws MalformedURLException {
		try{
			URL test = new URL(url);
			String prot = test.getProtocol();
			if (!(prot.equalsIgnoreCase("http") || prot.equalsIgnoreCase("https"))){
				throw new MalformedURLException("Must use Hypertext Transfer Protocol.");
			}
		} catch (MalformedURLException e){
			logger.error("URL is malformed: '" + url + "'");
			throw new MalformedURLException();
		}
	
		return url;
	}
	
	public File getFileFromUrl(String url, String query) throws Exception {
		InputStream inputStream = null;
		try{
			inputStream = this.httpRequester.sendRequest(url, query, getMethod());	
			int status = httpRequester.getStatus();
			if (status >= 400 || status < 200) {
                logger.error("Response Status: {}", Integer.toString(status));
                throw new Exception("Request Failed! Server responded with status: " + Integer.toString(status));
            }
			if (status >= 300) {
                logger.warn("Response Status: {}", Integer.toString(status));
                logger.info("Redirecting!");
				String redirect = httpRequester.getHeaderValue("location");
				logger.info(redirect);
				return getFileFromUrl(redirect, query);
			}
			String contentType = httpRequester.getContentType().toLowerCase();
			Boolean contentMatch = expectedContentTypeMatched(contentType);
			if (!contentMatch){
				logger.error("Unexpected content type: " + contentType);
                //If there is a mismatch with the expected content, but the response is text, we want to at least log the response
                if (contentType.toLowerCase().contains("text")||contentType.toLowerCase().contains("html")||contentType.toLowerCase().contains("xml")){
					logger.error("Returned text: " + IOUtils.toString(inputStream));
				} 

				throw new Exception("Unexpected content type");

			}
			File file = getOutputFile();
			FileUtils.copyInputStreamToFile(inputStream, file);
			return file;
		} finally {
			IOUtils.closeQuietly(inputStream);
		}
	}
	
	
	public String getFilename(){
		//Content-Disposition	attachment;filename="middle_east_dams.xls"
		String fileName = null;

		String contentDisp = ""; 
		try{		
			contentDisp = httpRequester.getHeaderValue("Content-Disposition");
		} catch (Exception e){
			//ignore
		}
		if (contentDisp.toLowerCase().contains("filename")){
			contentDisp = contentDisp.substring(contentDisp.toLowerCase().indexOf("filename="));
			contentDisp = contentDisp.substring(contentDisp.toLowerCase().indexOf("=") + 1);
			fileName = contentDisp.replaceAll("\"", "");
		} else {
			fileName = currentLayer.getLayerInfo().getName();
		}
		
		return fileName;
	}
	
	public File getOutputFile() throws IOException{
		File directory = getDirectory();
		String fileName = this.getFilename();
		String contentType = httpRequester.getContentType().toLowerCase();
		return OgpFileUtils.createNewFileFromDownload(fileName, contentType, directory);
	}
}
	
	
	
	