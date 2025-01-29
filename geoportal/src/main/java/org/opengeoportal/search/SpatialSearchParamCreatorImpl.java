package org.opengeoportal.search;

import org.apache.solr.client.solrj.SolrQuery;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
public class SpatialSearchParamCreatorImpl implements SpatialSearchParamCreator {
    @Value("${search.spatialboost.layerwithinmap}")
    Double layerWithinMapBoost;

    @Value("${search.spatialboost.layermatchesscale}")
    Double layerMatchesScaleBoost;

    @Value("${search.spatialboost.layermatchescenter}")
    Double layerMatchesCenterBoost;

    @Value("${search.spatialboost.layerareaintersection}")
    Double layerAreaIntersectionBoost;

    @Override
    public void addSpatialSearchParams(SolrQuery solrQuery, Double minx, Double miny, Double maxx, Double maxy,
                                       Double centerX, Double centerY) {

        solrQuery.add("bf", getLayerMatchesArea(minx, miny, maxx, maxy) + "^" + layerMatchesScaleBoost)
            .add("bf", getCenterRelevancy(centerX, centerY) + "^" + layerMatchesCenterBoost)
            .add("bf", getLayerAreaIntersectionScore(minx, miny, maxx, maxy) + "^" + layerAreaIntersectionBoost)
            .add("bf", layerWithinMap(minx, miny, maxx, maxy) + "^" + layerWithinMapBoost)
            .add("fq", getIntersectionFilter())
            .add("intx", getIntersectionFunction(minx, miny, maxx, maxy));
    }

    /***
     * Creates a Solr boost function that boosts layers with a similar area to the query bounds
     * @param minx
     * @param miny
     * @param maxx
     * @param maxy
     * @return
     */
    String getLayerMatchesArea(Double minx, Double miny, Double maxx, Double maxy){
        Double mapDeltaX = Math.abs(maxx - minx);
        Double mapDeltaY = Math.abs(maxy - miny);
        double mapArea = (mapDeltaX * mapDeltaY);
        int smoothingFactor = 1000;
        return "recip(sum(abs(sub(Area," + mapArea
                + ")),.01),1," + smoothingFactor + "," + smoothingFactor + ")";
    }

    /***
     * Creates a Solr boost function that boosts layers whose center point is near the query center point.
     * @param centerX
     * @param centerY
     * @return
     */
    String getCenterRelevancy(Double centerX, Double centerY){
        var clause = "sum("
                + getLayerNearCenterClause(centerX, "MinX", "MaxX")
                + ",";
        clause += getLayerNearCenterClause(centerY, "MinY", "MaxY")
                + ")";
        return clause;
    }

    private static String getLayerNearCenterClause(Double center, String minTerm, String maxTerm) {
        int smoothingFactor = 1000;
        return "recip(abs(sub(product(sum(" + minTerm + ","
                + maxTerm + "),.5)," + center + ")),1," + smoothingFactor + ","
                + smoothingFactor + ")";
    }

    /***
     * Creates a Solr filter query that filters out layers that do not intersect the query bounds. Used in
     * conjunction with the 'intx' function.
     * @return
     */
    String getIntersectionFilter(){
        return "{!frange l=0 incl=false cache=false}$intx";
    }

    /***
     * Creates a Solr function that is used to determine if a layer intersects with the query bounds. Referenced
     * in the intersection filter.
     * @param minx
     * @param miny
     * @param maxx
     * @param maxy
     * @return
     */
    String getIntersectionFunction(Double minx, Double miny, Double maxx, Double maxy){
        String xRange;
        if (minx > maxx) {
            // crosses the dateline
            String xRange1 = getSpatialRangeClause("MinX", minx,"MaxX", 180.0);
            String xRange2 = getSpatialRangeClause("MinX", -180.0,"MaxX", maxx);

            xRange = "sum(" + xRange1 + "," + xRange2 + ")";
        } else {
            xRange = getSpatialRangeClause("MinX", minx,"MaxX", maxx);
        }

        String yRange = getSpatialRangeClause("MinY", miny,"MaxY", maxy);

        return  "product(" + xRange + "," + yRange + ")";
    }

