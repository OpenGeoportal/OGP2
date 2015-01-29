<?xml version="1.0" encoding="utf-8"?>

<xsl:stylesheet version="2.0"
	xmlns:xsl="http://www.w3.org/1999/XSL/Transform" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
	xmlns:gco="http://www.isotc211.org/2005/gco" xmlns:gmd="http://www.isotc211.org/2005/gmd"
	xmlns:gmi="http://www.isotc211.org/2005/gmi" xmlns:gmx="http://www.isotc211.org/2005/gmx"
	xmlns:gsr="http://www.isotc211.org/2005/gsr" xmlns:gss="http://www.isotc211.org/2005/gss"
	xmlns:gts="http://www.isotc211.org/2005/gts" xmlns:srv="http://www.isotc211.org/2005/srv"
	xmlns:gml="http://www.opengis.net/gml/3.2" xmlns:xlink="http://www.w3.org/1999/xlink"
	xmlns:xs="http://www.w3.org/2001/XMLSchema">
  

	<xsl:import href="common.xsl" />
	
	<!-- METADATA_REFERENCE_INFORMATION: ***************************************** 
		NOTE: I have combined the following sections under this heading: 1. METADATA_ENTITY_SET_INFORMATION 
		(miscellaneous stuff under root doc) 2. METADATA_MAINTENANCE_INFORMATION 
		(I stuck this within the above) 3. METADATA_EXTENSION_INFORMATION (ditto) -->

	<xsl:template name="metadataReferenceInfo">

		<h3>
			<a name="Metadata_Reference_Information"></a>
			Metadata Reference Information:
		</h3>
		<xsl:call-template name="metadataEntitySetInfo" />

	</xsl:template>



	<!-- METADATA_ENTITY_SET_INFORMATION: ************************************ -->

	<xsl:template name="metadataEntitySetInfo">
		<xsl:apply-templates select="gmd:fileIdentifier" />
		<xsl:apply-templates select="gmd:language" />
		<xsl:apply-templates select="gmd:characterSet" />
		<xsl:apply-templates select="gmd:parentIdentifier" />
		<xsl:apply-templates select="gmd:hierarchyLevel" />
		<xsl:apply-templates select="gmd:hierarchyLevelName" />
		<xsl:apply-templates select="gmd:contact" />
		<xsl:apply-templates select="gmd:dateStamp" />
		<xsl:apply-templates
			select="gmd:metadataMaintenance/gmd:MD_MaintenanceInformation" />
		<xsl:apply-templates
			select="gmd:metadataExtensionInfo/gmd:MD_MetadataExtensionInformation" />
		<xsl:apply-templates select="gmd:metadataStandardName" />
		<xsl:apply-templates select="gmd:metadataStandardVersion" />
		<xsl:apply-templates select="gmd:dataSetURI" />
	</xsl:template>

	<xsl:template match="gmd:fileIdentifier">
		<h4>File Identifier:</h4>
		<xsl:variable name="fileURL">
			<xsl:choose>
				<xsl:when test="contains( ., 'http:')">
					<xsl:value-of select="gco:CharacterString" />
					<xsl:text>.xml</xsl:text>
				</xsl:when>
				<!-- <xsl:otherwise>
					<xsl:text>http://pacioos.org/metadata/iso/</xsl:text>
					<xsl:value-of select="$datasetIdentifier" />
					<xsl:text>.xml</xsl:text>
				</xsl:otherwise>-->
			</xsl:choose>
		</xsl:variable>
		<p>
			<a href="{$fileURL}">
				<xsl:value-of select="$fileURL" />
			</a>
		</p>
		<p></p>
	</xsl:template>



	<xsl:template match="gmd:parentIdentifier">
		<h4>Parent Identifier:</h4>
		<p>
			<xsl:value-of select="." />
		</p>
		<p></p>
	</xsl:template>



	<xsl:template match="gmd:hierarchyLevel">
		<h4 title="MD_ScopeCode" >Hierarchy Level:</h4>
		<p>
			<xsl:value-of select="." />
		</p>
		<p></p>
	</xsl:template>

	<xsl:template match="gmd:hierarchyLevelName">
		<h4>Hierarchy Level Name:</h4>
		<p>
			<xsl:value-of select="." />
		</p>
		<p></p>
	</xsl:template>

	<xsl:template match="gmd:contact">
		<h4 title="CI_ResponsibleParty">Contact:</h4>
		<xsl:call-template name="CI_ResponsibleParty">
			<xsl:with-param name="element" select="gmd:CI_ResponsibleParty" />
			<xsl:with-param name="italicize-heading" select="true()" />
		</xsl:call-template>
	</xsl:template>

	<xsl:template match="gmd:dateStamp">
		<h4 >Date Stamp:</h4>
		<p >
			<xsl:call-template name="date">
				<xsl:with-param name="element" select="./gco:Date" />
			</xsl:call-template>
		</p>
		<p></p>
	</xsl:template>

	<xsl:template match="gmd:metadataStandardName">
		<h4>Metadata Standard Name:</h4>
		<p>
			<xsl:value-of select="." />
		</p>
	</xsl:template>

	<xsl:template match="gmd:metadataStandardVersion">
		<h4>Metadata Standard Version:</h4>
		<p>
			<xsl:value-of select="." />
		</p>
	</xsl:template>

	<xsl:template match="gmd:dataSetURI">
		<h4>Dataset URI:</h4>
		<p>
			<a href="{.}">
				<xsl:value-of select="." />
			</a>
		</p>
	</xsl:template>

</xsl:stylesheet>