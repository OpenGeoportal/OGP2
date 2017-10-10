package org.opengeoportal.download.config;

import java.io.IOException;

import org.opengeoportal.download.config.ConfigRetriever;
import org.opengeoportal.download.config.DownloadConfigRetriever;

import com.fasterxml.jackson.databind.JsonNode;

public class OgpDownloadConfigRetriever extends ConfigRetriever implements DownloadConfigRetriever {

	@Override
	public synchronized JsonNode getDownloadConfig() throws IOException {

		readConfigFile();

		return this.configContents;
	}

}