package org.OpenGeoPortal.Solr;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.net.URL;
import java.util.Calendar;
import java.util.Date;
import java.util.Vector;

import javax.servlet.http.HttpServletRequest;


/**
 * code to generate the elements in the Solr search query
 * currently this class deals with spatial filtering:
 *   is a layer within a map
 *   is a layer within an expanded map
 *   does a layer cover a map
 *   does the map and layer intersect
 *   how close is the scale of the layer to the scale of the map
 * 
 * this class also contains some static functions to deal with 
 *   the next and previous buttons (setting startIndex and rows)
 *   sort order (sortColumn and sortOrder) and similar functions.
 *   These static functions sometimes take an HttpServletRequest
 *   object and therefore know the name of the parameter on the
 *   client side.  
 *   
 * this class is used by both the basic and advanced search
 *
 * @author smcdon08
 *
 */
@SuppressWarnings("unused")
public class Searcher 
{
	
	// values used to control boost
	// adjusting them is a black art
	String layerWithinMapBoost = "10.0";
	String layerMatchesScaleBoost = "15.0";
	String layerMatchesCenterBoost = "3.0";
	
	String layerCoversMapBoost = "0.1";
	String layerWithinExpandedMapBoost = "4.0";
	String layerIntersectionScaleBoost = "2.0";
	
	// Solr seems picky about encoding so we build the search strings with the following elements
	public final static String asterik = "%2a";
	public final static String openParen = "%28";
	public final static String closeParen = "%29";
	public final static String openBracket = "%5B";
	public final static String closeBracket = "%5D";
	public final static String colon = "%3a";
	public final static String tilde = "%7e";
	public final static String comma = "%2c";
	public final static String space = "%20";
	public final static String equals = "%3D";
	
	double mapMinX;
	double mapMaxX;
	double mapMinY;
	double mapMaxY;
	
	/**
	 * pass in the bounding box for the displayed map
	 * @param minX
	 * @param maxX
	 * @param minY
	 * @param maxY
	 */
	public Searcher(double minX, double maxX, double minY, double maxY)
	{
		this.mapMinX = minX;
		this.mapMaxX = maxX;
		this.mapMinY = minY;
		this.mapMaxY = maxY;
	}

	/**
	 * return a Solr spatial search containing all elements 
	 * @return
	 */
	public String geoSearch()
	{
		String geoFilter = layerWithinMapScore() + layerMatchesArea() + layerNearCenterLongitude() + layerNearCenterLatitude();
		return geoFilter;
	}


	/**
	 * compute a score for layers within the current map
	 * the layer's MinX and MaxX must be within the map extent in X
	 * and the layer's MinY and MaxY must be within the map extent in Y
	 * I had trouble using a range based test (e.g., MinX:[mapMinX+TO+mapMapX])
	 *   along with other scoring functions based on _val_.  So, this function
	 *   is like the other scoring functions and uses _val_.
	 * The Solr "sum" function returns 4 if the layer is contained within the map.
	 * The outer "map" converts 4 to 1 and anything else to 0.  
	 * @return
	 */
	public String layerWithinMapScore()
	{
		String layerWithinMap = "";
		layerWithinMap += "product(" + layerWithinMapBoost + ",map(sum(";
		layerWithinMap += "map(MinX," + mapMinX + "," + mapMaxX + ",1,0),";
		layerWithinMap += "map(MaxX," + mapMinX + "," + mapMaxX + ",1,0),";
		layerWithinMap += "map(MinY," + mapMinY + "," + mapMaxY + ",1,0),";
		layerWithinMap += "map(MaxY," + mapMinY + "," + mapMaxY + ",1,0))";
		layerWithinMap += ",4,4,1,0)))";
		layerWithinMap = "_val_:\"" + layerWithinMap + "\"";
		return layerWithinMap;
		
	}
	/**
	 * return a search element to identify layers completely within the displayed map 
	 * @return Solr search clause
	 * @see layerIntersectsMapFilter() or layerIntersectsMapScore() or layerWithinMapScore()
	 * @deprecated either filter results with bounding box intersection or increase score with layerWithinMapScore()
	 */
	@Deprecated
	//@see layerIntersectsMapFilter() or layerIntersectsMapScore
	public String  layerWithinMap()
	{
		String layerWithinMap = "";
		layerWithinMap = openParen; 
		layerWithinMap += "MinX" + colon + openBracket + mapMinX + "+TO+" + mapMaxX + closeBracket;
        layerWithinMap += "+AND+MaxX" + colon + openBracket + mapMinX + "+TO+" + mapMaxX + closeBracket;
        layerWithinMap += "+AND+MinY" + colon + openBracket + mapMinY + "+TO+" + mapMaxY + closeBracket;
        layerWithinMap += "+AND+MaxY" + colon + openBracket + mapMinY + "+TO+" + mapMaxY + closeBracket;
        layerWithinMap += closeParen; 
        layerWithinMap += "^" + layerWithinMapBoost;
        return layerWithinMap;
	}
	
