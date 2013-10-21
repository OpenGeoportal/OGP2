package org.OpenGeoportal.Download.Config;

import java.io.IOException;

import org.OpenGeoportal.Download.Config.ConfigRetriever;
import org.OpenGeoportal.Download.Config.DownloadConfigRetriever;

import com.fasterxml.jackson.databind.JsonNode;

public class OgpDownloadConfigRetriever extends ConfigRetriever implements DownloadConfigRetriever {

	@Override
	public synchronized JsonNode getDownloadConfig() throws IOException {

		readConfigFile();

		return this.configContents;
	}

}