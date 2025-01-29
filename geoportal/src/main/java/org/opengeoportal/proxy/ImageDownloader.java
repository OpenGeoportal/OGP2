package org.opengeoportal.proxy;

import org.springframework.scheduling.annotation.Async;

import java.io.File;
import java.net.URL;
import java.util.concurrent.Future;

public interface ImageDownloader {

	Future<File> getImage(URL imageLocation) throws Exception;

    @Async
    Future<File> getImage(URL imageLocation, String username, String password) throws Exception;
}
