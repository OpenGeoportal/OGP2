<?xml version="1.0" encoding="utf-8"?>

<xsl:stylesheet version="2.0"
	xmlns:xsl="http://www.w3.org/1999/XSL/Transform" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
	xmlns:gco="http://www.isotc211.org/2005/gco" xmlns:gmd="http://www.isotc211.org/2005/gmd"
	xmlns:gmi="http://www.isotc211.org/2005/gmi" xmlns:gmx="http://www.isotc211.org/2005/gmx"
	xmlns:gsr="http://www.isotc211.org/2005/gsr" xmlns:gss="http://www.isotc211.org/2005/gss"
	xmlns:gts="http://www.isotc211.org/2005/gts" xmlns:srv="http://www.isotc211.org/2005/srv"
	xmlns:gml="http://www.opengis.net/gml/3.2" xmlns:xlink="http://www.w3.org/1999/xlink"
	xmlns:xs="http://www.w3.org/2001/XMLSchema">
	
	<!-- SPATIAL_REPRESENTATION_INFORMATION: ********************************** -->

	<xsl:import href="../../utils/strip-digits.xsl" />

	<xsl:template
		match="gmd:spatialRepresentationInfo/gmd:MD_GridSpatialRepresentation">
		
		<h3>
			<a name="Spatial_Representation_Information"></a>
			Spatial Representation Information:
		</h3>
		<xsl:apply-templates select="gmd:numberOfDimensions" />
		<xsl:if test="string-length( gmd:axisDimensionProperties )">
			<h4>Axis Dimension Properties:</h4>
			<xsl:apply-templates select="gmd:axisDimensionProperties" />
		</xsl:if>
		<xsl:apply-templates select="gmd:cellGeometry" />
		<!-- Fill these in later when I have actual examples: <xsl:apply-templates 
			select="gmd:transformationParameterAvailability"/> -->

	</xsl:template>

	<xsl:template match="gmd:numberOfDimensions">
		<h4>Number Of Dimensions:</h4>
		<p>
			<xsl:value-of select="." />
		</p>

	</xsl:template>

	<xsl:template match="gmd:axisDimensionProperties">
		<xsl:for-each select="gmd:MD_Dimension">
			<p>
				<b>
					<i>Dimension:</i>
				</b>
			</p>
			
				<blockquote>
					<xsl:for-each select="gmd:dimensionName">
						<xsl:if test="string-length( . )">
							<b title="MD_DimensionNameTypeCode">Dimension Name: </b>
							<xsl:value-of select="." />

							<br />
						</xsl:if>
					</xsl:for-each>
					<xsl:for-each select="gmd:dimensionSize">
						<xsl:if test="string-length( . )">
							<b>Dimension Size: </b>
							<xsl:value-of select="." />
							<br />
						</xsl:if>
					</xsl:for-each>
					<xsl:for-each select="gmd:resolution">
						<xsl:if test="string-length( gco:Scale )">
							<b>Resolution: </b>
							<xsl:call-template name="strip-digits">
								<xsl:with-param name="element" select="gco:Scale" />
								<xsl:with-param name="num-digits" select="5" />
							</xsl:call-template>
							<xsl:choose>
								<xsl:when test="gco:Scale/@uom = 'decimalDegrees'">
									<xsl:text>&#176;</xsl:text>
								</xsl:when>
								<xsl:otherwise>
									<xsl:text> </xsl:text>
									<xsl:value-of select="gco:Scale/@uom" />
								</xsl:otherwise>
							</xsl:choose>
							<br />
						</xsl:if>
						<xsl:if test="string-length( gco:Measure )">
							<xsl:variable name="measure">
								<xsl:call-template name="strip-digits">
									<xsl:with-param name="element" select="gco:Measure" />
									<xsl:with-param name="num-digits" select="5" />
								</xsl:call-template>
							</xsl:variable>
							<xsl:choose>
								<xsl:when test="gco:Measure/@uom = '1'">
									<b>Resolution: </b>
									<xsl:value-of select="$measure" />
								</xsl:when>
								<xsl:otherwise>
									<b>Resolution: </b>
									<xsl:value-of select="$measure" />
									<xsl:text> </xsl:text>
									<xsl:value-of select="gco:Measure/@uom" />
									<br />
								</xsl:otherwise>
							</xsl:choose>
						</xsl:if>
					</xsl:for-each>
				</blockquote>
			
		</xsl:for-each>
	</xsl:template>

	<xsl:template match="gmd:cellGeometry">
		<h4 title="MD_CellGeometryCode">Cell Geometry:</h4>
		<p >
			<xsl:value-of select="gmd:MD_CellGeometryCode" />
		</p>
		<p></p>
	</xsl:template>

	<xsl:template match="gmd:transformationParameterAvailability">
		<h4>Transformation Parameter Availability:</h4>
	</xsl:template>
</xsl:stylesheet>