package org.opengeoportal.image;

import java.io.File;
import java.net.URL;
import java.util.concurrent.Future;

public interface ImageDownloader {

	Future<File> getImage(URL imageLocation) throws Exception;
}
