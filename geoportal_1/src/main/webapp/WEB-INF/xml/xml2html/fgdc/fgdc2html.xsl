<!--

pacioos-fgdc-html.xsl

Author: John Maurer (jmaurer@hawaii.edu)
Date: November 1, 2011 (rev. from my July 2007 original at NSIDC)

This Extensible Stylesheet Language for Transformations (XSLT) document takes
metadata in Extensible Markup Language (XML) for the U.S. Federal Geographic 
Data Committee (FGDC) Content Standard for Digital Geospatial Metadata (CSDGM) 
with Remote Sensing Extensions (RSE) and converts it into an HTML page. This 
format is used to show the full metadata record on PacIOOS's website.

For more information on the FGDC CSDGM see:

http://www.fgdc.gov/metadata/csdgm/

For more information on XSLT see:

http://en.wikipedia.org/wiki/XSLT
http://www.w3.org/TR/xslt


	Used and adapted for OGP by Chris Barnett (1/2015) with the gracious permission 
	of John Maurer.
-->

<xsl:stylesheet
  xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
  version="2.0">

 
	<xsl:include href="templates/distribution.xsl" />
	<xsl:include href="templates/entity.xsl" />
	<xsl:include href="templates/id.xsl" />
	<xsl:include href="templates/reference.xsl" />
	<xsl:include href="templates/quality.xsl" />
	<xsl:include href="templates/spatial.xsl" />
  <!-- 

  This HTML output method conforms to the following DOCTYPE statement:

    <!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN"
      "http://www.w3.org/TR/html4/loose.dtd">
  -->

  <xsl:output
    method="html"
    encoding="UTF-8"
    indent="yes"/>

  <!-- VARIABLES: ***********************************************************-->

  <!-- The separator separates short names from long names. For example:
       DMSP > Defense Meteorological Satellite Program -->

  <xsl:variable name="separator">
     <xsl:text disable-output-escaping="yes"> &lt;img src="/images/right.gif" width="5" height="8"/&gt; </xsl:text>
  </xsl:variable>

  <!-- Define a variable for creating a newline: -->

  <xsl:variable name="newline">
