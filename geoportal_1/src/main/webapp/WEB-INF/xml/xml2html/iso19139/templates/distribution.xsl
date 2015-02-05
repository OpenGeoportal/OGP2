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
	
	<!-- DISTRIBUTION_INFORMATION: ******************************************** -->

	<xsl:template match="gmd:distributionInfo/gmd:MD_Distribution">
		
		<h3>
			<a name="Distribution_Information"></a>
			Distribution Information:
		</h3>
		<xsl:apply-templates select="gmd:distributor" />
		<xsl:apply-templates select="gmd:distributionFormat" />
		<xsl:apply-templates select="gmd:transferOptions" />

	</xsl:template>

	<xsl:template match="gmd:distributor">
		<h4>Distributor:</h4>
			<xsl:for-each select="gmd:MD_Distributor/gmd:distributorContact">
				<p>
					<b>
						<i>Distributor Contact:</i>
					</b>
				</p>
				<blockquote>
					<xsl:call-template name="CI_ResponsibleParty">
						<xsl:with-param name="element" select="gmd:CI_ResponsibleParty" />
						<xsl:with-param name="italicize-heading" select="false()" />
					</xsl:call-template>
				</blockquote>
			</xsl:for-each>
			<xsl:for-each select="gmd:MD_Distributor/gmd:distributionOrderProcess">
				<p>
					<b>
						<i>Distribution Order Process:</i>
					</b>
				</p>
				<blockquote>
					<xsl:for-each select="gmd:MD_StandardOrderProcess">
						<p>
							<b>Standard Order Process:</b>
						</p>
						<blockquote>
							<xsl:for-each select="gmd:fees">
								<p>
									<b>Fees: </b>
									<xsl:value-of select="." />
								</p>
							</xsl:for-each>
						</blockquote>
					</xsl:for-each>
				</blockquote>
			</xsl:for-each>
			<xsl:if test="string-length( gmd:MD_Distributor/gmd:distributorFormat )">
				<p>
					<b>
						<i>Distributor Formats:</i>
					</b>
				</p>
				<blockquote>
					<xsl:apply-templates select="gmd:MD_Distributor/gmd:distributorFormat" />
				</blockquote>
			</xsl:if>
			<xsl:if
				test="string-length( gmd:MD_Distributor/gmd:distributorTransferOptions )">
				<p>
					<b>
						<i>Distributor Transfer Options:</i>
					</b>
				</p>
				<xsl:apply-templates
					select="gmd:MD_Distributor/gmd:distributorTransferOptions" />
			</xsl:if>
		
	</xsl:template>

	<xsl:template match="gmd:distributorFormat">
		<b>Name: </b>
		<xsl:value-of select="gmd:MD_Format/gmd:name" />
		<br />
		<xsl:choose>
			<xsl:when test="string-length( gmd:MD_Format/gmd:version )">
				<b>Version: </b>
				<xsl:value-of select="gmd:MD_Format/gmd:version" />
				<br />
			</xsl:when>
			<xsl:otherwise>
				<b>Version: </b>
				<xsl:value-of select="gmd:MD_Format/gmd:version/@gco:nilReason" />
				<br />
			</xsl:otherwise>
		</xsl:choose>
	</xsl:template>

	<xsl:template match="gmd:distributorTransferOptions">
		<xsl:call-template name="CI_OnlineResource">
			<xsl:with-param name="element"
				select="gmd:MD_DigitalTransferOptions/gmd:onLine/gmd:CI_OnlineResource" />
		</xsl:call-template>
	</xsl:template>

	<xsl:template match="gmd:distributionFormat">
		<h4>Distribution Format:</h4>
	
			<xsl:for-each select="gmd:MD_Format">
				<p>
					<b>
						<i>Data File Format:</i>
					</b>
				</p>
				<blockquote>
					<xsl:if test="string-length( gmd:name )">
						<b>Name: </b>
						<xsl:value-of select="gmd:name" />
						<br />
					</xsl:if>
					<xsl:if test="string-length( gmd:version )">
						<b>Version: </b>
						<xsl:value-of select="gmd:version" />
						<br />
					</xsl:if>
					<xsl:if test="string-length( gmd:specification )">
						<b>Specification: </b>
						<xsl:value-of select="gmd:specification" />
						<br />
					</xsl:if>
				</blockquote>
			</xsl:for-each>

	</xsl:template>

	<xsl:template match="gmd:transferOptions">
		<h4>Digital Transfer Options:</h4>
		<xsl:for-each select="gmd:MD_DigitalTransferOptions">
			<xsl:for-each select="gmd:transferSize">
				<p>
					<b>
						<i>Transfer Size:</i>
					</b>
					<xsl:value-of select="." />
					MB
				</p>
			</xsl:for-each>
			<xsl:if test="gmd:onLine">
				<p>
					<b>
						<i>Online Transfer Options:</i>
					</b>
				</p>
			</xsl:if>
			<xsl:for-each select="gmd:onLine">
				<blockquote>
					<p>
						<b>Online Resource:</b>
					</p>
					<blockquote>
						<xsl:for-each select="gmd:CI_OnlineResource">
							<xsl:call-template name="CI_OnlineResource">
								<xsl:with-param name="element" select="." />
							</xsl:call-template>
						</xsl:for-each>
					</blockquote>
				</blockquote>
			</xsl:for-each>
			<xsl:if test="gmd:offLine">
				<p>
					<b>
						<i>Offline Transfer Options:</i>
					</b>
				</p>
			</xsl:if>
			<xsl:for-each select="gmd:offLine">
				<blockquote>
					<p>
						<b>Offline Resource:</b>
					</p>
					<blockquote>
						<xsl:for-each select="gmd:MD_Medium">
							<p>
								<xsl:if test="string-length( gmd:name )">
									<b>Name: </b>
									<xsl:value-of select="gmd:name" />
									<br />
								</xsl:if>
								<xsl:apply-templates select="name" />
								<xsl:if test="string-length( gmd:density )">
									<b>Density: </b>
									<xsl:value-of select="gmd:density" />
									<br />
								</xsl:if>
								<xsl:if test="string-length( gmd:densityUnits )">
									<b>Density Units: </b>
									<xsl:value-of select="gmd:densityUnits" />
									<br />
								</xsl:if>
								<xsl:if test="string-length( gmd:mediumName )">
									<b>Medium Name: </b>
									<xsl:value-of select="gmd:mediumName" />
									<br />
								</xsl:if>
								<xsl:if test="string-length( gmd:mediumFormat )">
									<b>Medium Format: </b>
									<xsl:value-of select="gmd:mediumFormat" />
									<br />
								</xsl:if>
							</p>
						</xsl:for-each>
					</blockquote>
				</blockquote>
			</xsl:for-each>
		</xsl:for-each>
	</xsl:template>
	
	
	<!-- ACQUISITION_INFORMATION: ********************************************* -->

	<xsl:template
		match="gmd:acquisitionInformation/gmi:MI_AcquisitionInformation">
		
		<h3>
			<a name="Acquisition_Information"></a>
			Acquisition Information:
		</h3>
		<xsl:apply-templates select="gmd:instrument" />
		<xsl:apply-templates select="gmd:platform" />
	</xsl:template>

	<xsl:template match="gmd:instrument">
		<h4>Instrument Information:</h4>
		
			<xsl:for-each select="gmd:MI_Instrument">
				<p>
					<b>
						<i>Instrument:</i>
					</b>
				</p>
				<blockquote>
					<xsl:for-each select="gmd:identifier">
						<b>Identifier: </b>
						<xsl:value-of select="." />
						<br />
					</xsl:for-each>
					<xsl:for-each select="gmd:type">
						<b>Type: </b>
						<xsl:value-of select="." />
						<br />
					</xsl:for-each>
				</blockquote>
			</xsl:for-each>
		
	</xsl:template>

	<xsl:template match="gmd:platform">
		<h4>Platform Information:</h4>
		
			<xsl:for-each select="gmd:MI_Platform">
				<p>
					<b>
						<i>Platform:</i>
					</b>
				</p>
				<blockquote>
					<xsl:for-each select="gmd:identifier">
						<b>Identifier: </b>
						<xsl:value-of select="." />
						<br />
					</xsl:for-each>
					<xsl:for-each select="gmd:description">
						<b>Description: </b>
						<xsl:value-of select="." />
						<br />
					</xsl:for-each>
					<xsl:for-each select="gmd:instrument">
						<b>Instrument: </b>
						<xsl:value-of select="." />
						<br />
					</xsl:for-each>
				</blockquote>
			</xsl:for-each>
		
	</xsl:template>
	
	</xsl:stylesheet>