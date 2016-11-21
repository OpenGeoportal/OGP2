package org.opengeoportal.metadata;

/**
 * @author cbarne02
 *         <p/>
 *         A class to create FeatureInfo type objects. We need this since
 *         our controller is of singleton scope and WmsGetFeatureInfo is
 *         prototype scope. Implementing ApplicationContextAware allows us
 *         access to the Spring Application Context for the application.
 */
public class AttributeDictionaryRetrieverFactory {

    private static AttributeDictionaryRetriever attributeDictionaryRetriever = new AttributeDictionaryRetrieverFromMetadata();

    public AttributeDictionaryRetriever getAttributeDictionaryRetriever() {

        return attributeDictionaryRetriever;

    }


}
