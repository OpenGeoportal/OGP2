package org.opengeoportal.download.methods;

import java.io.BufferedInputStream;
import java.io.File;
import java.io.IOException;
import java.io.InputStream;
import java.util.HashSet;
import java.util.Set;
import java.util.concurrent.Future;

import org.apache.commons.io.FileUtils;
import org.apache.commons.io.IOUtils;
import org.opengeoportal.download.types.RequestParams;
import org.opengeoportal.utilities.DirectoryRetriever;
import org.opengeoportal.utilities.OgpFileUtils;
import org.opengeoportal.http.HttpRequester;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Scope;
import org.springframework.scheduling.annotation.Async;
import org.springframework.scheduling.annotation.AsyncResult;
import org.springframework.stereotype.Component;

@Component
@Scope("prototype")
public class GenericDownloader {
	final HttpRequester httpRequester;
	final DirectoryRetriever directoryRetriever;

	final Logger logger = LoggerFactory.getLogger(this.getClass());

	@Autowired
	public GenericDownloader(HttpRequester httpRequester, DirectoryRetriever directoryRetriever) {
		this.httpRequester = httpRequester;
		this.directoryRetriever = directoryRetriever;
	}

	@Async
	public Future<Set<File>> download(RequestParams requestParam, String name, Set<String> expectedContentTypes) throws Exception {

		File directory = getDirectory();
		Set<File> fileSet = new HashSet<File>();
		for (String url: requestParam.getUrls()){

			try (
					InputStream inputStream = this.httpRequester.sendRequest(url, requestParam.getQueryParam(), requestParam.getMethod().toString());
					BufferedInputStream bufferedIn = new BufferedInputStream(inputStream)
					)
			{

				int status = httpRequester.getStatus();
				if (status < 200 || status >= 400){
					throw new Exception("Request Failed! Server responded with: " + Integer.toString(status));
				}
				String contentType = httpRequester.getContentType().toLowerCase();

				if (!(expectedContentTypes.contains(contentType) || expectedContentTypes.contains("any"))){
					logger.error("Unexpected content type: " + contentType);
					//If their is a mismatch with the expected content, but the response is text, we want to at least log the response
					if (contentType.toLowerCase().contains("text")||contentType.toLowerCase().contains("html")||contentType.toLowerCase().contains("xml")){
						logger.error("Returned text: " + IOUtils.toString(inputStream));
					}

					throw new Exception("Unexpected content type");

				}
				//Content-Disposition	attachment;filename="middle_east_dams.xls"
				String fileName;

				String contentDisp = "";
				try{
					contentDisp = httpRequester.getHeaderValue("Content-Disposition");
					logger.debug("content-disposition: " + contentDisp);
				} catch (Exception e){
					//ignore
					logger.error(e.getMessage());
				}
				if (contentDisp.toLowerCase().contains("filename")){
					contentDisp = contentDisp.substring(contentDisp.toLowerCase().indexOf("filename="));
					contentDisp = contentDisp.substring(contentDisp.toLowerCase().indexOf("=") + 1);
					fileName = contentDisp.replaceAll("\"", "");
				} else {
					fileName = name;
				}


				File outputFile = OgpFileUtils.createNewFileFromDownload(fileName, contentType, directory);

				FileUtils.copyInputStreamToFile(bufferedIn, outputFile);
				fileSet.add(outputFile);

			}
		}
		return new AsyncResult<Set<File>>(fileSet);
	}

	private File getDirectory() throws IOException{
		File downloadDirectory = this.directoryRetriever.getDownloadDirectory();
		File newDir = File.createTempFile("OGP", "", downloadDirectory);
		newDir.delete();
		//Boolean success= 
		newDir.mkdir();
		newDir.setReadable(true);
		newDir.setWritable(true);
		return newDir;
	}
	

}
