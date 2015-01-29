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


	<!-- CONTENT_INFORMATION: ************************************************* -->

	<xsl:template match="gmd:contentInfo">
		
		<h3>
			<a name="Content_Information"></a>
			Content Information:
		</h3>
		<xsl:apply-templates select="gmi:MI_CoverageDescription" />
		<xsl:apply-templates select="gmd:MD_FeatureCatalogueDescription" />

	</xsl:template>

	<xsl:template match="gmi:MI_CoverageDescription">
		<h4>Coverage Description:</h4>
		<xsl:apply-templates select="gmd:attributeDescription" />
		<xsl:apply-templates select="gmd:contentType" />
		<xsl:if test="string-length( gmd:dimension )">
			<p>
				<b>
					<i>Dimensions:</i>
				</b>
			</p>
			<ul>
				<xsl:for-each select="gmd:dimension">
					<xsl:sort
						select="gmd:MD_Band/gmd:sequenceIdentifier/gco:MemberName/gco:aName" />
					<li>
						<a
							href="#{gmd:MD_Band/gmd:sequenceIdentifier/gco:MemberName/gco:aName/gco:CharacterString}">
							<xsl:value-of
								select="gmd:MD_Band/gmd:sequenceIdentifier/gco:MemberName/gco:aName" />
						</a>
					</li>
				</xsl:for-each>
			</ul>
		</xsl:if>
		<xsl:apply-templates select="gmd:dimension" />
		<xsl:apply-templates select="gmi:rangeElementDescription" />
	</xsl:template>

	<xsl:template match="gmd:attributeDescription">
		<xsl:if test="string-length( . )">
			<p>
				<b>
					<i>Attribute Description:</i>
				</b>
			</p>
			<p>
				<xsl:value-of select="." />
			</p>
		</xsl:if>
	</xsl:template>

	<xsl:template match="gmd:contentType">
		<xsl:if test="string-length( . )">
			<p title="MD_CoverageContentTypeCode">
				<b>
					<i>Content Type: </i>
				</b>
				<xsl:value-of select="gmd:MD_CoverageContentTypeCode" />

			</p>
		</xsl:if>
	</xsl:template>

	<xsl:template match="gmd:dimension">
		<xsl:if test="string-length( . )">
			<p>
				<a
					name="{gmd:MD_Band/gmd:sequenceIdentifier/gco:MemberName/gco:aName/gco:CharacterString}"></a>
				<b>
					<i>Dimension: </i>
				</b>
			</p>
			<blockquote>
				
					<xsl:apply-templates select="gmd:MD_Band" />
				
			</blockquote>
		</xsl:if>
	</xsl:template>

	<xsl:template match="gmd:MD_Band">
		<xsl:if test="string-length( . )">
			<xsl:apply-templates select="gmd:sequenceIdentifier" />
			<xsl:apply-templates select="gmd:units" />
			<xsl:if test="string-length( gmd:descriptor )">
				<b>Descriptor:</b>
				<br />
				<p>
					<xsl:value-of select="gmd:descriptor" />
				</p>
			</xsl:if>
		</xsl:if>
	</xsl:template>

	<xsl:template match="gmd:sequenceIdentifier">
		<xsl:apply-templates select="gco:MemberName" />
	</xsl:template>

	<xsl:template match="gco:MemberName">
		<xsl:if test="string-length( gco:aName )">
			<b>Attribute Name: </b>
			<xsl:value-of select="gco:aName" />
			<br />
		</xsl:if>
		<xsl:apply-templates select="gco:attributeType" />
	</xsl:template>

	<xsl:template match="gco:attributeType">
		<xsl:if test="string-length( gco:TypeName/gco:aName )">
			<b>Attribute Type: </b>
			<xsl:value-of select="gco:TypeName/gco:aName" />
			<br />
		</xsl:if>
	</xsl:template>

	<xsl:template match="gmd:units">
		<xsl:choose>
			<xsl:when test="string-length( . )">
				<b>Units: </b>
				<xsl:value-of select="." />
				<br />
			</xsl:when>
			<xsl:otherwise>
				<xsl:variable name="unitsUrl">
					<xsl:choose>
						<xsl:when test="contains( @xlink:href, 'someUnitsDictionary')">
							<xsl:value-of select="substring-after( @xlink:href, '#' )" />
						</xsl:when>
						<xsl:otherwise>
							<xsl:value-of select="@xlink:href" />
						</xsl:otherwise>
					</xsl:choose>
				</xsl:variable>
				<xsl:choose>
					<xsl:when test="contains( $unitsUrl, 'http' )">
						<b>Units: </b>
						<a href="{$unitsUrl}">
							<xsl:value-of select="$unitsUrl" />
						</a>
						<br />
					</xsl:when>
					<xsl:otherwise>
						<b>Units: </b>
						<xsl:value-of select="$unitsUrl" />
						<br />
					</xsl:otherwise>
				</xsl:choose>
			</xsl:otherwise>
		</xsl:choose>
	</xsl:template>

	<xsl:template match="gmi:rangeElementDescription">
		<xsl:if test="string-length( . )">
		</xsl:if>
	</xsl:template>

	<xsl:template match="gmd:MD_FeatureCatalogueDescription">
		<h4>Feature Catalogue Description:</h4>
		<xsl:for-each select="gmd:includedWithDataset">
			<p>
				<b>
					<i>Included With Dataset?: </i>
				</b>
				<xsl:choose>
					<xsl:when test=".">
						<xsl:text>Yes</xsl:text>
					</xsl:when>
					<xsl:otherwise>
						<xsl:text>No</xsl:text>
					</xsl:otherwise>
				</xsl:choose>
			</p>
		</xsl:for-each>
		<xsl:for-each select="gmd:featureTypes">
			<p>
				<b>
					<i>Feature Types: </i>
				</b>
				<xsl:value-of select="gco:LocalName/@codeSpace" />
			</p>
		</xsl:for-each>
		<xsl:for-each select="gmd:featureCatalogueCitation">
			<p>
				<b>
					<i>Feature Catalogue Citation: </i>
				</b>
				<xsl:choose>
					<xsl:when test="string-length( gmd:CI_Citation )">
						<xsl:call-template name="CI_Citation">
							<xsl:with-param name="element" select="gmd:CI_Citation" />
						</xsl:call-template>
					</xsl:when>
					<xsl:otherwise>
						<xsl:value-of select="@gco:nilReason" />
					</xsl:otherwise>
				</xsl:choose>
			</p>
		</xsl:for-each>
	</xsl:template>
	
	</xsl:stylesheet>