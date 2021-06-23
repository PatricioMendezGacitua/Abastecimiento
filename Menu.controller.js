sap.ui.define([
	"com/gasco/Inbound/controller/BaseController"
], function (BaseController) {
	"use strict";

	return BaseController.extend("com.gasco.Inbound.controller.Menu", {

	
		onInit: function () {
			this.getOwnerComponent().getRouter().getRoute("Menu").attachMatched(this._onRouteMatched, this);
		},

		_onRouteMatched: function () {

			this._oStorage = jQuery.sap.storage(jQuery.sap.storage.Type.local);
			if (this._oStorage.get("logeoIngresoMerecaderia") === null) {
				this.onBackMain();
			} else {
				this.iniciarApp();
			}

		},

		iniciarApp: function () {

			this.getView().byId("recepacionesId").setVisible(true);
			this.getView().byId("inboundId").setVisible(true);
			this._route = this.getOwnerComponent().getRouter();

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
		},

		onBackMain: function () {
			this._route.navTo("cargando");
		},

		navToRecepcions: function () {
			this._oStorage.put("navegacion_inbound", "si");
			this._route.navTo("Recepciones_Master");
		},

		navToInbound: function () {
			this._oStorage.put("navegacion_inbound", "si");
			this._route.navTo("Inbound");
		}


	});

});