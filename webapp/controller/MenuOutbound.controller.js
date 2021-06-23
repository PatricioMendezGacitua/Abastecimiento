sap.ui.define([
	"com/gasco/Inbound/controller/BaseController",
	"sap/m/MessageToast",
	"sap/ui/model/json/JSONModel"
], function (BaseController, MessageToast, JSONModel) {
	"use strict";

	return BaseController.extend("com.gasco.Inbound.controller.MenuOutbound", {

		onInit: function () {
			this.getOwnerComponent().getRouter().getRoute("outbound").attachMatched(this._onRouteMatched, this);
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
			/*var recepaciones = this.getView().byId("recepacionesId");
			var inbound = this.getView().byId("inboundId");
			if (recepaciones !== undefined) {
				recepaciones.setVisible(false);
			}

			if (inbound !== undefined) {
				inbound.setVisible(false);
			}*/

			var messagePage = this.getView().byId("messagePageErrorUser");
			var gridPage = this.getView().byId("gridMenuOutboundId");

			gridPage.setVisible(true);
			messagePage.setVisible(false);

			//var datos_user_IngresoMercaderia = this._oStorage.get("datos_user_IngresoMercaderia");

			/*	if (datos_user_IngresoMercaderia.ES_SUPERVISOR) {
					recepaciones.setVisible(true);
				}

				if (datos_user_IngresoMercaderia.ES_BODEGUERO) {
					inbound.setVisible(true);
				}

				if (!datos_user_IngresoMercaderia.ES_SUPERVISOR && !datos_user_IngresoMercaderia.ES_BODEGUERO) {
					gridPage.setVisible(false);
					messagePage.setVisible(true);
				}*/

			this.getView().byId("traspasosId").addEventDelegate({
				ontap: function () {
					this.navToTraspaso();
				}.bind(this)
			});

			this.getView().byId("trasladosId").addEventDelegate({
				ontap: function () {
					this.navToTraslado();
				}.bind(this)
			});

			this.getView().byId("reservaId").addEventDelegate({
				ontap: function () {
					this.navToReserva();
				}.bind(this)
			});
			
			this.getView().byId("entregaId").addEventDelegate({
				ontap: function () {
					this.navToEntrega();
				}.bind(this)
			});

			this.getView().byId("inventarioId").addEventDelegate({
				ontap: function () {
					this.navToInventario();
				}.bind(this)
			});

		/*	this.getView().byId("outboundId").addEventDelegate({
				ontap: function () {
					this.navToMenuOutbound();
				}.bind(this)
			});*/

		},
		onBackMain: function () {
			this._route.navTo("cargando");
		},

		navToTraspaso: function () {
			this._oStorage.put("navegacion_IngresoMercaderia", "si");
			this._route.navTo("traspaso");
		},

		navToTraslado: function () {
			this._oStorage.put("navegacion_IngresoMercaderia", "si");
			this._route.navTo("traslado");
		},

		navToInventario: function () {
			this._oStorage.put("navegacion_IngresoMercaderia", "si");
			this._route.navTo("inventario");
		},

		navToReserva: function () {
			this._oStorage.put("navegacion_IngresoMercaderia", "si");

			this._route.navTo("reserva_master", {
				estadoReserva: "1"
			});
		},
		
		navToEntrega: function () {
			this._oStorage.put("navegacion_IngresoMercaderia", "si");

			this._route.navTo("Entrega_master", {
				estadoReserva: "1"
			});
		},

	/*	navToMenuOutbound: function () {
			this._oStorage.put("navegacion_IngresoMercaderia", "si");
			this._route.navTo("outbound");
		}
*/
	});

});