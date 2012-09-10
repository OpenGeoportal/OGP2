package org.OpenGeoPortal.Utilities;

import java.io.File;
import java.io.IOException;

public interface DirectoryRetriever {
	public File getDirectory(String directoryName) throws IOException;
}
