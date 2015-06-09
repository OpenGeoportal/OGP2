<?xml version="1.0" encoding="utf-8"?>
<!-- pacioos-iso-html.xsl Author: John Maurer (jmaurer@hawaii.edu) Date: 
	November 1, 2011 This Extensible Stylesheet Language for Transformations 
	(XSLT) document takes metadata in Extensible Markup Language (XML) for the 
	ISO 19115 with Remote Sensing Extensions (RSE) and converts it into an HTML 
	page. This format is used to show the full metadata record on PacIOOS's website. 
	For more information on XSLT see: http://en.wikipedia.org/wiki/XSLT http://www.w3.org/TR/xslt 
	
	
	Used and adapted for OGP by Chris Barnett (1/2015) with the gracious permission 
	of John Maurer. --> 

<xsl:stylesheet version="2.0"
	xmlns:xsl="http://www.w3.org/1999/XSL/Transform" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
	xmlns:gco="http://www.isotc211.org/2005/gco" xmlns:gmd="http://www.isotc211.org/2005/gmd"
	xmlns:gmi="http://www.isotc211.org/2005/gmi" xmlns:gmx="http://www.isotc211.org/2005/gmx"
	xmlns:gsr="http://www.isotc211.org/2005/gsr" xmlns:gss="http://www.isotc211.org/2005/gss"
	xmlns:gts="http://www.isotc211.org/2005/gts" xmlns:srv="http://www.isotc211.org/2005/srv"
	xmlns:gml="http://www.opengis.net/gml/3.2" xmlns:xlink="http://www.w3.org/1999/xlink"
	xmlns:xs="http://www.w3.org/2001/XMLSchema">


	<xsl:include href="templates/content.xsl" />
	<xsl:include href="templates/distribution.xsl" />
	<xsl:include href="templates/entity.xsl" />
	<xsl:include href="templates/extension.xsl" />
	<xsl:include href="templates/id.xsl" />
	<xsl:include href="templates/maintenance.xsl" />
	<xsl:include href="templates/quality.xsl" />
	<xsl:include href="templates/spatial.xsl" />
	

	<!-- This HTML output method conforms to the following DOCTYPE statement: 
		<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN" "http://www.w3.org/TR/html4/loose.dtd"> -->

	<xsl:output method="html" encoding="UTF-8"
		indent="yes" />

	<!-- VARIABLES: *********************************************************** -->

	<!-- The separator separates short names from long names. For example: DMSP 
		> Defense Meteorological Satellite Program -->

	<xsl:variable name="separator">
		<xsl:text disable-output-escaping="yes"> &lt;img src="/images/right.gif" width="5" height="8"/&gt; </xsl:text>
	</xsl:variable>

	<!-- Define a variable for creating a newline: -->

	<xsl:variable name="newline">
		<xsl:text>
		</xsl:text>
	</xsl:variable>

	<!-- This variable is used to link to the other metadata views. NOTE: TDS 
		FMRC ID's appear like "wrf_hi/WRF_Hawaii_Regional_Atmospheric_Model_best.ncd"; 
		to simplify the ID's, strip everything after "/": -->

	<xsl:variable name="datasetIdentifier">
		<xsl:variable name="datasetIdentifierOriginal"
			select="//gmd:MD_Metadata/gmd:identificationInfo/gmd:MD_DataIdentification/gmd:citation/gmd:CI_Citation/gmd:identifier/gmd:MD_Identifier/gmd:code/gco:CharacterString" />
		<xsl:choose>
			<xsl:when test="contains( $datasetIdentifierOriginal, '/' )">
				<xsl:value-of select="substring-before( $datasetIdentifierOriginal, '/' )" />
			</xsl:when>
			<xsl:otherwise>
				<xsl:value-of select="$datasetIdentifierOriginal" />
			</xsl:otherwise>
		</xsl:choose>
	</xsl:variable>

	<!-- Define a variable which creates a JavaScript array of the bounding 
		box of the Spatial_Domain/Bounding element in the ISO for use in the Google 
		Maps API, which is controlled by the loadGoogleMap function inside the google_maps.ssi 
		include file. NOTE: This function expects the bounding box to be provided 
		in a specific order: north, south, east, west: -->

	<xsl:variable name="bbox">
		<xsl:if
			test="//gmd:MD_Metadata/gmd:identificationInfo/gmd:MD_DataIdentification/gmd:extent/gmd:EX_Extent/gmd:geographicElement/gmd:EX_GeographicBoundingBox/gmd:northBoundLatitude/gco:Decimal">
			<xsl:text> [ </xsl:text>
			<xsl:value-of
				select="//gmd:MD_Metadata/gmd:identificationInfo/gmd:MD_DataIdentification/gmd:extent/gmd:EX_Extent/gmd:geographicElement/gmd:EX_GeographicBoundingBox/gmd:northBoundLatitude/gco:Decimal" />
			<xsl:text>, </xsl:text>
			<xsl:value-of
				select="//gmd:MD_Metadata/gmd:identificationInfo/gmd:MD_DataIdentification/gmd:extent/gmd:EX_Extent/gmd:geographicElement/gmd:EX_GeographicBoundingBox/gmd:southBoundLatitude/gco:Decimal" />
			<xsl:text>, </xsl:text>
			<xsl:value-of
				select="//gmd:MD_Metadata/gmd:identificationInfo/gmd:MD_DataIdentification/gmd:extent/gmd:EX_Extent/gmd:geographicElement/gmd:EX_GeographicBoundingBox/gmd:eastBoundLongitude/gco:Decimal" />
			<xsl:text>, </xsl:text>
			<xsl:value-of
				select="//gmd:MD_Metadata/gmd:identificationInfo/gmd:MD_DataIdentification/gmd:extent/gmd:EX_Extent/gmd:geographicElement/gmd:EX_GeographicBoundingBox/gmd:westBoundLongitude/gco:Decimal" />
			<xsl:text> ] </xsl:text>
		</xsl:if>
	</xsl:variable>

	<!-- TOP-LEVEL: HTML ****************************************************** -->

	<!-- The top-level template; Define various features for the entire page 
		and then call the "//gmd:MD_Metadata" template to fill in the remaining HTML: -->

	<xsl:template match="/">
		<html xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml">
			<xsl:value-of select="$newline" />
			<head>
				<xsl:value-of select="$newline" />
				<title>
					<xsl:value-of
						select="//gmd:MD_Metadata/gmd:identificationInfo/gmd:MD_DataIdentification/gmd:citation/gmd:CI_Citation/gmd:title/gco:CharacterString" />
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
			<body onLoad="loadGoogleMap( [ {$bbox} ] )">
				<xsl:value-of select="$newline" /> 
					<div class="metadataContainer">
					
						<div class="metadataHeader">
							<div class="metadataTitle">
								<!-- title -->
								<h1>
									<xsl:value-of select="//gmd:MD_Metadata/gmd:identificationInfo/gmd:MD_DataIdentification/gmd:citation/gmd:CI_Citation/gmd:title/gco:CharacterString" />
								</h1>
							</div>


							<xsl:template
									match="//gmd:MD_Metadata/gmd:identificationInfo/gmd:MD_DataIdentification/gmd:graphicOverview">
								<xsl:for-each select="gmd:MD_BrowseGraphic">

									<xsl:for-each select="gmd:fileName">

										<div class="metadataBrowse">
											<img src="{.}" class="browse" alt=""/>
										</div>

									</xsl:for-each>
								</xsl:for-each>
							</xsl:template>


							<div class="metadataDescription">
								<xsl:value-of select="//gmd:MD_Metadata/gmd:identificationInfo/gmd:MD_DataIdentification/gmd:abstract/gco:CharacterString" />
							</div>
						</div>
						
						
						<div class="metadataFull">


							<div class="metadataTOC level1">
								<br/>
								<br/>
								<hr/>

								<!-- title -->
								<h1>Full Metadata:</h1>
								<ul>
									<li>
										<a href="#dataIdentification">Identification Information</a>
									</li>
									
									<xsl:if
										test="string-length( //gmd:MD_Metadata/gmd:dataQualityInfo )">
										<li>
											<a href="#dataQuality">Data Quality Information</a>
										</li>
									</xsl:if>
									<xsl:if
										test="string-length( //gmd:MD_Metadata/gmd:spatialRepresentationInfo )">
										<li>
											<a href="#spatialRep">Spatial Representation Information</a>
										</li>
									</xsl:if>
									<xsl:if test="string-length( //gmd:MD_Metadata/gmd:contentInfo )">
										<li>
											<a href="#contentInfo">Content Information</a>
										</li>
									</xsl:if>
									<xsl:if
										test="string-length( //gmd:MD_Metadata/gmd:distributionInfo )">
										<li>
											<a href="#distribution">Distribution Information</a>
										</li>
									</xsl:if>
									<xsl:if
										test="string-length( //gmd:MD_Metadata/gmd:acquisitionInformation )">
										<li>
											<a href="#acquisition">Acquisition Information</a>
										</li>
									</xsl:if>
									<li>
										<a href="#referenceInfo">Metadata Reference Information</a>
									</li>
								</ul>
							</div>

						
							<xsl:comment>
								END HEADER
							</xsl:comment>
							
							<div class="metadataContent">
								<xsl:apply-templates select="//gmd:MD_Metadata" />
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

	<!-- The second-level template: match all the main elements of the ISO and 
		process them separately. The order of these elements is maintained in the 
		resulting document: -->

	<!-- ROOT: **************************************************************** -->


	<xsl:template name="backToTop">
			<p>
				<a href="javascript:void(0)" onClick="window.scrollTo( 0, 0 ); this.blur(); return false;">Back to Top</a>
			</p>
	</xsl:template>


	<xsl:template match="//gmd:MD_Metadata">
		<h2 id="dataIdentification" class="sectionHeader dataIdentification">Identification Information</h2>
		<div class="dataIdentification sectionContent">
			<xsl:apply-templates select="gmd:identificationInfo/gmd:MD_DataIdentification" />
			<xsl:if test="string-length( gmd:identificationInfo/srv:SV_ServiceIdentification )">
				<xsl:apply-templates select="gmd:identificationInfo/srv:SV_ServiceIdentification" />
			</xsl:if>
		</div>
		
		<h2 id="dataQuality" class="sectionHeader dataQuality">Data Quality Information</h2>
		<div class="dataQuality sectionContent">
			<xsl:apply-templates select="gmd:dataQualityInfo/gmd:DQ_DataQuality" />
		</div>
		
		<h2 id="spatialRep" class="sectionHeader spatialRep">Spatial Representation Information</h2>
		<div class="spatialRep sectionContent">
		<xsl:apply-templates
			select="gmd:spatialRepresentationInfo/gmd:MD_GridSpatialRepresentation" />
		</div>
		
		<h2 id="contentInfo" class="sectionHeader contentInfo">Content Information</h2>
		<div class="contentInfo sectionContent">
		<xsl:apply-templates select="gmd:contentInfo" />
		</div>
		
		<h2 id="distribution" class="sectionHeader distribution">Distribution Information</h2>
		<div class="distribution sectionContent">
		<xsl:apply-templates select="gmd:distributionInfo/gmd:MD_Distribution" />
		</div>
		
		<h2 id="aquisition" class="sectionHeader acquisition">Acquisition Information</h2>
		<div class="acquisition sectionContent">
		<xsl:apply-templates select="gmd:acquisitionInformation/gmi:MI_AcquisitionInformation" />
		</div>
		
		<h2 id="referenceInfo" class="sectionHeader referenceInfo">Metadata Reference Information</h2>
		<div class="referenceInfo sectionContent">
		<xsl:call-template name="metadataReferenceInfo" />
		</div>
	</xsl:template>


</xsl:stylesheet>
