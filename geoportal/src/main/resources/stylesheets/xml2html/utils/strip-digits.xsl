<?xml version="1.0" encoding="utf-8"?>


<!--

strip-digits.xsl

Author: John Maurer (jmaurer@hawaii.edu)
Date: November 18, 2011 

This Extensible Stylesheet Language for Transformations (XSLT) document takes
a number and outputs it with up to the specified number of digits following the
decimal point. If there are fewer than the specified number of digits, all will
be returned and no extra. If there are no decimal places, the supplied integer
will be returned unchanged. Looks for exponent segment in number string
(e.g. 1.0045E-4) and maintains that if present.

You can import this XSLT in other XSLT files to call the "strip-digits" template
for accomplishing this. Here is an example import statement:

<xsl:import href="strip-digits.xsl"/>

For more information on XSLT see:

http://en.wikipedia.org/wiki/XSLT
http://www.w3.org/TR/xslt

-->

<xsl:stylesheet
        xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
        version="2.0">

    <xsl:template name="strip-digits">
        <xsl:param name="element"/>
        <xsl:param name="num-digits"/>
        <xsl:choose>
            <xsl:when test="contains( $element, '.' )">
                <xsl:variable name="element-uc" select="translate( $element, 'e', 'E' )"/>
                <xsl:choose>
                    <xsl:when test="contains( $element-uc, 'E' )">
                        <xsl:variable name="before-exponent" select="substring-before( $element-uc, 'E' )"/>
                        <xsl:variable name="exponent" select="substring-after( $element-uc, 'E' )"/>
                        <xsl:variable name="before-decimal" select="substring-before( $before-exponent, '.' )"/>
                        <xsl:variable name="after-decimal" select="substring-after( $before-exponent, '.' )"/>
                        <xsl:variable name="after-decimal-stripped"
                                      select="substring( $after-decimal, 1, $num-digits )"/>
                        <xsl:value-of select="concat( $before-decimal, '.', $after-decimal-stripped, 'E', $exponent )"/>
                    </xsl:when>
                    <xsl:otherwise>
                        <xsl:variable name="before-decimal" select="substring-before( $element, '.' )"/>
                        <xsl:variable name="after-decimal" select="substring-after( $element, '.' )"/>
                        <xsl:variable name="after-decimal-stripped"
                                      select="substring( $after-decimal, 1, $num-digits )"/>
                        <xsl:value-of select="concat( $before-decimal, '.', $after-decimal-stripped )"/>
                    </xsl:otherwise>
                </xsl:choose>
            </xsl:when>
            <xsl:otherwise>
                <xsl:value-of select="$element"/>
            </xsl:otherwise>
        </xsl:choose>
    </xsl:template>

</xsl:stylesheet>
