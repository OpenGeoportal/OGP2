<!DOCTYPE HTML>
<%@ page language="java" contentType="text/html; charset=UTF-8"
	pageEncoding="UTF-8"%>
<html>
<head>
<script src="//ajax.googleapis.com/ajax/libs/jquery/1.9.1/jquery.min.js"></script>

<script>
	//send a postMessage to the parent.  The controller will inject the login status object and the domain of the parent
	jQuery(document).ready(function() {
		//we have to stringify then parse on the other end, since IE only sends strings
		try{
			var jsonString = '${authStatus}';
			parent.postMessage(jsonString,"${sendingPage}");
		} catch (e) {
			//if there's an error, we should catch it, close the iframe, and notify the user that something is amiss
			alert("blah");
			throw new Error("Problem logging in.  Please contact your system administrator.");
		}
	});

	
</script>
</head>
<body></body>
</html>
