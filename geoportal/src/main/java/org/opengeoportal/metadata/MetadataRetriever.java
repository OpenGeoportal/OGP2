package org.opengeoportal.metadata;

import java.io.File;

/**
 * retrieves a layer's XML metadata from an OGP solr instance
 *
 * @author chris
 */
public interface MetadataRetriever {

    /**
     * Gets the XML metadata as a string, then outputs it to a file.
     *
     * @param metadataFileName the name of the layer you want XML metadata for
     * @param xmlFile          the name of the file the metadata will be written to return a
     *                         File object pointing to the XML metadata file for the layer
     * @throws Exception
     */
    File getXMLFile(String metadataFileName, File xmlFile) throws Exception;

    /**
     * Given a LayerId, returns the XML string from the metadata store. (Solr)
     *
     * @param layerID
     * @return
     * @throws Exception
     */
    String getXMLStringFromId(String layerID) throws Exception;

    /**
     * Given a LayerId, retrieves the XML string from the metadata store (Solr),
     * senses the metadata type, and transforms to HTML.
     *
     * @param layerID
     * @return an HTML representation of the metadata document
     * @throws Exception
     */
    String getMetadataAsHtml(String layerID) throws Exception;

    /**
     * Given a LayerId, retrieves the XML string from the metadata store (Solr),
     * senses the metadata type, and transforms to HTML.
     *
     * @param layerID
     * @param embedded
     * @return an HTML representation of the metadata document
     * @throws Exception
     */
    String getMetadataAsHtml(String layerID, boolean embedded) throws Exception;

}
