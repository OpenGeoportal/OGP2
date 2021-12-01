package org.opengeoportal.search;

import java.util.List;

public class PortalSearchResponse {
    public PortalSearchResponse(List<OGPRecord> docs, int start, int rows, int numFound) {
        this.start = start;
        this.rows = rows;
        this.numFound = numFound;
        this.docs = docs;
    }

    int start;
    int rows;
    int numFound;

    List<OGPRecord> docs;

    public int getStart() {
        return start;
    }

    public void setStart(int start) {
        this.start = start;
    }

    public int getRows() {
        return rows;
    }

    public void setRows(int rows) {
        this.rows = rows;
    }

    public int getNumFound() { return numFound; }

    public void setNumFound(int numFound) { this.numFound = numFound;}

    public List<OGPRecord> getDocs() {
        return docs;
    }

    public void setDocs(List<OGPRecord> docs) {
        this.docs = docs;
    }
}
