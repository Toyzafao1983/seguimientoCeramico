/* global moment:true */
sap.ui.define([
], function () {
	"use strict";
	return {
		idProyecto: "com.aris.seguimiento.ceramico.pe",
		PaginaHome: "View",
		IdApp: "Peticion_Oferta",
		modelOdata: "modelOdata",
		root: "/",
		userApi: "API-USER-IAS",
		services: {
			//////////////////////////////////////////////////////////////////////
			//////////////////////////////////////////////////////////////////////
			RegistrarAuditoriaSap:"/Service/RegistrarAuditoriaSap/",
			getoDataEstandar:"/General/Estandar/ConsultarEstandarSimple/",
			postoDataEstandar:"/General/Estandar/InsertarEstandarSimple/"
		}
	};
});