	/**
	 * return a search element to identify layers that completely cover the displayed map 
	 * @return Solr search clause
	 * @see layerIntersectsMapFilter() or layerIntersectsMapScore()
	 * @deprecated filter results with bounding box intersection, we don't need to boost layers that cover the map
	 */
	public String layerCoversMap()
	{
        String layerCoversMap = openParen;
        layerCoversMap += "MinX" + colon + openBracket + "-181.+TO+" + mapMinX + closeBracket;
        layerCoversMap += "+AND+MaxX" + colon + openBracket + mapMaxX + "+TO+181." + closeBracket;
        layerCoversMap += "+AND+MinY"+ colon + openBracket + "-91.+TO+" + mapMinY + closeBracket;
        layerCoversMap += "+AND+MaxY" + colon + openBracket + mapMaxY + "+TO+91." + closeBracket;
        layerCoversMap += closeParen + "^" + layerCoversMapBoost;
        return layerCoversMap;
	}
	
	/**
	 * is the layer contained within a larger map with the same center
	 * currently we make the map 50% larger in both width and height
	 * @return Solr search clause
	 * @deprecated with bounding box intersection, we don't use this
	 */
	public String layerWithinExpandedMap()
	{
		double deltaX = Math.abs(mapMaxX - mapMinX);
		double expandedMapMinX = mapMinX - (deltaX/2.);
		double expandedMapMaxX = mapMaxX + (deltaX/2.);
		double deltaY = Math.abs(mapMaxY - mapMinY);
		double expandedMapMinY = mapMinY - (deltaY/2.);
		double expandedMapMaxY = mapMaxY + (deltaY/2.);
		String layerWithinMap = openParen + "MinX" + colon + openBracket + expandedMapMinX + "+TO+" + expandedMapMaxX + closeBracket;
        layerWithinMap += "+AND+MaxX" + colon + openBracket + expandedMapMinX + "+TO+" + expandedMapMaxX + closeBracket;
        layerWithinMap += "+AND+MinY" + colon + openBracket + expandedMapMinY + "+TO+" + expandedMapMaxY + closeBracket;
        layerWithinMap += "+AND+MaxY" + colon + openBracket + expandedMapMinY + "+TO+" + expandedMapMaxY + closeBracket + closeParen 
        					+ "^" + layerWithinExpandedMapBoost;
        return layerWithinMap;
	}
	
	/**
	 * return a search element to boost the scores of layers whose scale matches the displayed map scale
	 * specifically, it compares their size in longitude
	 * @return
	 * @deprecated
	 * @see layerMatchesArea()
	 */
	public String layerMatchesScaleLongitude()
	{
		double deltaX = Math.abs(mapMaxX - mapMinX);
        String layerMatchesScale = "_val_:\"product(" + layerMatchesScaleBoost 
        							+ ",recip(sum(abs(sum(sum(MaxX,product(-1,MinX)),-" + deltaX + ")),.01),1,1,1))\"";
        return layerMatchesScale;
	}
	
	/**
	 * 
	 * @return
	 * @deprecated
	 * @see layerMatchesArea()
	 */
	public String layerMatchesScaleLatitude()
	{
		double deltaY = Math.abs(mapMaxY - mapMinY);
        String layerMatchesScale = "_val_:\"product(" + layerMatchesScaleBoost 
        							+ ",recip(sum(abs(sum(sum(MaxY,product(-1,MinY)),-" + deltaY + ")),.01),1,1,1))\"";
        return layerMatchesScale;
	}
	
