package org.opengeoportal.proxy.exception;

public class EmptyImageRequestException extends Exception {
    /***
     * Exception thrown when there are no allowed layers in the image request
     * @param errorMessage
     */
    public EmptyImageRequestException(String errorMessage) {
        super(errorMessage);
    }
}
