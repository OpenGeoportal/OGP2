package org.opengeoportal.search.exception;

public class SearchServerException extends Exception {
    /***
     * A generic search server error that is safe to show to application users
     * @param errorMessage
     */
    public SearchServerException(String errorMessage) {
        super(errorMessage);
    }
}
