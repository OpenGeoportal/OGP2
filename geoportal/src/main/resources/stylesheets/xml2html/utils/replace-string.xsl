<?xml version="1.0" encoding="utf-8"?>

<!--

replace-string.xsl

Author: John Maurer (jmaurer@hawaii.edu)
Date: July 2007 (when I was at National Snow and Ice Data Center)

This Extensible Stylesheet Language for Transformations (XSLT) document takes
an input string and outputs it with all $old-string's substituted with the 
specified $new-string. You can import this XSLT in other XSLT files to call 
the "replace-string" template for accomplishing this. Here is an example 
import statement:

<xsl:import href="replace-string.xsl"/>

For more information on XSLT see:

http://en.wikipedia.org/wiki/XSLT
http://www.w3.org/TR/xslt

-->

<xsl:stylesheet
        xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
        version="2.0">

    <xsl:output method="text"/>

    <xsl:template name="replace-string">
        <xsl:param name="element"/>
        <xsl:param name="old-string"/>
        <xsl:param name="new-string"/>
        <xsl:variable name="first">
            <xsl:choose>
                <xsl:when test="contains( $element, $old-string )">
                    <xsl:value-of select="substring-before( $element, $old-string )"/>
                </xsl:when>
                <xsl:otherwise>
                    <xsl:value-of select="$element"/>
                </xsl:otherwise>
            </xsl:choose>
        </xsl:variable>
        <xsl:variable name="middle">
            <xsl:choose>
                <xsl:when test="contains( $element, $old-string )">
                    <xsl:value-of select="$new-string"/>
                </xsl:when>
                <xsl:otherwise>
                    <xsl:text></xsl:text>
                </xsl:otherwise>
            </xsl:choose>
        </xsl:variable>
        <xsl:variable name="last">
            <xsl:choose>
                <xsl:when test="contains( $element, $old-string )">
                    <xsl:choose>
                        <xsl:when test="contains( substring-after( $element, $old-string ), $old-string )">
                            <xsl:call-template name="replace-string">
                                <xsl:with-param name="element" select="substring-after( $element, $old-string )"/>
                                <xsl:with-param name="old-string" select="$old-string"/>
                                <xsl:with-param name="new-string" select="$new-string"/>
                            </xsl:call-template>
                        </xsl:when>
                        <xsl:otherwise>
                            <xsl:value-of select="substring-after( $element, $old-string )"/>
                        </xsl:otherwise>
                    </xsl:choose>
                </xsl:when>
                <xsl:otherwise>
                    <xsl:text></xsl:text>
                </xsl:otherwise>
            </xsl:choose>
        </xsl:variable>
        <!-- Disable output escaping to allow HTML tags to be interpreted: -->
        <xsl:value-of select="$first" disable-output-escaping="yes"/>
        <xsl:value-of select="$middle" disable-output-escaping="yes"/>
        <xsl:value-of select="$last" disable-output-escaping="yes"/>
    </xsl:template>

</xsl:stylesheet>
