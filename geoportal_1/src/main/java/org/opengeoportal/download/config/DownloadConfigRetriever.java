package org.opengeoportal.download.config;

import java.io.IOException;

import com.fasterxml.jackson.databind.JsonNode;

public interface DownloadConfigRetriever {

	JsonNode getDownloadConfig() throws IOException;
}
