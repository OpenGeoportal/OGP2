<?xml version="1.0" encoding="utf-8"?>
<xsl:stylesheet version="2.0"
	xmlns:xsl="http://www.w3.org/1999/XSL/Transform" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
	xmlns:gco="http://www.isotc211.org/2005/gco" xmlns:gmd="http://www.isotc211.org/2005/gmd"
	xmlns:gmi="http://www.isotc211.org/2005/gmi" xmlns:gmx="http://www.isotc211.org/2005/gmx"
	xmlns:gsr="http://www.isotc211.org/2005/gsr" xmlns:gss="http://www.isotc211.org/2005/gss"
	xmlns:gts="http://www.isotc211.org/2005/gts" xmlns:srv="http://www.isotc211.org/2005/srv"
	xmlns:gml="http://www.opengis.net/gml/3.2" xmlns:xlink="http://www.w3.org/1999/xlink"
	xmlns:xs="http://www.w3.org/2001/XMLSchema">

	<xsl:import href="../../utils/replace-newlines.xsl" />
	<xsl:import href="../../utils/replace-string.xsl" />
	<xsl:import href="../../utils/strip-digits.xsl" />
	
	<xsl:import href="common.xsl" />
	

	<!-- IDENTIFICATION_INFORMATION: ****************************************** -->

	<xsl:template match="gmd:identificationInfo/gmd:MD_DataIdentification">
		<xsl:if test="gmd:citation">
		<h3 class="subSectionHeader citation">Citation</h3>
		<div class="subSectionContent citation">
			<xsl:apply-templates select="gmd:citation" />
		</div>
		</xsl:if>
		
		<xsl:if test="gmd:abstract">
		<h3 class="subSectionHeader abstract">Abstract</h3>
		<div class="subSectionContent abstract">
			<xsl:apply-templates select="gmd:abstract" />
		</div>
		</xsl:if>
		
		
		<xsl:if test="gmd:purpose">
		<h3 class="subSectionHeader purpose">Purpose</h3>
		<div class="subSectionContent purpose">
			<xsl:apply-templates select="gmd:purpose" />
		</div>	
		</xsl:if>	
		
		<xsl:if test="gmd:credit">
		<h3 class="subSectionHeader credit">Credit</h3>
		<div class="subSectionContent credit">
			<xsl:apply-templates select="gmd:credit" />
		</div>
		</xsl:if>
		
		<xsl:if test="gmd:status">
		<h3 class="subSectionHeader status">Status</h3>
		<div class="subSectionContent status">
			<xsl:apply-templates select="gmd:status" />
		</div>
		</xsl:if>
		
		<xsl:if test="gmd:pointOfContact">
		<h3 class="subSectionHeader pointOfContact">Point of Contact</h3>
		<div class="subSectionContent pointOfContact">
			<xsl:apply-templates select="gmd:pointOfContact" />
		</div>
		</xsl:if>
		
		<xsl:if test="gmd:resourceMaintenance">
		<h3 class="subSectionHeader resourceMaintenance">Resource Maintenance</h3>
		<div class="subSectionContent resourceMaintenance">
			<xsl:apply-templates select="gmd:resourceMaintenance" />
		</div>
		</xsl:if>
		
		<xsl:if test="gmd:graphicOverview">
		<h3 class="subSectionHeader graphicOverview">Graphic Overview</h3>
		<div class="subSectionContent graphicOverview">
			<xsl:apply-templates select="gmd:graphicOverview" />
		</div>
		</xsl:if>
		
		<xsl:if test="gmd:descriptiveKeywords">
		<h3 class="subSectionHeader descriptiveKeywords">Descriptive Keywords</h3>
		<div class="subSectionContent descriptiveKeywords">
			<xsl:apply-templates select="gmd:descriptiveKeywords" />
		</div>
		</xsl:if>
		
		<xsl:if test="gmd:taxonomy">
		<h3 class="subSectionHeader taxonomy">Taxonomy</h3>
		<div class="subSectionContent taxonomy">
			<xsl:apply-templates select="gmd:taxonomy" />
		</div>
		</xsl:if>
		
		<xsl:if test="gmd:aggregationInfo">
		<h3 class="subSectionHeader aggregationInfo">Aggregation Information</h3>
		<div class="subSectionContent aggregationInfo">
			<xsl:apply-templates select="gmd:aggregationInfo" />
		</div>
		</xsl:if>
		
		<xsl:if test="gmd:resourceConstraints">
		<h3 class="subSectionHeader resourceConstraints">Resource Constraints</h3>
		<div class="subSectionContent resourceConstraints">
			<xsl:apply-templates select="gmd:resourceConstraints" />
		</div>
		</xsl:if>
		
		<xsl:if test="gmd:language">
		<h3 class="subSectionHeader language">Language</h3>
		<div class="subSectionContent language">
			<xsl:apply-templates select="gmd:language" />
		</div>	
		</xsl:if>	

		<xsl:if test="gmd:characterSet">
		<h3 class="subSectionHeader characterSet">Character Set</h3>
		<div class="subSectionContent characterSet">
			<xsl:apply-templates select="gmd:characterSet" />
		</div>
		</xsl:if>
				
				
		<xsl:if test="gmd:topicCategory">
		<h3 class="subSectionHeader topicCategory">Topic Categories</h3>
		<div class="subSectionContent topicCategory">
			<xsl:apply-templates select="gmd:topicCategory" />
		</div>
		</xsl:if>

		<xsl:if test="gmd:extent">
		<h3 class="subSectionHeader extent">Extent</h3>
		<div class="subSectionContent extent">
			<xsl:apply-templates select="gmd:extent" />
		</div>
		</xsl:if>
				
		<xsl:if test="gmd:supplementalInformation">
		<h3 class="subSectionHeader supplementalInformation">Supplemental Information</h3>
		<div class="subSectionContent supplementalInformation">
			<xsl:apply-templates select="gmd:supplementalInformation" />
		</div>
		</xsl:if>
	</xsl:template>

