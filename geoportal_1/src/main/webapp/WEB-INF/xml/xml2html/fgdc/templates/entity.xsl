<?xml version="1.0" encoding="utf-8"?>
<xsl:stylesheet
  xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
  version="2.0">
 
 	<xsl:import href="../../utils/replace-newlines.xsl" />
	<xsl:import href="common.xsl" />

  <!-- ENTITY_AND_ATTRIBUTE_INFORMATION: ************************************-->

  <xsl:template match="eainfo">

    <xsl:apply-templates select="detailed"/>
    <xsl:apply-templates select="overview"/>
  </xsl:template>

  <xsl:template match="detailed">
    <h4>Detailed Description:</h4>
    <xsl:for-each select="enttyp">
      <p><b><i>Entity Type:</i></b></p>
      <blockquote>
        <xsl:for-each select="enttypl">
          <p><b>Entity Type Label: </b><xsl:value-of select="." /></p>
        </xsl:for-each>
        <xsl:for-each select="enttypd">
          <p><b>Entity Type Definition:</b></p>
          <p>   
            <xsl:call-template name="replace-newlines">
              <xsl:with-param name="element" select="."/>
            </xsl:call-template>
          </p>
        </xsl:for-each>
        <xsl:for-each select="enttypds">
          <p><b>Entity Type Definition Source:</b></p>
          <p>
            <xsl:call-template name="replace-newlines">
              <xsl:with-param name="element" select="."/>
            </xsl:call-template>
          </p>
        </xsl:for-each>
      </blockquote>
    </xsl:for-each>
    <xsl:if test="string-length( attr )">
      <p><b><i>Attributes:</i></b></p>
      <ul>
        <xsl:for-each select="attr">
          <xsl:sort select="attrlabl"/>
          <li><xsl:text disable-output-escaping="yes">&lt;a href="#attr</xsl:text><xsl:value-of select="attrlabl"/><xsl:text disable-output-escaping="yes">"/&gt;</xsl:text><xsl:value-of select="attrlabl"/><xsl:text disable-output-escaping="yes">&lt;/a&gt;</xsl:text></li>
        </xsl:for-each>
      </ul>
    </xsl:if>
    <xsl:apply-templates select="attr"/>
  </xsl:template>

  <!-- Attribute (recursive): -->

  <xsl:template match="attr">
    <xsl:text disable-output-escaping="yes">&lt;a name="attr</xsl:text><xsl:value-of select="attrlabl"/><xsl:text disable-output-escaping="yes">"/&gt;</xsl:text><p><b><i>Attribute:</i></b></p><xsl:text disable-output-escaping="yes">&lt;/a&gt;</xsl:text>
    <blockquote>
      <xsl:for-each select="attrlabl">
        <p><b>Attribute Label: </b><xsl:value-of select="." /></p>
      </xsl:for-each>
      <xsl:for-each select="attrdef">
        <p><b>Attribute Definition:</b></p>
        <p>
          <xsl:call-template name="replace-newlines">
            <xsl:with-param name="element" select="."/>
          </xsl:call-template>
        </p>
      </xsl:for-each>
      <xsl:for-each select="attrdefs">
        <p><b>Attribute Definition Source:</b></p>
        <p>
          <xsl:call-template name="replace-newlines">
            <xsl:with-param name="element" select="."/>
          </xsl:call-template>
        </p>
      </xsl:for-each>
      <xsl:for-each select="attrdomv">
        <p><b>Attribute Domain Values:</b></p>
        <blockquote>
          <xsl:for-each select="edom">
            <p><b>Enumerated Domain:</b></p>
            <blockquote>
              <xsl:for-each select="edomv">
                <p><b>Enumerated Domain Value: </b><xsl:value-of select="." /></p>
              </xsl:for-each>
              <xsl:for-each select="edomvd">
                <p><b>Enumerated Domain Value Definition:</b></p>
                <p>
                  <xsl:call-template name="replace-newlines">
                    <xsl:with-param name="element" select="."/>
                  </xsl:call-template>
                </p>
              </xsl:for-each>
              <xsl:for-each select="edomvds">
                <p><b>Enumerated Domain Value Definition Source:</b></p>
                <p>
                  <xsl:call-template name="replace-newlines">
                    <xsl:with-param name="element" select="."/>
                  </xsl:call-template>
                </p>
              </xsl:for-each>
              <xsl:apply-templates select="attr"/>
            </blockquote>
          </xsl:for-each>
          <xsl:for-each select="rdom">
            <p><b>Range Domain:</b></p>
            <blockquote>
              <xsl:for-each select="rdommin">
                <p><b>Range Domain Minimum: </b><xsl:value-of select="." /></p>
              </xsl:for-each>
              <xsl:for-each select="rdommax">
                <p><b>Range Domain Maximum: </b><xsl:value-of select="." /></p>
              </xsl:for-each>
              <xsl:for-each select="attrunit">
                <p><b>Attribute Units of Measure: </b><xsl:value-of select="." /></p>
              </xsl:for-each>
              <xsl:for-each select="attrmres">
                <p><b>Attribute Measurement Resolution: </b><xsl:value-of select="." /></p>
              </xsl:for-each>
              <xsl:apply-templates select="attr"/>
            </blockquote>
          </xsl:for-each>
          <xsl:for-each select="codesetd">
            <p><b>Codeset Domain:</b></p>
            <blockquote>
              <xsl:for-each select="codesetn">
                <p><b>Codeset Name: </b><xsl:value-of select="." /></p>
              </xsl:for-each>
              <xsl:for-each select="codesets">
                <p><b>Codeset Source: </b><xsl:value-of select="." /></p>
              </xsl:for-each>
            </blockquote>
          </xsl:for-each>
          <xsl:for-each select="udom">
            <p><b>Unrepresentable Domain:</b></p>
            <p>
              <xsl:call-template name="replace-newlines">
                <xsl:with-param name="element" select="."/>
              </xsl:call-template>
            </p>
          </xsl:for-each>
        </blockquote>
      </xsl:for-each>
      <xsl:for-each select="begdatea">
        <p>
          <b>Beginning Date of Attribute Values: </b>
          <xsl:call-template name="date">
            <xsl:with-param name="element" select="."/>
          </xsl:call-template>
        </p>
      </xsl:for-each>
      <xsl:for-each select="enddatea">
        <p><b>Ending Date of Attribute Values: </b>
          <xsl:call-template name="date">
            <xsl:with-param name="element" select="."/>
          </xsl:call-template>
        </p>
      </xsl:for-each>
      <xsl:for-each select="attrvai">
        <p><b>Attribute Value Accuracy Information:</b></p>
        <blockquote>
          <xsl:for-each select="attrva">
            <p><b>Attribute Value Accuracy: </b><xsl:value-of select="." /></p>
          </xsl:for-each>
          <xsl:for-each select="attrvae">
            <p><b>Attribute Value Accuracy Explanation:</b></p>
            <p>
              <xsl:call-template name="replace-newlines">
                <xsl:with-param name="element" select="."/>
              </xsl:call-template>
            </p>
          </xsl:for-each>
        </blockquote>
      </xsl:for-each>
      <xsl:for-each select="attrmfrq">
        <p><b>Attribute Measurement Frequency:</b></p>
        <p>
          <xsl:call-template name="replace-newlines">
            <xsl:with-param name="element" select="."/>
          </xsl:call-template>
        </p>
      </xsl:for-each>
    </blockquote>
  </xsl:template>

  <xsl:template match="overview">
    <h4>Overview Description:</h4>
    <xsl:for-each select="eaover">
      <p><b><i>Entity and Attribute Overview:</i></b></p>
      <p>
        <xsl:call-template name="replace-newlines">
          <xsl:with-param name="element" select="procdesc"/>
        </xsl:call-template>
      </p>
    </xsl:for-each>
    <xsl:for-each select="eadetcit">
      <p><b><i>Entity and Attribute Detail Citation:</i></b></p>
      <p>
        <xsl:call-template name="replace-newlines">
          <xsl:with-param name="element" select="procdesc"/>
        </xsl:call-template>
      </p>
    </xsl:for-each>
  </xsl:template>
  </xsl:stylesheet>