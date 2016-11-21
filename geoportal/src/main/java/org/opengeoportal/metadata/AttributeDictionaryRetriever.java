package org.opengeoportal.metadata;

public interface AttributeDictionaryRetriever {

    /**
     * Retrieve attribute definition info from the xml metadata record
     *
     * @param layerId
     * @return
     * @throws Exception
     */
    AttributeDictionary getAttributeDictionary(String layerId) throws Exception;


}
