sap.ui.define([
	"com/gasco/Inbound/controller/BaseController",
	"sap/m/MessageToast",
	"sap/ui/model/json/JSONModel"
], function (BaseController, MessageToast, JSONModel) {
	"use strict";

	return BaseController.extend("com.gasco.Inbound.controller.Menu", {

		onInit: function () {
			this.getOwnerComponent().getRouter().getRoute("Menu").attachMatched(this._onRouteMatched, this);
		},
		_onRouteMatched: function () {
			this.onLineOffLine(this.getView());
			this.consultaUser();
			this._oStorage = jQuery.sap.storage(jQuery.sap.storage.Type.local);
			this._route = this.getOwnerComponent().getRouter();

			if (this._oStorage.get("logeoIngresoMerecaderia") === null) {
				this.onBackMain();
			} else {
				this.iniciarApp();
			}
		},
		iniciarApp: function () {
			var recepaciones = this.getView().byId("recepacionesId");
			var inbound = this.getView().byId("inboundId");
			if (recepaciones !== undefined) {
				recepaciones.setVisible(false);
			}

			if (inbound !== undefined) {
				inbound.setVisible(false);
			}

			var messagePage = this.getView().byId("messagePageErrorUser");
			var gridPage = this.getView().byId("gridMenuId");

			gridPage.setVisible(true);
			messagePage.setVisible(false);

			var datos_user_IngresoMercaderia = this._oStorage.get("datos_user_IngresoMercaderia");

			if (datos_user_IngresoMercaderia.ES_SUPERVISOR) {
				recepaciones.setVisible(true);
			}

			if (datos_user_IngresoMercaderia.ES_BODEGUERO) {
				inbound.setVisible(true);
			}

			if (!datos_user_IngresoMercaderia.ES_SUPERVISOR && !datos_user_IngresoMercaderia.ES_BODEGUERO) {
				gridPage.setVisible(false);
				messagePage.setVisible(true);
			}

			this.getView().byId("recepacionesId").addEventDelegate({
				ontap: function () {
					this.navToRecepcions();
				}.bind(this)
			});
			this.getView().byId("inboundId").addEventDelegate({
				ontap: function () {
					this.navToInbound();
				}.bind(this)
			});
			
			this.getView().byId("outboundId").addEventDelegate({
				ontap: function () {
					this.navToMenuOutbound();
				}.bind(this)
			});
			
			
			
			
			
		},
		onBackMain: function () {
			this._route.navTo("cargando");
		},

		navToRecepcions: function () {
			this._oStorage.put("navegacion_IngresoMercaderia", "si");
			this._route.navTo("Recepciones_Master", {
				estadoIngreso: "1"
			});
		},
		navToInbound: function () {
			this._oStorage.put("navegacion_IngresoMercaderia", "si");
			this._route.navTo("ingresos");
		},
		
		navToMenuOutbound: function () {
			this._oStorage.put("navegacion_IngresoMercaderia", "si");
			this._route.navTo("outbound");
		}

	});

});