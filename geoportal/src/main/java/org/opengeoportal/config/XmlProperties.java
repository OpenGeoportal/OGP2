package org.opengeoportal.config;

import java.io.File;

import org.apache.commons.configuration.ConfigurationException;
import org.apache.commons.configuration.XMLConfiguration;
import org.apache.commons.configuration.tree.xpath.XPathExpressionEngine;

/**
 * Class for dealing with xml config file using Apache Commons Configuration
 *
 * @author cbarne02
 */
public class XmlProperties {
    XMLConfiguration config;

    private File config_file;

    private void load() throws ConfigurationException {
        config = new XMLConfiguration();
        //allows us to use xpath expressions to find config info
        config.setExpressionEngine(new XPathExpressionEngine());
        config.load(config_file);
    }

    public void reload() throws ConfigurationException {
        load();
    }

    public XMLConfiguration getConfig() {
        return config;
    }

    public File getConfig_file() {
        return config_file;
    }

    public void setConfig_file(File config_file) {
        this.config_file = config_file;
    }
}