	/**
	 * score layer based on how close map center longitude is to the layer's center longitude
	 * @return
	 */
	public String layerNearCenterLongitude()
	{
		double centerX = (mapMaxX + mapMinX)/2.;
        String layerMatchesCenter = "_val_:\"product(" + layerMatchesCenterBoost
        							+ ",recip(abs(sub(product(sum(MaxX,MinX),.5)," + centerX + ")),1,1000,1000))\"";
        return layerMatchesCenter;	
	}
	
	/**
	 * score layer based on how close map center latitude is to the layer's center latitude
	 * @return
	 */
	public String layerNearCenterLatitude()
	{
		double centerY = (mapMaxY + mapMinY)/2.;
        String layerMatchesCenter = "_val_:\"product(" + layerMatchesCenterBoost 
        							+ ",recip(abs(sub(product(sum(MaxY,MinY),.5)," + centerY + ")),1,1000,1000))\"";
        return layerMatchesCenter;	
	}
	
	
	/** 
	 * return a search element to boost the scores of layers whose scale matches the displayed map scale
	 * specifically, it compares their area
	 * @return
	 */
	public String layerMatchesArea()
	{
		double mapDeltaX = Math.abs(mapMaxX - mapMinX);
		double mapDeltaY = Math.abs(mapMaxY - mapMinY);
		double mapArea = (mapDeltaX * mapDeltaY);
		System.out.println("map area = " + mapArea);
		String layerMatchesArea = "_val_:\"product(" + layerMatchesScaleBoost 
									+ ",recip(sum(abs(sub(Area," + mapArea + ")),.01),1,1000,1000))\"";
		return layerMatchesArea;
	}
	
	/**
	 * return a search element to detect intersecting layers
	 * computes intersection of axis aligned bounding boxes (AABB) using separating axis
	 * note that if the map covers the layer or if the map is contained within the layer, there is no separating axis
	 *   so this function works for them as well.  
	 * implementing separating axis on AABB in Solr's functional language (which lacks an if statement)
	 *   is a little tricky so this function generates a complicated string
	 *   
	 * 
	 * some info on separating access on AABB see:
	 *   http://www.gamasutra.com/view/feature/3383/simple_intersection_tests_for_games.php?page=3
	 *   
	 * this function returns something that looks like:
	 * product(2.0,
	 * map(sum(map(sub(abs(sub(-71.172866821289,CenterX)),sum(0.7539367675480051,HalfWidth)),0,400000,1,0),
	 * map(sub(abs(sub(42.3588141761575,CenterY)),sum(0.6900056205085008,HalfHeight)),0,400000,1,0)),0,0,1,0))
	 *
	 * @return
	 */
	public String layerIntersectsMapAux()
	{
		double mapCenterX = (mapMaxX + mapMinX) / 2.;
		double mapHalfWidth = (mapMaxX - mapMinX) / 2.;
		double mapCenterY = (mapMaxY + mapMinY) / 2.;
		double mapHalfHeight = (mapMaxY - mapMinY) / 2.;

		String centerDistanceX = "abs(sub(" + mapCenterX + ",CenterX))";
		String centerDistanceY = "abs(sub(" + mapCenterY + ",CenterY))";
		// the separatingAxis is positive if it is actually a separating axis (no intersection)
		String separatingAxisX = "sub(" + centerDistanceX + ",sum(" + mapHalfWidth + ",HalfWidth))";
		String separatingAxisY = "sub(" + centerDistanceY + ",sum(" + mapHalfHeight + ",HalfHeight))";
		// separatingAxisFlag is either 0 or 1, 1 when a separating axis exists
		String separatingAxisFlagX = "map(" + separatingAxisX + ",0,400000,1,0)";
		String separatingAxisFlagY = "map(" + separatingAxisY + ",0,400000,1,0)";
		// separatingAxisExists: 0 for no, 1 or 2 for yes
		String separatingAxisExists = "sum(" + separatingAxisFlagX + "," + separatingAxisFlagY + ")";
		// separatingAxisExistsFlag: 0 if no separating axis (the boxes intersect so add to score)
		//   or 1 if axis exists (that is, the boxes don't intersect so don't add to score)
		String separatingAxisExistsFlag = "map(" + separatingAxisExists + ",0,0,1,0)"; 
		String intersectionScore = "product(" + layerIntersectionScaleBoost + "," + separatingAxisExistsFlag + ")";
		return intersectionScore;
	}
	
