package org.opengeoportal.config;

import java.io.IOException;
import java.util.List;

import org.apache.commons.configuration.ConfigurationException;

/**
 * Interface for dealing with xml config files
 *
 * @author cbarne02
 */

public interface ConfigRetriever {

    /**
     * @return a List of objects representing config info
     * @throws IOException
     */
    List<?> getConfig() throws IOException;

    /**
     * Reloads info from the config file, in case it changed
     *
     * @throws ConfigurationException
     */
    void reload() throws ConfigurationException;

    /**
     * Loads the info from the config file into memory
     *
     * @throws IOException
     */
    void load() throws IOException;

}
