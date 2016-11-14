package org.opengeoportal.utilities;

import java.io.File;
import java.io.IOException;

public interface DirectoryRetriever {
	public File getDirectory(String directoryName) throws IOException;

	public File getDownloadDirectory();
}
