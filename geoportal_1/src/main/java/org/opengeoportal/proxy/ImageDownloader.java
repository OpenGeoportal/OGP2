package org.opengeoportal.proxy;

import java.io.File;
import java.io.IOException;
import java.util.concurrent.Future;

public interface ImageDownloader {
	Future<File> getImage(String baseUrl, String queryString) throws IOException;
}