	/**
	 * return a Solr filter to find layers
	 * return a Solr frange expression that can be used with a "fq" clause
	 * frange takes the result of a Solr function and filters/clips layers based on a range  
	 * @return 
	 */
	public String layerIntersectsMapFilter()
	{
		String intersectionScore = layerIntersectsMapAux(); 
		String solrFunction = "{!frange+l" + equals + "1+u" + equals + "10}" + intersectionScore;
		return solrFunction;
	}
	
	/**
	 * return a Solr scoring clause to find layers 
	 * @return a Solr _val_ expression that can be used with a "q" clause 
	 */
	public String layerIntersectsMapScore()
	{
		String intersectionScore = layerIntersectsMapAux();
		String solrFunction = "_val_:\"" + intersectionScore + "\"";
		return solrFunction;
	}
	
	/**
	 * create a string with the Solr start and row parameters
	 * these attributes are used to specify which subset of the result set should be returned
	 * the request parameters must have the name startIndex and rows.
	 * @param request
	 * @return 
	 */
	public static String resultSubset(HttpServletRequest request)
	{
		// specify which subset of search results to return, supports next/previous buttons
	 	String startIndex$ = request.getParameter("startIndex");
	    if (startIndex$ == null) startIndex$ = "0";
	 	startIndex$ = startIndex$.trim();
	 	String rows$ = request.getParameter("rows");
	    if (rows$ == null) rows$ = "20";
	 	rows$ = rows$.trim();
	 	String returnValue = "start=" + startIndex$ + "&rows=" + rows$;
		return returnValue;			
	}
	
	

	/**
	 * create a string with the Solr sort parameter
	 * @param request
	 * @return sort=LayerDisplayName+asc
	 */
	public static String sortOrder(HttpServletRequest request)
	{
		String sortColumn = request.getParameter("sortColumn");
		if (sortColumn == null) 
			sortColumn = "score";
		else if (sortColumn.equals("LayerDisplayName"))
			sortColumn = "LayerDisplayNameSort";
		else if (sortColumn.equals("DataType"))
			sortColumn = "DataTypeSort";
		else if (sortColumn.equals("Originator"))
			sortColumn = "OriginatorSort";
		else if (sortColumn.equals("Publisher"))
			sortColumn = "PublisherSort";
		else if (sortColumn.equals("Institution"))
			sortColumn = "InstitutionSort";
		String sortOrder = request.getParameter("sortOrder");
		if (sortOrder == null)
			sortOrder = "desc";
		String returnValue = "sort=" + sortColumn + "+" + sortOrder;
		return returnValue;
	}
	
	/**
	 * create the solr date search string from the request date parameters
	 * if not dates are specified, return empty string
	 * if only one date is specified, default values are generated for the other date
	 *   default fromDate is 0001, default toDate is this year plus one
	 * dates sent to solr must be of the form 1995-12-31T23:59:59Z
	 * @param request
	 * @return
	 */
	public static String dateClause(HttpServletRequest request)
	{
		String dateSuffix = "-01-01T01:01:01Z";
		String fromDate = getRequestParameter(request, "dateFrom");
		String toDate = getRequestParameter(request, "dateTo");
		System.out.println("fromDate = " + fromDate +", toDate = " + toDate);
		if ((fromDate == null) && (toDate == null))
			return "";
		if (fromDate == null)
			fromDate = "0001";
		if (toDate == null)
		{
			// instead, should I just use the year 9999? what about Y10K?
			Calendar now = Calendar.getInstance();
			int year = now.get(Calendar.YEAR);
			toDate = Integer.toString(year) + 1;
		}
		String searchClause = "ContentDate" + colon 
							   + openBracket + fromDate + dateSuffix + "+TO+" + toDate + dateSuffix + closeBracket;
		return searchClause;
	}
	
	/**
	 * returns the parameter from the request
	 * converts the value "undefined" to null
	 * @param request
	 * @param parameterName
	 * @return null or the string value
	 */
	public static String getRequestParameter(HttpServletRequest request, String parameterName)
	{
		String returnValue = request.getParameter(parameterName);
		if (returnValue == null)
			return returnValue;
		if (returnValue.equals("undefined"))
			return null;
		returnValue = returnValue.trim();
		if (returnValue.length() == 0)
			return null;
		return returnValue;
	}
	
	

