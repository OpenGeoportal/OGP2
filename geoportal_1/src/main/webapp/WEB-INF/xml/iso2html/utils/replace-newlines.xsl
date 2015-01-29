<?xml version="1.0" encoding="utf-8"?>

<!--

replace-newlines.xsl

Author: John Maurer (jmaurer@hawaii.edu)
Date: June 2007 (when I was at National Snow and Ice Data Center)

This Extensible Stylesheet Language for Transformations (XSLT) document takes
an input string and outputs it with all newline characters substituted with
HTML <br/> elements. This helps maintain paragraph and text structures when
using them to output to an HTML document. You can import this XSLT in other 
XSLT files to call the "replace-newlines" template for accomplishing this. 
Here is an example import statement:

<xsl:import href="replace-newlines.xsl"/>

For more information on XSLT see:

http://en.wikipedia.org/wiki/XSLT
http://www.w3.org/TR/xslt

-->

<xsl:stylesheet
  xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
  version="2.0">

  <xsl:output method="text"/>

  <!-- Define a variable for creating a newline: -->

  <xsl:variable name="newline">
	<xsl:text>
	</xsl:text>
  </xsl:variable>

  <!-- Define a variable for creating an HTML <br/> element: -->

  <xsl:variable name="break">
    <xsl:text disable-output-escaping="yes">&lt;br/&gt;</xsl:text>
  </xsl:variable>

  <!-- Template to replace newlines with <br/>'s; note the use
       of "disable-output-escaping" to presever the <br/> in an
       output HTML document without it being converted to
       &lt;br/&gt;, which ends up displaying the characters "<br/>"
       in the output rather than an actual HTML element: -->

  <xsl:template name="replace-newlines">
    <xsl:param name="element"/>
    <xsl:variable name="first">
      <xsl:choose>
        <xsl:when test="contains( $element, $newline )">
          <xsl:value-of select="substring-before( $element, $newline )"/>
        </xsl:when>
        <xsl:otherwise>
          <xsl:value-of select="$element"/>
        </xsl:otherwise>
      </xsl:choose>
    </xsl:variable>
    <xsl:variable name="middle">
      <xsl:choose>
        <xsl:when test="contains( $element, $newline )">
          <xsl:value-of select="$break"/>
        </xsl:when>
        <xsl:otherwise>
          <xsl:text></xsl:text>
        </xsl:otherwise>
      </xsl:choose>
    </xsl:variable>
    <xsl:variable name="last">
      <xsl:choose>
        <xsl:when test="contains( $element, $newline )">
          <xsl:choose>
            <xsl:when test="contains( substring-after( $element, $newline ), $newline )">
              <xsl:call-template name="replace-newlines">
                <xsl:with-param name="element">
                  <xsl:value-of select="substring-after( $element, $newline )"/>
                </xsl:with-param>
              </xsl:call-template>
            </xsl:when>
            <xsl:otherwise>
              <xsl:value-of select="substring-after( $element, $newline )"/>
            </xsl:otherwise>
          </xsl:choose>
        </xsl:when>
        <xsl:otherwise>
          <xsl:text></xsl:text>
        </xsl:otherwise>
      </xsl:choose>
    </xsl:variable>
    <xsl:value-of select="$first" disable-output-escaping="yes"/>
    <xsl:value-of select="$middle" disable-output-escaping="yes"/>
    <xsl:value-of select="$last" disable-output-escaping="yes"/>
  </xsl:template>

</xsl:stylesheet>