    private static String getSpatialRangeClause(String minTerm, Double minVal, String maxTerm, Double maxVal) {
        return "max(0,sub(min(" + maxVal + "," + maxTerm
                + "),max(" + minVal + "," + minTerm + ")))";
    }

    /***
     * Creates a Solr boost function that boosts layers based on how well a layer covers the query bounds.
     * Creates a 3x3 grid of points within the query bounds, tests whether the point is in the layer, then
     * sums the results to determine boost.
     * @param minx
     * @param miny
     * @param maxx
     * @param maxy
     * @return
     */
    String getLayerAreaIntersectionScore(Double minx, Double miny, Double maxx, Double maxy){
        int stepCount = 3; // use 3x3 grid
        double mapDeltaX = Math.abs(maxx - minx);
        double mapXStepSize = mapDeltaX / (stepCount + 1.);

        double mapDeltaY = Math.abs(maxy - miny);
        double mapYStepSize = mapDeltaY / (stepCount + 1.);

        StringBuilder clause = new StringBuilder("sum("); // add up all the map points within the layer
        for (int i = 0; i < stepCount; i++) {

            for (int j = 0; j < stepCount; j++) {

                double currentMapX = minx + ((i + 1) * mapXStepSize);
                double currentMapY = miny + ((j + 1) * mapYStepSize);

                // console.log([currentMapX, currentMapY]);
                // is the current map point in the layer
                // that is, is currentMapX between MinX and MaxX and is
                // currentMapY betweeen MinY and MaxY

                // why 400? this should not be a fixed size
                String thisPointWithin = "map(sum(map(sub(" + currentMapX
                        + ",MinX),0,400,1,0),";
                thisPointWithin += "map(sub(" + currentMapX
                        + ",MaxX),-400,0,1,0),";
                thisPointWithin += "map(sub(" + currentMapY
                        + ",MinY),0,400,1,0),";
                thisPointWithin += "map(sub(" + currentMapY
                        + ",MaxY),-400,0,1,0)),";
                thisPointWithin += "4,4,1,0)"; // final map values

                // note that map(" + currentMapX + ",MinX,MaxX,1,0) doesn't work
                // because the min,max,target in map must be constants, not
                // field values
                // so we do many sub based comparisons

                if ((i > 0) || (j > 0)) {
                    clause.append(","); // comma separate point checks
                }

                clause.append(thisPointWithin);
            }
        }
        clause.append(")");

        // clause has the sum of 9 point checks, this could be 9,6,4,3,2,1 or 0
        // normalize to between 0 and 1, then multiple by boost

        clause = new StringBuilder("product(" + clause + "," + (1.0 / (stepCount * stepCount))
                + ")");

        return clause.toString();
    }

    /***
     * Creates a Solr boost function that boosts layers that are completely within the query bounds.
     * @param minx
     * @param miny
     * @param maxx
     * @param maxy
     * @return
     */
    String layerWithinMap(Double minx, Double miny, Double maxx, Double maxy) {
        String layerWithinMap = "if(and(exists(MinX),exists(MaxX),exists(MinY),exists(MaxY)),";

        layerWithinMap += "map(sum(";
        layerWithinMap += "map(MinX," + minx + "," + maxx + ",1,0),";
        layerWithinMap += "map(MaxX," + minx + "," + maxx + ",1,0),";
        layerWithinMap += "map(MinY," + miny + "," + maxy + ",1,0),";
        layerWithinMap += "map(MaxY," + miny + "," + maxy + ",1,0))";
        layerWithinMap += ",4,4,1,0),0)";

        return layerWithinMap;
    }

    public void setLayerWithinMapBoost(Double layerWithinMapBoost) {
        this.layerWithinMapBoost = layerWithinMapBoost;
    }

    public void setLayerMatchesScaleBoost(Double layerMatchesScaleBoost) {
        this.layerMatchesScaleBoost = layerMatchesScaleBoost;
    }

    public void setLayerMatchesCenterBoost(Double layerMatchesCenterBoost) {
        this.layerMatchesCenterBoost = layerMatchesCenterBoost;
    }

    public void setLayerAreaIntersectionBoost(Double layerAreaIntersectionBoost) {
        this.layerAreaIntersectionBoost = layerAreaIntersectionBoost;
    }
}
