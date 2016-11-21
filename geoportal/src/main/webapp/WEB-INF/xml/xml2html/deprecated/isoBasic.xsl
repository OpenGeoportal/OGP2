<?xml version="1.0" encoding="utf-8"?>
<xsl:stylesheet xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
	version="2.0" xmlns:gco="http://www.isotc211.org/2005/gco" xmlns:gmd="http://www.isotc211.org/2005/gmd"
	xmlns:srv="http://www.isotc211.org/2005/srv" xmlns:gml="http://www.opengis.net/gml/3.2"
	xmlns:gts="http://www.isotc211.org/2005/gts" xmlns:xlink="http://www.w3.org/1999/xlink"
	xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
	<xsl:template match="/">
		<a name="Top" />
		<xsl:for-each select="//gmd:citation/gmd:CI_Citation/gmd:title">
			<h1>
				<xsl:value-of select="gco:CharacterString" />
			</h1>
		</xsl:for-each>
		<xsl:for-each select="//gmd:MD_DataIdentification/gmd:abstract">
			<h4>Abstract:</h4>
			<p>
				<xsl:value-of select="gco:CharacterString" />
			</p>
		</xsl:for-each>

		<!--Create keywords indices (keys) so that we can do a unique sort below: -->

		<p>
			<b>
				<i>Keywords:</i>
			</b>
		</p>
		<xsl:for-each select="//gmd:descriptiveKeywords/gmd:MD_Keywords">
			<xsl:for-each select="gmd:keyword">
				<xsl:value-of select="gco:CharacterString" />
				<br />
			</xsl:for-each>
		</xsl:for-each>

		<!-- CONTENT_INFORMATION: ************************************************* -->
		<h4>Extent Information:</h4>
		<xsl:for-each select="//gmd:extent/gmd:EX_Extent">
			<b>
				<i>Spatial Temporal Extent:</i>
			</b>
			<blockquote>
				<xsl:for-each select="gmd:geographicElement">
					<b>Geographic Element:</b>
					<blockquote>
						<b>Bounding Coordinates:</b>
						<blockquote>
							<xsl:comment>
								Area to display current cursor lat/lon location:
							</xsl:comment>
							<div id="message" class="SmallTextGray">&#160;</div>
							<b>Westbound Longitude: </b>
							<xsl:call-template name="strip-digits">
								<xsl:with-param name="element"
									select="gmd:EX_GeographicBoundingBox/gmd:westBoundLongitude/gco:Decimal" />
								<xsl:with-param name="num-digits" select="5" />
							</xsl:call-template>
							&#176;
							<br />
							<b>Eastbound Longitude: </b>
							<xsl:call-template name="strip-digits">
								<xsl:with-param name="element"
									select="gmd:EX_GeographicBoundingBox/gmd:eastBoundLongitude/gco:Decimal" />
								<xsl:with-param name="num-digits" select="5" />
							</xsl:call-template>
							&#176;
							<br />
							<b>Southbound Latitude: </b>
							<xsl:call-template name="strip-digits">
								<xsl:with-param name="element"
									select="gmd:EX_GeographicBoundingBox/gmd:southBoundLatitude/gco:Decimal" />
								<xsl:with-param name="num-digits" select="5" />
							</xsl:call-template>
							&#176;
							<br />
							<b>Northbound Latitude: </b>
							<xsl:call-template name="strip-digits">
								<xsl:with-param name="element"
									select="gmd:EX_GeographicBoundingBox/gmd:northBoundLatitude/gco:Decimal" />
								<xsl:with-param name="num-digits" select="5" />
							</xsl:call-template>
							&#176;
							<br />
						</blockquote>
					</blockquote>
				</xsl:for-each>

				<xsl:for-each select="gmd:verticalElement">
					<xsl:if
						test="gmd:EX_VerticalExtent/gmd:minimumValue != 0 or gmd:EX_VerticalExtent/gmd:maximumValue != 0">
						<p>
							<b>Vertical Element:</b>
						</p>
						<blockquote>
							<b>Minimum Value: </b>
							<xsl:call-template name="strip-digits">
								<xsl:with-param name="element"
									select="gmd:EX_VerticalExtent/gmd:minimumValue" />
								<xsl:with-param name="num-digits" select="5" />
							</xsl:call-template>
							<br />
							<b>Maximum Value: </b>
							<xsl:call-template name="strip-digits">
								<xsl:with-param name="element"
									select="gmd:EX_VerticalExtent/gmd:maximumValue" />
								<xsl:with-param name="num-digits" select="5" />
							</xsl:call-template>
							<br />
							<xsl:choose>
								<xsl:when
									test="string-length( gmd:EX_VerticalExtent/gmd:verticalCRS )">
									<b>Coordinate Reference System (CRS): </b>
									<xsl:value-of select="gmd:EX_VerticalExtent/gmd:verticalCRS" />
									<br />
								</xsl:when>
								<xsl:otherwise>
									<b>Coordinate Reference System (CRS): </b>
									<xsl:value-of
										select="gmd:EX_VerticalExtent/gmd:verticalCRS/@gco:nilReason" />
									<br />
								</xsl:otherwise>
							</xsl:choose>
						</blockquote>
					</xsl:if>
				</xsl:for-each>
			</blockquote>
		</xsl:for-each>

		<xsl:for-each select="//gmd:pointOfContact">
			<h4>Contact:</h4>
			<p>
				<xsl:for-each select="gmd:CI_ResponsibleParty/gmd:role">
					<xsl:value-of select="gmd:CI_RoleCode/@codeListValue" />
					<br />
				</xsl:for-each>
				<xsl:for-each select="gmd:CI_ResponsibleParty/gmd:organisationName">
					<xsl:value-of select="gco:CharacterString" />
					<br />
				</xsl:for-each>
				<xsl:for-each select="gmd:CI_ResponsibleParty/gmd:individualName">
					<xsl:value-of select="gco:CharacterString" />
					<br />
				</xsl:for-each>
				<xsl:for-each
					select="gmd:CI_ResponsibleParty/gmd:contactInfo/gmd:CI_Contact">
					<br />

					<xsl:for-each select="gmd:phone/gmd:CI_Telephone/gmd:voice">
						<xsl:value-of select="gco:CharacterString" />
						<br />
					</xsl:for-each>

					<xsl:for-each
						select="gmd:address/gmd:CI_Address/gmd:electronicMailAddress">
						<i>
							<xsl:value-of select="gco:CharacterString" />
						</i>
						<br />
					</xsl:for-each>
				</xsl:for-each>
			</p>
		</xsl:for-each>


	</xsl:template>
	<xsl:template name="strip-digits">
		<xsl:param name="element" />
		<xsl:param name="num-digits" />
		<xsl:choose>
			<xsl:when test="contains( $element, '.' )">
				<xsl:variable name="element-uc" select="translate( $element, 'e', 'E' )" />
				<xsl:choose>
					<xsl:when test="contains( $element-uc, 'E' )">
						<xsl:variable name="before-exponent"
							select="substring-before( $element-uc, 'E' )" />
						<xsl:variable name="exponent"
							select="substring-after( $element-uc, 'E' )" />
						<xsl:variable name="before-decimal"
							select="substring-before( $before-exponent, '.' )" />
						<xsl:variable name="after-decimal"
							select="substring-after( $before-exponent, '.' )" />
						<xsl:variable name="after-decimal-stripped"
							select="substring( $after-decimal, 1, $num-digits )" />
						<xsl:value-of
							select="concat( $before-decimal, '.', $after-decimal-stripped, 'E', $exponent )" />
					</xsl:when>
					<xsl:otherwise>
						<xsl:variable name="before-decimal"
							select="substring-before( $element, '.' )" />
						<xsl:variable name="after-decimal" select="substring-after( $element, '.' )" />
						<xsl:variable name="after-decimal-stripped"
							select="substring( $after-decimal, 1, $num-digits )" />
						<xsl:value-of
							select="concat( $before-decimal, '.', $after-decimal-stripped )" />
					</xsl:otherwise>
				</xsl:choose>
			</xsl:when>
			<xsl:otherwise>
				<xsl:value-of select="$element" />
			</xsl:otherwise>
		</xsl:choose>
	</xsl:template>
</xsl:stylesheet>
