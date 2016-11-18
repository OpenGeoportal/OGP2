package org.opengeoportal.utilities;

import java.io.File;
import java.io.IOException;

public interface DirectoryRetriever {
    File getDirectory(String directoryName) throws IOException;

    File getDownloadDirectory();
}
