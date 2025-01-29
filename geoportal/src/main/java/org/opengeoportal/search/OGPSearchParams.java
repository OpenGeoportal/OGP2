package org.opengeoportal.search;

public interface OGPSearchParams {
    int getStart();

    void setStart(int start);

    int getRows();

    void setRows(int rows);

    String getColumn();

    void setColumn(String column);

    String getDirection();

    void setDirection(String direction);

    Double getMinX();

    void setMinX(Double minX);

    Double getMinY();

    void setMinY(Double minY);

    Double getMaxX();

    void setMaxX(Double maxX);

    Double getMaxY();

    void setMaxY(Double maxY);

    Double getCenterX();

    void setCenterX(Double centerX);

    Double getCenterY();

    void setCenterY(Double centerY);

    String getWhere();

    void setWhere(String where);
}
