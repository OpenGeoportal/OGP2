package org.opengeoportal.download.methods;

import org.opengeoportal.download.types.RequestParams;
import org.springframework.scheduling.annotation.Async;

import java.io.File;
import java.util.Set;
import java.util.concurrent.Future;

public interface FileDownloader {
    @Async
    Future<Set<File>> download(RequestParams requestParam, String name, Set<String> expectedContentTypes) throws Exception;

    @Async
    Future<Set<File>> download(RequestParams requestParam, String name,
                               Set<String> expectedContentTypes, String username, String password) throws Exception;
}
