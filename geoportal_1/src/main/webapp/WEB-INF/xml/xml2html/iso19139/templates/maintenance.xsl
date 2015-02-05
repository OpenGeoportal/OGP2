<?xml version="1.0" encoding="utf-8"?>

<xsl:stylesheet version="2.0"
	xmlns:xsl="http://www.w3.org/1999/XSL/Transform" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
	xmlns:gco="http://www.isotc211.org/2005/gco" xmlns:gmd="http://www.isotc211.org/2005/gmd"
	xmlns:gmi="http://www.isotc211.org/2005/gmi" xmlns:gmx="http://www.isotc211.org/2005/gmx"
	xmlns:gsr="http://www.isotc211.org/2005/gsr" xmlns:gss="http://www.isotc211.org/2005/gss"
	xmlns:gts="http://www.isotc211.org/2005/gts" xmlns:srv="http://www.isotc211.org/2005/srv"
	xmlns:gml="http://www.opengis.net/gml/3.2" xmlns:xlink="http://www.w3.org/1999/xlink"
	xmlns:xs="http://www.w3.org/2001/XMLSchema">

	<!-- METADATA_MAINTENANCE_INFORMATION: ************************************ -->

	<xsl:template match="gmd:metadataMaintenance/gmd:MD_MaintenanceInformation">
		<h4>Metadata Maintenance Information:</h4>
		<xsl:apply-templates select="gmd:maintenanceAndUpdateFrequency" />
		<xsl:apply-templates select="gmd:maintenanceNote" />
		<!-- Duplicates gmd:contact above so ignore here... <xsl:apply-templates 
			select="gmd:contact"/> -->
	</xsl:template>

	<xsl:template match="gmd:maintenanceAndUpdateFrequency">
		<p>
			<b>
				<i>Maintenance And Update Frequency: </i>
			</b>
			<xsl:choose>
				<xsl:when test="string-length( . )">
					<xsl:value-of select="." />
				</xsl:when>
				<xsl:otherwise>
					<xsl:value-of select="@gco:nilReason" />
				</xsl:otherwise>
			</xsl:choose>
		</p>
	</xsl:template>

	<xsl:template match="gmd:maintenanceNote">
		<xsl:if test="string-length( . )">
			<p>
				<b>
					<i>Maintenance Note:</i>
				</b>
			</p>
			<p>
				<xsl:value-of select="." />
			</p>
		</xsl:if>
	</xsl:template>
</xsl:stylesheet>