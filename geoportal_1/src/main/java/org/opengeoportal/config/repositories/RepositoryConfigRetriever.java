package org.opengeoportal.config.repositories;

import java.io.IOException;
import java.util.List;

import org.opengeoportal.config.repositories.RepositoryConfig;

public interface RepositoryConfigRetriever {
	List<RepositoryConfig> load() throws IOException;

	List<RepositoryConfig> getConfig();
}