<xsl:text>
</xsl:text>
  </xsl:variable>

  <!-- This variable is used to link to the other metadata views.
       NOTE: TDS FMRC ID's appear like "wrf_hi/WRF_Hawaii_Regional_Atmospheric_Model_best.ncd";
       to simplify the ID's, strip everything after "/":
  -->
  <xsl:variable name="datasetIdentifier">
    <xsl:variable name="datasetIdentifierOriginal" select="metadata/idinfo/datsetid"/>
    <xsl:choose>
      <xsl:when test="contains( $datasetIdentifierOriginal, '/' )">
        <xsl:value-of select="substring-before( $datasetIdentifierOriginal, '/' )"/>
      </xsl:when>
      <xsl:otherwise>
       <xsl:value-of select="$datasetIdentifierOriginal"/>
      </xsl:otherwise>
    </xsl:choose>
  </xsl:variable>
 
  <!-- Define a variable which creates a JavaScript array of the bounding box
       of the Spatial_Domain/Bounding element in the FGDC for use in the Google
       Maps API, which is controlled by the loadGoogleMap function inside
       the google_maps.ssi include file. NOTE: This function expects the
       bounding box to be provided in a specific order: north, south, east,
       west: -->

  <xsl:variable name="bbox">
    <!-- FGDC can only have one Spatial Domain (i.e. not multiple bounding boxes): -->
    <xsl:if test="metadata/idinfo/spdom/bounding/northbc">
      <xsl:text> [ </xsl:text>
      <xsl:value-of select="metadata/idinfo/spdom/bounding/northbc"/><xsl:text>, </xsl:text>
      <xsl:value-of select="metadata/idinfo/spdom/bounding/southbc"/><xsl:text>, </xsl:text>
      <xsl:value-of select="metadata/idinfo/spdom/bounding/eastbc"/><xsl:text>, </xsl:text>
      <xsl:value-of select="metadata/idinfo/spdom/bounding/westbc"/>
      <xsl:text> ] </xsl:text>
    </xsl:if>
  </xsl:variable>

  <!-- TOP-LEVEL: HTML ******************************************************-->

  <!-- The top-level template; Define various features for the entire page and then
       call the "metadata" template to fill in the remaining HTML: -->

	<xsl:template match="/">
		<html xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml">
			<xsl:value-of select="$newline" />
			<head>
				<xsl:value-of select="$newline" />
				<title>
					<xsl:value-of
						select="metadata/idinfo/citation/citeinfo/title" />
				</title>
				<xsl:value-of select="$newline" />
				<xsl:value-of select="$newline" />
				<xsl:comment>
					If you want to show polylines on a Google Map (like the rectangle
					used to
					outline the data set geographic coverage), you need to include the VML
					namespace in the html tag and the following CSS code in an XHTML
					compliant
					doctype to make everything work properly in IE:
				</xsl:comment>
				<xsl:value-of select="$newline" />
				<xsl:value-of select="$newline" />

			</head>
			<xsl:value-of select="$newline" />
			<body>
				<xsl:value-of select="$newline" /> 
					<div class="metadataContainer">
					
						<div class="metadataHeader">
							<div class="metadataTitle">
								<!-- title -->
								<h1>
									<xsl:value-of select="metadata/idinfo/citation/citeinfo/title" />
								</h1>
							</div>
							<!--  
							<div class="metadataDescription">
							</div>
							-->
						</div>
						
						
						<div class="metadataFull">
						

							<div class="metadataTOC level1">		
								<!-- title -->
								<h3>Full Metadata:</h3>
								<ul>
									<li>
										<a href="#dataIdentification">Identification Information</a>
									</li>
									
									<xsl:if test="string-length( metadata/dataqual )">

										<li>
											<a href="#dataQuality">Data Quality Information</a>
										</li>
									</xsl:if>
									
									  <xsl:if test="string-length( metadata/spdoinfo )">
					                    <li><a href="#spatialOrg">Spatial Data Organization Information</a></li>
					                  </xsl:if>
					                  <xsl:if test="string-length( metadata/spref )">
					                    <li><a href="#spatialRef">Spatial Reference Information</a></li>
					                  </xsl:if>
					                  <xsl:if test="string-length( metadata/eainfo )">
					                    <li><a href="#attributeInfo">Entity and Attribute Information</a></li>
					                  </xsl:if>
					                  <li><a href="#distribution">Distribution Information</a></li>
					                  <li><a href="#referenceInfo">Metadata Reference Information</a></li>
									
								</ul>
							</div>

						
							<xsl:comment>
								END HEADER
							</xsl:comment>
							
							<div class="metadataContent">
								<xsl:apply-templates select="metadata" />
							</div>
							
							
						</div>
				<xsl:comment>
					END MAIN CONTENT
				</xsl:comment>
				
				<div class="metadataFooter">
				<xsl:value-of select="$newline" />
				<xsl:comment>
					footer include
				</xsl:comment>
				<xsl:value-of select="$newline" />

				<xsl:value-of select="$newline" />
				<xsl:comment>
					end footer include
				</xsl:comment>
				<xsl:value-of select="$newline" />
				</div>
				</div>
			</body>
			<xsl:value-of select="$newline" />
		</html>
	</xsl:template>
	
    
 

  <!-- The second-level template: match all the main elements of the FGDC and
       process them separately. The order of these elements is maintained in
       the resulting document: -->

  <!-- ROOT: ****************************************************************-->
	<xsl:template match="metadata">
		<h2 id="dataIdentification" class="sectionHeader dataIdentification">Identification Information</h2>
		<div class="dataIdentification sectionContent">
		    <xsl:apply-templates select="idinfo"/>
		</div>
		
		<h2 id="dataQuality" class="sectionHeader dataQuality">Data Quality Information</h2>
		<div class="dataQuality sectionContent">
		    <xsl:apply-templates select="dataqual"/>
		</div>
		
		<h2 id="spatialOrg" class="sectionHeader spatialOrg">Spatial Data Organization Information</h2>
		<div class="spatialOrg sectionContent">
    	<xsl:apply-templates select="spdoinfo"/>
		</div>
		
		<h2 id="spatialRef" class="sectionHeader spatialRef">Spatial Reference Information</h2>
		<div class="spatialRef sectionContent">
   		 <xsl:apply-templates select="spref"/>
		</div>
		
		<h2 id="attributeInfo" class="sectionHeader attributeInfo">Entity and Attribute Information</h2>
		<div class="attributeInfo sectionContent">
    	<xsl:apply-templates select="eainfo"/>
		</div>
		
		<h2 id="distribution" class="sectionHeader distribution">Distribution Information</h2>
		<div class="distribution sectionContent">
    <xsl:apply-templates select="distinfo"/>
		</div>
		
		<h2 id="referenceInfo" class="sectionHeader referenceInfo">Metadata Reference Information</h2>
		<div class="referenceInfo sectionContent">
		<xsl:apply-templates select="metainfo"/>
		
		</div>
	</xsl:template>

</xsl:stylesheet>
