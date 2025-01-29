package org.opengeoportal.download.methods;

import java.net.MalformedURLException;
import java.util.Collections;
import java.util.List;
import java.util.Set;

import com.fasterxml.jackson.core.JsonParseException;
import org.opengeoportal.download.exception.RequestCreationException;
import org.opengeoportal.download.types.LayerRequest;
import org.opengeoportal.download.types.RequestParams.Method;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import static org.opengeoportal.utilities.OgpUtils.checkUrl;

@Component("fileDownloadMethodHelper")
public class FileDownloadMethodHelper implements PerLayerDownloadMethodHelper {
	final Logger logger = LoggerFactory.getLogger(this.getClass());

	@Override
	public Boolean includesMetadata() {
		return false;
	}

	@Override
	public Method getMethod() {
		return Method.GET;
	}
	@Override
	public Set<String> getExpectedContentType(){
		return Collections.singleton("any");
	}

	@Override
	public String createQueryString(LayerRequest layerRequest) throws RequestCreationException {
		return "";
	}

	@Override
	public List<String> getUrls(LayerRequest layer) throws RequestCreationException {
		List<String> urls = null;
		try {
			urls = layer.getDownloadUrl();
		} catch (JsonParseException e) {
			logger.error(e.getMessage());
			throw new RequestCreationException("Problem parsing download url from record.");
		}
		for (String currentUrl: urls){
			logger.debug("download url:" + currentUrl);
			try {
				checkUrl(currentUrl);
			} catch (MalformedURLException e){
				logger.error(e.getMessage());
				throw new RequestCreationException("Download url from record is malformed.");
			}
		}
		return urls;
	};
}