<xsl:template match="gmd:topicCategory">
	<xsl:for-each select=".">
		<xsl:sort select="gmd:MD_TopicCategoryCode" />
		<div>
		<xsl:value-of select="gmd:MD_TopicCategoryCode" />
		</div>
	</xsl:for-each>
</xsl:template>

	<xsl:template match="gmd:citation">
			<xsl:for-each select="gmd:CI_Citation">
			<xsl:call-template name="CI_Citation">
				<xsl:with-param name="level" select="4" />
			</xsl:call-template>
			</xsl:for-each>
	</xsl:template>

	<xsl:template match="gmd:abstract">
			<xsl:call-template name="replace-newlines">
				<xsl:with-param name="element" select="gco:CharacterString" />
			</xsl:call-template>
	</xsl:template>

	<xsl:template match="gmd:purpose">
			<xsl:value-of select="." />
	</xsl:template>

	<xsl:template match="gmd:credit">
			<xsl:value-of select="." />
	</xsl:template>

	<xsl:template match="gmd:status">
			<xsl:value-of select="." />
	</xsl:template>

	<xsl:template match="gmd:pointOfContact">
		<xsl:for-each select="gmd:CI_ResponsibleParty">
			<xsl:call-template name="CI_ResponsibleParty">
				<xsl:with-param name="level" select="4" />
			</xsl:call-template>
		</xsl:for-each>
	</xsl:template>

	<xsl:template match="gmd:resourceMaintenance">
		<xsl:for-each select="gmd:MD_MaintenanceInformation">
			<xsl:for-each select="gmd:maintenanceAndUpdateFrequency">
				<h4 title="MD_MaintenanceFrequencyCode">Maintenance and Update Frequency:</h4>
				<div><xsl:value-of select="." /></div>
			</xsl:for-each>
			<xsl:for-each select="gmd:updateScope">
				<h4 title ="MD_ScopeCode">Update Scope:</h4>
				<div>
					<xsl:value-of select="." />
				</div>
			</xsl:for-each>
			<xsl:for-each select="gmd:contact">
				<h4>Contact:</h4>
				<div>
				<xsl:call-template name="CI_ResponsibleParty">
					<xsl:with-param name="level" select="4" />
				</xsl:call-template>
				</div>
			</xsl:for-each>
		</xsl:for-each>
	</xsl:template>

	<xsl:template match="gmd:graphicOverview">
		<xsl:for-each select="gmd:MD_BrowseGraphic">
			<div>
			<xsl:for-each select="gmd:fileName">
				<div>
					<a href="{.}" target="_blank">
						<img src="{.}" class="browse"/>
					</a>
					<br />
					<a href="{.}" target="_blank">View full image</a>
				</div>
				
				<h4>Image File:</h4>
				<div>
					<a href="{.}">
						<xsl:value-of select="." />
					</a>
				</div>
			</xsl:for-each>
			
			<xsl:for-each select="gmd:fileDescription">
				<h4>File Description:</h4>
				<div><xsl:value-of select="." /></div>
			</xsl:for-each>
			
			<xsl:for-each select="gmd:fileType">
				<h4>File Type: </h4>
				<div><xsl:value-of select="." /></div>

			</xsl:for-each>
			</div>
		</xsl:for-each>
	</xsl:template>

	<!--Create keywords indices (keys) so that we can do a unique sort below: -->

	<xsl:key name="values_by_id" match="gmd:keyword" use="gco:CharacterString" />

	<xsl:template match="gmd:descriptiveKeywords">
			<xsl:for-each select="gmd:MD_Keywords">
				<h4></h4>
				<div>
			
					
					<h5><xsl:if test="gmd:type"><xsl:value-of select="concat(gmd:type/gmd:MD_KeywordTypeCode/@codeListValue, ' ')"/></xsl:if>Keywords:</h5>
				
					<!-- Do unique sort method below instead to remove duplicates... <xsl:for-each 
						select="gmd:keyword"> <xsl:sort select="."/> <b>Keyword: </b><xsl:value-of 
						select="."/><br/> </xsl:for-each> -->
					<div>
					<xsl:for-each
						select="gmd:keyword[ count( . | key( 'values_by_id', translate( normalize-space( gco:CharacterString ), ',', '' ) )[ 1 ]) = 1 ]">
						

						<xsl:sort select="gco:CharacterString" />
						<xsl:if test="gco:CharacterString != '&gt;'">
							<xsl:variable name="keyword">
								<xsl:call-template name="replace-string">
									<xsl:with-param name="element" select="gco:CharacterString" />
									<xsl:with-param name="old-string">
										&gt;
									</xsl:with-param>
									<xsl:with-param name="new-string">
										<xsl:value-of select="$separator" />
									</xsl:with-param>
								</xsl:call-template>
							</xsl:variable>
							<div>
							<xsl:value-of select="$keyword"
								disable-output-escaping="yes" />
							</div>
						</xsl:if>
					</xsl:for-each>
					</div>
					
					<xsl:if test="string-length( gmd:thesaurusName )">
						<h5>Thesaurus:</h5>
						<div class="thesaurusCitation">
							<xsl:for-each select="gmd:thesaurusName/gmd:CI_Citation">
								<xsl:call-template name="CI_Citation">
									<xsl:with-param name="level" select="6" />
								</xsl:call-template>
							</xsl:for-each>
						</div>
					</xsl:if>

				</div>
					
			</xsl:for-each>
	</xsl:template>

	<xsl:template match="gmd:taxonomy">
			<xsl:for-each select="gmd:MD_TaxonSys">
				<h4>Taxonomic System:</h4>
				<div>
					<xsl:for-each select="gmd:classSys">
						<xsl:call-template name="CI_Citation">
							<xsl:with-param name="level" select="5" />
						</xsl:call-template>
					</xsl:for-each>
					
					<xsl:for-each select="gmd:idref">
						<xsl:for-each select="gmd:RS_Identifier">
							<h5>Identification Reference:</h5>
							<div>
							<xsl:for-each select="gmd:authority">
									<xsl:call-template name="CI_Citation">
							<xsl:with-param name="level" select="6" />
									</xsl:call-template>
							</xsl:for-each>
							</div>
						</xsl:for-each>
					</xsl:for-each>
					
					<xsl:for-each select="gmd:obs">
						<h5>Observer:</h5>
						<div>
							<xsl:call-template name="CI_ResponsibleParty">
								<xsl:with-param name="level" select="4" />
							</xsl:call-template>
						</div>
					</xsl:for-each>
					
					<xsl:for-each select="gmd:taxonpro">
						<h5>Taxonomic Procedures:</h5>
						<div>
							<xsl:value-of select="." />
						</div>
					</xsl:for-each>
					<xsl:for-each select="gmd:taxoncom">
						<h5>Taxonomic Completeness:</h5>
						<div>
							<xsl:value-of select="." />
						</div>
					</xsl:for-each>
					<xsl:for-each select="gmd:taxonCl">
						<h5>Taxonomic Classification:</h5>
						<div>
						<xsl:apply-templates select="./gmd:MD_TaxonCl" />
						</div>
					</xsl:for-each>
					</div>
			</xsl:for-each>
	</xsl:template>

	<xsl:template match="gmd:aggregationInfo">
		<xsl:for-each select="gmd:MD_AggregateInformation/gmd:aggregateDataSetName">
			<h4>Aggregate Dataset Name:</h4>
			<div>
				<xsl:for-each select="gmd:CI_Citation">
				<xsl:call-template name="CI_Citation">
						<xsl:with-param name="level" select="4" />
				</xsl:call-template>
				</xsl:for-each>
			</div>

		</xsl:for-each>
		<xsl:for-each
			select="gmd:MD_AggregateInformation/gmd:aggregateDataSetIdentifier">
			<h4>Aggregate Dataset Identifier:</h4>
			<div>
					<xsl:if test="gmd:MD_Identifier/gmd:code">
						<h5>Code:</h5>
						<div>
						<xsl:value-of select="gmd:MD_Identifier/gmd:code" />
						</div>
					</xsl:if>
					<xsl:if test="gmd:MD_Identifier/gmd:authority">
						<h5>Authority:</h5>
						<div>
						<xsl:value-of
							select="gmd:MD_Identifier/gmd:authority/gmd:CI_Citation/gmd:title" />
						</div>
					</xsl:if>
			</div>
		</xsl:for-each>
		<xsl:for-each select="gmd:MD_AggregateInformation/gmd:associationType">
			<h4 title="DS_AssociationTypeCode">Association Type:</h4>
			<div>
			<xsl:value-of select="gmd:DS_AssociationTypeCode" />
			</div>
		</xsl:for-each>
		<xsl:for-each select="gmd:MD_AggregateInformation/gmd:initiativeType">
			<h4 title="DS_InitiativeTypeCode">Initiative Type:</h4>
			<div>
				<xsl:value-of select="gmd:DS_InitiativeTypeCode" />
			</div>
		</xsl:for-each>
	</xsl:template>

	<xsl:template match="gmd:resourceConstraints">
		<xsl:for-each select="gmd:MD_LegalConstraints">
			<h4>Legal Constraints:</h4>
			<div>
				<xsl:for-each select="gmd:accessConstraints">
					<h5 title="MD_RestrictionCode">Access Constraints: </h5>
					<div>
						<xsl:value-of select="." />
					</div>
				</xsl:for-each>
				<xsl:for-each select="gmd:useConstraints">
					<h5 title="MD_RestrictionCode">Use Constraints: </h5>
					<div>
						<xsl:value-of select="." />
					</div>
					
				</xsl:for-each>
				<xsl:for-each select="gmd:otherConstraints">
					<h5>Other Constraints:</h5>
					<div>
					<xsl:value-of select="." />
					</div>

				</xsl:for-each>
				<xsl:for-each select="gmd:useLimitation">
					<h5>Use Limitation:</h5>
					<div>						
					<xsl:value-of select="." />
					</div>
				</xsl:for-each>
			</div>
		</xsl:for-each>
	</xsl:template>
	

	<xsl:template match="gmd:extent">
			<xsl:for-each select="gmd:EX_Extent">
				<h4></h4>
				<div>
					<xsl:for-each select="gmd:geographicElement">
						<h5 title="geographicElement (West, South, East, North)">Bounding Coordinates:</h5>
						<div>
								<xsl:comment>
									Add Map here:
								</xsl:comment>
								<div class="metadataMap"></div>
								<xsl:comment>
									Area to display current cursor lat/lon location:
								</xsl:comment>
								
								<div id="message" class="SmallTextGray">&#160;</div>

								<div class="bounds">
									<div>
									<xsl:call-template name="strip-digits">
									<xsl:with-param name="element"
										select="gmd:EX_GeographicBoundingBox/gmd:westBoundLongitude/gco:Decimal" />
									<xsl:with-param name="num-digits" select="5" />
								</xsl:call-template>
								&#176; 
									</div>
								<div>
								<xsl:call-template name="strip-digits">
									<xsl:with-param name="element"
										select="gmd:EX_GeographicBoundingBox/gmd:southBoundLatitude/gco:Decimal" />
									<xsl:with-param name="num-digits" select="5" />
								</xsl:call-template>
								&#176; 
								</div>
								<div>
								<xsl:call-template name="strip-digits">
									<xsl:with-param name="element"
										select="gmd:EX_GeographicBoundingBox/gmd:eastBoundLongitude/gco:Decimal" />
									<xsl:with-param name="num-digits" select="5" />
								</xsl:call-template>
								&#176; 
								</div>
								<div>
								<xsl:call-template name="strip-digits">
									<xsl:with-param name="element"
										select="gmd:EX_GeographicBoundingBox/gmd:northBoundLatitude/gco:Decimal" />
									<xsl:with-param name="num-digits" select="5" />
								</xsl:call-template>
								&#176; 
								</div>
								</div>
							</div>
							</xsl:for-each>


					<xsl:for-each select="gmd:temporalElement">
						<h5 title="temporalElement">Time Period:</h5>
						<div>

							 <xsl:for-each select="../gml:description">
									<h6>Description:</h6>
									<div>
									<xsl:value-of select="." />
									</div>

							</xsl:for-each>
								 
							
							<xsl:for-each select="gmd:EX_TemporalExtent/gmd:extent">
								
								<xsl:for-each select="gml:TimePeriod/gml:beginPosition">
									<h6>Begin Position: </h6>
									<div>
									<xsl:call-template name="date"/>

									</div>
								</xsl:for-each>
								<xsl:for-each select="gml:endPosition">
									<h6>End Position: </h6>
									<div>
									<xsl:call-template name="date" />

									</div>
								</xsl:for-each>
							</xsl:for-each>
							</div> 
					</xsl:for-each>
					
					<xsl:for-each select="gmd:verticalElement">
						<xsl:if
							test="gmd:EX_VerticalExtent/gmd:minimumValue != 0 or gmd:EX_VerticalExtent/gmd:maximumValue != 0">
							<h5>Vertical Element:</h5>
							<div>
								<h6>Minimum Value:</h6>
								<div>
								<xsl:call-template name="strip-digits">
									<xsl:with-param name="element"
										select="gmd:EX_VerticalExtent/gmd:minimumValue" />
									<xsl:with-param name="num-digits" select="5" />
								</xsl:call-template>
								</div>
								<h6>Maximum Value:</h6>
								<div>
								<xsl:call-template name="strip-digits">
									<xsl:with-param name="element"
										select="gmd:EX_VerticalExtent/gmd:maximumValue" />
									<xsl:with-param name="num-digits" select="5" />
								</xsl:call-template>
								</div>
								
								<xsl:choose>
									<xsl:when
										test="string-length( gmd:EX_VerticalExtent/gmd:verticalCRS )">
										<h6>Coordinate Reference System (CRS):</h6>
										<div>
										<xsl:value-of select="gmd:EX_VerticalExtent/gmd:verticalCRS" />
										</div>
									</xsl:when>
									<xsl:otherwise>
										<h6>Coordinate Reference System (CRS):</h6>
										<xsl:value-of
											select="gmd:EX_VerticalExtent/gmd:verticalCRS/@gco:nilReason" />
										<br />
									</xsl:otherwise>
								</xsl:choose>
								</div>
						</xsl:if>
					</xsl:for-each>
				</div>
			</xsl:for-each>
	</xsl:template>

	<xsl:template match="gmd:supplementalInformation">
			<xsl:value-of select="." />
	</xsl:template>
	
	
	<xsl:template match="gmd:identificationInfo/srv:SV_ServiceIdentification">
		<h4>Service Identification:</h4>
		<div>
			<h5>Identifier:</h5>
			<div><xsl:value-of select="@id" /></div>
			<h5>Service Type:</h5>
			<div>
			<xsl:value-of select="srv:serviceType" />
			</div>

			<xsl:for-each select="srv:containsOperations/srv:SV_OperationMetadata">
			<h5 title="srv_operationName">Contains Operation:</h5>
			<div>
			<xsl:value-of select="srv:operationName/srv:connectPoint/gmd:CI_OnlineResource" />
				<div>
						<xsl:call-template name="CI_OnlineResource">
							<xsl:with-param name="level" select="5"/>
						</xsl:call-template>
				</div>
			</div>
			</xsl:for-each>
		</div>
	</xsl:template>
	</xsl:stylesheet>