	/**
	 * create a Solr filter string based on user's data type selections
	 *   e.g., Raster, Paper Map, etc.
	 */
	public static String createDataTypeFilter(HttpServletRequest request)
	{
		// first, see what check boxes are on and store in vector
		Vector<String> dataTypes = new Vector<String>();
		
		String includeRaster = request.getParameter("typeRaster");
		if (includeRaster == null) includeRaster = "";
		if (includeRaster.equals("on"))
		{
			dataTypes.add("Raster");
		}
		
		String includeVector = request.getParameter("typeVector");
		if (includeVector == null) includeVector = "";
		if (includeVector.equals("on"))
		{
			dataTypes.add("Point");
		  	dataTypes.add("Line");
			dataTypes.add("Polygon");
		}
		String includeScannedMap = request.getParameter("typeMap");
		if (includeScannedMap == null) includeScannedMap = "";
		if (includeScannedMap.equals("on"))
		{
			dataTypes.add("Paper+Map");
		}
		
		// now, convert data types to Solr filter
		String dataTypeFilter = "";
		for (int i = 0 ; i < dataTypes.size() ; i++)
		{
			String currentType = dataTypes.get(i);
			if (i > 0)
				dataTypeFilter += "+OR+";
			dataTypeFilter += "DataType" + colon + currentType;
		}
		return dataTypeFilter;
	}

	/**
	 * create a Solr filter string based on user's data source selections
	 *   e.g., MIT, Harvard, etc. 
	 */
	public static String createDataSourceFilter(HttpServletRequest request)
	{
		// first, see what check boxes are on and store in vector
		Vector<String> dataSources = new Vector<String>();
		
		String sourceHarvard = request.getParameter("sourceHarvard");
		if (sourceHarvard == null) sourceHarvard = "";
		if (sourceHarvard.equals("on")) 
			dataSources.add("Harvard");
		String sourceMit = request.getParameter("sourceMit");
		if (sourceMit == null) sourceMit = "";
		if (sourceMit.equals("on")) 
			dataSources.add("MIT");
		String sourceMassGis = request.getParameter("sourceMassGis");
		if (sourceMassGis == null) sourceMassGis = "";
		if (sourceMassGis.equals("on")) 
			dataSources.add("MassGis");
		String sourcePrinceton = request.getParameter("sourcePrinceton");
		if (sourcePrinceton == null) sourcePrinceton = "";
		if (sourcePrinceton.equals("on")) 
			dataSources.add("Princeton");
		String sourceTufts = request.getParameter("sourceTufts");
		if (sourceTufts == null) sourceTufts = "";
		if (sourceTufts.equals("on")) 
			dataSources.add("Tufts");
		
		// now, convert data types to Solr filter
		String dataSourceFilter = "";
		for (int i = 0 ; i < dataSources.size() ; i++)
		{
			String currentSource = dataSources.get(i);
			if (i > 0)
				dataSourceFilter += "+OR+";
			dataSourceFilter += "Institution" + colon + currentSource;
		}
		return dataSourceFilter;
	}
	
	
	public static String createPublisherFilter(HttpServletRequest request)
	{
		String temp = request.getParameter("publisher");
		String[] publishers = temp.split(" ");
		String publishersFilter = "";
		for (int i = 0 ; i < publishers.length ; i++)
		{
			String currentSource = publishers[i];
			if (i > 0)
				publishersFilter += "+OR+";
			publishersFilter += "Publisher" + colon + currentSource;
		}
		return publishersFilter;
	}
	
	public static String createBasicKeywordFilter(HttpServletRequest request)
	{
		String searchTerm = request.getParameter("searchTerm");
		if (searchTerm == null)
			return "";
		searchTerm = searchTerm.trim();
		if (searchTerm.length() == 0)
			return "";
		String[] searchTerms = searchTerm.split(" ");
		String keywordFilter = "";
		for (int i = 0 ; i < searchTerms.length ; i++)
		{
			String currentSearchTerm = searchTerms[i];
			if (i > 0)
				keywordFilter += "+OR+";
			keywordFilter += "LayerDisplayName" + Searcher.colon + currentSearchTerm;
		    //solrQuery += "+OR+Institution" + Searcher.colon + currentSearchTerm + "^2";
			keywordFilter += "+OR+Publisher" + Searcher.colon + currentSearchTerm;
			keywordFilter += "+OR+Originator" + Searcher.colon + currentSearchTerm;
		    //solrQuery += "+OR+DataType" + Searcher.colon + currentSearchTerm;
			keywordFilter += "+OR+ThemeKeywords" + Searcher.colon + currentSearchTerm;
			keywordFilter += "+OR+PlaceKeywords" + Searcher.colon + currentSearchTerm;
		    //geoFilter += "+OR+Abstract" + Searcher.colon + "'" + currentKeyword + "'" + "^0.5";
		}
		return keywordFilter;
	}
	
