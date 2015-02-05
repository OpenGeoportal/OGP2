<?xml version="1.0" encoding="utf-8"?>

<xsl:stylesheet version="2.0"
	xmlns:xsl="http://www.w3.org/1999/XSL/Transform" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
	xmlns:gco="http://www.isotc211.org/2005/gco" xmlns:gmd="http://www.isotc211.org/2005/gmd"
	xmlns:gmi="http://www.isotc211.org/2005/gmi" xmlns:gmx="http://www.isotc211.org/2005/gmx"
	xmlns:gsr="http://www.isotc211.org/2005/gsr" xmlns:gss="http://www.isotc211.org/2005/gss"
	xmlns:gts="http://www.isotc211.org/2005/gts" xmlns:srv="http://www.isotc211.org/2005/srv"
	xmlns:gml="http://www.opengis.net/gml/3.2" xmlns:xlink="http://www.w3.org/1999/xlink"
	xmlns:xs="http://www.w3.org/2001/XMLSchema">

	<!-- DATA_QUALITY_INFORMATION: ******************************************** -->

	<xsl:template match="gmd:dataQualityInfo/gmd:DQ_DataQuality">
		
		<h3>
			<a name="Data_Quality_Information"></a>
			Data Quality Information:
		</h3>
		<xsl:apply-templates select="gmd:scope" />
		<xsl:if test="string-length( gmd:report )">
			<h4>Reports:</h4>
			<xsl:apply-templates select="gmd:report" />
		</xsl:if>
		<xsl:apply-templates select="gmd:lineage" />

	</xsl:template>

	<xsl:template match="gmd:scope">
		<xsl:if test="string-length( . )">
			<h4>Scope:</h4>
			<p>
				<xsl:value-of select="." />
			</p>
		</xsl:if>
	</xsl:template>

	<xsl:template match="gmd:report">
		<xsl:for-each select="gmd:DQ_CompletenessCommission">
			<p>
				<b>
					<i>Completeness Commission:</i>
				</b>
			</p>
			<blockquote>
				<p>
					<b>Evaluation Method Description:</b>
				</p>
				<p>
					<xsl:value-of select="gmd:evaluationMethodDescription" />
				</p>
				<xsl:if test="string-length( gmd:result )">
					<p>
						<b>Result:</b>
					</p>
					<p>
						<xsl:value-of select="gmd:result" />
					</p>
				</xsl:if>
			</blockquote>
		</xsl:for-each>
		<xsl:for-each select="gmd:DQ_CompletenessOmission">
			<p>
				<b>
					<i>Completeness Omission:</i>
				</b>
			</p>
			<blockquote>
				<p>
					<b>Evaluation Method Description:</b>
				</p>
				<p>
					<xsl:value-of select="gmd:evaluationMethodDescription" />
				</p>
				<xsl:if test="string-length( gmd:result )">
					<p>
						<b>Result:</b>
					</p>
					<p>
						<xsl:value-of select="gmd:result" />
					</p>
				</xsl:if>
			</blockquote>
		</xsl:for-each>
		<xsl:for-each select="gmd:DQ_ConceptualConsistency">
			<p>
				<b>
					<i>Conceptual Consistency:</i>
				</b>
			</p>
			<blockquote>
				<p>
					<b>Measure Description:</b>
				</p>
				<p>
					<xsl:value-of select="gmd:measureDescription" />
				</p>
				<xsl:if test="string-length( gmd:result )">
					<p>
						<b>Result:</b>
					</p>
					<p>
						<xsl:value-of select="gmd:result" />
					</p>
				</xsl:if>
			</blockquote>
		</xsl:for-each>
	</xsl:template>

	<xsl:template match="gmd:lineage">
		<xsl:for-each select="gmd:LI_Lineage">
			<h4>Lineage:</h4>
			<xsl:for-each select="gmd:processStep/gmd:LI_ProcessStep">
				<p>
					<b>
						<i>Process Step:</i>
					</b>
				</p>
				<p>
					<xsl:value-of select="gmd:description" />
				</p>
				<blockquote>
					<xsl:for-each select="gmd:dateTime">
						<xsl:if test="string-length( . )">
							<p>
								<b>Date And Time: </b>
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
				</blockquote>
			</xsl:for-each>
			<xsl:for-each select="gmd:statement">
				<p>
					<b>
						<i>Statement:</i>
					</b>
				</p>
				<p>
					<xsl:value-of select="." />
				</p>
			</xsl:for-each>
		</xsl:for-each>
	</xsl:template>
</xsl:stylesheet>