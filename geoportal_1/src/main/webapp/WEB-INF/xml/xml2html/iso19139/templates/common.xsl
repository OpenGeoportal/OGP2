<?xml version="1.0" encoding="utf-8"?>
<xsl:stylesheet version="1.0"
	xmlns:xsl="http://www.w3.org/1999/XSL/Transform" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
	xmlns:gco="http://www.isotc211.org/2005/gco" xmlns:gmd="http://www.isotc211.org/2005/gmd"
	xmlns:gmi="http://www.isotc211.org/2005/gmi" xmlns:gmx="http://www.isotc211.org/2005/gmx"
	xmlns:gsr="http://www.isotc211.org/2005/gsr" xmlns:gss="http://www.isotc211.org/2005/gss"
	xmlns:gts="http://www.isotc211.org/2005/gts" xmlns:srv="http://www.isotc211.org/2005/srv"
	xmlns:gml="http://www.opengis.net/gml/3.2" xmlns:xlink="http://www.w3.org/1999/xlink"
	xmlns:xs="http://www.w3.org/2001/XMLSchema">
  
	<xsl:import href="../../utils/replace-string.xsl" />
	<xsl:import href="../../utils/common.xsl" />


	
		<!-- template: CI_Citation ************************************************ -->
	
	<xsl:template name="CI_Citation">
		<xsl:param name="level" />
		<div>
			
			<xsl:for-each select="gmd:title">
				<xsl:call-template name="ciElement">
					<xsl:with-param name="level"><xsl:value-of select="$level"/></xsl:with-param>
					<xsl:with-param name="heading">Title</xsl:with-param>
					<xsl:with-param name="content" select="."/>
				</xsl:call-template>
			</xsl:for-each>
			
			
			
			<xsl:for-each select="gmd:alternateTitle">
				<xsl:call-template name="ciElement">
					<xsl:with-param name="level"><xsl:value-of select="$level"/></xsl:with-param>
					<xsl:with-param name="heading">Alternate Title</xsl:with-param>
					<xsl:with-param name="content" select="."/>
				</xsl:call-template>
			</xsl:for-each>
			
			<xsl:for-each select="gmd:date">
				<div>
				<xsl:call-template name="CI_Date">
					<xsl:with-param name="level"><xsl:value-of select="$level"/></xsl:with-param>
				</xsl:call-template>
				</div>
			</xsl:for-each>
			
			<xsl:for-each select="gmd:edition">
				<xsl:call-template name="ciElement">
					<xsl:with-param name="level"><xsl:value-of select="$level"/></xsl:with-param>
					<xsl:with-param name="heading">Edition</xsl:with-param>
					<xsl:with-param name="content" select="."/>
				</xsl:call-template>
			</xsl:for-each>
			
			<xsl:for-each select="gmd:editionDate">
				<xsl:call-template name="ciElement">
					<xsl:with-param name="level"><xsl:value-of select="$level"/></xsl:with-param>
					<xsl:with-param name="heading">Edition Date</xsl:with-param>
					<xsl:with-param name="content">
						<xsl:call-template name="date">
							<xsl:with-param name="element" select="." />
						</xsl:call-template>
				</xsl:with-param>
				</xsl:call-template>
			</xsl:for-each>
			
			<xsl:for-each select="gmd:identifier">
				<xsl:call-template name="ciElement">
					<xsl:with-param name="level"><xsl:value-of select="$level"/></xsl:with-param>
					<xsl:with-param name="heading">Identifier</xsl:with-param>
					<xsl:with-param name="isText" select="false()" />

					<xsl:with-param name="content">
						<xsl:if test="gmd:MD_Identifier/gmd:code">
							<span><xsl:value-of select="gmd:MD_Identifier/gmd:code" /></span>
						</xsl:if>
						<xsl:if test="gmd:MD_Identifier/gmd:authority">
							<div>
								<xsl:call-template name="elementHeader">
									<xsl:with-param name="level"><xsl:value-of select="$level + 1"/></xsl:with-param>
									<xsl:with-param name="heading">Authority:</xsl:with-param>
								</xsl:call-template>
								<div class="inline">
									<xsl:value-of select="gmd:MD_Identifier/gmd:authority" />
								</div>
							</div>
						</xsl:if>
					
					</xsl:with-param>
				</xsl:call-template>
				
			</xsl:for-each>
			
			<xsl:for-each select="gmd:citedResponsibleParty/gmd:CI_ResponsibleParty">
				<xsl:call-template name="CI_ResponsibleParty">
					<xsl:with-param name="level" select="$level" />
				</xsl:call-template>
			</xsl:for-each>
			
			<xsl:for-each select="gmd:presentationForm">
				<xsl:call-template name="ciElement">
					<xsl:with-param name="level"><xsl:value-of select="$level"/></xsl:with-param>
					<xsl:with-param name="heading">Presentation Form</xsl:with-param>
					<xsl:with-param name="content" select="."/>
				</xsl:call-template>
			</xsl:for-each>
			
			<xsl:for-each select="gmd:series">
				<xsl:call-template name="ciElement">
					<xsl:with-param name="level"><xsl:value-of select="$level"/></xsl:with-param>
					<xsl:with-param name="heading">Series</xsl:with-param>
					<xsl:with-param name="content" select="."/>
				</xsl:call-template>
			</xsl:for-each>
			
			<xsl:for-each select="gmd:otherCitationDetails">
				<xsl:call-template name="ciElement">
					<xsl:with-param name="level"><xsl:value-of select="$level"/></xsl:with-param>
					<xsl:with-param name="heading">Other Citation Details</xsl:with-param>
					<xsl:with-param name="content" select="."/>
				</xsl:call-template>
			</xsl:for-each>
		</div>
	</xsl:template>

	<xsl:template match="gmd:language">
		<xsl:value-of select="." />
	</xsl:template>
	
	<xsl:template match="gmd:characterSet">
			<xsl:value-of select="." />
	</xsl:template>
	
	<!-- template: CI_Date **************************************************** -->

	<xsl:template name="CI_Date">
		<xsl:param name="level" />
		
		<xsl:if
			test="string-length( ./gmd:CI_Date/gmd:date ) and ./gmd:CI_Date/gmd:dateType/gmd:CI_DateTypeCode != 'issued' and ./gmd:CI_Date/gmd:dateType/gmd:CI_DateTypeCode != 'revision'">
			<xsl:call-template name="elementHeader">
				<xsl:with-param name="level"><xsl:value-of select="$level"/></xsl:with-param>
				<xsl:with-param name="heading">
					<xsl:if test="string-length( ./gmd:CI_Date/gmd:dateType/gmd:CI_DateTypeCode )">
						<xsl:value-of select="./gmd:CI_Date/gmd:dateType" />
					</xsl:if>
					Date:
				</xsl:with-param>
			</xsl:call-template>
			<div class="inline">
			<xsl:call-template name="date">
				<xsl:with-param name="element" select="./gmd:CI_Date/gmd:date/gco:Date" />
			</xsl:call-template>
			</div>
		</xsl:if>
	</xsl:template>

	<!-- template: CI_ResponsibleParty **************************************** -->

	<xsl:template name="CI_ResponsibleParty">
		<xsl:param name="level" />
		<!-- gmd:role is required -->

				<xsl:call-template name="ciElement">
					<xsl:with-param name="level"><xsl:value-of select="$level"/></xsl:with-param>
					<xsl:with-param name="heading" select="gmd:role"/>
					<xsl:with-param name="content">
						<xsl:for-each select="gmd:individualName | gmd:positionName | gmd:organisationName">
							<xsl:value-of select="."/>
							<xsl:if test="position() != last()">
								<xsl:text>, </xsl:text>
							</xsl:if>
						</xsl:for-each>
					</xsl:with-param>
				</xsl:call-template>


		
			<xsl:if test="gmd:contactInfo/gmd:CI_Contact">
				
				<xsl:call-template name="CI_Contact">
					<xsl:with-param name="level"><xsl:value-of select="$level + 1"/></xsl:with-param>
				</xsl:call-template>
			</xsl:if>

			
	</xsl:template>

	<!-- template: CI_Contact ************************************************* -->

	<xsl:template name="CI_Contact">
		<xsl:param name="level" />
		<div class="contactInfo">
		<xsl:for-each select="gmd:contactInfo/gmd:CI_Contact/gmd:address/gmd:CI_Address">
			<div class="address">
				<xsl:call-template name="CI_Address"/>		
			</div>
		</xsl:for-each>
		<xsl:for-each select="gmd:contactInfo/gmd:CI_Contact/gmd:phone/gmd:CI_Telephone">
			<div class="phone">
			<xsl:call-template name="CI_Telephone">
				<xsl:with-param name="level"><xsl:value-of select="$level"/></xsl:with-param>
			</xsl:call-template>
			</div>
		</xsl:for-each>

		<xsl:for-each select="gmd:contactInfo/gmd:CI_Contact/gmd:onlineResource/gmd:CI_OnlineResource">
			<div class="link">
			<xsl:call-template name="CI_OnlineResource">
				<xsl:with-param name="level"><xsl:value-of select="$level"/></xsl:with-param>
			</xsl:call-template>
			</div>
		</xsl:for-each>
		</div>
	</xsl:template>

	<!-- template: CI_Telephone *********************************************** -->

	<xsl:template name="CI_Telephone">
		<xsl:param name="level" />

				<xsl:for-each select="gmd:voice">
					<xsl:if test="string-length( . )">
						<xsl:value-of select="."/>
					</xsl:if>
				</xsl:for-each>
				<xsl:for-each select="gmd:facsimile">
					<xsl:if test="string-length( . )">
						<xsl:call-template name="ciElement">
							<xsl:with-param name="level"><xsl:value-of select="$level + 1"/></xsl:with-param>
							<xsl:with-param name="heading">Fax</xsl:with-param>
							<xsl:with-param name="content" select="."/>
						</xsl:call-template>
					</xsl:if>
				</xsl:for-each>

	</xsl:template>

	<!-- template: CI_Address ************************************************* -->

	<xsl:template name="CI_Address">

				<xsl:if test="string-length( gmd:deliveryPoint )">
					<div>
						<xsl:value-of select="gmd:deliveryPoint"/>
					</div>
				</xsl:if>
				<xsl:if test="string-length( gmd:city ) or string-length( gmd:administrativeArea ) or string-length( gmd:postalCode )">
					<div>
						<xsl:value-of select="gmd:city"/>
						<xsl:text>, </xsl:text>
						<xsl:value-of select="gmd:administrativeArea"/>
						<xsl:text disable-output-escaping="yes">&amp;nbsp;</xsl:text>
						<xsl:value-of select="gmd:postalCode"/>
					</div>
				</xsl:if>

				<xsl:if test="string-length( gmd:country )">
					<div>
						<xsl:value-of select="gmd:country"/>
					</div>
				</xsl:if>
				<xsl:if test="string-length( gmd:electronicMailAddress )">
					<div>
						<a href="mailto:{gmd:electronicMailAddress/gco:CharacterString}">
						<xsl:value-of select="gmd:electronicMailAddress" />
					</a>
					</div>
				</xsl:if>
	</xsl:template>

	<!-- template: CI_OnlineResource ****************************************** -->

	<xsl:template name="CI_OnlineResource">
		<xsl:param name="level" />
		
		<xsl:if test="string-length( gmd:linkage )">
		
		<xsl:call-template name="elementHeader">
			<xsl:with-param name="heading">Online Resource</xsl:with-param>
			<xsl:with-param name="level"><xsl:value-of select="$level"/></xsl:with-param>
		</xsl:call-template>
		
					<xsl:choose>
						<xsl:when test="gmd:linkage != 'Unknown'">
							<xsl:variable name="url">
								<!-- Replace PacIOOS internal URL with external proxy: -->
								<xsl:call-template name="replace-string">
									<xsl:with-param name="element"
										select="gmd:linkage/gmd:URL" />
									<xsl:with-param name="old-string">
										lawelawe.soest.hawaii.edu:8080
									</xsl:with-param>
									<xsl:with-param name="new-string">
										oos.soest.hawaii.edu
									</xsl:with-param>
								</xsl:call-template>
							</xsl:variable>
							<span>
								<b>Linkage: </b>
							</span>
							<a href="{$url}">
								<div class="wrapline">
									<xsl:value-of select="$url" />
								</div>
							</a>
						</xsl:when>
						<xsl:otherwise>
							<b>Linkage: </b>
							<xsl:value-of select="gmd:linkage" />
							<br />
						</xsl:otherwise>
					</xsl:choose>
					<xsl:if test="string-length( gmd:name/gco:CharacterString )">
						<b>Name: </b>
						<xsl:value-of select="gmd:name" />
						<br />
					</xsl:if>
					<xsl:if
						test="string-length( gmd:description/gco:CharacterString )">
						<b>Description: </b>
						<xsl:value-of select="gmd:description" />
						<br />
					</xsl:if>
					<xsl:if test="string-length( gmd:function )">
						<xsl:variable name="codeList"
							select="substring-after( gmd:function/gmd:CI_OnLineFunctionCode/@codeList, '#' )" />
						<xsl:variable name="codeListShortName">
							<xsl:choose>
								<xsl:when test="contains( $codeList, ':' )">
									<xsl:value-of select="substring-after( $codeList, ':' )" />
								</xsl:when>
								<xsl:otherwise>
									<xsl:value-of select="$codeList" />
								</xsl:otherwise>
							</xsl:choose>
						</xsl:variable>
						<b>Function: </b>
						<xsl:value-of select="gmd:function" />
						(
						<a
							href="http://pacioos.org/metadata/gmxCodelists.html#{$codeListShortName}">
							<xsl:value-of select="$codeListShortName" />
						</a>
						)
						<br />
					</xsl:if>

		</xsl:if>
	</xsl:template>

	<!-- template: MD_TaxonCl (recursive) ************************************* -->

	<xsl:template match="gmd:taxonCl/gmd:MD_TaxonCl">
		<div class="indent1">
			<xsl:choose>
				<xsl:when test="string-length( gmd:taxonrv )">
					<b>
						<xsl:value-of select="gmd:taxonrn/gco:CharacterString" />
						:
					</b>
					<xsl:value-of select="gmd:taxonrv" />
				</xsl:when>
				<xsl:otherwise>
					<b>
						<xsl:value-of select="gmd:taxonrn/gco:CharacterString" />
						:
					</b>
					<xsl:value-of select="gmd:taxonrv/@gco:nilReason" />
				</xsl:otherwise>
			</xsl:choose>
			<xsl:for-each select="gmd:common">
				<div class="indent1">
					<b>Common Name: </b>
					<xsl:value-of select="." />
				</div>
			</xsl:for-each>
			<xsl:apply-templates select="gmd:taxonCl/gmd:MD_TaxonCl" />
		</div>
	</xsl:template>

	<!-- template: date ******************************************************* -->

	<xsl:template name="date">
		<!-- <xsl:param name="element" /> -->
		<xsl:value-of select="name()"/>
		<!--  <xsl:variable name="element"><xsl:value-of select="."/></xsl:variable>
		<xsl:choose>
			<xsl:when test="contains( $element, 'known' )">
				<xsl:value-of select="$element" />
			</xsl:when>
			
			<xsl:otherwise>
				<xsl:variable name="year" select="substring($element, 1, 4)" />
				<xsl:variable name="month" select="substring($element, 6, 2)" />
				<xsl:variable name="day" select="substring($element, 9, 2)" />
				<xsl:if test="$month = '01'">
					<xsl:text>January </xsl:text>
				</xsl:if>
				<xsl:if test="$month = '02'">
					<xsl:text>February </xsl:text>
				</xsl:if>
				<xsl:if test="$month = '03'">
					<xsl:text>March </xsl:text>
				</xsl:if>
				<xsl:if test="$month = '04'">
					<xsl:text>April </xsl:text>
				</xsl:if>
				<xsl:if test="$month = '05'">
					<xsl:text>May </xsl:text>
				</xsl:if>
				<xsl:if test="$month = '06'">
					<xsl:text>June </xsl:text>
				</xsl:if>
				<xsl:if test="$month = '07'">
					<xsl:text>July </xsl:text>
				</xsl:if>
				<xsl:if test="$month = '08'">
					<xsl:text>August </xsl:text>
				</xsl:if>
				<xsl:if test="$month = '09'">
					<xsl:text>September </xsl:text>
				</xsl:if>
				<xsl:if test="$month = '10'">
					<xsl:text>October </xsl:text>
				</xsl:if>
				<xsl:if test="$month = '11'">
					<xsl:text>November </xsl:text>
				</xsl:if>
				<xsl:if test="$month = '12'">
					<xsl:text>December </xsl:text>
				</xsl:if>
				<xsl:if test="string-length( $day )">
					<xsl:choose>
						<xsl:when test="$day = '01'">
							<xsl:variable name="daydisplay" select="'1'" />
							<xsl:value-of select="$daydisplay" />
							<xsl:text>, </xsl:text>
						</xsl:when>
						<xsl:when test="$day = '02'">
							<xsl:variable name="daydisplay" select="'2'" />
							<xsl:value-of select="$daydisplay" />
							<xsl:text>, </xsl:text>
						</xsl:when>
						<xsl:when test="$day = '03'">
							<xsl:variable name="daydisplay" select="'3'" />
							<xsl:value-of select="$daydisplay" />
							<xsl:text>, </xsl:text>
						</xsl:when>
						<xsl:when test="$day = '04'">
							<xsl:variable name="daydisplay" select="'4'" />
							<xsl:value-of select="$daydisplay" />
							<xsl:text>, </xsl:text>
						</xsl:when>
						<xsl:when test="$day = '05'">
							<xsl:variable name="daydisplay" select="'5'" />
							<xsl:value-of select="$daydisplay" />
							<xsl:text>, </xsl:text>
						</xsl:when>
						<xsl:when test="$day = '06'">
							<xsl:variable name="daydisplay" select="'6'" />
							<xsl:value-of select="$daydisplay" />
							<xsl:text>, </xsl:text>
						</xsl:when>
						<xsl:when test="$day = '07'">
							<xsl:variable name="daydisplay" select="'7'" />
							<xsl:value-of select="$daydisplay" />
							<xsl:text>, </xsl:text>
						</xsl:when>
						<xsl:when test="$day = '08'">
							<xsl:variable name="daydisplay" select="'8'" />
							<xsl:value-of select="$daydisplay" />
							<xsl:text>, </xsl:text>
						</xsl:when>
						<xsl:when test="$day = '09'">
							<xsl:variable name="daydisplay" select="'9'" />
							<xsl:value-of select="$daydisplay" />
							<xsl:text>, </xsl:text>
						</xsl:when>
						<xsl:otherwise>
							<xsl:value-of select="$day" />
							<xsl:text>, </xsl:text>
						</xsl:otherwise>
					</xsl:choose>
				</xsl:if>
				<xsl:value-of select="$year" />
			</xsl:otherwise>
		</xsl:choose>
		-->
	</xsl:template>
	</xsl:stylesheet>