	public static String createBasicKeywordScore(HttpServletRequest request)
	{
		String searchTerm = request.getParameter("searchTerm");
		if (searchTerm == null)
			return "";
		searchTerm = searchTerm.trim();
		if (searchTerm.length() == 0)
			return "";
		String[] searchTerms = searchTerm.split(" ");
		String keywordScore = "";
		for (int i = 0 ; i < searchTerms.length ; i++)
		{
			String currentSearchTerm = searchTerms[i];
			if (i > 0)
				keywordScore += "+OR+";
			keywordScore += "LayerDisplayName" + Searcher.colon + currentSearchTerm + "^3";
		    ////solrQuery += "+OR+Institution" + Searcher.colon + currentSearchTerm + "^2";
			//keywordScore += "+OR+Publisher" + Searcher.colon + currentSearchTerm;
			//keywordScore += "+OR+Originator" + Searcher.colon + currentSearchTerm;
		    ////solrQuery += "+OR+DataType" + Searcher.colon + currentSearchTerm;
			keywordScore += "+OR+ThemeKeywords" + Searcher.colon + currentSearchTerm + "^2";
			keywordScore += "+OR+PlaceKeywords" + Searcher.colon + currentSearchTerm + "^2";
		    ////geoFilter += "+OR+Abstract" + Searcher.colon + "'" + currentKeyword + "'" + "^0.5";
		}
		return keywordScore;
	}
	
	/**
	 * return a Solr expression specifying which columns should be returned for a typical search
	 * @return
	 */
	public static String getColumnsForSearch()
	{
		String returnValue = "&fl=Name" + comma + "CollectionId" + comma + "Institution" 
							 + comma + "Access" + comma + "DataType" + comma + "Availability"
							 + comma + "LayerDisplayName" + comma + "Publisher" + comma + "Originator" 
							 + comma + "ThemeKeywords" + comma + "PlaceKeywords" + comma + "Location"
							 + comma + "MinX" + comma + "MaxX" + comma + "MinY" + comma + "MaxY"
							 + comma + "ContentDate" + comma + "LayerId";
		return returnValue;
	}
	
	/**
	 * return a Solr expression specifying which columns should be returned on query for FGDC text 
	 * @return
	 */
	public static String getColumnsForFgdcText()
	{
		String returnValue = "&fl=LayerId" + comma + "FgdcText";
		return returnValue;
	}
	
	/**
	 * send query to Solr and return results
	 * @param serverName
	 * @param solrQuery
	 * @return
	 */
	public static String executeSolrSearch(String serverName, String solrQuery)
	{
	 	int port = 8480;
	 	String url$ = "http://" + serverName + ":" + port + "/solr/select/?" + solrQuery 
	 				  + "&debugQuery=off&version=2.2&rows=20&indent=on&wt=json&";
		try
		{
			URL url = new URL(url$);
			InputStream inputStream = url.openStream();
			System.out.println("inputStream = " + inputStream);
			InputStreamReader inputStreamReader = new InputStreamReader(inputStream);
			BufferedReader bufferedReader = new BufferedReader(inputStreamReader);
			String currentLine = bufferedReader.readLine();
			String json = "";
			while (currentLine != null)
			{
				currentLine = currentLine.replaceAll("\\n|\\r", " ");
				json = json + currentLine;
				if (currentLine.contains("LayerId"))
					System.out.println(currentLine);	
				currentLine = bufferedReader.readLine();
			}
			return json;
		}
		catch (IOException e)
		{
			System.out.println("error in exectuteSolrSearch with url = " + url$);
			return "";
		}
		
	}
	

	/**
	 * used for testing
	 * this is used in conjunction with a set of 14 test layers
	 * it validates the intersection code
	 * @param args
	 */
	public static void main(String[] args)
	{
		Searcher searcher = new Searcher(12, 25, 12, 15);
		String intersection = searcher.layerIntersectsMapFilter();
		System.out.println("intersection = " + intersection);
	}
	
}
