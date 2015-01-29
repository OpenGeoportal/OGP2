<?xml version="1.0" encoding="utf-8"?>

<xsl:stylesheet version="2.0"
	xmlns:xsl="http://www.w3.org/1999/XSL/Transform" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
	xmlns:gco="http://www.isotc211.org/2005/gco" xmlns:gmd="http://www.isotc211.org/2005/gmd"
	xmlns:gmi="http://www.isotc211.org/2005/gmi" xmlns:gmx="http://www.isotc211.org/2005/gmx"
	xmlns:gsr="http://www.isotc211.org/2005/gsr" xmlns:gss="http://www.isotc211.org/2005/gss"
	xmlns:gts="http://www.isotc211.org/2005/gts" xmlns:srv="http://www.isotc211.org/2005/srv"
	xmlns:gml="http://www.opengis.net/gml/3.2" xmlns:xlink="http://www.w3.org/1999/xlink"
	xmlns:xs="http://www.w3.org/2001/XMLSchema">
	<!-- METADATA_EXTENSION_INFORMATION: ************************************** -->

	<xsl:import href="common.xsl" />
	
	<xsl:template
		match="gmd:metadataExtensionInfo/gmd:MD_MetadataExtensionInformation">
		<h4>Metadata Extension Information:</h4>
		<xsl:for-each
			select="gmd:extendedElementInformation/gmd:MD_ExtendedElementInformation">
			<p>
				<b>
					<i>Extended Element Information:</i>
				</b>
			</p>
				<blockquote>
					<xsl:for-each select="gmd:name">
						<xsl:if test="string-length( . )">
							<b>Name: </b>
							<xsl:value-of select="." />
							<br />
						</xsl:if>
					</xsl:for-each>
					<xsl:for-each select="gmd:shortName">
						<xsl:if test="string-length( . )">
							<b>Short Name: </b>
							<xsl:value-of select="." />
							<br />
						</xsl:if>
					</xsl:for-each>
					<xsl:for-each select="gmd:obligation">
						<xsl:if test="string-length( gmd:MD_ObligationCode )">
							<b>Obligation: </b>
							<xsl:value-of select="gmd:MD_ObligationCode" />
							<br />
						</xsl:if>
					</xsl:for-each>
					<xsl:for-each select="gmd:dataType">
						<xsl:if test="string-length( gmd:MD_DatatypeCode )">
							<b>Data Type: </b>
							<xsl:value-of select="gmd:MD_DatatypeCode" />
							<br />
						</xsl:if>
					</xsl:for-each>
					<xsl:for-each select="gmd:maximumOccurrence">
						<xsl:if test="string-length( . )">
							<b>Maximum Occurrence: </b>
							<xsl:value-of select="." />
							<br />
						</xsl:if>
					</xsl:for-each>
					<xsl:for-each select="gmd:parentEntity">
						<xsl:if test="string-length( . )">
							<b>Parent Entity: </b>
							<xsl:value-of select="." />
							<br />
						</xsl:if>
					</xsl:for-each>
					<xsl:for-each select="gmd:rule">
						<xsl:if test="string-length( . )">
							<b>Rule: </b>
							<br />
							<p>
								<xsl:value-of select="." />
							</p>
						</xsl:if>
					</xsl:for-each>
					<xsl:for-each select="gmd:definition">
						<xsl:if test="string-length( . )">
							<p>
								<b>Definition:</b>
							</p>
							<p>
								<xsl:value-of select="." />
							</p>
						</xsl:if>
					</xsl:for-each>
					<xsl:for-each select="gmd:rationale">
						<xsl:if test="string-length( . )">
							<p>
								<b>Rationale:</b>
							</p>
							<p>
								<xsl:value-of select="." />
							</p>
						</xsl:if>
					</xsl:for-each>
					<xsl:for-each select="gmd:source">
						<xsl:if test="string-length( . )">
							<p>
								<b>Source:</b>
							</p>
							<blockquote>
								<xsl:call-template name="CI_ResponsibleParty">
									<xsl:with-param name="element" select="gmd:CI_ResponsibleParty" />
								</xsl:call-template>
							</blockquote>
						</xsl:if>
					</xsl:for-each>
				</blockquote>
			
		</xsl:for-each>
	</xsl:template>
</xsl:stylesheet>