package org.opengeoportal.search.exception;

public class LayerNotFoundException extends Exception {
    /***
     * Exception thrown when the search client can't find a Layer
     * @param errorMessage
     */
    public LayerNotFoundException(String errorMessage) {
        super(errorMessage);
    }
}
