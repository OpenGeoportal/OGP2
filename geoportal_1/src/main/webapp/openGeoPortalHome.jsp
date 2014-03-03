<%@ page language="java" contentType="text/html; charset=UTF-8"
    pageEncoding="UTF-8"%>
    <%@ taglib uri="http://java.sun.com/jsp/jstl/core" prefix="c" %>
    <!-- just so we don't break links that refer to an older version -->
		<!-- add passed parameters to the redirect -->
	<c:redirect url="/" >
		<c:forEach items="${param}" var="par">
 			<c:param name="${par.key}" value="${par.value}"></c:param>
 		</c:forEach>
 	</c:redirect>



    