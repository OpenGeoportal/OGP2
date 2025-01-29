package org.opengeoportal.search;


public class BaseSearchParams implements OGPSearchParams {

    int start = 0;
    int rows = 50;

    String column = "score";
    String direction = "desc";

    Double minX = -180.0;
    Double minY = -90.0;
    Double maxX = 180.0;
    Double maxY = 90.0;

    Double centerX = 0.0;
    Double centerY = 0.0;

    String where = "";

    @Override
    public int getStart() {
        return start;
    }

    @Override
    public void setStart(int start) {
        this.start = start;
    }

    @Override
    public int getRows() {
        return rows;
    }

    @Override
    public void setRows(int rows) {
        this.rows = rows;
    }

    @Override
    public String getColumn() {
        return column;
    }

    @Override
    public void setColumn(String column) {
        this.column = column;
    }

    @Override
    public String getDirection() {
        return direction;
    }

    @Override
    public void setDirection(String direction) {
        this.direction = direction;
    }

    @Override
    public Double getMinX() {
        return minX;
    }

    @Override
    public void setMinX(Double minX) {
        this.minX = minX;
    }

    @Override
    public Double getMinY() {
        return minY;
    }

    @Override
    public void setMinY(Double minY) {
        this.minY = minY;
    }

    @Override
    public Double getMaxX() {
        return maxX;
    }

    @Override
    public void setMaxX(Double maxX) {
        this.maxX = maxX;
    }

    @Override
    public Double getMaxY() {
        return maxY;
    }

    @Override
    public void setMaxY(Double maxY) {
        this.maxY = maxY;
    }

    @Override
    public Double getCenterX() {
        return centerX;
    }

    @Override
    public void setCenterX(Double centerX) {
        this.centerX = centerX;
    }

    @Override
    public Double getCenterY() {
        return centerY;
    }

    @Override
    public void setCenterY(Double centerY) {
        this.centerY = centerY;
    }

    @Override
    public String getWhere() { return where; }

    @Override
    public void setWhere(String where) { this.where = where; }
}
